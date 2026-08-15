import { supabase } from './supabaseClient';
import { IAchievementRepository } from 'domain/repositories/IAchievementRepository';
import { EarnedAchievement } from 'domain/entities/Achievement';

export class SupabaseAchievementRepository implements IAchievementRepository {
  async getEarned(usuarioId: string): Promise<EarnedAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('logros_usuario')
        .select('codigo_logro, fecha_obtenida')
        .eq('usuario_id', usuarioId);
      if (error) {
        console.warn('[AchievementRepository] getEarned aviso:', error.message);
        return [];
      }
      return (data || []).map((row: any) => ({ codigoLogro: row.codigo_logro, fechaObtenida: row.fecha_obtenida }));
    } catch (e) {
      console.warn('[AchievementRepository] getEarned exception:', e);
      return [];
    }
  }

  async syncEligible(): Promise<string[]> {
    try {
      const { data, error } = await supabase.rpc('sincronizar_logros_elegibles');
      if (error) {
        // En caso de que la función no esté disponible o el schema cache no la encuentre (PGRST202)
        console.warn('[AchievementRepository] syncEligible aviso RPC:', error.message);
        return [];
      }
      return (data || []) as string[];
    } catch (e) {
      console.warn('[AchievementRepository] syncEligible exception:', e);
      return [];
    }
  }
}
