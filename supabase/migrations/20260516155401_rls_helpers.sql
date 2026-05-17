-- =====================================================================
-- 0006 — Helpers RLS y grants iniciales
-- =====================================================================
-- Funciones SQL utilitarias para escribir políticas RLS concisas y
-- consistentes. Lectura cacheada del rol del usuario actual y atajos
-- semánticos (is_admin, is_admin_or_jefe).
--
-- Grants:
--  - El rol `anon` (anónimo) no recibe NINGÚN acceso por defecto.
--  - El rol `authenticated` recibe USAGE en el schema + permisos básicos
--    en las tablas; el control fino lo hace RLS.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper: devuelve el user_role del usuario autenticado (NULL si anon)
-- ---------------------------------------------------------------------
create or replace function public.auth_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select user_type
      from public.profiles
     where id = auth.uid();
$$;

comment on function public.auth_user_role() is
    'Devuelve el user_role del usuario autenticado. STABLE para que Postgres lo cachee dentro de una query. SECURITY DEFINER para que pueda leer profiles incluso si las políticas restrictivas se aplicasen mal.';


-- ---------------------------------------------------------------------
-- Helper: ¿el usuario actual es administrador?
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
    select public.auth_user_role() = 'administrador';
$$;


-- ---------------------------------------------------------------------
-- Helper: ¿el usuario actual es administrador o jefe de obra?
-- (combinación más usada en los checks legacy del backend Django)
-- ---------------------------------------------------------------------
create or replace function public.is_admin_or_jefe()
returns boolean
language sql
stable
as $$
    select public.auth_user_role() in ('administrador', 'jefe_de_obra');
$$;


-- ---------------------------------------------------------------------
-- Helper: ¿el usuario actual puede operar (cualquier rol activo)?
-- Útil para diferenciar autenticados con profile vs sin profile.
-- ---------------------------------------------------------------------
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1 from public.profiles
         where id = auth.uid()
           and is_active = true
    );
$$;


-- ---------------------------------------------------------------------
-- Grants para los roles base de Supabase (anon, authenticated)
-- ---------------------------------------------------------------------

-- Acceso al schema público para los roles de la API
grant usage on schema public to anon, authenticated;

-- Permitir EXECUTE de las funciones helper (necesario para que las
-- políticas RLS las puedan invocar dentro del contexto del usuario).
grant execute on function public.auth_user_role()    to authenticated;
grant execute on function public.is_admin()          to authenticated;
grant execute on function public.is_admin_or_jefe()  to authenticated;
grant execute on function public.is_active_user()    to authenticated;

-- Permisos amplios a authenticated en TODAS las tablas creadas en
-- Fases 1.* (el control real lo hace RLS — sin políticas no ve nada).
grant select, insert, update, delete on all tables    in schema public to authenticated;
grant usage,  select                  on all sequences in schema public to authenticated;
grant execute                         on all functions in schema public to authenticated;

-- Mismo grant pero por defecto para futuras tablas/secuencias creadas
-- desde este punto en adelante.
alter default privileges in schema public
    grant select, insert, update, delete on tables    to authenticated;
alter default privileges in schema public
    grant usage,  select                  on sequences to authenticated;
alter default privileges in schema public
    grant execute                         on functions to authenticated;

-- `anon` (peticiones sin JWT) NO recibe permisos. Si alguna ruta
-- pública se necesita, añadir grants específicos en migraciones futuras.
