/**
 * Documentacion Nexxus - apps/mobile/src/application/use-cases/wellness/FocusSessionUseCases.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa { IFocusSessionRepository, FocusSession }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { IFocusSessionRepository, FocusSession } from '../../../entities/FocusSession';

/**
 * Implementa SaveFocusSession; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class SaveFocusSession {
  constructor(private repo: IFocusSessionRepository) {}
  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  execute(data: Omit<FocusSession, 'id'>) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.save(data);
  }
}

/**
 * Implementa GetFocusSessions; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class GetFocusSessions {
  constructor(private repo: IFocusSessionRepository) {}
  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  execute(userId: string) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.getByUser(userId);
  }
}
