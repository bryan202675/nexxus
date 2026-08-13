-- Nexxus: Row Level Security equivalente a nexxus/firestore.rules

begin;
set local check_function_bodies = off;

-- ============================================================
-- Triggers de mantenimiento
-- ============================================================

create trigger trg_empresas_updated_at before update on public.empresas
  for each row execute function public.set_updated_at();
create trigger trg_usuarios_updated_at before update on public.usuarios
  for each row execute function public.set_updated_at();
create trigger trg_tareas_updated_at before update on public.tareas
  for each row execute function public.set_updated_at();
create trigger trg_config_empresa_updated_at before update on public.configuraciones_empresa
  for each row execute function public.set_updated_at();

-- Bloquea que un empleado normal, al auto-editar su fila de usuarios,
-- toque campos sensibles (rol, empresa_id, baneado, hash de password...).
-- Equivalente a usuarioAutoUpdateSeguro() en firestore.rules.
create or replace function public.usuarios_bloquear_autoedicion() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  campos_permitidos text[] := array[
    'nombre','foto_hash','foto_perfil','foto_public_id','foto_size','telefono',
    'estado_trabajo','updated_at','ultimo_check_in','racha','estado_activo'
  ];
  campo text;
begin
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

create trigger trg_usuarios_autoedicion before update on public.usuarios
  for each row execute function public.usuarios_bloquear_autoedicion();

-- Equivalente a soloActualizaUltimoMensaje(): un participante sin rango de
-- jefe/creador solo puede tocar ultimo_mensaje/ultimo_mensaje_at.
create or replace function public.conversaciones_restringir_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
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

create trigger trg_conversaciones_restringir_update before update on public.conversaciones
  for each row execute function public.conversaciones_restringir_update();

-- Equivalente a soloActualizaLecturaMensaje(): un participante que no es
-- jefe/admin solo puede agregar su propio id a leido_por.
create or replace function public.mensajes_restringir_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
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

create trigger trg_mensajes_restringir_update before update on public.mensajes
  for each row execute function public.mensajes_restringir_update();

-- Equivalente a la restriccion de notificaciones: el dueno solo puede tocar
-- leida/fecha_lectura (los jefes pueden todo, via chequeo en la policy).
create or replace function public.notificaciones_restringir_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
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

create trigger trg_notificaciones_restringir_update before update on public.notificaciones
  for each row execute function public.notificaciones_restringir_update();

-- ============================================================
-- Activar RLS en todas las tablas
-- ============================================================

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ============================================================
-- empresas
-- ============================================================
create policy empresas_select on public.empresas for select
  using (auth.uid() is not null);
create policy empresas_insert on public.empresas for insert
  with check (public.es_super_admin() or admin_id = auth.uid());
create policy empresas_update on public.empresas for update
  using (public.es_super_admin() or (public.misma_empresa(id) and public.es_admin_empresa()));
create policy empresas_delete on public.empresas for delete
  using (public.es_super_admin());

-- ============================================================
-- usuarios (+ subordinadas simples)
-- ============================================================
create policy usuarios_select on public.usuarios for select
  using (id = auth.uid() or public.es_super_admin() or public.misma_empresa(empresa_id));
create policy usuarios_insert on public.usuarios for insert
  with check (
    (id = auth.uid() or (public.es_admin_empresa() and public.misma_empresa(empresa_id)))
    and (rol <> 'super_admin' or public.es_super_admin())
  );
create policy usuarios_update on public.usuarios for update
  using (
    public.es_super_admin() or id = auth.uid()
    or (public.es_admin_empresa() and public.misma_empresa(empresa_id))
  )
  with check (rol <> 'super_admin' or public.es_super_admin());
create policy usuarios_delete on public.usuarios for delete
  using (public.es_super_admin() or (public.es_admin_empresa() and public.misma_empresa(empresa_id)));

-- ============================================================
-- Helper: aplica el patron estandar "tenant + jefe" a una lista de tablas
-- (select: misma_empresa; insert/update/delete: misma_empresa + es_jefe)
-- ============================================================
do $$
declare
  tabla text;
  tablas text[] := array[
    'departamentos','cargos','sedes','calendario_empresarial','anuncios',
    'especialistas'
  ];
begin
  foreach tabla in array tablas loop
    execute format($p$
      create policy %1$s_select on public.%1$I for select
        using (public.misma_empresa(empresa_id));
      create policy %1$s_insert on public.%1$I for insert
        with check (public.misma_empresa(empresa_id) and public.es_jefe());
      create policy %1$s_update on public.%1$I for update
        using (public.misma_empresa(empresa_id) and public.es_jefe());
      create policy %1$s_delete on public.%1$I for delete
        using (public.misma_empresa(empresa_id) and public.es_jefe());
    $p$, tabla);
  end loop;
