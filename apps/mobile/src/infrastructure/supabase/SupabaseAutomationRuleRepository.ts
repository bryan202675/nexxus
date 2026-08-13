import { supabase } from './supabaseClient';
import { IAutomationRuleRepository } from 'domain/repositories/IAutomationRuleRepository';
import { AutomationRule, AutomationRunResult } from 'domain/entities/AutomationRule';

function mapRow(row: Record<string, any>): AutomationRule {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    nombre: row.nombre,
    descripcion: row.descripcion ?? undefined,
    triggerTipo: row.trigger_tipo,
    condiciones: row.condiciones || {},
    accionDestino: row.accion_destino,
    activa: row.activa,
    creadoPor: row.creado_por ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseAutomationRuleRepository implements IAutomationRuleRepository {
  async getByCompany(empresaId: string): Promise<AutomationRule[]> {
    const { data, error } = await supabase
      .from('automatizacion_reglas')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async create(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AutomationRule> {
    const { data, error } = await supabase
      .from('automatizacion_reglas')
      .insert({
        empresa_id: rule.empresaId,
        nombre: rule.nombre,
        descripcion: rule.descripcion || null,
        trigger_tipo: rule.triggerTipo,
        condiciones: rule.condiciones || {},
        accion_destino: rule.accionDestino,
        activa: rule.activa,
        creado_por: rule.creadoPor || null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapRow(data);
  }

  async setActive(id: string, activa: boolean): Promise<void> {
    const { error } = await supabase.from('automatizacion_reglas').update({ activa }).eq('id', id);
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('automatizacion_reglas').delete().eq('id', id);
    if (error) throw error;
  }

  async runNow(empresaId: string): Promise<AutomationRunResult[]> {
    const { data, error } = await supabase.functions.invoke('evaluate-automation-rules', {
      body: { empresaId },
    });
    if (error) throw error;
    return (data?.resultados || []) as AutomationRunResult[];
  }
}
