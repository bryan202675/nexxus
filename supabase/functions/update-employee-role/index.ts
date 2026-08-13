// Equivalente a exports.updateEmployeeRole (nexxus/backend/index.js:564).
import { getCaller, isAdminEmpresa, sameCompany, safeString, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isAdminEmpresa(caller)) throw new HttpError(403, "Solo administración puede actualizar roles.");

  const body = await req.json();
  const empleadoId = safeString(body?.empleadoId, 120);
  const nextRole = safeString(body?.rol, 40).toLowerCase();
  if (!empleadoId || !nextRole) throw new HttpError(400, "Empleado y rol son obligatorios.");
  if (nextRole === "super_admin") throw new HttpError(403, "No se puede asignar rol super admin desde empresa.");

  const { data: employee, error: employeeError } = await admin.from("usuarios").select("*").eq("id", empleadoId).maybeSingle();
  if (employeeError) throw new HttpError(500, employeeError.message);
  if (!employee) throw new HttpError(404, "No se encontró el empleado.");
  if (!sameCompany(caller, employee.empresa_id)) throw new HttpError(403, "No tienes acceso a este empleado.");
  if (employee.rol === "super_admin") throw new HttpError(403, "No puedes modificar un super admin.");
  if (nextRole === "admin_empresa" && caller.rol !== "admin_empresa" && caller.rol !== "super_admin") {
    throw new HttpError(403, "Solo un administrador de empresa puede asignar otro administrador.");
  }

  const previousRole = employee.rol;
  const { error } = await admin.from("usuarios").update({
    rol: nextRole,
    role_updated_at: new Date().toISOString(),
    role_updated_by: caller.id,
  }).eq("id", empleadoId);
  if (error) throw new HttpError(500, error.message);

  await admin.from("sensitive_change_history").insert({
    empresa_id: employee.empresa_id,
    actor_id: caller.id,
    entidad: "usuarios",
    entidad_id: empleadoId,
    cambios: { campo: "rol", antes: previousRole, despues: nextRole },
  });

  await writeAuditLog(admin, {
    empresaId: employee.empresa_id,
    actorId: caller.id,
    accion: "Actualización de rol",
    modulo: "Roles",
    detalles: `Empleado ${empleadoId}: ${previousRole} -> ${nextRole}`,
    targetId: empleadoId,
  });

  return { ok: true };
}));
