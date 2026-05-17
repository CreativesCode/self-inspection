-- =====================================================================
-- 0009 — Triggers de negocio y motor de notificaciones
-- =====================================================================
-- Reemplaza la lógica que en Django vive en:
--   - inspection/signals.py (post_save Answer → recalc evaluation)
--   - notifications/services.py (notify_inspection_created, _completed,
--     _report_ready, _ranking_change, _pending)
--   - notifications/tasks.py (remind_pending_inspections vía Celery beat)
--
-- Todas las funciones que insertan en `notifications` son SECURITY DEFINER
-- porque la tabla no tiene política INSERT para clientes (solo se
-- escribe desde triggers / Edge Functions con privilegios elevados).
-- =====================================================================


-- ---------------------------------------------------------------------
-- Helper: notificar a administradores y jefes de obra
-- ---------------------------------------------------------------------
-- Devuelve los IDs de profiles con rol admin/jefe activos, excluyendo
-- opcionalmente a uno (típicamente al autor del evento).
create or replace function public.admin_and_jefe_recipients(p_exclude_user uuid default null)
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select p.id
      from public.profiles p
     where p.is_active = true
       and p.user_type in ('administrador', 'jefe_de_obra')
       and (p_exclude_user is null or p.id <> p_exclude_user);
$$;

comment on function public.admin_and_jefe_recipients(uuid) is
    'Devuelve los IDs de profiles administradores y jefes de obra activos. Reemplaza notifications.services._admin_recipients().';


-- ---------------------------------------------------------------------
-- Helper: URL del detalle de una inspection en el frontend
-- ---------------------------------------------------------------------
-- Antes Django emitía /inspections/details?id=<base64(InspectionType:N)>
-- por compatibilidad Relay. Como ahora los IDs son UUIDs nativos, usamos
-- la URL directa.
create or replace function public.inspection_detail_url(p_inspection_id uuid)
returns text
language sql
immutable
as $$
    select '/inspections/details?id=' || p_inspection_id::text;
$$;


-- =====================================================================
-- Trigger 1: recalcular evaluation al cambiar respuestas
-- =====================================================================
-- Reemplaza Evaluation.calculate_score() + el save() override en Django.
-- Mantiene total_score/max_possible_score sincronizados; las generated
-- columns percentage y rating se actualizan solas.
create or replace function public.tg_recalculate_evaluation_on_answer()
returns trigger
language plpgsql
as $$
declare
    v_poll_id uuid;
begin
    -- En DELETE el row "afectado" es OLD; en INSERT/UPDATE es NEW.
    v_poll_id := coalesce(new.poll_id, old.poll_id);

    -- Solo recalcula si existe una evaluation para ese poll.
    -- (Si la evaluation aún no fue creada, no hay nada que actualizar.)
    if exists (select 1 from public.evaluations where poll_id = v_poll_id) then
        perform public.recalculate_evaluation(v_poll_id);
    end if;

    return null; -- AFTER trigger, no necesita devolver row
end;
$$;

create trigger answers_recalculate_evaluation
    after insert or update or delete on public.answers
    for each row execute function public.tg_recalculate_evaluation_on_answer();


-- =====================================================================
-- Trigger 2: notificar INSPECTION_CREATED a admin/jefe al crear inspección
-- =====================================================================
create or replace function public.tg_notify_inspection_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_author_name      text;
    v_author_email     text;
    v_title            text;
    v_body             text;
    v_action_url       text;
begin
    -- Datos del autor
    select coalesce(nullif(trim(p.first_name || ' ' || p.last_name), ''), p.email),
           p.email
      into v_author_name, v_author_email
      from public.profiles p
     where p.id = new.user_id;

    v_title      := 'Nueva inspección ' || new.project_code;
    v_body       := coalesce(v_author_name, v_author_email, 'Un usuario') ||
                    ' creó una inspección en ' || new.instalation_name || '.';
    v_action_url := public.inspection_detail_url(new.id);

    insert into public.notifications
        (recipient_id, type, tone, category, title, body, action_url, action_label, inspection_id)
    select
        recipient_id,
        'inspection_created'::public.notification_type,
        'info'::public.notification_tone,
        'inspections'::public.notification_category,
        v_title,
        v_body,
        v_action_url,
        'Ver inspección',
        new.id
      from public.admin_and_jefe_recipients(new.user_id) as recipient_id;

    return new;
end;
$$;

create trigger inspections_notify_created
    after insert on public.inspections
    for each row execute function public.tg_notify_inspection_created();


