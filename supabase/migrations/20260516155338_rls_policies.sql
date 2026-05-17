-- =====================================================================
-- 0007 — Políticas RLS por tabla
-- =====================================================================
-- Replica los permisos por rol del backend Django legacy:
--   - administrador / jefe_de_obra: control total operativo + admin.
--   - tecnico / jefe_de_trabajo:    CRUD operativo (sin DELETE de
--     inspections/evaluations/clients/catálogos).
--   - Los catálogos son lectura abierta para todos los autenticados.
--   - Notifications solo el destinatario.
--   - Report jobs: admin/jefe ven todos; resto solo los suyos.
--
-- Convenciones:
--   - Policy permisiva (default).
--   - Roles target: 'authenticated' siempre que se necesite auth.uid().
--   - SELECT y la combinación de WITH CHECK / USING bien explícitas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
-- Cada usuario lee su propio profile; admin/jefe leen todos.
create policy profiles_select on public.profiles
    for select to authenticated
    using (
        auth.uid() = id
        or public.is_admin_or_jefe()
    );

-- El usuario actualiza su propio profile (excepto user_type/is_active).
-- Admin/jefe pueden actualizar cualquier profile incluyendo rol e is_active.
create policy profiles_update_self on public.profiles
    for update to authenticated
    using (auth.uid() = id)
    with check (
        auth.uid() = id
        and user_type = (select user_type from public.profiles where id = auth.uid())
        and is_active = (select is_active from public.profiles where id = auth.uid())
    );

create policy profiles_update_admin on public.profiles
    for update to authenticated
    using (public.is_admin_or_jefe())
    with check (public.is_admin_or_jefe());

-- INSERT solo vía trigger SECURITY DEFINER (on_auth_user_created).
-- No definimos policy → bloqueado para usuarios.

-- DELETE bloqueado para usuarios — el cascade desde auth.users es la única vía.


-- ---------------------------------------------------------------------
-- Catálogos (lectura abierta, escritura admin/jefe)
-- ---------------------------------------------------------------------
do $$
declare
    catalog_table text;
begin
    foreach catalog_table in array array[
        'inspection_types',
        'activities',
        'clients',
        'subcontrate_names',
        'headers',
        'questions'
    ]
    loop
        execute format($f$
            create policy %1$I_select on public.%1$I
                for select to authenticated
                using (true);
        $f$, catalog_table);

        execute format($f$
            create policy %1$I_modify on public.%1$I
                as permissive
                for all to authenticated
                using (public.is_admin_or_jefe())
                with check (public.is_admin_or_jefe());
        $f$, catalog_table);
    end loop;
end $$;


-- ---------------------------------------------------------------------
-- inspections
-- ---------------------------------------------------------------------
-- SELECT: admin/jefe ven todas; resto solo las suyas.
create policy inspections_select on public.inspections
    for select to authenticated
    using (
        public.is_admin_or_jefe()
        or user_id = auth.uid()
    );

-- INSERT: cualquier rol operativo, pero user_id debe ser el propio.
create policy inspections_insert on public.inspections
    for insert to authenticated
    with check (
        public.is_operational_user()
        and user_id = auth.uid()
    );

-- UPDATE: admin/jefe + el dueño.
create policy inspections_update on public.inspections
    for update to authenticated
    using (
        public.is_admin_or_jefe()
        or user_id = auth.uid()
    )
    with check (
        public.is_admin_or_jefe()
        or user_id = auth.uid()
    );

-- DELETE: solo admin/jefe.
create policy inspections_delete on public.inspections
    for delete to authenticated
    using (public.is_admin_or_jefe());


