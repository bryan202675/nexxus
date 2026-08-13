import { supabase } from './supabaseClient';
import { IPlanRepository } from 'domain/repositories/IPlanRepository';
import { PlanCatalogEntry, PlanFeatureFlags, PlanLimits } from 'domain/entities/Plan';

export class SupabasePlanRepository implements IPlanRepository {
  async getAll(): Promise<PlanCatalogEntry[]> {
    const { data, error } = await supabase.from('planes').select('nombre, precio, limites');
    if (error) throw error;
    return (data || []).map((row: any): PlanCatalogEntry => ({
      name: row.nombre,
      monthly: Number(row.precio) || 0,
      annual: Number(row.limites?.annual) || 0,
      description: row.limites?.description || '',
      limits: (row.limites?.limits || {}) as PlanLimits,
      features: (row.limites?.features || {}) as PlanFeatureFlags,
    }));
  }
}