-- =====================================================================
-- Trigger 3: al completar una poll → crear evaluation + notificar
-- =====================================================================
-- Reemplaza el flujo Django donde al marcar la poll como completed se
-- llama a notify_inspection_completed y se calcula la evaluation.
create or replace function public.tg_handle_poll_completed()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_evaluation_id uuid;
    v_inspection    record;
    v_author_name   text;
    v_author_email  text;
    v_title         text;
    v_body          text;
    v_action_url    text;
    v_old_avg       numeric;
    v_new_avg       numeric;
begin
    -- Solo nos interesa la transición pending → completed
    if not (old.status = 'pending' and new.status = 'completed') then
        return new;
    end if;

    select * into v_inspection from public.inspections where id = new.inspection_id;

    -- Snapshot del promedio del usuario ANTES de crear la evaluation actual,
    -- para detectar cambios de ranking (notify_ranking_change legacy).
    select avg(e.percentage)
      into v_old_avg
      from public.evaluations e
      join public.inspections i on i.id = e.inspection_id
     where i.user_id = v_inspection.user_id;

    -- Crear evaluation si no existe (idempotente)
    insert into public.evaluations (inspection_id, poll_id, total_score, max_possible_score)
    values (new.inspection_id, new.id, 0, 0)
    on conflict (poll_id) do nothing
    returning id into v_evaluation_id;

    -- Forzar recálculo inicial (por si la poll ya tenía answers)
    perform public.recalculate_evaluation(new.id);

    -- Datos del autor para el cuerpo de la notificación
    select coalesce(nullif(trim(p.first_name || ' ' || p.last_name), ''), p.email),
           p.email
      into v_author_name, v_author_email
      from public.profiles p
     where p.id = v_inspection.user_id;

    -- Notificación INSPECTION_COMPLETED a admin/jefe (excluyendo al autor)
    v_title      := 'Inspección completada · ' || v_inspection.project_code;
    v_body       := coalesce(v_author_name, v_author_email, 'Un usuario') ||
                    ' completó la encuesta en ' || v_inspection.instalation_name || '.';
    v_action_url := public.inspection_detail_url(v_inspection.id);

    insert into public.notifications
        (recipient_id, type, tone, category, title, body, action_url, action_label, inspection_id)
    select
        recipient_id,
        'inspection_completed'::public.notification_type,
        'ok'::public.notification_tone,
        'inspections'::public.notification_category,
        v_title,
        v_body,
        v_action_url,
        'Ver inspección',
        v_inspection.id
      from public.admin_and_jefe_recipients(v_inspection.user_id) as recipient_id;

    -- RANKING_CHANGED: comparar promedio antes/después
    -- (después incluye la evaluation que acabamos de actualizar)
    select avg(e.percentage)
      into v_new_avg
      from public.evaluations e
      join public.inspections i on i.id = e.inspection_id
     where i.user_id = v_inspection.user_id;

    if v_old_avg is not null and v_new_avg is not null and abs(v_new_avg - v_old_avg) >= 0.5 then
        insert into public.notifications
            (recipient_id, type, tone, category, title, body, action_url, action_label, inspection_id)
        values (
            v_inspection.user_id,
            'ranking_changed'::public.notification_type,
            case when v_new_avg > v_old_avg
                 then 'ok'::public.notification_tone
                 else 'warn'::public.notification_tone
            end,
            'inspections'::public.notification_category,
            case when v_new_avg > v_old_avg
                 then 'Tu cumplimiento subió a ' || round(v_new_avg, 1) || '%'
                 else 'Tu cumplimiento bajó a '  || round(v_new_avg, 1) || '%'
            end,
            'Después de completar ' || v_inspection.project_code ||
                ' ' || (case when v_new_avg > v_old_avg then 'subiste ' else 'bajaste ' end) ||
                round(abs(v_new_avg - v_old_avg), 1) || ' pts (antes ' || round(v_old_avg, 1) || '%).',
            '/evaluations/details?userId=' || v_inspection.user_id::text,
            'Ver mis evaluaciones',
            v_inspection.id
        );
    end if;

    return new;
end;
$$;

create trigger polls_handle_completion
    after update of status on public.polls
    for each row execute function public.tg_handle_poll_completed();


-- =====================================================================
-- Trigger 4: notificar REPORT_READY al cambiar report_jobs.status → done
-- =====================================================================
create or replace function public.tg_notify_report_ready()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_inspection   record;
    v_title        text;
    v_body         text;
    v_action_url   text;
    v_recipients   uuid[];
