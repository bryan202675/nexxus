-- Nexxus: esquema inicial en Supabase (reemplaza Firestore)
-- Recrea 1:1 la logica de nexxus/firestore.rules sobre Postgres + RLS.
-- Este proyecto Supabase tenia un esquema generico previo (companies/employees/...)
-- sin datos reales: se descarta por completo antes de crear el esquema definitivo.

begin;

set local check_function_bodies = off;

-- ============================================================
-- 0. Limpieza del esquema generico anterior
-- ============================================================
drop table if exists
  payroll_lines, payroll_runs, vacation_balances, time_entry_correction_requests,
  time_entry_breaks, time_entries, leave_requests, documents, audit_logs,
  employee_role_assignments, policies, positions, sites, departments,
  income_tax_brackets, isss_parameters, afp_parameters, employees,
  platform_admins, companies
  cascade;

drop type if exists
  "PayrollRunStatus", "LeaveRequestStatus", "LeaveType", "TimeEntryStatus",
  "AttendanceCorrectionStatus", "DocumentCategory", "EmployeeStatus",
  "EmployeeRole", "PolicyType", "AuditActorType"
  cascade;

-- ============================================================
-- 1. Tablas nucleo: empresas y usuarios
-- ============================================================

create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  nombre_normalizado text,
  codigo text not null unique,
  admin_id uuid references auth.users(id),
  baneado boolean not null default false,
  plan_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid references public.empresas(id) on delete set null,
  rol text not null default 'empleado'
    check (rol in ('empleado','jefe','jefe_sector','admin','admin_empresa','super_admin','psicologo')),
  nombre text not null,
  correo text not null,
  telefono text,
  usuario_interno text,
  codigo_empresa text,
  password_interno_hash text,
  password_hash_algorithm text,
  password_updated_at timestamptz,
  foto_perfil text,
  foto_hash text,
  foto_public_id text,
  foto_size integer,
  estado_trabajo text,
  estado_activo boolean not null default true,
  racha integer not null default 0,
  ultimo_check_in timestamptz,
  baneado boolean not null default false,
  eliminado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, usuario_interno)
);

create index idx_usuarios_empresa on public.usuarios(empresa_id);

-- ============================================================
-- 2. Funciones auxiliares de autorizacion (equivalentes a los
--    helpers de firestore.rules). SECURITY DEFINER para poder
--    leer public.usuarios sin recursion de RLS.
-- ============================================================

create or replace function public.rol_actual() returns text
language sql stable security definer set search_path = public as $$
  select rol from public.usuarios where id = auth.uid();
$$;

create or replace function public.empresa_actual() returns uuid
language sql stable security definer set search_path = public as $$
  select empresa_id from public.usuarios where id = auth.uid();
$$;

create or replace function public.es_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.usuarios where id = auth.uid() and rol = 'super_admin');
$$;

create or replace function public.es_admin_empresa() returns boolean
language sql stable security definer set search_path = public as $$
  select public.es_super_admin() or exists (
    select 1 from public.usuarios where id = auth.uid() and rol in ('admin','admin_empresa')
  );
$$;

create or replace function public.es_jefe() returns boolean
language sql stable security definer set search_path = public as $$
  select public.es_admin_empresa() or exists (
    select 1 from public.usuarios where id = auth.uid() and rol in ('jefe','jefe_sector')
  );
$$;

create or replace function public.es_psicologo() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.usuarios where id = auth.uid() and rol = 'psicologo');
$$;

create or replace function public.misma_empresa(p_empresa_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_empresa_id is not null
    and (public.es_super_admin() or p_empresa_id = public.empresa_actual());
$$;

create or replace function public.participa_en_conversacion(p_conversacion_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversaciones
    where id = p_conversacion_id and auth.uid() = any(participante_ids)
  );
$$;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 3. Estructura organizativa
-- ============================================================

create table public.departamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nombre text not null,
  parent_id uuid references public.departamentos(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.cargos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  departamento_id uuid references public.departamentos(id) on delete set null,
  titulo text not null,
  nivel integer not null default 1,
  created_at timestamptz not null default now()
);

create table public.sedes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nombre text not null,
  latitud numeric,
  longitud numeric,
  radio_metros integer,
  created_at timestamptz not null default now()
);

