// Fase 13: motor de automatizaciones SI/ENTONCES -- evalua las reglas activas de una empresa y
// publica los resultados en la Bandeja Unificada (Fase 9). Idempotente por dia via
// automatizacion_ejecuciones (regla, entidad, ciclo) -- correr esta funcion varias veces el mismo
// dia no duplica notificaciones.
//
// Invocacion: un admin/admin_empresa+ de la empresa la dispara manualmente ("Ejecutar ahora" en
// Automatizaciones.tsx). Programarla via pg_cron + pg_net (ambas extensiones ya disponibles en el
// proyecto) para que corra sola cada N minutos queda documentado como pendiente -- requiere decidir
// como autenticar la llamada del cron sin exponer la service_role key en la definicion del job.
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCaller, isAdminEmpresa, sameCompany, safeString, withHandler, HttpError } from "../_shared/nexxus.ts";

type AutomationRuleRow = {
  id: string;
  empresa_id: string;
  nombre: string;
  trigger_tipo: "tarea_vencida" | "solicitud_pendiente_tiempo" | "checkin_faltante";
  condiciones: { horasUmbral?: number; horaLimite?: number } | null;
  accion_destino: "asignado" | "creador" | "admins";
};

interface RunResult {
  reglaId: string;
  nombre: string;
  evaluadas: number;
  ejecutadas: number;
}

const INBOX_TIPO: Record<AutomationRuleRow["trigger_tipo"], string> = {
  tarea_vencida: "tarea_vencida",
  solicitud_pendiente_tiempo: "aprobacion",
  checkin_faltante: "notificacion_critica",
};

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isAdminEmpresa(caller)) throw new HttpError(403, "Requiere rol de administrador.");

  const body = await req.json().catch(() => ({}));
  const empresaId = safeString(body?.empresaId, 60) || caller.empresa_id || "";
  if (!empresaId) throw new HttpError(400, "Falta empresaId.");
  if (!sameCompany(caller, empresaId)) throw new HttpError(403, "No puedes evaluar reglas de otra empresa.");

  const { data: reglas, error: reglasError } = await admin
    .from("automatizacion_reglas")
    .select("id, empresa_id, nombre, trigger_tipo, condiciones, accion_destino")
    .eq("empresa_id", empresaId)
    .eq("activa", true);
  if (reglasError) throw new HttpError(500, reglasError.message);

  const ciclo = new Date().toISOString().slice(0, 10);
  const adminIds = await getAdminIds(admin, empresaId);

  const resultados: RunResult[] = [];
  for (const regla of (reglas || []) as AutomationRuleRow[]) {
    const resultado: RunResult = { reglaId: regla.id, nombre: regla.nombre, evaluadas: 0, ejecutadas: 0 };
    if (regla.trigger_tipo === "tarea_vencida") {
      await evaluarTareasVencidas(admin, regla, empresaId, ciclo, adminIds, resultado);
    } else if (regla.trigger_tipo === "solicitud_pendiente_tiempo") {
      await evaluarSolicitudesPendientes(admin, regla, empresaId, ciclo, adminIds, resultado);
    } else if (regla.trigger_tipo === "checkin_faltante") {
      await evaluarCheckinFaltante(admin, regla, empresaId, ciclo, adminIds, resultado);
    }
    resultados.push(resultado);
  }

  return { ok: true, resultados };
}));

async function getAdminIds(admin: SupabaseClient, empresaId: string): Promise<string[]> {
  const { data } = await admin
    .from("usuarios")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("eliminado", false)
    .in("rol", ["admin", "admin_empresa"]);
  return (data || []).map((row: { id: string }) => row.id);
}

// Registra la ejecucion en automatizacion_ejecuciones. Devuelve true si esta es la primera vez que
// se procesa esta entidad en este ciclo (y por lo tanto hay que publicar), false si ya se proceso
// hoy (violacion de la unique constraint) -- en ese caso no se publica de nuevo.
async function marcarEjecucion(
  admin: SupabaseClient,
  reglaId: string,
  empresaId: string,
  entidadTipo: string,
  entidadId: string,
  ciclo: string,
): Promise<boolean> {
  const { error } = await admin.from("automatizacion_ejecuciones").insert({
    regla_id: reglaId,
    empresa_id: empresaId,
    entidad_tipo: entidadTipo,
    entidad_id: entidadId,
    ciclo,
  });
  if (!error) return true;
  if (error.code === "23505") return false; // ya ejecutada hoy para esta entidad -- no es un error
  console.error("Error registrando ejecucion de automatizacion:", error);
  return false;
}

async function publicarInbox(admin: SupabaseClient, item: {
  usuarioId: string; empresaId: string; tipo: string; prioridad: "urgente" | "normal";
  origenRefId: string; titulo: string; mensaje: string;
}) {
  await admin.from("inbox_unificado").insert({
    usuario_id: item.usuarioId,
    empresa_id: item.empresaId,
    origen: item.tipo,
    contenido: { origenRefId: item.origenRefId, prioridad: item.prioridad, estado: "pendiente", titulo: item.titulo, mensaje: item.mensaje },
  });
}

function destinatariosPara(destino: AutomationRuleRow["accion_destino"], adminIds: string[], propios: (string | null | undefined)[]): string[] {
  if (destino === "admins") return adminIds;
  return propios.filter((id): id is string => !!id);
}

