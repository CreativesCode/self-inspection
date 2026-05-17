-- =====================================================================
-- Hace público el bucket `media` para servir las fotos sin signed URLs.
--
-- Contexto: el sistema legacy (Django + S3) usaba un bucket público. Las
-- URLs de fotos eran accesibles directamente. Mantenemos esa misma postura
-- de seguridad porque:
--   - Los paths llevan UUIDs no enumerables (`inspections/<uuid>/<uuid>.jpg`).
--   - Las apps móviles (Capacitor) necesitan URLs estables, no refrescar
--     signed URLs cada hora.
--   - El RLS de la BD sigue protegiendo qué inspections puede *listar* cada
--     usuario; lo que es público es solo la imagen binaria si conoces la URL.
--
-- `reports` sigue siendo privado (los PDF pueden contener datos sensibles
-- agregados de varias inspecciones).
-- =====================================================================
update storage.buckets
   set public = true
 where id = 'media';
