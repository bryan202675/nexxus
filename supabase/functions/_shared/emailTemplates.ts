// Plantillas HTML de correo transaccional, Fase 11. Diseño simple a propósito --
// se define el layout final más adelante, esto solo deja el contenido correcto.

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
