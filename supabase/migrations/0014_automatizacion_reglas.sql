-- Fase 13: motor de automatizaciones SI/ENTONCES.
-- Modelo de datos + tabla de ejecuciones (idempotencia por dia) para que una Edge Function
-- evaluadora pueda correr reglas reales sin re-notificar la misma entidad en el mismo ciclo.
-- Alcance confirmado: modelo de datos + 2-3 reglas reales funcionando, no solo esquema vacio.
--
-- Sin aplicar todavia -- mismo criterio que 0012/0013: se aplica cuando el usuario lo confirme.

begin;

create type public.automatizacion_trigger as enum (
  'tarea_vencida',            -- SI una tarea supera fecha_limite sin completarse
  'solicitud_pendiente_tiempo', -- SI una solicitud de ausencia/interna lleva mas de N horas en 'pendiente'
  'checkin_faltante'          -- SI un empleado activo no tiene checkin hoy despues de cierta hora
);

create type public.automatizacion_destino as enum (
  'asignado', -- el usuario duenio de la entidad (asignado_a de la tarea, o el propio empleado)
  'creador',  -- quien creo la entidad (creado_por de la tarea)
  'admins'    -- todos los admin/admin_empresa de la empresa
);

create table public.automatizacion_reglas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nombre text not null,
  descripcion text,
  trigger_tipo public.automatizacion_trigger not null,
  -- condiciones.horasUmbral: usado por 'solicitud_pendiente_tiempo' (default 48 si no viene).
  -- condiciones.horaLimite: hora del dia (0-23, UTC) usada por 'checkin_faltante' (default 10 si no viene).
  condiciones jsonb not null default '{}'::jsonb,
  accion_destino public.automatizacion_destino not null default 'admins',
  activa boolean not null default true,
  creado_por uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_automatizacion_reglas_empresa on public.automatizacion_reglas(empresa_id);
create index idx_automatizacion_reglas_activas on public.automatizacion_reglas(empresa_id, trigger_tipo) where activa;

create trigger trg_automatizacion_reglas_updated_at
  before update on public.automatizacion_reglas
  for each row execute function public.set_updated_at();

-- Log de ejecuciones: la clave de idempotencia es (regla, tipo de entidad, entidad, ciclo del dia)
-- -- para que la misma tarea vencida no publique dos veces en la Bandeja Unificada el mismo dia,
-- pero si vuelva a avisar al dia siguiente si la condicion sigue vigente (recordatorio, no silencio
-- permanente).
create table public.automatizacion_ejecuciones (
  id uuid primary key default gen_random_uuid(),
  regla_id uuid not null references public.automatizacion_reglas(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  entidad_tipo text not null,
  entidad_id uuid not null,
  ciclo date not null default current_date,
  resultado text not null default 'ejecutada',
  detalle jsonb,
  created_at timestamptz not null default now(),
  unique (regla_id, entidad_tipo, entidad_id, ciclo)
);

create index idx_automatizacion_ejecuciones_regla on public.automatizacion_ejecuciones(regla_id, ciclo);
create index idx_automatizacion_ejecuciones_empresa on public.automatizacion_ejecuciones(empresa_id, ciclo);

alter table public.automatizacion_reglas enable row level security;
alter table public.automatizacion_ejecuciones enable row level security;

-- Lectura: jefe+ de la misma empresa (igual que el resto de paneles operativos).
-- Escritura (crear/activar/desactivar/borrar reglas): solo admin_empresa+ -- una regla mal
-- configurada puede notificar a toda la empresa, es una accion administrativa, no operativa.
create policy automatizacion_reglas_select on public.automatizacion_reglas
  for select using (public.misma_empresa(empresa_id) and public.es_jefe());
create policy automatizacion_reglas_insert on public.automatizacion_reglas
  for insert with check (public.misma_empresa(empresa_id) and public.es_admin_empresa());
create policy automatizacion_reglas_update on public.automatizacion_reglas
  for update using (public.misma_empresa(empresa_id) and public.es_admin_empresa());
create policy automatizacion_reglas_delete on public.automatizacion_reglas
  for delete using (public.misma_empresa(empresa_id) and public.es_admin_empresa());

-- El log de ejecuciones solo lo escribe la Edge Function evaluadora (service_role, sin pasar por
-- RLS) -- desde el cliente solo se puede leer, nunca insertar/borrar directamente.
create policy automatizacion_ejecuciones_select on public.automatizacion_ejecuciones
  for select using (public.misma_empresa(empresa_id) and public.es_jefe());

commit;
