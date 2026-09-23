-- Fix task completion notifications:
-- 1. Reset completion metadata when task transitions away from 'completada'.
-- 2. Ensure each completion receives a fresh timestamp via clock_timestamp().
-- 3. Use ON CONFLICT DO NOTHING on tarea_finalizaciones to prevent duplicate key errors.
-- 4. Authorize super_admin users whose empresa_id may be null or system-wide.
-- 5. Safe guard department check when departamento_id is null.

create or replace function public.tareas_notificar_finalizacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor public.usuarios%rowtype;
  v_evento_id uuid;
  v_evento_clave text;
  v_contexto text;
  v_destinatario record;
begin
  -- Si el nuevo estado no es completada, limpiar metadatos de finalización si antes estaba completada
  if new.estado is distinct from 'completada' then
    if old.estado = 'completada' then
      new.completada_en := null;
      new.completada_por := null;
    end if;
    return new;
  end if;

  -- Si ya estaba completada y no cambió de estado, no reenviar notificaciones
  if old.estado is not distinct from 'completada' then
    return new;
  end if;

  if v_actor_id is null then
    raise exception 'No se pudo identificar a quien completó la tarea';
  end if;

  select * into v_actor
  from public.usuarios
  where id = v_actor_id
    and (empresa_id = new.empresa_id or rol = 'super_admin')
    and estado_activo
    and not eliminado;

  if not found then
    raise exception 'No autorizado para completar esta tarea';
  end if;

  new.completada_en := clock_timestamp();
  new.completada_por := v_actor_id;

  insert into public.tarea_finalizaciones (tarea_id, empresa_id, completada_por, completada_en)
  values (new.id, new.empresa_id, v_actor_id, new.completada_en)
  on conflict (tarea_id, completada_en) do nothing
  returning id into v_evento_id;

  if v_evento_id is null then
    select id into v_evento_id
    from public.tarea_finalizaciones
    where tarea_id = new.id and completada_en = new.completada_en;
  end if;

  v_evento_clave := 'task-completed:' || coalesce(v_evento_id::text, gen_random_uuid()::text);
  v_contexto := coalesce(
    nullif(new.datos ->> 'proyecto', ''),
    nullif(new.datos ->> 'equipo', ''),
    nullif(new.datos ->> 'sucursal', ''),
    nullif(new.datos ->> 'sede', '')
  );

  perform set_config('app.task_completion_notification', 'on', true);

  for v_destinatario in
    select distinct u.id
    from public.usuarios u
    where u.empresa_id = new.empresa_id
      and u.estado_activo
      and not u.eliminado
      and u.id <> v_actor_id
      and (
        u.rol in ('admin', 'admin_empresa')
        or u.id = new.creado_por
        or u.id = v_actor.jefe_id
        or (
          v_actor.departamento_id is not null
          and exists (
            select 1
            from public.departamentos d
            where d.id = v_actor.departamento_id
              and d.empresa_id = new.empresa_id
              and d.jefe_id = u.id
          )
        )
      )
  loop
    insert into public.notificaciones (
      empresa_id, usuario_id, titulo, cuerpo, tipo, prioridad, datos, leida, evento_clave
    ) values (
      new.empresa_id,
      v_destinatario.id,
      'Tarea completada',
      format('%s ha completado la tarea "%s".%s', v_actor.nombre, new.titulo,
        case when v_contexto is null then '' else ' · ' || v_contexto end),
      'tarea',
      'media',
      jsonb_strip_nulls(jsonb_build_object(
        'evento_id', v_evento_id,
        'evento_clave', v_evento_clave,
        'tarea_id', new.id,
        'empleado_id', v_actor.id,
        'empleado_nombre', v_actor.nombre,
        'empleado_avatar', v_actor.foto_perfil,
        'completada_en', new.completada_en,
        'proyecto_equipo_sede', v_contexto,
        'destino', 'Tareas'
      )),
      false,
      v_evento_clave
    ) on conflict (usuario_id, evento_clave) where evento_clave is not null do nothing;
  end loop;

  return new;
end;
$$;
