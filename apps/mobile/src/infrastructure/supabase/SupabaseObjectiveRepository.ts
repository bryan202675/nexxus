import { supabase } from './supabaseClient';
import { subscribeQuery } from './realtime';
import { IObjectiveRepository } from 'domain/repositories/IObjectiveRepository';
import { KeyResult, NewObjective, Objective } from 'domain/entities/Objective';

function mapKeyResult(row: any): KeyResult {
  return {
    id: row.id,
    objectiveId: row.objetivo_id,
    titulo: row.titulo,
    valorObjetivo: Number(row.valor_objetivo),
    valorActual: Number(row.valor_actual),
    unidad: row.unidad || '',
  };
}

function mapObjective(row: any): Objective {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    usuarioId: row.usuario_id,
    creadoPor: row.creado_por,
    titulo: row.titulo,
    descripcion: row.descripcion || '',
    ciclo: row.ciclo,
    fechaLimite: row.fecha_limite || row.ciclo,
    estado: row.estado,
    createdAt: row.created_at,
    keyResults: (row.objetivo_resultados_clave || []).map(mapKeyResult),
  };
}

const SELECT_CON_KRS = '*, objetivo_resultados_clave(*)';

export class SupabaseObjectiveRepository implements IObjectiveRepository {
  async getByUser(usuarioId: string): Promise<Objective[]> {
    const { data, error } = await supabase
      .from('objetivos')
      .select(SELECT_CON_KRS)
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[SupabaseObjectiveRepository] getByUser error:', error);
      throw error;
    }
    return (data || []).map(mapObjective);
  }

  subscribeByUser(usuarioId: string, callback: (objetivos: Objective[]) => void): () => void {
    let active = true;
    const run = () => {
      this.getByUser(usuarioId)
        .then((result) => {
          if (active) callback(result);
        })
        .catch((err) => {
          console.error('[SupabaseObjectiveRepository] subscribeByUser error:', err);
        });
    };

    run();

    const channel1 = supabase
      .channel(`objetivos:${usuarioId}:${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'objetivos', filter: `usuario_id=eq.${usuarioId}` },
        run,
      )
      .subscribe();

    const channel2 = supabase
      .channel(`objetivo_kr:${usuarioId}:${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'objetivo_resultados_clave', filter: `usuario_id=eq.${usuarioId}` },
        run,
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
    };
  }

  async create(objetivo: NewObjective): Promise<void> {
    const fechaLimite = objetivo.fechaLimite || objetivo.ciclo || new Date().toISOString().split('T')[0];
    const { data: creado, error } = await supabase
      .from('objetivos')
      .insert({
        empresa_id: objetivo.empresaId,
        usuario_id: objetivo.usuarioId,
        creado_por: objetivo.creadoPor,
        titulo: objetivo.titulo,
        descripcion: objetivo.descripcion,
        ciclo: fechaLimite,
      })
      .select('id')
      .single();
    if (error) {
      console.error('[SupabaseObjectiveRepository] Error creating objective:', error);
      throw error;
    }

    if (objetivo.keyResults.length > 0) {
      const filas = objetivo.keyResults.map((kr) => ({
        objetivo_id: creado.id,
        empresa_id: objetivo.empresaId,
        usuario_id: objetivo.usuarioId,
        titulo: kr.titulo,
        valor_objetivo: kr.valorObjetivo,
        valor_actual: kr.valorActual ?? 0,
        unidad: kr.unidad,
      }));
      const { error: krError } = await supabase.from('objetivo_resultados_clave').insert(filas);
      if (krError) {
        console.error('[SupabaseObjectiveRepository] Error creating key results:', krError);
        throw krError;
      }
    }
  }

  async updateKeyResultValue(keyResultId: string, valorActual: number): Promise<void> {
    const { error } = await supabase
      .from('objetivo_resultados_clave')
      .update({ valor_actual: valorActual })
      .eq('id', keyResultId);
    if (error) {
      console.error('[SupabaseObjectiveRepository] updateKeyResultValue error:', error);
      throw error;
    }
  }

  async updateEstado(objetivoId: string, estado: Objective['estado']): Promise<void> {
    const { error } = await supabase.from('objetivos').update({ estado }).eq('id', objetivoId);
    if (error) {
      console.error('[SupabaseObjectiveRepository] updateEstado error:', error);
      throw error;
    }
  }

  async remove(objetivoId: string): Promise<void> {
    const { error } = await supabase.from('objetivos').delete().eq('id', objetivoId);
    if (error) {
      console.error('[SupabaseObjectiveRepository] remove error:', error);
      throw error;
    }
  }
}
