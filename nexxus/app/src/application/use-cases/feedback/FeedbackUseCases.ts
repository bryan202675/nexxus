/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/feedback/FeedbackUseCases.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { IFeedbackRepository, Feedback }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { IFeedbackRepository, Feedback } from '@/domain/entities/Feedback';

/**
 * Implementa SubmitFeedback; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class SubmitFeedback {
  constructor(private repo: IFeedbackRepository) {}
  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  execute(data: Omit<Feedback, 'id' | 'estado' | 'fecha'>) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.save(data);
  }
}

/**
 * Implementa GetFeedbacks; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class GetFeedbacks {
  constructor(private repo: IFeedbackRepository) {}
  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  execute(userId: string) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.getByUser(userId);
  }
}
