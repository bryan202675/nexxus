/**
 * Documentacion Nexxus - apps/mobile/src/domain/repositories/IAuditLogRepository.ts
 * Capa: dominio.
 * Proposito: Contrato de repositorio. Describe las operaciones esperadas para persistencia sin imponer una implementacion concreta.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa { AuditLog }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { AuditLog } from '../entities/AuditLog';

/**
 * Define el contrato de datos IAuditLogRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IAuditLogRepository {
  getLogs(empresaId: string, limit?: number): Promise<AuditLog[]>;
  logAction(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void>;
  subscribeLogs?(empresaId: string, limitCount: number, callback: (logs: AuditLog[]) => void): () => void;
}
