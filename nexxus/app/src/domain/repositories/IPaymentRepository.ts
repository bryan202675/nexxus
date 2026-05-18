import { Payment } from '../entities/Payment';

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
}
