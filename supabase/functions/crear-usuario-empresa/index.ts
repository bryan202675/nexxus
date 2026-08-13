// Equivalente a exports.crearUsuarioEmpresa (nexxus/backend/index.js:2678).
import { getCaller, isAdminEmpresa, safeString, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";
import { createCompanyUser } from "../_shared/company.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isAdminEmpresa(caller)) throw new HttpError(403, "Solo los administradores pueden crear usuarios.");
  if (!caller.empresa_id) throw new HttpError(412, "El administrador no tiene empresa asignada.");

  const body = await req.json();
  const result = await createCompanyUser(admin, {
    empresaId: caller.empresa_id,
    nombre: safeString(body?.nombre, 120),
    correo: safeString(body?.correo, 254).toLowerCase(),
    contrasena: typeof body?.contrasena === "string" ? body.contrasena : "",
    rol: body?.rol,
    actorId: caller.id,
    allowAdminRole: caller.rol === "admin_empresa",
    usuarioInterno: safeString(body?.usuarioInterno, 60),
    correoPersonal: safeString(body?.correoPersonal, 254),
  });

  await writeAuditLog(admin, {
    empresaId: caller.empresa_id,
    actorId: caller.id,
    accion: "Creación de Empleado",
    modulo: "Plantilla",
    detalles: `${body?.nombre} · ${body?.correo}`,
    targetId: result.uid,
  });

  return { success: true, uid: result.uid, codigoEmpresa: result.codigoEmpresa, usuarioInterno: result.usuarioInterno };
}));
