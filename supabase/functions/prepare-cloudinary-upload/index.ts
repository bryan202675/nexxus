// Equivalente a exports.prepareCloudinaryUpload (nexxus/backend/index.js:1053).
import { getCaller, withHandler } from "../_shared/nexxus.ts";
import { assertUploadAccess, enforceUploadRateLimit } from "../_shared/uploads.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  const data = await req.json();
  assertUploadAccess(caller, data);
  await enforceUploadRateLimit(admin, caller.id);

  const { data: duplicate } = await admin
    .from("archivos_cloudinary")
    .select("id, url, public_id")
    .eq("empresa_id", data.empresaId)
    .eq("hash", data.hash)
    .eq("kind", data.kind)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  if (duplicate) {
    return { duplicate: true, assetId: duplicate.id, url: duplicate.url, publicId: duplicate.public_id };
  }
  return { duplicate: false };
}));
