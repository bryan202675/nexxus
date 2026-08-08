import { supabase } from './supabaseClient';
import { IAppointmentRepository } from 'domain/repositories/IAppointmentRepository';
import { Appointment } from 'domain/entities/Appointment';

function mapRow(row: Record<string, any>): Appointment {
  return {
    ...(row.datos || {}),
    id: row.id,
    usuario_id: row.usuario_id,
    usuario_nombre: row.datos?.usuario_nombre ?? '',
    empresaId: row.empresa_id,
    especialista: row.especialista ?? '',
    especialidad: row.datos?.especialidad ?? '',
    fecha: row.fecha,
    horario: row.datos?.horario ?? '',
    tipoSesion: row.datos?.tipoSesion ?? 'video',
    estado: row.estado,
    fecha_creacion: row.created_at,
  };
}

export class SupabaseAppointmentRepository implements IAppointmentRepository {
  async getAppointmentsByUser(userId: string): Promise<Appointment[]> {
    const { data, error } = await supabase.from('citas').select('*').eq('usuario_id', userId);
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async createAppointment(appointment: Omit<Appointment, 'id' | 'fecha_creacion' | 'estado'>): Promise<void> {
    const { usuario_id, usuario_nombre, empresaId, especialista, especialidad, fecha, horario, tipoSesion } = appointment;
    const { error } = await supabase.from('citas').insert({
      usuario_id, empresa_id: empresaId, especialista, fecha,
      datos: { usuario_nombre, especialidad, horario, tipoSesion },
    });
    if (error) throw error;
  }
}
