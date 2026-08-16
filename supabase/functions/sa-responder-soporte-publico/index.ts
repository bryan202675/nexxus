// Responde una solicitud de soporte público (solicitudes_soporte_publico -- gente sin cuenta,
// ver SoporteGeneral.tsx en apps/mobile). A diferencia de responder_ticket_soporte (tickets de
// empresa/usuario, que tienen hilo in-app), quien manda esta solicitud no tiene sesión ni forma
// de volver a ver un hilo, así que la respuesta se envía por correo vía Gmail API (mismo mecanismo
// que solicitar-recuperacion-password).
import { getCaller, isSuperAdmin, safeString, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";
import { sendEmail } from "../_shared/gmail.ts";
import { plantillaRespuestaSoportePublico } from "../_shared/emailTemplates.ts";

const ESTADOS_VALIDOS = new Set(["pendiente", "en_revision", "contactado", "resuelto"]);

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isSuperAdmin(caller)) throw new HttpError(403, "Solo el super admin puede responder solicitudes de soporte.");

  const body = await req.json();
  const id = safeString(body?.id, 60);
  const respuesta = safeString(body?.respuesta, 4000);
  const nuevoEstadoRaw = safeString(body?.nuevoEstado, 20);
  const incluirLinkRecuperacion = Boolean(body?.incluirLinkRecuperacion);
  const redirectTo = safeString(body?.redirectTo, 300);

  if (!id) throw new HttpError(400, "Falta id.");
  if (!respuesta) throw new HttpError(400, "La respuesta no puede estar vacía.");
  const nuevoEstado = nuevoEstadoRaw && ESTADOS_VALIDOS.has(nuevoEstadoRaw) ? nuevoEstadoRaw : "contactado";

  const { data: solicitud, error: solicitudError } = await admin
    .from("solicitudes_soporte_publico")
    .select("id, nombre, correo, ticket_codigo, asunto")
    .eq("id", id)
    .maybeSingle();
  if (solicitudError) throw new HttpError(500, solicitudError.message);
  if (!solicitud) throw new HttpError(404, "No se encontró la solicitud.");

  let recoveryLink: string | undefined;
  if (incluirLinkRecuperacion) {
    const { data: usuario } = await admin
      .from("usuarios")
      .select("correo")
      .eq("correo", solicitud.correo)
      .eq("eliminado", false)
      .maybeSingle();
    if (usuario?.correo) {
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: usuario.correo,
        ...(redirectTo ? { options: { redirectTo } } : {}),
      });
      if (linkError) {
        console.error("[sa-responder-soporte-publico] generateLink falló:", linkError);
      } else {
        recoveryLink = linkData?.properties?.action_link;
      }
    }
  }

  const { error: updateError } = await admin
    .from("solicitudes_soporte_publico")
    .update({
      respuesta_soporte: respuesta,
      estado: nuevoEstado,
      atendido_por: caller.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateError) throw new HttpError(500, updateError.message);

  const { subject, html } = plantillaRespuestaSoportePublico({
    nombre: solicitud.nombre || "",
    ticketCodigo: solicitud.ticket_codigo || "",
    asunto: solicitud.asunto || "",
    respuesta,
    recoveryLink,
  });

  let correoEnviado = true;
  try {
    await sendEmail(solicitud.correo, subject, html);
  } catch (error) {
    correoEnviado = false;
    console.error("[sa-responder-soporte-publico] No se pudo enviar el correo:", error);
  }

  await writeAuditLog(admin, {
    empresaId: null,
    actorId: caller.id,
    accion: "Respuesta a solicitud de soporte público",
    modulo: "Super Admin",
    detalles: safeString(solicitud.ticket_codigo, 60),
    targetId: id,
  });

  return { ok: true, correoEnviado, recoveryLinkGenerado: Boolean(recoveryLink) };
}));
