import { supabase } from './supabaseClient';
import { IPushTokenRepository } from 'domain/repositories/IPushTokenRepository';
import { PushToken, PushPlatform } from 'domain/entities/PushToken';

function mapRow(row: Record<string, any>): PushToken {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    token: row.token,
    plataforma: row.plataforma ?? undefined,
    createdAt: row.created_at,
  };
}

export class SupabasePushTokenRepository implements IPushTokenRepository {
  async register(usuarioId: string, token: string, plataforma?: PushPlatform): Promise<void> {
    // (usuario_id, token) es unique en la tabla -- upsert para que registrar el mismo token dos
    // veces (p.ej. cada vez que abre la app) no falle ni duplique filas.
    const { error } = await supabase
      .from('push_tokens')
      .upsert({ usuario_id: usuarioId, token, plataforma }, { onConflict: 'usuario_id,token' });
    if (error) throw error;
  }

  async unregister(token: string): Promise<void> {
    const { error } = await supabase.from('push_tokens').delete().eq('token', token);
    if (error) throw error;
  }

  async getByUser(usuarioId: string): Promise<PushToken[]> {
    const { data, error } = await supabase.from('push_tokens').select('*').eq('usuario_id', usuarioId);
    if (error) throw error;
    return (data || []).map(mapRow);
  }
}
