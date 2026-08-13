import { PayrollRecord, PayrollStatus } from '../../../entities/Payroll';
import { IPayrollRepository } from '../../../repositories/IPayrollRepository';

export class AdminPayrollUseCases {
  constructor(private payrollRepository: IPayrollRepository) {}

  getByPeriod(empresaId: string, periodo: string): Promise<PayrollRecord[]> {
    return this.payrollRepository.getByPeriod(empresaId, periodo);
  }

  subscribeByPeriod(
    empresaId: string,
    periodo: string,
    callback: (records: PayrollRecord[]) => void,
    onError: (error: Error) => void
  ): () => void {
    return this.payrollRepository.subscribeByPeriod(empresaId, periodo, callback, onError);
  }

  generateForPeriod(params: { empresaId: string; periodo: string; actorId: string; actorName: string }): Promise<number> {
    return this.payrollRepository.generateForPeriod(params);
  }

  updateStatus(payrollId: string, estado: PayrollStatus, actor: { id: string; nombre: string }): Promise<void> {
    return this.payrollRepository.updateStatus(payrollId, estado, actor);
  }

  approveAllForPeriod(params: { empresaId: string; periodo: string; actorId: string; actorName: string; actorRole?: string }): Promise<number> {
    return this.payrollRepository.approveAllForPeriod(params);
  }
}
