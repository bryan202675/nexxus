/**
 * Documentacion Nexxus - nexxus/app/src/domain/repositories/IAuthRepository.ts
 * Capa: dominio.
 * Proposito: Contrato de repositorio. Describe las operaciones esperadas para persistencia sin imponer una implementacion concreta.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from '@/domain/entities/User';

/**
 * Contrato que cualquier implementación de autenticación DEBE cumplir.
 * La capa de presentación solo conoce esta interfaz, nunca Firebase directamente.
 */
export interface IAuthRepository {
  /** Inicia sesión y devuelve el usuario autenticado. */
  login(correo: string, password: string): Promise<User>;

  /** Inicia sesión empresarial para empleados. */
  loginEmpresarial(codigoEmpresa: string, usuario: string, password: string): Promise<User>;

  /** Cierra la sesión activa. */
  logout(): Promise<void>;

  /** Devuelve el usuario actualmente autenticado, o null. */
  getCurrentUser(): Promise<User | null>;

  /** Registra un nuevo usuario. */
  register(correo: string, password: string, nombre: string, rol: User['rol']): Promise<User>;
}
