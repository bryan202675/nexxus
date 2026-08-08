// Equivalente a exports.resetEmployeePassword (nexxus/backend/index.js:636).
// Usada por web-dashboard. admin.auth.admin.updateUserById corre con
// privilegios de service_role, igual que admin.auth().updateUser en el
// original: no necesita reautenticarse como el empleado.
import { getCaller, isAdminEmpresa, sameCompany, safeString, withHandler, writeAuditLog, HttpError, assertValidPassword, hashPasswordInterno } from "../_shared/nexxus.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isAdminEmpresa(caller)) throw new HttpError(403, "Solo administración puede cambiar contraseñas.");

  const body = await req.json();
  const empleadoId = safeString(body?.empleadoId, 120);
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  if (!empleadoId) throw new HttpError(400, "Falta el empleado.");
  assertValidPassword(newPassword);

  const { data: employee, error: employeeError } = await admin.from("usuarios").select("*").eq("id", empleadoId).maybeSingle();
  if (employeeError) throw new HttpError(500, employeeError.message);
  if (!employee) throw new HttpError(404, "No se encontró el empleado.");
  if (!sameCompany(caller, employee.empresa_id)) throw new HttpError(403, "No tienes acceso a este empleado.");
  if (employee.rol === "super_admin") throw new HttpError(403, "No puedes modificar un super admin.");

  const { error: authError } = await admin.auth.admin.updateUserById(empleadoId, { password: newPassword });
  if (authError) throw new HttpError(500, authError.message);

  const passwordHash = await hashPasswordInterno(admin, newPassword);
  const { error } = await admin.from("usuarios").update({
    password_interno_hash: passwordHash,
    password_hash_algorithm: "bcrypt",
    password_updated_at: new Date().toISOString(),
  }).eq("id", empleadoId);
  if (error) throw new HttpError(500, error.message);

  await writeAuditLog(admin, {
    empresaId: employee.empresa_id,
    actorId: caller.id,
    accion: "Cambio de contraseña de empleado",
    modulo: "Plantilla",
    detalles: `Empleado ${empleadoId}`,
    targetId: empleadoId,
  });

  return { ok: true };
}));
