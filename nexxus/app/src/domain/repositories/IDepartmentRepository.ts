/**
 * Documentacion Nexxus - nexxus/app/src/domain/repositories/IDepartmentRepository.ts
 * Capa: dominio.
 * Proposito: Contrato de repositorio. Describe las operaciones esperadas para persistencia sin imponer una implementacion concreta.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { Department }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { Department } from '../entities/Department';

/**
 * Define el contrato de datos IDepartmentRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IDepartmentRepository {
  getDepartments(empresaId: string): Promise<Department[]>;
  getDepartmentById(id: string): Promise<Department | null>;
  createDepartment(department: Omit<Department, 'id'>): Promise<string>;
  updateDepartment(id: string, department: Partial<Department>): Promise<void>;
  deleteDepartment(id: string): Promise<void>;
  subscribeToAll?(empresaId: string, callback: (departments: Department[]) => void): () => void;
}
