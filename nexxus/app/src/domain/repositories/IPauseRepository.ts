/**
 * Documentacion Nexxus - nexxus/app/src/domain/repositories/IPauseRepository.ts
 * Capa: dominio.
 * Proposito: Contrato de repositorio. Describe las operaciones esperadas para persistencia sin imponer una implementacion concreta.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

export interface Pause {
  id: string;
  userId: string;
  tipo: string;
  duracion: number;
  fecha: string;
}

/**
 * Define el contrato de datos IPauseRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IPauseRepository {
  save(userId: string, data: Omit<Pause, 'id' | 'userId'>): Promise<void>;
  getByUser(userId: string): Promise<Pause[]>;
}