create table public.roles_personalizados (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nombre text not null,
  permisos jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.calendario_empresarial (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  titulo text not null,
  descripcion text,
  fecha_inicio timestamptz not null,
  fecha_fin timestamptz,
  tipo text,
  created_at timestamptz not null default now()
);

create table public.configuraciones_empresa (
  empresa_id uuid primary key references public.empresas(id) on delete cascade,
  configuracion jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- empresas.plan_id no lleva FK todavia: la tabla planes se crea mas abajo.
-- Se enlaza con "alter table" justo despues de crear planes.

-- ============================================================
-- 4. Gestion del trabajo
-- ============================================================

create table public.tareas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  titulo text not null,
  descripcion text,
  asignado_a uuid references public.usuarios(id) on delete set null,
  creado_por uuid references public.usuarios(id) on delete set null,
  estado text not null default 'pendiente',
  prioridad text,
  fecha_limite timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.asistencias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  entrada timestamptz,
  salida timestamptz,
  ubicacion jsonb,
  dentro_de_zona boolean,
  created_at timestamptz not null default now()
);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  estado_animo text,
  nota text,
  created_at timestamptz not null default now()
);

create table public.pausas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  inicio timestamptz not null default now(),
  fin timestamptz,
  tipo text
);

create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  inicio timestamptz not null,
  fin timestamptz,
  duracion_segundos integer,
  created_at timestamptz not null default now()
);

create table public.solicitudes_ausencia (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  tipo text not null,
  fecha_inicio date not null,
  fecha_fin date not null,
  motivo text,
  estado text not null default 'pendiente',
  resuelto_por uuid references public.usuarios(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.solicitudes_internas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  tipo text not null,
  detalle text,
  estado text not null default 'pendiente',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.incidencias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  reportado_por uuid not null references public.usuarios(id) on delete cascade,
  titulo text not null,
  descripcion text,
  estado text not null default 'abierta',
  created_at timestamptz not null default now()
);

create table public.reportes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  empleado_id uuid references public.usuarios(id) on delete set null,
  creado_por uuid references public.usuarios(id) on delete set null,
  titulo text not null,
  contenido jsonb,
  created_at timestamptz not null default now()
);

create table public.evaluaciones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  empleado_id uuid references public.usuarios(id) on delete set null,
  evaluador_id uuid references public.usuarios(id) on delete set null,
  puntaje numeric,
  comentarios text,
  created_at timestamptz not null default now()
);

create table public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  contenido text not null,
  categoria text,
  created_at timestamptz not null default now()
);

create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete set null,
  titulo text not null,
  categoria text,
  storage_path text not null,
  mime_type text,
  tamano_bytes integer,
  leido boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.archivos_cloudinary (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete set null,
  public_id text not null,
  url text not null,
  tamano_bytes integer,
  contexto text,
  created_at timestamptz not null default now()
);

create table public.inventario_activos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nombre text not null,
  categoria text,
  asignado_a uuid references public.usuarios(id) on delete set null,
  estado text not null default 'disponible',
  created_at timestamptz not null default now()
);

create table public.inventario_movimientos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  activo_id uuid references public.inventario_activos(id) on delete set null,
  tipo text not null,
  realizado_por uuid references public.usuarios(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 5. Nomina y pagos
-- ============================================================

create table public.planes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  precio numeric not null default 0,
  limites jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.empresas
  add constraint empresas_plan_id_fkey foreign key (plan_id) references public.planes(id);

create table public.suscripciones (
  empresa_id uuid primary key references public.empresas(id) on delete cascade,
  plan_id uuid references public.planes(id),
  estado text not null default 'activa',
  cancelacion_solicitada_at timestamptz,
  periodo_fin timestamptz,
  created_at timestamptz not null default now()
);

create table public.nominas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  periodo_anio integer not null,
  periodo_mes integer not null,
  salario_bruto numeric not null,
  isss_empleado numeric not null default 0,
  afp_empleado numeric not null default 0,
  renta numeric not null default 0,
  otras_deducciones numeric not null default 0,
  salario_neto numeric not null,
  estado text not null default 'borrador',
  procesado_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete set null,
  monto numeric not null,
  moneda text not null default 'USD',
  estado text not null default 'pendiente',
  metodo text,
  referencia_externa text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 6. Comunicacion
-- ============================================================

create table public.anuncios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  autor_id uuid references public.usuarios(id) on delete set null,
  titulo text not null,
  contenido text,
  created_at timestamptz not null default now()
);

