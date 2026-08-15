/**
 * Fase C (modulo empleado): motor de Objetivos/OKR -- metodologia estandar (Google/Intel OKR):
 * un Objetivo es cualitativo/aspiracional, sus Resultados Clave son cuantitativos/medibles. El
 * progreso del objetivo NUNCA se captura manualmente -- se calcula como el promedio del progreso
 * de sus resultados clave, que a su vez se calcula de valorActual/valorObjetivo. Es imposible que
 * el progreso mostrado "mienta": siempre refleja los valores reales cargados.
 */
import { KeyResult, Objective } from '../entities/Objective';

export function calcularProgresoKR(kr: Pick<KeyResult, 'valorActual' | 'valorObjetivo'>): number {
  if (kr.valorObjetivo <= 0) return 0;
  const progreso = (kr.valorActual / kr.valorObjetivo) * 100;
  return Math.max(0, Math.min(100, Math.round(progreso)));
}

export function calcularProgresoObjetivo(keyResults: Pick<KeyResult, 'valorActual' | 'valorObjetivo'>[]): number {
  if (keyResults.length === 0) return 0;
  const suma = keyResults.reduce((total, kr) => total + calcularProgresoKR(kr), 0);
  return Math.round(suma / keyResults.length);
}

// Ciclo trimestral tipo "2026-Q1" -- convencion estandar de OKR (revision cada trimestre).
export function cicloActual(fecha: Date = new Date()): string {
  const trimestre = Math.floor(fecha.getUTCMonth() / 3) + 1;
  return `${fecha.getUTCFullYear()}-Q${trimestre}`;
}

export function listaCiclos(cantidadHaciaAtras = 4, fecha: Date = new Date()): string[] {
  const ciclos: string[] = [];
  let anio = fecha.getUTCFullYear();
  let trimestre = Math.floor(fecha.getUTCMonth() / 3) + 1;
  for (let i = 0; i < cantidadHaciaAtras; i++) {
    ciclos.push(`${anio}-Q${trimestre}`);
    trimestre -= 1;
    if (trimestre === 0) {
      trimestre = 4;
      anio -= 1;
    }
  }
  return ciclos;
}

export function ordenarObjetivosPorProgreso(objetivos: Objective[]): (Objective & { progreso: number })[] {
  return objetivos
    .map((obj) => ({ ...obj, progreso: calcularProgresoObjetivo(obj.keyResults) }))
    .sort((a, b) => b.progreso - a.progreso);
}
