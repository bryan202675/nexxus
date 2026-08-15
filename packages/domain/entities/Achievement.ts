export type AchievementCategory = 'productividad' | 'bienestar' | 'aprendizaje';

export interface AchievementDefinition {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  categoria: AchievementCategory;
  umbral: number;
}

export interface EarnedAchievement {
  codigoLogro: string;
  fechaObtenida: string;
}

export interface AchievementProgress extends AchievementDefinition {
  progreso: number;
  obtenido: boolean;
  fechaObtenida?: string;
}
