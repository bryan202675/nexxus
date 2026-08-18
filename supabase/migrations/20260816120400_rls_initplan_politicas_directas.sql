-- Continúa rls_initplan_funciones_auxiliares: estas 93 políticas comparan una columna
-- directo contra auth.uid() (no a través de una función auxiliar), así que necesitan el
-- envoltorio (select auth.uid()) en el propio texto de la política. Ninguna cambia de
-- lógica, solo el envoltorio.
alter policy "ai_usage_select" on public.ai_usage using ((es_super_admin() OR (usuario_id = (select auth.uid())) OR (misma_empresa(empresa_id) AND es_jefe())));
alter policy "asistencias_insert" on public.asistencias with check ((misma_empresa(empresa_id) AND (usuario_id = (select auth.uid()))));
alter policy "asistencias_select" on public.asistencias using ((misma_empresa(empresa_id) OR (usuario_id = (select auth.uid()))));
alter policy "asistencias_update" on public.asistencias using ((misma_empresa(empresa_id) AND (es_jefe() OR (usuario_id = (select auth.uid())))));
alter policy "capacitacion_select" on public.capacitacion_avances using (((empleado_id = (select auth.uid())) OR misma_empresa(empresa_id)));
alter policy "chat_ctx_insert" on public.chat_contextual with check ((misma_empresa(empresa_id) AND (usuario_id = (select auth.uid()))));
alter policy "checkins_insert" on public.checkins with check ((misma_empresa(empresa_id) AND (usuario_id = (select auth.uid()))));
alter policy "checkins_select" on public.checkins using ((misma_empresa(empresa_id) OR (usuario_id = (select auth.uid()))));
alter policy "citas_select" on public.citas using ((misma_empresa(empresa_id) OR (usuario_id = (select auth.uid())) OR (es_psicologo() AND (especialista = ( SELECT usuarios.nombre
   FROM usuarios
  WHERE (usuarios.id = (select auth.uid())))))));
alter policy "citas_update" on public.citas using (((misma_empresa(empresa_id) AND es_jefe()) OR (usuario_id = (select auth.uid())) OR (es_psicologo() AND (especialista = ( SELECT usuarios.nombre
   FROM usuarios
  WHERE (usuarios.id = (select auth.uid())))))));
