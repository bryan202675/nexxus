/**
 * Documentacion Nexxus - apps/mobile/src/domain/repositories/ITaskRepository.ts
 * Capa: dominio.
 * Proposito: Contrato de repositorio. Describe las operaciones esperadas para persistencia sin imponer una implementacion concreta.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa { Task }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { Task } from '../entities/Task';

/**
 * Define el contrato de datos ITaskRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface ITaskRepository {
  getTasksByUser(userId: string): Promise<Task[]>;
  getTaskById(taskId: string): Promise<Task | null>;
  subscribeTasksByUser(userId: string, callback: (tasks: Task[]) => void): () => void;
  getTasksByCompany(empresaId: string): Promise<Task[]>;
  getTasksByIds(taskIds: string[]): Promise<Task[]>;
  createTask(task: Omit<Task, 'id' | 'fecha_creacion'>): Promise<void>;
  updateTask(taskId: string, data: Partial<Task>): Promise<void>;
  updateTaskState(taskId: string, estado: Task['estado']): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
}
