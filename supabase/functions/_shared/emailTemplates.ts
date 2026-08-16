// Plantillas HTML de correo transaccional, Fase 11. Diseño simple a propósito --
// se define el layout final más adelante, esto solo deja el contenido correcto.

// Usado para interpolar texto que viene de un formulario público sin sesión
// (solicitudes_soporte_publico) -- a diferencia del resto de plantillas, aquí el
// contenido no es de confianza y se escapa antes de insertarlo en el HTML del correo.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function plantillaRecuperacionPassword(params: {
  nombre: string;
  link: string;
}): { subject: string; html: string } {
  const { nombre, link } = params;
  return {
    subject: "Recupera tu contraseña de Nexxus",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #7C3AED;">Recupera tu contraseña</h2>
        <p>Hola${nombre ? ` ${nombre}` : ''}, recibimos una solicitud para restablecer tu contraseña de Nexxus.</p>
        <p style="margin: 24px 0;">
          <a href="${link}" style="background: #7C3AED; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Restablecer contraseña</a>
        </p>
        <p style="color: #666; font-size: 13px;">Si tú no pediste esto, ignora este correo -- tu cuenta sigue segura.</p>
      </div>
    `,
  };
}

export function plantillaBienvenidaEmpleado(params: {
  nombre: string;
  nombreEmpresa: string;
  codigoEmpresa: string;
  usuarioInterno: string;
  contrasenaTemporal: string;
}): { subject: string; html: string } {
  const { nombre, nombreEmpresa, codigoEmpresa, usuarioInterno, contrasenaTemporal } = params;
  return {
    subject: `Bienvenido a Nexxus, ${nombre}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #7C3AED;">Bienvenido a ${nombreEmpresa}</h2>
        <p>Hola ${nombre}, ya tienes una cuenta en Nexxus. Estos son tus datos de acceso:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 6px 0; color: #666;">Código de empresa</td><td style="padding: 6px 0; font-weight: bold;">${codigoEmpresa}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Usuario</td><td style="padding: 6px 0; font-weight: bold;">${usuarioInterno}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Contraseña temporal</td><td style="padding: 6px 0; font-weight: bold;">${contrasenaTemporal}</td></tr>
        </table>
        <p>Te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.</p>
      </div>
    `,
  };
}

export function plantillaRespuestaSoportePublico(params: {
  nombre: string;
  ticketCodigo: string;
  asunto: string;
  respuesta: string;
  recoveryLink?: string;
}): { subject: string; html: string } {
  const { nombre, ticketCodigo, asunto, respuesta, recoveryLink } = params;
  const respuestaHtml = escapeHtml(respuesta).replace(/\n/g, '<br/>');
  return {
    subject: `Respuesta a tu solicitud de soporte (${ticketCodigo})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #7C3AED;">Respuesta de Soporte Nexxus</h2>
        <p>Hola${nombre ? ` ${escapeHtml(nombre)}` : ''}, tu solicitud <strong>${escapeHtml(ticketCodigo)}</strong> (${escapeHtml(asunto)}) tiene una respuesta de nuestro equipo:</p>
        <div style="background: #F5F3FF; border-left: 3px solid #7C3AED; padding: 12px 16px; margin: 20px 0; border-radius: 6px; color: #1a1a1a;">
          ${respuestaHtml}
        </div>
        ${recoveryLink ? `
        <p style="margin: 24px 0;">
          <a href="${recoveryLink}" style="background: #7C3AED; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Restablecer mi contraseña</a>
        </p>
        <p style="color: #666; font-size: 13px;">Si no pediste este enlace, ignóralo -- tu cuenta sigue segura.</p>
        ` : ''}
        <p style="color: #666; font-size: 13px; margin-top: 20px;">Si necesitas agregar algo más, responde a este correo o crea una nueva solicitud desde Nexxus.</p>
      </div>
    `,
  };
}
