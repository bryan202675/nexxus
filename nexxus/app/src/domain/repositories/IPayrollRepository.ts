import { PayrollRecord, PayrollStatus } from '@/domain/entities/Payroll';

export interface IPayrollRepository {
  getByPeriod(empresaId: string, periodo: string): Promise<PayrollRecord[]>;
  subscribeByPeriod(empresaId: string, periodo: string, callback: (records: PayrollRecord[]) => void, onError: (error: Error) => void): () => void;
  generateForPeriod(params: { empresaId: string; periodo: string; actorId: string; actorName: string }): Promise<number>;
  updateStatus(payrollId: string, estado: PayrollStatus, actor: { id: string; nombre: string }): Promise<void>;
  approveAllForPeriod(params: { empresaId: string; periodo: string; actorId: string; actorName: string; actorRole?: string }): Promise<number>;
}
