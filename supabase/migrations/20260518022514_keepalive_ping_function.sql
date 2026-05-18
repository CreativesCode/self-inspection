-- =====================================================================
-- RPC `public.ping()` — endpoint trivial para keepalive.
--
-- Supabase free pausa el proyecto tras ~7 días sin actividad en la BD.
-- Esta función la invoca un GitHub Actions cron diariamente vía
-- POST /rest/v1/rpc/ping con la anon key, manteniendo el proyecto activo.
--
-- Retorna `now()` para que el ping sea observable en los logs del workflow.
-- =====================================================================
create or replace function public.ping()
returns timestamptz
language sql
stable
as $$
  select now();
$$;

revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
