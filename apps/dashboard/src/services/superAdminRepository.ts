import { supabase } from "supabaseClient/supabaseConfig";

// Puerto a Supabase. La version Firebase de este archivo bloqueaba varias
// acciones (crear empresa/usuario sin sesion secundaria rara, banear
// deshabilitando la cuenta de verdad, resetear password directo, impersonar
// soporte) con BLAZE_REQUIRED porque el proyecto nunca tuvo Cloud Functions
// desplegadas. Todas esas acciones ya existen como Edge Functions (Fase 2,
// probadas de punta a punta) y aqui simplemente se invocan -- ninguna queda
// bloqueada.

const textValue = (value, fallback = "") =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
const numberValue = (value) => (typeof value === "number" && Number.isFinite(value) ? value : 0);

export const ROLE_ALIAS_GROUPS = {
  super_admin: ["super_admin"],
  admin_empresa: ["admin_empresa"],
  admin: ["admin"],
  jefe: ["jefe", "jefe_sector"],
  empleado: ["empleado", "psicologo"],
};

const mapEmpresa = (row) => ({
  id: row.id,
  nombre: textValue(row.nombre, "Empresa sin nombre"),
  codigo: textValue(row.codigo, row.id.slice(0, 8)),
  estado: row.baneado ? "baneada" : "activa",
  plan: textValue(row.planes?.nombre, "Sin plan"),
  paymentStatus: row.baneado ? "suspended" : "active",
  fechaCreacion: row.created_at || null,
});

const mapEmpresaDetalle = (row, usuariosTotal = 0) => ({
  ...mapEmpresa(row),
  giro: "",
  tamanoEquipo: "",
  logoUrl: "",
  adminId: row.admin_id || "",
  adminNombre: "",
  adminCorreo: "",
  subscriptionStatus: row.baneado ? "suspended" : "active",
  subscriptionSuspended: row.baneado,
  planBilling: "",
  planExpiresAt: null,
  planCancelAtPeriodEnd: false,
  baneada: row.baneado,
  estadoActivo: !row.baneado,
  fechaCreacion: row.created_at || null,
  usuariosTotal,
});

const mapPago = (row) => ({
  id: row.id,
  empresaId: row.empresa_id || "sin_empresa",
  plan: "",
  status: row.estado,
  amount: numberValue(Number(row.monto)),
  createdAt: row.created_at || null,
});

// audit_logs no tiene columna de estado/severidad, asi que ya no se fabrica un "Success"
// fijo aqui -- los llamadores deben dejar de renderizar un badge de estado con este campo.
const mapAudit = (row, usuariosPorId = new Map()) => ({
  id: row.id,
  empresaId: row.empresa_id || null,
  empresaNombre: "",
  accion: textValue(row.accion, "Evento"),
  modulo: textValue(row.modulo, "Sistema"),
  actorNombre: usuariosPorId.get(row.actor_id)?.nombre || "",
  detalles: textValue(row.detalles),
  timestamp: row.created_at || null,
});

// Resuelve nombres de actores para un lote de audit_logs, cruzando actor_id contra
// usuarios (id, nombre) a traves de TODAS las empresas (scope super-admin).
async function fetchUsuariosPorId(actorIds) {
  const ids = Array.from(new Set((actorIds || []).filter(Boolean)));
  if (!ids.length) return new Map();
  const { data } = await supabase.from("usuarios").select("id, nombre").in("id", ids);
  const map = new Map();
  (data || []).forEach((u) => map.set(u.id, { nombre: textValue(u.nombre) }));
  return map;
}

const mapUsuario = (row, empresaNombre = "") => ({
  id: row.id,
  nombre: textValue(row.nombre, "Sin nombre"),
  correo: textValue(row.correo),
  telefono: textValue(row.telefono),
  rol: row.rol,
  rolCrudo: row.rol,
  empresaId: row.empresa_id || "",
  empresaNombre: textValue(row.empresas?.nombre, empresaNombre),
  departamento: "",
  cargo: "",
  sede: "",
  salarioBase: numberValue(row.salario_base),
  usuarioInterno: textValue(row.usuario_interno),
  codigoEmpresa: textValue(row.codigo_empresa),
  activo: row.estado_activo !== false,
  baneado: Boolean(row.baneado),
  eliminado: Boolean(row.eliminado),
  esPropietario: false,
  fechaCreacion: row.created_at || null,
  fotoPerfil: textValue(row.foto_perfil),
});

