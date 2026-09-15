// Envío transaccional mediante SMTP de Gmail.
// Requiere GMAIL_SENDER_EMAIL y GMAIL_APP_PASSWORD en los secretos de Supabase.
import nodemailer from "npm:nodemailer@10.0.10";

function obtenerConfiguracion() {
  const from = Deno.env.get("GMAIL_SENDER_EMAIL");
  const appPassword = Deno.env.get("GMAIL_APP_PASSWORD");

  if (!from || !appPassword) {
    throw new Error("Faltan GMAIL_SENDER_EMAIL o GMAIL_APP_PASSWORD.");
  }

  return { from, appPassword };
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const { from, appPassword } = obtenerConfiguracion();
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: from, pass: appPassword },
  });

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