end $$;

-- ============================================================
-- Helper: patron "tenant + admin_empresa" (mas estricto que jefe)
-- ============================================================
do $$
declare
  tabla text;
  tablas text[] := array['roles_personalizados','cursos'];
begin
  foreach tabla in array tablas loop
    execute format($p$
      create policy %1$s_select on public.%1$I for select
        using (public.misma_empresa(empresa_id));
      create policy %1$s_insert on public.%1$I for insert
        with check (public.misma_empresa(empresa_id) and public.es_admin_empresa());
      create policy %1$s_update on public.%1$I for update
        using (public.misma_empresa(empresa_id) and public.es_admin_empresa());
      create policy %1$s_delete on public.%1$I for delete
        using (public.misma_empresa(empresa_id) and public.es_admin_empresa());
    $p$, tabla);
  end loop;
end $$;

-- configuraciones_empresa usa empresa_id como PK, no como columna FK simple
create policy config_empresa_select on public.configuraciones_empresa for select
  using (public.misma_empresa(empresa_id));
create policy config_empresa_insert on public.configuraciones_empresa for insert
  with check (public.misma_empresa(empresa_id) and public.es_admin_empresa());
create policy config_empresa_update on public.configuraciones_empresa for update
  using (public.misma_empresa(empresa_id) and public.es_admin_empresa());
create policy config_empresa_delete on public.configuraciones_empresa for delete
  using (public.misma_empresa(empresa_id) and public.es_admin_empresa());

-- ============================================================
-- tareas
-- ============================================================
create policy tareas_select on public.tareas for select
  using (public.misma_empresa(empresa_id) or asignado_a = auth.uid());
create policy tareas_insert on public.tareas for insert
  with check (public.misma_empresa(empresa_id) and public.es_jefe());
create policy tareas_update on public.tareas for update
  using ((public.misma_empresa(empresa_id) and public.es_jefe()) or asignado_a = auth.uid());
create policy tareas_delete on public.tareas for delete
  using (public.misma_empresa(empresa_id) and public.es_jefe());

-- ============================================================
-- asistencias / checkins
-- ============================================================
create policy asistencias_select on public.asistencias for select
  using (public.misma_empresa(empresa_id) or usuario_id = auth.uid());
create policy asistencias_insert on public.asistencias for insert
  with check (public.misma_empresa(empresa_id) and usuario_id = auth.uid());
create policy asistencias_update on public.asistencias for update
  using (public.misma_empresa(empresa_id) and (public.es_jefe() or usuario_id = auth.uid()));
create policy asistencias_delete on public.asistencias for delete
  using (public.misma_empresa(empresa_id) and public.es_jefe());

create policy checkins_select on public.checkins for select
  using (public.misma_empresa(empresa_id) or usuario_id = auth.uid());
create policy checkins_insert on public.checkins for insert
  with check (public.misma_empresa(empresa_id) and usuario_id = auth.uid());
create policy checkins_update on public.checkins for update
  using (public.misma_empresa(empresa_id) and public.es_jefe());
create policy checkins_delete on public.checkins for delete
  using (public.misma_empresa(empresa_id) and public.es_jefe());

-- ============================================================
-- pausas / focus_sessions (100% personales)
-- ============================================================
do $$
declare
  tabla text;
  tablas text[] := array['pausas','focus_sessions'];
begin
  foreach tabla in array tablas loop
    execute format($p$
      create policy %1$s_select on public.%1$I for select using (usuario_id = auth.uid());
      create policy %1$s_insert on public.%1$I for insert with check (usuario_id = auth.uid());
      create policy %1$s_update on public.%1$I for update using (usuario_id = auth.uid());
      create policy %1$s_delete on public.%1$I for delete using (usuario_id = auth.uid());
    $p$, tabla);
  end loop;
end $$;

-- ============================================================
-- solicitudes_ausencia
-- ============================================================
create policy sol_ausencia_select on public.solicitudes_ausencia for select
  using (public.misma_empresa(empresa_id) or usuario_id = auth.uid());
create policy sol_ausencia_insert on public.solicitudes_ausencia for insert
  with check (public.misma_empresa(empresa_id) and usuario_id = auth.uid());
create policy sol_ausencia_update on public.solicitudes_ausencia for update
  using ((public.misma_empresa(empresa_id) and public.es_jefe()) or usuario_id = auth.uid());
