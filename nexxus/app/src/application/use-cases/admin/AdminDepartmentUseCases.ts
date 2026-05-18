/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/admin/AdminDepartmentUseCases.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { IDepartmentRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IDepartmentRepository } from '@/domain/repositories/IDepartmentRepository';
// Importa { Department }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Department } from '@/domain/entities/Department';

/**
 * Implementa AdminDepartmentUseCases; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class AdminDepartmentUseCases {
  constructor(private departmentRepository: IDepartmentRepository) {}

  // getAll ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async getAll(empresaId: string): Promise<Department[]> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.departmentRepository.getDepartments(empresaId);
  }

  // create ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async create(department: Omit<Department, 'id'>): Promise<string> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.departmentRepository.createDepartment(department);
  }

  // update ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async update(id: string, department: Partial<Department>): Promise<void> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.departmentRepository.updateDepartment(id, department);
  }

  // subscribe ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  subscribe(empresaId: string, callback: (departments: Department[]) => void): () => void {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (this.departmentRepository.subscribeToAll) {
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return this.departmentRepository.subscribeToAll(empresaId, callback);
    }
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {};
  }
}
