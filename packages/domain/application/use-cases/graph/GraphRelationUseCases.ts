/**
 * Fase 14: casos de uso de Nexxus Brain (grafo empresarial de relaciones entidad-entidad).
 */

import { IGraphRelationRepository } from '../../../repositories/IGraphRelationRepository';
import { GraphRelation, GraphEntityType } from '../../../entities/GraphRelation';

export class AddGraphRelation {
  constructor(private repo: IGraphRelationRepository) {}
  execute(relation: Omit<GraphRelation, 'id' | 'createdAt'>): Promise<void> {
    return this.repo.addRelation(relation);
  }
}

export class GetEntityRelations {
  constructor(private repo: IGraphRelationRepository) {}
  execute(empresaId: string, tipo: GraphEntityType, entidadId: string): Promise<GraphRelation[]> {
    return this.repo.getRelationsForEntity(empresaId, tipo, entidadId);
  }
}
