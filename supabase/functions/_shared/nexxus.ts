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

// Varias claves de Gemini separadas por coma (secreto GEMINI_API_KEYS) para rotar cuando
// una se queda sin cuota del tier gratuito -- cada proyecto/clave de Google AI Studio tiene
// su propio límite de 20 req/min. Si solo existe GEMINI_API_KEY (una sola), se usa esa.
const GEMINI_API_KEYS = (Deno.env.get("GEMINI_API_KEYS") || Deno.env.get("GEMINI_API_KEY") || "")
  .split(",")
  .map((clave) => clave.trim())
  .filter(Boolean);

// Códigos que indican "esta clave puntual no sirvió" (cuota agotada, o Google la rechazó)
// -- vale la pena probar la siguiente. Otros códigos (400 por request mal formado que no es
// culpa de la clave, 500, etc.) se devuelven tal cual porque cambiar de clave no los arregla.
const CODIGOS_ROTAR_CLAVE = new Set([400, 401, 403, 429]);

// Antes duplicado por separado en ask-nexxus-ai/index.ts y voice-turn/index.ts -- si el modelo
// default cambiaba, era fácil actualizar uno y olvidar el otro.
export const DEFAULT_GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-3.6-flash";

// Llama a un endpoint de Gemini probando cada clave en orden hasta que una funcione.
export async function fetchGeminiConRotacion(url: string, body: unknown): Promise<Response> {
  if (!GEMINI_API_KEYS.length) throw new HttpError(503, "La IA no está configurada.");
  let ultimaRespuesta: Response | null = null;
  for (const clave of GEMINI_API_KEYS) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": clave },
      body: JSON.stringify(body),
    });
    if (response.ok || !CODIGOS_ROTAR_CLAVE.has(response.status)) return response;
    console.error(`Gemini: clave terminada en ...${clave.slice(-4)} falló (${response.status}), probando la siguiente`);
    ultimaRespuesta = response;
  }
  return ultimaRespuesta!;
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
  // Columnas seguras de usuarios para meter en el prompt de la IA -- nunca incluir
  // password_interno_hash/password_hash_algorithm aunque el resto del registro sea inocuo.
  const COLUMNAS_USUARIO_SEGURAS =
    "id, nombre, correo, telefono, rol, estado_trabajo, estado_activo, racha, ultimo_check_in, baneado, eliminado, created_at";

  if (isSuperAdmin(caller) && !caller.empresa_id) {
    const [{ data: empresas }, { data: usuarios }, { data: pagos }] = await Promise.all([
      admin.from("empresas").select("*").limit(50),
      admin.from("usuarios").select(COLUMNAS_USUARIO_SEGURAS).limit(120),
      admin.from("payments").select("*").limit(80),
    ]);
    return { alcance: "plataforma", empresas, usuarios, pagos };
  }
  if (!caller.empresa_id) throw new HttpError(412, "Tu usuario no tiene empresa asociada.");
  if (isCanonicalRole(caller.rol)) {
    const [
      tareas, asistencias, reportes, ausencias, internas, nominas, notificaciones, empleados, empleadosCount,
      empresaInfo, checkins, incidencias, evaluaciones, feedbacks,
    ] = await Promise.all([
        admin.from("tareas").select("*").eq("empresa_id", caller.empresa_id).limit(80),
        admin.from("asistencias").select("*").eq("empresa_id", caller.empresa_id).limit(80),
        admin.from("reportes").select("*").eq("empresa_id", caller.empresa_id).limit(60),
        admin.from("solicitudes_ausencia").select("*").eq("empresa_id", caller.empresa_id).limit(60),
        admin.from("solicitudes_internas").select("*").eq("empresa_id", caller.empresa_id).limit(60),
        admin.from("nominas").select("*").eq("empresa_id", caller.empresa_id).limit(60),
        admin.from("notificaciones").select("*").eq("empresa_id", caller.empresa_id).eq("usuario_id", caller.id)
          .order("created_at", { ascending: false }).limit(20),
        // Sin esto, un admin/jefe no podía preguntar nada sobre su equipo (nombres, cuántos
        // empleados hay, quién es quién) -- la IA decía "no tengo información" para casi todo.
        // limit(500) cubre a casi cualquier empresa cliente sin dejar el arreglo a medias.
        admin.from("usuarios").select(COLUMNAS_USUARIO_SEGURAS).eq("empresa_id", caller.empresa_id).limit(500),
        // Conteo exacto aparte del arreglo: si la empresa tuviera más de 500 empleados (o el
        // recorte de caracteres del prompt cortara el JSON a medias), este número nunca miente.
        admin.from("usuarios").select("*", { count: "exact", head: true }).eq("empresa_id", caller.empresa_id),
        admin.from("empresas").select("id, nombre, codigo, plan_id, created_at").eq("id", caller.empresa_id)
          .maybeSingle(),
        // Bienestar/ánimo (checkins), incidencias, evaluaciones de desempeño y feedback --
        // faltaban por completo, así que la IA no podía responder nada sobre bienestar de equipo.
        admin.from("checkins").select("*").eq("empresa_id", caller.empresa_id)
          .order("created_at", { ascending: false }).limit(150),
        admin.from("incidencias").select("*").eq("empresa_id", caller.empresa_id)
          .order("created_at", { ascending: false }).limit(60),
        admin.from("evaluaciones").select("*").eq("empresa_id", caller.empresa_id)
          .order("created_at", { ascending: false }).limit(60),
        admin.from("feedbacks").select("*").eq("empresa_id", caller.empresa_id)
          .order("created_at", { ascending: false }).limit(60),
      ]);
    return {
      alcance: "empresa",
      fechaActual: new Date().toISOString(),
      empresa: empresaInfo.data,
      totalEmpleados: empleadosCount.count ?? (empleados.data || []).length,
      empleados: empleados.data,
      tareas: tareas.data,
      asistencias: asistencias.data,
      reportes: reportes.data,
      ausencias: ausencias.data,
      solicitudesInternas: internas.data,
      nominas: nominas.data,
      notificaciones: notificaciones.data,
      checkinsBienestar: checkins.data,
      incidencias: incidencias.data,
      evaluaciones: evaluaciones.data,
      feedbacks: feedbacks.data,
    };
  }
  const [tareas, ausencias, internas, nominas, notificaciones, checkins, evaluaciones, feedbacks] = await Promise.all([
    admin.from("tareas").select("*").eq("empresa_id", caller.empresa_id).eq("asignado_a", caller.id).limit(20),
    admin.from("solicitudes_ausencia").select("*").eq("empresa_id", caller.empresa_id).eq("usuario_id", caller.id).limit(12),
    admin.from("solicitudes_internas").select("*").eq("empresa_id", caller.empresa_id).eq("usuario_id", caller.id).limit(12),
    admin.from("nominas").select("*").eq("empresa_id", caller.empresa_id).eq("usuario_id", caller.id).limit(12),
    admin.from("notificaciones").select("*").eq("empresa_id", caller.empresa_id).eq("usuario_id", caller.id)
      .order("created_at", { ascending: false }).limit(20),
    admin.from("checkins").select("*").eq("empresa_id", caller.empresa_id).eq("usuario_id", caller.id)
      .order("created_at", { ascending: false }).limit(30),
    admin.from("evaluaciones").select("*").eq("empresa_id", caller.empresa_id).eq("empleado_id", caller.id)
      .order("created_at", { ascending: false }).limit(20),
    admin.from("feedbacks").select("*").eq("empresa_id", caller.empresa_id).eq("usuario_id", caller.id)
      .order("created_at", { ascending: false }).limit(20),
  ]);

  // Resuelve el nombre de quien asignó cada tarea (creado_por es un uuid) para que el
  // asistente pueda responder "¿quién me la asignó?" sin inventar el nombre.
  const creadorIds = Array.from(
    new Set((tareas.data || []).map((tarea: { creado_por?: string }) => tarea.creado_por).filter(Boolean)),
  );
  let nombresCreadores: Record<string, string> = {};
  if (creadorIds.length) {
    const { data: creadores } = await admin.from("usuarios").select("id, nombre").in("id", creadorIds);
    nombresCreadores = Object.fromEntries(
      (creadores || []).map((usuario: { id: string; nombre: string }) => [usuario.id, usuario.nombre]),
    );
  }
  const tareasConCreador = (tareas.data || []).map((tarea: { creado_por?: string }) => ({
    ...tarea,
    creado_por_nombre: (tarea.creado_por && nombresCreadores[tarea.creado_por]) || null,
  }));

  return {
    alcance: "personal",
    fechaActual: new Date().toISOString(),
    tareas: tareasConCreador,
    ausencias: ausencias.data,
    solicitudesInternas: internas.data,
    nominas: nominas.data,
    notificaciones: notificaciones.data,
    checkinsBienestar: checkins.data,
    evaluaciones: evaluaciones.data,
    feedbacks: feedbacks.data,
  };
}

