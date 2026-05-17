-- =====================================================================
-- 0006 — Funciones helper para RLS
-- =====================================================================
-- Estas funciones centralizan la lógica de "qué rol tiene el usuario
-- actual" para que las políticas RLS sean concisas y consistentes.
--
-- Marcadas STABLE para que Postgres pueda memoizar el resultado dentro
-- de una misma query (evita N llamadas por fila).
--
-- SECURITY DEFINER NO se usa: queremos que respeten la RLS de profiles
-- (que de todos modos permite al usuario leer su propio row).
-- =====================================================================

-- Devuelve el rol del usuario actual o NULL si anónimo / sin profile.
create or replace function public.auth_user_role()
returns public.user_role
language sql
stable
as $$
    select user_type
      from public.profiles
     where id = auth.uid();
$$;

comment on function public.auth_user_role() is
    'Rol del usuario autenticado actual. NULL si anónimo o sin profile.';


-- Atajo para "es admin o jefe de obra" — el privilegio operativo más alto.
create or replace function public.is_admin_or_jefe()
returns boolean
language sql
stable
as $$
    select public.auth_user_role() in ('administrador', 'jefe_de_obra');
$$;

comment on function public.is_admin_or_jefe() is
    'true si el usuario es administrador o jefe_de_obra. Centraliza el check usado en la mayoría de policies.';


-- Atajo para "es admin" (solo administrador).
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
    select public.auth_user_role() = 'administrador';
$$;

comment on function public.is_admin() is
    'true si el usuario es administrador. Reservado para acciones críticas (gestión de roles, borrado masivo, etc.).';


-- Atajo para "rol operativo" — puede crear/editar inspecciones.
-- Incluye a los 4 roles porque incluso jefe_de_trabajo (rol más bajo) puede operar.
create or replace function public.is_operational_user()
returns boolean
language sql
stable
as $$
    select public.auth_user_role() is not null
       and public.auth_user_role() in (
           'administrador', 'jefe_de_obra', 'tecnico', 'jefe_de_trabajo'
       );
$$;

comment on function public.is_operational_user() is
    'true si el usuario tiene cualquier rol operativo (todos los autenticados con profile).';
