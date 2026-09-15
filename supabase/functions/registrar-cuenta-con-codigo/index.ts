import { assertValidEmail, assertValidPassword, HttpError, safeString, withHandler } from "../_shared/nexxus.ts";
import { sendEmail } from "../_shared/gmail.ts";
import { plantillaCodigoDeAcceso } from "../_shared/emailTemplates.ts";

Deno.serve(withHandler(async (req, admin) => {
  if (req.method !== "POST") throw new HttpError(405, "Método no permitido.");
  const body = await req.json();
  const correo = safeString(body?.correo, 254).toLowerCase();
  const nombre = safeString(body?.nombre, 120);
  const password = typeof body?.password === "string" ? body.password : "";
  assertValidEmail(correo);
  assertValidPassword(password);
  if (nombre.length < 2) throw new HttpError(400, "Ingresa tu nombre completo.");

  const claveRate = `signup:${correo}`;
  const { data: rateRow } = await admin
    .from("auth_rate_limits")
    .select("bloqueado_hasta")
    .eq("clave", claveRate)
    .maybeSingle();
  if (rateRow?.bloqueado_hasta && new Date(rateRow.bloqueado_hasta) > new Date()) {
    throw new HttpError(429, "Demasiados intentos. Intenta de nuevo más tarde.");
  }
  await admin.rpc("registrar_intento_login", { p_clave: claveRate, p_exitoso: false });

  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email: correo,
    password,
    options: { data: { displayName: nombre } },
  });
  if (error || !data?.properties?.email_otp) {
    if (error?.message.toLowerCase().includes("already")) {
      throw new HttpError(409, "Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.");
    }
    console.error("[registrar-cuenta-con-codigo] generateLink falló:", error);
    throw new HttpError(503, "No se pudo preparar el código de verificación. Intenta de nuevo.");
  }

  const { subject, html } = plantillaCodigoDeAcceso({ nombre, codigo: data.properties.email_otp, proposito: "confirmacion" });
  try {
    await sendEmail(correo, subject, html);
  } catch (error) {
    console.error("[registrar-cuenta-con-codigo] No se pudo enviar el correo:", error);
    throw new HttpError(503, "No se pudo enviar el código. Intenta de nuevo más tarde.");
  }

  return { ok: true };
}));
