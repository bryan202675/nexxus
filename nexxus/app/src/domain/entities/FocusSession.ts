/**
 * Documentacion Nexxus - nexxus/app/src/domain/entities/FocusSession.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Firebase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

export interface FocusSession {
  id: string;
  userId: string;
  fecha: string;
  duracionMinutos: number;
  tareasCompletadas: number;
  nivelConcentracion: number; // 1-5
  empresaId: string;
}

/**
 * Define el contrato de datos IFocusSessionRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IFocusSessionRepository {
  save(data: Omit<FocusSession, 'id'>): Promise<FocusSession>;
  getByUser(userId: string): Promise<FocusSession[]>;
}
