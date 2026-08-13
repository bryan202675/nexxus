-- Nexxus: ajustes de esquema descubiertos al escribir las Edge Functions de
-- la Fase 2 (columnas que la Fase 0 no prevaeia).

begin;

alter table public.capacitacion_avances
  add column if not exists progreso_modulos integer[] not null default '{}',
  add column if not exists updated_at timestamptz not null default now();

alter table public.archivos_cloudinary
  add column if not exists kind text,
  add column if not exists document_user_id uuid references public.usuarios(id) on delete set null,
  add column if not exists titulo text,
  add column if not exists hash text,
  add column if not exists mime text,
  add column if not exists resource_type text not null default 'image',
  add column if not exists activo boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

commit;