begin
    -- Solo notificamos cuando el job pasa a 'done' (no en queued/running/failed)
    if not (coalesce(old.status, 'queued') <> 'done' and new.status = 'done') then
        return new;
    end if;

    select * into v_inspection from public.inspections where id = new.inspection_id;

    v_title      := 'Reporte listo · ' || v_inspection.project_code;
    v_body       := 'El reporte ' || new.format ||
                    ' de ' || v_inspection.instalation_name ||
                    ' está listo para descargar.';
    v_action_url := public.inspection_detail_url(v_inspection.id);

    -- Destinatarios: el solicitante + admins/jefes (DISTINCT por si solicitante ya es admin)
    select array(
        select distinct uid from (
            select new.requested_by as uid where new.requested_by is not null
            union
            select id from public.admin_and_jefe_recipients(null)
        ) s
    ) into v_recipients;

    insert into public.notifications
        (recipient_id, type, tone, category, title, body, action_url, action_label, inspection_id, report_job_id)
    select
        uid,
        'report_ready'::public.notification_type,
        'ok'::public.notification_tone,
        'inspections'::public.notification_category,
        v_title,
        v_body,
        v_action_url,
        'Descargar reporte',
        v_inspection.id,
        new.id
      from unnest(v_recipients) as uid;

    return new;
end;
$$;

create trigger report_jobs_notify_ready
    after update of status on public.report_jobs
    for each row execute function public.tg_notify_report_ready();


-- =====================================================================
-- Función: recordar inspecciones pendientes (reemplaza Celery beat)
-- =====================================================================
-- Crea una notificación INSPECTION_PENDING al autor de cada poll que
-- siga en estado 'pending' tras 3+ días desde que se creó la inspection.
-- Idempotente: salta si ya hay una notification no-leída o una creada
-- en los últimos 3 días para esa inspection.
create or replace function public.remind_pending_inspections()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_count integer := 0;
    rec record;
    v_days_pending integer;
    v_title text;
    v_body text;
begin
    for rec in
        select
            i.id            as inspection_id,
            i.user_id       as user_id,
            i.project_code  as project_code,
            i.instalation_name as instalation_name,
            i.created_at    as created_at
          from public.inspections i
          join public.polls p on p.inspection_id = i.id
         where p.status = 'pending'
           and i.user_id is not null
           and i.created_at < now() - interval '3 days'
    loop
        -- Idempotencia: saltar si ya hay una no-leída o una reciente (<3 días)
        if exists (
            select 1 from public.notifications n
             where n.recipient_id = rec.user_id
               and n.type = 'inspection_pending'
               and n.inspection_id = rec.inspection_id
               and (n.is_read = false or n.created_at > now() - interval '3 days')
        ) then
            continue;
        end if;

        v_days_pending := extract(day from now() - rec.created_at)::integer;
        v_title := 'Inspección pendiente · ' || rec.project_code;
        v_body  := 'Llevas ' || v_days_pending || ' días sin completar la encuesta de ' ||
                   rec.instalation_name || '.';

        insert into public.notifications
            (recipient_id, type, tone, category, title, body, action_url, action_label, inspection_id)
        values (
            rec.user_id,
            'inspection_pending'::public.notification_type,
            'warn'::public.notification_tone,
            'inspections'::public.notification_category,
            v_title,
            v_body,
            public.inspection_detail_url(rec.inspection_id),
            'Continuar',
            rec.inspection_id
        );
        v_count := v_count + 1;
    end loop;
    return v_count;
end;
$$;

comment on function public.remind_pending_inspections() is
    'Crea notificaciones INSPECTION_PENDING para polls que llevan >3 días sin completar. Reemplaza notifications.tasks.remind_pending_inspections de Celery beat. Idempotente.';


-- =====================================================================
-- Cron: ejecutar remind_pending_inspections diariamente a las 08:00 UTC
-- =====================================================================
-- pg_cron permite usar la sintaxis estándar de crontab.
-- Si el job ya existe, lo reemplazamos (idempotente).
select cron.unschedule('remind_pending_inspections_daily')
    where exists (
        select 1 from cron.job where jobname = 'remind_pending_inspections_daily'
    );

select cron.schedule(
    'remind_pending_inspections_daily',
    '0 8 * * *',                                         -- diario 08:00 UTC
    $$ select public.remind_pending_inspections(); $$
);


-- =====================================================================
-- Grants
-- =====================================================================
-- Las funciones helper que el frontend podría invocar
grant execute on function public.inspection_detail_url(uuid)              to authenticated;
-- Las funciones SECURITY DEFINER no se invocan directamente desde el
-- frontend; solo se ejecutan automáticamente desde los triggers o cron.
-- No se otorga EXECUTE a authenticated para evitar abuso.
revoke execute on function public.admin_and_jefe_recipients(uuid) from authenticated, anon, public;
revoke execute on function public.remind_pending_inspections()    from authenticated, anon, public;
