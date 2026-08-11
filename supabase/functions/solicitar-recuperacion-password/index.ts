// Fase 11: pide un enlace de recuperación de contraseña.
// Dos formas de identificarse (misma resolución que login_empresarial en
// 0003_auth_login_empresarial.sql, simplificada -- sin el fallback por id/prefijo):
//   - { correo } -- cuenta con correo real (admin que registró la empresa, vía sa-login).
//   - { codigoEmpresa, usuarioInterno } -- cuenta con login sintético (admin/jefe/empleado, vía Expo).
// El destino del correo NO es siempre el correo de login: para admin_empresa/super_admin es
// `correo` (ya es real), para jefe/empleado es `correo_personal` (puede no existir todavía).
// Respuesta siempre genérica -- no revela si la cuenta existe, es estándar para este tipo de
// endpoint (a diferencia de login_empresarial, que sí es específico porque ahí el usuario ya
// demostró conocer usuario+contraseña vía rate limiting normal).
import { withHandler, HttpError, safeString } from "../_shared/nexxus.ts";
import { sendEmail } from "../_shared/gmail.ts";
import { plantillaRecuperacionPassword } from "../_shared/emailTemplates.ts";

const ROLES_CORREO_REAL = new Set(["admin_empresa", "super_admin"]);
const RESPUESTA_GENERICA = { ok: true, mensaje: "Si la cuenta existe, se envió un enlace de recuperación." };

Deno.serve(withHandler(async (req, admin) => {
  const body = await req.json();
  const correo = safeString(body?.correo, 254).toLowerCase();
  const codigoEmpresa = safeString(body?.codigoEmpresa, 60);
  const usuarioInterno = safeString(body?.usuarioInterno, 60).toLowerCase();
  const redirectTo = safeString(body?.redirectTo, 300);
  if (!redirectTo) throw new HttpError(400, "Falta redirectTo.");
  if (!correo && !(codigoEmpresa && usuarioInterno)) {
    throw new HttpError(400, "Falta correo, o código de empresa + usuario.");
  }

  const claveRate = `recovery:${correo || `${codigoEmpresa.toUpperCase()}:${usuarioInterno}`}`;
  const { data: rateRow } = await admin
    .from("auth_rate_limits")
    .select("bloqueado_hasta")
    .eq("clave", claveRate)
    .maybeSingle();
  if (rateRow?.bloqueado_hasta && new Date(rateRow.bloqueado_hasta) > new Date()) {
    throw new HttpError(429, "Demasiados intentos. Intenta de nuevo más tarde.");
  }
  await admin.rpc("registrar_intento_login", { p_clave: claveRate, p_exitoso: false });

  let usuario: { id: string; rol: string; correo: string; correo_personal: string | null; nombre: string } | null = null;

  if (correo) {
    const { data } = await admin
      .from("usuarios")
      .select("id, rol, correo, correo_personal, nombre")
      .eq("correo", correo)
      .eq("eliminado", false)
      .maybeSingle();
    usuario = data;
  } else {
    const codigoUpper = codigoEmpresa.toUpperCase();
    let { data: empresa } = await admin.from("empresas").select("id").eq("codigo", codigoUpper).maybeSingle();
    if (!empresa) {
      ({ data: empresa } = await admin.from("empresas").select("id").eq("codigo", codigoEmpresa).maybeSingle());
    }
    if (empresa) {
      const { data } = await admin
        .from("usuarios")
        .select("id, rol, correo, correo_personal, nombre")
        .eq("empresa_id", empresa.id)
        .eq("usuario_interno", usuarioInterno)
        .eq("eliminado", false)
        .maybeSingle();
      usuario = data;
    }
  }

  if (!usuario) return RESPUESTA_GENERICA;

  const destino = ROLES_CORREO_REAL.has(usuario.rol) ? usuario.correo : usuario.correo_personal;
  if (!destino) return RESPUESTA_GENERICA;

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: usuario.correo,
    options: { redirectTo },
  });
  if (linkError || !linkData?.properties?.action_link) {
    console.error("[solicitar-recuperacion-password] generateLink falló:", linkError);
    return RESPUESTA_GENERICA;
  }

  const { subject, html } = plantillaRecuperacionPassword({ nombre: usuario.nombre || "", link: linkData.properties.action_link });
  try {
    await sendEmail(destino, subject, html);
  } catch (error) {
    console.error("[solicitar-recuperacion-password] No se pudo enviar el correo:", error);
  }

  return RESPUESTA_GENERICA;
}));
