import { describe, it, expect } from 'vitest';
import { calcularRentaMensual } from '../AdminPaymentUseCases';

// Tabla progresiva de ISR mensual de El Salvador. No "mejorar" ni redondear
// distinto sin verificar contra la tabla oficial vigente — ver payrollPolicy.ts.
describe('calcularRentaMensual (ISR mensual El Salvador)', () => {
  it('no retiene nada por debajo o igual al primer tramo exento ($472.00)', () => {
    expect(calcularRentaMensual(0)).toBe(0);
    expect(calcularRentaMensual(300)).toBe(0);
    expect(calcularRentaMensual(472.0)).toBe(0);
  });

  it('aplica el segundo tramo (10% + $17.67) justo por encima de $472.00', () => {
    expect(calcularRentaMensual(472.01)).toBeCloseTo(17.67, 2);
  });

  it('en el límite superior del segundo tramo ($895.24) sigue usando la fórmula del 10%', () => {
    expect(calcularRentaMensual(895.24)).toBeCloseTo(59.99, 2);
  });

  it('aplica el tercer tramo (20% + $60.00) justo por encima de $895.24', () => {
    expect(calcularRentaMensual(895.25)).toBeCloseTo(60.0, 2);
  });

  it('en el límite superior del tercer tramo ($2038.10) sigue usando la fórmula del 20%', () => {
    expect(calcularRentaMensual(2038.1)).toBeCloseTo(288.57, 2);
  });

  it('aplica el cuarto tramo (30% + $288.57) por encima de $2038.10', () => {
    expect(calcularRentaMensual(2038.11)).toBeCloseTo(288.57, 2);
    expect(calcularRentaMensual(3000)).toBeCloseTo(577.14, 2);
  });
});
