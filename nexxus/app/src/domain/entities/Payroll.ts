/**
 * Documentacion Nexxus - nexxus/app/src/domain/entities/Payroll.ts
 * Capa: dominio.
 * Proposito: Contrato canonico de nomina generado desde salario, asistencia y compensaciones.
 * Dependencias clave: sin dependencias externas.
 * Consideracion de mantenimiento: `payments` queda como espejo legacy; `nominas` es el modelo expandido.
 */

export type PayrollStatus = 'pendiente' | 'revisado' | 'pagado';

export interface PayrollRecord {
  id: string;
  empresaId: string;
  empleadoId: string;
  empleadoNombre: string;
  periodo: string;
  salarioBase: number;
  bonos: number;
  comisiones: number;
  descuentos: number;
  horasExtra: number;
  valorHoraExtra: number;
  descuentoTardanzas: number;
  descuentoAusencias: number;
  salarioBruto: number;
  isss: number;
  afp: number;
  renta: number;
  totalPagar: number;
  estado: PayrollStatus;
  creadoPor: string;
  creadoPorNombre: string;
  aprobadoPor?: string;
  aprobadoPorNombre?: string;
  fechaAprobacion?: string | null;
  createdAt: string;
  updatedAt: string;
  legacyPaymentId?: string;
}

export interface PayrollCalculationInput {
  salarioBase: number;
  bonos?: number;
  comisiones?: number;
  descuentos?: number;
  horasExtra?: number;
  valorHoraExtra?: number;
  minutosTarde?: number;
  diasAusencia?: number;
}

export interface PayrollCalculationResult {
  salarioBruto: number;
  isss: number;
  afp: number;
  renta: number;
  descuentoTardanzas: number;
  descuentoAusencias: number;
  totalPagar: number;
}
