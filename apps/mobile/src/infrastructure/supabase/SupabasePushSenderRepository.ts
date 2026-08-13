import { supabase } from './supabaseClient';
import { IPushSenderRepository } from 'domain/repositories/IPushSenderRepository';

export class SupabasePushSenderRepository implements IPushSenderRepository {
  async send(userId: string, titulo: string, mensaje: string, data?: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: { userId, titulo, mensaje, data },
    });
    if (error) throw error;
  }
}
