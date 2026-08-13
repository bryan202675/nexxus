import { supabase } from './supabaseClient';
import { INotificationRepository } from 'domain/repositories/INotificationRepository';
import { Notification } from 'domain/entities/Notification';
import { subscribeQuery } from './realtime';

function mapRow(row: Record<string, any>): Notification {
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    empresaId: row.empresa_id,
    titulo: row.titulo,
    mensaje: row.cuerpo ?? '',
    tipo: row.tipo ?? 'info',
    leida: row.leida,
    fecha: row.created_at,
  };
}

export class SupabaseNotificationRepository implements INotificationRepository {
  async getNotificationsByUser(userId: string, empresaId?: string, limit = 30): Promise<Notification[]> {
    let query = supabase.from('notificaciones').select('*').eq('usuario_id', userId).order('created_at', { ascending: false }).limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  subscribeNotificationsByUser(userId: string, empresaId: string | undefined, callback: (notifications: Notification[]) => void, limit = 30): () => void {
    return subscribeQuery(
      'notificaciones',
      `usuario_id=eq.${userId}`,
      () => this.getNotificationsByUser(userId, empresaId, limit),
      callback,
    );
  }

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase.from('notificaciones').update({ leida: true, fecha_lectura: new Date().toISOString() }).eq('id', notificationId);
    if (error) throw error;
  }
}
