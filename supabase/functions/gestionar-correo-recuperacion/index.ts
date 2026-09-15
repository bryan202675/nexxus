import { getCaller, HttpError, safeString, withHandler } from "../_shared/nexxus.ts";
import { sendEmail } from "../_shared/gmail.ts";
import { plantillaCodigoDeAcceso } from "../_shared/emailTemplates.ts";

const PREFIJO_CODIGO = "correo-recuperacion:codigo:";
const PREFIJO_ENVIO = "correo-recuperacion:envio:";
const VIGENCIA_MS = 10 * 60 * 1000;
const ESPERA_REENVIO_MS = 60 * 1000;
const MAX_INTENTOS = 5;

function correoValido(correo: string): boolean {
  return /^\S+@\S+\.\S+$/.test(correo);
}

function generarCodigo(): string {
  const bytes = crypto.getRandomValues(new Uint32Array(1));
  return String((bytes[0] % 900000) + 100000);
}

async function hashCodigo(usuarioId: string, correo: string, codigo: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${usuarioId}:${correo}:${codigo}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function claveCodigo(usuarioId: string, hash: string): string {
  return `${PREFIJO_CODIGO}${usuarioId}:${hash}`;
}

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  const body = await req.json();
  const accion = safeString(body?.accion, 20);
  const { data: usuario, error: usuarioError } = await admin
    .from("usuarios")
    .select("nombre, correo_personal")
    .eq("id", caller.id)
    .single();
  if (usuarioError || !usuario) throw new HttpError(404, "No se encontró el usuario.");

  if (accion === "estado") return { configurado: Boolean(usuario.correo_personal) };
  if (usuario.correo_personal) return { configurado: true };

  const correo = safeString(body?.correo, 254).toLowerCase();
  if (!correoValido(correo)) throw new HttpError(400, "Ingresa un correo electrónico válido.");

  if (accion === "enviar") {
    const claveEnvio = `${PREFIJO_ENVIO}${caller.id}`;
    const { data: envioPrevio } = await admin
      .from("auth_rate_limits")
      .select("updated_at")
      .eq("clave", claveEnvio)
      .maybeSingle();
    if (envioPrevio?.updated_at && Date.now() - new Date(envioPrevio.updated_at).getTime() < ESPERA_REENVIO_MS) {
      throw new HttpError(429, "Espera un minuto antes de solicitar otro código.");
    }

    const codigo = generarCodigo();
    const hash = await hashCodigo(caller.id, correo, codigo);
    const { error: limpiarError } = await admin
      .from("auth_rate_limits")
      .delete()
      .like("clave", `${PREFIJO_CODIGO}${caller.id}:%`);
    if (limpiarError) throw new HttpError(500, "No se pudo preparar la verificación.");
    const { error: guardarError } = await admin.from("auth_rate_limits").upsert([
      { clave: claveCodigo(caller.id, hash), intentos: 0, bloqueado_hasta: null, updated_at: new Date().toISOString() },
      { clave: claveEnvio, intentos: 0, bloqueado_hasta: null, updated_at: new Date().toISOString() },
    ], { onConflict: "clave" });
    if (guardarError) throw new HttpError(500, "No se pudo preparar la verificación.");

    const { subject, html } = plantillaCodigoDeAcceso({
      nombre: usuario.nombre || "",
      codigo,
      proposito: "correo_recuperacion",
    });
    try {
      await sendEmail(correo, subject, html);
    } catch (error) {
      await admin.from("auth_rate_limits").delete().eq("clave", claveCodigo(caller.id, hash));
      console.error("[gestionar-correo-recuperacion] No se pudo enviar el correo:", error);
      throw new HttpError(503, "No se pudo enviar el código. Intenta de nuevo más tarde.");
    }
    return { enviado: true };
  }

  if (accion !== "confirmar") throw new HttpError(400, "Acción no válida.");
  const codigo = safeString(body?.codigo, 6);
  if (!/^\d{6}$/.test(codigo)) throw new HttpError(400, "Ingresa el código de seis dígitos.");

  const hash = await hashCodigo(caller.id, correo, codigo);
  const clave = claveCodigo(caller.id, hash);
  const { data: intento } = await admin
    .from("auth_rate_limits")
    .select("intentos, bloqueado_hasta, updated_at")
    .eq("clave", clave)
    .maybeSingle();
  if (!intento) {
    const { data: pendiente } = await admin
      .from("auth_rate_limits")
      .select("clave, intentos, updated_at")
      .like("clave", `${PREFIJO_CODIGO}${caller.id}:%`)
      .limit(1)
      .maybeSingle();
    if (pendiente?.clave && pendiente.updated_at && Date.now() - new Date(pendiente.updated_at).getTime() <= VIGENCIA_MS) {
      const siguientesIntentos = pendiente.intentos + 1;
      await admin.from("auth_rate_limits").update({
        intentos: siguientesIntentos,
        bloqueado_hasta: siguientesIntentos >= MAX_INTENTOS ? new Date(Date.now() + VIGENCIA_MS).toISOString() : null,
      }).eq("clave", pendiente.clave);
    }
    throw new HttpError(400, "El código no es válido o venció.");
  }
  const vencido = !intento?.updated_at || Date.now() - new Date(intento.updated_at).getTime() > VIGENCIA_MS;
  if (vencido || intento.bloqueado_hasta) {
    if (vencido) await admin.from("auth_rate_limits").delete().like("clave", `${PREFIJO_CODIGO}${caller.id}:%`);
    throw new HttpError(400, "El código no es válido o venció.");
  }

  const { error: authError } = await admin.auth.admin.updateUserById(caller.id, {
    email: correo,
    email_confirm: true,
  });
  if (authError) {
    console.error("[gestionar-correo-recuperacion] No se pudo actualizar Auth:", authError);
    throw new HttpError(400, "No se pudo usar ese correo. Puede estar asociado a otra cuenta.");
  }
  const { error: actualizarError } = await admin
    .from("usuarios")
    .update({ correo, correo_personal: correo })
    .eq("id", caller.id);
  if (actualizarError) {
    console.error("[gestionar-correo-recuperacion] No se pudo sincronizar usuarios:", actualizarError);
    throw new HttpError(500, "El correo se actualizó, pero no se pudo sincronizar el perfil. Contacta a soporte.");
  }
  await admin.from("auth_rate_limits").delete().like("clave", `${PREFIJO_CODIGO}${caller.id}:%`);
  return { configurado: true, correo };
}));
