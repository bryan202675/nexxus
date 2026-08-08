-- Nexxus: columnas que empresa-organizacion (web-dashboard, Fase 4) necesita
-- y la Fase 0 no habia previsto: asignacion de jefe/sede a un departamento,
-- direccion de una sede, descripcion de un rol personalizado.

begin;

alter table public.departamentos
  add column if not exists jefe_id uuid references public.usuarios(id) on delete set null,
  add column if not exists sede_id uuid references public.sedes(id) on delete set null;

alter table public.sedes add column if not exists direccion text;
alter table public.roles_personalizados add column if not exists descripcion text;

commit;
