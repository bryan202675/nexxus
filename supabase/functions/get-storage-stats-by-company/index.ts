// Equivalente a exports.getStorageStatsByCompany (nexxus/backend/index.js:1169).
import { getCaller, sameCompany, withHandler, HttpError } from "../_shared/nexxus.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  const body = await req.json().catch(() => ({}));
  const empresaId = body?.empresaId || caller.empresa_id;
  if (!sameCompany(caller, empresaId)) throw new HttpError(403, "No tienes acceso a esta empresa.");

  const { data: assets, error } = await admin
    .from("archivos_cloudinary")
    .select("tamano_bytes, usuario_id, document_user_id")
    .eq("empresa_id", empresaId)
    .eq("activo", true);
  if (error) throw new HttpError(500, error.message);

  const byUser: Record<string, number> = {};
  let totalBytes = 0;
  for (const asset of assets || []) {
    const size = Number(asset.tamano_bytes || 0);
    totalBytes += size;
    const key = asset.usuario_id || asset.document_user_id || "sin_usuario";
    byUser[key] = (byUser[key] || 0) + size;
  }

  const topUsers = Object.entries(byUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([userId, bytes]) => ({ userId, bytes }));

  return { totalBytes, uploadCount: (assets || []).length, topUsers };
}));
