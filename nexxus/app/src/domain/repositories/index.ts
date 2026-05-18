/**
 * Documentacion Nexxus - nexxus/app/src/domain/repositories/index.ts
 * Capa: dominio.
 * Proposito: Contrato de repositorio. Describe las operaciones esperadas para persistencia sin imponer una implementacion concreta.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

export type { IAuthRepository } from './IAuthRepository';
export type { IUserRepository } from './IUserRepository';
export type { ICheckInRepository } from './ICheckInRepository';
export type { IAbsenceRepository } from './IAbsenceRepository';
export type { ITaskRepository } from './ITaskRepository';
export type { IAppointmentRepository } from './IAppointmentRepository';
export type { IPaymentRepository } from './IPaymentRepository';
export type { INotificationRepository } from './INotificationRepository';
export type { IDepartmentRepository } from './IDepartmentRepository';
export type { IAuditLogRepository } from './IAuditLogRepository';
export type { IAnnouncementRepository } from './IAnnouncementRepository';