// Envia una notificacion push via Expo Push Service a todos los tokens registrados de un usuario
// (Fase 10). El caller debe ser de la misma empresa que el destinatario -- evita que un usuario
// autenticado le mande push a gente de otra empresa pasando cualquier userId.
//
// Expo Push API: https://docs.expo.dev/push-notifications/sending-notifications/
import { getCaller, sameCompany, safeString, withHandler, HttpError } from "../_shared/nexxus.ts";

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

interface ExpoPushTicket {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  const body = await req.json();
  const userId = safeString(body?.userId, 120);
  const titulo = safeString(body?.titulo, 120);
  const mensaje = safeString(body?.mensaje, 300);
  const data = body?.data && typeof body.data === "object" ? body.data : undefined;
  if (!userId || !titulo || !mensaje) throw new HttpError(400, "Faltan userId, titulo o mensaje.");

  const { data: destinatario, error: destinatarioError } = await admin
    .from("usuarios")
    .select("id, empresa_id")
    .eq("id", userId)
    .maybeSingle();
  if (destinatarioError) throw new HttpError(500, destinatarioError.message);
  if (!destinatario) throw new HttpError(404, "No se encontró el usuario destino.");
  if (!sameCompany(caller, destinatario.empresa_id)) {
    throw new HttpError(403, "No puedes enviar notificaciones a otra empresa.");
  }

  const { data: tokens, error: tokensError } = await admin
    .from("push_tokens")
    .select("token")
    .eq("usuario_id", userId);
  if (tokensError) throw new HttpError(500, tokensError.message);
  if (!tokens || tokens.length === 0) {
    // No es un error: el usuario simplemente no tiene ningún dispositivo con push registrado
    // (nunca abrió la app en un dispositivo físico, o está en web).
    return { ok: true, enviados: 0 };
  }

  const mensajes = tokens.map((row: { token: string }) => ({
    to: row.token,
    title: titulo,
    body: mensaje,
    data: data ?? {},
    sound: "default",
  }));

  const response = await fetch(EXPO_PUSH_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(mensajes),
  });
  if (!response.ok) {
    const texto = await response.text().catch(() => "");
    throw new HttpError(502, `Expo Push Service respondió con error: ${texto.slice(0, 200)}`);
  }

  const json = await response.json();
  const tickets: ExpoPushTicket[] = Array.isArray(json?.data) ? json.data : [];

  // Los tokens que Expo marca como "DeviceNotRegistered" ya no sirven (desinstalaron la app, etc.)
  // -- se limpian para no seguir intentando enviarles en el futuro.
  const tokensInvalidos = tickets
    .map((ticket, index) => (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered" ? tokens[index]?.token : null))
    .filter((token): token is string => Boolean(token));
  if (tokensInvalidos.length > 0) {
    await admin.from("push_tokens").delete().in("token", tokensInvalidos);
  }

  return { ok: true, enviados: tickets.filter((t) => t.status === "ok").length, invalidos: tokensInvalidos.length };
}));
