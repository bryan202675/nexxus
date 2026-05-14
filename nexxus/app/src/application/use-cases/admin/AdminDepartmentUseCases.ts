import { IDepartmentRepository } from '@/domain/repositories/IDepartmentRepository';
import { Department } from '@/domain/entities/Department';

export class AdminDepartmentUseCases {
  constructor(private departmentRepository: IDepartmentRepository) {}

  async getAll(empresaId: string): Promise<Department[]> {
    return this.departmentRepository.getDepartments(empresaId);
  }

  async create(department: Omit<Department, 'id'>): Promise<string> {
    return this.departmentRepository.createDepartment(department);
  }

  async update(id: string, department: Partial<Department>): Promise<void> {
    return this.departmentRepository.updateDepartment(id, department);
  }

  subscribe(empresaId: string, callback: (departments: Department[]) => void): () => void {
    if (this.departmentRepository.subscribeToAll) {
      return this.departmentRepository.subscribeToAll(empresaId, callback);
    }
    return () => {};
  }
}
