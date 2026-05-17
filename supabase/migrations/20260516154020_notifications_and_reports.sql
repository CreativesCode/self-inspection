-- =====================================================================
-- 0005 — Notifications y report_jobs
-- =====================================================================
-- Reemplaza los modelos Notification y ReportJob.
--
-- report_jobs cambia de semántica respecto al legacy:
--  - Antes: job asíncrono procesado por Celery que generaba el PDF.
--  - Ahora: registro/histórico del PDF generado en cliente.
--    El estado normalmente nace ya como 'done' (con storage_path),
--    pero se mantiene el campo status por compatibilidad y para casos
--    de fallo (status='failed' + error).
-- =====================================================================

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
create table public.notifications (
    id              uuid primary key default gen_random_uuid(),
    recipient_id    uuid not null references public.profiles(id) on delete cascade,

    type            public.notification_type     not null,
    tone            public.notification_tone     not null default 'info',
    category        public.notification_category not null default 'inspections',

    title           text not null,
    body            text not null default '',
    action_url      text not null default '',
    action_label    text not null default '',

    inspection_id   uuid references public.inspections(id) on delete set null,
    report_job_id   uuid,                                                       -- FK añadida más abajo (forward ref)

    is_read         boolean not null default false,
    read_at         timestamptz,
    created_at      timestamptz not null default now()
);

-- Mismos índices que tenía el modelo Django Notification
create index notifications_recipient_unread_idx
    on public.notifications (recipient_id, is_read, created_at desc);

create index notifications_recipient_idx
    on public.notifications (recipient_id, created_at desc);

create index notifications_type_idx on public.notifications (type);


-- ---------------------------------------------------------------------
-- report_jobs
-- ---------------------------------------------------------------------
create table public.report_jobs (
    id              uuid primary key default gen_random_uuid(),
    inspection_id   uuid not null references public.inspections(id) on delete cascade,
    requested_by    uuid          references public.profiles(id)    on delete set null,

    status          public.report_status not null default 'queued',
    format          public.report_format not null default 'pdf',
    locale          text not null default 'es',

    storage_path    text,                       -- Path dentro del bucket "reports", ej: reports/<inspection_id>/<job_id>.pdf
    download_url    text,                       -- Signed URL temporal
    expires_at      timestamptz,                -- Cuando expira la signed URL
    error           text,

    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index report_jobs_inspection_idx     on public.report_jobs (inspection_id);
create index report_jobs_requested_by_idx   on public.report_jobs (requested_by);
create index report_jobs_status_idx         on public.report_jobs (status);
create index report_jobs_created_at_desc_idx on public.report_jobs (created_at desc);

create trigger report_jobs_set_updated_at
    before update on public.report_jobs
    for each row execute function public.tg_set_updated_at();

comment on table public.report_jobs is
    'Histórico/registro de PDFs generados. En la arquitectura Supabase los PDFs se generan en cliente con @react-pdf/renderer, así que normalmente el registro nace ya con status=done. El campo status se conserva para auditoría y casos de fallo.';


-- ---------------------------------------------------------------------
-- FK forward: notifications.report_job_id → report_jobs.id
-- (Definida tarde porque report_jobs se crea después de notifications.)
-- ---------------------------------------------------------------------
alter table public.notifications
    add constraint notifications_report_job_fk
    foreign key (report_job_id) references public.report_jobs(id) on delete set null;


-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.notifications enable row level security;
alter table public.report_jobs   enable row level security;
