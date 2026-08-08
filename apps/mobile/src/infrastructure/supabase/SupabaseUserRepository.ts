import { supabase } from './supabaseClient';
import { IUserRepository } from 'domain/repositories/IUserRepository';
import { User } from 'domain/entities/User';
import { mapUserRow, userPatchToRow } from './mappers';
import { subscribeQuery } from './realtime';

export class SupabaseUserRepository implements IUserRepository {
  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase.from('usuarios').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return mapUserRow(data);
  }

  async update(id: string, data: Partial<User>): Promise<void> {
    const row = userPatchToRow(data);
    const { error } = await supabase.from('usuarios').update(row).eq('id', id);
    if (error) throw error;
  }

  async getAll(empresaId = ''): Promise<User[]> {
    if (!empresaId) return [];
    const { data, error } = await supabase.from('usuarios').select('*').eq('empresa_id', empresaId);
    if (error) throw error;
    return (data || []).map(mapUserRow);
  }

  async setActive(id: string, activo: boolean): Promise<void> {
    await this.update(id, { activo });
  }

  subscribeToAll(empresaId: string, callback: (users: User[]) => void): () => void {
    if (!empresaId) {
      callback([]);
      return () => {};
    }
    return subscribeQuery(
      'usuarios',
      `empresa_id=eq.${empresaId}`,
      async () => {
        const { data, error } = await supabase.from('usuarios').select('*').eq('empresa_id', empresaId);
        if (error) throw error;
        return (data || []).map(mapUserRow);
      },
      callback,
    );
  }
}
