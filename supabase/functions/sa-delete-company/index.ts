// Equivalente a exports.saDeleteCompany (nexxus/backend/index.js:1980).
// La cascada de borrado que en Firestore requeria purgeCompanyData recorriendo
// ~15 colecciones a mano, aqui es automatica: todas las tablas tenant-scoped
// tienen "empresa_id references empresas(id) on delete cascade" (Fase 0).
import { getCaller, isSuperAdmin, safeString, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isSuperAdmin(caller)) throw new HttpError(403, "Solo el super admin puede eliminar empresas.");

  const body = await req.json();
  const empresaId = safeString(body?.empresaId, 120);
  const confirmName = safeString(body?.confirmName, 160);
  if (!empresaId || !confirmName) throw new HttpError(400, "Empresa y confirmación son obligatorias.");

  const { data: empresa, error: empresaError } = await admin.from("empresas").select("nombre, codigo").eq("id", empresaId).maybeSingle();
  if (empresaError) throw new HttpError(500, empresaError.message);
  if (!empresa) throw new HttpError(404, "No se encontró la empresa.");
  if (confirmName.trim().toLowerCase() !== String(empresa.nombre).trim().toLowerCase()) {
    throw new HttpError(412, "El nombre no coincide.");
  }

  const { data: usuarios, error: usuariosError } = await admin.from("usuarios").select("id").eq("empresa_id", empresaId);
  if (usuariosError) throw new HttpError(500, usuariosError.message);

  await writeAuditLog(admin, {
    empresaId: null,
    actorId: caller.id,
    accion: "Eliminación total de empresa (iniciada)",
    modulo: "Super Admin",
    detalles: empresa.nombre,
    targetId: empresaId,
  });

  const { error: deleteError } = await admin.from("empresas").delete().eq("id", empresaId);
  if (deleteError) throw new HttpError(500, deleteError.message);

  // En paralelo en vez de un borrado de Auth a la vez, por la misma razón que en
  // sa-set-company-ban: evitar agotar el tiempo límite de ejecución con empresas grandes.
  await Promise.allSettled(
    (usuarios || []).map((usuario) =>
      admin.auth.admin.deleteUser(usuario.id).catch((error: Error) => {
        console.warn("saDeleteCompany auth delete", usuario.id, error.message);
      })
    )
  );

  await writeAuditLog(admin, {
    empresaId: null,
    actorId: caller.id,
    accion: "Eliminación total de empresa (completada)",
    modulo: "Super Admin",
    detalles: empresa.nombre,
    targetId: empresaId,
  });

  return { ok: true, empresaId, usuariosEliminados: (usuarios || []).length };
}));
