import { CheckIn } from '@/domain/entities/CheckIn';

/** DTO para el registro de un nuevo check-in desde la UI */
export interface CreateCheckInDTO {
  energia: CheckIn['energia'];
  balanceEmocional: number;
  estres: number;
  nivelEstres: CheckIn['nivelEstres'];
  calidadSueno: number;
  cargaLaboral: number;
  indicadoresRapidos: string[];
  nota?: string;
  comentarios?: string;
}

/** DTO con métricas de bienestar calculadas para la UI */
export interface WellnessMetricsDTO {
  promedioBienestar: number;
  racha: number;
  insightIA: string;
  datosSemana: { dia: string; energia: number; estres: number; sueno: number }[];
  recentCheckIns: CheckIn[];
}
