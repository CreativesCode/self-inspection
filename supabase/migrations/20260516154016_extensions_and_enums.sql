-- =====================================================================
-- 0001 — Extensiones y enums canónicos
-- =====================================================================
-- Habilita extensiones requeridas y define los tipos enumerados que se
-- usarán en todas las tablas. Roles, estados y choices viven aquí para
-- evitar strings duplicados con tildes / mayúsculas inconsistentes.
-- =====================================================================

-- Extensiones
create extension if not exists "pgcrypto"   with schema extensions;  -- gen_random_uuid()
create extension if not exists "pg_cron"    with schema extensions;  -- jobs programados
create extension if not exists "pg_net"     with schema extensions;  -- llamadas HTTP desde la BD (webhooks)

-- ---------------------------------------------------------------------
-- Enums canónicos (lowercase snake_case)
-- ---------------------------------------------------------------------

-- Rol de usuario en la aplicación
do $$ begin
    create type public.user_role as enum (
        'administrador',
        'jefe_de_obra',
        'tecnico',
        'jefe_de_trabajo'
    );
exception when duplicate_object then null;
end $$;

-- Estado de una encuesta de inspección
do $$ begin
    create type public.poll_status as enum (
        'pending',
        'completed'
    );
exception when duplicate_object then null;
end $$;

-- Respuestas posibles en una pregunta
-- (mapean a los antiguos AnswerChoices: GOOD, REGULAR, BAD, NOT_APPLICABLE)
do $$ begin
    create type public.answer_choice as enum (
        'good',
        'regular',
        'bad',
        'not_applicable'
    );
exception when duplicate_object then null;
end $$;

-- Rating cualitativo de una evaluación (derivado del percentage)
do $$ begin
    create type public.evaluation_rating as enum (
        'excelente',
        'bueno',
        'regular',
        'deficiente'
    );
exception when duplicate_object then null;
end $$;

-- Tipos de notificación
do $$ begin
    create type public.notification_type as enum (
        'inspection_created',
        'inspection_completed',
        'inspection_pending',
        'ranking_changed',
        'report_ready'
    );
exception when duplicate_object then null;
end $$;

-- Tono visual de la notificación
do $$ begin
    create type public.notification_tone as enum (
        'ok',
        'warn',
        'bad',
        'info',
        'neutral'
    );
exception when duplicate_object then null;
end $$;

-- Categoría/bandeja de la notificación
do $$ begin
    create type public.notification_category as enum (
        'inspections',
        'team',
        'system',
        'critical'
    );
exception when duplicate_object then null;
end $$;

-- Estado de un job de generación de reporte
do $$ begin
    create type public.report_status as enum (
        'queued',
        'running',
        'done',
        'failed'
    );
exception when duplicate_object then null;
end $$;

-- Formato de reporte
do $$ begin
    create type public.report_format as enum (
        'pdf',
        'docx'
    );
exception when duplicate_object then null;
end $$;


-- ---------------------------------------------------------------------
-- Helper: trigger genérico que mantiene updated_at fresco
-- ---------------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

comment on function public.tg_set_updated_at()
    is 'Trigger BEFORE UPDATE genérico: actualiza updated_at a now().';
