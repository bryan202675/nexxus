/**
 * Documentacion Nexxus - nexxus/app/src/domain/repositories/IUserRepository.ts
 * Capa: dominio.
 * Proposito: Contrato de repositorio. Describe las operaciones esperadas para persistencia sin imponer una implementacion concreta.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from '@/domain/entities/User';

/**
 * Contrato para el acceso a datos de usuarios.
 */
export interface IUserRepository {
  /** Obtiene un usuario por ID. */
  getById(id: string): Promise<User | null>;

  /** Actualiza los datos del perfil de un usuario. */
  update(id: string, data: Partial<User>): Promise<void>;

  /** Obtiene todos los usuarios de una empresa específica (para admin/jefe). */
  getAll(empresaId: string): Promise<User[]>;

  /** Cambia el estado activo/inactivo de un usuario. */
  setActive(id: string, activo: boolean): Promise<void>;

  /** Suscripción en tiempo real a todos los usuarios de una empresa. */
  subscribeToAll?(empresaId: string, callback: (users: User[]) => void): () => void;
}
