// Equivalente a exports.saCreateCompany (nexxus/backend/index.js:2280).
import { getCaller, isSuperAdmin, safeString, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";
import { createCompanyWithOwner } from "../_shared/company.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isSuperAdmin(caller)) throw new HttpError(403, "Solo el super admin puede crear empresas.");

  const body = await req.json();
  const result = await createCompanyWithOwner(admin, {
    nombreEmpresa: safeString(body?.nombreEmpresa, 120),
    nombreAdmin: safeString(body?.nombreAdmin, 120),
    correoAdmin: safeString(body?.correoAdmin, 254).toLowerCase(),
    contrasenaAdmin: typeof body?.contrasenaAdmin === "string" ? body.contrasenaAdmin : "",
    usuarioInterno: safeString(body?.usuarioInterno, 60),
    planId: body?.planId || null,
  });

  await writeAuditLog(admin, {
    empresaId: result.empresaId,
    actorId: caller.id,
    accion: "Creación de empresa (super admin)",
    modulo: "Super Admin",
    detalles: body?.nombreEmpresa,
    targetId: result.empresaId,
  });

  return { ok: true, ...result };
}));
