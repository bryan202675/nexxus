import { Payment } from '../entities/Payment';

export interface IPaymentRepository {
  getPaymentsByUser(userId: string): Promise<Payment[]>;
  
  // Admin functions
  getAllPayments(empresaId: string): Promise<Payment[]>;
  getPaymentsByPeriod(empresaId: string, periodo: string): Promise<Payment[]>;
  generatePayments(payments: Omit<Payment, 'id'>[]): Promise<void>;
  updatePaymentStatus(paymentId: string, estado: 'Pagado' | 'Procesando' | 'Pendiente'): Promise<void>;
  subscribeByPeriod?(empresaId: string, periodo: string, callback: (payments: Payment[]) => void): () => void;
}
