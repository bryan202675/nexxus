/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/notifications/GetNotifications.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */


// Importa { INotificationRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
/**
 * Implementa GetNotifications; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class GetNotifications {
  constructor(private repo: INotificationRepository) {}

  execute(userId: string, empresaId?: string, limit?: number) {
    return this.repo.getNotificationsByUser(userId, empresaId, limit);
  }
}
