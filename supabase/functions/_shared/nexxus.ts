// Helpers compartidos por las Edge Functions de Nexxus.
// Equivalente a getCaller/isAdmin/isSuperAdmin/writeAuditLog/sameTenant de
// nexxus/backend/index.js, portado de Firestore Admin SDK a Supabase.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export interface Caller {
  id: string;
  empresa_id: string | null;
  rol: string;
  nombre: string;
  correo: string;
  baneado: boolean;
  eliminado: boolean;
}

// Equivalente a getCaller(request.auth): valida el JWT del header Authorization
// y carga la fila de usuarios correspondiente (con privilegios de service_role,
// sin pasar por RLS -- igual que admin.firestore() en el original).
export async function getCaller(req: Request, admin: SupabaseClient): Promise<Caller> {
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) throw new HttpError(401, "Usuario no autenticado.");

  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  if (userError || !userData?.user) throw new HttpError(401, "Usuario no autenticado.");

  const { data: usuario, error } = await admin
    .from("usuarios")
    .select("id, empresa_id, rol, nombre, correo, baneado, eliminado")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (error) throw new HttpError(500, error.message);
  if (!usuario) throw new HttpError(403, "No se encontró el usuario.");
  if (usuario.baneado || usuario.eliminado) {
    throw new HttpError(403, "Tu cuenta no tiene acceso a esta operación.");
  }
  return usuario as Caller;
}

export function isSuperAdmin(caller: Caller): boolean {
  return caller.rol === "super_admin";
}
export function isAdminEmpresa(caller: Caller): boolean {
  return isSuperAdmin(caller) || caller.rol === "admin" || caller.rol === "admin_empresa";
}
export function isJefe(caller: Caller): boolean {
  return isAdminEmpresa(caller) || caller.rol === "jefe" || caller.rol === "jefe_sector";
}
export function sameCompany(caller: Caller, empresaId: string | null | undefined): boolean {
  return isSuperAdmin(caller) || (!!empresaId && empresaId === caller.empresa_id);
}

export const isCanonicalRole = (rol: string) =>
  ["admin", "admin_empresa", "jefe", "jefe_sector", "super_admin"].includes(rol);

// Contexto de datos para el asistente de IA (chat de texto y voz): tareas, asistencias,
// solicitudes, etc. escopados por rol/empresa del caller. Compartido para que ambos canales
// respondan sobre la misma informacion real, nunca inventada.
export async function buildAiContext(
  admin: SupabaseClient,
  caller: Caller,
): Promise<Record<string, unknown>> {
  if (isSuperAdmin(caller) && !caller.empresa_id) {
    const [{ data: empresas }, { data: usuarios }, { data: pagos }] = await Promise.all([
      admin.from("empresas").select("*").limit(50),
      admin.from("usuarios").select("*").limit(120),
      admin.from("payments").select("*").limit(80),
    ]);
    return { alcance: "plataforma", empresas, usuarios, pagos };
  }
  if (!caller.empresa_id) throw new HttpError(412, "Tu usuario no tiene empresa asociada.");
  if (isCanonicalRole(caller.rol)) {
    const [tareas, asistencias, reportes, ausencias, nominas] = await Promise.all([
      admin.from("tareas").select("*").eq("empresa_id", caller.empresa_id).limit(80),
      admin.from("asistencias").select("*").eq("empresa_id", caller.empresa_id).limit(80),
      admin.from("reportes").select("*").eq("empresa_id", caller.empresa_id).limit(60),
      admin.from("solicitudes_ausencia").select("*").eq("empresa_id", caller.empresa_id).limit(60),
      admin.from("nominas").select("*").eq("empresa_id", caller.empresa_id).limit(60),
    ]);
    return {
      alcance: "empresa",
      tareas: tareas.data,
      asistencias: asistencias.data,
      reportes: reportes.data,
      ausencias: ausencias.data,
      nominas: nominas.data,
    };
  }
  const [tareas, ausencias, nominas] = await Promise.all([
    admin.from("tareas").select("*").eq("empresa_id", caller.empresa_id).eq("asignado_a", caller.id).limit(20),
    admin.from("solicitudes_ausencia").select("*").eq("empresa_id", caller.empresa_id).eq("usuario_id", caller.id).limit(12),
    admin.from("nominas").select("*").eq("empresa_id", caller.empresa_id).eq("usuario_id", caller.id).limit(12),
  ]);
  return {
    alcance: "personal",
    tareas: tareas.data,
    ausencias: ausencias.data,
    nominas: nominas.data,
  };
}

export async function writeAuditLog(admin: SupabaseClient, entry: {
  empresaId: string | null;
  actorId: string | null;
  accion: string;
  modulo?: string;
  detalles?: string;
  targetId?: string | null;
}) {
  await admin.from("audit_logs").insert({
    empresa_id: entry.empresaId,
    actor_id: entry.actorId,
    accion: entry.accion,
    modulo: entry.modulo || null,
    detalles: entry.detalles || null,
    target_id: entry.targetId || null,
  });
}

export function safeString(value: unknown, maxLength = 160): string {
  return String(value ?? "").trim().slice(0, maxLength);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function assertValidEmail(email: string) {
  if (!EMAIL_PATTERN.test(email)) throw new HttpError(400, "Correo inválido.");
}
export const MIN_PASSWORD_LENGTH = 8;
export function assertValidPassword(password: string) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }
}

export async function hashPasswordInterno(admin: SupabaseClient, password: string): Promise<string> {
  const { data, error } = await admin.rpc("hash_password_interno", { p_password: password });
  if (error) throw new HttpError(500, error.message);
  return data as string;
}

// Envuelve el handler de una Edge Function: CORS, parseo de body, y
// traduccion uniforme de HttpError/errores inesperados a Response JSON.
export function withHandler(handler: (req: Request, admin: SupabaseClient) => Promise<unknown>) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    const admin = adminClient();
    try {
      const result = await handler(req, admin);
      return new Response(JSON.stringify(result ?? { ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof Error ? error.message : "Error interno.";
      if (status === 500) console.error(error);
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  };
}
