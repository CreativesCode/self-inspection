-- =====================================================================
-- Hace público el bucket `reports`.
--
-- Mismo razonamiento que con `media`: el sistema legacy (Django+S3) ya
-- exponía los PDFs por URL pública. Los paths llevan UUIDs no enumerables
-- (`inspections/<uuid>/<uuid>.pdf`), así que en la práctica solo accede
-- quien tenga el enlace que la UI le entrega.
-- =====================================================================
update storage.buckets
   set public = true
 where id = 'reports';
