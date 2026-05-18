/**
 * Documentacion Nexxus - nexxus/app/src/domain/entities/index.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Firebase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

export { User } from './User';
export type { CheckIn, NuevaEntradaCheckIn } from './CheckIn';
export type { Payment } from './Payment';
export type { AuditLog } from './AuditLog';
export type { Announcement } from './Announcement';
export type { Department } from './Department';
export type { Task } from './Task';
export type { Notification } from './Notification';
