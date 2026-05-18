/**
 * Documentacion Nexxus - nexxus/app/src/domain/entities/NominaConfig.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Firebase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

export interface NominaConfig {
  id?: string;
  empresaId: string;
  periodoActual?: string;
  fechaCorte?: number;      // día del mes: ej. 30
  fechaPago?: number;       // día del mes: ej. 5
  moneda: string;           // 'USD'
  tasaISS: number;          // 0.03
  tasaAFP: number;          // 0.0725
  topISSSMensual: number;   // 30.00 USD
  horasPorDia: number;      // 8
  diasLaboralesSemanales: number; // 5 o 6
  valorMultiplicadorHoraExtra: number; // 1.5
  diasAguinaldo: number;    // 15 o proporcional
  updatedAt?: string;
}
