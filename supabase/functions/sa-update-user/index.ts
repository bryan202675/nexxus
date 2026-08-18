// Equivalente a exports.saUpdateUser (nexxus/backend/index.js:2111).
import { getCaller, isDuplicateEmailError, isSuperAdmin, safeString, withHandler, writeAuditLog, HttpError, assertValidEmail } from "../_shared/nexxus.ts";

const PATCH_FIELDS = ["nombre", "correo", "telefono", "departamento_id", "cargo_id", "sede_id", "salario_base", "usuario_interno"];

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isSuperAdmin(caller)) throw new HttpError(403, "Solo el super admin puede editar usuarios.");

  const body = await req.json();
  const userId = safeString(body?.userId, 120);
  if (!userId) throw new HttpError(400, "Usuario requerido.");
  const patchInput = body?.patch && typeof body.patch === "object" ? body.patch : {};
  const rolInput = body?.rol ? safeString(body.rol, 40).toLowerCase() : null;
  const empresaIdInput = body?.empresaId ? safeString(body.empresaId, 120) : null;

  const { data: before, error: beforeError } = await admin.from("usuarios").select("*").eq("id", userId).maybeSingle();
  if (beforeError) throw new HttpError(500, beforeError.message);
  if (!before) throw new HttpError(404, "No se encontró el usuario.");

  const patch: Record<string, unknown> = {};
  for (const field of PATCH_FIELDS) {
    if (!(field in patchInput)) continue;
    patch[field] = field === "salario_base" ? Number(patchInput[field]) || 0 : patchInput[field];
  }

  let correoActualizado = false;
  if (typeof patch.correo === "string" && patch.correo && patch.correo !== before.correo) {
    assertValidEmail(patch.correo as string);
    const { error } = await admin.auth.admin.updateUserById(userId, { email: patch.correo as string });
    if (error) {
      if (isDuplicateEmailError(error)) throw new HttpError(409, "Ya existe una cuenta con ese correo.");
      throw new HttpError(400, error.message);
    }
    correoActualizado = true;
  }

  let cambioRol = false;
  let cambioEmpresa = false;
  let nuevaEmpresaId = before.empresa_id as string | null;
  if (rolInput && rolInput !== before.rol) {
    if (userId === caller.id) throw new HttpError(403, "No puedes cambiar tu propio rol.");
    if (rolInput === "super_admin" && !isSuperAdmin(caller)) throw new HttpError(403, "No autorizado.");
    patch.rol = rolInput;
    patch.role_updated_at = new Date().toISOString();
    patch.role_updated_by = caller.id;
    cambioRol = true;
  }
  if (empresaIdInput && empresaIdInput !== before.empresa_id) {
    const { data: empresaDestino } = await admin.from("empresas").select("id").eq("id", empresaIdInput).maybeSingle();
    if (!empresaDestino) throw new HttpError(404, "La empresa destino no existe.");
    patch.empresa_id = empresaIdInput;
    patch.departamento_id = null;
    patch.cargo_id = null;
    patch.sede_id = null;
    nuevaEmpresaId = empresaIdInput;
    cambioEmpresa = true;
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await admin.from("usuarios").update(patch).eq("id", userId);
    if (error) throw new HttpError(500, error.message);
  }

  // A diferencia de Firebase (donde el rol/empresa vivian en custom claims del
  // JWT y habia que forzar setCustomUserClaims + revokeRefreshTokens), las
  // politicas RLS de Postgres leen rol/empresa_id de public.usuarios en cada
  // consulta -- el cambio aplica de inmediato sin tocar la sesion del usuario.

  if (cambioRol) {
    await admin.from("sensitive_change_history").insert({
      empresa_id: nuevaEmpresaId,
      actor_id: caller.id,
      entidad: "usuarios",
      entidad_id: userId,
      cambios: { campo: "rol", antes: before.rol, despues: rolInput },
    });
  }

  await writeAuditLog(admin, {
    empresaId: nuevaEmpresaId || (before.empresa_id as string | null),
    actorId: caller.id,
    accion: cambioRol ? "Actualización de rol (super admin)" : "Actualización de usuario (super admin)",
    modulo: "Super Admin",
    detalles: cambioRol
      ? `${safeString(before.nombre, 120) || userId}: ${before.rol} -> ${rolInput}`
      : safeString(before.nombre, 160) || userId,
    targetId: userId,
  });

  return { ok: true, userId };
}));
