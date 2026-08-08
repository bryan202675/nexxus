// Equivalente a exports.updateSensitiveEmployeeProfile (nexxus/backend/index.js:505).
import { getCaller, isAdminEmpresa, sameCompany, safeString, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";

const SENSITIVE_FIELDS = [
  "salario_base", "tipo_contrato", "banco", "cuenta_bancaria",
  "bonos_recurrentes", "comisiones_recurrentes", "descuentos_recurrentes", "afp_pertenece",
] as const;

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isAdminEmpresa(caller)) throw new HttpError(403, "Solo administración puede actualizar datos sensibles.");

  const body = await req.json();
  const empleadoId = safeString(body?.empleadoId, 120);
  if (!empleadoId) throw new HttpError(400, "Empleado requerido.");

  const { data: employee, error: employeeError } = await admin.from("usuarios").select("*").eq("id", empleadoId).maybeSingle();
  if (employeeError) throw new HttpError(500, employeeError.message);
  if (!employee) throw new HttpError(404, "No se encontró el empleado.");
  if (!sameCompany(caller, employee.empresa_id)) throw new HttpError(403, "No tienes acceso a este empleado.");

  const profile = body?.profile || {};
  const patch = {
    salario_base: Number(profile.salario_base || 0),
    tipo_contrato: safeString(profile.tipo_contrato, 40),
    banco: safeString(profile.banco, 120),
    cuenta_bancaria: safeString(profile.cuenta_bancaria, 80),
    bonos_recurrentes: Number(profile.bonos_recurrentes || 0),
    comisiones_recurrentes: Number(profile.comisiones_recurrentes || 0),
    descuentos_recurrentes: Number(profile.descuentos_recurrentes || 0),
    afp_pertenece: safeString(profile.afp_pertenece, 40),
  };
  for (const field of ["salario_base", "bonos_recurrentes", "comisiones_recurrentes", "descuentos_recurrentes"] as const) {
    if (!Number.isFinite(patch[field]) || patch[field] < 0) {
      throw new HttpError(400, "Los montos sensibles deben ser números positivos.");
    }
  }

  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};
  for (const field of SENSITIVE_FIELDS) {
    before[field] = employee[field] ?? null;
    after[field] = (patch as Record<string, unknown>)[field] ?? null;
  }

  const { error: updateError } = await admin.from("usuarios").update({
    ...patch,
    sensitive_updated_at: new Date().toISOString(),
    sensitive_updated_by: caller.id,
  }).eq("id", empleadoId);
  if (updateError) throw new HttpError(500, updateError.message);

  const { data: change, error: changeError } = await admin.from("sensitive_change_history").insert({
    empresa_id: employee.empresa_id,
    actor_id: caller.id,
    entidad: "usuarios",
    entidad_id: empleadoId,
    cambios: { campos: SENSITIVE_FIELDS, antes: before, despues: after },
  }).select("id").single();
  if (changeError) throw new HttpError(500, changeError.message);

  await writeAuditLog(admin, {
    empresaId: employee.empresa_id,
    actorId: caller.id,
    accion: "Actualización perfil sensible",
    modulo: "Nómina",
    detalles: `Empleado ${empleadoId}`,
    targetId: empleadoId,
  });

  return { ok: true, changeId: change.id };
}));
