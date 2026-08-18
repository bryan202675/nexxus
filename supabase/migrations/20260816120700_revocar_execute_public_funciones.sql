-- La migración anterior (revocar_execute_innecesario_funciones) revocó EXECUTE de anon y
-- authenticated en estas 7 funciones, pero no tuvo efecto real: seguían con el grant por
-- defecto a PUBLIC de cuando se crearon (toda función nueva en Postgres se crea con EXECUTE
-- para PUBLIC salvo que se revoque explícito), y anon/authenticated heredan ese grant vía
-- PUBLIC sin importar el revoke individual. Verificado con has_function_privilege(...,
-- 'public_can_execute') = true en las 7 antes de este fix.
revoke execute on function public.usuarios_bloquear_autoedicion() from public;
revoke execute on function public.conversaciones_restringir_update() from public;
revoke execute on function public.mensajes_restringir_update() from public;
revoke execute on function public.notificaciones_restringir_update() from public;
revoke execute on function public.checkins_generar_alerta_bienestar() from public;
revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.registrar_intento_login(text, boolean) from public;
