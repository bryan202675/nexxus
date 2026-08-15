/**
 * Fase B (modulo empleado): motor de gamificacion real. Antes MisLogros.tsx mostraba puntos e
 * insignias 100% hardcodeados (perfil.insignias/puntos_recompensa nunca tenian columna en
 * Supabase) -- este motor calcula puntos en vivo a partir de datos ya reales (tareas completadas,
 * racha de check-ins, cursos completados), asi que nunca se desincronizan. Las insignias SI se
 * persisten (ver IAchievementRepository) porque la fecha en que se cruzo un umbral no se puede
 * reconstruir retroactivamente -- eso no se puede calcular, solo registrar en el momento.
 */
import { AchievementDefinition, AchievementProgress, EarnedAchievement } from '../entities/Achievement';

export interface EntradaGamificacion {
  tareasCompletadas: number;
  rachaCheckIn: number;
  cursosCompletados: number;
}

// Formula de puntos: pesos simples y explicables, no una curva compleja -- cada accion vale lo
// mismo cada vez que ocurre, sin ventanas de tiempo ni bonificaciones ocultas.
const PUNTOS_POR_TAREA = 10;
const PUNTOS_POR_DIA_DE_RACHA = 2;
const PUNTOS_POR_CURSO = 25;

export function calcularPuntos(entrada: EntradaGamificacion): number {
  return (
    entrada.tareasCompletadas * PUNTOS_POR_TAREA +
    entrada.rachaCheckIn * PUNTOS_POR_DIA_DE_RACHA +
    entrada.cursosCompletados * PUNTOS_POR_CURSO
  );
}

export const CATALOGO_LOGROS: (AchievementDefinition & { obtenerProgreso: (e: EntradaGamificacion) => number })[] = [
  {
    id: 'racha_7', nombre: 'Constancia', descripcion: 'Racha de check-ins de 7 días',
    icono: 'local-fire-department', categoria: 'bienestar', umbral: 7,
    obtenerProgreso: (e) => e.rachaCheckIn,
  },
  {
    id: 'racha_30', nombre: 'Imparable', descripcion: 'Racha de check-ins de 30 días',
    icono: 'whatshot', categoria: 'bienestar', umbral: 30,
    obtenerProgreso: (e) => e.rachaCheckIn,
  },
  {
    id: 'tareas_10', nombre: 'Productivo', descripcion: '10 tareas completadas',
    icono: 'task-alt', categoria: 'productividad', umbral: 10,
    obtenerProgreso: (e) => e.tareasCompletadas,
  },
  {
    id: 'tareas_50', nombre: 'Máquina de resultados', descripcion: '50 tareas completadas',
    icono: 'military-tech', categoria: 'productividad', umbral: 50,
    obtenerProgreso: (e) => e.tareasCompletadas,
  },
  {
    id: 'cursos_1', nombre: 'Primer paso', descripcion: 'Primer curso completado',
    icono: 'school', categoria: 'aprendizaje', umbral: 1,
    obtenerProgreso: (e) => e.cursosCompletados,
  },
  {
    id: 'cursos_5', nombre: 'Aprendiz dedicado', descripcion: '5 cursos completados',
    icono: 'workspace-premium', categoria: 'aprendizaje', umbral: 5,
    obtenerProgreso: (e) => e.cursosCompletados,
  },
];

export function calcularProgresoLogros(entrada: EntradaGamificacion, obtenidos: EarnedAchievement[]): AchievementProgress[] {
  const fechasPorCodigo = new Map(obtenidos.map((o) => [o.codigoLogro, o.fechaObtenida]));
  return CATALOGO_LOGROS.map((def) => {
    const progreso = def.obtenerProgreso(entrada);
    const fechaObtenida = fechasPorCodigo.get(def.id);
    return {
      id: def.id, nombre: def.nombre, descripcion: def.descripcion, icono: def.icono,
      categoria: def.categoria, umbral: def.umbral,
      progreso: Math.min(progreso, def.umbral),
      obtenido: !!fechaObtenida,
      fechaObtenida,
    };
  });
}

// Determina que codigos de logro deberian otorgarse ahora mismo (progreso >= umbral) pero aun no
// estan en `obtenidos` -- el llamador es quien decide persistirlos (ver SyncAchievements).
export function detectarLogrosNuevos(entrada: EntradaGamificacion, obtenidos: EarnedAchievement[]): string[] {
  const yaObtenidos = new Set(obtenidos.map((o) => o.codigoLogro));
  return CATALOGO_LOGROS
    .filter((def) => !yaObtenidos.has(def.id) && def.obtenerProgreso(entrada) >= def.umbral)
    .map((def) => def.id);
}

export function siguienteLogro(progresos: AchievementProgress[]): AchievementProgress | null {
  const pendientes = progresos.filter((p) => !p.obtenido);
  if (pendientes.length === 0) return null;
  return pendientes.reduce((masCercano, actual) => {
    const distanciaActual = actual.umbral - actual.progreso;
    const distanciaMasCercano = masCercano.umbral - masCercano.progreso;
    return distanciaActual < distanciaMasCercano ? actual : masCercano;
  });
}
