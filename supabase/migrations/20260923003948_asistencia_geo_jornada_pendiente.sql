-- Un fichaje fuera de geocerca conserva una jornada pendiente para que el reloj
-- siga visible, pero nunca se presenta como asistencia aprobada.
create or replace function public.alertar_evento_geo_pendiente() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_nombre text;
begin
  if new.estado_validacion not in ('fuera_de_zona', 'sin_geocerca') then return new; end if;
  select nombre into v_nombre from public.usuarios where id = new.usuario_id;
  insert into public.notificaciones (empresa_id, usuario_id, titulo, cuerpo, tipo, prioridad, datos)
  values (
    new.empresa_id, new.usuario_id, 'Alerta crítica de asistencia',
    case when new.estado_validacion = 'sin_geocerca'
      then 'Un colaborador intentó registrar asistencia sin una ubicación autorizada configurada.'
      else 'Un colaborador intentó registrar asistencia fuera de la zona autorizada.' end,
    'asistencia_geolocalizacion', 'critica',
    jsonb_build_object('evento_geografico_id', new.id, 'tipo_evento', new.tipo_evento, 'sede_id', new.sede_id, 'distancia_m', case when new.distancia_m is null then null else round(new.distancia_m)::integer end, 'precision_m', round(coalesce(new.precision_horizontal_m, 0))::integer, 'empleado', v_nombre)
  ) on conflict ((datos->>'evento_geografico_id')) where tipo = 'asistencia_geolocalizacion' and resuelta = false do nothing;
  return new;
end; $$;
drop trigger if exists trg_evento_geo_alerta_pendiente on public.eventos_geograficos_asistencia;
create trigger trg_evento_geo_alerta_pendiente after insert on public.eventos_geograficos_asistencia
for each row execute function public.alertar_evento_geo_pendiente();

-- El trigger reemplaza la alerta inline original y evita duplicados por evento.
create or replace function public.registrar_asistencia_geolocalizada(
  p_tipo text, p_latitud double precision, p_longitud double precision, p_precision_m double precision,
  p_captured_at timestamptz, p_idempotency_key uuid, p_proveedor jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_usuario public.usuarios%rowtype; v_ubicacion public.ubicaciones_asistencia%rowtype; v_evento public.eventos_geograficos_asistencia%rowtype; v_asistencia_id uuid; v_distancia double precision; v_estado text; v_revision text := 'no_requiere'; v_max_precision constant double precision := 100;
begin
  if auth.uid() is null then raise exception 'Sesión requerida' using errcode = '28000'; end if;
  if p_tipo not in ('entrada','salida') or p_latitud not between -90 and 90 or p_longitud not between -180 and 180 or p_precision_m is null or p_precision_m < 0 then raise exception 'Lectura GPS inválida' using errcode = '22023'; end if;
  if p_captured_at < now() - interval '5 minutes' or p_captured_at > now() + interval '1 minute' then raise exception 'La ubicación debe ser reciente' using errcode = '22023'; end if;
  select * into v_usuario from public.usuarios where id = auth.uid() and estado_activo and not baneado and not eliminado;
  if not found or v_usuario.empresa_id is null then raise exception 'Usuario no autorizado para fichar' using errcode = '42501'; end if;
  select * into v_evento from public.eventos_geograficos_asistencia where usuario_id = auth.uid() and idempotency_key = p_idempotency_key;
  if found then return jsonb_build_object('evento_id',v_evento.id,'asistencia_id',v_evento.asistencia_id,'estado',v_evento.estado_validacion,'duplicado',true); end if;
  select * into v_ubicacion from public.ubicaciones_asistencia where empresa_id=v_usuario.empresa_id and sede_id=v_usuario.sede_id and activa and p_tipo=any(tipos_evento) order by es_predeterminada desc, created_at asc limit 1;
  if not found then v_estado := 'sin_geocerca'; v_revision := 'pendiente'; elsif p_precision_m > v_max_precision then v_estado := 'precision_insuficiente'; v_revision := 'pendiente'; else v_distancia := extensions.st_distance(extensions.st_setsrid(extensions.st_makepoint(p_longitud,p_latitud),4326)::extensions.geography,extensions.st_setsrid(extensions.st_makepoint(v_ubicacion.longitud,v_ubicacion.latitud),4326)::extensions.geography); if v_distancia-p_precision_m>v_ubicacion.radio_metros then v_estado:='fuera_de_zona';v_revision:='pendiente'; elsif v_distancia+p_precision_m>v_ubicacion.radio_metros then v_estado:='precision_insuficiente';v_revision:='pendiente'; else v_estado:='validado'; end if; end if;
  if p_tipo='entrada' and exists(select 1 from public.asistencias a where a.usuario_id=auth.uid() and a.tipo='entrada' and coalesce(a.fecha_jornada,a.created_at::date)=current_date and not exists(select 1 from public.asistencias s where s.usuario_id=auth.uid() and s.tipo='salida' and coalesce(s.fecha_jornada,s.created_at::date)=current_date)) then raise exception 'Ya existe una jornada activa' using errcode='23505'; end if;
  if p_tipo='salida' and not exists(select 1 from public.asistencias where usuario_id=auth.uid() and tipo='entrada' and coalesce(fecha_jornada,created_at::date)=current_date) then raise exception 'No existe una entrada activa para cerrar' using errcode='23505'; end if;
  insert into public.asistencias(empresa_id,usuario_id,tipo,fecha_jornada,metodo_registro,estado_aprobacion) values(v_usuario.empresa_id,auth.uid(),p_tipo,current_date,'movil',case when v_estado='validado' then 'aprobado' else 'pendiente' end) returning id into v_asistencia_id;
  insert into public.eventos_geograficos_asistencia(empresa_id,usuario_id,sede_id,asistencia_id,ubicacion_autorizada_id,tipo_evento,latitud,longitud,precision_horizontal_m,captured_at,proveedor,distancia_m,estado_validacion,estado_revision,idempotency_key) values(v_usuario.empresa_id,auth.uid(),v_usuario.sede_id,v_asistencia_id,v_ubicacion.id,p_tipo,p_latitud,p_longitud,p_precision_m,p_captured_at,coalesce(p_proveedor,'{}'::jsonb),v_distancia,v_estado,v_revision,p_idempotency_key) returning * into v_evento;
  return jsonb_build_object('evento_id',v_evento.id,'asistencia_id',v_asistencia_id,'estado',v_estado,'distancia_m',v_distancia,'radio_metros',v_ubicacion.radio_metros,'precision_m',p_precision_m,'duplicado',false);
end; $$;
notify pgrst, 'reload schema';
