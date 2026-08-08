-- Nexxus: login empresarial (usuario interno + empresa) y custom claims JWT.
-- Equivalente a loginEmpresarial en nexxus/backend/index.js:779 y a
-- admin.auth().setCustomUserClaims(). Sin datos reales que migrar: las
-- contrasenas internas se hashean con bcrypt (pgcrypto) en vez de PBKDF2 --
-- no hace falta compatibilidad retroactiva con el hash de Firebase.

begin;
set local check_function_bodies = off;

-- ============================================================
-- Utilidades de password
-- ============================================================
-- pgcrypto vive en el esquema "extensions" en Supabase (no en public),
-- por eso estas dos funciones necesitan ese esquema en el search_path.
create or replace function public.hash_password_interno(p_password text) returns text
language sql volatile set search_path = public, extensions as $$
  select crypt(p_password, gen_salt('bf', 10));
$$;

create or replace function public.verificar_password_interno(p_password text, p_hash text) returns boolean
language sql stable set search_path = public, extensions as $$
  select p_hash is not null and p_hash = crypt(p_password, p_hash);
$$;

-- ============================================================
-- Rate limiting de login (equivalente a enforceLoginRateLimit).
-- El chequeo/reset de ventana esta inline en login_empresarial (mas abajo)
-- para poder devolver { error: ... } sin abortar la transaccion -- ver
-- comentario junto a login_empresarial.
-- ============================================================
create or replace function public.registrar_intento_login(p_clave text, p_exitoso boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_exitoso then
    update public.auth_rate_limits
      set intentos = 0, bloqueado_hasta = null, updated_at = now()
      where clave = p_clave;
    return;
  end if;

  update public.auth_rate_limits
    set intentos = intentos + 1,
        updated_at = now(),
        bloqueado_hasta = case when intentos + 1 >= 5 then now() + interval '15 minutes' else bloqueado_hasta end
    where clave = p_clave;
end;
$$;

-- ============================================================
-- login_empresarial: resuelve codigoEmpresa + usuarioInterno + password
-- y devuelve el correo para que el cliente complete el login con
-- supabase.auth.signInWithPassword({ email, password }).
-- Debe poder llamarse SIN sesion (rol anon), por eso es SECURITY DEFINER.
-- ============================================================
-- Nota: esta funcion devuelve { error: "..." } en vez de RAISE EXCEPTION
-- para los casos de negocio esperados (password incorrecta, usuario no
-- existe, bloqueado por rate limit, etc.). Motivo: PostgREST ejecuta cada
-- llamada RPC en una transaccion; un RAISE EXCEPTION revierte TODA la
-- transaccion, incluyendo el conteo de intentos fallidos que la propia
-- funcion acababa de escribir -- el rate limiting nunca persistia. Con
-- RETURN normal la transaccion siempre commitea. El cliente distingue
-- exito/error por la presencia de la clave "correo" vs "error" en el JSON.
create or replace function public.login_empresarial(
  p_codigo_empresa text,
  p_usuario text,
  p_password text
) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_codigo_raw text := trim(coalesce(p_codigo_empresa, ''));
  v_codigo text := upper(v_codigo_raw);
  v_usuario text := lower(trim(coalesce(p_usuario, '')));
  v_clave_rate text;
  v_empresa public.empresas;
  v_usuario_row public.usuarios;
begin
  if v_usuario = '' or coalesce(p_password, '') = '' then
    return json_build_object('error', 'Usuario y contrasena son obligatorios.');
  end if;

  v_clave_rate := coalesce(v_codigo, '') || ':' || v_usuario;

  perform 1 from public.auth_rate_limits
    where clave = v_clave_rate and bloqueado_hasta is not null and bloqueado_hasta > now();
  if found then
    return json_build_object('error', 'Demasiados intentos fallidos. Intenta de nuevo mas tarde.');
  end if;

  insert into public.auth_rate_limits(clave, intentos, updated_at)
    values (v_clave_rate, 0, now())
    on conflict (clave) do update
      set intentos = case when public.auth_rate_limits.updated_at < now() - interval '15 minutes'
                           then 0 else public.auth_rate_limits.intentos end,
          bloqueado_hasta = case when public.auth_rate_limits.updated_at < now() - interval '15 minutes'
                                  then null else public.auth_rate_limits.bloqueado_hasta end;

  if v_codigo_raw <> '' then
    -- 1) Resolver la empresa: por codigo (mayus), por codigo tal cual, por id
    --    exacto, o por prefijo de 8 caracteres del id (igual que el flujo
    --    original que le muestra al usuario el prefijo del id de empresa).
    select * into v_empresa from public.empresas where codigo = v_codigo limit 1;
    if not found then
      select * into v_empresa from public.empresas where codigo = v_codigo_raw limit 1;
    end if;
    if not found then
      begin
        select * into v_empresa from public.empresas where id = v_codigo_raw::uuid limit 1;
      exception when invalid_text_representation then
        v_empresa := null;
      end;
    end if;
    if not found and length(v_codigo_raw) >= 8 then
      select * into v_empresa from public.empresas where id::text ilike v_codigo_raw || '%' limit 1;
    end if;

    if v_empresa.id is null then
      perform public.registrar_intento_login(v_clave_rate, false);
      return json_build_object('error', 'El codigo de empresa ingresado no existe.');
    end if;

    select * into v_usuario_row from public.usuarios
      where empresa_id = v_empresa.id and usuario_interno = v_usuario and eliminado = false
      limit 1;

    if not found then
      perform public.registrar_intento_login(v_clave_rate, false);
      return json_build_object('error', 'El usuario ingresado no existe en esta empresa.');
    end if;
  else
    -- Ruta de super admin: sin codigo de empresa, exige rol super_admin
    -- (nadie puede auto-asignarse ese rol via este flujo).
    select * into v_usuario_row from public.usuarios
      where usuario_interno = v_usuario and eliminado = false and rol = 'super_admin'
      limit 1;

    if not found then
      perform public.registrar_intento_login(v_clave_rate, false);
      return json_build_object('error', 'El usuario ingresado no existe.');
    end if;
  end if;

  if v_usuario_row.baneado then
    perform public.registrar_intento_login(v_clave_rate, false);
    return json_build_object('error', 'Esta cuenta fue bloqueada por un administrador de la plataforma.');
  end if;

  if not public.verificar_password_interno(p_password, v_usuario_row.password_interno_hash) then
    perform public.registrar_intento_login(v_clave_rate, false);
    return json_build_object('error', 'La contrasena ingresada es incorrecta.');
  end if;

  if coalesce(v_usuario_row.correo, '') = '' then
    return json_build_object('error', 'La cuenta no tiene un correo asociado. Contacta a tu administrador.');
  end if;

  perform public.registrar_intento_login(v_clave_rate, true);

  insert into public.audit_logs (empresa_id, actor_id, accion, modulo, detalles, target_id)
  values (v_usuario_row.empresa_id, v_usuario_row.id, 'Inicio de sesion empresarial', 'Auth',
          'Usuario interno ' || v_usuario, v_usuario_row.id::text);

  return json_build_object('correo', v_usuario_row.correo);
end;
$$;

revoke all on function public.login_empresarial(text, text, text) from public;
grant execute on function public.login_empresarial(text, text, text) to anon, authenticated;

-- ============================================================
-- Custom Access Token Hook: inyecta empresa_id/rol en el JWT,
-- equivalente a admin.auth().setCustomUserClaims(uid, { empresaId, rol }).
-- Requiere activarse manualmente en Supabase Dashboard > Authentication >
-- Hooks > "Customize Access Token (JWT) Claims" -> apuntar a esta funcion.
-- ============================================================
create or replace function public.custom_access_token_hook(event jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  claims jsonb;
  v_usuario public.usuarios;
begin
  select * into v_usuario from public.usuarios where id = (event->>'user_id')::uuid;
  claims := coalesce(event->'claims', '{}'::jsonb);

  if v_usuario.id is not null then
    claims := jsonb_set(claims, '{rol}', to_jsonb(v_usuario.rol));
    claims := jsonb_set(claims, '{empresa_id}', to_jsonb(v_usuario.empresa_id));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

revoke all on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
grant select on public.usuarios to supabase_auth_admin;

commit;
