import { supabase } from './supabaseClient';
import { IAuditLogRepository } from 'domain/repositories/IAuditLogRepository';
import { AuditLog } from 'domain/entities/AuditLog';
import { subscribeQuery } from './realtime';

// audit_logs no tiene columna de estado/severidad ni "datos" jsonb -- row.datos?.estado siempre
// era undefined y el "?? 'Success'" fabricaba un valor fijo. AuditoriaLogs.tsx ya trata "sin
// estado" como éxito para las tarjetas/filtros (l.estado === 'Success' || !l.estado), así que
// devolver undefined no cambia lo que se ve -- pero deja de mentir con un literal 'Success' donde
// cualquier código que lea `estado` directamente asumiría que hubo una señal real registrada.
// Mismo criterio que mapAudit en apps/dashboard/.../superAdminRepository.ts.
function mapRow(row: Record<string, any>): AuditLog {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    timestamp: row.created_at,
    usuarioId: row.actor_id ?? '',
    usuarioNombre: '',
    accion: row.accion,
    modulo: row.modulo ?? '',
    detalles: row.detalles ?? '',
    estado: undefined,
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
