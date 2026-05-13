
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
export class GetPayments { constructor(private repo: IPaymentRepository) {} execute(userId: string) { return this.repo.getPaymentsByUser(userId); } }
