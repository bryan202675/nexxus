import { describe, it, expect } from 'vitest';
import { calcularDiasVacacionesDisponibles } from '../vacationEngine';
import { Absence } from '../../entities/Absence';

function solicitud(overrides: Partial<Absence> = {}): Pick<Absence, 'tipo' | 'estado' | 'fecha_inicio' | 'fecha_fin'> {
  return {
    tipo: 'vacaciones',
    estado: 'aprobada',
    fecha_inicio: '2026-01-01',
    fecha_fin: '2026-01-01',
    ...overrides,
  };
}

describe('calcularDiasVacacionesDisponibles', () => {
  it('devuelve 0 sin fecha de ingreso', () => {
    expect(calcularDiasVacacionesDisponibles(null, [], new Date('2026-06-01'))).toBe(0);
  });

  it('devuelve 0 el primer dia de trabajo', () => {
    const ahora = new Date('2026-01-01T00:00:00Z');
    expect(calcularDiasVacacionesDisponibles('2026-01-01T00:00:00Z', [], ahora)).toBe(0);
  });

  it('calcula proporcional con menos de un ano de antiguedad', () => {
    // 182 dias de antiguedad (~medio ano) -> ~7 dias (15 * 182/365 = 7.47 -> floor 7)
    const ahora = new Date('2026-07-02T00:00:00Z');
    expect(calcularDiasVacacionesDisponibles('2026-01-01T00:00:00Z', [], ahora)).toBe(7);
  });

  it('resta dias ya tomados dentro del periodo proporcional', () => {
    const ahora = new Date('2026-07-02T00:00:00Z');
    const solicitudes = [solicitud({ fecha_inicio: '2026-03-01', fecha_fin: '2026-03-05' })]; // 5 dias
    expect(calcularDiasVacacionesDisponibles('2026-01-01T00:00:00Z', solicitudes, ahora)).toBe(2);
  });

  it('otorga 15 dias completos al cumplir un ano exacto', () => {
    const ahora = new Date('2027-01-01T00:00:00Z');
    expect(calcularDiasVacacionesDisponibles('2026-01-01T00:00:00Z', [], ahora)).toBe(15);
  });

  it('no cuenta vacaciones tomadas en el periodo de aniversario anterior', () => {
    const ahora = new Date('2027-06-01T00:00:00Z');
    const solicitudTomadaAnioPasado = solicitud({ fecha_inicio: '2026-06-01', fecha_fin: '2026-06-10' }); // periodo anterior
    expect(calcularDiasVacacionesDisponibles('2026-01-01T00:00:00Z', [solicitudTomadaAnioPasado], ahora)).toBe(15);
  });

  it('resta vacaciones tomadas en el periodo de aniversario actual', () => {
    const ahora = new Date('2027-06-01T00:00:00Z');
    const solicitudEsteAnio = solicitud({ fecha_inicio: '2027-02-01', fecha_fin: '2027-02-10' }); // 10 dias, dentro del periodo iniciado 2027-01-01
    expect(calcularDiasVacacionesDisponibles('2026-01-01T00:00:00Z', [solicitudEsteAnio], ahora)).toBe(5);
  });

  it('ignora solicitudes pendientes o rechazadas', () => {
    const ahora = new Date('2027-01-01T00:00:00Z');
    const pendiente = solicitud({ estado: 'pendiente', fecha_inicio: '2026-06-01', fecha_fin: '2026-06-10' });
    expect(calcularDiasVacacionesDisponibles('2026-01-01T00:00:00Z', [pendiente], ahora)).toBe(15);
  });

  it('nunca devuelve un numero negativo aunque se tomen mas dias de los disponibles', () => {
    const ahora = new Date('2027-06-01T00:00:00Z');
    const excedido = solicitud({ fecha_inicio: '2027-01-05', fecha_fin: '2027-02-05' }); // 32 dias, dentro del periodo actual
    expect(calcularDiasVacacionesDisponibles('2026-01-01T00:00:00Z', [excedido], ahora)).toBe(0);
  });
});
