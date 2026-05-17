-- =====================================================================
-- 0010 — ETL: datos legacy Django → tablas nuevas Supabase
-- =====================================================================
-- Migra los datos de las tablas Django (user_user, inspection_*, poll_*,
-- notifications_notification, etc.) a las tablas nuevas creadas en
-- Fase 1. Ambos esquemas coexisten en la misma BD; las tablas legacy
-- NO se borran aquí (eso es cleanup post-cutover).
--
-- Estrategia:
--   1. Schema temporal `etl` con tabla `id_map (legacy_table, legacy_id,
--      new_uuid)` para mapear los bigint legacy a los UUID nuevos.
--   2. Deshabilitar triggers de negocio durante el bulk para evitar
--      avalancha de notificaciones y recálculos redundantes.
--   3. Migrar en orden de dependencia (users → catálogos → inspections
--      → polls → answers → evaluations → notifications → reports).
--   4. Recalcular evaluations al final (una vez por poll).
--   5. Reactivar triggers.
--   6. Validar COUNT(*).
--
-- Idempotente: usar la presencia de filas en etl.id_map como guard.
-- Si esta migración se ejecuta dos veces, la segunda no duplica.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. Setup: schema + tabla mapping
-- ---------------------------------------------------------------------
create schema if not exists etl;

create table if not exists etl.id_map (
    legacy_table text   not null,
    legacy_id    bigint not null,
    new_uuid     uuid   not null,
    primary key (legacy_table, legacy_id)
);

create index if not exists id_map_new_uuid_idx on etl.id_map (new_uuid);


-- ---------------------------------------------------------------------
-- 1. Deshabilitar triggers de negocio durante el ETL
-- ---------------------------------------------------------------------
alter table public.inspections disable trigger inspections_notify_created;
alter table public.polls       disable trigger polls_handle_completion;
alter table public.report_jobs disable trigger report_jobs_notify_ready;
alter table public.answers     disable trigger answers_recalculate_evaluation;
-- on_auth_user_created (trigger en auth.users) lo dejamos activo: ES el
-- mecanismo que pobla profiles automáticamente.


-- =====================================================================
-- 2. ETL: USERS  (user_user → auth.users → trigger crea profiles)
-- =====================================================================
-- Insertamos directo en auth.users porque no podemos usar auth.admin API
-- desde SQL. El trigger on_auth_user_created del schema poblará profiles.
--
-- Passwords:
--   - admin@self.inspection.com → 'admin'    (la conocida, para testing)
--   - todos los demás           → 'Cambiar2026!' (temporal, deben cambiar)
--
-- raw_user_meta_data lleva first_name/last_name/user_type/must_change_password
-- que el trigger lee para poblar profiles.
do $$
declare
    rec record;
    v_uuid uuid;
    v_pwd  text;
    v_role public.user_role;
    v_must_change boolean;
