-- 1) Restringe el bucket "documents" (Storage) a tipos de archivo reales del módulo de
-- Documentos -- antes allowed_mime_types era null, es decir sin ninguna restricción real del
-- lado servidor (la validación de "solo PDF/imágenes" en el dashboard es solo del navegador y
-- se puede saltar). Solo limitaba tamaño (10MB), no tipo.
update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp'
]
where id = 'documents';

-- 2) auth_rate_limits tenía RLS activado sin ninguna política -- Postgres ya lo bloqueaba por
-- completo para anon/authenticated por defecto (correcto: solo lo tocan funciones
-- SECURITY DEFINER con privilegio elevado), pero sin una política explícita quedaba ambiguo si
-- era intencional o un descuido. Se documenta con un "deny all" explícito, sin cambiar el
-- comportamiento real.
create policy auth_rate_limits_no_acceso_directo on public.auth_rate_limits
  for all
  using (false)
  with check (false);