export interface SensitiveAiAction {
  id: string;
  tipo: "aprobar_solicitud" | "aprobar_nomina";
  sourceCollection: "solicitudes_ausencia" | "solicitudes_internas" | "nominas";
  itemId: string;
  titulo: string;
  // Solo para tipo "aprobar_nomina": a qué estado mover la nómina ('revisado' | 'pagado').
  estadoDestino?: string;
}

const APPROVE_COLLECTIONS = new Set(["solicitudes_ausencia", "solicitudes_internas"]);
const ESTADOS_NOMINA_APROBABLES = new Set(["revisado", "pagado"]);

/**
 * Extrae [APPROVE:coleccion|id|titulo] y [APPROVE_NOMINA:id|estado|titulo] SIN ejecutar nada --
 * a diferencia de NOTIFICATION/TASK/EVENT/REQUEST_*, aprobar una solicitud o una nómina es una
 * accion sensible que requiere confirmacion humana explicita en el cliente. Este parser solo
 * recorta el tag del texto y devuelve la lista para que el cliente muestre una tarjeta de
 * confirmacion; la mutacion real ocurre despues, cuando el usuario confirma (para nómina, vía
 * useCases.admin.payroll.updateStatus -- el mismo camino que ya usa el dashboard). El caller
 * (ask-nexxus-ai/voice-turn) filtra esta lista según el rol antes de devolverla: solicitudes
 * requieren rol canónico (jefe/admin/super_admin), nómina requiere admin/admin_empresa/
 * super_admin (coincide con la política RLS real de la tabla nominas -- jefe no puede).
 */
