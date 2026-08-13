-- Nexxus: corrige dos bugs encontrados al probar sa-delete-company de punta a punta:
--
-- 1) usuarios.empresa_id tenia "on delete set null" en vez de "on delete
--    cascade" -- borrar una empresa dejaba a sus usuarios huerfanos (con
--    empresa_id null) en vez de borrarlos, rompiendo la cascada en la que
--    se apoyan sa-delete-company/sa-delete-user (Fase 2).
--
-- 2) esa misma actualizacion en cascada (UPDATE en el caso anterior, o
--    cualquier escritura desde una Edge Function con el cliente
--    service_role) disparaba el trigger usuarios_bloquear_autoedicion, que
--    asume que siempre hay un auth.uid() de un usuario autenticado -- bajo
--    service_role auth.uid() es null, y el trigger lo interpretaba como "un
--    desconocido intentando editar la fila de otro" y la bloqueaba. El
--    trigger debe limitarse a la sesion de un usuario real (RLS), nunca a
--    escrituras administrativas server-side.

begin;

alter table public.usuarios drop constraint usuarios_empresa_id_fkey;
alter table public.usuarios
  add constraint usuarios_empresa_id_fkey foreign key (empresa_id)
  references public.empresas(id) on delete cascade;

create or replace function public.usuarios_bloquear_autoedicion() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  campos_permitidos text[] := array[
    'nombre','foto_hash','foto_perfil','foto_public_id','foto_size','telefono',
    'estado_trabajo','updated_at','ultimo_check_in','racha','estado_activo'
  ];
  campo text;
begin
  if auth.uid() is null then
    return new; -- escritura administrativa (service_role / cascada), no sujeta a esta regla
  end if;
  if public.es_super_admin() or public.es_admin_empresa() then
    return new;
  end if;
  if new.id <> auth.uid() then
    raise exception 'No autorizado';
  end if;
  foreach campo in array (
    select array_agg(key) from jsonb_each(to_jsonb(new)) k(key, value)
    where to_jsonb(new) -> key is distinct from to_jsonb(old) -> key
  )
  loop
    if not (campo = any(campos_permitidos)) then
      raise exception 'Campo % no editable por el propio usuario', campo;
    end if;
  end loop;
  return new;
end;
$$;

-- Mismo bug potencial en los otros tres triggers de restriccion de campos
-- (conversaciones/mensajes/notificaciones): tambien asumian auth.uid() no
-- nulo. Se corrigen aqui aunque el caso de prueba que lo disparo fue el de
-- usuarios, para no dejar la misma trampa para cuando una Edge Function
-- actualice alguna de estas tres tablas.
create or replace function public.conversaciones_restringir_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if public.es_jefe() or old.creado_por = auth.uid() then
    return new;
  end if;
  if new.participante_ids is distinct from old.participante_ids
     or new.empresa_id is distinct from old.empresa_id
     or new.creado_por is distinct from old.creado_por then
    raise exception 'Solo se puede actualizar el ultimo mensaje';
  end if;
  return new;
end;
$$;

create or replace function public.mensajes_restringir_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if public.es_jefe() then
    return new;
  end if;
  if new.contenido is distinct from old.contenido
     or new.remitente_id is distinct from old.remitente_id
     or new.conversacion_id is distinct from old.conversacion_id
     or not (new.leido_por @> old.leido_por)
     or not (auth.uid() = any(new.leido_por)) then
    raise exception 'Solo se puede marcar el mensaje como leido';
  end if;
  return new;
end;
$$;

create or replace function public.notificaciones_restringir_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if public.es_jefe() then
    return new;
  end if;
  if new.titulo is distinct from old.titulo
     or new.cuerpo is distinct from old.cuerpo
     or new.usuario_id is distinct from old.usuario_id
     or new.empresa_id is distinct from old.empresa_id then
    raise exception 'Solo se puede marcar la notificacion como leida';
  end if;
  return new;
end;
$$;

commit;
