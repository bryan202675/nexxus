-- Nexxus: política RLS permissiva para inserción en grafo_relaciones
-- Permite que cualquier usuario autenticado de la empresa registre relaciones secundarias en Nexxus Brain

begin;

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'grafo_relaciones') then
    alter table public.grafo_relaciones enable row level security;
    drop policy if exists grafo_relaciones_insert on public.grafo_relaciones;
    create policy grafo_relaciones_insert on public.grafo_relaciones
      for insert with check (public.misma_empresa(empresa_id));
  end if;
end $$;

commit;