async function evaluarTareasVencidas(
  admin: SupabaseClient, regla: AutomationRuleRow, empresaId: string, ciclo: string, adminIds: string[], resultado: RunResult,
) {
  const { data: tareas } = await admin
    .from("tareas")
    .select("id, titulo, asignado_a, creado_por, fecha_limite")
    .eq("empresa_id", empresaId)
    .not("estado", "in", "(completada,completado,cancelada)")
    .lt("fecha_limite", new Date().toISOString());

  for (const tarea of tareas || []) {
    resultado.evaluadas++;
    const primeraVez = await marcarEjecucion(admin, regla.id, empresaId, "tarea", tarea.id, ciclo);
    if (!primeraVez) continue;
    const destinatarios = regla.accion_destino === "creador"
      ? destinatariosPara("creador", adminIds, [tarea.creado_por])
      : destinatariosPara(regla.accion_destino, adminIds, [tarea.asignado_a]);
    for (const usuarioId of destinatarios) {
      await publicarInbox(admin, {
        usuarioId,
        empresaId,
        tipo: INBOX_TIPO.tarea_vencida,
        prioridad: "urgente",
        origenRefId: tarea.id,
        titulo: tarea.titulo || "Tarea vencida",
        mensaje: `La tarea "${tarea.titulo || "sin título"}" venció y sigue sin completarse.`,
      });
    }
    resultado.ejecutadas++;
  }
}

async function evaluarSolicitudesPendientes(
  admin: SupabaseClient, regla: AutomationRuleRow, empresaId: string, ciclo: string, adminIds: string[], resultado: RunResult,
) {
  const horasUmbral = regla.condiciones?.horasUmbral ?? 48;
  const cutoff = new Date(Date.now() - horasUmbral * 3600 * 1000).toISOString();

  const [ausencias, internas] = await Promise.all([
    admin.from("solicitudes_ausencia").select("id, usuario_id, tipo").eq("empresa_id", empresaId).eq("estado", "pendiente").lt("created_at", cutoff),
    admin.from("solicitudes_internas").select("id, usuario_id, tipo").eq("empresa_id", empresaId).eq("estado", "pendiente").lt("created_at", cutoff),
  ]);

  const pendientes = [
    ...(ausencias.data || []).map((row: any) => ({ ...row, entidadTipo: "solicitud_ausencia", etiqueta: "Solicitud de ausencia" })),
    ...(internas.data || []).map((row: any) => ({ ...row, entidadTipo: "solicitud_interna", etiqueta: "Solicitud interna" })),
  ];

  for (const solicitud of pendientes) {
    resultado.evaluadas++;
    const primeraVez = await marcarEjecucion(admin, regla.id, empresaId, solicitud.entidadTipo, solicitud.id, ciclo);
    if (!primeraVez) continue;
    const destinatarios = destinatariosPara(regla.accion_destino, adminIds, [solicitud.usuario_id]);
    for (const usuarioId of destinatarios) {
      await publicarInbox(admin, {
        usuarioId,
        empresaId,
        tipo: INBOX_TIPO.solicitud_pendiente_tiempo,
        prioridad: "urgente",
        origenRefId: solicitud.id,
        titulo: `${solicitud.etiqueta} sin resolver`,
        mensaje: `${solicitud.etiqueta} (${solicitud.tipo || "sin tipo"}) lleva más de ${horasUmbral}h pendiente de aprobación.`,
      });
    }
    resultado.ejecutadas++;
  }
}

async function evaluarCheckinFaltante(
  admin: SupabaseClient, regla: AutomationRuleRow, empresaId: string, ciclo: string, adminIds: string[], resultado: RunResult,
) {
  const horaLimite = regla.condiciones?.horaLimite ?? 10;
  if (new Date().getUTCHours() < horaLimite) return; // todavía no es hora de avisar hoy

  const inicioDia = new Date();
  inicioDia.setUTCHours(0, 0, 0, 0);

  const [{ data: empleados }, { data: checkins }] = await Promise.all([
    admin.from("usuarios").select("id, nombre").eq("empresa_id", empresaId).eq("eliminado", false)
      .eq("estado_activo", true).in("rol", ["empleado", "jefe", "jefe_sector"]),
    admin.from("checkins").select("usuario_id").eq("empresa_id", empresaId).gte("created_at", inicioDia.toISOString()),
  ]);

  const conCheckin = new Set((checkins || []).map((row: { usuario_id: string }) => row.usuario_id));
  const faltantes = (empleados || []).filter((usuario: { id: string }) => !conCheckin.has(usuario.id));

  for (const usuario of faltantes) {
    resultado.evaluadas++;
    const primeraVez = await marcarEjecucion(admin, regla.id, empresaId, "checkin_faltante", usuario.id, ciclo);
    if (!primeraVez) continue;
    const destinatarios = destinatariosPara(regla.accion_destino, adminIds, [usuario.id]);
    for (const usuarioId of destinatarios) {
      await publicarInbox(admin, {
        usuarioId,
        empresaId,
        tipo: INBOX_TIPO.checkin_faltante,
        prioridad: "normal",
        origenRefId: usuario.id,
        titulo: "Check-in faltante",
        mensaje: `${usuario.nombre || "Un colaborador"} no ha hecho check-in hoy.`,
      });
    }
    resultado.ejecutadas++;
  }
}
