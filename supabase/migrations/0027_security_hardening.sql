-- Refuerza políticas ya desplegadas sin reescribir migraciones históricas.

-- Los tickets de soporte solo son visibles por su creador y por jefatura del mismo tenant.
drop policy if exists tickets_select on public.tickets;
create policy tickets_select on public.tickets
  for select using (creado_por = auth.uid() or (misma_empresa(empresa_id) and es_jefe()));

drop policy if exists ticket_mensajes_select on public.ticket_mensajes;
create policy ticket_mensajes_select on public.ticket_mensajes
  for select using (ticket_creado_por = auth.uid() or (misma_empresa(empresa_id) and es_jefe()));

drop policy if exists ticket_mensajes_insert on public.ticket_mensajes;
create policy ticket_mensajes_insert on public.ticket_mensajes
  for insert with check (
    autor_id = auth.uid()
    and exists (
      select 1
      from public.tickets
      where tickets.id = ticket_mensajes.ticket_id
        and tickets.empresa_id = ticket_mensajes.empresa_id
        and tickets.creado_por = ticket_mensajes.ticket_creado_por
        and (tickets.creado_por = auth.uid() or (misma_empresa(tickets.empresa_id) and es_jefe()))
    )
  );

-- No se permite insertar logros desde el cliente: los umbrales se verifican con datos del servidor.
drop policy if exists logros_usuario_insert on public.logros_usuario;

create or replace function public.sincronizar_logros_elegibles()
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_empresa_id uuid;
  v_tareas_completadas integer;
  v_cursos_completados integer;
  v_racha_checkins integer;
  v_codigos text[] := '{}';
  v_nuevos text[];
begin
  if v_usuario_id is null then
    raise exception 'Usuario no autenticado';
  end if;

  select empresa_id into v_empresa_id
  from public.usuarios
  where id = v_usuario_id and baneado = false and eliminado = false;
  if v_empresa_id is null then
    raise exception 'Usuario sin acceso';
  end if;

  select count(*) into v_tareas_completadas
  from public.tareas
  where empresa_id = v_empresa_id and asignado_a = v_usuario_id and estado = 'completada';

  select count(*) into v_cursos_completados
  from public.capacitacion_avances
  where empresa_id = v_empresa_id and empleado_id = v_usuario_id and completado = true;

  with recursive racha(dia) as (
    select current_date
    where exists (
      select 1 from public.checkins
      where empresa_id = v_empresa_id and usuario_id = v_usuario_id and created_at::date = current_date
    )
    union all
    select dia - 1
    from racha
    where exists (
      select 1 from public.checkins
      where empresa_id = v_empresa_id and usuario_id = v_usuario_id and created_at::date = racha.dia - 1
    )
  )
  select count(*) into v_racha_checkins from racha;

  if v_racha_checkins >= 7 then v_codigos := array_append(v_codigos, 'racha_7'); end if;
  if v_racha_checkins >= 30 then v_codigos := array_append(v_codigos, 'racha_30'); end if;
  if v_tareas_completadas >= 10 then v_codigos := array_append(v_codigos, 'tareas_10'); end if;
  if v_tareas_completadas >= 50 then v_codigos := array_append(v_codigos, 'tareas_50'); end if;
  if v_cursos_completados >= 1 then v_codigos := array_append(v_codigos, 'cursos_1'); end if;
  if v_cursos_completados >= 5 then v_codigos := array_append(v_codigos, 'cursos_5'); end if;

  with insertados as (
    insert into public.logros_usuario (usuario_id, empresa_id, codigo_logro)
    select v_usuario_id, v_empresa_id, codigo from unnest(v_codigos) as codigo
    on conflict (usuario_id, codigo_logro) do nothing
    returning codigo_logro
  )
  select coalesce(array_agg(codigo_logro), '{}') into v_nuevos from insertados;

  return v_nuevos;
end;
$$;

revoke all on function public.sincronizar_logros_elegibles() from public;
grant execute on function public.sincronizar_logros_elegibles() to authenticated;