create policy sol_ausencia_delete on public.solicitudes_ausencia for delete
  using (
    public.es_super_admin()
    or (public.misma_empresa(empresa_id) and public.es_admin_empresa())
    or usuario_id = auth.uid()
  );

-- ============================================================
-- solicitudes_internas
-- ============================================================
create policy sol_internas_select on public.solicitudes_internas for select
  using (public.misma_empresa(empresa_id) or usuario_id = auth.uid());
create policy sol_internas_insert on public.solicitudes_internas for insert
  with check (public.misma_empresa(empresa_id) and usuario_id = auth.uid());
create policy sol_internas_update on public.solicitudes_internas for update
  using ((public.misma_empresa(empresa_id) and public.es_jefe()) or usuario_id = auth.uid());
create policy sol_internas_delete on public.solicitudes_internas for delete
  using (public.misma_empresa(empresa_id) and public.es_admin_empresa());

-- ============================================================
-- incidencias
-- ============================================================
create policy incidencias_select on public.incidencias for select
  using (public.misma_empresa(empresa_id) or reportado_por = auth.uid());
create policy incidencias_insert on public.incidencias for insert
  with check (public.misma_empresa(empresa_id) and reportado_por = auth.uid());
create policy incidencias_update on public.incidencias for update
  using (public.misma_empresa(empresa_id) and public.es_jefe());
create policy incidencias_delete on public.incidencias for delete
  using (public.es_super_admin() or (public.misma_empresa(empresa_id) and public.es_admin_empresa()));

-- ============================================================
-- reportes / evaluaciones
-- ============================================================
create policy reportes_select on public.reportes for select
  using (public.misma_empresa(empresa_id) or empleado_id = auth.uid() or creado_por = auth.uid());
create policy reportes_insert on public.reportes for insert
  with check (public.misma_empresa(empresa_id) and public.es_jefe());
create policy reportes_update on public.reportes for update
  using (public.misma_empresa(empresa_id) and public.es_jefe());
create policy reportes_delete on public.reportes for delete
  using (public.es_super_admin() or (public.misma_empresa(empresa_id) and public.es_admin_empresa()));

create policy evaluaciones_select on public.evaluaciones for select
  using (public.misma_empresa(empresa_id) or empleado_id = auth.uid() or evaluador_id = auth.uid());
create policy evaluaciones_insert on public.evaluaciones for insert
  with check (public.misma_empresa(empresa_id) and public.es_jefe());
create policy evaluaciones_update on public.evaluaciones for update
  using (public.misma_empresa(empresa_id) and public.es_jefe());
create policy evaluaciones_delete on public.evaluaciones for delete
  using (public.es_super_admin() or (public.misma_empresa(empresa_id) and public.es_admin_empresa()));

-- ============================================================
-- feedbacks
-- ============================================================
create policy feedbacks_select on public.feedbacks for select
  using (usuario_id = auth.uid() or public.misma_empresa(empresa_id));
create policy feedbacks_insert on public.feedbacks for insert
  with check (usuario_id = auth.uid());
create policy feedbacks_update on public.feedbacks for update
  using (public.misma_empresa(empresa_id) and public.es_jefe());
create policy feedbacks_delete on public.feedbacks for delete
  using (public.misma_empresa(empresa_id) and public.es_jefe());

-- ============================================================
-- documentos / archivos_cloudinary
-- ============================================================
create policy documentos_select on public.documentos for select
  using (public.misma_empresa(empresa_id) or usuario_id = auth.uid());
create policy documentos_insert on public.documentos for insert
  with check (public.misma_empresa(empresa_id) and public.es_admin_empresa());
create policy documentos_update on public.documentos for update
  using (usuario_id = auth.uid() or (public.misma_empresa(empresa_id) and public.es_admin_empresa()));
create policy documentos_delete on public.documentos for delete
  using (public.misma_empresa(empresa_id) and public.es_admin_empresa());

create policy archivos_cl_select on public.archivos_cloudinary for select
  using (public.misma_empresa(empresa_id));
create policy archivos_cl_insert on public.archivos_cloudinary for insert
  with check (public.misma_empresa(empresa_id));
create policy archivos_cl_update on public.archivos_cloudinary for update
  using (public.misma_empresa(empresa_id));
-- sin policy de delete: igual que "allow delete: if false" en firestore.rules

-- ============================================================
-- inventario
-- ============================================================
create policy inv_activos_select on public.inventario_activos for select
  using (public.misma_empresa(empresa_id) or asignado_a = auth.uid());
create policy inv_activos_insert on public.inventario_activos for insert
  with check (public.misma_empresa(empresa_id) and public.es_jefe());
