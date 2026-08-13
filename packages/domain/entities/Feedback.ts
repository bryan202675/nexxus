/**
 * Documentacion Nexxus - apps/mobile/src/domain/entities/Feedback.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Supabase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

export interface Feedback {
  id: string;
  userId: string;
  empresaId: string;
  tipo: 'problema' | 'sugerencia' | 'satisfaccion' | 'dificultad';
  mensaje: string;
  nivelSatisfaccion?: number; // 1-5
  estado: 'pendiente' | 'revisado' | 'resuelto';
  fecha: string;
}

/**
 * Define el contrato de datos IFeedbackRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IFeedbackRepository {
  save(data: Omit<Feedback, 'id' | 'estado' | 'fecha'>): Promise<Feedback>;
  getByUser(userId: string): Promise<Feedback[]>;
}
