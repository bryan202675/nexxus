import { supabase } from './supabaseClient';
import { IFeedbackRepository, Feedback } from 'domain/entities/Feedback';

function mapRow(row: Record<string, any>): Feedback {
  return {
    id: row.id,
    userId: row.usuario_id,
    empresaId: row.empresa_id,
    tipo: row.categoria ?? row.datos?.tipo ?? 'sugerencia',
    mensaje: row.contenido,
    nivelSatisfaccion: row.datos?.nivelSatisfaccion,
    estado: row.datos?.estado ?? 'pendiente',
    fecha: row.created_at,
  };
}

export class SupabaseFeedbackRepository implements IFeedbackRepository {
  async save(data: Omit<Feedback, 'id' | 'estado' | 'fecha'>): Promise<Feedback> {
    const { data: row, error } = await supabase.from('feedbacks').insert({
      usuario_id: data.userId,
      empresa_id: data.empresaId,
      categoria: data.tipo,
      contenido: data.mensaje,
      datos: { tipo: data.tipo, nivelSatisfaccion: data.nivelSatisfaccion, estado: 'pendiente' },
    }).select('*').single();
    if (error) throw error;
    return mapRow(row);
  }

  async getByUser(userId: string): Promise<Feedback[]> {
    const { data, error } = await supabase.from('feedbacks').select('*').eq('usuario_id', userId);
    if (error) throw error;
    return (data || []).map(mapRow);
  }
}