create policy inv_activos_update on public.inventario_activos for update
  using (public.misma_empresa(empresa_id) and public.es_jefe());
create policy inv_activos_delete on public.inventario_activos for delete
  using (public.es_super_admin() or (public.misma_empresa(empresa_id) and public.es_admin_empresa()));

create policy inv_movs_select on public.inventario_movimientos for select
  using (public.misma_empresa(empresa_id));
create policy inv_movs_insert on public.inventario_movimientos for insert
  with check (public.misma_empresa(empresa_id) and public.es_jefe());
-- sin update/delete: ledger inmutable

-- ============================================================
-- nomina / pagos / planes / suscripciones
-- ============================================================
create policy nominas_select on public.nominas for select
  using (public.misma_empresa(empresa_id) or usuario_id = auth.uid());
create policy nominas_insert on public.nominas for insert
  with check (
    public.es_super_admin()
    or (public.misma_empresa(empresa_id) and public.es_admin_empresa())
  );
create policy nominas_update on public.nominas for update
  using (
    public.es_super_admin()
    or (public.misma_empresa(empresa_id) and public.es_admin_empresa())
  );
create policy nominas_delete on public.nominas for delete
  using (public.es_super_admin() or (public.misma_empresa(empresa_id) and public.es_admin_empresa()));

create policy payments_select on public.payments for select
  using (public.misma_empresa(empresa_id) or usuario_id = auth.uid());
create policy payments_insert on public.payments for insert
  with check (public.es_super_admin() or (public.misma_empresa(empresa_id) and public.es_admin_empresa()));
create policy payments_update on public.payments for update
  using (public.es_super_admin() or (public.misma_empresa(empresa_id) and public.es_admin_empresa()));
create policy payments_delete on public.payments for delete
  using (public.es_super_admin() or (public.misma_empresa(empresa_id) and public.es_admin_empresa()));

create policy planes_select on public.planes for select using (auth.uid() is not null);
create policy planes_insert on public.planes for insert with check (public.es_super_admin());
create policy planes_update on public.planes for update using (public.es_super_admin());
create policy planes_delete on public.planes for delete using (public.es_super_admin());

create policy suscripciones_select on public.suscripciones for select
  using (public.misma_empresa(empresa_id));
create policy suscripciones_insert on public.suscripciones for insert
  with check (public.es_super_admin() or (public.misma_empresa(empresa_id) and public.es_admin_empresa()));
create policy suscripciones_update on public.suscripciones for update
  using (public.es_super_admin() or (public.misma_empresa(empresa_id) and public.es_admin_empresa()));
create policy suscripciones_delete on public.suscripciones for delete
  using (public.es_super_admin());

-- ============================================================
-- comunicacion
-- ============================================================
create policy conversaciones_select on public.conversaciones for select
  using (
    public.es_super_admin()
    or (public.misma_empresa(empresa_id) and (auth.uid() = any(participante_ids) or public.es_jefe()))
  );
create policy conversaciones_insert on public.conversaciones for insert
  with check (public.misma_empresa(empresa_id) and auth.uid() = any(participante_ids));
create policy conversaciones_update on public.conversaciones for update
  using (
    public.misma_empresa(empresa_id)
    and (public.es_jefe() or creado_por = auth.uid() or auth.uid() = any(participante_ids))
  );
create policy conversaciones_delete on public.conversaciones for delete
  using (public.es_super_admin() or (public.misma_empresa(empresa_id) and public.es_admin_empresa()));

create policy mensajes_select on public.mensajes for select
  using (
    public.es_super_admin()
    or public.participa_en_conversacion(conversacion_id)
    or (public.es_jefe() and public.misma_empresa(empresa_id))
  );
create policy mensajes_insert on public.mensajes for insert
  with check (
    public.misma_empresa(empresa_id) and remitente_id = auth.uid()
    and public.participa_en_conversacion(conversacion_id)
  );
create policy mensajes_update on public.mensajes for update
  using (public.misma_empresa(empresa_id));
create policy mensajes_delete on public.mensajes for delete
  using (public.es_super_admin() or (public.misma_empresa(empresa_id) and public.es_admin_empresa()));

create policy notificaciones_select on public.notificaciones for select
  using (usuario_id = auth.uid() or public.misma_empresa(empresa_id));
create policy notificaciones_insert on public.notificaciones for insert
  with check (public.misma_empresa(empresa_id));
create policy notificaciones_update on public.notificaciones for update
  using (usuario_id = auth.uid() or (public.misma_empresa(empresa_id) and public.es_jefe()));
