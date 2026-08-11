import { GraphRelation, GraphEntityType } from '../entities/GraphRelation';

export interface IGraphRelationRepository {
  addRelation(relation: Omit<GraphRelation, 'id' | 'createdAt'>): Promise<void>;
  getRelationsForEntity(empresaId: string, tipo: GraphEntityType, entidadId: string): Promise<GraphRelation[]>;
}
