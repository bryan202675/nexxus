/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/admin/GetAllUsers.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { IUserRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IUserRepository } from '@/domain/repositories/IUserRepository';
// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from '@/domain/entities/User';

/**
 * Caso de Uso: Obtener todos los usuarios (solo admin/jefe).
 */
export class GetAllUsers {
  constructor(private readonly userRepository: IUserRepository) {}

  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async execute(empresaId = ''): Promise<User[]> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.userRepository.getAll(empresaId);
  }

  // subscribe ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  subscribe(empresaId: string, callback: (users: User[]) => void): () => void {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (this.userRepository.subscribeToAll) {
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return this.userRepository.subscribeToAll(empresaId, callback);
    }
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {}; // Fallback
  }
}
