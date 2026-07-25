import { PayrollCalculationInput, PayrollCalculationResult } from '@/domain/entities/Payroll';
import { calcularRentaMensual } from '@/application/use-cases/admin/AdminPaymentUseCases';

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export const calculatePayroll = (input: PayrollCalculationInput): PayrollCalculationResult => {
  const salarioBase = Number(input.salarioBase) || 0;
  const bonos = Number(input.bonos) || 0;
  const comisiones = Number(input.comisiones) || 0;
  const descuentos = Number(input.descuentos) || 0;
  const horasExtra = Number(input.horasExtra) || 0;
  const valorHoraExtra = Number(input.valorHoraExtra) || (salarioBase > 0 ? salarioBase / 160 : 0);
  const minutosTarde = Number(input.minutosTarde) || 0;
  const diasAusencia = Number(input.diasAusencia) || 0;
  const descuentoTardanzas = (salarioBase / 160 / 60) * minutosTarde;
  const descuentoAusencias = (salarioBase / 30) * diasAusencia;
  const extra = horasExtra * valorHoraExtra * 1.5;
  const salarioBruto = salarioBase + bonos + comisiones + extra;
  const isss = Math.min(salarioBruto * 0.03, 30);
  const afp = salarioBruto * 0.0725;
  const renta = calcularRentaMensual(salarioBruto - isss - afp);
  const totalPagar = salarioBruto - isss - afp - renta - descuentos - descuentoTardanzas - descuentoAusencias;

  return {
    salarioBruto: roundMoney(salarioBruto),
    isss: roundMoney(isss),
    afp: roundMoney(afp),
    renta: roundMoney(renta),
    descuentoTardanzas: roundMoney(descuentoTardanzas),
    descuentoAusencias: roundMoney(descuentoAusencias),
    totalPagar: roundMoney(Math.max(totalPagar, 0)),
  };
};
