/**
 * Documentacion Nexxus - apps/mobile/src/domain/entities/CheckIn.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Supabase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

/**
 * Entidad pura de Check-In de bienestar.
 * No depende de Supabase, React, ni ninguna librería externa.
 */
export interface CheckIn {
  id: string;
  userId: string;
  empresaId?: string;
  usuarioNombre?: string;
  departamento?: string;
  fecha: string;
  energia: 'bajo' | 'medio' | 'alto';
  balanceEmocional: number; // 1-5
  estres: number;           // 1-5
  nivelEstres: 'bajo' | 'moderado' | 'alto' | 'critico';
  calidadSueno: number;     // 1-5
  cargaLaboral: number;     // 1-5 (carga percibida)
  indicadoresRapidos: string[]; // ['productivo', 'enfocado', 'cansado', etc.]
  nota?: string;
  comentarios?: string;
}

/**
 * Describe la forma tipada NuevaEntradaCheckIn; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type NuevaEntradaCheckIn = Omit<CheckIn, 'id' | 'fecha' | 'userId'>;