begin
    for rec in select * from public.user_user order by id loop
        -- Saltar si ya está migrado
        if exists (select 1 from etl.id_map where legacy_table='user_user' and legacy_id=rec.id) then
            continue;
        end if;

        -- Saltar si el email ya existe en auth.users (re-ejecución parcial)
        if exists (select 1 from auth.users where lower(email) = lower(rec.email)) then
            -- Anotar mapping y continuar
            insert into etl.id_map (legacy_table, legacy_id, new_uuid)
            select 'user_user', rec.id, u.id
              from auth.users u where lower(u.email) = lower(rec.email);
            continue;
        end if;

        -- Mapeo de rol legacy → enum canónico
        v_role := case trim(rec.user_type)
            when 'Administrador'   then 'administrador'::public.user_role
            when 'Jefe de Obra'    then 'jefe_de_obra'::public.user_role
            when 'Técnico'         then 'tecnico'::public.user_role
            when 'Jefe de Trabajo' then 'jefe_de_trabajo'::public.user_role
            else 'jefe_de_trabajo'::public.user_role  -- fallback seguro
        end;

        -- Password: admin conserva su contraseña conocida; resto temporal
        if lower(rec.email) = 'admin@self.inspection.com' then
            v_pwd := 'admin';
            v_must_change := false;
        else
            v_pwd := 'Cambiar2026!';
            v_must_change := true;
        end if;

        v_uuid := gen_random_uuid();

        -- Insertar en auth.users
        -- Nota: confirmed_at es una generated column en versiones modernas
        -- de Supabase (auto = coalesce(email_confirmed_at, phone_confirmed_at)).
        -- IMPORTANTE: los campos *_token deben ser '' (no NULL); GoTrue
        -- devuelve "Database error querying schema" si encuentra NULL.
        insert into auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            is_sso_user,
            is_anonymous,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change,
            phone_change,
            phone_change_token,
            email_change_token_current,
            reauthentication_token
        )
        values (
            '00000000-0000-0000-0000-000000000000',
            v_uuid,
            'authenticated',
            'authenticated',
            lower(rec.email),
            crypt(v_pwd, gen_salt('bf')),
            coalesce(rec.date_joined, now()),
            jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
            jsonb_build_object(
                'first_name', trim(coalesce(rec.first_name, '')),
                'last_name',  trim(coalesce(rec.last_name, '')),
                'user_type',  v_role::text,
                'must_change_password', v_must_change
            ),
            coalesce(rec.date_joined, now()),
            coalesce(rec.last_login,  now()),
            false,
            false,
            '', '', '', '', '', '', '', ''
        );

        -- Insertar identity para que login email/password funcione
        insert into auth.identities (
            id,
            provider_id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        )
        values (
            gen_random_uuid(),
            v_uuid::text,                                   -- provider_id == user_id para provider='email'
            v_uuid,
            jsonb_build_object(
                'sub',           v_uuid::text,
                'email',         lower(rec.email),
                'email_verified', true,
                'phone_verified', false
            ),
            'email',
            coalesce(rec.last_login, rec.date_joined, now()),
            coalesce(rec.date_joined, now()),
            now()
        );

        -- El trigger on_auth_user_created ya creó el profile. Actualizamos
        -- los campos extra (is_active y date_joined) que el trigger no setea.
        update public.profiles
           set is_active = rec.is_active,
               created_at = coalesce(rec.date_joined, now())
         where id = v_uuid;

        -- Registrar mapping
        insert into etl.id_map (legacy_table, legacy_id, new_uuid)
        values ('user_user', rec.id, v_uuid);
    end loop;
end $$;


-- =====================================================================
-- 3. ETL: INSPECTION TYPES
-- =====================================================================
do $$
declare
    rec record;
    v_uuid uuid;
begin
    for rec in select * from public.inspection_inspectiontype order by id loop
        if exists (select 1 from etl.id_map where legacy_table='inspection_inspectiontype' and legacy_id=rec.id) then
            continue;
        end if;
        v_uuid := gen_random_uuid();
        insert into public.inspection_types (id, name, created_at, updated_at)
        values (v_uuid, rec.name, rec.created_at, rec.updated_at);
        insert into etl.id_map (legacy_table, legacy_id, new_uuid)
        values ('inspection_inspectiontype', rec.id, v_uuid);
    end loop;
end $$;


-- =====================================================================
-- 4. ETL: CLIENTS
-- =====================================================================
do $$
declare
    rec record;
    v_uuid uuid;
begin
    for rec in select * from public.inspection_client order by id loop
        if exists (select 1 from etl.id_map where legacy_table='inspection_client' and legacy_id=rec.id) then
            continue;
        end if;
        v_uuid := gen_random_uuid();
        insert into public.clients (id, client_name, created_at, updated_at)
        values (v_uuid, rec.client_name, rec.created_at, rec.updated_at);
        insert into etl.id_map (legacy_table, legacy_id, new_uuid)
        values ('inspection_client', rec.id, v_uuid);
    end loop;
end $$;


-- =====================================================================
-- 5. ETL: ACTIVITIES (FK → inspection_types)
-- =====================================================================
do $$
declare
    rec record;
    v_uuid uuid;
    v_type_uuid uuid;
begin
    for rec in select * from public.inspection_activity order by id loop
        if exists (select 1 from etl.id_map where legacy_table='inspection_activity' and legacy_id=rec.id) then
            continue;
        end if;
        select new_uuid into v_type_uuid from etl.id_map
         where legacy_table='inspection_inspectiontype' and legacy_id=rec.inspection_type_id;
        if v_type_uuid is null then
            raise exception 'Activity % refers to inspection_type % that is not in id_map', rec.id, rec.inspection_type_id;
        end if;
        v_uuid := gen_random_uuid();
        insert into public.activities (id, activity_text, inspection_type_id, created_at, updated_at)
        values (v_uuid, rec.activity_text, v_type_uuid, rec.created_at, rec.updated_at);
        insert into etl.id_map (legacy_table, legacy_id, new_uuid)
        values ('inspection_activity', rec.id, v_uuid);
    end loop;
