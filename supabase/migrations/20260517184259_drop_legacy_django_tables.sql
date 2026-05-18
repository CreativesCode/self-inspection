-- =====================================================================
-- Cleanup post-cutover: elimina TODO el esquema Django legacy.
--
-- Tras ~1 día de uso del nuevo stack Supabase sin incidencias, borramos
-- las tablas que solo se usaron como fuente de datos del ETL inicial.
--
-- IRREVERSIBLE. Antes de aplicar, asegurarse de:
--   - Backend Django apagado (sin escrituras concurrentes).
--   - ETL completado (etl.id_map tiene los 789 rows mapeados).
--   - Backup reciente de Supabase (Settings → Database → Backups).
--
-- Lo que conservamos en `public`: profiles, inspection_types, activities,
-- clients, subcontrate_names, headers, questions, observations,
-- observation_photos, inspections, inspection_activities,
-- inspection_subcontracts, polls, poll_questions, answers, evaluations,
-- notifications, report_jobs.
-- =====================================================================

-- Django framework
drop table if exists public.django_session              cascade;
drop table if exists public.django_admin_log            cascade;
drop table if exists public.django_migrations           cascade;
drop table if exists public.django_content_type         cascade;

-- Django auth + custom user
drop table if exists public.auth_group_permissions      cascade;
drop table if exists public.auth_permission             cascade;
drop table if exists public.auth_group                  cascade;
drop table if exists public.user_user_groups            cascade;
drop table if exists public.user_user_user_permissions  cascade;
drop table if exists public.user_userprofile            cascade;
drop table if exists public.user_user                   cascade;
drop table if exists public.refresh_token_refreshtoken  cascade;

-- Celery Beat (cron)
drop table if exists public.django_celery_beat_periodictask        cascade;
drop table if exists public.django_celery_beat_periodictasks       cascade;
drop table if exists public.django_celery_beat_crontabschedule     cascade;
drop table if exists public.django_celery_beat_intervalschedule    cascade;
drop table if exists public.django_celery_beat_clockedschedule     cascade;
drop table if exists public.django_celery_beat_solarschedule       cascade;

-- App `notifications` legacy
drop table if exists public.notifications_notification  cascade;

-- App `inspection` legacy (incluye M2Ms internos)
drop table if exists public.inspection_inspection_activity            cascade;
drop table if exists public.inspection_inspection_subcontrate_name    cascade;
drop table if exists public.inspection_observationphoto               cascade;
drop table if exists public.inspection_observation                    cascade;
drop table if exists public.inspection_reportjob                      cascade;
drop table if exists public.inspection_evaluation                     cascade;
drop table if exists public.inspection_inspection                     cascade;
drop table if exists public.inspection_activity                       cascade;
drop table if exists public.inspection_client                         cascade;
drop table if exists public.inspection_subcontratename                cascade;
drop table if exists public.inspection_inspectiontype                 cascade;

-- App `poll` legacy
drop table if exists public.poll_answer            cascade;
drop table if exists public.poll_poll_question     cascade;
drop table if exists public.poll_poll              cascade;
drop table if exists public.poll_question          cascade;
drop table if exists public.poll_header            cascade;

-- Schema ETL completo (con su mapping table)
drop schema if exists etl cascade;
