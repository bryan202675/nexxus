import { supabase } from './supabaseClient';
import { IAuditLogRepository } from 'domain/repositories/IAuditLogRepository';
import { AuditLog } from 'domain/entities/AuditLog';
import { subscribeQuery } from './realtime';

function mapRow(row: Record<string, any>): AuditLog {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    timestamp: row.created_at,
    usuarioId: row.actor_id ?? '',
    usuarioNombre: row.datos?.usuarioNombre ?? '',
    accion: row.accion,
    modulo: row.modulo ?? '',
    detalles: row.detalles ?? '',
    estado: row.datos?.estado ?? 'Success',
  };
}

export class SupabaseAuditLogRepository implements IAuditLogRepository {
  async getLogs(empresaId: string, limit = 50): Promise<AuditLog[]> {
    const { data, error } = await supabase.from('audit_logs').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async logAction(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const { error } = await supabase.from('audit_logs').insert({
      empresa_id: log.empresaId,
      actor_id: log.usuarioId || null,
      accion: log.accion,
      modulo: log.modulo,
      detalles: log.detalles,
    });
    if (error) throw error;
  }

  subscribeLogs(empresaId: string, limitCount: number, callback: (logs: AuditLog[]) => void): () => void {
    return subscribeQuery('audit_logs', `empresa_id=eq.${empresaId}`, () => this.getLogs(empresaId, limitCount), callback);
  }
}
