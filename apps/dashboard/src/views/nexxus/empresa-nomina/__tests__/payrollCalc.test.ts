import { describe, it, expect } from 'vitest';
import { calcularRentaMensual, calculatePayroll } from '../payrollCalc';

// Puerto exacto de payrollPolicy.ts (ver packages/domain/services/payrollPolicy.ts).
// No "mejorar" ni redondear distinto sin verificar contra la tabla oficial de ISR.
describe('calcularRentaMensual (ISR mensual El Salvador)', () => {
  it('no retiene nada por debajo o igual al primer tramo exento ($472.00)', () => {
    expect(calcularRentaMensual(0)).toBe(0);
    expect(calcularRentaMensual(472.0)).toBe(0);
  });

  it('aplica el segundo tramo (10% + $17.67) justo por encima de $472.00', () => {
    expect(calcularRentaMensual(472.01)).toBeCloseTo(17.671, 2);
  });

  it('aplica el tercer tramo (20% + $60.00) por encima de $895.24', () => {
    expect(calcularRentaMensual(895.25)).toBeCloseTo(60.002, 2);
  });

  it('aplica el cuarto tramo (30% + $288.57) por encima de $2038.10', () => {
    expect(calcularRentaMensual(3000)).toBeCloseTo(577.14, 1);
  });
});

describe('calculatePayroll', () => {
  it('calcula ISSS (3%, tope $30) y AFP (7.25%) sobre el salario bruto', () => {
    const resultado = calculatePayroll({ salarioBase: 500 });

    expect(resultado.salarioBruto).toBe(500);
    expect(resultado.isss).toBe(15); // 500 * 0.03
    expect(resultado.afp).toBe(36.25); // 500 * 0.0725
    expect(resultado.renta).toBe(0); // gravable 448.75 <= 472 exento
  });

  it('aplica el tope de ISSS ($30) para salarios altos', () => {
    const resultado = calculatePayroll({ salarioBase: 3000 });

    expect(resultado.isss).toBe(30);
  });

  it('usa salarioBase / 160 como valor por hora extra cuando no se provee explícito', () => {
    const resultado = calculatePayroll({ salarioBase: 500, horasExtra: 4 });

    expect(resultado.valorHoraExtra).toBeCloseTo(500 / 160, 4);
    expect(resultado.salarioBruto).toBeCloseTo(500 + 4 * (500 / 160) * 1.5, 4);
  });

  it('respeta el valor por hora extra explícito cuando se provee', () => {
    const resultado = calculatePayroll({ salarioBase: 500, horasExtra: 4, valorHoraExtra: 5 });

    expect(resultado.valorHoraExtra).toBe(5);
    expect(resultado.salarioBruto).toBeCloseTo(500 + 4 * 5 * 1.5, 4);
  });

  it('descuenta tardanzas y ausencias proporcionalmente', () => {
    const resultado = calculatePayroll({ salarioBase: 900, minutosTarde: 30, diasAusencia: 1 });

    expect(resultado.descuentoTardanzas).toBeCloseTo((900 / 160 / 60) * 30, 4);
    expect(resultado.descuentoAusencias).toBeCloseTo(900 / 30, 4);
  });
});
