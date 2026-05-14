import { User } from '@/domain/entities/User';

/**
 * Contrato que cualquier implementación de autenticación DEBE cumplir.
 * La capa de presentación solo conoce esta interfaz, nunca Firebase directamente.
 */
export interface IAuthRepository {
  /** Inicia sesión y devuelve el usuario autenticado. */
  login(correo: string, password: string): Promise<User>;

  /** Cierra la sesión activa. */
  logout(): Promise<void>;

  /** Devuelve el usuario actualmente autenticado, o null. */
  getCurrentUser(): Promise<User | null>;

  /** Registra un nuevo usuario. */
  register(correo: string, password: string, nombre: string, rol: User['rol']): Promise<User>;
}
