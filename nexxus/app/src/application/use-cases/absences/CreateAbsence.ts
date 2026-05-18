/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/absences/CreateAbsence.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */


// Importa { IAbsenceRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAbsenceRepository } from '@/domain/repositories/IAbsenceRepository';
/**
 * Implementa CreateAbsence; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class CreateAbsence { constructor(private repo: IAbsenceRepository) {} execute(absence: any) { return this.repo.createAbsence(absence); } }
