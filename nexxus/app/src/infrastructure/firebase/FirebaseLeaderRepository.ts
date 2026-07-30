import { addDoc, collection, doc, limit, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { Evaluation, NewEvaluationInput } from '@/domain/entities/Evaluation';
import { LeaderDashboard, LeaderTeamMember } from '@/domain/entities/Leader';
import { RequestReportItem, RequestReportPriority, RequestReportStatus } from '@/domain/entities/RequestReport';
import { Task } from '@/domain/entities/Task';
import { User } from '@/domain/entities/User';
import { ILeaderRepository } from '@/domain/repositories/ILeaderRepository';
import { db } from './firebaseConfig';

const textValue = (value: unknown, fallback = '') => typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;

const priorityValue = (value: unknown): RequestReportPriority => {
  const priority = textValue(value, 'media') as RequestReportPriority;
  return ['baja', 'media', 'alta', 'urgente'].includes(priority) ? priority : 'media';
};

const normalizeStatus = (estado: unknown): RequestReportStatus => {
  const value = textValue(estado, 'pendiente');
  if (value === 'aprobado') return 'aprobada';
  if (value === 'rechazado') return 'rechazada';
  if (['pendiente', 'aprobada', 'rechazada', 'resuelto', 'registrado'].includes(value)) return value as RequestReportStatus;
  return 'pendiente';
};

const normalizeAbsence = (id: string, data: Record<string, unknown>): RequestReportItem => ({
  id,
  source: 'solicitud_ausencia',
  sourceCollection: 'solicitudes_ausencia',
  empresaId: textValue(data.empresaId, textValue(data.empresa_id)),
  empleadoId: textValue(data.usuario_id),
  empleadoNombre: textValue(data.usuario_nombre, 'Empleado'),
  tipo: textValue(data.tipo, 'ausencia'),
  titulo: textValue(data.asunto, textValue(data.tipo, 'Solicitud de ausencia')),
  descripcion: textValue(data.motivo, textValue(data.descripcion_detallada, 'Sin detalle')),
  estado: normalizeStatus(data.estado),
  prioridad: priorityValue(data.prioridad),
  fechaCreacion: textValue(data.fecha_solicitud, new Date().toISOString()),
  fechaInicio: textValue(data.fecha_inicio),
  fechaFin: textValue(data.fecha_fin),
  adjuntos: data.archivo_adjunto ? [String(data.archivo_adjunto)] : [],
  aprobadorId: textValue(data.resuelto_por),
  notasResolucion: textValue(data.comentario_resolucion),
});

const normalizeInternal = (id: string, data: Record<string, unknown>): RequestReportItem => ({
  id,
  source: 'solicitud_interna',
  sourceCollection: 'solicitudes_internas',
  empresaId: textValue(data.empresaId, textValue(data.empresa_id)),
  empleadoId: textValue(data.userId),
  empleadoNombre: textValue(data.usuarioNombre, textValue(data.empleadoNombre, 'Empleado')),
  tipo: textValue(data.tipo, 'solicitud'),
  titulo: textValue(data.titulo, textValue(data.tipo, 'Solicitud interna')),
  descripcion: textValue(data.descripcion, 'Sin detalle'),
  estado: normalizeStatus(data.estado),
  prioridad: priorityValue(data.prioridad),
  fechaCreacion: textValue(data.timestamp, textValue(data.fechaCreacion, new Date().toISOString())),
  fechaInicio: textValue(data.fecha_inicio),
  fechaFin: textValue(data.fecha_fin),
  adjuntos: data.archivo_adjunto ? [String(data.archivo_adjunto)] : [],
  aprobadorId: textValue(data.aprobadorId),
  notasResolucion: textValue(data.comentario_resolucion),
});

const isOverdue = (task: Task) => Boolean(task.fecha_limite && task.estado !== 'completada' && Date.parse(task.fecha_limite) < Date.now());
const scoreValue = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
const averageScore = (puntualidad: number, tareasCompletadas: number, disciplina: number) => Math.round((puntualidad + tareasCompletadas + disciplina) / 3);

const normalizeEvaluation = (id: string, data: Record<string, unknown>): Evaluation => ({
  id,
  empresaId: textValue(data.empresaId, textValue(data.empresa_id)),
  empleadoId: textValue(data.empleadoId),
  empleadoNombre: textValue(data.empleadoNombre, 'Empleado'),
  evaluadorId: textValue(data.evaluadorId),
  evaluadorNombre: textValue(data.evaluadorNombre, 'Jefe'),
  periodo: textValue(data.periodo),
  puntualidad: scoreValue(data.puntualidad),
  tareasCompletadas: scoreValue(data.tareasCompletadas),
  disciplina: scoreValue(data.disciplina),
  comentarios: textValue(data.comentarios),
  puntajeTotal: scoreValue(data.puntajeTotal),
  fechaCreacion: textValue(data.fechaCreacion, new Date().toISOString()),
});

export class FirebaseLeaderRepository implements ILeaderRepository {
  subscribeDashboard(
    leader: { id: string; nombre: string; empresaId: string; rol?: string; departamentoId?: string; departamento?: string },
    limitCount: number,
    callback: (dashboard: LeaderDashboard) => void,
    onError: (error: Error) => void
  ): () => void {
    const state = {
      users: [] as User[],
      tasks: [] as Task[],
      absences: [] as RequestReportItem[],
      internalRequests: [] as RequestReportItem[],
      evaluations: [] as Evaluation[],
    };

    const teamScope = (user: User) => {
      if (leader.rol === 'admin' || leader.rol === 'admin_empresa' || leader.rol === 'super_admin') return true;
      if (user.id === leader.id) return false;
      if (user.jefeId === leader.id) return true;
      if (leader.departamentoId && user.departamentoId === leader.departamentoId) return true;
      return Boolean(!leader.departamentoId && leader.departamento && user.departamento === leader.departamento);
    };

    const publish = () => {
      const teamIds = new Set(state.users.filter(teamScope).map((user) => user.id));
      const teamTasks = state.tasks.filter((task) => teamIds.has(task.asignado_a));
      const teamEvaluations = state.evaluations.filter((evaluation) => teamIds.has(evaluation.empleadoId));
      const latestEvaluationByEmployee = new Map<string, Evaluation>();
      teamEvaluations
        .sort((a, b) => Date.parse(b.fechaCreacion) - Date.parse(a.fechaCreacion))
        .forEach((evaluation) => {
          if (!latestEvaluationByEmployee.has(evaluation.empleadoId)) latestEvaluationByEmployee.set(evaluation.empleadoId, evaluation);
        });
      const approvals = [...state.absences, ...state.internalRequests]
        .filter((item) => teamIds.has(item.empleadoId) && item.estado === 'pendiente')
        .sort((a, b) => Date.parse(b.fechaCreacion) - Date.parse(a.fechaCreacion))
        .slice(0, limitCount);
      const team: LeaderTeamMember[] = state.users.filter(teamScope).map((user) => {
        const userTasks = teamTasks.filter((task) => task.asignado_a === user.id);
        return {
          ...user,
          tareasPendientes: userTasks.filter((task) => task.estado !== 'completada').length,
          tareasVencidas: userTasks.filter(isOverdue).length,
          solicitudesPendientes: approvals.filter((item) => item.empleadoId === user.id).length,
          ultimaEvaluacion: latestEvaluationByEmployee.get(user.id),
        };
      });
      const rendimientoPromedio = teamEvaluations.length > 0
        ? Math.round(teamEvaluations.reduce((total, evaluation) => total + evaluation.puntajeTotal, 0) / teamEvaluations.length)
        : 0;

      callback({
        equipo: team,
        tareas: teamTasks,
        aprobaciones: approvals,
        evaluaciones: teamEvaluations,
        metricas: {
          miembros: team.length,
          tareasPendientes: teamTasks.filter((task) => task.estado !== 'completada').length,
          tareasVencidas: teamTasks.filter(isOverdue).length,
          aprobacionesPendientes: approvals.length,
          rendimientoPromedio,
        },
      });
    };

    const unsubscribers = [
      onSnapshot(
        query(collection(db, 'usuarios'), where('empresaId', '==', leader.empresaId), limit(limitCount)),
        (snapshot) => {
          state.users = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as User));
          publish();
        },
        onError
      ),
      onSnapshot(
        query(collection(db, 'tareas'), where('empresaId', '==', leader.empresaId), orderBy('fecha_creacion', 'desc'), limit(limitCount)),
        (snapshot) => {
          state.tasks = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as Task));
          publish();
        },
        onError
      ),
      onSnapshot(
        query(collection(db, 'solicitudes_ausencia'), where('empresaId', '==', leader.empresaId), orderBy('fecha_solicitud', 'desc'), limit(limitCount)),
        (snapshot) => {
          state.absences = snapshot.docs.map((entry) => normalizeAbsence(entry.id, entry.data()));
          publish();
        },
        onError
      ),
      onSnapshot(
        query(collection(db, 'solicitudes_internas'), where('empresaId', '==', leader.empresaId), orderBy('timestamp', 'desc'), limit(limitCount)),
        (snapshot) => {
          state.internalRequests = snapshot.docs.map((entry) => normalizeInternal(entry.id, entry.data()));
          publish();
        },
        onError
      ),
      onSnapshot(
        query(collection(db, 'evaluaciones'), where('empresaId', '==', leader.empresaId), orderBy('fechaCreacion', 'desc'), limit(limitCount)),
        (snapshot) => {
          state.evaluations = snapshot.docs.map((entry) => normalizeEvaluation(entry.id, entry.data()));
          publish();
        },
        onError
      ),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }

  async resolveApproval(
    item: RequestReportItem,
    estado: Extract<RequestReportStatus, 'aprobada' | 'rechazada'>,
    actor: { id: string; nombre: string; rol?: string }
  ): Promise<void> {
    const sourceState = item.sourceCollection === 'solicitudes_internas'
      ? estado === 'aprobada' ? 'aprobado' : 'rechazado'
      : estado;
    await updateDoc(doc(db, item.sourceCollection, item.id), {
      estado: sourceState,
      aprobadorId: actor.id,
      resuelto_por: actor.id,
      resuelto_por_nombre: actor.nombre,
      fechaResolucion: new Date().toISOString(),
      comentario_resolucion: `Resuelto por jefe ${actor.nombre}`,
    });
    await addDoc(collection(db, 'audit_logs'), {
      empresaId: item.empresaId,
      empresa_id: item.empresaId,
      usuarioId: actor.id,
      usuario_id: actor.id,
      usuarioNombre: actor.nombre,
      rol: actor.rol || 'jefe',
      accion: `Resolución de ${item.source}`,
      modulo: 'Panel de Jefe',
      detalles: `${item.titulo} · ${estado}`,
      estado: estado === 'rechazada' ? 'Warning' : 'Success',
      targetId: item.id,
      timestamp: new Date().toISOString(),
    });
  }

  async createEvaluation(input: NewEvaluationInput): Promise<void> {
    const fechaCreacion = new Date().toISOString();
    const puntajeTotal = averageScore(input.puntualidad, input.tareasCompletadas, input.disciplina);
    const docRef = await addDoc(collection(db, 'evaluaciones'), {
      ...input,
      puntajeTotal,
      fechaCreacion,
    });
    await addDoc(collection(db, 'audit_logs'), {
      empresaId: input.empresaId,
      empresa_id: input.empresaId,
      usuarioId: input.evaluadorId,
      usuario_id: input.evaluadorId,
      usuarioNombre: input.evaluadorNombre,
      rol: 'jefe',
      accion: 'Evaluación de desempeño',
      modulo: 'Panel de Jefe',
      detalles: `${input.empleadoNombre} · ${input.periodo} · ${puntajeTotal}`,
      estado: puntajeTotal >= 70 ? 'Success' : 'Warning',
      targetId: docRef.id,
      timestamp: fechaCreacion,
    });
  }
}
