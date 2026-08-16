-- Corrige instalaciones donde la tabla ya existía sin la política de inserción
-- o sin la columna que el cliente usa para identificar el origen.
alter table public.solicitudes_soporte_publico
  add column if not exists origen text not null default 'app';

alter table public.solicitudes_soporte_publico enable row level security;

drop policy if exists soporte_publico_insert on public.solicitudes_soporte_publico;
drop policy if exists soporte_publico_select on public.solicitudes_soporte_publico;
drop policy if exists soporte_publico_update on public.solicitudes_soporte_publico;

create policy soporte_publico_insert on public.solicitudes_soporte_publico
  for insert to anon, authenticated
  with check (true);

create policy soporte_publico_select on public.solicitudes_soporte_publico
  for select to authenticated
  using (public.es_super_admin());

create policy soporte_publico_update on public.solicitudes_soporte_publico
  for update to authenticated
  using (public.es_super_admin())
  with check (public.es_super_admin());

grant insert on table public.solicitudes_soporte_publico to anon, authenticated;
grant select, update on table public.solicitudes_soporte_publico to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'solicitudes_soporte_publico'
  ) then
    alter publication supabase_realtime add table public.solicitudes_soporte_publico;
  end if;
end $$;
