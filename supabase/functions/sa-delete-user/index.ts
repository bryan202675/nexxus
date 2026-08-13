// Equivalente a exports.saDeleteUser (nexxus/backend/index.js:2031).
// El purgado manual de USER_OWNED_COLLECTIONS del original es innecesario aqui:
// las tablas con datos propios del usuario tienen "usuario_id ... on delete
// cascade" y tareas.asignado_a tiene "on delete set null" (Fase 0) -- borrar
// la cuenta de auth.users cascada automaticamente a public.usuarios y de ahi
// a todo lo demas.
import { getCaller, isSuperAdmin, safeString, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isSuperAdmin(caller)) throw new HttpError(403, "Solo el super admin puede eliminar usuarios.");

  const body = await req.json();
  const userId = safeString(body?.userId, 120);
  const confirmName = safeString(body?.confirmName, 160);
  const force = body?.force === true;
  if (!userId || !confirmName) throw new HttpError(400, "Usuario y confirmación son obligatorios.");
  if (userId === caller.id) throw new HttpError(412, "No puedes eliminar tu propia cuenta desde aquí.");

  const { data: user, error: userError } = await admin.from("usuarios").select("*").eq("id", userId).maybeSingle();
  if (userError) throw new HttpError(500, userError.message);
  if (!user) throw new HttpError(404, "No se encontró el usuario.");
  if (user.rol === "super_admin") throw new HttpError(403, "No puedes eliminar a otro super admin.");
  if (confirmName.trim().toLowerCase() !== safeString(user.nombre, 160).trim().toLowerCase()) {
    throw new HttpError(412, "El nombre no coincide.");
  }

  if (user.empresa_id) {
    const { data: empresa } = await admin.from("empresas").select("admin_id").eq("id", user.empresa_id).maybeSingle();
    if (empresa?.admin_id === userId && !force) {
      throw new HttpError(412, "Es el propietario de la empresa; elimina la empresa completa o transfiere la propiedad.");
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError && !deleteError.message?.toLowerCase().includes("not found")) {
    throw new HttpError(500, deleteError.message);
  }

  await writeAuditLog(admin, {
    empresaId: user.empresa_id,
    actorId: caller.id,
    accion: "Eliminación de usuario",
    modulo: "Super Admin",
    detalles: safeString(user.nombre, 160),
    targetId: userId,
  });

  return { ok: true, userId };
}));
