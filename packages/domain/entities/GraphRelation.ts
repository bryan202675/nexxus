/**
 * Fase 14: entidad de dominio para Nexxus Brain -- grafo empresarial de relaciones entidad-entidad.
 */

export type GraphEntityType = 'usuario' | 'tarea' | 'documento' | 'solicitud_ausencia' | 'solicitud_interna' | 'departamento';

export interface GraphRelation {
  id: string;
  empresaId: string;
  origenTipo: GraphEntityType;
  origenId: string;
  relacionTipo: string;
  destinoTipo: GraphEntityType;
  destinoId: string;
  metadata: Record<string, unknown>;
  creadoPor?: string;
  createdAt: string;
}
