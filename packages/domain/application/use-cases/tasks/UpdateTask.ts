/**
 * Documentacion Nexxus - apps/mobile/src/application/use-cases/tasks/UpdateTask.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa { ITaskRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { ITaskRepository } from '../../../repositories/ITaskRepository';
// Importa { Task }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Task } from '../../../entities/Task';

/**
 * Implementa UpdateTask; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class UpdateTask { 
  constructor(private repo: ITaskRepository) {} 
  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  execute(taskId: string, data: Partial<Task>) { 
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.updateTask(taskId, data); 
  } 
}
