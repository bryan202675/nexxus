-- storage.objects tenía RLS activado pero CERO políticas -- nadie (ni admin, ni nadie salvo
-- service_role) podía subir ni leer archivos en ningún bucket, incluyendo "documents". El módulo
-- de Documentos del dashboard nunca llegó a subir un archivo real. Cada objeto se guarda como
-- "${empresaId}/${timestamp}_${nombre}" (ver empresa-documentos/index.tsx), así que el primer
-- segmento de la ruta es el empresa_id -- se reutiliza misma_empresa(), la misma función que ya
-- usan todas las demás tablas para aislar por tenant.
--
-- El regex antes del cast a uuid es defensivo: sin él, un objeto con una ruta que no empiece con
-- un uuid válido (ruta suelta en la raíz del bucket, etc.) haría que el cast ::uuid lance una
-- excepción en vez de simplemente evaluar a "false" -- el AND corta antes de llegar al cast.
create policy documents_select_misma_empresa on storage.objects
  for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.misma_empresa(((storage.foldername(name))[1])::uuid)
  );

create policy documents_insert_misma_empresa on storage.objects
  for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.misma_empresa(((storage.foldername(name))[1])::uuid)
  );

create policy documents_update_misma_empresa on storage.objects
  for update
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.misma_empresa(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.misma_empresa(((storage.foldername(name))[1])::uuid)
  );

create policy documents_delete_misma_empresa on storage.objects
  for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.misma_empresa(((storage.foldername(name))[1])::uuid)
  );