-- ---------------------------------------------------------------------
-- inspection_activities (M2M) — hereda de inspections
-- ---------------------------------------------------------------------
create policy inspection_activities_select on public.inspection_activities
    for select to authenticated
    using (
        exists (
            select 1 from public.inspections i
             where i.id = inspection_activities.inspection_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    );

create policy inspection_activities_modify on public.inspection_activities
    for all to authenticated
    using (
        exists (
            select 1 from public.inspections i
             where i.id = inspection_activities.inspection_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    )
    with check (
        exists (
            select 1 from public.inspections i
             where i.id = inspection_activities.inspection_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    );


-- ---------------------------------------------------------------------
-- inspection_subcontracts (M2M) — hereda de inspections
-- ---------------------------------------------------------------------
create policy inspection_subcontracts_select on public.inspection_subcontracts
    for select to authenticated
    using (
        exists (
            select 1 from public.inspections i
             where i.id = inspection_subcontracts.inspection_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    );

create policy inspection_subcontracts_modify on public.inspection_subcontracts
    for all to authenticated
    using (
        exists (
            select 1 from public.inspections i
             where i.id = inspection_subcontracts.inspection_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    )
    with check (
        exists (
            select 1 from public.inspections i
             where i.id = inspection_subcontracts.inspection_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    );


-- ---------------------------------------------------------------------
-- observations
-- ---------------------------------------------------------------------
-- Mantenemos permisivo (igual que el legacy Django: cualquier rol
-- operativo puede CRUD observations). El vínculo a inspection/answer
-- se valida implícitamente al crear el row vinculante.
create policy observations_all on public.observations
    for all to authenticated
    using (public.is_operational_user())
    with check (public.is_operational_user());


-- ---------------------------------------------------------------------
-- observation_photos
-- ---------------------------------------------------------------------
create policy observation_photos_all on public.observation_photos
    for all to authenticated
    using (public.is_operational_user())
    with check (public.is_operational_user());


-- ---------------------------------------------------------------------
-- polls — hereda de inspections
-- ---------------------------------------------------------------------
create policy polls_select on public.polls
    for select to authenticated
    using (
        exists (
            select 1 from public.inspections i
             where i.id = polls.inspection_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    );

create policy polls_insert on public.polls
    for insert to authenticated
    with check (
        public.is_operational_user()
        and exists (
            select 1 from public.inspections i
             where i.id = polls.inspection_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    );

create policy polls_update on public.polls
    for update to authenticated
    using (
        exists (
            select 1 from public.inspections i
             where i.id = polls.inspection_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    )
    with check (
        exists (
            select 1 from public.inspections i
             where i.id = polls.inspection_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    );

create policy polls_delete on public.polls
    for delete to authenticated
    using (public.is_admin_or_jefe());


-- ---------------------------------------------------------------------
-- poll_questions (M2M) — hereda de poll → inspection
-- ---------------------------------------------------------------------
create policy poll_questions_all on public.poll_questions
    for all to authenticated
    using (
        exists (
            select 1 from public.polls p
              join public.inspections i on i.id = p.inspection_id
             where p.id = poll_questions.poll_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    )
    with check (
        exists (
            select 1 from public.polls p
              join public.inspections i on i.id = p.inspection_id
             where p.id = poll_questions.poll_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    );


-- ---------------------------------------------------------------------
-- answers — hereda de poll → inspection
-- ---------------------------------------------------------------------
create policy answers_select on public.answers
    for select to authenticated
    using (
        exists (
            select 1 from public.polls p
              join public.inspections i on i.id = p.inspection_id
             where p.id = answers.poll_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    );

create policy answers_modify on public.answers
    as permissive
    for all to authenticated
    using (
        exists (
            select 1 from public.polls p
              join public.inspections i on i.id = p.inspection_id
             where p.id = answers.poll_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    )
    with check (
        exists (
            select 1 from public.polls p
              join public.inspections i on i.id = p.inspection_id
             where p.id = answers.poll_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    );


-- ---------------------------------------------------------------------
-- evaluations — hereda de inspections
-- ---------------------------------------------------------------------
create policy evaluations_select on public.evaluations
    for select to authenticated
    using (
        exists (
            select 1 from public.inspections i
             where i.id = evaluations.inspection_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    );

create policy evaluations_insert on public.evaluations
    for insert to authenticated
    with check (
        public.is_operational_user()
        and exists (
            select 1 from public.inspections i
             where i.id = evaluations.inspection_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    );

create policy evaluations_update on public.evaluations
    for update to authenticated
    using (
        exists (
            select 1 from public.inspections i
             where i.id = evaluations.inspection_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    )
    with check (
        exists (
            select 1 from public.inspections i
             where i.id = evaluations.inspection_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    );

create policy evaluations_delete on public.evaluations
    for delete to authenticated
    using (public.is_admin_or_jefe());


-- ---------------------------------------------------------------------
-- notifications — solo el destinatario
-- ---------------------------------------------------------------------
create policy notifications_select on public.notifications
    for select to authenticated
    using (recipient_id = auth.uid());

-- UPDATE: usuario marca como leída/no leída la suya
create policy notifications_update on public.notifications
    for update to authenticated
    using (recipient_id = auth.uid())
    with check (recipient_id = auth.uid());

-- DELETE: usuario descarta sus propias notificaciones
create policy notifications_delete on public.notifications
    for delete to authenticated
    using (recipient_id = auth.uid());

-- INSERT bloqueado para clientes — solo via triggers SECURITY DEFINER (Fase 3).


-- ---------------------------------------------------------------------
-- report_jobs
-- ---------------------------------------------------------------------
-- SELECT: admin/jefe ven todos; resto solo los que pidió.
create policy report_jobs_select on public.report_jobs
    for select to authenticated
    using (
        public.is_admin_or_jefe()
        or requested_by = auth.uid()
    );

-- INSERT: cualquier autenticado, debe ser sobre una inspection accesible
-- y `requested_by` debe ser el usuario actual.
create policy report_jobs_insert on public.report_jobs
    for insert to authenticated
    with check (
        public.is_operational_user()
        and requested_by = auth.uid()
        and exists (
            select 1 from public.inspections i
             where i.id = report_jobs.inspection_id
               and (public.is_admin_or_jefe() or i.user_id = auth.uid())
        )
    );

-- UPDATE: el dueño puede actualizar (renew signed URL, marcar como done).
create policy report_jobs_update on public.report_jobs
    for update to authenticated
    using (
        public.is_admin_or_jefe()
        or requested_by = auth.uid()
    )
    with check (
        public.is_admin_or_jefe()
        or requested_by = auth.uid()
    );

-- DELETE: solo admin/jefe.
create policy report_jobs_delete on public.report_jobs
    for delete to authenticated
    using (public.is_admin_or_jefe());
