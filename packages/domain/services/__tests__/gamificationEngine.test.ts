import { describe, it, expect } from 'vitest';
import { calcularPuntos, calcularProgresoLogros, detectarLogrosNuevos, siguienteLogro, CATALOGO_LOGROS } from '../gamificationEngine';

describe('calcularPuntos', () => {
  it('devuelve 0 sin actividad', () => {
    expect(calcularPuntos({ tareasCompletadas: 0, rachaCheckIn: 0, cursosCompletados: 0 })).toBe(0);
  });

  it('suma los 3 componentes con sus pesos', () => {
    // 3 tareas*10 + 5 racha*2 + 1 curso*25 = 30 + 10 + 25 = 65
    expect(calcularPuntos({ tareasCompletadas: 3, rachaCheckIn: 5, cursosCompletados: 1 })).toBe(65);
  });
});

describe('calcularProgresoLogros', () => {
  it('marca obtenido solo lo que esta en la lista de obtenidos, con su fecha', () => {
    const entrada = { tareasCompletadas: 12, rachaCheckIn: 3, cursosCompletados: 0 };
    const obtenidos = [{ codigoLogro: 'tareas_10', fechaObtenida: '2026-01-01T00:00:00Z' }];
    const progresos = calcularProgresoLogros(entrada, obtenidos);
    const tareas10 = progresos.find((p) => p.id === 'tareas_10')!;
    expect(tareas10.obtenido).toBe(true);
    expect(tareas10.fechaObtenida).toBe('2026-01-01T00:00:00Z');
    const tareas50 = progresos.find((p) => p.id === 'tareas_50')!;
    expect(tareas50.obtenido).toBe(false);
  });

  it('el progreso nunca excede el umbral aunque el dato real lo supere', () => {
    const entrada = { tareasCompletadas: 200, rachaCheckIn: 0, cursosCompletados: 0 };
    const progresos = calcularProgresoLogros(entrada, []);
    const tareas10 = progresos.find((p) => p.id === 'tareas_10')!;
    expect(tareas10.progreso).toBe(10);
  });

  it('devuelve todo el catalogo', () => {
    const progresos = calcularProgresoLogros({ tareasCompletadas: 0, rachaCheckIn: 0, cursosCompletados: 0 }, []);
    expect(progresos.length).toBe(CATALOGO_LOGROS.length);
  });
});

describe('detectarLogrosNuevos', () => {
  it('detecta logros recien cruzados que no estan en obtenidos', () => {
    const entrada = { tareasCompletadas: 10, rachaCheckIn: 7, cursosCompletados: 0 };
    const nuevos = detectarLogrosNuevos(entrada, []);
    expect(nuevos).toContain('tareas_10');
    expect(nuevos).toContain('racha_7');
    expect(nuevos).not.toContain('tareas_50');
  });

  it('no vuelve a reportar un logro ya obtenido', () => {
    const entrada = { tareasCompletadas: 10, rachaCheckIn: 0, cursosCompletados: 0 };
    const obtenidos = [{ codigoLogro: 'tareas_10', fechaObtenida: '2026-01-01T00:00:00Z' }];
    expect(detectarLogrosNuevos(entrada, obtenidos)).not.toContain('tareas_10');
  });
});

describe('siguienteLogro', () => {
  it('devuelve el pendiente mas cercano a cumplirse', () => {
    const entrada = { tareasCompletadas: 9, rachaCheckIn: 1, cursosCompletados: 0 };
    const progresos = calcularProgresoLogros(entrada, []);
    const siguiente = siguienteLogro(progresos);
    expect(siguiente?.id).toBe('tareas_10'); // falta 1, es el mas cercano de todos
  });

  it('devuelve null si ya se obtuvieron todos', () => {
    const obtenidos = CATALOGO_LOGROS.map((d) => ({ codigoLogro: d.id, fechaObtenida: '2026-01-01T00:00:00Z' }));
    const entrada = { tareasCompletadas: 999, rachaCheckIn: 999, cursosCompletados: 999 };
    const progresos = calcularProgresoLogros(entrada, obtenidos);
    expect(siguienteLogro(progresos)).toBeNull();
  });
});