end $$;


-- =====================================================================
-- 6. ETL: SUBCONTRATE NAMES
-- =====================================================================
do $$
declare
    rec record;
    v_uuid uuid;
begin
    for rec in select * from public.inspection_subcontratename order by id loop
        if exists (select 1 from etl.id_map where legacy_table='inspection_subcontratename' and legacy_id=rec.id) then
            continue;
        end if;
        v_uuid := gen_random_uuid();
        insert into public.subcontrate_names (id, subcontrate_name, created_at, updated_at)
        values (v_uuid, rec.subcontrate_name, rec.created_at, rec.updated_at);
        insert into etl.id_map (legacy_table, legacy_id, new_uuid)
        values ('inspection_subcontratename', rec.id, v_uuid);
    end loop;
end $$;


-- =====================================================================
-- 7. ETL: HEADERS (FK → inspection_types)
-- =====================================================================
do $$
declare
    rec record;
    v_uuid uuid;
    v_type_uuid uuid;
begin
    for rec in select * from public.poll_header order by id loop
        if exists (select 1 from etl.id_map where legacy_table='poll_header' and legacy_id=rec.id) then
            continue;
        end if;
        select new_uuid into v_type_uuid from etl.id_map
         where legacy_table='inspection_inspectiontype' and legacy_id=rec.inspection_type_id;
        if v_type_uuid is null then
            raise exception 'Header % refers to inspection_type % that is not in id_map', rec.id, rec.inspection_type_id;
        end if;
        v_uuid := gen_random_uuid();
        insert into public.headers (id, header_text, inspection_type_id, created_at, updated_at)
        values (v_uuid, rec.header_text, v_type_uuid, rec.created_at, rec.updated_at);
        insert into etl.id_map (legacy_table, legacy_id, new_uuid)
        values ('poll_header', rec.id, v_uuid);
    end loop;
end $$;


-- =====================================================================
-- 8. ETL: QUESTIONS (FK → headers)
-- =====================================================================
do $$
declare
    rec record;
    v_uuid uuid;
    v_header_uuid uuid;
begin
    for rec in select * from public.poll_question order by id loop
        if exists (select 1 from etl.id_map where legacy_table='poll_question' and legacy_id=rec.id) then
            continue;
        end if;
        select new_uuid into v_header_uuid from etl.id_map
         where legacy_table='poll_header' and legacy_id=rec.header_id;
        if v_header_uuid is null then
            raise exception 'Question % refers to header % that is not in id_map', rec.id, rec.header_id;
        end if;
        v_uuid := gen_random_uuid();
        insert into public.questions (id, question_text, header_id, created_at, updated_at)
        values (v_uuid, rec.question_text, v_header_uuid, rec.created_at, rec.updated_at);
        insert into etl.id_map (legacy_table, legacy_id, new_uuid)
        values ('poll_question', rec.id, v_uuid);
    end loop;
end $$;


-- =====================================================================
-- 9. ETL: OBSERVATIONS
-- =====================================================================
do $$
declare
    rec record;
    v_uuid uuid;
begin
    for rec in select * from public.inspection_observation order by id loop
        if exists (select 1 from etl.id_map where legacy_table='inspection_observation' and legacy_id=rec.id) then
            continue;
        end if;
        v_uuid := gen_random_uuid();
        insert into public.observations (id, observation_text, created_at, updated_at)
        values (v_uuid, rec.observation_text, rec.created_at, rec.updated_at);
        insert into etl.id_map (legacy_table, legacy_id, new_uuid)
        values ('inspection_observation', rec.id, v_uuid);
    end loop;
end $$;


-- =====================================================================
-- 10. ETL: OBSERVATION PHOTOS (FK → observations)
-- =====================================================================
-- IMPORTANTE: photo (varchar con path S3 actual) se preserva como
-- storage_path. Los archivos físicos en S3 deben migrarse a Supabase
-- Storage en un paso aparte (script Node.js fuera de SQL).
do $$
declare
    rec record;
    v_uuid uuid;
    v_obs_uuid uuid;
