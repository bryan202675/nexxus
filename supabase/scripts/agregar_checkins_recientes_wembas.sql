-- Check-ins operativos ficticios para completar la serie de bienestar del 3 al 9 de septiembre de 2026.
with empresa as (
  select id from public.empresas where codigo = 'WEM-9491'
), dias as (
  select offset_dia, (date '2026-09-09' - offset_dia)::date as dia,
    case when offset_dia = 6 then 7 else 8 end as cantidad
  from generate_series(0, 6) as offset_dia
), posiciones as (
  select d.offset_dia, d.dia, serie as orden
  from dias d
  cross join lateral generate_series(1, d.cantidad) as serie
), empleados as (
  select id, row_number() over (order by created_at, id) as posicion
  from public.usuarios
  where empresa_id = (select id from empresa)
), total_empleados as (
  select count(*)::bigint as total from empleados
), checkins_nuevos as (
  select
    p.dia,
    p.orden,
    e.id as usuario_id,
    case p.orden
      when 1 then 'bajo'
      when 2 then 'moderado'
      when 3 then 'moderado'
      when 4 then 'alto'
      when 5 then 'bajo'
      when 6 then 'moderado'
      when 7 then 'alto'
      else 'critico'
    end as nivel_estres,
    case p.orden
      when 1 then 1
      when 2 then 3
      when 3 then 3
      when 4 then 4
      when 5 then 1
      when 6 then 3
      when 7 then 4
      else 5
    end as estres_numerico,
    case when p.orden in (4, 7, 8) then 'bajo' when p.orden in (2, 3, 6) then 'medio' else 'alto' end as energia,
    case when p.orden in (4, 7, 8) then 2 when p.orden in (2, 3, 6) then 3 else 4 end as animo,
    case when p.orden in (4, 7, 8) then 2 when p.orden in (2, 3, 6) then 3 else 4 end as sueno,
    case when p.orden in (4, 7, 8) then 4 when p.orden in (2, 3, 6) then 3 else 2 end as carga
  from posiciones p
  cross join total_empleados te
  join empleados e on e.posicion = ((p.offset_dia * 8 + p.orden - 1) % te.total) + 1
  where te.total > 0
)
insert into public.checkins (empresa_id, usuario_id, estado_animo, nota, created_at, datos)
select
  empresa.id,
  c.usuario_id,
  case when c.animo >= 4 then 'bien' when c.animo = 3 then 'neutral' else 'estresado' end,
  'Registro de bienestar de jornada laboral.',
  (c.dia + time '09:00' + ((c.orden - 1) * interval '35 minutes'))::timestamptz,
  jsonb_build_object(
    'energia', c.energia,
    'balanceEmocional', c.animo,
    'nivelEstres', c.nivel_estres,
    'estres', c.estres_numerico,
    'calidadSueno', c.sueno,
    'cargaLaboral', c.carga,
    'indicadoresRapidos', case when c.nivel_estres in ('alto', 'critico') then jsonb_build_array('carga_operativa') else jsonb_build_array('jornada_estable') end,
    'origen', 'historial_bienestar_septiembre'
  )
from checkins_nuevos c
cross join empresa
where not exists (
  select 1
  from public.checkins existente
  where existente.empresa_id = empresa.id
    and existente.usuario_id = c.usuario_id
    and existente.created_at::date = c.dia
);
