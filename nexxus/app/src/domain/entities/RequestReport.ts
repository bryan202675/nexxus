/**
 * Documentacion Nexxus - nexxus/app/src/domain/entities/RequestReport.ts
 * Capa: dominio.
 * Proposito: Modelo unificado para solicitudes y reportes sin reemplazar colecciones legacy.
 * Dependencias clave: no depende de Firebase ni React.
 * Consideracion de mantenimiento: conservar source/sourceCollection para compatibilidad expand-and-contract.
 */

export type RequestReportSource = 'solicitud_ausencia' | 'solicitud_interna' | 'reporte';
export type RequestReportStatus = 'pendiente' | 'aprobada' | 'rechazada' | 'resuelto' | 'registrado';
export type RequestReportPriority = 'baja' | 'media' | 'alta' | 'urgente';

export interface RequestReportItem {
  id: string;
  source: RequestReportSource;
  sourceCollection: 'solicitudes_ausencia' | 'solicitudes_internas' | 'reportes';
  empresaId: string;
  empleadoId: string;
  empleadoNombre: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  estado: RequestReportStatus;
  prioridad: RequestReportPriority;
  fechaCreacion: string;
  fechaInicio?: string;
  fechaFin?: string;
  adjuntos: string[];
  aprobadorId?: string;
  aprobadorNombre?: string;
  confirmadoPorId?: string;
  confirmadoPorNombre?: string;
  confirmadoAt?: string;
  notasResolucion?: string;
}

export interface NewReportInput {
  empresaId: string;
  empleadoId: string;
  empleadoNombre: string;
  tipo: 'disciplinario' | 'llegada_tarde' | 'ausencia' | 'desempeno' | 'incidencia';
  detalle: string;
  gravedad: RequestReportPriority;
  creadoPor: string;
  creadorNombre: string;
}
