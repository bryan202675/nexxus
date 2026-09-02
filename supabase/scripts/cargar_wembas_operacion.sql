begin;

create temporary table wembas_ctx as
select e.id as empresa_id,
       (select id from public.usuarios where empresa_id = e.id and rol in ('admin_empresa','admin') order by created_at limit 1) as admin_id
from public.empresas e where e.codigo = 'WEM-9491';

do $$
declare
  v_empresa uuid := (select empresa_id from wembas_ctx);
  v_id uuid;
  v_email text;
  v_nombre text;
  i integer;
  nombres text[] := array['Andrea','Carlos','Daniela','Jorge','Valeria','Miguel','Sofía','Ricardo','Paola','Diego','Natalia','Luis','Mariana','José','Camila','Fernando','Elena','Óscar','Lucía','Héctor'];
  apellidos text[] := array['Martínez','Hernández','López','García','Ramírez','Castillo','Flores','Morales','Rivera','Vásquez','Mendoza','Santos','Cruz','Romero','Pineda','Aguilar','Rivas','Castro','Salazar','Zelaya'];
begin
  if v_empresa is null then raise exception 'WEM-9491 no existe'; end if;
  for i in 1..500 loop
    v_id := gen_random_uuid();
    v_email := format('colaborador.%s@wembas.nexxus', lpad(i::text, 3, '0'));
    v_nombre := nombres[1 + ((i - 1) % array_length(nombres, 1))] || ' ' || apellidos[1 + ((i * 7 - 1) % array_length(apellidos, 1))];
    if not exists (select 1 from auth.users where email = v_email) then
      insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,is_sso_user,is_anonymous)
      values ((select id from auth.instances limit 1),v_id,'authenticated','authenticated',v_email,crypt(gen_random_uuid()::text,gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}',jsonb_build_object('displayName',v_nombre),now() - ((i % 60) || ' days')::interval,now(),false,false);
    end if;
    select id into v_id from auth.users where email = v_email;
    insert into auth.identities (id,user_id,identity_data,provider,provider_id,created_at,updated_at)
    values (gen_random_uuid(),v_id,jsonb_build_object('sub',v_id::text,'email',v_email),'email',v_email,now(),now())
    on conflict do nothing;
    insert into public.usuarios (id,empresa_id,rol,nombre,correo,usuario_interno,codigo_empresa,estado_activo,fecha_ingreso,horario_laboral,salario_base,tipo_contrato,banco,cuenta_bancaria,afp_pertenece,habilidades,kpis,historial_laboral,certificaciones,created_at)
    values (v_id,v_empresa,case when i <= 8 then 'admin_empresa' when i <= 38 then 'jefe' when i <= 55 then 'jefe_sector' else 'empleado' end,v_nombre,v_email,'wembas.' || lpad(i::text,3,'0'),'WEM-9491',true,current_date - (90 + i % 720),case when i % 5 = 0 then 'Híbrido 8:00–17:00' else 'Presencial 8:00–17:00' end,case when i <= 8 then 3200 when i <= 55 then 1900 else 950 + (i % 12) * 85 end,'Indefinido','Banco Agrícola','',case when i % 2 = 0 then 'AFP Crecer' else 'AFP Confía' end,array['Comunicación','Planificación'],jsonb_build_array(jsonb_build_object('nombre','Cumplimiento de objetivos','valor',70 + i % 28,'meta',90,'unidad','%')),jsonb_build_array(jsonb_build_object('puesto','Incorporación WEMBAS','fecha',(current_date - (90 + i % 720))::text,'accion','Ingreso')),array['Inducción corporativa'],now() - ((i % 60) || ' days')::interval)
    on conflict (id) do nothing;
  end loop;
end $$;

update public.empresas set datos = coalesce(datos,'{}'::jsonb) || jsonb_build_object('giro','Servicios empresariales y transformación digital','tamanoEquipo','500–999 colaboradores') where id = (select empresa_id from wembas_ctx);

insert into public.sedes (empresa_id,nombre,direccion,latitud,longitud,radio_metros,datos)
select empresa_id,nombre,direccion,lat,lon,200,jsonb_build_object('horario','08:00–17:00') from wembas_ctx cross join (values
('San Salvador – Torre WEMBAS','Colonia Escalón, San Salvador',13.7000,-89.2100),('Santa Ana – Centro Regional','Zona Rosa, Santa Ana',13.9942,-89.5597),('San Miguel – Operaciones Oriente','Colonia Ciudad Jardín, San Miguel',13.4833,-88.1833),('Remoto El Salvador','Trabajo híbrido nacional',13.7942,-88.8965)) s(nombre,direccion,lat,lon)
where not exists (select 1 from public.sedes x where x.empresa_id=(select empresa_id from wembas_ctx) and x.nombre=s.nombre);

insert into public.departamentos (empresa_id,nombre,datos)
select empresa_id,nombre,jsonb_build_object('centroCosto','WEM-' || row_number() over ()) from wembas_ctx cross join unnest(array['Dirección General','Operaciones','Tecnología','Comercial','Marketing','Finanzas','Talento Humano','Atención al Cliente','Legal y Cumplimiento','Administración']) nombre
where not exists (select 1 from public.departamentos d where d.empresa_id=(select empresa_id from wembas_ctx) and d.nombre=nombre);
insert into public.cargos (empresa_id,departamento_id,titulo,nivel)
select d.empresa_id,d.id,case d.nombre when 'Tecnología' then 'Especialista de tecnología' when 'Comercial' then 'Ejecutivo de cuenta' when 'Atención al Cliente' then 'Analista de servicio' when 'Talento Humano' then 'Especialista de talento' else 'Analista ' || d.nombre end,2 from public.departamentos d where d.empresa_id=(select empresa_id from wembas_ctx) and not exists(select 1 from public.cargos c where c.empresa_id=d.empresa_id and c.departamento_id=d.id);
update public.usuarios u set departamento_id=d.id,cargo_id=c.id,sede_id=s.id from (select id,row_number() over(order by id) n from public.usuarios where empresa_id=(select empresa_id from wembas_ctx) and correo like 'colaborador.%@wembas.nexxus') x join lateral(select id from public.departamentos where empresa_id=(select empresa_id from wembas_ctx) order by id offset ((x.n-1)%10) limit 1)d on true join lateral(select id from public.cargos where departamento_id=d.id limit 1)c on true join lateral(select id from public.sedes where empresa_id=(select empresa_id from wembas_ctx) order by id offset ((x.n-1)%4) limit 1)s on true where u.id=x.id;

create temporary table wembas_users as select id,nombre,row_number() over(order by id) n from public.usuarios where empresa_id=(select empresa_id from wembas_ctx) and correo like 'colaborador.%@wembas.nexxus';

insert into public.calendario_empresarial (empresa_id,titulo,descripcion,fecha_inicio,fecha_fin,tipo,datos)
select (select empresa_id from wembas_ctx),case when extract(isodow from d)=1 then 'Reunión semanal de equipo' when extract(day from d)%7=0 then 'Revisión de indicadores' else 'Sesión de coordinación operativa' end,'Agenda corporativa WEMBAS',d + interval '09:00',d + interval '10:00','reunion',jsonb_build_object('ubicacion','Sala de reuniones / videollamada') from generate_series(current_date - interval '2 months',current_date + interval '1 month',interval '1 day') d where extract(isodow from d) between 1 and 5;
insert into public.tareas (empresa_id,titulo,descripcion,asignado_a,creado_por,estado,prioridad,fecha_limite,created_at,datos)
select (select empresa_id from wembas_ctx),'Seguimiento operativo ' || n,'Actualizar avance y evidencias del frente asignado.',id,(select admin_id from wembas_ctx),case when n%5=0 then 'completada' when n%3=0 then 'en_progreso' else 'pendiente' end,case when n%9=0 then 'alta' else 'media' end,current_date - interval '2 months' + (n%90)*interval '1 day',current_date - interval '2 months' + (n%60)*interval '1 day',jsonb_build_object('area','Operación') from wembas_users where n<=500;
insert into public.asistencias (empresa_id,usuario_id,entrada,salida,dentro_de_zona,tipo,fecha_jornada,metodo_registro,horas_trabajadas,horas_extra,tarde,minutos_tarde,estado_aprobacion)
select (select empresa_id from wembas_ctx),u.id,d + interval '8 hours' + ((u.n%18)||' minutes')::interval,d + interval '17 hours' + ((u.n%25)||' minutes')::interval,true,'jornada',d::date,'workspace_web',8.0+(u.n%4)*0.15,case when u.n%13=0 then 1.5 else 0 end,u.n%17=0,case when u.n%17=0 then 12 else 0 end,'aprobada' from wembas_users u cross join generate_series(current_date-interval '2 months',current_date,interval '1 day') d where extract(isodow from d) between 1 and 5;
insert into public.checkins (empresa_id,usuario_id,estado_animo,nota,created_at,datos)
select (select empresa_id from wembas_ctx),id,case when n%20=0 then 'agotado' when n%7=0 then 'tenso' else 'bien' end,case when n%20=0 then 'Carga elevada y prioridad de seguimiento.' else 'Jornada dentro de lo planificado.' end,current_date - (n%45)::int,jsonb_build_object('estres',case when n%20=0 then 5 when n%7=0 then 3 else 1 end,'nivelEstres',case when n%20=0 then 'critico' when n%7=0 then 'moderado' else 'bajo' end,'cargaLaboral',case when n%20=0 then 5 when n%7=0 then 3 else 2 end,'energia',case when n%20=0 then 'bajo' else 'media' end) from wembas_users where n<=300;
insert into public.nominas (empresa_id,usuario_id,periodo_anio,periodo_mes,salario_bruto,isss_empleado,afp_empleado,renta,otras_deducciones,salario_neto,estado,procesado_at,periodo,empleado_nombre,bonos,comisiones,descuento_tardanzas,descuento_ausencias,horas_extra,valor_hora_extra,creado_por,creado_por_nombre)
select (select empresa_id from wembas_ctx),u.id,extract(year from d)::int,extract(month from d)::int,base,base*.03,base*.0725,base*.04,0,base*.8575,'pagado',d + interval '28 days','Planilla '||to_char(d,'YYYY-MM'),u.nombre,0,0,0,0,0,0,(select admin_id from wembas_ctx),'Administración WEMBAS' from wembas_users u cross join lateral(values(current_date - interval '2 months',current_date - interval '1 month')) p(d) cross join lateral(select 950+(u.n%12)*85 base)b;
commit;
