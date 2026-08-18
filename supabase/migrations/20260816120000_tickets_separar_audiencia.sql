-- La tabla tickets la comparten 3 flujos sin ninguna columna que distinga audiencia:
-- empleado -> admin de su empresa (helpdesk interno) y admin de empresa -> equipo Nexxus
-- (soporte de plataforma). Sin esta columna, la cola global del super admin
-- (subscribeSupportTickets, sin filtro) mezclaba tickets internos de cada empresa, y la
-- pantalla "Soporte de empresa" del admin mostraba también los tickets internos de sus
-- propios empleados.
alter table public.tickets
  add column if not exists canal text not null default 'interno';

alter table public.tickets
  add constraint tickets_canal_check check (canal in ('interno', 'plataforma'));

comment on column public.tickets.canal is
  'interno = ticket de un empleado hacia el admin de su empresa. plataforma = ticket de un admin de empresa hacia el equipo de soporte de Nexxus.';

create index if not exists idx_tickets_canal on public.tickets(canal);
create index if not exists idx_tickets_empresa_canal on public.tickets(empresa_id, canal);

-- Backfill de los 2 tickets existentes: el de "QA Empleado Uno" es un reporte interno
-- (ticket 9a747dc2...); el de "Bryan Hernandez" con prefijo "[Incidencia técnica]" viene
-- del formulario de empresa-soporte/index.tsx (admin -> Nexxus).
update public.tickets set canal = 'plataforma' where id = '02ee2df6-bba1-47e0-8e58-8b90e1f9ca9e';
