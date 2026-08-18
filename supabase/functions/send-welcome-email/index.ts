// Envía el correo de bienvenida justo después de crear la cuenta (paso 1 del registro
// self-service en apps/dashboard/src/views/nexxus/registro/index.tsx) -- ANTES de que exista
// una fila en "usuarios" (esa se crea recién en el paso 3, crearCuentaYEmpresa), así que no
// se puede usar getCaller de _shared/nexxus.ts aquí: solo se valida el JWT de Supabase Auth.
// Nombre y correo se leen del JWT verificado, nunca del body, para que nadie pueda usar este
// endpoint para mandar correos a direcciones arbitrarias.
//
// Idempotente vía user_metadata.welcomeEmailSentAt: el flujo de Google OAuth reejecuta el
// mismo useEffect en cada remount mientras el usuario todavía no tiene empresa (para recuperar
// el paso del registro tras un refresh), así que sin esto se reenviaría el correo cada vez.
import { safeString, withHandler } from "../_shared/nexxus.ts";
import { sendEmail } from "../_shared/gmail.ts";
import { plantillaBienvenidaNuevoUsuario } from "../_shared/emailTemplates.ts";

Deno.serve(withHandler(async (req, admin) => {
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return { ok: false };

  const { data: userData, error } = await admin.auth.getUser(jwt);
  if (error || !userData?.user?.email) return { ok: false };

  const metadata = (userData.user.user_metadata || {}) as Record<string, unknown>;
  if (metadata.welcomeEmailSentAt) return { ok: true, already: true };

  const nombre = safeString(metadata.displayName || metadata.full_name || metadata.name, 120) ||
    userData.user.email.split("@")[0];

  const { subject, html } = plantillaBienvenidaNuevoUsuario({ nombre });
  try {
    await sendEmail(userData.user.email, subject, html);
  } catch (sendError) {
    console.error("[send-welcome-email] No se pudo enviar el correo:", sendError);
    return { ok: false };
  }

  await admin.auth.admin.updateUserById(userData.user.id, {
    user_metadata: { ...metadata, welcomeEmailSentAt: new Date().toISOString() },
  }).catch((updateError) => {
    console.error("[send-welcome-email] No se pudo marcar el correo como enviado:", updateError);
  });

  return { ok: true };
}));
