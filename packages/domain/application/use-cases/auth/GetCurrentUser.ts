/**
 * Documentacion Nexxus - apps/mobile/src/application/use-cases/auth/GetCurrentUser.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa { IAuthRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAuthRepository } from '../../../repositories/IAuthRepository';
// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from '../../../entities/User';

/**
 * Caso de Uso: Obtener Usuario Actual (sesión activa).
 */
export class GetCurrentUser {
  constructor(private readonly authRepository: IAuthRepository) {}

  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async execute(): Promise<User | null> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.authRepository.getCurrentUser();
  }
}
