/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/auth/LogoutUser.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { IAuthRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAuthRepository } from '@/domain/repositories/IAuthRepository';

/**
 * Caso de Uso: Cerrar Sesión
 */
export class LogoutUser {
  constructor(private readonly authRepository: IAuthRepository) {}

  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async execute(): Promise<void> {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await this.authRepository.logout();
  }
}
