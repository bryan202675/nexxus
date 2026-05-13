import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { Payment } from '@/domain/entities/Payment';

export class AdminPaymentUseCases {
  constructor(private paymentRepository: IPaymentRepository) {}

  async getAll(empresaId: string): Promise<Payment[]> {
    return this.paymentRepository.getAllPayments(empresaId);
  }

  async getByPeriod(empresaId: string, periodo: string): Promise<Payment[]> {
    return this.paymentRepository.getPaymentsByPeriod(empresaId, periodo);
  }

  async generate(payments: Omit<Payment, 'id'>[]): Promise<void> {
    return this.paymentRepository.generatePayments(payments);
  }

  async updateStatus(paymentId: string, estado: 'Pagado' | 'Procesando' | 'Pendiente'): Promise<void> {
    return this.paymentRepository.updatePaymentStatus(paymentId, estado);
  }

  subscribeByPeriod(empresaId: string, periodo: string, callback: (payments: Payment[]) => void): () => void {
    if (this.paymentRepository.subscribeByPeriod) {
      return this.paymentRepository.subscribeByPeriod(empresaId, periodo, callback);
    }
    return () => {};
  }
}