alter policy "conversaciones_insert" on public.conversaciones with check ((misma_empresa(empresa_id) AND ((select auth.uid()) = ANY (participante_ids))));
alter policy "conversaciones_select" on public.conversaciones using ((es_super_admin() OR (misma_empresa(empresa_id) AND (((select auth.uid()) = ANY (participante_ids)) OR es_jefe()))));
alter policy "conversaciones_update" on public.conversaciones using ((misma_empresa(empresa_id) AND (es_jefe() OR (creado_por = (select auth.uid())) OR ((select auth.uid()) = ANY (participante_ids)))));
alter policy "documentos_select" on public.documentos using ((misma_empresa(empresa_id) OR (usuario_id = (select auth.uid()))));
alter policy "documentos_update" on public.documentos using (((usuario_id = (select auth.uid())) OR (misma_empresa(empresa_id) AND es_admin_empresa())));
alter policy "empresas_insert" on public.empresas with check ((es_super_admin() OR (admin_id = (select auth.uid()))));
alter policy "empresas_select" on public.empresas using (((select auth.uid()) IS NOT NULL));
alter policy "evaluaciones_select" on public.evaluaciones using ((misma_empresa(empresa_id) OR (empleado_id = (select auth.uid())) OR (evaluador_id = (select auth.uid()))));
alter policy "feedbacks_insert" on public.feedbacks with check ((usuario_id = (select auth.uid())));
alter policy "feedbacks_select" on public.feedbacks using (((usuario_id = (select auth.uid())) OR misma_empresa(empresa_id)));
alter policy "focus_sessions_delete" on public.focus_sessions using ((usuario_id = (select auth.uid())));
alter policy "focus_sessions_insert" on public.focus_sessions with check ((usuario_id = (select auth.uid())));
alter policy "focus_sessions_select" on public.focus_sessions using ((usuario_id = (select auth.uid())));
alter policy "focus_sessions_update" on public.focus_sessions using ((usuario_id = (select auth.uid())));
alter policy "inbox_select" on public.inbox_unificado using ((misma_empresa(empresa_id) OR (usuario_id = (select auth.uid()))));
alter policy "inbox_update" on public.inbox_unificado using ((misma_empresa(empresa_id) OR (usuario_id = (select auth.uid()))));
alter policy "incidencias_insert" on public.incidencias with check ((misma_empresa(empresa_id) AND (reportado_por = (select auth.uid()))));
alter policy "incidencias_select" on public.incidencias using ((misma_empresa(empresa_id) OR (reportado_por = (select auth.uid()))));
alter policy "inv_activos_select" on public.inventario_activos using ((misma_empresa(empresa_id) OR (asignado_a = (select auth.uid()))));
alter policy "logros_usuario_insert" on public.logros_usuario with check (((usuario_id = (select auth.uid())) AND misma_empresa(empresa_id)));
alter policy "logros_usuario_select" on public.logros_usuario using (((usuario_id = (select auth.uid())) OR (misma_empresa(empresa_id) AND es_jefe())));
alter policy "logs_insert" on public.logs with check (((select auth.uid()) IS NOT NULL));
alter policy "logs_auditoria_insert" on public.logs_auditoria with check (((select auth.uid()) IS NOT NULL));
alter policy "mensajes_insert" on public.mensajes with check ((misma_empresa(empresa_id) AND (remitente_id = (select auth.uid())) AND participa_en_conversacion(conversacion_id)));
alter policy "nominas_select" on public.nominas using ((misma_empresa(empresa_id) OR (usuario_id = (select auth.uid()))));
alter policy "notificaciones_delete" on public.notificaciones using (((usuario_id = (select auth.uid())) OR (misma_empresa(empresa_id) AND es_jefe())));
alter policy "notificaciones_select" on public.notificaciones using (((usuario_id = (select auth.uid())) OR (misma_empresa(empresa_id) AND ((tipo IS DISTINCT FROM 'bienestar'::text) OR es_jefe()))));
alter policy "notificaciones_update" on public.notificaciones using (((usuario_id = (select auth.uid())) OR (misma_empresa(empresa_id) AND es_jefe())));
alter policy "okr_resultados_delete" on public.objetivo_resultados_clave using (((usuario_id = (select auth.uid())) OR (misma_empresa(empresa_id) AND es_jefe())));
alter policy "okr_resultados_insert" on public.objetivo_resultados_clave with check ((misma_empresa(empresa_id) AND ((usuario_id = (select auth.uid())) OR es_jefe())));
alter policy "okr_resultados_select" on public.objetivo_resultados_clave using (((usuario_id = (select auth.uid())) OR (misma_empresa(empresa_id) AND es_jefe())));
alter policy "okr_resultados_update" on public.objetivo_resultados_clave using (((usuario_id = (select auth.uid())) OR (misma_empresa(empresa_id) AND es_jefe())));
alter policy "objetivos_delete" on public.objetivos using (((usuario_id = (select auth.uid())) OR (misma_empresa(empresa_id) AND es_jefe())));
alter policy "objetivos_insert" on public.objetivos with check ((misma_empresa(empresa_id) AND ((usuario_id = (select auth.uid())) OR es_jefe())));
alter policy "objetivos_select" on public.objetivos using (((usuario_id = (select auth.uid())) OR (misma_empresa(empresa_id) AND es_jefe())));
alter policy "objetivos_update" on public.objetivos using (((usuario_id = (select auth.uid())) OR (misma_empresa(empresa_id) AND es_jefe())));
alter policy "pausas_delete" on public.pausas using ((usuario_id = (select auth.uid())));
alter policy "pausas_insert" on public.pausas with check ((usuario_id = (select auth.uid())));
alter policy "pausas_select" on public.pausas using ((usuario_id = (select auth.uid())));
alter policy "pausas_update" on public.pausas using ((usuario_id = (select auth.uid())));
alter policy "payments_select" on public.payments using ((misma_empresa(empresa_id) OR (usuario_id = (select auth.uid()))));
alter policy "push_tokens_delete" on public.push_tokens using ((usuario_id = (select auth.uid())));
alter policy "push_tokens_insert" on public.push_tokens with check ((usuario_id = (select auth.uid())));
alter policy "push_tokens_select" on public.push_tokens using (((usuario_id = (select auth.uid())) OR es_admin_empresa()));
alter policy "push_tokens_update" on public.push_tokens using (((usuario_id = (select auth.uid())) OR es_admin_empresa()));
alter policy "reportes_select" on public.reportes using ((misma_empresa(empresa_id) OR (empleado_id = (select auth.uid())) OR (creado_por = (select auth.uid()))));
alter policy "respuestas_form_insert" on public.respuestas_formularios with check ((usuario_id = (select auth.uid())));
alter policy "respuestas_form_select" on public.respuestas_formularios using ((misma_empresa(empresa_id) OR (usuario_id = (select auth.uid()))));
alter policy "sesiones_dispositivo_delete" on public.sesiones_dispositivo using ((usuario_id = (select auth.uid())));
alter policy "sesiones_dispositivo_insert" on public.sesiones_dispositivo with check ((usuario_id = (select auth.uid())));
alter policy "sesiones_dispositivo_select" on public.sesiones_dispositivo using ((usuario_id = (select auth.uid())));
alter policy "sesiones_dispositivo_update" on public.sesiones_dispositivo using ((usuario_id = (select auth.uid())));
alter policy "sol_ausencia_delete" on public.solicitudes_ausencia using ((es_super_admin() OR (misma_empresa(empresa_id) AND es_admin_empresa()) OR (usuario_id = (select auth.uid()))));
alter policy "sol_ausencia_insert" on public.solicitudes_ausencia with check ((misma_empresa(empresa_id) AND (usuario_id = (select auth.uid()))));
alter policy "sol_ausencia_select" on public.solicitudes_ausencia using ((misma_empresa(empresa_id) OR (usuario_id = (select auth.uid()))));
alter policy "sol_ausencia_update" on public.solicitudes_ausencia using (((misma_empresa(empresa_id) AND es_jefe()) OR (usuario_id = (select auth.uid()))));
alter policy "solicitudes_extension_tarea_insert" on public.solicitudes_extension_tarea with check (((empresa_id = empresa_actual()) AND (solicitante_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM tareas tarea
  WHERE ((tarea.id = solicitudes_extension_tarea.tarea_id) AND (tarea.empresa_id = solicitudes_extension_tarea.empresa_id) AND (tarea.asignado_a = (select auth.uid())))))));