begin
    for rec in select * from public.inspection_observationphoto order by id loop
        if exists (select 1 from etl.id_map where legacy_table='inspection_observationphoto' and legacy_id=rec.id) then
            continue;
        end if;
        select new_uuid into v_obs_uuid from etl.id_map
         where legacy_table='inspection_observation' and legacy_id=rec.observation_id;
        if v_obs_uuid is null then
            raise exception 'ObservationPhoto % refers to observation % that is not in id_map', rec.id, rec.observation_id;
        end if;
        v_uuid := gen_random_uuid();
        insert into public.observation_photos (id, observation_id, storage_path, created_at)
        values (v_uuid, v_obs_uuid, rec.photo, rec.created_at);
        insert into etl.id_map (legacy_table, legacy_id, new_uuid)
        values ('inspection_observationphoto', rec.id, v_uuid);
    end loop;
end $$;


-- =====================================================================
-- 11. ETL: INSPECTIONS
-- =====================================================================
do $$
declare
    rec record;
    v_uuid uuid;
    v_user_uuid uuid;
    v_client_uuid uuid;
    v_type_uuid uuid;
    v_observation_uuid uuid;
begin
    for rec in select * from public.inspection_inspection order by id loop
        if exists (select 1 from etl.id_map where legacy_table='inspection_inspection' and legacy_id=rec.id) then
            continue;
        end if;

        select new_uuid into v_user_uuid   from etl.id_map where legacy_table='user_user'                  and legacy_id=rec.user_id;
        select new_uuid into v_client_uuid from etl.id_map where legacy_table='inspection_client'          and legacy_id=rec.client_id;
        select new_uuid into v_type_uuid   from etl.id_map where legacy_table='inspection_inspectiontype'  and legacy_id=rec.inspection_type_id;
        select new_uuid into v_observation_uuid from etl.id_map where legacy_table='inspection_observation' and legacy_id=rec.observation_id;

        if v_user_uuid is null or v_client_uuid is null or v_type_uuid is null then
            raise exception 'Inspection % has unresolved FK (user=%/client=%/type=%)',
                rec.id, rec.user_id, rec.client_id, rec.inspection_type_id;
        end if;

        v_uuid := gen_random_uuid();
        insert into public.inspections (
            id, project_code, instalation_name, date_time,
            gps_latitude, gps_longitude,
            user_id, client_id, inspection_type_id, observation_id,
            created_at, updated_at
        )
        values (
            v_uuid, rec.project_code, rec.instalation_name, rec.date_time,
            rec."GPS_latitude", rec."GPS_longitude",
            v_user_uuid, v_client_uuid, v_type_uuid, v_observation_uuid,
            rec.created_at, rec.updated_at
        );
        insert into etl.id_map (legacy_table, legacy_id, new_uuid)
        values ('inspection_inspection', rec.id, v_uuid);
    end loop;
end $$;


-- =====================================================================
-- 12. ETL: M2M inspections ↔ activities
-- =====================================================================
insert into public.inspection_activities (inspection_id, activity_id)
select
    im_i.new_uuid,
    im_a.new_uuid
  from public.inspection_inspection_activity lm
  join etl.id_map im_i on im_i.legacy_table='inspection_inspection' and im_i.legacy_id = lm.inspection_id
  join etl.id_map im_a on im_a.legacy_table='inspection_activity'    and im_a.legacy_id = lm.activity_id
on conflict (inspection_id, activity_id) do nothing;


-- =====================================================================
-- 13. ETL: M2M inspections ↔ subcontracts
-- =====================================================================
insert into public.inspection_subcontracts (inspection_id, subcontrate_name_id)
select
    im_i.new_uuid,
    im_s.new_uuid
  from public.inspection_inspection_subcontrate_name lm
  join etl.id_map im_i on im_i.legacy_table='inspection_inspection'     and im_i.legacy_id = lm.inspection_id
  join etl.id_map im_s on im_s.legacy_table='inspection_subcontratename' and im_s.legacy_id = lm.subcontratename_id
on conflict (inspection_id, subcontrate_name_id) do nothing;


-- =====================================================================
-- 14. ETL: POLLS  (FK → inspections)
-- =====================================================================
do $$
declare
    rec record;
    v_uuid uuid;
    v_inspection_uuid uuid;
