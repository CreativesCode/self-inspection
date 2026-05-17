-- =====================================================================
-- 0008 — GRANTs y buckets de Supabase Storage
-- =====================================================================
-- Por defecto Supabase NO concede privilegios SQL automáticamente a
-- los roles `authenticated` / `anon` en tablas creadas por migración.
-- Las policies RLS sin un GRANT subyacente no permiten ningún acceso.
--
-- Concedemos los privilegios necesarios y luego RLS filtra qué filas
-- son accesibles.
--
-- También creamos los buckets de Storage para fotos y reportes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- GRANTs a `authenticated`
-- ---------------------------------------------------------------------
-- Privilegios completos en todas las tablas — RLS filtra.
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
    public.profiles,
    public.inspection_types,
    public.activities,
    public.clients,
    public.subcontrate_names,
    public.headers,
    public.questions,
    public.observations,
    public.observation_photos,
    public.inspections,
    public.inspection_activities,
    public.inspection_subcontracts,
    public.polls,
    public.poll_questions,
    public.answers,
    public.evaluations,
    public.notifications,
    public.report_jobs
to authenticated;

-- Anon NO tiene acceso a las tablas — todas requieren login.

-- Funciones helper: permitir ejecución
grant execute on function
    public.auth_user_role(),
    public.is_admin_or_jefe(),
    public.is_admin(),
    public.is_operational_user(),
    public.recalculate_evaluation(uuid)
to authenticated;


-- ---------------------------------------------------------------------
-- Buckets de Storage
-- ---------------------------------------------------------------------
-- `media`   → fotos de perfil + fotos de observaciones (privado, signed URLs)
-- `reports` → PDFs generados (privado, signed URLs)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
    (
        'media',
        'media',
        false,                                                  -- privado, signed URLs
        15728640,                                               -- 15 MB max (igual que FILE_UPLOAD_MAX_MEMORY_SIZE Django)
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    ),
    (
        'reports',
        'reports',
        false,                                                  -- privado, signed URLs
        52428800,                                               -- 50 MB max (PDFs grandes con muchas fotos)
        array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    )
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- Policies de Storage
-- ---------------------------------------------------------------------
-- Las policies de Storage van sobre storage.objects (tabla unificada).
-- Usamos el primer segmento del path como identificador del usuario o del bucket.

-- Bucket `media`: cualquier autenticado puede leer su contenido y subir.
-- La organización del path la decide el cliente: profile_pics/<uuid>/x.jpg, observations/<inspection_id>/x.jpg.
create policy media_authenticated_read on storage.objects
    for select to authenticated
    using (bucket_id = 'media');

create policy media_authenticated_insert on storage.objects
    for insert to authenticated
    with check (bucket_id = 'media');

create policy media_authenticated_update on storage.objects
    for update to authenticated
    using (bucket_id = 'media' and owner = auth.uid())
    with check (bucket_id = 'media' and owner = auth.uid());

-- DELETE en media: solo el owner o admin/jefe
create policy media_owner_or_admin_delete on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'media'
        and (owner = auth.uid() or public.is_admin_or_jefe())
    );


-- Bucket `reports`: lectura para cualquier autenticado (la RLS sobre report_jobs
-- limita qué reports puede consultar el usuario para obtener su storage_path/URL).
create policy reports_authenticated_read on storage.objects
    for select to authenticated
    using (bucket_id = 'reports');

-- INSERT: cualquier autenticado puede subir un PDF que generó (el path lleva
-- el inspection_id y la RLS sobre report_jobs garantiza coherencia).
create policy reports_authenticated_insert on storage.objects
    for insert to authenticated
    with check (bucket_id = 'reports');

-- DELETE: solo admin/jefe
create policy reports_admin_delete on storage.objects
    for delete to authenticated
    using (bucket_id = 'reports' and public.is_admin_or_jefe());
