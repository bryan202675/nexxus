import { describe, it, expect } from 'vitest';
import { calculatePayroll } from '../payrollPolicy';

describe('calculatePayroll', () => {
  it('calcula ISSS (3%, tope $30) y AFP (7.25%) sobre el salario bruto, sin renta cuando el gravable queda exento', () => {
    const resultado = calculatePayroll({ salarioBase: 500 });

    expect(resultado.salarioBruto).toBe(500);
    expect(resultado.isss).toBe(15); // 500 * 0.03
    expect(resultado.afp).toBe(36.25); // 500 * 0.0725
    expect(resultado.renta).toBe(0); // gravable 448.75 <= 472 exento
    expect(resultado.totalPagar).toBe(448.75);
  });

  it('aplica el tope de ISSS ($30) para salarios altos', () => {
    const resultado = calculatePayroll({ salarioBase: 3000 });

    expect(resultado.isss).toBe(30); // tope, no 3000*0.03=90
  });

  it('calcula la renta progresiva cuando el salario gravable cae en un tramo con retención', () => {
    const resultado = calculatePayroll({ salarioBase: 1000 });

    expect(resultado.isss).toBe(30);
    expect(resultado.afp).toBe(72.5);
    expect(resultado.renta).toBeCloseTo(60.45, 2);
    expect(resultado.totalPagar).toBeCloseTo(837.05, 2);
  });

  it('descuenta tardanzas proporcionalmente a los minutos tarde', () => {
    const base = calculatePayroll({ salarioBase: 500 });
    const conTardanza = calculatePayroll({ salarioBase: 500, minutosTarde: 30 });

    // (500 / 160 / 60) * 30 minutos
    expect(conTardanza.descuentoTardanzas).toBeCloseTo((500 / 160 / 60) * 30, 2);
    expect(conTardanza.totalPagar).toBeLessThan(base.totalPagar);
  });

  it('descuenta ausencias proporcionalmente a los días ausentes', () => {
    const resultado = calculatePayroll({ salarioBase: 900, diasAusencia: 2 });

    expect(resultado.descuentoAusencias).toBeCloseTo((900 / 30) * 2, 2);
  });

  it('suma horas extra al 150% usando el valor por hora explícito si se provee', () => {
    const conValorExplicito = calculatePayroll({ salarioBase: 500, horasExtra: 4, valorHoraExtra: 5 });
    const sinValorExplicito = calculatePayroll({ salarioBase: 500, horasExtra: 4 });

    // extra = horas * valorHora * 1.5
    expect(conValorExplicito.salarioBruto).toBeCloseTo(500 + 4 * 5 * 1.5, 2);
    // sin valor explícito, usa salarioBase / 160 como valor por hora
    expect(sinValorExplicito.salarioBruto).toBeCloseTo(500 + 4 * (500 / 160) * 1.5, 2);
  });

  it('nunca devuelve un total a pagar negativo, aunque los descuentos superen el bruto', () => {
    const resultado = calculatePayroll({ salarioBase: 100, descuentos: 10000 });

    expect(resultado.totalPagar).toBe(0);
  });
});
