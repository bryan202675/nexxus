import { supabase } from './supabaseClient';
import { IPauseRepository, Pause } from 'domain/repositories/IPauseRepository';

function mapRow(row: Record<string, any>): Pause {
  const inicioDate = row.inicio ? new Date(row.inicio) : new Date();
  const validInicio = isNaN(inicioDate.getTime()) ? new Date() : inicioDate;
  const finDate = row.fin ? new Date(row.fin) : validInicio;
  const validFin = isNaN(finDate.getTime()) ? validInicio : finDate;
  const duracionMin = Math.max(0, Math.round((validFin.getTime() - validInicio.getTime()) / 60000));

  return {
    id: row.id || '',
    userId: row.usuario_id || '',
    tipo: row.tipo ?? '',
    duracion: duracionMin,
    fecha: validInicio.toISOString(),
  };
}

export class SupabasePauseRepository implements IPauseRepository {
  async save(userId: string, data: Omit<Pause, 'id' | 'userId'>): Promise<void> {
    const rawDate = data?.fecha ? new Date(data.fecha) : new Date();
    const validInicio = isNaN(rawDate.getTime()) ? new Date() : rawDate;

    // Normalizar duracion: si <= 10 se interpreta como minutos, si > 10 como segundos
    const rawDuracion = typeof data?.duracion === 'number' && !isNaN(data.duracion) && data.duracion > 0
      ? data.duracion
      : 60;
    const duracionMs = rawDuracion <= 10 ? rawDuracion * 60000 : rawDuracion * 1000;
    const finDate = new Date(validInicio.getTime() + duracionMs);

    const { error } = await supabase.from('pausas').insert({
      usuario_id: userId,
      tipo: data?.tipo || 'respiracion_4x4',
      inicio: validInicio.toISOString(),
      fin: finDate.toISOString(),
    });
    if (error) throw error;
  }

  async getByUser(userId: string): Promise<Pause[]> {
    const { data, error } = await supabase.from('pausas').select('*').eq('usuario_id', userId);
    if (error) throw error;
    return (data || []).map(mapRow);
  }
}