export function extractSensitiveActions(text: string): { clean: string; acciones: SensitiveAiAction[] } {
  let clean = text;
  const acciones: SensitiveAiAction[] = [];
  let match: RegExpMatchArray | null;
  while ((match = clean.match(/\[APPROVE:([^|]+)\|([^|]+)\|([^\]]+)\]/))) {
    const coleccion = match[1].trim();
    const itemId = match[2].trim();
    if (APPROVE_COLLECTIONS.has(coleccion) && itemId) {
      acciones.push({
        id: `approve-${coleccion}-${itemId}`,
        tipo: "aprobar_solicitud",
        sourceCollection: coleccion as SensitiveAiAction["sourceCollection"],
        itemId,
        titulo: safeString(match[3], 120),
      });
    }
    clean = clean.replace(match[0], "").trim();
  }
  while ((match = clean.match(/\[APPROVE_NOMINA:([^|]+)\|([^|]+)\|([^\]]+)\]/))) {
    const itemId = match[1].trim();
    const estadoDestino = match[2].trim().toLowerCase();
    if (itemId && ESTADOS_NOMINA_APROBABLES.has(estadoDestino)) {
      acciones.push({
        id: `approve-nomina-${itemId}`,
        tipo: "aprobar_nomina",
        sourceCollection: "nominas",
        itemId,
        estadoDestino,
        titulo: safeString(match[3], 120),
      });
    }
    clean = clean.replace(match[0], "").trim();
  }
  return { clean, acciones };
}

