import { supabase } from './supabaseClient';
import { IAbsenceRepository } from 'domain/repositories/IAbsenceRepository';
import { Absence } from 'domain/entities/Absence';

function mapRow(row: Record<string, any>): Absence {
  return {
    ...(row.datos || {}),
    id: row.id,
    usuario_id: row.usuario_id,
    usuario_nombre: row.datos?.usuario_nombre ?? '',
    empresaId: row.empresa_id,
    asunto: row.datos?.asunto ?? row.tipo,
    tipo: row.tipo,
    fecha_inicio: row.fecha_inicio,
    fecha_fin: row.fecha_fin,
    motivo: row.motivo ?? '',
    estado: row.estado,
    fecha_solicitud: row.created_at,
  };
}

export class SupabaseAbsenceRepository implements IAbsenceRepository {
  async getAbsencesByUser(userId: string): Promise<Absence[]> {
    const { data, error } = await supabase.from('solicitudes_ausencia').select('*').eq('usuario_id', userId);
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async getAbsencesByCompany(empresaId: string): Promise<Absence[]> {
    const { data, error } = await supabase.from('solicitudes_ausencia').select('*').eq('empresa_id', empresaId);
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async createAbsence(absence: Omit<Absence, 'id' | 'fecha_solicitud' | 'estado'>): Promise<void> {
    const { usuario_id, usuario_nombre, empresaId, asunto, tipo, fecha_inicio, fecha_fin, motivo, ...extra } = absence;
    const { error } = await supabase.from('solicitudes_ausencia').insert({
      usuario_id, empresa_id: empresaId, tipo, fecha_inicio, fecha_fin, motivo,
      datos: { usuario_nombre, asunto, ...extra },
    });
    if (error) throw error;
  }

  async updateAbsenceState(absenceId: string, estado: Absence['estado']): Promise<void> {
    const { error } = await supabase.from('solicitudes_ausencia').update({ estado, resolved_at: new Date().toISOString() }).eq('id', absenceId);
    if (error) throw error;
  }
}
