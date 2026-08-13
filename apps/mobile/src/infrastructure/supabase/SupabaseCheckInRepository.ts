import { supabase } from './supabaseClient';
import { ICheckInRepository } from 'domain/repositories/ICheckInRepository';
import { CheckIn, NuevaEntradaCheckIn } from 'domain/entities/CheckIn';

function mapRow(row: Record<string, any>): CheckIn {
  return {
    ...(row.datos || {}),
    id: row.id,
    userId: row.usuario_id,
    empresaId: row.empresa_id ?? undefined,
    fecha: row.created_at,
    energia: row.datos?.energia,
    balanceEmocional: row.datos?.balanceEmocional,
    estres: row.datos?.estres,
    nivelEstres: row.datos?.nivelEstres,
    calidadSueno: row.datos?.calidadSueno,
    cargaLaboral: row.datos?.cargaLaboral,
    indicadoresRapidos: row.datos?.indicadoresRapidos ?? [],
  };
}

export class SupabaseCheckInRepository implements ICheckInRepository {
  async save(userId: string, data: NuevaEntradaCheckIn): Promise<CheckIn> {
    const { empresaId, ...datos } = data as any;
    const { data: row, error } = await supabase.from('checkins').insert({
      usuario_id: userId,
      empresa_id: empresaId ?? null,
      datos,
    }).select('*').single();
    if (error) throw error;
    return mapRow(row);
  }

  async getByUser(userId: string): Promise<CheckIn[]> {
    const { data, error } = await supabase.from('checkins').select('*').eq('usuario_id', userId);
    if (error) throw error;
    return (data || []).map(mapRow);
  }
}
