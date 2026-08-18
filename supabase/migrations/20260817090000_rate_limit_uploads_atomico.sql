-- enforceUploadRateLimit (supabase/functions/_shared/uploads.ts) hacía lectura-luego-escritura
-- no atómica: dos subidas simultáneas del mismo usuario podían ambas leer cantidad=9, ambas
-- pasar el chequeo de >=10, y ambas escribir cantidad=10 -- el límite de 10 subidas cada 5
-- minutos se podía saltar por condición de carrera. INSERT ... ON CONFLICT DO UPDATE toma un
-- lock de fila sobre la fila en conflicto durante toda la sentencia, así que llamadas
-- concurrentes para el mismo usuario_id se serializan de verdad (una espera a que la otra
-- termine+confirme), a diferencia de un SELECT separado seguido de un UPSERT.
create or replace function public.enforce_upload_rate_limit(
  p_usuario_id uuid,
  p_max integer default 10,
  p_window_seconds integer default 300
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_cantidad integer;
begin
  insert into public.upload_rate_limits (usuario_id, cantidad, ventana_inicio)
  values (p_usuario_id, 1, now())
  on conflict (usuario_id) do update
    set cantidad = case
          when now() - upload_rate_limits.ventana_inicio > make_interval(secs => p_window_seconds) then 1
          else upload_rate_limits.cantidad + 1
        end,
        ventana_inicio = case
          when now() - upload_rate_limits.ventana_inicio > make_interval(secs => p_window_seconds) then now()
          else upload_rate_limits.ventana_inicio
        end
  returning cantidad into v_cantidad;

  if v_cantidad > p_max then
    raise exception 'RATE_LIMIT_EXCEEDED' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.enforce_upload_rate_limit(uuid, integer, integer) from public, anon, authenticated;
