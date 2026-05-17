-- =====================================================================
-- 0011 — Fix: campos token de auth.users deben ser '' no NULL
-- =====================================================================
-- GoTrue interpreta NULL en confirmation_token/recovery_token/
-- email_change_token_new como "row corrupto" y devuelve
-- "Database error querying schema" en cualquier intento de login o
-- update sobre el usuario.
--
-- El ETL (0010) insertó esos campos como NULL porque no los explicitó.
-- Aquí los normalizamos a '' para los usuarios migrados.
-- =====================================================================

update auth.users
   set confirmation_token       = coalesce(confirmation_token,       ''),
       recovery_token           = coalesce(recovery_token,           ''),
       email_change_token_new   = coalesce(email_change_token_new,   ''),
       email_change             = coalesce(email_change,             ''),
       phone_change             = coalesce(phone_change,             ''),
       phone_change_token       = coalesce(phone_change_token,       ''),
       email_change_token_current = coalesce(email_change_token_current, ''),
       reauthentication_token   = coalesce(reauthentication_token,   '')
 where confirmation_token is null
    or recovery_token is null
    or email_change_token_new is null
    or email_change is null
    or phone_change is null
    or phone_change_token is null
    or email_change_token_current is null
    or reauthentication_token is null;
