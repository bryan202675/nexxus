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

export function plantillaCodigoDeAcceso(params: {
  nombre: string;
  codigo: string;
  proposito: "confirmacion" | "recuperacion" | "correo_recuperacion";
}): { subject: string; html: string } {
  const nombre = escapeHtml(params.nombre);
  const codigo = escapeHtml(params.codigo);
  const esRecuperacion = params.proposito === "recuperacion";
  const esCorreoRecuperacion = params.proposito === "correo_recuperacion";
  const titulo = esRecuperacion
    ? "Restablece tu contraseña"
    : esCorreoRecuperacion
      ? "Protege tu cuenta"
      : "Confirma tu correo";
  return {
    subject: `${titulo} de Nexxus`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #7C3AED;">${titulo}</h2>
        <p>Hola${nombre ? ` ${nombre}` : ""}, usa este código de seis dígitos en Nexxus:</p>
        <p style="margin: 24px 0; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a;">${codigo}</p>
        <p>${esRecuperacion ? "Con este código podrás elegir una contraseña nueva." : esCorreoRecuperacion ? "Con este código confirmarás tu correo de recuperación y lo usarás para iniciar sesión." : "Con este código confirmarás que este correo te pertenece."}</p>
        <p style="color: #666; font-size: 13px;">No compartas este código. Si no solicitaste esta acción, puedes ignorar este correo.</p>
      </div>
    `,
  };
}

// Correo de bienvenida al crear la cuenta (paso 1 del registro self-service, antes de que
// exista una empresa) -- distinto de plantillaBienvenidaEmpleado, que es para empleados
// invitados por un admin y ya incluye credenciales de una empresa existente.
export function plantillaBienvenidaNuevoUsuario(params: { nombre: string }): { subject: string; html: string } {
  const { nombre } = params;
  return {
    subject: `¡Bienvenido a Nexxus, ${nombre}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #7C3AED;">¡Bienvenido a Nexxus, ${nombre}!</h2>
        <p>Tu cuenta ya está creada. Nexxus es la plataforma donde vas a gestionar tu equipo, asistencia, nómina y mucho más, todo en un solo lugar.</p>
        <p>Solo te falta un paso: registra los datos de tu empresa para activar tu panel de administración.</p>
        <p style="color: #666; font-size: 13px; margin-top: 20px;">Si tú no creaste esta cuenta, puedes ignorar este correo.</p>
      </div>
    `,
  };
}

// Enviado justo después de crearCuentaYEmpresa (registro self-service, paso 3), para
// confirmar que la empresa quedó activa y darle al admin su código de acceso real.
export function plantillaEmpresaCreada(params: {
  nombreAdmin: string;
  nombreEmpresa: string;
  codigoEmpresa: string;
  plan?: string;
}): { subject: string; html: string } {
  const { nombreAdmin, nombreEmpresa, codigoEmpresa, plan } = params;
  return {
    subject: `Tu empresa ${nombreEmpresa} ya está lista en Nexxus`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #7C3AED;">¡Tu empresa ya está activa!</h2>
        <p>Hola ${nombreAdmin}, confirmamos que <strong>${nombreEmpresa}</strong> se creó correctamente en Nexxus y tu panel de administración ya está disponible.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 6px 0; color: #666;">Empresa</td><td style="padding: 6px 0; font-weight: bold;">${nombreEmpresa}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Código de empresa</td><td style="padding: 6px 0; font-weight: bold;">${codigoEmpresa}</td></tr>
          ${plan ? `<tr><td style="padding: 6px 0; color: #666;">Plan</td><td style="padding: 6px 0; font-weight: bold;">${plan}</td></tr>` : ''}
        </table>
        <p>Usa el código de empresa para invitar a tu equipo desde el panel de administración.</p>
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
