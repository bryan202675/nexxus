import { addDoc, collection, doc, limit, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import {
  AssignInventoryAssetInput,
  CreateInventoryAssetInput,
  InventoryAsset,
  InventoryAssetStatus,
  InventoryIncident,
  InventoryIncidentPriority,
  InventoryIncidentStatus,
  ReportInventoryIncidentInput,
} from '@/domain/entities/Inventory';
import { IInventoryRepository } from '@/domain/repositories/IInventoryRepository';
import { db } from './firebaseConfig';

const textValue = (value: unknown, fallback = '') => typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;

const assetStatus = (value: unknown): InventoryAssetStatus => {
  const status = textValue(value, 'disponible');
  return ['disponible', 'asignado', 'mantenimiento', 'retirado'].includes(status) ? status as InventoryAssetStatus : 'disponible';
};

const incidentStatus = (value: unknown): InventoryIncidentStatus => {
  const status = textValue(value, 'abierta');
  return ['abierta', 'en_revision', 'resuelta'].includes(status) ? status as InventoryIncidentStatus : 'abierta';
};

const incidentPriority = (value: unknown): InventoryIncidentPriority => {
  const priority = textValue(value, 'media');
  return ['baja', 'media', 'alta', 'urgente'].includes(priority) ? priority as InventoryIncidentPriority : 'media';
};

const normalizeAsset = (id: string, data: Record<string, unknown>): InventoryAsset => ({
  id,
  empresaId: textValue(data.empresaId, textValue(data.empresa_id)),
  nombre: textValue(data.nombre, 'Activo'),
  categoria: textValue(data.categoria, 'General'),
  codigo: textValue(data.codigo, id),
  serie: textValue(data.serie),
  estado: assetStatus(data.estado),
  asignadoA: textValue(data.asignadoA),
  asignadoNombre: textValue(data.asignadoNombre),
  ubicacion: textValue(data.ubicacion),
  notas: textValue(data.notas),
  fechaCreacion: textValue(data.fechaCreacion, new Date().toISOString()),
  fechaActualizacion: textValue(data.fechaActualizacion, new Date().toISOString()),
});

const normalizeIncident = (id: string, data: Record<string, unknown>): InventoryIncident => ({
  id,
  empresaId: textValue(data.empresaId, textValue(data.empresa_id)),
  activoId: textValue(data.activoId),
  activoNombre: textValue(data.activoNombre, 'Activo'),
  reportadoPor: textValue(data.reportadoPor),
  reportadoNombre: textValue(data.reportadoNombre, 'Empleado'),
  descripcion: textValue(data.descripcion, 'Sin detalle'),
  prioridad: incidentPriority(data.prioridad),
  estado: incidentStatus(data.estado),
  fechaCreacion: textValue(data.fechaCreacion, new Date().toISOString()),
  fechaResolucion: textValue(data.fechaResolucion),
});

export class FirebaseInventoryRepository implements IInventoryRepository {
  subscribeCompanyAssets(empresaId: string, limitCount: number, callback: (assets: InventoryAsset[]) => void, onError: (error: Error) => void): () => void {
    return onSnapshot(
      query(collection(db, 'inventario_activos'), where('empresaId', '==', empresaId), orderBy('fechaActualizacion', 'desc'), limit(limitCount)),
      (snapshot) => callback(snapshot.docs.map((entry) => normalizeAsset(entry.id, entry.data()))),
      onError
    );
  }

  subscribeUserAssets(empresaId: string, userId: string, limitCount: number, callback: (assets: InventoryAsset[]) => void, onError: (error: Error) => void): () => void {
    return onSnapshot(
      query(collection(db, 'inventario_activos'), where('empresaId', '==', empresaId), where('asignadoA', '==', userId), orderBy('fechaActualizacion', 'desc'), limit(limitCount)),
      (snapshot) => callback(snapshot.docs.map((entry) => normalizeAsset(entry.id, entry.data()))),
      onError
    );
  }

  subscribeIncidents(empresaId: string, limitCount: number, callback: (incidents: InventoryIncident[]) => void, onError: (error: Error) => void): () => void {
    return onSnapshot(
      query(collection(db, 'incidencias'), where('empresaId', '==', empresaId), orderBy('fechaCreacion', 'desc'), limit(limitCount)),
      (snapshot) => callback(snapshot.docs.map((entry) => normalizeIncident(entry.id, entry.data()))),
      onError
    );
  }

  async createAsset(input: CreateInventoryAssetInput): Promise<InventoryAsset> {
    const now = new Date().toISOString();
    const docData = {
      empresaId: input.empresaId,
      empresa_id: input.empresaId,
      nombre: input.nombre.trim(),
      categoria: input.categoria.trim() || 'General',
      codigo: input.codigo.trim(),
      serie: input.serie?.trim() || '',
      ubicacion: input.ubicacion?.trim() || '',
      notas: input.notas?.trim() || '',
      estado: 'disponible' as InventoryAssetStatus,
      creadoPor: input.creadoPor,
      creadorNombre: input.creadorNombre,
      fechaCreacion: now,
      fechaActualizacion: now,
    };
    const docRef = await addDoc(collection(db, 'inventario_activos'), docData);
    await addDoc(collection(db, 'inventario_movimientos'), {
      empresaId: input.empresaId,
      empresa_id: input.empresaId,
      activoId: docRef.id,
      tipo: 'alta',
      actorId: input.creadoPor,
      actorNombre: input.creadorNombre,
      detalle: `Activo registrado: ${docData.nombre}`,
      fecha: now,
    });
    return normalizeAsset(docRef.id, docData);
  }

  async assignAsset(input: AssignInventoryAssetInput): Promise<void> {
    const now = new Date().toISOString();
    await updateDoc(doc(db, 'inventario_activos', input.activoId), {
      estado: 'asignado',
      asignadoA: input.empleadoId,
      asignadoNombre: input.empleadoNombre,
      fechaActualizacion: now,
    });
    await addDoc(collection(db, 'inventario_movimientos'), {
      empresaId: input.empresaId,
      empresa_id: input.empresaId,
      activoId: input.activoId,
      tipo: 'asignacion',
      empleadoId: input.empleadoId,
      empleadoNombre: input.empleadoNombre,
      actorId: input.actorId,
      actorNombre: input.actorNombre,
      detalle: `Asignado a ${input.empleadoNombre}`,
      fecha: now,
    });
  }

  async returnAsset(input: Omit<AssignInventoryAssetInput, 'empleadoId' | 'empleadoNombre'>): Promise<void> {
    const now = new Date().toISOString();
    await updateDoc(doc(db, 'inventario_activos', input.activoId), {
      estado: 'disponible',
      asignadoA: '',
      asignadoNombre: '',
      fechaActualizacion: now,
    });
    await addDoc(collection(db, 'inventario_movimientos'), {
      empresaId: input.empresaId,
      empresa_id: input.empresaId,
      activoId: input.activoId,
      tipo: 'devolucion',
      actorId: input.actorId,
      actorNombre: input.actorNombre,
      detalle: 'Activo devuelto a inventario',
      fecha: now,
    });
  }

  async reportIncident(input: ReportInventoryIncidentInput): Promise<InventoryIncident> {
    const now = new Date().toISOString();
    const docData = {
      empresaId: input.empresaId,
      empresa_id: input.empresaId,
      activoId: input.activoId,
      activoNombre: input.activoNombre,
      reportadoPor: input.reportadoPor,
      reportadoNombre: input.reportadoNombre,
      descripcion: input.descripcion.trim(),
      prioridad: input.prioridad,
      estado: 'abierta' as InventoryIncidentStatus,
      fechaCreacion: now,
    };
    const docRef = await addDoc(collection(db, 'incidencias'), docData);
    return normalizeIncident(docRef.id, docData);
  }

  async resolveIncident(incidentId: string, empresaId: string, actor: { id: string; nombre: string }): Promise<void> {
    const now = new Date().toISOString();
    await updateDoc(doc(db, 'incidencias', incidentId), {
      estado: 'resuelta',
      resueltoPor: actor.id,
      resueltoNombre: actor.nombre,
      fechaResolucion: now,
    });
    await addDoc(collection(db, 'inventario_movimientos'), {
      empresaId,
      empresa_id: empresaId,
      tipo: 'incidencia_resuelta',
      actorId: actor.id,
      actorNombre: actor.nombre,
      detalle: `Incidencia resuelta: ${incidentId}`,
      fecha: now,
    });
  }
}
