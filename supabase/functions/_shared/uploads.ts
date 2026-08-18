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
  // Chequeo + incremento atómico en una sola sentencia SQL (ver
  // migración rate_limit_uploads_atomico) -- un SELECT separado seguido de un UPSERT permitía
  // que dos subidas simultáneas del mismo usuario ambas pasaran el límite de 10 cada 5 minutos.
  const { error } = await admin.rpc("enforce_upload_rate_limit", { p_usuario_id: uid });
  if (error) {
    if (error.message?.includes("RATE_LIMIT_EXCEEDED")) {
      throw new HttpError(429, "Demasiadas subidas. Intenta nuevamente en unos minutos.");
    }
    throw new HttpError(500, error.message);
  }
}