function applyUserClientFilters(items, filtros) {
  let result = items;
  if (filtros.estado === "activos") result = result.filter((entry) => entry.activo && !entry.eliminado && !entry.baneado);
  else if (filtros.estado === "inactivos") result = result.filter((entry) => !entry.activo && !entry.eliminado);
  else if (filtros.estado === "baneados") result = result.filter((entry) => entry.baneado);
  else if (filtros.estado === "eliminados") result = result.filter((entry) => entry.eliminado);
  else result = result.filter((entry) => !entry.eliminado);
  return result;
}

function realtimeQuery(table, filter, buildQuery, onData, onError) {
  let active = true;
  const run = async () => {
    try {
      const { data, error } = await buildQuery();
      if (error) throw error;
      if (active) onData(data || []);
    } catch (err) {
      if (active && onError) onError(err);
    }
  };
  run();
  const channel = supabase
    .channel(`sa:${table}:${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table, ...(filter ? { filter } : {}) }, run)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

// --- Resumen / stats ---
export async function getPlatformStats() {
  const { data, error } = await supabase.functions.invoke("sa-platform-stats");
  if (error) throw new Error(error.message || "No se pudieron cargar las estadísticas.");
  return { ...data, empresasSuspendidas: 0, empresasExpiradas: 0 };
}

export function subscribePlatform(callback, onError) {
  const state = { empresas: [], pagos: [], auditoria: [], usuariosTotal: 0 };
  const publish = () => callback({ ...state });

  const unsubs = [
    realtimeQuery("empresas", null, async () => {
      const r = await supabase.from("empresas").select("*, planes(nombre)").limit(50);
      state.empresas = (r.data || []).map(mapEmpresa);
      publish();
      return r;
    }, () => {}, onError),
    realtimeQuery("payments", null, async () => {
      const r = await supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(20);
      state.pagos = (r.data || []).map(mapPago);
      publish();
      return r;
    }, () => {}, onError),
    realtimeQuery("audit_logs", null, async () => {
      const r = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(20);
      const usuariosPorId = await fetchUsuariosPorId((r.data || []).map((row) => row.actor_id));
      state.auditoria = (r.data || []).map((row) => mapAudit(row, usuariosPorId));
      publish();
      return r;
    }, () => {}, onError),
  ];
  supabase.from("usuarios").select("id", { count: "exact", head: true }).then(({ count }) => {
    state.usuariosTotal = count || 0;
    publish();
  });

  return () => unsubs.forEach((unsub) => unsub());
}

// --- Empresas ---

function applyCompanyFilter(query, filtros) {
  if (filtros.estado === "baneadas") return query.eq("baneado", true);
  if (filtros.estado === "activas") return query.eq("baneado", false);
  return query;
}

export function subscribeCompanies(filtros, limite, callback, onError) {
  return realtimeQuery("empresas", null, async () => {
    let q = supabase.from("empresas").select("*, planes(nombre)").limit(limite);
    q = applyCompanyFilter(q, filtros);
    const { data, error } = await q;
    if (error) throw error;
    const items = await Promise.all((data || []).map(async (row) => {
      const { count } = await supabase.from("usuarios").select("id", { count: "exact", head: true }).eq("empresa_id", row.id);
      return mapEmpresaDetalle(row, count || 0);
    }));
    callback({ items, cursor: null, hayMas: false });
    return { data };
  }, () => {}, onError);
}

export async function loadMoreCompanies(..._args: any[]) {
  return { items: [], cursor: null, hayMas: false };
}

export function subscribeCompanyDetail(empresaId, callback, onError) {
  if (!empresaId) {
    callback({ empresa: null, usuarios: [], pagos: [] });
    return () => {};
  }
  const state = { empresa: null, usuarios: [], pagos: [] };
  const publish = () => callback({ ...state });

  const unsubs = [
    realtimeQuery("empresas", `id=eq.${empresaId}`, async () => {
      const { data, error } = await supabase.from("empresas").select("*, planes(nombre)").eq("id", empresaId).maybeSingle();
      if (error) throw error;
      if (!data) { state.empresa = null; publish(); return { data: null }; }
      const { count } = await supabase.from("usuarios").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId);
      let adminNombre = "";
      let adminCorreo = "";
      if (data.admin_id) {
        const { data: admin } = await supabase.from("usuarios").select("nombre, correo").eq("id", data.admin_id).maybeSingle();
        adminNombre = admin?.nombre || "";
        adminCorreo = admin?.correo || "";
      }
      state.empresa = { ...mapEmpresaDetalle(data, count || 0), adminNombre, adminCorreo };
      publish();
      return { data };
    }, () => {}, onError),
    realtimeQuery("usuarios", `empresa_id=eq.${empresaId}`, async () => {
      const { data, error } = await supabase.from("usuarios").select("*").eq("empresa_id", empresaId);
      if (error) throw error;
      state.usuarios = (data || []).map((row) => mapUsuario(row, state.empresa?.nombre || ""));
      publish();
      return { data };
    }, () => {}, onError),
    realtimeQuery("payments", `empresa_id=eq.${empresaId}`, async () => {
      const { data, error } = await supabase.from("payments").select("*").eq("empresa_id", empresaId).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      state.pagos = (data || []).map(mapPago);
      publish();
      return { data };
    }, () => {}, onError),
  ];
  return () => unsubs.forEach((unsub) => unsub());
}

export async function updateCompanyProfile(empresaId: string, patch: any) {
  const data: Record<string, any> = {};
  if (patch.nombre !== undefined) data.nombre = patch.nombre;
  if (patch.codigo !== undefined) data.codigo = patch.codigo;
  if (Object.keys(data).length === 0) return;
  const { error } = await supabase.from("empresas").update(data).eq("id", empresaId);
  if (error) throw error;
}

export async function applyCompanyAction(companyId, action) {
  if (action === "banear") return setCompanyBan(companyId, true);
  if (action === "desbanear") return setCompanyBan(companyId, false);
  throw new Error(`Acción no soportada: ${action}`);
}

export async function startSupportSession(companyId) {
  const { data, error } = await supabase.functions.invoke("create-support-impersonation-session", { body: { empresaId: companyId } });
  if (error) throw new Error(error.message || "No se pudo iniciar la sesión de soporte.");
  return data;
}

export async function setCompanyBan(empresaId, banned) {
  const { data, error } = await supabase.functions.invoke("sa-set-company-ban", { body: { empresaId, banned } });
  if (error) throw new Error(error.message || "No se pudo actualizar el baneo.");
  return data;
}

export async function deleteCompany(empresaId, confirmName) {
  const { data, error } = await supabase.functions.invoke("sa-delete-company", { body: { empresaId, confirmName } });
  if (error) throw new Error(error.message || "No se pudo eliminar la empresa.");
  return data;
}

export async function createCompany(payload) {
  const { data, error } = await supabase.functions.invoke("sa-create-company", { body: payload });
  if (error) throw new Error(error.message || "No se pudo crear la empresa.");
  return data;
}

// --- Usuarios de plataforma ---

export function subscribeUsers(filtros, limite, callback, onError) {
  return realtimeQuery("usuarios", filtros.empresaId ? `empresa_id=eq.${filtros.empresaId}` : null, async () => {
    let q = supabase.from("usuarios").select("*, empresas(nombre)").limit(limite);
    if (filtros.empresaId) q = q.eq("empresa_id", filtros.empresaId);
    if (filtros.rol && ROLE_ALIAS_GROUPS[filtros.rol]) q = q.in("rol", ROLE_ALIAS_GROUPS[filtros.rol]);
    q = q.order("nombre");
    const { data, error } = await q;
    if (error) throw error;
    let items = (data || []).map((row) => mapUsuario(row));
    items = applyUserClientFilters(items, filtros);
    callback({ items, cursor: null, hayMas: false });
    return { data };
  }, () => {}, onError);
}

export async function loadMoreUsers(..._args: any[]) {
  return { items: [], cursor: null, hayMas: false };
}

export async function updateUser(userId: string, patch: any, rol: string | null = null, empresaId: string | null = null) {
  const { error } = await supabase.functions.invoke("sa-update-user", { body: { userId, patch, rol, empresaId } });
  if (error) throw new Error(error.message || "No se pudo actualizar el usuario.");
}

export async function setUserBan(userId: string, banned: boolean) {
  const { error } = await supabase.functions.invoke("sa-set-user-ban", { body: { userId, banned } });
  if (error) throw new Error(error.message || "No se pudo actualizar el baneo.");
}

export async function deleteUser(userId: string, confirmName: string, force = false) {
  const { error } = await supabase.functions.invoke("sa-delete-user", { body: { userId, confirmName, force } });
  if (error) throw new Error(error.message || "No se pudo eliminar el usuario.");
}

export async function resetPassword(userId: string, mode: "link" | "set" | "internal", newPassword: string | null = null) {
  const { data, error } = await supabase.functions.invoke("sa-reset-password", { body: { userId, mode, newPassword } });
  if (error) throw new Error(error.message || "No se pudo restablecer la contraseña.");
  return data;
}

export async function createUser(payload) {
  const { data, error } = await supabase.functions.invoke("sa-create-user", { body: payload });
  if (error) throw new Error(error.message || "No se pudo crear el usuario.");
  return data;
}

// --- Auditoria global ---

export function subscribeAuditGlobal(limite, callback, onError) {
  return realtimeQuery("audit_logs", null, async () => {
    const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limite);
    if (error) throw error;
    const usuariosPorId = await fetchUsuariosPorId((data || []).map((row) => row.actor_id));
    callback({ items: (data || []).map((row) => mapAudit(row, usuariosPorId)), cursor: null, hayMas: false });
    return { data };
  }, () => {}, onError);
}

export async function loadMoreAuditGlobal(..._args: any[]) {
  return { items: [], cursor: null, hayMas: false };
}

// --- Pagos ---

export function subscribePayments(limite, callback, onError) {
  return realtimeQuery("payments", null, async () => {
    const { data, error } = await supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(limite);
    if (error) throw error;
    callback({ items: (data || []).map(mapPago), cursor: null, hayMas: false });
    return { data };
  }, () => {}, onError);
}

// --- Nexxus IA ---

export function subscribeAiUsage(desde, limite, callback, onError) {
  return realtimeQuery("ai_usage", null, async () => {
    const { data, error } = await supabase
      .from("ai_usage")
      .select("*")
      .gte("created_at", desde.toISOString())
      .order("created_at", { ascending: false })
      .limit(limite);
    if (error) throw error;
    callback((data || []).map((row) => ({
      id: row.id,
      empresaId: row.empresa_id || null,
      empresaNombre: "",
      userId: row.usuario_id,
      rol: "",
      tool: "",
      provider: "",
      model: row.modelo || null,
      status: "success",
      inputTokens: row.tokens_entrada ?? null,
      outputTokens: row.tokens_salida ?? null,
      totalTokens: (row.tokens_entrada || 0) + (row.tokens_salida || 0),
      costUsd: null,
      createdAt: row.created_at,
    })));
    return { data };
  }, () => {}, onError);
}

export function subscribeAiUsageDaily(desde, callback, onError) {
  return realtimeQuery("ai_usage_daily", null, async () => {
    const { data, error } = await supabase.from("ai_usage_daily").select("*").gte("fecha", desde).order("fecha", { ascending: false }).limit(400);
    if (error) throw error;
    callback((data || []).map((row) => ({
      id: row.id,
      dia: row.fecha,
      empresaId: row.empresa_id || null,
      empresaNombre: "",
      requests: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: row.tokens_totales,
      costUsd: Number(row.costo_estimado),
      porModelo: {},
    })));
    return { data };
  }, () => {}, onError);
}

// --- Soporte ---

export function subscribeSupportSessions(callback, onError) {
  return realtimeQuery("support_sessions", null, async () => {
    const { data, error } = await supabase.from("support_sessions").select("*").order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    callback((data || []).map((row) => ({
      id: row.id,
      empresaId: row.empresa_id,
      targetUserId: row.usuario_impersonado,
      targetEmail: "",
      targetRole: "",
      actorId: row.admin_id,
      actorName: "",
      status: row.activa ? "active" : "closed",
      expiresAt: row.expira_at,
      createdAt: row.created_at,
    })));
    return { data };
  }, () => {}, onError);
}
