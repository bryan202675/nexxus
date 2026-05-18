/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/wellness/RecordPause.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { IPauseRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IPauseRepository } from '@/domain/repositories/IPauseRepository';

/**
 * Implementa RecordPause; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class RecordPause {
  constructor(private repo: IPauseRepository) {}
  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async execute(userId: string, data: any) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.save(userId, data);
  }
}
