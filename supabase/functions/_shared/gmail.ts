// Envío de correo transaccional vía Gmail API (OAuth2), Fase 11.
// Requiere 4 secrets configurados en el proyecto de Supabase:
//   GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER_EMAIL
// El refresh token se generó una vez vía OAuth Playground con el scope gmail.send,
// autorizado con la cuenta GMAIL_SENDER_EMAIL. Nunca expira mientras no se revoque el acceso.

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SEND_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

async function obtenerAccessToken(): Promise<string> {
  const clientId = Deno.env.get("GMAIL_CLIENT_ID");
  const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GMAIL_REFRESH_TOKEN");
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Faltan GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN.");
  }
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    const texto = await response.text().catch(() => "");
    throw new Error(`No se pudo renovar el access token de Gmail: ${texto.slice(0, 200)}`);
  }
  const json = await response.json();
  return json.access_token as string;
}

function base64UrlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function construirMensajeMime(from: string, to: string, subject: string, html: string): string {
  const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    html,
  ];
  return base64UrlEncode(lines.join("\r\n"));
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const from = Deno.env.get("GMAIL_SENDER_EMAIL");
  if (!from) throw new Error("Falta GMAIL_SENDER_EMAIL.");
  const accessToken = await obtenerAccessToken();
  const raw = construirMensajeMime(`Nexxus <${from}>`, to, subject, html);
  const response = await fetch(SEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  if (!response.ok) {
    const texto = await response.text().catch(() => "");
    throw new Error(`Gmail API respondió con error: ${texto.slice(0, 200)}`);
  }
}
