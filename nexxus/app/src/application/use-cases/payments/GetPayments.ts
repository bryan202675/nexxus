/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/payments/GetPayments.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */


// Importa { IPaymentRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
/**
 * Implementa GetPayments; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class GetPayments { constructor(private repo: IPaymentRepository) {} execute(userId: string) { return this.repo.getPaymentsByUser(userId); } }