const TIPOS_NOTIFICACION = new Set(["bienestar", "tarea", "aprobacion", "general"]);
const TIPOS_AUSENCIA = new Set(["vacaciones", "permiso", "enfermedad", "incapacidad", "personal"]);
const TIPOS_INTERNA = new Set(["adelanto", "permiso", "capacitacion", "compra", "equipo"]);
const FECHA_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Ejecuta las etiquetas de accion que el modelo puede emitir como texto literal dentro de su
 * respuesta (compartido por chat de texto y voz, para que ambos canales tengan las mismas
 * capacidades reales sobre la base de datos):
 *   [NOTIFICATION:tipo|titulo|mensaje]              -- incluye "bienestar" (avisar a RRHH/jefe)
 *   [TASK:prioridad|titulo|descripcion|asignado_a]
 *   [EVENT:tipo|titulo|inicio|fin|descripcion]
 *   [REQUEST_AUSENCIA:tipo|fecha_inicio|fecha_fin|motivo]  -- fechas en YYYY-MM-DD
 *   [REQUEST_INTERNA:tipo|detalle]
 *   [COMPLETE_TASK:id]                               -- id real de una tarea del contexto
 *   [CLOCK_IN] / [CLOCK_OUT]                          -- marca entrada/salida del caller
 * Ninguna de estas es "sensible": crean o actualizan un registro que igual pasa por el flujo de
 * aprobacion normal de la empresa (o, en el caso de tareas, solo modifica una propia), no
 * ejecutan nada irreversible por si solas.
 */
