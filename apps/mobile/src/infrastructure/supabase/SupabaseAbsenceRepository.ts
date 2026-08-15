import { supabase } from './supabaseClient';
import { IAbsenceRepository } from 'domain/repositories/IAbsenceRepository';
import { Absence } from 'domain/entities/Absence';
import { subscribeQuery } from './realtime';

const QUERY_LIMIT = 500;

function mapRow(row: Record<string, any>): Absence {
  const comentarioResolucion =
    row.datos?.comentario_resolucion ??
    row.datos?.observaciones ??
    row.datos?.observacion ??
    row.observaciones ??
    row.comentario_resolucion ??
    '';

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
    observaciones: comentarioResolucion,
    comentario_resolucion: comentarioResolucion,
    resuelto_por: row.resuelto_por ?? row.datos?.resuelto_por ?? '',
    resolved_at: row.resolved_at ?? row.datos?.resolved_at ?? '',
    fecha_solicitud: row.created_at,
  };
}

export class SupabaseAbsenceRepository implements IAbsenceRepository {
  async getAbsencesByUser(userId: string): Promise<Absence[]> {
    const { data, error } = await supabase.from('solicitudes_ausencia').select('*').eq('usuario_id', userId).order('created_at', { ascending: false }).limit(QUERY_LIMIT);
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async getAbsencesByCompany(empresaId: string): Promise<Absence[]> {
    const { data, error } = await supabase.from('solicitudes_ausencia').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }).limit(QUERY_LIMIT);
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

  async updateAbsenceState(absenceId: string, estado: Absence['estado'], observacion?: string): Promise<void> {
    const { data: current } = await supabase.from('solicitudes_ausencia').select('datos').eq('id', absenceId).maybeSingle();
    const datosActualizados = {
      ...(current?.datos || {}),
      comentario_resolucion: observacion ?? (estado === 'aprobada' ? 'Ausencia aprobada' : 'Ausencia rechazada'),
      observaciones: observacion ?? '',
    };
    const { error } = await supabase.from('solicitudes_ausencia').update({
      estado,
      resolved_at: new Date().toISOString(),
      datos: datosActualizados,
    }).eq('id', absenceId);
    if (error) throw error;
  }

  async updateAbsence(absenceId: string, data: Partial<Absence>): Promise<void> {
    const { tipo, fecha_inicio, fecha_fin, motivo, estado, ...extra } = data;
    const payload: Record<string, any> = {};
    if (tipo !== undefined) payload.tipo = tipo;
    if (fecha_inicio !== undefined) payload.fecha_inicio = fecha_inicio;
    if (fecha_fin !== undefined) payload.fecha_fin = fecha_fin;
    if (motivo !== undefined) payload.motivo = motivo;
    if (estado !== undefined) payload.estado = estado;
    if (Object.keys(extra).length > 0) {
      payload.datos = extra;
    }
    const { error } = await supabase.from('solicitudes_ausencia').update(payload).eq('id', absenceId);
    if (error) throw error;
  }

  async deleteAbsence(absenceId: string): Promise<void> {
    const { error } = await supabase.from('solicitudes_ausencia').delete().eq('id', absenceId);
    if (error) throw error;
  }

  subscribeByUser(userId: string, callback: (absences: Absence[]) => void): () => void {
    return subscribeQuery('solicitudes_ausencia', `usuario_id=eq.${userId}`, () => this.getAbsencesByUser(userId), callback);
  }
}