begin
    for rec in select * from public.poll_poll order by id loop
        if exists (select 1 from etl.id_map where legacy_table='poll_poll' and legacy_id=rec.id) then
            continue;
        end if;
        select new_uuid into v_inspection_uuid from etl.id_map
         where legacy_table='inspection_inspection' and legacy_id=rec.inspection_id;
        if v_inspection_uuid is null then
            raise exception 'Poll % refers to inspection % that is not in id_map', rec.id, rec.inspection_id;
        end if;
        v_uuid := gen_random_uuid();
        insert into public.polls (id, inspection_id, status, created_at, updated_at)
        values (v_uuid, v_inspection_uuid, rec.status::public.poll_status, rec.created_at, rec.updated_at);
        insert into etl.id_map (legacy_table, legacy_id, new_uuid)
        values ('poll_poll', rec.id, v_uuid);
    end loop;
end $$;


-- =====================================================================
-- 15. ETL: M2M polls ↔ questions
-- =====================================================================
insert into public.poll_questions (poll_id, question_id)
select
    im_p.new_uuid,
    im_q.new_uuid
  from public.poll_poll_question lm
  join etl.id_map im_p on im_p.legacy_table='poll_poll'     and im_p.legacy_id = lm.poll_id
  join etl.id_map im_q on im_q.legacy_table='poll_question' and im_q.legacy_id = lm.question_id
on conflict (poll_id, question_id) do nothing;


-- =====================================================================
-- 16. ETL: ANSWERS  (FKs → polls, questions, observations opt.)
-- =====================================================================
do $$
declare
    rec record;
    v_uuid uuid;
    v_poll_uuid uuid;
    v_question_uuid uuid;
    v_observation_uuid uuid;
begin
    -- Deduplicar: el schema legacy NO tenía UNIQUE(poll_id, question_id), y se
    -- detectaron 34 grupos con respuestas duplicadas (probablemente bug del
    -- backend Django: en lugar de UPDATE el inspector creaba un INSERT extra
    -- al editar). Mantenemos solo la respuesta más reciente (mayor id legacy).
    for rec in
        select distinct on (poll_id, question_id) *
          from public.poll_answer
         order by poll_id, question_id, id desc
    loop
        if exists (select 1 from etl.id_map where legacy_table='poll_answer' and legacy_id=rec.id) then
            continue;
        end if;
        select new_uuid into v_poll_uuid     from etl.id_map where legacy_table='poll_poll'              and legacy_id=rec.poll_id;
        select new_uuid into v_question_uuid from etl.id_map where legacy_table='poll_question'          and legacy_id=rec.question_id;
        select new_uuid into v_observation_uuid from etl.id_map where legacy_table='inspection_observation' and legacy_id=rec.observation_id;

        if v_poll_uuid is null or v_question_uuid is null then
            raise exception 'Answer % has unresolved FK (poll=%/question=%)', rec.id, rec.poll_id, rec.question_id;
        end if;

        v_uuid := gen_random_uuid();
        insert into public.answers (id, poll_id, question_id, answer_text, observation_id, created_at, updated_at)
        values (
            v_uuid, v_poll_uuid, v_question_uuid,
            rec.answer_text::public.answer_choice,
            v_observation_uuid,
            rec.created_at, rec.updated_at
        );
        insert into etl.id_map (legacy_table, legacy_id, new_uuid)
        values ('poll_answer', rec.id, v_uuid);
    end loop;
end $$;


-- =====================================================================
-- 17. ETL: EVALUATIONS  (FKs → inspections, polls)
-- =====================================================================
do $$
declare
    rec record;
    v_uuid uuid;
    v_inspection_uuid uuid;
    v_poll_uuid uuid;
begin
    for rec in select * from public.inspection_evaluation order by id loop
        if exists (select 1 from etl.id_map where legacy_table='inspection_evaluation' and legacy_id=rec.id) then
            continue;
        end if;
        select new_uuid into v_inspection_uuid from etl.id_map where legacy_table='inspection_inspection' and legacy_id=rec.inspection_id;
        select new_uuid into v_poll_uuid       from etl.id_map where legacy_table='poll_poll'             and legacy_id=rec.poll_id;
        if v_inspection_uuid is null or v_poll_uuid is null then
            raise exception 'Evaluation % has unresolved FK', rec.id;
        end if;

        v_uuid := gen_random_uuid();
        insert into public.evaluations (id, inspection_id, poll_id, total_score, max_possible_score, created_at, updated_at)
        values (v_uuid, v_inspection_uuid, v_poll_uuid, rec.total_score, rec.max_possible_score, rec.created_at, rec.updated_at);
        insert into etl.id_map (legacy_table, legacy_id, new_uuid)
        values ('inspection_evaluation', rec.id, v_uuid);
    end loop;
