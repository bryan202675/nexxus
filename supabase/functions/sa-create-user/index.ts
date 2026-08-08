// Equivalente a exports.saCreateUser (nexxus/backend/index.js:2327).
import { getCaller, isSuperAdmin, safeString, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";
import { createCompanyUser } from "../_shared/company.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isSuperAdmin(caller)) throw new HttpError(403, "Solo el super admin puede crear usuarios.");

  const body = await req.json();
  const empresaId = safeString(body?.empresaId, 120);
  if (!empresaId) throw new HttpError(400, "Empresa requerida.");
  const { data: empresa } = await admin.from("empresas").select("id").eq("id", empresaId).maybeSingle();
  if (!empresa) throw new HttpError(404, "No se encontró la empresa.");

  const result = await createCompanyUser(admin, {
    empresaId,
    nombre: safeString(body?.nombre, 120),
    correo: safeString(body?.correo, 254).toLowerCase(),
    contrasena: typeof body?.contrasena === "string" ? body.contrasena : "",
    rol: body?.rol,
    actorId: caller.id,
    allowAdminRole: true,
    usuarioInterno: safeString(body?.usuarioInterno, 60),
  });

  await writeAuditLog(admin, {
    empresaId,
    actorId: caller.id,
    accion: "Creación de usuario (super admin)",
    modulo: "Super Admin",
    detalles: safeString(body?.nombre, 160),
    targetId: result.uid,
  });

  return { ok: true, uid: result.uid };
}));
