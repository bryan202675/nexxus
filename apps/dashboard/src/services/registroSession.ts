import { supabase } from "supabaseClient/supabaseConfig";

export const SESSION_REQUIRED = "Confirma tu correo e inicia sesión para continuar con la creación de tu empresa.";

export async function requireRegistrationSession(expectedUid?: string): Promise<void> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session || (expectedUid && data.session.user.id !== expectedUid)) {
    throw new Error(SESSION_REQUIRED);
  }
  const { data: verified, error: verificationError } = await supabase.auth.getUser();
  if (verificationError || !verified.user || verified.user.id !== data.session.user.id) {
    throw new Error(SESSION_REQUIRED);
  }
}

export function registrationErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === SESSION_REQUIRED) return SESSION_REQUIRED;
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : null;
  if (code === "42501") return "No tienes permiso para crear la empresa. Confirma tu correo e inicia sesión de nuevo.";
  if (code === "23505") return "Ya existe una empresa con esos datos. Revisa el nombre e intenta de nuevo.";
  return "No se pudo crear la empresa. Intenta de nuevo; si el problema continúa, contacta con soporte.";
}