end $$;


-- =====================================================================
-- 18. ETL: NOTIFICATIONS  (FKs → profiles, inspections opt., report_jobs opt.)
-- =====================================================================
-- Hacemos report_jobs ANTES de notifications para resolver el FK opcional.
-- Insertamos en orden: primero report_jobs (etapa 19), después
-- notifications (etapa 20).


-- =====================================================================
-- 19. ETL: REPORT_JOBS  (FKs → inspections, profiles opt.)
-- =====================================================================
do $$
declare
    rec record;
    v_uuid uuid;
    v_inspection_uuid uuid;
    v_requester_uuid uuid;
begin
    for rec in select * from public.inspection_reportjob order by id loop
        if exists (select 1 from etl.id_map where legacy_table='inspection_reportjob' and legacy_id=rec.id) then
            continue;
        end if;
        select new_uuid into v_inspection_uuid from etl.id_map where legacy_table='inspection_inspection' and legacy_id=rec.inspection_id;
        if v_inspection_uuid is null then
            raise exception 'ReportJob % refers to inspection % not in id_map', rec.id, rec.inspection_id;
        end if;
        select new_uuid into v_requester_uuid  from etl.id_map where legacy_table='user_user'             and legacy_id=rec.requested_by_id;

        v_uuid := gen_random_uuid();
        insert into public.report_jobs (
            id, inspection_id, requested_by,
            status, format, locale,
            storage_path, download_url, expires_at, error,
            created_at, updated_at
        )
        values (
            v_uuid, v_inspection_uuid, v_requester_uuid,
            lower(rec.status)::public.report_status,
            lower(rec.format)::public.report_format,
            coalesce(rec.locale, 'es'),
            rec.object_key, rec.download_url, rec.expires_at, rec.error,
            rec.created_at, rec.updated_at
        );
        insert into etl.id_map (legacy_table, legacy_id, new_uuid)
        values ('inspection_reportjob', rec.id, v_uuid);
    end loop;
end $$;


-- =====================================================================
-- 20. ETL: NOTIFICATIONS
-- =====================================================================
-- Mapeo de enum legacy → nuevo:
--   type     → uppercase con guiones bajos en legacy ('INSPECTION_PENDING')
--              → lowercase en nuevo ('inspection_pending')
--   tone     → ya lowercase ('warn', 'ok', 'bad', 'info', 'neutral')
--   category → ya lowercase ('inspections', 'team', 'system', 'critical')
do $$
declare
    rec record;
    v_uuid uuid;
    v_recipient_uuid uuid;
    v_inspection_uuid uuid;
    v_report_uuid uuid;
begin
    for rec in select * from public.notifications_notification order by id loop
        if exists (select 1 from etl.id_map where legacy_table='notifications_notification' and legacy_id=rec.id) then
            continue;
        end if;
        select new_uuid into v_recipient_uuid  from etl.id_map where legacy_table='user_user'             and legacy_id=rec.recipient_id;
        if v_recipient_uuid is null then
            raise exception 'Notification % refers to recipient % not in id_map', rec.id, rec.recipient_id;
        end if;
        select new_uuid into v_inspection_uuid from etl.id_map where legacy_table='inspection_inspection' and legacy_id=rec.inspection_id;
        select new_uuid into v_report_uuid     from etl.id_map where legacy_table='inspection_reportjob'  and legacy_id=rec.report_job_id;

        v_uuid := gen_random_uuid();
        insert into public.notifications (
            id, recipient_id, type, tone, category,
            title, body, action_url, action_label,
            inspection_id, report_job_id,
            is_read, read_at, created_at
        )
        values (
            v_uuid, v_recipient_uuid,
            lower(rec.type)::public.notification_type,
            rec.tone::public.notification_tone,
            rec.category::public.notification_category,
            rec.title, rec.body, rec.action_url, rec.action_label,
            v_inspection_uuid, v_report_uuid,
            rec.is_read, rec.read_at, rec.created_at
        );
        insert into etl.id_map (legacy_table, legacy_id, new_uuid)
        values ('notifications_notification', rec.id, v_uuid);
    end loop;