export async function applyActionTags(admin: SupabaseClient, caller: Caller, text: string): Promise<string> {
  let clean = text;
  let match: RegExpMatchArray | null;

  while ((match = clean.match(/\[NOTIFICATION:(\w+)\|([^|]+)\|([^\]]+)\]/))) {
    const tipoRaw = match[1].toLowerCase().trim();
    const tipo = TIPOS_NOTIFICACION.has(tipoRaw) ? tipoRaw : "general";
    // El chat/voz de IA es la via mas comun para que un empleado exprese malestar en texto
    // libre ("me siento mal", "estoy agotado") -- se marca prioridad alta para que el
    // timbre/badge del admin lo resalte igual que la alerta automatica del trigger de checkins.
    const prioridad = tipo === "bienestar" ? "alta" : "media";
    await admin.from("notificaciones").insert({
      usuario_id: caller.id,
      empresa_id: caller.empresa_id,
      titulo: safeString(match[2], 100),
      cuerpo: safeString(match[3], 300),
      tipo,
      prioridad,
    });
    clean = clean.replace(match[0], "").trim();
  }

  while ((match = clean.match(/\[TASK:([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/))) {
    const asignadoRaw = match[4].trim();
    // El prompt le pide al modelo usar el id real de "empleados" cuando asigna a otra persona;
    // si de todos modos llega un valor que no es un uuid válido, el insert falla por FK y se
    // registra aquí en vez de fallar en silencio dejando al usuario creyendo que sí se asignó.
    const { error } = await admin.from("tareas").insert({
      empresa_id: caller.empresa_id,
      titulo: safeString(match[2], 150),
      descripcion: safeString(match[3], 500),
      prioridad: match[1],
      asignado_a: asignadoRaw.toLowerCase() === "yo" || !asignadoRaw ? caller.id : asignadoRaw,
      creado_por: caller.id,
      estado: "pendiente",
    });
    if (error) console.error("TASK falló (asignado_a inválido?)", asignadoRaw, error);
    clean = clean.replace(match[0], "").trim();
  }

  while ((match = clean.match(/\[EVENT:([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/))) {
    await admin.from("calendario_empresarial").insert({
      empresa_id: caller.empresa_id,
      titulo: safeString(match[2], 120),
      fecha_inicio: match[3],
      fecha_fin: match[4],
      descripcion: safeString(match[5], 400),
      tipo: match[1].toLowerCase().trim(),
    });
    clean = clean.replace(match[0], "").trim();
  }

  while ((match = clean.match(/\[REQUEST_AUSENCIA:([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/))) {
    const tipoRaw = match[1].toLowerCase().trim();
    const fechaInicio = match[2].trim();
    const fechaFin = match[3].trim();
    if (TIPOS_AUSENCIA.has(tipoRaw) && FECHA_PATTERN.test(fechaInicio) && FECHA_PATTERN.test(fechaFin)) {
      await admin.from("solicitudes_ausencia").insert({
        empresa_id: caller.empresa_id,
        usuario_id: caller.id,
        tipo: tipoRaw,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        motivo: safeString(match[4], 300),
      });
    } else {
      console.error("REQUEST_AUSENCIA con tipo o fechas inválidas, se ignora", match[0]);
    }
    clean = clean.replace(match[0], "").trim();
  }

  while ((match = clean.match(/\[REQUEST_INTERNA:([^|]+)\|([^\]]+)\]/))) {
    const tipoRaw = match[1].toLowerCase().trim();
    if (TIPOS_INTERNA.has(tipoRaw)) {
      await admin.from("solicitudes_internas").insert({
        empresa_id: caller.empresa_id,
        usuario_id: caller.id,
        tipo: tipoRaw,
        detalle: safeString(match[2], 400),
      });
    } else {
      console.error("REQUEST_INTERNA con tipo inválido, se ignora", match[0]);
    }
    clean = clean.replace(match[0], "").trim();
  }

  while ((match = clean.match(/\[COMPLETE_TASK:([^\]]+)\]/))) {
    const tareaId = match[1].trim();
    // Un empleado solo puede completar sus propias tareas; jefe/admin/super_admin pueden
    // completar cualquiera de su empresa (p.ej. si delegan y confirman en nombre de otro).
    let query = admin.from("tareas").update({ estado: "completada" }).eq("id", tareaId).eq(
      "empresa_id",
      caller.empresa_id,
    );
    if (!isCanonicalRole(caller.rol)) query = query.eq("asignado_a", caller.id);
    const { error } = await query;
    if (error) console.error("COMPLETE_TASK falló", error);
    clean = clean.replace(match[0], "").trim();
  }

  while ((match = clean.match(/\[CLOCK_IN\]/))) {
    await admin.from("asistencias").insert({
      empresa_id: caller.empresa_id,
      usuario_id: caller.id,
      tipo: "entrada",
      metodo_registro: "manual",
      estado_aprobacion: "pendiente",
    });
    clean = clean.replace(match[0], "").trim();
  }

  while ((match = clean.match(/\[CLOCK_OUT\]/))) {
    await admin.from("asistencias").insert({
      empresa_id: caller.empresa_id,
      usuario_id: caller.id,
      tipo: "salida",
      metodo_registro: "manual",
      estado_aprobacion: "pendiente",
    });
    clean = clean.replace(match[0], "").trim();
  }

  return clean;
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

// Antes repetido literal en 3 lugares (_shared/company.ts x2, sa-update-user/index.ts) --
// un cambio de texto en el mensaje de error de Supabase Auth habría roto el manejo del 409
// "ya existe" en los 3 a la vez sin que nada lo avisara.
export function isDuplicateEmailError(error: { message?: string } | null | undefined): boolean {
  return Boolean(error?.message?.toLowerCase().includes("already"));
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