alter policy "solicitudes_extension_tarea_select" on public.solicitudes_extension_tarea using ((misma_empresa(empresa_id) AND (es_admin_empresa() OR (solicitante_id = (select auth.uid())))));
alter policy "sol_internas_insert" on public.solicitudes_internas with check ((misma_empresa(empresa_id) AND (usuario_id = (select auth.uid()))));
alter policy "sol_internas_select" on public.solicitudes_internas using ((misma_empresa(empresa_id) OR (usuario_id = (select auth.uid()))));
alter policy "sol_internas_update" on public.solicitudes_internas using (((misma_empresa(empresa_id) AND es_jefe()) OR (usuario_id = (select auth.uid()))));
alter policy "tarea_adjuntos_delete" on public.tarea_adjuntos using (((subido_por = (select auth.uid())) OR (misma_empresa(empresa_id) AND es_jefe())));
alter policy "tarea_adjuntos_insert" on public.tarea_adjuntos with check ((misma_empresa(empresa_id) AND (es_jefe() OR (tarea_asignado_a = (select auth.uid()))) AND (subido_por = (select auth.uid()))));
alter policy "tarea_adjuntos_select" on public.tarea_adjuntos using ((misma_empresa(empresa_id) OR (tarea_asignado_a = (select auth.uid()))));
alter policy "tarea_comentarios_delete" on public.tarea_comentarios using (((autor_id = (select auth.uid())) OR (misma_empresa(empresa_id) AND es_jefe())));
alter policy "tarea_comentarios_insert" on public.tarea_comentarios with check ((misma_empresa(empresa_id) AND (es_jefe() OR (tarea_asignado_a = (select auth.uid()))) AND (autor_id = (select auth.uid()))));
alter policy "tarea_comentarios_select" on public.tarea_comentarios using ((misma_empresa(empresa_id) OR (tarea_asignado_a = (select auth.uid()))));
alter policy "tarea_comentarios_update" on public.tarea_comentarios using ((autor_id = (select auth.uid())));
alter policy "tarea_subtareas_delete" on public.tarea_subtareas using ((misma_empresa(empresa_id) AND (es_jefe() OR (tarea_asignado_a = (select auth.uid())))));
alter policy "tarea_subtareas_insert" on public.tarea_subtareas with check ((misma_empresa(empresa_id) AND (es_jefe() OR (tarea_asignado_a = (select auth.uid())))));
alter policy "tarea_subtareas_select" on public.tarea_subtareas using ((misma_empresa(empresa_id) OR (tarea_asignado_a = (select auth.uid()))));
alter policy "tarea_subtareas_update" on public.tarea_subtareas using ((misma_empresa(empresa_id) AND (es_jefe() OR (tarea_asignado_a = (select auth.uid())))));
alter policy "tareas_select" on public.tareas using ((misma_empresa(empresa_id) OR (asignado_a = (select auth.uid()))));
alter policy "tareas_update" on public.tareas using (((misma_empresa(empresa_id) AND es_jefe()) OR (asignado_a = (select auth.uid()))));
alter policy "ticket_mensajes_insert" on public.ticket_mensajes with check (((es_super_admin() OR misma_empresa(empresa_id) OR (ticket_creado_por = (select auth.uid()))) AND (autor_id = (select auth.uid()))));
alter policy "ticket_mensajes_select" on public.ticket_mensajes using ((es_super_admin() OR misma_empresa(empresa_id) OR (ticket_creado_por = (select auth.uid()))));
alter policy "tickets_insert" on public.tickets with check ((misma_empresa(empresa_id) AND (creado_por = (select auth.uid()))));
alter policy "tickets_select" on public.tickets using ((es_super_admin() OR misma_empresa(empresa_id) OR (creado_por = (select auth.uid()))));
alter policy "tickets_update" on public.tickets using ((es_super_admin() OR (misma_empresa(empresa_id) AND es_jefe()) OR (creado_por = (select auth.uid()))));
alter policy "upload_rate_limits_select" on public.upload_rate_limits using ((usuario_id = (select auth.uid())));
alter policy "usuarios_insert" on public.usuarios with check ((((id = (select auth.uid())) OR (es_admin_empresa() AND misma_empresa(empresa_id))) AND ((rol <> 'super_admin'::text) OR es_super_admin())));
alter policy "usuarios_select" on public.usuarios using (((id = (select auth.uid())) OR es_super_admin() OR misma_empresa(empresa_id)));
alter policy "usuarios_update" on public.usuarios using ((es_super_admin() OR (id = (select auth.uid())) OR (es_admin_empresa() AND misma_empresa(empresa_id))));
