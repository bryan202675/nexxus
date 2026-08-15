import { supabase } from './supabaseClient';
import { subscribeQuery } from './realtime';
import { ISessionDeviceRepository } from 'domain/repositories/ISessionDeviceRepository';
import { RegisterSessionDeviceInput, SessionDevice } from 'domain/entities/SessionDevice';

function mapRow(row: any): SessionDevice {
  return {
    id: row.id,
    userId: row.usuario_id,
    empresaId: row.empresa_id,
    deviceId: row.device_id,
    deviceName: row.dispositivo_nombre,
    deviceOs: row.dispositivo_so,
    appVersion: row.app_version,
    createdAt: row.creado_en,
    lastSeenAt: row.ultimo_acceso,
  };
}

export class SupabaseSessionDeviceRepository implements ISessionDeviceRepository {
  async getByUser(userId: string): Promise<SessionDevice[]> {
    const { data, error } = await supabase
      .from('sesiones_dispositivo')
      .select('*')
      .eq('usuario_id', userId)
      .order('ultimo_acceso', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  subscribeByUser(userId: string, callback: (devices: SessionDevice[]) => void): () => void {
    return subscribeQuery('sesiones_dispositivo', `usuario_id=eq.${userId}`, () => this.getByUser(userId), callback);
  }

  async register(input: RegisterSessionDeviceInput): Promise<void> {
    const { error } = await supabase.from('sesiones_dispositivo').upsert({
      usuario_id: input.userId,
      empresa_id: input.empresaId,
      device_id: input.deviceId,
      dispositivo_nombre: input.deviceName,
      dispositivo_so: input.deviceOs,
      app_version: input.appVersion,
      ultimo_acceso: new Date().toISOString(),
    }, { onConflict: 'usuario_id,device_id' });
    if (error) throw error;
  }

  async remove(deviceRowId: string): Promise<void> {
    const { error } = await supabase.from('sesiones_dispositivo').delete().eq('id', deviceRowId);
    if (error) throw error;
  }

  async removeAllExcept(userId: string, deviceId: string): Promise<void> {
    const { error } = await supabase
      .from('sesiones_dispositivo')
      .delete()
      .eq('usuario_id', userId)
      .neq('device_id', deviceId);
    if (error) throw error;
  }
}
