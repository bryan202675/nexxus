import { supabase } from './supabaseClient';
import { IInboxRepository } from 'domain/repositories/IInboxRepository';
import { InboxItem } from 'domain/entities/Inbox';
import { subscribeQuery } from './realtime';

function mapRow(row: Record<string, any>): InboxItem {
  return {
    id: row.id,
    userId: row.usuario_id,
    empresaId: row.empresa_id,
    origenRefId: row.contenido?.origenRefId ?? '',
    tipo: row.origen,
    prioridad: row.contenido?.prioridad ?? 'normal',
    estado: row.contenido?.estado ?? 'pendiente',
    titulo: row.contenido?.titulo ?? '',
    mensaje: row.contenido?.mensaje ?? '',
    timestamp: row.created_at,
  };
}

export class SupabaseInboxRepository implements IInboxRepository {
  async getByUser(userId: string): Promise<InboxItem[]> {
    const { data, error } = await supabase.from('inbox_unificado').select('*').eq('usuario_id', userId);
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async resolveItem(itemId: string): Promise<void> {
    const { data: current } = await supabase.from('inbox_unificado').select('contenido').eq('id', itemId).maybeSingle();
    const { error } = await supabase.from('inbox_unificado').update({
      contenido: { ...(current?.contenido || {}), estado: 'resuelto' },
    }).eq('id', itemId);
    if (error) throw error;
  }

  async addItem(item: Omit<InboxItem, 'id' | 'timestamp'>): Promise<InboxItem> {
    const { data, error } = await supabase.from('inbox_unificado').insert({
      usuario_id: item.userId,
      empresa_id: item.empresaId,
      origen: item.tipo,
      contenido: { origenRefId: item.origenRefId, prioridad: item.prioridad, estado: item.estado, titulo: item.titulo, mensaje: item.mensaje },
    }).select('*').single();
    if (error) throw error;
    return mapRow(data);
  }

  subscribeToInbox(userId: string, callback: (items: InboxItem[]) => void): () => void {
    return subscribeQuery('inbox_unificado', `usuario_id=eq.${userId}`, () => this.getByUser(userId), callback);
  }
}
