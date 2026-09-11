alter table public.suscripciones
  add column if not exists plan_id_pendiente uuid references public.planes(id),
  add column if not exists cambio_plan_solicitado_at timestamptz;

create index if not exists suscripciones_plan_pendiente_idx
  on public.suscripciones(plan_id_pendiente)
  where plan_id_pendiente is not null;
