import { supabase } from './supabaseClient';
import { IPauseRepository, Pause } from 'domain/repositories/IPauseRepository';

function mapRow(row: Record<string, any>): Pause {
  return {
    id: row.id,
    userId: row.usuario_id,
    tipo: row.tipo ?? '',
    duracion: row.fin ? Math.round((new Date(row.fin).getTime() - new Date(row.inicio).getTime()) / 60000) : 0,
    fecha: row.inicio,
  };
}

export class SupabasePauseRepository implements IPauseRepository {
  async save(userId: string, data: Omit<Pause, 'id' | 'userId'>): Promise<void> {
    const finMs = new Date(data.fecha).getTime() + data.duracion * 60000;
    const { error } = await supabase.from('pausas').insert({
      usuario_id: userId,
      tipo: data.tipo,
      inicio: data.fecha,
      fin: new Date(finMs).toISOString(),
    });
    if (error) throw error;
  }

  async getByUser(userId: string): Promise<Pause[]> {
    const { data, error } = await supabase.from('pausas').select('*').eq('usuario_id', userId);
    if (error) throw error;
    return (data || []).map(mapRow);
  }
}