create policy notificaciones_delete on public.notificaciones for delete
  using (usuario_id = auth.uid() or (public.misma_empresa(empresa_id) and public.es_jefe()));

create policy inbox_select on public.inbox_unificado for select
  using (public.misma_empresa(empresa_id) or usuario_id = auth.uid());
create policy inbox_insert on public.inbox_unificado for insert
  with check (public.misma_empresa(empresa_id));
create policy inbox_update on public.inbox_unificado for update
  using (public.misma_empresa(empresa_id) or usuario_id = auth.uid());
create policy inbox_delete on public.inbox_unificado for delete
  using (public.misma_empresa(empresa_id) and public.es_admin_empresa());

create policy chat_ctx_select on public.chat_contextual for select
  using (public.misma_empresa(empresa_id));
create policy chat_ctx_insert on public.chat_contextual for insert
  with check (public.misma_empresa(empresa_id) and usuario_id = auth.uid());
-- sin update/delete: inmutable

create policy push_tokens_select on public.push_tokens for select
  using (usuario_id = auth.uid() or public.es_admin_empresa());
create policy push_tokens_insert on public.push_tokens for insert
  with check (usuario_id = auth.uid());
create policy push_tokens_update on public.push_tokens for update
  using (usuario_id = auth.uid() or public.es_admin_empresa());
create policy push_tokens_delete on public.push_tokens for delete
  using (usuario_id = auth.uid());

-- ============================================================
-- bienestar / capacitacion
-- ============================================================
create policy citas_select on public.citas for select
  using (
    public.misma_empresa(empresa_id) or usuario_id = auth.uid()
    or (public.es_psicologo() and especialista = (select nombre from public.usuarios where id = auth.uid()))
  );
create policy citas_insert on public.citas for insert
  with check (public.misma_empresa(empresa_id));
create policy citas_update on public.citas for update
  using (
    (public.misma_empresa(empresa_id) and public.es_jefe())
    or usuario_id = auth.uid()
    or (public.es_psicologo() and especialista = (select nombre from public.usuarios where id = auth.uid()))
  );
create policy citas_delete on public.citas for delete
  using (public.misma_empresa(empresa_id) and public.es_admin_empresa());

create policy capacitacion_select on public.capacitacion_avances for select
  using (empleado_id = auth.uid() or public.misma_empresa(empresa_id));
-- sin insert/update/delete de cliente: se gestiona por triggers/servicio

create policy respuestas_form_select on public.respuestas_formularios for select
  using (public.misma_empresa(empresa_id) or usuario_id = auth.uid());
create policy respuestas_form_insert on public.respuestas_formularios for insert
  with check (usuario_id = auth.uid());
create policy respuestas_form_update on public.respuestas_formularios for update
  using (public.es_admin_empresa());
create policy respuestas_form_delete on public.respuestas_formularios for delete
  using (public.es_admin_empresa());

-- ============================================================
-- plataforma / auditoria (mayormente solo lectura / super admin)
-- ============================================================
create policy audit_logs_select on public.audit_logs for select
  using (public.misma_empresa(empresa_id) and public.es_jefe());
create policy audit_logs_insert on public.audit_logs for insert
  with check (public.misma_empresa(empresa_id));
-- sin update/delete

create policy logs_select on public.logs for select
  using (public.es_super_admin() or public.misma_empresa(empresa_id));
create policy logs_insert on public.logs for insert
  with check (auth.uid() is not null);

create policy logs_auditoria_select on public.logs_auditoria for select
  using (public.es_super_admin() or public.misma_empresa(empresa_id));
create policy logs_auditoria_insert on public.logs_auditoria for insert
  with check (auth.uid() is not null);

create policy sensitive_hist_select on public.sensitive_change_history for select
  using (public.es_super_admin() or (public.misma_empresa(empresa_id) and public.es_admin_empresa()));

create policy ai_usage_select on public.ai_usage for select
  using (public.es_super_admin() or usuario_id = auth.uid() or (public.misma_empresa(empresa_id) and public.es_jefe()));

create policy ai_usage_daily_select on public.ai_usage_daily for select
  using (public.es_super_admin());

create policy backup_jobs_select on public.backup_jobs for select
  using (public.es_super_admin());

create policy support_sessions_select on public.support_sessions for select
  using (public.es_super_admin());

create policy plataforma_config_select on public.plataforma_config for select
  using (public.es_super_admin());

create policy upload_rate_limits_select on public.upload_rate_limits for select
  using (usuario_id = auth.uid());
-- sin insert/update/delete: solo el backend (service_role) escribe

-- auth_rate_limits: sin ninguna policy -> acceso solo con service_role

commit;
