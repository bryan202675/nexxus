/**
 * Documentacion Nexxus - apps/mobile/src/application/use-cases/notifications/MarkNotificationRead.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */


// Importa { INotificationRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { INotificationRepository } from '../../../repositories/INotificationRepository';
/**
 * Implementa MarkNotificationRead; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class MarkNotificationRead { constructor(private repo: INotificationRepository) {} execute(notificationId: string) { return this.repo.markAsRead(notificationId); } }
