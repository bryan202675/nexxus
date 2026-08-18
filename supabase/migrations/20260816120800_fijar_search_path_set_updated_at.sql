-- El advisor de seguridad marcó set_updated_at (trigger genérico que actualiza updated_at)
-- sin search_path fijo. Sin schema explícito, una sesión con un search_path manipulado
-- podría hacer que la función resuelva "now()" u otros identificadores contra un schema
-- distinto al esperado. Incluye search_path explícito, igual que ya tienen el resto de
-- funciones del proyecto.
create or replace function public.set_updated_at()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;
