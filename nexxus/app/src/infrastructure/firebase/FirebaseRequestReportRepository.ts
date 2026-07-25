/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseRequestReportRepository.ts
 * Capa: infraestructura.
 * Proposito: Normaliza solicitudes legacy y reportes nuevos para el Centro de Reportes y Solicitudes.
 * Dependencias clave: Firestore y contratos de dominio RequestReport.
 * Consideracion de mantenimiento: no borrar ni migrar documentos legacy desde aqui; solo leer/actualizar estados compatibles.
 */

import { addDoc, collection, doc, limit as firestoreLimit, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { NewReportInput, RequestReportItem, RequestReportPriority, RequestReportStatus } from '@/domain/entities/RequestReport';
import { IRequestReportRepository } from '@/domain/repositories/IRequestReportRepository';

const textValue = (value: unknown, fallback = '') => typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
const priorityValue = (value: unknown): RequestReportPriority => {
  const priority = textValue(value, 'media') as RequestReportPriority;
  return ['baja', 'media', 'alta', 'urgente'].includes(priority) ? priority : 'media';
};

const normalizeInternalStatus = (estado: unknown): RequestReportStatus => {
  const value = textValue(estado, 'pendiente');
  if (value === 'aprobado') return 'aprobada';
  if (value === 'rechazado') return 'rechazada';
  if (['pendiente', 'aprobada', 'rechazada', 'resuelto', 'registrado'].includes(value)) return value as RequestReportStatus;
  return 'pendiente';
};

const normalizeAbsence = (id: string, data: Record<string, any>): RequestReportItem => ({
  id,
  source: 'solicitud_ausencia',
  sourceCollection: 'solicitudes_ausencia',
  empresaId: textValue(data.empresaId, textValue(data.empresa_id)),
  empleadoId: textValue(data.usuario_id),
  empleadoNombre: textValue(data.usuario_nombre, 'Empleado'),
  tipo: textValue(data.tipo, 'ausencia'),
  titulo: textValue(data.asunto, textValue(data.tipo, 'Solicitud de ausencia')),
  descripcion: textValue(data.motivo, textValue(data.descripcion_detallada, 'Sin detalle')),
  estado: normalizeInternalStatus(data.estado),
  prioridad: priorityValue(data.prioridad),
  fechaCreacion: textValue(data.fecha_solicitud, new Date().toISOString()),
  fechaInicio: textValue(data.fecha_inicio),
  fechaFin: textValue(data.fecha_fin),
  adjuntos: data.archivo_adjunto ? [String(data.archivo_adjunto)] : [],
  aprobadorId: textValue(data.resuelto_por),
  aprobadorNombre: textValue(data.resuelto_por_nombre),
  confirmadoPorId: textValue(data.confirmadoPorId),
  confirmadoPorNombre: textValue(data.confirmadoPorNombre),
  confirmadoAt: textValue(data.confirmadoAt),
  notasResolucion: textValue(data.comentario_resolucion),
});

const normalizeInternal = (id: string, data: Record<string, any>): RequestReportItem => ({
  id,
  source: 'solicitud_interna',
  sourceCollection: 'solicitudes_internas',
  empresaId: textValue(data.empresaId, textValue(data.empresa_id)),
  empleadoId: textValue(data.userId),
  empleadoNombre: textValue(data.usuarioNombre, textValue(data.empleadoNombre, 'Empleado')),
  tipo: textValue(data.tipo, 'solicitud'),
  titulo: textValue(data.titulo, textValue(data.tipo, 'Solicitud interna')),
  descripcion: textValue(data.descripcion, 'Sin detalle'),
  estado: normalizeInternalStatus(data.estado),
  prioridad: priorityValue(data.prioridad),
  fechaCreacion: textValue(data.timestamp, textValue(data.fechaCreacion, new Date().toISOString())),
  fechaInicio: textValue(data.fecha_inicio),
  fechaFin: textValue(data.fecha_fin),
  adjuntos: data.archivo_adjunto ? [String(data.archivo_adjunto)] : [],
  aprobadorId: textValue(data.aprobadorId),
  aprobadorNombre: textValue(data.aprobadorNombre),
  confirmadoPorId: textValue(data.confirmadoPorId),
  confirmadoPorNombre: textValue(data.confirmadoPorNombre),
  confirmadoAt: textValue(data.confirmadoAt),
  notasResolucion: textValue(data.comentario_resolucion),
});

const normalizeReport = (id: string, data: Record<string, any>): RequestReportItem => ({
  id,
  source: 'reporte',
  sourceCollection: 'reportes',
  empresaId: textValue(data.empresaId, textValue(data.empresa_id)),
  empleadoId: textValue(data.empleadoId),
  empleadoNombre: textValue(data.empleadoNombre, 'Empleado'),
  tipo: textValue(data.tipo, 'reporte'),
  titulo: textValue(data.titulo, `Reporte ${textValue(data.tipo, '')}`.trim()),
  descripcion: textValue(data.detalle, textValue(data.descripcion, 'Sin detalle')),
  estado: normalizeInternalStatus(data.estado || 'registrado'),
  prioridad: priorityValue(data.gravedad || data.prioridad),
  fechaCreacion: textValue(data.fecha, textValue(data.fechaCreacion, new Date().toISOString())),
  adjuntos: Array.isArray(data.adjuntos) ? data.adjuntos.map(String) : [],
  aprobadorId: textValue(data.creadoPor),
  aprobadorNombre: textValue(data.creadorNombre),
  confirmadoPorId: textValue(data.confirmadoPorId),
  confirmadoPorNombre: textValue(data.confirmadoPorNombre),
  confirmadoAt: textValue(data.confirmadoAt),
  notasResolucion: textValue(data.notas),
});

export class FirebaseRequestReportRepository implements IRequestReportRepository {
  subscribeByCompany(
    empresaId: string,
    limitCount: number,
    callback: (items: RequestReportItem[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const buckets = new Map<string, RequestReportItem[]>();
    const publish = () => {
      const items = Array.from(buckets.values())
        .flat()
        .sort((a, b) => Date.parse(b.fechaCreacion) - Date.parse(a.fechaCreacion))
        .slice(0, limitCount);
      callback(items);
    };

    const listen = (key: string, collectionName: string, orderField: string, mapper: (id: string, data: Record<string, any>) => RequestReportItem) => onSnapshot(
      query(collection(db, collectionName), where('empresaId', '==', empresaId), orderBy(orderField, 'desc'), firestoreLimit(limitCount)),
      (snapshot) => {
        buckets.set(key, snapshot.docs.map((entry) => mapper(entry.id, entry.data())));
        publish();
      },
      onError
    );

    const unsubscribers = [
      listen('ausencias', 'solicitudes_ausencia', 'fecha_solicitud', normalizeAbsence),
      listen('internas', 'solicitudes_internas', 'timestamp', normalizeInternal),
      listen('reportes', 'reportes', 'fecha', normalizeReport),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }

  async resolve(
    item: RequestReportItem,
    estado: Extract<RequestReportStatus, 'aprobada' | 'rechazada' | 'resuelto'>,
    actor: { id: string; nombre: string; rol?: string }
  ): Promise<void> {
    const sourceState = item.sourceCollection === 'solicitudes_internas'
      ? estado === 'aprobada' ? 'aprobado' : estado === 'rechazada' ? 'rechazado' : estado
      : estado;
    const resolvedAt = new Date().toISOString();
    await updateDoc(doc(db, item.sourceCollection, item.id), {
      estado: sourceState,
      aprobadorId: actor.id,
      aprobadorNombre: actor.nombre,
      resuelto_por: actor.id,
      resuelto_por_nombre: actor.nombre,
      fechaResolucion: resolvedAt,
      confirmadoPorId: actor.id,
      confirmadoPorNombre: actor.nombre,
      confirmadoAt: resolvedAt,
      confirmacionDigital: {
        actorId: actor.id,
        actorNombre: actor.nombre,
        rol: actor.rol || 'admin_empresa',
        estado,
        timestamp: resolvedAt,
      },
      comentario_resolucion: `Resuelto desde Centro de Reportes y Solicitudes por ${actor.nombre}`,
    });
    await addDoc(collection(db, 'audit_logs'), {
      empresaId: item.empresaId,
      empresa_id: item.empresaId,
      usuarioId: actor.id,
      usuario_id: actor.id,
      usuarioNombre: actor.nombre,
      rol: actor.rol || 'admin_empresa',
      accion: `Resolución de ${item.source}`,
      modulo: 'Reportes y Solicitudes',
      detalles: `${item.titulo} · ${estado}`,
      estado: estado === 'rechazada' ? 'Warning' : 'Success',
      targetId: item.id,
      timestamp: resolvedAt,
    });
  }

  async createReport(input: NewReportInput): Promise<RequestReportItem> {
    const fecha = new Date().toISOString();
    const docData = {
      empresaId: input.empresaId,
      empresa_id: input.empresaId,
      empleadoId: input.empleadoId,
      empleadoNombre: input.empleadoNombre,
      tipo: input.tipo,
      titulo: `Reporte ${input.tipo.replace(/_/g, ' ')}`,
      detalle: input.detalle,
      gravedad: input.gravedad,
      creadoPor: input.creadoPor,
      creadorNombre: input.creadorNombre,
      estado: 'registrado',
      adjuntos: [],
      fecha,
      fechaCreacion: fecha,
    };
    const docRef = await addDoc(collection(db, 'reportes'), docData);
    await addDoc(collection(db, 'audit_logs'), {
      empresaId: input.empresaId,
      empresa_id: input.empresaId,
      usuarioId: input.creadoPor,
      usuario_id: input.creadoPor,
      usuarioNombre: input.creadorNombre,
      rol: 'admin_empresa',
      accion: 'Creación de reporte',
      modulo: 'Reportes y Solicitudes',
      detalles: `${input.empleadoNombre} · ${input.tipo}`,
      estado: input.gravedad === 'urgente' ? 'Warning' : 'Success',
      targetId: docRef.id,
      timestamp: fecha,
    });
    return normalizeReport(docRef.id, docData);
  }
}
