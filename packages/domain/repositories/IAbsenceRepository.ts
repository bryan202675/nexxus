/**
 * Documentacion Nexxus - apps/mobile/src/domain/repositories/IAbsenceRepository.ts
 * Capa: dominio.
 * Proposito: Contrato de repositorio. Describe las operaciones esperadas para persistencia sin imponer una implementacion concreta.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */


// Importa { Absence }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { Absence } from '../entities/Absence';
/**
 * Define el contrato de datos IAbsenceRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IAbsenceRepository {
  getAbsencesByUser(userId: string): Promise<Absence[]>;
  getAbsencesByCompany(empresaId: string): Promise<Absence[]>;
  createAbsence(absence: Omit<Absence, 'id' | 'fecha_solicitud' | 'estado'>): Promise<void>;
  updateAbsenceState(absenceId: string, estado: Absence['estado']): Promise<void>;
  updateAbsence?(absenceId: string, data: Partial<Absence>): Promise<void>;
  deleteAbsence?(absenceId: string): Promise<void>;
  subscribeByUser?(userId: string, callback: (absences: Absence[]) => void): () => void;
}
