-- =====================================================================
-- 0002 — Profiles y tablas de catálogo
-- =====================================================================
-- profiles extiende auth.users con los campos custom del User Django:
-- nombre, rol, foto de perfil, etc.
--
-- Catálogos (inspection_types, activities, clients, subcontrate_names,
-- headers, questions) reemplazan los modelos Django del mismo nombre.
-- Todos usan UUID para alinear con auth.users.id y permitir generación
-- client-side (importante para flujos offline en la app móvil).
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles — extiende auth.users
-- ---------------------------------------------------------------------
create table public.profiles (
    id              uuid primary key references auth.users(id) on delete cascade,
    email           text not null unique,
    first_name      text not null,
    last_name       text not null,
    user_type       public.user_role not null default 'jefe_de_trabajo',
    is_active       boolean not null default true,
    phone_number    text,
    address         text,
    profile_picture text,                              -- Supabase Storage path (bucket "media")
    bio             text,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index profiles_user_type_idx on public.profiles (user_type);
create index profiles_is_active_idx on public.profiles (is_active) where is_active = true;

create trigger profiles_set_updated_at
    before update on public.profiles
    for each row execute function public.tg_set_updated_at();

comment on table public.profiles is
    'Datos públicos del usuario. Vinculado 1:1 con auth.users.';
comment on column public.profiles.user_type is
    'Rol del usuario. Usado por RLS para decidir permisos.';
comment on column public.profiles.profile_picture is
    'Path dentro del bucket media (ej: profile_pics/<uuid>.jpg). NO es una URL completa.';


-- Trigger: cuando se crea un auth.users automáticamente crea su profile
-- con los metadatos pasados en raw_user_meta_data
create or replace function public.tg_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, first_name, last_name, user_type)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'first_name', ''),
        coalesce(new.raw_user_meta_data ->> 'last_name',  ''),
        coalesce(
            (new.raw_user_meta_data ->> 'user_type')::public.user_role,
            'jefe_de_trabajo'
        )
    );
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.tg_handle_new_auth_user();


-- ---------------------------------------------------------------------
-- inspection_types
-- ---------------------------------------------------------------------
create table public.inspection_types (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create trigger inspection_types_set_updated_at
    before update on public.inspection_types
    for each row execute function public.tg_set_updated_at();


-- ---------------------------------------------------------------------
-- activities — pertenece a un inspection_type
-- ---------------------------------------------------------------------
create table public.activities (
    id                  uuid primary key default gen_random_uuid(),
    activity_text       text not null,
    inspection_type_id  uuid not null references public.inspection_types(id) on delete cascade,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create index activities_inspection_type_idx on public.activities (inspection_type_id);

create trigger activities_set_updated_at
    before update on public.activities
    for each row execute function public.tg_set_updated_at();


-- ---------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------
create table public.clients (
    id          uuid primary key default gen_random_uuid(),
    client_name text not null,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create trigger clients_set_updated_at
    before update on public.clients
    for each row execute function public.tg_set_updated_at();


-- ---------------------------------------------------------------------
-- subcontrate_names
-- ---------------------------------------------------------------------
create table public.subcontrate_names (
    id                  uuid primary key default gen_random_uuid(),
    subcontrate_name    text not null,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create trigger subcontrate_names_set_updated_at
    before update on public.subcontrate_names
    for each row execute function public.tg_set_updated_at();


-- ---------------------------------------------------------------------
-- headers — agrupan preguntas dentro de un inspection_type
-- ---------------------------------------------------------------------
create table public.headers (
    id                  uuid primary key default gen_random_uuid(),
    header_text         text not null,
    inspection_type_id  uuid not null references public.inspection_types(id) on delete cascade,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create index headers_inspection_type_idx on public.headers (inspection_type_id);

create trigger headers_set_updated_at
    before update on public.headers
    for each row execute function public.tg_set_updated_at();


-- ---------------------------------------------------------------------
-- questions — pertenecen a un header
-- ---------------------------------------------------------------------
create table public.questions (
    id              uuid primary key default gen_random_uuid(),
    question_text   text not null,
    header_id       uuid not null references public.headers(id) on delete cascade,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index questions_header_idx on public.questions (header_id);

create trigger questions_set_updated_at
    before update on public.questions
    for each row execute function public.tg_set_updated_at();


-- ---------------------------------------------------------------------
-- RLS: habilitamos en todas las tablas (políticas se definen en Fase 2)
-- ---------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.inspection_types    enable row level security;
alter table public.activities          enable row level security;
alter table public.clients             enable row level security;
alter table public.subcontrate_names   enable row level security;
alter table public.headers             enable row level security;
alter table public.questions           enable row level security;
