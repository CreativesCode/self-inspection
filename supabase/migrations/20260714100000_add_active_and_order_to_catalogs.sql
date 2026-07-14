-- =====================================================================
-- Versionado de catálogos: is_active + sort_order en headers y questions
-- ---------------------------------------------------------------------
-- Permite desactivar (ocultar) encabezados/preguntas sin borrarlos, de
-- modo que las inspecciones históricas conservan sus preguntas y
-- respuestas, mientras que las inspecciones nuevas solo usan las
-- activas. sort_order fija el orden lógico (el del documento fuente),
-- en lugar del orden alfabético por texto.
-- =====================================================================

alter table public.headers
    add column if not exists is_active  boolean not null default true;
alter table public.headers
    add column if not exists sort_order integer not null default 0;

alter table public.questions
    add column if not exists is_active  boolean not null default true;
alter table public.questions
    add column if not exists sort_order integer not null default 0;

create index if not exists headers_type_active_order_idx
    on public.headers (inspection_type_id, is_active, sort_order);

create index if not exists questions_header_active_order_idx
    on public.questions (header_id, is_active, sort_order);
