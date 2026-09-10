-- Evita que una actualización sin campos modificados falle con
-- "FOREACH expression must not be null".
create or replace function public.usuarios_bloquear_autoedicion() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  campos_permitidos text[] := array[
    'nombre','foto_hash','foto_perfil','foto_public_id','foto_size','telefono',
    'estado_trabajo','updated_at','ultimo_check_in','racha','estado_activo'
  ];
  campos_modificados text[];
  campo text;
begin
  -- Las escrituras administrativas no tienen auth.uid() y no pasan por esta restricción.
  if auth.uid() is null then
    return new;
  end if;
  if public.es_super_admin() or public.es_admin_empresa() then
    return new;
  end if;
  if new.id <> auth.uid() then
    raise exception 'No autorizado';
  end if;

  select coalesce(array_agg(key), array[]::text[])
    into campos_modificados
    from jsonb_each(to_jsonb(new)) as k(key, value)
   where to_jsonb(new) -> key is distinct from to_jsonb(old) -> key;

  foreach campo in array campos_modificados loop
    if not (campo = any(campos_permitidos)) then
      raise exception 'Campo % no editable por el propio usuario', campo;
    end if;
  end loop;
  return new;
end;
$$;
