import { supabase } from './supabaseClient';
import { IFocusSessionRepository, FocusSession } from 'domain/entities/FocusSession';

function mapRow(row: Record<string, any>): FocusSession {
  return {
    id: row.id,
    userId: row.usuario_id,
    fecha: row.inicio,
    duracionMinutos: row.duracion_segundos ? Math.round(row.duracion_segundos / 60) : 0,
    tareasCompletadas: row.tareas_completadas ?? 0,
    nivelConcentracion: row.nivel_concentracion ?? 0,
    empresaId: '',
  };
}

export class SupabaseFocusSessionRepository implements IFocusSessionRepository {
  async save(data: Omit<FocusSession, 'id'>): Promise<FocusSession> {
    const inicio = new Date(Date.now() - data.duracionMinutos * 60000).toISOString();
    const { data: row, error } = await supabase.from('focus_sessions').insert({
      usuario_id: data.userId,
      inicio,
      fin: new Date().toISOString(),
      duracion_segundos: data.duracionMinutos * 60,
      tareas_completadas: data.tareasCompletadas,
      nivel_concentracion: data.nivelConcentracion,
    }).select('*').single();
    if (error) throw error;
    return { ...mapRow(row), empresaId: data.empresaId };
  }

  async getByUser(userId: string): Promise<FocusSession[]> {
    const { data, error } = await supabase.from('focus_sessions').select('*').eq('usuario_id', userId);
    if (error) throw error;
    return (data || []).map(mapRow);
  }
}
