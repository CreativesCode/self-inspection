-- =====================================================================
-- 0003 — Inspections, observations y sus M2M
-- =====================================================================
-- Reemplaza los modelos Inspection, Observation, ObservationPhoto y las
-- relaciones M2M activity / subcontrate_name.
--
-- Decisiones respecto al schema Django:
--  - Las M2M se modelan con tablas pivote explícitas (Django las creaba
--    automáticamente: inspection_activity, inspection_subcontrate_name).
--  - GPS_latitude → gps_latitude (snake_case consistente).
--  - ObservationPhoto.photo (ImageField) → storage_path (text apuntando
--    a Supabase Storage). El render del frontend construye la URL con
--    supabase.storage.from('media').getPublicUrl() o createSignedUrl().
-- =====================================================================

-- ---------------------------------------------------------------------
-- observations
-- ---------------------------------------------------------------------
create table public.observations (
    id                  uuid primary key default gen_random_uuid(),
    observation_text    text,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create trigger observations_set_updated_at
    before update on public.observations
    for each row execute function public.tg_set_updated_at();


-- ---------------------------------------------------------------------
-- observation_photos
-- ---------------------------------------------------------------------
create table public.observation_photos (
    id              uuid primary key default gen_random_uuid(),
    observation_id  uuid not null references public.observations(id) on delete cascade,
    storage_path    text not null,                   -- ej: observations/<observation_id>/<uuid>.jpg
    created_at      timestamptz not null default now()
);

create index observation_photos_observation_idx on public.observation_photos (observation_id);

comment on column public.observation_photos.storage_path is
    'Ruta relativa dentro del bucket media (sin prefijo de URL). El cliente construye la URL pública/firmada.';


-- ---------------------------------------------------------------------
-- inspections — entidad central
-- ---------------------------------------------------------------------
create table public.inspections (
    id                  uuid primary key default gen_random_uuid(),
    project_code        text not null,
    instalation_name    text not null,                 -- (sic) preserva typo del schema Django para no romper consultas client-side durante migración
    date_time           timestamptz not null,
    gps_latitude        numeric(10, 6) not null check (gps_latitude  between -90  and 90),
    gps_longitude       numeric(10, 6) not null check (gps_longitude between -180 and 180),

    user_id             uuid not null references public.profiles(id)         on delete restrict,
    client_id           uuid not null references public.clients(id)          on delete restrict,
    inspection_type_id  uuid not null references public.inspection_types(id) on delete restrict,
    observation_id      uuid          references public.observations(id)     on delete set null,

    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

-- Índices para filtros del dashboard (búsqueda, fecha, usuario)
create index inspections_project_code_idx     on public.inspections (project_code);
create index inspections_date_time_desc_idx   on public.inspections (date_time desc);
create index inspections_user_idx             on public.inspections (user_id);
create index inspections_client_idx           on public.inspections (client_id);
create index inspections_inspection_type_idx  on public.inspections (inspection_type_id);

create trigger inspections_set_updated_at
    before update on public.inspections
    for each row execute function public.tg_set_updated_at();

comment on column public.inspections.instalation_name is
    'Nota: typo "instalation" preservado del schema legacy Django. Renombrar a installation_name en fase de cleanup post-cutover.';


-- ---------------------------------------------------------------------
-- inspection_activities — M2M Inspection ↔ Activity
-- ---------------------------------------------------------------------
create table public.inspection_activities (
    inspection_id  uuid not null references public.inspections(id) on delete cascade,
    activity_id    uuid not null references public.activities(id)  on delete cascade,
    primary key (inspection_id, activity_id)
);

create index inspection_activities_activity_idx on public.inspection_activities (activity_id);


-- ---------------------------------------------------------------------
-- inspection_subcontracts — M2M Inspection ↔ SubcontrateName
-- ---------------------------------------------------------------------
create table public.inspection_subcontracts (
    inspection_id        uuid not null references public.inspections(id)       on delete cascade,
    subcontrate_name_id  uuid not null references public.subcontrate_names(id) on delete cascade,
    primary key (inspection_id, subcontrate_name_id)
);

create index inspection_subcontracts_subcontract_idx
    on public.inspection_subcontracts (subcontrate_name_id);


-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.observations             enable row level security;
alter table public.observation_photos       enable row level security;
alter table public.inspections              enable row level security;
alter table public.inspection_activities    enable row level security;
alter table public.inspection_subcontracts  enable row level security;
