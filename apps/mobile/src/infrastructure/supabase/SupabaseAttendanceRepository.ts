import { supabase } from './supabaseClient';
import { IAttendanceRepository } from 'domain/repositories/IAttendanceRepository';
import { Attendance, AttendanceDailySummary, NuevaEntradaAsistencia } from 'domain/entities/Attendance';

function mapRow(row: Record<string, any>): Attendance {
  return {
    id: row.id,
    userId: row.usuario_id,
    empresaId: row.empresa_id,
    tipo: row.tipo,
    timestamp: row.created_at,
    fechaJornada: row.fecha_jornada ?? undefined,
    metodoRegistro: row.metodo_registro ?? undefined,
    horasTrabajadas: row.horas_trabajadas ?? undefined,
    horas_extra_calculadas: row.horas_extra ?? undefined,
    tarde: row.tarde ?? undefined,
    minutosTarde: row.minutos_tarde ?? undefined,
    salidaAnticipada: row.salida_anticipada ?? undefined,
    minutosSalidaAnticipada: row.minutos_salida_anticipada ?? undefined,
    estado_aprobacion: row.estado_aprobacion,
    offline_sync: row.offline_sync,
  };
}

export class SupabaseAttendanceRepository implements IAttendanceRepository {
  async record(userId: string, data: NuevaEntradaAsistencia): Promise<Attendance> {
    const { data: row, error } = await supabase.from('asistencias').insert({
      usuario_id: userId,
      empresa_id: data.empresaId,
      tipo: data.tipo,
      fecha_jornada: data.fechaJornada ?? null,
      metodo_registro: data.metodoRegistro ?? null,
      horas_trabajadas: data.horasTrabajadas ?? null,
      horas_extra: data.horas_extra_calculadas ?? null,
      tarde: data.tarde ?? null,
      minutos_tarde: data.minutosTarde ?? null,
      salida_anticipada: data.salidaAnticipada ?? null,
      minutos_salida_anticipada: data.minutosSalidaAnticipada ?? null,
      estado_aprobacion: data.estado_aprobacion,
    }).select('*').single();
    if (error) throw error;
    return mapRow(row);
  }

  async getByUser(userId: string, limit = 30): Promise<Attendance[]> {
    const { data, error } = await supabase.from('asistencias').select('*').eq('usuario_id', userId).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async getCurrentShift(userId: string): Promise<Attendance | null> {
    const { data, error } = await supabase.from('asistencias').select('*').eq('usuario_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error || !data) return null;
    const record = mapRow(data);
    return record.tipo === 'entrada' || record.tipo === 'inicio_pausa' ? record : null;
  }

  async getByCompany(empresaId: string, limit = 100): Promise<Attendance[]> {
    const { data, error } = await supabase.from('asistencias').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async getDailySummaryByCompany(empresaId: string, dateIso: string, limit = 100): Promise<AttendanceDailySummary[]> {
    const start = `${dateIso}T00:00:00`;
    const end = `${dateIso}T23:59:59`;
    const { data, error } = await supabase.from('asistencias').select('*').eq('empresa_id', empresaId).gte('created_at', start).lte('created_at', end).limit(limit);
    if (error) throw error;
    const byUser = new Map<string, AttendanceDailySummary>();
    for (const row of data || []) {
      const rec = mapRow(row);
      const summary = byUser.get(rec.userId) || {
        userId: rec.userId, empresaId, fecha: dateIso,
        horasTrabajadas: 0, horasExtra: 0, tarde: false, minutosTarde: 0,
        salidaAnticipada: false, minutosSalidaAnticipada: 0,
      };
      if (rec.tipo === 'entrada') summary.entrada = rec.timestamp;
      if (rec.tipo === 'salida') summary.salida = rec.timestamp;
      summary.horasTrabajadas += rec.horasTrabajadas || 0;
      summary.horasExtra += rec.horas_extra_calculadas || 0;
      summary.tarde = summary.tarde || !!rec.tarde;
      summary.minutosTarde += rec.minutosTarde || 0;
      summary.salidaAnticipada = summary.salidaAnticipada || !!rec.salidaAnticipada;
      summary.minutosSalidaAnticipada += rec.minutosSalidaAnticipada || 0;
      byUser.set(rec.userId, summary);
    }
    return Array.from(byUser.values());
  }
}
