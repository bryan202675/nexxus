/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/payments/SubscribePayments.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { Payment } from '@/domain/entities/Payment';

export class SubscribePayments {
  constructor(private repo: IPaymentRepository) {}

  execute(userId: string, empresaId: string | undefined, callback: (payments: Payment[]) => void): () => void {
    if (!this.repo.subscribeByUser) return () => {};
    return this.repo.subscribeByUser(userId, empresaId, callback);
  }
}
