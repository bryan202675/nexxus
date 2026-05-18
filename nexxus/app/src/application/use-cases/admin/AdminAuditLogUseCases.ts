/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/admin/AdminAuditLogUseCases.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { IAuditLogRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAuditLogRepository } from '@/domain/repositories/IAuditLogRepository';
// Importa { AuditLog }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { AuditLog } from '@/domain/entities/AuditLog';

/**
 * Implementa AdminAuditLogUseCases; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class AdminAuditLogUseCases {
  constructor(private auditLogRepository: IAuditLogRepository) {}

  // getLogs ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async getLogs(empresaId: string, limit?: number): Promise<AuditLog[]> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.auditLogRepository.getLogs(empresaId, limit);
  }

  // logAction ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async logAction(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.auditLogRepository.logAction(log);
  }

  // subscribe ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  subscribe(empresaId: string, limitCount: number, callback: (logs: AuditLog[]) => void): () => void {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (this.auditLogRepository.subscribeLogs) {
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return this.auditLogRepository.subscribeLogs(empresaId, limitCount, callback);
    }
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {};
  }
}
