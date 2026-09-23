-- Permite a los administradores eliminar marcajes geográficos y sus registros asociados de forma segura.
begin;

grant delete on public.eventos_geograficos_asistencia to authenticated;

drop policy if exists eventos_geo_delete on public.eventos_geograficos_asistencia;
create policy eventos_geo_delete on public.eventos_geograficos_asistencia for delete to authenticated
  using (public.misma_empresa(empresa_id) and public.es_admin_empresa());

create or replace function public.eliminar_evento_geografico_asistencia(p_evento_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_evento public.eventos_geograficos_asistencia%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida' using errcode = '28000';
  end if;

  select * into v_evento from public.eventos_geograficos_asistencia where id = p_evento_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'Marcaje no encontrado');
  end if;

  -- Solo administradores de la misma empresa pueden eliminar
  if not (public.misma_empresa(v_evento.empresa_id) and public.es_admin_empresa()) then
    raise exception 'No autorizado para eliminar este marcaje' using errcode = '42501';
  end if;

  -- 1. Eliminar alertas asociadas al evento si existían
  delete from public.notificaciones
  where tipo = 'asistencia_geolocalizacion'
    and datos->>'evento_geografico_id' = p_evento_id::text;

  -- 2. Eliminar la asistencia física vinculada si existía
  if v_evento.asistencia_id is not null then
    delete from public.asistencias where id = v_evento.asistencia_id;
  end if;

  -- 3. Eliminar el evento geográfico
  delete from public.eventos_geograficos_asistencia where id = p_evento_id;

  return jsonb_build_object('success', true, 'evento_id', p_evento_id);
end; $$;

revoke execute on function public.eliminar_evento_geografico_asistencia(uuid) from public, anon;
grant execute on function public.eliminar_evento_geografico_asistencia(uuid) to authenticated;

commit;
notify pgrst, 'reload schema';
