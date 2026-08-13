-- Nexxus: completa public.usuarios con columnas que la Fase 0 omitio y que
-- las Edge Functions de la Fase 2 (crearUsuarioEmpresa, saUpdateUser,
-- updateSensitiveEmployeeProfile, ...) necesitan: asignacion a estructura
-- organizativa y datos sensibles de nomina.

begin;

alter table public.usuarios
  add column if not exists departamento_id uuid references public.departamentos(id) on delete set null,
  add column if not exists cargo_id uuid references public.cargos(id) on delete set null,
  add column if not exists sede_id uuid references public.sedes(id) on delete set null,
  add column if not exists salario_base numeric,
  add column if not exists tipo_contrato text,
  add column if not exists banco text,
  add column if not exists cuenta_bancaria text,
  add column if not exists bonos_recurrentes numeric not null default 0,
  add column if not exists comisiones_recurrentes numeric not null default 0,
  add column if not exists descuentos_recurrentes numeric not null default 0,
  add column if not exists afp_pertenece text,
  add column if not exists sensitive_updated_at timestamptz,
  add column if not exists sensitive_updated_by uuid references public.usuarios(id),
  add column if not exists role_updated_at timestamptz,
  add column if not exists role_updated_by uuid references public.usuarios(id);

commit;