create table public.conversaciones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  participante_ids uuid[] not null default '{}',
  creado_por uuid references public.usuarios(id),
  ultimo_mensaje text,
  ultimo_mensaje_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.mensajes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  conversacion_id uuid not null references public.conversaciones(id) on delete cascade,
  remitente_id uuid not null references public.usuarios(id),
  contenido text,
  leido_por uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete cascade,
  titulo text not null,
  cuerpo text,
  leida boolean not null default false,
  fecha_lectura timestamptz,
  created_at timestamptz not null default now()
);

create table public.inbox_unificado (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete cascade,
  origen text not null,
  contenido jsonb,
  created_at timestamptz not null default now()
);

create table public.chat_contextual (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  mensaje text not null,
  respuesta text,
  created_at timestamptz not null default now()
);

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  token text not null,
  plataforma text,
  created_at timestamptz not null default now(),
  unique (usuario_id, token)
);

-- ============================================================
-- 7. Bienestar / capacitacion
-- ============================================================

create table public.especialistas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nombre text not null,
  especialidad text,
  created_at timestamptz not null default now()
);

create table public.citas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  especialista text,
  fecha timestamptz not null,
  estado text not null default 'pendiente',
  notas text,
  created_at timestamptz not null default now()
);

create table public.cursos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  titulo text not null,
  descripcion text,
  contenido jsonb,
  created_at timestamptz not null default now()
);

create table public.capacitacion_avances (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  curso_id uuid not null references public.cursos(id) on delete cascade,
  empleado_id uuid not null references public.usuarios(id) on delete cascade,
  progreso numeric not null default 0,
  completado boolean not null default false,
  created_at timestamptz not null default now(),
  unique (curso_id, empleado_id)
);

create table public.respuestas_formularios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  formulario text not null,
  respuestas jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 8. Plataforma / auditoria / observabilidad
-- ============================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(id) on delete cascade,
  actor_id uuid references public.usuarios(id),
  accion text not null,
  modulo text,
  detalles text,
  target_id text,
  created_at timestamptz not null default now()
);

create table public.logs (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(id) on delete cascade,
  nivel text not null default 'info',
  mensaje text not null,
  contexto jsonb,
  created_at timestamptz not null default now()
);

create table public.logs_auditoria (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(id) on delete cascade,
  actor_id uuid references public.usuarios(id),
  accion text not null,
  detalles jsonb,
  created_at timestamptz not null default now()
);

create table public.sensitive_change_history (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(id) on delete cascade,
  actor_id uuid references public.usuarios(id),
  entidad text not null,
  entidad_id text,
  cambios jsonb,
  created_at timestamptz not null default now()
);

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(id) on delete cascade,
  usuario_id uuid references public.usuarios(id),
  modelo text,
  tokens_entrada integer default 0,
  tokens_salida integer default 0,
  created_at timestamptz not null default now()
);

create table public.ai_usage_daily (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(id) on delete cascade,
  fecha date not null,
  tokens_totales bigint not null default 0,
  costo_estimado numeric not null default 0,
  unique (empresa_id, fecha)
);

create table public.backup_jobs (
  id uuid primary key default gen_random_uuid(),
  estado text not null default 'pendiente',
  detalles jsonb,
  created_at timestamptz not null default now()
);

create table public.support_sessions (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(id) on delete cascade,
  admin_id uuid references public.usuarios(id),
  usuario_impersonado uuid references public.usuarios(id),
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  expira_at timestamptz
);

create table public.auth_rate_limits (
  clave text primary key,
  intentos integer not null default 0,
  bloqueado_hasta timestamptz,
  updated_at timestamptz not null default now()
);

create table public.upload_rate_limits (
  usuario_id uuid primary key references public.usuarios(id) on delete cascade,
  cantidad integer not null default 0,
  ventana_inicio timestamptz not null default now()
);

create table public.plataforma_config (
  clave text primary key,
  valor jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

commit;
