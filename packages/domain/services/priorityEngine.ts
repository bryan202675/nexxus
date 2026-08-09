/**
 * Documentacion Nexxus - packages/domain/services/priorityEngine.ts
 * Capa: dominio.
 * Proposito: Motor de priorizacion compartido del Centro Inteligente. Reglas confirmadas: urgencia por
 * tiempo (vencido > hoy > proximo > normal) combinada con rol/permisos -- el rol/permisos ya se resuelve
 * en la capa de aplicacion (que datos se piden por usuario, equipo o empresa), este motor solo puntua y
 * ordena las senales que recibe.
 * Dependencias clave: entities/PrioritySignal, entities/Task, entities/Absence, entities/InternalRequest,
 * entities/Notification, entities/Attendance.
 * Consideracion de mantenimiento: unica fuente de verdad para "vencida"/"proxima a vencer" -- reemplaza
 * la logica antes duplicada en apps/mobile (dashboardAdminHelpers.estaVencida y la copia inline de
 * CentroTareas.tsx). No reintroducir esa duplicacion en las pantallas que consuman este motor.
 */

import { PrioritySignal, PriorityUrgency } from '../entities/PrioritySignal';
import { Task } from '../entities/Task';
import { Absence } from '../entities/Absence';
import { InternalRequest } from '../entities/InternalRequest';
import { Notification } from '../entities/Notification';
import { Attendance } from '../entities/Attendance';
import { RequestReportItem } from '../entities/RequestReport';

const DIA_MS = 24 * 60 * 60 * 1000;
const VENTANA_PROXIMA_DIAS = 2;

/**
 * Trunca una fecha a medianoche UTC. Usar UTC (no hora local) es obligatorio aquí: las fechas de
 * solo-día ('YYYY-MM-DD') que vienen de Supabase se parsean como medianoche UTC, así que comparar
 * contra una medianoche en hora local desalinea el resultado según el huso horario del proceso.
 */
const soloFechaUTC = (valor: Date) => Date.UTC(valor.getUTCFullYear(), valor.getUTCMonth(), valor.getUTCDate());

/**
 * Deriva la urgencia por tiempo de una fecha limite. `undefined`/fecha invalida => 'normal'.
 * Unica fuente de verdad para "vencida"/"proxima a vencer" en todo el proyecto.
 */
export const computeUrgencyFromDate = (fechaLimite?: string, ahora: Date = new Date()): PriorityUrgency => {
  if (!fechaLimite) return 'normal';
  const fecha = new Date(fechaLimite);
  if (Number.isNaN(fecha.getTime())) return 'normal';

  const diffDias = Math.round((soloFechaUTC(fecha) - soloFechaUTC(ahora)) / DIA_MS);

  if (diffDias < 0) return 'vencida';
  if (diffDias === 0) return 'hoy';
  if (diffDias <= VENTANA_PROXIMA_DIAS) return 'proxima';
  return 'normal';
};

const PESO_URGENCIA: Record<PriorityUrgency, number> = {
  vencida: 1000,
  hoy: 750,
  proxima: 500,
  normal: 100,
};

/** Cuanto mas vencida, mas urgente (con tope para que una tarea de hace 1 año no domine todo el feed). */
const bonoPorDiasVencidos = (fechaLimite: string, ahora: Date) => {
  const dias = Math.round((soloFechaUTC(ahora) - soloFechaUTC(new Date(fechaLimite))) / DIA_MS);
  return Math.min(Math.max(dias, 0), 30) * 2;
};

const NIVELES_PRIORIDAD: Record<string, number> = {
  urgente: 150,
  alta: 100,
  media: 50,
  baja: 0,
  media_alta: 75,
};

const bonoPorPrioridad = (prioridad?: string) => {
  if (!prioridad) return 0;
  return NIVELES_PRIORIDAD[prioridad.trim().toLowerCase()] ?? 0;
};

/** Calcula el score final de una señal: urgencia por fecha + nivel de prioridad declarado. */
export const computeSignalScore = (urgency: PriorityUrgency, fechaLimite?: string, prioridad?: string, ahora: Date = new Date()) => {
  let score = PESO_URGENCIA[urgency];
  if (urgency === 'vencida' && fechaLimite) {
    score += bonoPorDiasVencidos(fechaLimite, ahora);
  }
  score += bonoPorPrioridad(prioridad);
  return score;
};

// ── Mappers: cada fuente de dominio -> PrioritySignal[] ─────────────────────

export const mapTareasAPrioritySignals = (tareas: Task[], ahora: Date = new Date()): PrioritySignal[] =>
  tareas
    .filter((tarea) => tarea.estado !== 'completada')
    .map((tarea) => {
      const urgency = computeUrgencyFromDate(tarea.fecha_limite, ahora);
      return {
        id: `tarea-${tarea.id}`,
        category: 'tarea' as const,
        title: tarea.titulo,
        detail: tarea.descripcion || 'Tarea pendiente',
        urgency,
        score: computeSignalScore(urgency, tarea.fecha_limite, tarea.prioridad, ahora),
        dueDate: tarea.fecha_limite,
        route: 'CentroTareas',
        routeParams: { tareaId: tarea.id },
      };
    });

export const mapAusenciasAPrioritySignals = (ausencias: Absence[], ahora: Date = new Date()): PrioritySignal[] =>
  ausencias
    .filter((ausencia) => ausencia.estado === 'pendiente')
    .map((ausencia) => {
      const urgency = computeUrgencyFromDate(ausencia.fecha_inicio, ahora);
      return {
        id: `ausencia-${ausencia.id}`,
        category: 'aprobacion' as const,
        title: `Ausencia: ${ausencia.asunto}`,
        detail: `${ausencia.usuario_nombre} · ${ausencia.tipo}`,
        urgency,
        score: computeSignalScore(urgency, ausencia.fecha_inicio, ausencia.prioridad, ahora),
        dueDate: ausencia.fecha_inicio,
        route: 'SolicitudesAusencia',
        routeParams: { ausenciaId: ausencia.id },
      };
    });

