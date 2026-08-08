/**
 * Documentacion Nexxus - apps/mobile/src/application/use-cases/tasks/GetTasks.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */


// Importa { ITaskRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { ITaskRepository } from '../../../repositories/ITaskRepository';
/**
 * Implementa GetTasks; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class GetTasks { constructor(private repo: ITaskRepository) {} execute(userId: string) { return this.repo.getTasksByUser(userId); } }
