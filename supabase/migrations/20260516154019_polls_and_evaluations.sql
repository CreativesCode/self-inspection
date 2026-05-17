-- =====================================================================
-- 0004 — Polls, answers y evaluations
-- =====================================================================
-- Reemplaza Poll, Question/Poll M2M, Answer y Evaluation.
--
-- Mejoras respecto al schema Django:
--  - evaluations.percentage es GENERATED ALWAYS AS — siempre coherente
--    con total_score / max_possible_score, sin necesidad de calculate_score().
--  - evaluations.rating es GENERATED ALWAYS AS — derivado del percentage
--    con los mismos umbrales que el legacy (90/80/65).
--  - polls.unique(inspection_id) — replica unique_together Django.
-- =====================================================================

-- ---------------------------------------------------------------------
-- polls
-- ---------------------------------------------------------------------
create table public.polls (
    id              uuid primary key default gen_random_uuid(),
    inspection_id   uuid not null unique references public.inspections(id) on delete cascade,
    status          public.poll_status not null default 'pending',
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index polls_status_idx on public.polls (status);
create index polls_inspection_idx on public.polls (inspection_id);

create trigger polls_set_updated_at
    before update on public.polls
    for each row execute function public.tg_set_updated_at();

comment on table public.polls is
    'Una poll por inspection (UNIQUE inspection_id). status: pending → completed.';


-- ---------------------------------------------------------------------
-- poll_questions — M2M Poll ↔ Question (snapshot de preguntas al crear poll)
-- ---------------------------------------------------------------------
create table public.poll_questions (
    poll_id     uuid not null references public.polls(id)     on delete cascade,
    question_id uuid not null references public.questions(id) on delete cascade,
    primary key (poll_id, question_id)
);

create index poll_questions_question_idx on public.poll_questions (question_id);


-- ---------------------------------------------------------------------
-- answers
-- ---------------------------------------------------------------------
create table public.answers (
    id              uuid primary key default gen_random_uuid(),
    poll_id         uuid not null references public.polls(id)         on delete cascade,
    question_id     uuid not null references public.questions(id)     on delete cascade,
    answer_text     public.answer_choice not null default 'good',
    observation_id  uuid          references public.observations(id)  on delete cascade,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index answers_poll_idx     on public.answers (poll_id);
create index answers_question_idx on public.answers (question_id);

-- Constraint útil: no permite dos respuestas distintas para la misma
-- pregunta dentro de la misma poll (cada pregunta se responde una vez).
create unique index answers_poll_question_unique on public.answers (poll_id, question_id);

create trigger answers_set_updated_at
    before update on public.answers
    for each row execute function public.tg_set_updated_at();


-- ---------------------------------------------------------------------
-- evaluations — un único registro por poll
-- ---------------------------------------------------------------------
-- percentage y rating se derivan automáticamente de total_score/max_possible_score.
-- No es necesario un método calculate_score() ni overrides de save() — la BD
-- garantiza consistencia.
create table public.evaluations (
    id                  uuid primary key default gen_random_uuid(),
    inspection_id       uuid not null references public.inspections(id) on delete cascade,
    poll_id             uuid not null unique references public.polls(id) on delete cascade,
    total_score         integer not null default 0 check (total_score >= 0),
    max_possible_score  integer not null default 0 check (max_possible_score >= 0),

    -- columna calculada (Postgres 12+): % = score / max * 100
    percentage  numeric(5, 2)
        generated always as (
            case when max_possible_score > 0
                 then round((total_score::numeric / max_possible_score::numeric) * 100, 2)
                 else 0
            end
        ) stored,

    -- rating cualitativo: misma lógica que Evaluation.get_rating() legacy
    -- (cast explícito a evaluation_rating: Postgres no infiere el tipo desde literales)
    rating  public.evaluation_rating
        generated always as (
            case
                when max_possible_score = 0                                            then 'deficiente'::public.evaluation_rating
                when (total_score::numeric / max_possible_score::numeric) * 100 >= 90  then 'excelente'::public.evaluation_rating
                when (total_score::numeric / max_possible_score::numeric) * 100 >= 80  then 'bueno'::public.evaluation_rating
                when (total_score::numeric / max_possible_score::numeric) * 100 >= 65  then 'regular'::public.evaluation_rating
                else 'deficiente'::public.evaluation_rating
            end
        ) stored,

    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create index evaluations_inspection_idx on public.evaluations (inspection_id);
create index evaluations_percentage_idx on public.evaluations (percentage);
create index evaluations_rating_idx     on public.evaluations (rating);

create trigger evaluations_set_updated_at
    before update on public.evaluations
    for each row execute function public.tg_set_updated_at();

comment on column public.evaluations.percentage is
    'Calculado automáticamente: round((total_score / max_possible_score) * 100, 2).';
comment on column public.evaluations.rating is
    'Calculado automáticamente: >=90 excelente, >=80 bueno, >=65 regular, resto deficiente.';


-- ---------------------------------------------------------------------
-- Función que recalcula total_score / max_possible_score para una poll.
-- Reemplaza Evaluation.calculate_score() Python. Se invoca desde el
-- trigger AFTER de answers en Fase 3 (lógica de negocio).
-- ---------------------------------------------------------------------
create or replace function public.recalculate_evaluation(p_poll_id uuid)
returns void
language plpgsql
as $$
declare
    v_total_score        integer := 0;
    v_applicable_count   integer := 0;
begin
    -- Pesos: good=3, regular=2, bad=0, not_applicable se excluye
    select
        coalesce(sum(case answer_text
            when 'good'    then 3
            when 'regular' then 2
            when 'bad'     then 0
            else 0
        end), 0),
        count(*) filter (where answer_text <> 'not_applicable')
    into v_total_score, v_applicable_count
    from public.answers
    where poll_id = p_poll_id;

    update public.evaluations
       set total_score        = v_total_score,
           max_possible_score = v_applicable_count * 3,
           updated_at         = now()
     where poll_id = p_poll_id;
end;
$$;

comment on function public.recalculate_evaluation(uuid) is
    'Recalcula total_score y max_possible_score de la evaluation de una poll. percentage y rating se actualizan automáticamente por ser generated columns.';


-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.polls           enable row level security;
alter table public.poll_questions  enable row level security;
alter table public.answers         enable row level security;
alter table public.evaluations     enable row level security;
