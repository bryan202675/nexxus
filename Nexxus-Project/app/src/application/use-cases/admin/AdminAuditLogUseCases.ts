import { IAuditLogRepository } from '@/domain/repositories/IAuditLogRepository';
import { AuditLog } from '@/domain/entities/AuditLog';

export class AdminAuditLogUseCases {
  constructor(private auditLogRepository: IAuditLogRepository) {}

  async getLogs(empresaId: string, limit?: number): Promise<AuditLog[]> {
    return this.auditLogRepository.getLogs(empresaId, limit);
  }

  async logAction(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    return this.auditLogRepository.logAction(log);
  }

  subscribe(empresaId: string, limitCount: number, callback: (logs: AuditLog[]) => void): () => void {
    if (this.auditLogRepository.subscribeLogs) {
      return this.auditLogRepository.subscribeLogs(empresaId, limitCount, callback);
    }
    return () => {};
  }
}
