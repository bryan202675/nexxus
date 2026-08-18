-- El advisor de performance marcó 93 políticas RLS que evalúan auth.uid() por cada fila en
-- vez de una vez por consulta. La mayoría de las políticas del proyecto no llaman a
-- auth.uid() directo, sino a través de estas funciones auxiliares (es_jefe, es_admin_empresa,
-- etc.), así que el arreglo real vive aquí: envolver auth.uid() en (select auth.uid()) para
-- que Postgres lo evalúe como InitPlan una sola vez por consulta. Son funciones SQL STABLE de
-- una sola sentencia (se inlinean en el plan de la consulta que las llama), así que el
-- optimizador aplica el mismo InitPlan a quien las use. Ninguna cambia de lógica, solo el
-- envoltorio de auth.uid().

create or replace function public.rol_actual()
 returns text
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select rol from public.usuarios where id = (select auth.uid());
$function$;

create or replace function public.empresa_actual()
 returns uuid
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select empresa_id from public.usuarios where id = (select auth.uid());
$function$;

create or replace function public.es_super_admin()
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select exists (select 1 from public.usuarios where id = (select auth.uid()) and rol = 'super_admin');
$function$;

create or replace function public.es_admin_empresa()
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select public.es_super_admin() or exists (
    select 1 from public.usuarios where id = (select auth.uid()) and rol in ('admin','admin_empresa')
  );
$function$;

create or replace function public.es_jefe()
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select public.es_admin_empresa() or exists (
    select 1 from public.usuarios where id = (select auth.uid()) and rol in ('jefe','jefe_sector')
  );
$function$;

create or replace function public.es_psicologo()
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select exists (select 1 from public.usuarios where id = (select auth.uid()) and rol = 'psicologo');
$function$;

create or replace function public.misma_empresa(p_empresa_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select p_empresa_id is not null
    and (public.es_super_admin() or p_empresa_id = public.empresa_actual());
$function$;

create or replace function public.participa_en_conversacion(p_conversacion_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select exists (
    select 1 from public.conversaciones
    where id = p_conversacion_id and (select auth.uid()) = any(participante_ids)
  );
$function$;
