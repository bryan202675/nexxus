/**
 * Documentacion Nexxus - nexxus/app/src/application/dtos/CheckInDTO.ts
 * Capa: aplicacion.
 * Proposito: DTO de aplicacion. Documenta la forma de datos que viaja entre UI, casos de uso y servicios.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { CheckIn }; usa tipos de dominio para que los datos mantengan estructura consistente.
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