export const mapSolicitudesInternasAPrioritySignals = (solicitudes: InternalRequest[], ahora: Date = new Date()): PrioritySignal[] =>
  solicitudes
    .filter((solicitud) => solicitud.estado === 'pendiente' || solicitud.estado === 'revisado')
    .map((solicitud) => {
      const urgency = computeUrgencyFromDate(solicitud.fecha_inicio, ahora);
      return {
        id: `solicitud-${solicitud.id}`,
        category: 'aprobacion' as const,
        title: solicitud.titulo,
        detail: solicitud.descripcion || solicitud.tipo,
        urgency,
        score: computeSignalScore(urgency, solicitud.fecha_inicio, solicitud.prioridad, ahora),
        dueDate: solicitud.fecha_inicio,
        route: 'SolicitudesInternas',
        routeParams: { solicitudId: solicitud.id },
      };
    });

export const mapNotificacionesAPrioritySignals = (notificaciones: Notification[], ahora: Date = new Date()): PrioritySignal[] =>
  notificaciones
    .filter((notificacion) => !notificacion.leida)
    .map((notificacion) => {
      const urgency = computeUrgencyFromDate(notificacion.fecha, ahora);
      return {
        id: `notificacion-${notificacion.id}`,
        category: 'notificacion' as const,
        title: notificacion.titulo,
        detail: notificacion.mensaje,
        urgency: urgency === 'normal' ? 'normal' : urgency,
        score: computeSignalScore('normal', undefined, undefined, ahora),
        dueDate: notificacion.fecha,
        route: 'Notificaciones',
        routeParams: { notificacionId: notificacion.id },
      };
    });

/**
 * Mapea el modelo unificado de aprobaciones de Jefe/Admin (RequestReportItem, que agrega ausencias +
 * solicitudes internas + reportes en una sola lista) a señales priorizables.
 */
export const mapAprobacionesReportAPrioritySignals = (items: RequestReportItem[], ahora: Date = new Date()): PrioritySignal[] =>
  items
    .filter((item) => item.estado === 'pendiente')
    .map((item) => {
      const fechaReferencia = item.fechaInicio || item.fechaCreacion;
      const urgency = computeUrgencyFromDate(fechaReferencia, ahora);
      return {
        id: `reporte-${item.sourceCollection}-${item.id}`,
        category: 'aprobacion' as const,
        title: item.titulo,
        detail: `${item.empleadoNombre} · ${item.tipo}`,
        urgency,
        score: computeSignalScore(urgency, fechaReferencia, item.prioridad, ahora),
        dueDate: fechaReferencia,
        route: item.source === 'solicitud_ausencia' ? 'SolicitudesAusencia' : 'SolicitudesInternas',
        routeParams: { itemId: item.id },
      };
    });

/**
 * Señal de "check-in de hoy no realizado" -- se construye a mano (no hay una entidad que representar,
 * es la ausencia de un CheckIn del día). `ultimoCheckIn` es el más reciente del usuario, o null/undefined
 * si nunca hizo uno.
 */
export const buildCheckInPendingSignal = (ultimoCheckIn: { fecha: string } | null | undefined, ahora: Date = new Date()): PrioritySignal | null => {
  const hoyKey = new Date(soloFechaUTC(ahora)).toISOString().slice(0, 10);
  const ultimoKey = ultimoCheckIn ? new Date(soloFechaUTC(new Date(ultimoCheckIn.fecha))).toISOString().slice(0, 10) : null;
  if (ultimoKey === hoyKey) return null;

  return {
    id: 'checkin-pendiente-hoy',
    category: 'asistencia',
    title: 'Check-in de bienestar pendiente',
    detail: 'Todavía no registras tu check-in de hoy.',
    urgency: 'hoy',
    score: computeSignalScore('hoy', hoyKey, undefined, ahora),
    dueDate: hoyKey,
    route: 'CheckInDiario',
  };
};

/**
 * Señal de asistencia irregular de un colaborador (para el home de Jefe/Admin), a partir de un registro
 * de entrada tardía o ausencia de marcaje. `asistencia` debe ser el registro del día evaluado.
 */
export const mapAsistenciaIrregularAPrioritySignal = (asistencia: Attendance, nombreUsuario: string, ahora: Date = new Date()): PrioritySignal | null => {
  if (!asistencia.tarde && !asistencia.salidaAnticipada) return null;

  const detalle = asistencia.tarde
    ? `Llegó ${asistencia.minutosTarde ?? 0} min tarde`
    : `Salió ${asistencia.minutosSalidaAnticipada ?? 0} min antes`;

  return {
    id: `asistencia-${asistencia.id}`,
    category: 'asistencia',
    title: `Asistencia irregular: ${nombreUsuario}`,
    detail: detalle,
    urgency: 'hoy',
    score: computeSignalScore('hoy', undefined, undefined, ahora),
    dueDate: asistencia.fechaJornada,
    route: 'GestionAsistencia',
    routeParams: { asistenciaId: asistencia.id },
  };
};

/**
 * Mezcla señales de múltiples fuentes, ordena por score descendente (más urgente primero) y trunca
 * al máximo indicado. Punto de composición único que usa cada home por rol.
 */
export const buildPriorityFeed = (fuentes: PrioritySignal[][], limite = 12): PrioritySignal[] =>
  fuentes
    .flat()
    .sort((a, b) => b.score - a.score)
    .slice(0, limite);
