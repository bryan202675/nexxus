-- Fase A (modulo empleado): columnas reales para el "perfil laboral extendido" que hoy vive
-- declarado en el tipo User pero sin columna en Supabase (kpis, habilidades, historial_laboral,
-- certificaciones, horario_laboral quedan siempre undefined -- ver comentario en mappers.ts).
-- dias_vacaciones_disponibles NO se guarda como columna: se calcula en tiempo real a partir de
-- fecha_ingreso (Codigo de Trabajo de El Salvador, Art. 177: 15 dias habiles/ano, proporcional si
-- lleva menos de un ano) menos las vacaciones ya aprobadas del periodo -- un numero guardado se
-- desincroniza solo, un numero calculado nunca miente.

alter table public.usuarios
  add column if not exists fecha_ingreso date,
  add column if not exists horario_laboral text,
  add column if not exists kpis jsonb not null default '[]'::jsonb,
  add column if not exists habilidades text[] not null default '{}'::text[],
  add column if not exists historial_laboral jsonb not null default '[]'::jsonb,
  add column if not exists certificaciones text[] not null default '{}'::text[];

-- Backfill: para empleados ya existentes sin fecha_ingreso, usar la fecha de alta en el sistema
-- como mejor aproximacion disponible -- editable despues por un admin si el ingreso real fue antes.
update public.usuarios
set fecha_ingreso = created_at::date
where fecha_ingreso is null;

comment on column public.usuarios.fecha_ingreso is 'Fecha de ingreso real a la empresa -- usada para antiguedad y calculo de vacaciones. Editable por admin, no siempre igual a created_at.';
comment on column public.usuarios.kpis is 'Array de {nombre, valor, meta, unidad} -- indicadores de desempeno asignados por el jefe/admin.';
comment on column public.usuarios.historial_laboral is 'Array de {puesto, fecha, accion} -- historial de cambios de puesto/rol.';
