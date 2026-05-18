import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { Payment } from '@/domain/entities/Payment';

// ── Cálculo de Renta ISR El Salvador (Tabla Mensual 2024) ──────────────
export function calcularRentaMensual(salarioGravable: number): number {
  let renta = 0;

  if (salarioGravable <= 472.00) {
    renta = 0;
  } else if (salarioGravable <= 895.24) {
    renta = (salarioGravable - 472.00) * 0.10 + 17.67;
  } else if (salarioGravable <= 2038.10) {
    renta = (salarioGravable - 895.24) * 0.20 + 60.00;
  } else {
    renta = (salarioGravable - 2038.10) * 0.30 + 288.57;
  }

  return Math.round(renta * 100) / 100;
}

// ── Cálculo completo de nómina El Salvador ───────────────────────────────
export function calcularNomina(params: {
  salario_base: number;
  horas_extra?: number;
  valor_hora?: number;
  bono?: number;
  comision?: number;
  descuentos_adicionales?: number;
}): {
  salario_bruto: number;
  isss: number;
  afp: number;
  renta: number;
  salario_neto: number;
} {
  const TASA_ISSS = 0.03;
  const TOPE_ISSS = 30.00; // Tope salarial de $1000 para ISSS en ES (30.00)
  const TASA_AFP = 0.0725;

  const extra = (params.horas_extra || 0) * (params.valor_hora || 0) * 1.5;
  const bruto = params.salario_base + extra + (params.bono || 0) + (params.comision || 0);
  
  const isss = Math.min(bruto * TASA_ISSS, TOPE_ISSS);
  const afp = bruto * TASA_AFP;
  
  // La renta se calcula sobre el ingreso gravable (Bruto - ISSS - AFP)
  const gravable = bruto - isss - afp;
  const renta = calcularRentaMensual(gravable);
  
  const neto = bruto - isss - afp - renta - (params.descuentos_adicionales || 0);

  return {
    salario_bruto: Math.round(bruto * 100) / 100,
    isss: Math.round(isss * 100) / 100,
    afp: Math.round(afp * 100) / 100,
    renta: Math.round(renta * 100) / 100,
    salario_neto: Math.round(Math.max(neto, 0) * 100) / 100,
  };
}

export class AdminPaymentUseCases {
  constructor(private paymentRepository: IPaymentRepository) {}

  async getAll(empresaId: string): Promise<Payment[]> {
    return this.paymentRepository.getAllPayments(empresaId);
  }

  async getByPeriod(empresaId: string, periodo: string): Promise<Payment[]> {
    return this.paymentRepository.getPaymentsByPeriod(empresaId, periodo);
  }

  async getHistory(empresaId: string): Promise<Payment[]> {
    return this.paymentRepository.getAllPaymentHistory(empresaId);
  }

  async generate(payments: Omit<Payment, 'id'>[]): Promise<void> {
    return this.paymentRepository.generatePayments(payments);
  }

  async createSingle(payment: Omit<Payment, 'id'>): Promise<string> {
    return this.paymentRepository.createPayment(payment);
  }

  async updateStatus(paymentId: string, estado: 'Pagado' | 'Procesando' | 'Pendiente'): Promise<void> {
    return this.paymentRepository.updatePaymentStatus(paymentId, estado);
  }

  async updatePayment(paymentId: string, data: Partial<Payment>): Promise<void> {
    return this.paymentRepository.updatePayment(paymentId, data);
  }

  async deletePayment(paymentId: string): Promise<void> {
    return this.paymentRepository.deletePayment(paymentId);
  }

  subscribeByPeriod(empresaId: string, periodo: string, callback: (payments: Payment[]) => void): () => void {
    if (this.paymentRepository.subscribeByPeriod) {
      return this.paymentRepository.subscribeByPeriod(empresaId, periodo, callback);
    }
    return () => {};
  }

  subscribeAll(empresaId: string, callback: (payments: Payment[]) => void): () => void {
    if (this.paymentRepository.subscribeAll) {
      return this.paymentRepository.subscribeAll(empresaId, callback);
    }
    return () => {};
  }
}
