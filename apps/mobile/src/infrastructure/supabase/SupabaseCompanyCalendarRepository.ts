import { supabase } from './supabaseClient';
import {
  ICompanyCalendarRepository, SaveCompanyCalendarEventInput,
} from 'domain/repositories/ICompanyCalendarRepository';
import { CompanyCalendarEvent, CompanyCalendarSnapshot } from 'domain/entities/CompanyCalendar';
import { subscribeQuery } from './realtime';

function mapRow(row: Record<string, any>): CompanyCalendarEvent {
  return {
    ...(row.datos || {}),
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion ?? undefined,
    tipo: row.tipo,
    inicio: row.fecha_inicio,
    fin: row.fecha_fin ?? row.fecha_inicio,
    empresaId: row.empresa_id,
    creadoEn: row.created_at,
  };
}

export class SupabaseCompanyCalendarRepository implements ICompanyCalendarRepository {
  subscribeCompanyCalendar(empresaId: string, callback: (snapshot: CompanyCalendarSnapshot) => void): () => void {
    const load = async (): Promise<CompanyCalendarSnapshot> => {
      const [{ data: eventos }, { data: usuarios }, { data: departamentos }, { data: sedes }] = await Promise.all([
        supabase.from('calendario_empresarial').select('*').eq('empresa_id', empresaId),
        supabase.from('usuarios').select('id, nombre, correo, estado_activo').eq('empresa_id', empresaId),
        supabase.from('departamentos').select('id, nombre').eq('empresa_id', empresaId),
        supabase.from('sedes').select('id, nombre').eq('empresa_id', empresaId),
      ]);
      return {
        eventos: (eventos || []).map(mapRow),
        usuarios: (usuarios || []).map((u) => ({ id: u.id, nombre: u.nombre, correo: u.correo, activo: u.estado_activo })),
        departamentos: (departamentos || []).map((d) => ({ id: d.id, nombre: d.nombre })),
        sedes: (sedes || []).map((s) => ({ id: s.id, nombre: s.nombre })),
      };
    };
    return subscribeQuery('calendario_empresarial', `empresa_id=eq.${empresaId}`, load, callback);
  }

  async saveEvent(input: SaveCompanyCalendarEventInput): Promise<string> {
    const { id, titulo, descripcion, tipo, inicio, fin, empresaId, creadoPor, ...extra } = input;
    const row = {
      empresa_id: empresaId,
      titulo, descripcion: descripcion ?? null, tipo,
      fecha_inicio: typeof inicio === 'string' ? inicio : new Date(inicio as any).toISOString(),
      fecha_fin: fin ? (typeof fin === 'string' ? fin : new Date(fin as any).toISOString()) : null,
      datos: { ...extra, creadoPor },
    };
    if (id) {
      const { error } = await supabase.from('calendario_empresarial').update(row).eq('id', id);
      if (error) throw error;
      return id;
    }
    const { data, error } = await supabase.from('calendario_empresarial').insert(row).select('id').single();
    if (error) throw error;
    return data.id;
  }

  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await supabase.from('calendario_empresarial').delete().eq('id', eventId);
    if (error) throw error;
  }
}
