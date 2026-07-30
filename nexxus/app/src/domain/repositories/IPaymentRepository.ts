/**
 * Documentacion Nexxus - nexxus/app/src/domain/repositories/IPaymentRepository.ts
 * Capa: dominio.
 * Proposito: Contrato de repositorio. Describe las operaciones esperadas para persistencia sin imponer una implementacion concreta.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { Payment }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { Payment } from '../entities/Payment';

/**
 * Define el contrato de datos IPaymentRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IPaymentRepository {
  getPaymentsByUser(userId: string, empresaId?: string): Promise<Payment[]>;

  // Admin functions
  getAllPayments(empresaId: string): Promise<Payment[]>;
  getPaymentsByPeriod(empresaId: string, periodo: string): Promise<Payment[]>;
  generatePayments(payments: Omit<Payment, 'id'>[]): Promise<void>;
  createPayment(payment: Omit<Payment, 'id'>): Promise<string>;
  updatePayment(paymentId: string, data: Partial<Payment>): Promise<void>;
  updatePaymentStatus(paymentId: string, estado: 'Pagado' | 'Procesando' | 'Pendiente'): Promise<void>;
  deletePayment(paymentId: string): Promise<void>;
  getAllPaymentHistory(empresaId: string): Promise<Payment[]>;
  subscribeByPeriod?(empresaId: string, periodo: string, callback: (payments: Payment[]) => void): () => void;
  subscribeAll?(empresaId: string, callback: (payments: Payment[]) => void): () => void;
  subscribeByUser?(userId: string, empresaId: string | undefined, callback: (payments: Payment[]) => void): () => void;
}
