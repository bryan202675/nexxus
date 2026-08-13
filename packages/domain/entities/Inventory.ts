export type InventoryAssetStatus = 'disponible' | 'asignado' | 'mantenimiento' | 'retirado';
export type InventoryIncidentStatus = 'abierta' | 'en_revision' | 'resuelta';
export type InventoryIncidentPriority = 'baja' | 'media' | 'alta' | 'urgente';

export interface InventoryAsset {
  id: string;
  empresaId: string;
  nombre: string;
  categoria: string;
  codigo: string;
  serie?: string;
  estado: InventoryAssetStatus;
  asignadoA?: string;
  asignadoNombre?: string;
  ubicacion?: string;
  notas?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface InventoryIncident {
  id: string;
  empresaId: string;
  activoId: string;
  activoNombre: string;
  reportadoPor: string;
  reportadoNombre: string;
  descripcion: string;
  prioridad: InventoryIncidentPriority;
  estado: InventoryIncidentStatus;
  fechaCreacion: string;
  fechaResolucion?: string;
}

export interface CreateInventoryAssetInput {
  empresaId: string;
  nombre: string;
  categoria: string;
  codigo: string;
  serie?: string;
  ubicacion?: string;
  notas?: string;
  creadoPor: string;
  creadorNombre: string;
}

export interface AssignInventoryAssetInput {
  empresaId: string;
  activoId: string;
  empleadoId: string;
  empleadoNombre: string;
  actorId: string;
  actorNombre: string;
}

export interface ReportInventoryIncidentInput {
  empresaId: string;
  activoId: string;
  activoNombre: string;
  reportadoPor: string;
  reportadoNombre: string;
  descripcion: string;
  prioridad: InventoryIncidentPriority;
}
