import { AuditLog } from '../entities/AuditLog';

export interface IAuditLogRepository {
  getLogs(empresaId: string, limit?: number): Promise<AuditLog[]>;
  logAction(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void>;
  subscribeLogs?(empresaId: string, limitCount: number, callback: (logs: AuditLog[]) => void): () => void;
}
