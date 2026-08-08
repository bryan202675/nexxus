import { supabase } from './supabaseClient';
import { ICompanySettingsRepository } from 'domain/repositories/ICompanySettingsRepository';
import { CompanySettings, AttendanceScheduleInput } from 'domain/entities/CompanySettings';

const DEFAULT_SCHEDULE = { horaEntrada: '08:00', horaSalida: '17:00', toleranciaMinutos: 10, horasEsperadas: 8 };

export class SupabaseCompanySettingsRepository implements ICompanySettingsRepository {
  async getByCompany(empresaId: string): Promise<CompanySettings> {
    const { data, error } = await supabase.from('configuraciones_empresa').select('*').eq('empresa_id', empresaId).maybeSingle();
    if (error) throw error;
    return {
      id: empresaId,
      empresaId,
      asistencia: data?.configuracion?.asistencia ?? DEFAULT_SCHEDULE,
      updatedAt: data?.updated_at,
      updatedBy: data?.configuracion?.updatedBy,
    };
  }

  async saveAttendanceSchedule(params: { empresaId: string; schedule: AttendanceScheduleInput; actorId: string }): Promise<CompanySettings> {
    const { data: current } = await supabase.from('configuraciones_empresa').select('configuracion').eq('empresa_id', params.empresaId).maybeSingle();
    const configuracion = { ...(current?.configuracion || {}), asistencia: params.schedule, updatedBy: params.actorId };
    const { error } = await supabase.from('configuraciones_empresa').upsert({
      empresa_id: params.empresaId,
      configuracion,
    }, { onConflict: 'empresa_id' });
    if (error) throw error;
    return { id: params.empresaId, empresaId: params.empresaId, asistencia: params.schedule, updatedBy: params.actorId };
  }
}
