/**
 * Documentacion Nexxus - apps/mobile/src/application/use-cases/admin/AdminPaymentUseCases.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa { IPaymentRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IPaymentRepository } from '../../../repositories/IPaymentRepository';
// Importa { Payment }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Payment } from '../../../entities/Payment';

// ── Cálculo de Renta ISR El Salvador (Tabla Mensual 2024) ──────────────
export function calcularRentaMensual(salarioGravable: number): number {
  // Declara renta; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  let renta = 0;

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (salarioGravable <= 472.00) {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    renta = 0;
  } else if (salarioGravable <= 895.24) {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    renta = (salarioGravable - 472.00) * 0.10 + 17.67;
  } else if (salarioGravable <= 2038.10) {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    renta = (salarioGravable - 895.24) * 0.20 + 60.00;
  } else {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    renta = (salarioGravable - 2038.10) * 0.30 + 288.57;
  }

  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return Math.round(renta * 100) / 100;
}

/**
 * Implementa AdminPaymentUseCases; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class AdminPaymentUseCases {
  constructor(private paymentRepository: IPaymentRepository) {}

  // getAll ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async getAll(empresaId: string): Promise<Payment[]> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.paymentRepository.getAllPayments(empresaId);
  }

  // getByPeriod ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async getByPeriod(empresaId: string, periodo: string): Promise<Payment[]> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.paymentRepository.getPaymentsByPeriod(empresaId, periodo);
  }

  // getHistory ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async getHistory(empresaId: string): Promise<Payment[]> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.paymentRepository.getAllPaymentHistory(empresaId);
  }

  // generate ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async generate(payments: Omit<Payment, 'id'>[]): Promise<void> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.paymentRepository.generatePayments(payments);
  }

  // createSingle ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async createSingle(payment: Omit<Payment, 'id'>): Promise<string> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.paymentRepository.createPayment(payment);
  }

  // updateStatus ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async updateStatus(paymentId: string, estado: 'Pagado' | 'Procesando' | 'Pendiente'): Promise<void> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.paymentRepository.updatePaymentStatus(paymentId, estado);
  }

  // updatePayment ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async updatePayment(paymentId: string, data: Partial<Payment>): Promise<void> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.paymentRepository.updatePayment(paymentId, data);
  }

  // deletePayment ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async deletePayment(paymentId: string): Promise<void> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.paymentRepository.deletePayment(paymentId);
  }

  // subscribeByPeriod ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  subscribeByPeriod(empresaId: string, periodo: string, callback: (payments: Payment[]) => void): () => void {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (this.paymentRepository.subscribeByPeriod) {
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return this.paymentRepository.subscribeByPeriod(empresaId, periodo, callback);
    }
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {};
  }

  // subscribeAll ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  subscribeAll(empresaId: string, callback: (payments: Payment[]) => void): () => void {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (this.paymentRepository.subscribeAll) {
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return this.paymentRepository.subscribeAll(empresaId, callback);
    }
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {};
  }
}
