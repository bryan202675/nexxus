// Envío transaccional mediante SMTP de Gmail.
// Soporta tanto App Password (GMAIL_SENDER_EMAIL + GMAIL_APP_PASSWORD)
// como OAuth2 (GMAIL_SENDER_EMAIL + GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET + GMAIL_REFRESH_TOKEN).
import nodemailer from "npm:nodemailer@10.0.10";

function obtenerTransport() {
  const from = Deno.env.get("GMAIL_SENDER_EMAIL");
  const appPassword = Deno.env.get("GMAIL_APP_PASSWORD");
  const clientId = Deno.env.get("GMAIL_CLIENT_ID");
  const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GMAIL_REFRESH_TOKEN");

  if (!from) {
    throw new Error("Falta configurar GMAIL_SENDER_EMAIL en los secretos de Supabase.");
  }

  if (appPassword) {
    return {
      from,
      transport: nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: from, pass: appPassword },
      }),
    };
  }

  if (clientId && clientSecret && refreshToken) {
    return {
      from,
      transport: nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: from,
          clientId,
          clientSecret,
          refreshToken,
        },
      }),
    };
  }

  throw new Error("Faltan las credenciales de Gmail en Supabase (GMAIL_APP_PASSWORD o GMAIL_CLIENT_ID/GMAIL_CLIENT_SECRET/GMAIL_REFRESH_TOKEN).");
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const { from, transport } = obtenerTransport();

  try {
    await transport.sendMail({
      from: `Nexxus <${from}>`,
      to,
      subject,
      html,
    });
  } finally {
    transport.close();
  }
}
