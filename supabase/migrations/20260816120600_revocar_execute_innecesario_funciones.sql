-- El advisor de seguridad marcó ~20 funciones SECURITY DEFINER como invocables por
-- anon/authenticated vía /rest/v1/rpc/<nombre> (Supabase expone toda función del schema
-- public como endpoint RPC por defecto). Revisado función por función:
--
-- Seguro de revocar (nadie las llama directo, no rompe nada):
--  * 5 funciones trigger reales (RETURNS trigger): Postgres ya bloquea su invocación directa
--    ("trigger functions can only be called as triggers"), y disparar el trigger no requiere
--    que el rol que hizo el INSERT/UPDATE tenga EXECUTE sobre la función.
--  * rls_auto_enable: función de event trigger (RETURNS event_trigger), mismo caso -- solo
--    puede dispararse vía el propio event trigger, nunca por llamada directa. Sin
--    referencias en el código (ni frontend ni edge functions).
--  * registrar_intento_login: solo la llama login_empresarial (SECURITY DEFINER, ejecuta con
--    los privilegios de su dueño) y el edge function solicitar-recuperacion-password (usa
--    service_role). Expuesta a anon/authenticated hoy permite resetear el contador de
--    intentos fallidos de CUALQUIER clave con p_exitoso=true -- bypass del bloqueo por
--    fuerza bruta. Cerrando ese hueco real.
--  * resolver_solicitud_extension_tarea / responder_ticket_soporte: ya no deberían ser
--    invocables por anon (resolver_solicitud_extension_tarea incluso tiene un revoke previo
--    en 0028 que aparentemente no se sostuvo -- el grant vivo mostraba anon=true igual). Cada
--    una ya valida internamente el rol (es_admin_empresa()/es_super_admin()) así que nunca
--    fueron explotables, pero no hay razón para que anon pueda siquiera invocarlas: las
--    llama el dashboard ya autenticado. Se mantiene EXECUTE para "authenticated" porque el
--    frontend sí las invoca así vía supabase.rpc(...).
--
-- Deliberadamente SIN TOCAR: rol_actual/empresa_actual/es_super_admin/es_admin_empresa/
-- es_jefe/es_psicologo/misma_empresa/participa_en_conversacion. Estas SÍ se evalúan con los
-- privilegios del rol que hace la consulta (a diferencia de las funciones trigger), porque se
-- llaman directo dentro de las policies RLS -- son las funciones que casi cada policy del
-- proyecto usa. Revocarles EXECUTE a "authenticated" rompería el login y cada tabla protegida
-- por RLS para todo usuario real de la app.

revoke execute on function public.usuarios_bloquear_autoedicion() from anon, authenticated;
revoke execute on function public.conversaciones_restringir_update() from anon, authenticated;
revoke execute on function public.mensajes_restringir_update() from anon, authenticated;
revoke execute on function public.notificaciones_restringir_update() from anon, authenticated;
revoke execute on function public.checkins_generar_alerta_bienestar() from anon, authenticated;
revoke execute on function public.rls_auto_enable() from anon, authenticated;
revoke execute on function public.registrar_intento_login(text, boolean) from anon, authenticated;
revoke execute on function public.resolver_solicitud_extension_tarea(uuid, boolean, text) from anon;
revoke execute on function public.responder_ticket_soporte(uuid, text, text) from anon;
