/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/appointments/CreateAppointment.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */


// Importa { IAppointmentRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
/**
 * Implementa CreateAppointment; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class CreateAppointment { constructor(private repo: IAppointmentRepository) {} execute(appointment: any) { return this.repo.createAppointment(appointment); } }