end $$;


-- =====================================================================
-- 21. Recalcular evaluations (una vez por poll completado)
-- =====================================================================
-- Como deshabilitamos answers_recalculate_evaluation, total_score y
-- max_possible_score se cargaron desde legacy pero las generated columns
-- percentage y rating se calcularon solas. Para garantizar consistencia,
-- forzamos un recálculo de cada evaluation usando los pesos de Postgres
-- (no de Python).
do $$
declare
    v_poll_id uuid;
begin
    for v_poll_id in select poll_id from public.evaluations loop
        perform public.recalculate_evaluation(v_poll_id);
    end loop;
end $$;


-- ---------------------------------------------------------------------
-- 22. Reactivar triggers de negocio
-- ---------------------------------------------------------------------
alter table public.inspections enable trigger inspections_notify_created;
alter table public.polls       enable trigger polls_handle_completion;
alter table public.report_jobs enable trigger report_jobs_notify_ready;
alter table public.answers     enable trigger answers_recalculate_evaluation;


-- =====================================================================
-- 23. VALIDACIÓN: COUNT legacy vs nuevo
-- =====================================================================
-- Emite NOTICE con los counts para inspección manual en el log de push.
do $$
declare
    v_msg text := '';
    pair record;
begin
    for pair in
        select 'user_user'                  as legacy, (select count(*) from public.user_user)                  as legacy_count, 'profiles'             as new_name, (select count(*) from public.profiles)             as new_count
        union all
        select 'inspection_inspectiontype',     (select count(*) from public.inspection_inspectiontype),     'inspection_types',    (select count(*) from public.inspection_types)
        union all
        select 'inspection_client',             (select count(*) from public.inspection_client),             'clients',             (select count(*) from public.clients)
        union all
        select 'inspection_activity',           (select count(*) from public.inspection_activity),           'activities',          (select count(*) from public.activities)
        union all
        select 'inspection_subcontratename',    (select count(*) from public.inspection_subcontratename),    'subcontrate_names',   (select count(*) from public.subcontrate_names)
        union all
        select 'poll_header',                   (select count(*) from public.poll_header),                   'headers',             (select count(*) from public.headers)
        union all
        select 'poll_question',                 (select count(*) from public.poll_question),                 'questions',           (select count(*) from public.questions)
        union all
        select 'inspection_observation',        (select count(*) from public.inspection_observation),        'observations',        (select count(*) from public.observations)
        union all
        select 'inspection_observationphoto',   (select count(*) from public.inspection_observationphoto),   'observation_photos',  (select count(*) from public.observation_photos)
        union all
        select 'inspection_inspection',         (select count(*) from public.inspection_inspection),         'inspections',         (select count(*) from public.inspections)
        union all
        select 'poll_poll',                     (select count(*) from public.poll_poll),                     'polls',               (select count(*) from public.polls)
        union all
        -- answers: el count nuevo es menor porque deduplicamos 34 filas
        --          duplicadas en el legacy (mismo poll_id+question_id)
        select 'poll_answer (deduped)',         (select count(distinct (poll_id, question_id)) from public.poll_answer), 'answers', (select count(*) from public.answers)
        union all
        select 'inspection_evaluation',         (select count(*) from public.inspection_evaluation),         'evaluations',         (select count(*) from public.evaluations)
        union all
        select 'inspection_reportjob',          (select count(*) from public.inspection_reportjob),          'report_jobs',         (select count(*) from public.report_jobs)
        union all
        select 'notifications_notification',    (select count(*) from public.notifications_notification),    'notifications',       (select count(*) from public.notifications)
    loop
        if pair.legacy_count = pair.new_count then
            v_msg := v_msg || format('  [OK]   %-30s %4s == %-20s %4s', pair.legacy, pair.legacy_count, pair.new_name, pair.new_count) || E'\n';
        else
            v_msg := v_msg || format('  [DIFF] %-30s %4s != %-20s %4s', pair.legacy, pair.legacy_count, pair.new_name, pair.new_count) || E'\n';
        end if;
    end loop;
    raise notice E'\nETL validation summary:\n%', v_msg;
end $$;
