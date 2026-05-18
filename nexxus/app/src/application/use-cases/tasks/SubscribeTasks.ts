/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/tasks/SubscribeTasks.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { ITaskRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { ITaskRepository } from '@/domain/repositories/ITaskRepository';
// Importa { Task }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Task } from '@/domain/entities/Task';

/**
 * Implementa SubscribeTasks; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class SubscribeTasks {
  constructor(private repo: ITaskRepository) {}

  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  execute(userId: string, callback: (tasks: Task[]) => void): () => void {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.subscribeTasksByUser(userId, callback);
  }
}
