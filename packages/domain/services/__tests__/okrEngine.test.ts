import { describe, it, expect } from 'vitest';
import { calcularProgresoKR, calcularProgresoObjetivo, cicloActual, listaCiclos, ordenarObjetivosPorProgreso } from '../okrEngine';
import { Objective } from '../../entities/Objective';

describe('calcularProgresoKR', () => {
  it('calcula el porcentaje simple', () => {
    expect(calcularProgresoKR({ valorActual: 5, valorObjetivo: 10 })).toBe(50);
  });

  it('nunca excede 100 aunque el valor actual supere el objetivo', () => {
    expect(calcularProgresoKR({ valorActual: 15, valorObjetivo: 10 })).toBe(100);
  });

  it('nunca es negativo con valores negativos', () => {
    expect(calcularProgresoKR({ valorActual: -5, valorObjetivo: 10 })).toBe(0);
  });

  it('devuelve 0 si el valor objetivo es 0 o negativo (evita division por cero)', () => {
    expect(calcularProgresoKR({ valorActual: 5, valorObjetivo: 0 })).toBe(0);
  });
});

describe('calcularProgresoObjetivo', () => {
  it('devuelve 0 sin resultados clave', () => {
    expect(calcularProgresoObjetivo([])).toBe(0);
  });

  it('promedia el progreso de todos los KR', () => {
    const krs = [
      { valorActual: 10, valorObjetivo: 10 }, // 100
      { valorActual: 0, valorObjetivo: 10 },  // 0
    ];
    expect(calcularProgresoObjetivo(krs)).toBe(50);
  });
});

describe('cicloActual', () => {
  it('calcula el trimestre correcto', () => {
    expect(cicloActual(new Date('2026-01-15T00:00:00Z'))).toBe('2026-Q1');
    expect(cicloActual(new Date('2026-04-01T00:00:00Z'))).toBe('2026-Q2');
    expect(cicloActual(new Date('2026-09-30T00:00:00Z'))).toBe('2026-Q3');
    expect(cicloActual(new Date('2026-12-31T00:00:00Z'))).toBe('2026-Q4');
  });
});

describe('listaCiclos', () => {
  it('genera ciclos hacia atras cruzando el limite de año', () => {
    const ciclos = listaCiclos(4, new Date('2026-02-01T00:00:00Z'));
    expect(ciclos).toEqual(['2026-Q1', '2025-Q4', '2025-Q3', '2025-Q2']);
  });
});

describe('ordenarObjetivosPorProgreso', () => {
  it('ordena de mayor a menor progreso calculado', () => {
    const base = { empresaId: 'e', usuarioId: 'u', creadoPor: 'u', descripcion: '', ciclo: '2026-Q1', estado: 'activo' as const, createdAt: '' };
    const objetivos: Objective[] = [
      { ...base, id: '1', titulo: 'Bajo', keyResults: [{ id: 'k1', objectiveId: '1', titulo: 'kr', valorActual: 1, valorObjetivo: 10, unidad: 'u' }] },
      { ...base, id: '2', titulo: 'Alto', keyResults: [{ id: 'k2', objectiveId: '2', titulo: 'kr', valorActual: 9, valorObjetivo: 10, unidad: 'u' }] },
    ];
    const ordenados = ordenarObjetivosPorProgreso(objetivos);
    expect(ordenados[0].titulo).toBe('Alto');
    expect(ordenados[1].titulo).toBe('Bajo');
  });
});
