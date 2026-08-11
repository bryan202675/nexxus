import { supabase } from './supabaseClient';
import { IGraphRelationRepository } from 'domain/repositories/IGraphRelationRepository';
import { GraphRelation, GraphEntityType } from 'domain/entities/GraphRelation';

function mapRow(row: Record<string, any>): GraphRelation {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    origenTipo: row.origen_tipo,
    origenId: row.origen_id,
    relacionTipo: row.relacion_tipo,
    destinoTipo: row.destino_tipo,
    destinoId: row.destino_id,
    metadata: row.metadata || {},
    creadoPor: row.creado_por ?? undefined,
    createdAt: row.created_at,
  };
}

export class SupabaseGraphRelationRepository implements IGraphRelationRepository {
  async addRelation(relation: Omit<GraphRelation, 'id' | 'createdAt'>): Promise<void> {
    // El mismo edge (origen+relacion+destino) es unico -- ignoreDuplicates para que reenviar un
    // mensaje entre las mismas dos personas, o resubir un documento, no falle ni duplique la fila.
    const { error } = await supabase
      .from('grafo_relaciones')
      .upsert({
        empresa_id: relation.empresaId,
        origen_tipo: relation.origenTipo,
        origen_id: relation.origenId,
        relacion_tipo: relation.relacionTipo,
        destino_tipo: relation.destinoTipo,
        destino_id: relation.destinoId,
        metadata: relation.metadata || {},
        creado_por: relation.creadoPor || null,
      }, { onConflict: 'empresa_id,origen_tipo,origen_id,relacion_tipo,destino_tipo,destino_id', ignoreDuplicates: true });
    if (error) throw error;
  }

  async getRelationsForEntity(empresaId: string, tipo: GraphEntityType, entidadId: string): Promise<GraphRelation[]> {
    const { data, error } = await supabase
      .from('grafo_relaciones')
      .select('*')
      .eq('empresa_id', empresaId)
      .or(`and(origen_tipo.eq.${tipo},origen_id.eq.${entidadId}),and(destino_tipo.eq.${tipo},destino_id.eq.${entidadId})`);
    if (error) throw error;
    return (data || []).map(mapRow);
  }
}
