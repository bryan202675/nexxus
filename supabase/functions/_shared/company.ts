// Equivalente a createCompanyWithOwner / createCompanyUser en nexxus/backend/index.js:2458-2676.
// Compartido por sa-create-company/sa-create-user (super admin) y crear-usuario-empresa (admin de empresa).

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { HttpError, assertValidEmail, assertValidPassword, hashPasswordInterno, safeString } from "./nexxus.ts";

const COMPANY_USER_ROLES = new Set(["admin_empresa", "jefe", "empleado"]);

function normalizeCompanyUserRole(role: unknown): string {
  const normalized = safeString(role, 40).toLowerCase();
  if (!COMPANY_USER_ROLES.has(normalized)) throw new HttpError(400, "Rol inválido para usuario de empresa.");
  return normalized;
}

export async function createCompanyWithOwner(admin: SupabaseClient, params: {
  nombreEmpresa: string;
  nombreAdmin: string;
  correoAdmin: string;
  contrasenaAdmin: string;
  usuarioInterno?: string;
  planId?: string | null;
}) {
  assertValidEmail(params.correoAdmin);
  assertValidPassword(params.contrasenaAdmin);
  if (params.nombreEmpresa.length < 2 || params.nombreAdmin.length < 2) {
    throw new HttpError(400, "Empresa y administrador necesitan nombres válidos.");
  }

  const { data: userRecord, error: createError } = await admin.auth.admin.createUser({
    email: params.correoAdmin,
    password: params.contrasenaAdmin,
    email_confirm: true,
    user_metadata: { displayName: params.nombreAdmin },
  });
  if (createError || !userRecord?.user) {
    if (createError?.message?.toLowerCase().includes("already")) {
      throw new HttpError(409, "Ya existe un usuario con ese correo.");
    }
    throw new HttpError(400, createError?.message || "No se pudo crear la cuenta.");
  }
  const uid = userRecord.user.id;

  // Codigo de acceso de empresa unico (ej. NEX-4927)
  const prefix = (params.nombreEmpresa.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase()) || "EMP";
  let codigo = `${prefix}-1111`;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: dup } = await admin.from("empresas").select("id").eq("codigo", candidate).maybeSingle();
    if (!dup) {
      codigo = candidate;
      break;
    }
  }

  const { data: empresa, error: empresaError } = await admin
    .from("empresas")
    .insert({ nombre: params.nombreEmpresa, codigo, admin_id: uid, plan_id: params.planId || null })
    .select("id, codigo")
    .single();
  if (empresaError) {
    await admin.auth.admin.deleteUser(uid).catch(() => {});
    throw new HttpError(500, empresaError.message);
  }

  const usuarioInterno = safeString(params.usuarioInterno, 60).toLowerCase() || params.correoAdmin.split("@")[0];
  const passwordHash = await hashPasswordInterno(admin, params.contrasenaAdmin);
  const { error: usuarioError } = await admin.from("usuarios").insert({
    id: uid,
    empresa_id: empresa.id,
    nombre: params.nombreAdmin,
    correo: params.correoAdmin,
    rol: "admin_empresa",
    usuario_interno: usuarioInterno,
    password_interno_hash: passwordHash,
    password_hash_algorithm: "bcrypt",
  });
  if (usuarioError) throw new HttpError(500, usuarioError.message);

  return { empresaId: empresa.id as string, adminUid: uid, codigo: empresa.codigo as string };
}

export async function assertEmployeeCapacity(admin: SupabaseClient, empresaId: string) {
  const { data: empresa } = await admin.from("empresas").select("plan_id").eq("id", empresaId).maybeSingle();
  if (!empresa?.plan_id) return;
  const { data: plan } = await admin.from("planes").select("limites, nombre").eq("id", empresa.plan_id).maybeSingle();
  const limit = plan?.limites?.employees;
  if (limit === null || limit === undefined) return;
  const { count } = await admin
    .from("usuarios")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresaId)
    .eq("rol", "empleado")
    .eq("eliminado", false);
  if ((count ?? 0) >= Number(limit)) {
    throw new HttpError(409, `El plan ${plan?.nombre || ""} permite hasta ${limit} empleados activos.`);
  }
}

export async function createCompanyUser(admin: SupabaseClient, params: {
  empresaId: string;
  nombre: string;
  correo: string;
  contrasena: string;
  rol: unknown;
  actorId?: string | null;
  allowAdminRole: boolean;
  usuarioInterno?: string;
}) {
  const rol = normalizeCompanyUserRole(params.rol);
  if (!params.nombre || !params.correo || !params.contrasena) {
    throw new HttpError(400, "Nombre, correo, contraseña y rol son obligatorios.");
  }
  assertValidEmail(params.correo);
  assertValidPassword(params.contrasena);
  if (rol === "admin_empresa" && !params.allowAdminRole) {
    throw new HttpError(403, "Solo un administrador de empresa puede crear otro administrador.");
  }
  if (rol === "empleado") {
    await assertEmployeeCapacity(admin, params.empresaId);
  }

  const { data: empresa } = await admin.from("empresas").select("codigo").eq("id", params.empresaId).maybeSingle();
  const codigoEmpresa = safeString(empresa?.codigo, 60);

  const { data: userRecord, error: createError } = await admin.auth.admin.createUser({
    email: params.correo,
    password: params.contrasena,
    email_confirm: true,
    user_metadata: { displayName: params.nombre },
  });
  if (createError || !userRecord?.user) {
    if (createError?.message?.toLowerCase().includes("already")) {
      throw new HttpError(409, "Ya existe un usuario con ese correo.");
    }
    throw new HttpError(400, createError?.message || "No se pudo crear la cuenta.");
  }
  const uid = userRecord.user.id;

  const usuarioInterno = safeString(params.usuarioInterno, 60).toLowerCase() || params.correo.split("@")[0].toLowerCase();
  const passwordHash = await hashPasswordInterno(admin, params.contrasena);

  const { error: usuarioError } = await admin.from("usuarios").insert({
    id: uid,
    empresa_id: params.empresaId,
    nombre: params.nombre,
    correo: params.correo,
    rol,
    usuario_interno: usuarioInterno,
    password_interno_hash: passwordHash,
    password_hash_algorithm: "bcrypt",
  });
  if (usuarioError) {
    await admin.auth.admin.deleteUser(uid).catch(() => {});
    throw new HttpError(500, usuarioError.message);
  }

  return { uid, rol, codigoEmpresa, usuarioInterno };
}
