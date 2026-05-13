import { Department } from '../entities/Department';

export interface IDepartmentRepository {
  getDepartments(empresaId: string): Promise<Department[]>;
  getDepartmentById(id: string): Promise<Department | null>;
  createDepartment(department: Omit<Department, 'id'>): Promise<string>;
  updateDepartment(id: string, department: Partial<Department>): Promise<void>;
  deleteDepartment(id: string): Promise<void>;
  subscribeToAll?(empresaId: string, callback: (departments: Department[]) => void): () => void;
}
