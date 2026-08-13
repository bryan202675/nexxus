// Equivalente a assertUploadAccess/enforceUploadRateLimit (nexxus/backend/index.js:187-224).
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Caller, HttpError, isAdminEmpresa, sameCompany } from "./nexxus.ts";

export function assertUploadAccess(caller: Caller, data: Record<string, unknown>) {
  const kind = data.kind as string;
  const empresaId = data.empresaId as string;
  const ownerId = data.ownerId as string | undefined;
  const documentUserId = data.documentUserId as string | undefined;

  if (!sameCompany(caller, empresaId)) throw new HttpError(403, "No tienes acceso a esta empresa.");
  if (kind === "profilePhoto" && ownerId !== caller.id && !isAdminEmpresa(caller)) {
    throw new HttpError(403, "No puedes modificar esta foto.");
  }
  if (kind === "companyLogo" && !isAdminEmpresa(caller)) {
    throw new HttpError(403, "Solo un administrador puede cambiar el logo.");
  }
  if (kind === "document" && !isAdminEmpresa(caller)) {
    throw new HttpError(403, "Solo un administrador puede subir documentos.");
  }
  if (kind === "document" && !documentUserId) {
    throw new HttpError(400, "El documento necesita usuario destino.");
  }
  if (kind === "chatAttachment" && ownerId !== caller.id) {
    throw new HttpError(403, "Solo puedes subir adjuntos de tu propio usuario.");
  }
}

export async function enforceUploadRateLimit(admin: SupabaseClient, uid: string) {
  const windowMs = 5 * 60 * 1000;
  const { data: row } = await admin.from("upload_rate_limits").select("*").eq("usuario_id", uid).maybeSingle();
  const windowStart = row ? new Date(row.ventana_inicio).getTime() : 0;
  const now = Date.now();
  const count = now - windowStart > windowMs ? 0 : Number(row?.cantidad || 0);
  if (count >= 10) throw new HttpError(429, "Demasiadas subidas. Intenta nuevamente en unos minutos.");
  await admin.from("upload_rate_limits").upsert({
    usuario_id: uid,
    ventana_inicio: count === 0 ? new Date(now).toISOString() : row!.ventana_inicio,
    cantidad: count + 1,
  }, { onConflict: "usuario_id" });
}
