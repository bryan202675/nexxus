/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/fase2/Fase2UseCases.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { IInternalRequestRepository, IChatContextualRepository, ContextualMessage }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IInternalRequestRepository, IChatContextualRepository, ContextualMessage } from '@/domain/repositories/IFase2Repositories';
// Importa { NuevaSolicitudInterna }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { NuevaSolicitudInterna } from '@/domain/entities/InternalRequest';

/**
 * Implementa CreateInternalRequest; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class CreateInternalRequest {
  constructor(private repo: IInternalRequestRepository) {}
  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  execute(userId: string, data: NuevaSolicitudInterna) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.create(userId, data);
  }
}

/**
 * Implementa GetInternalRequests; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class GetInternalRequests {
  constructor(private repo: IInternalRequestRepository) {}
  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  execute(userId: string) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.getByUser(userId);
  }
}

/**
 * Implementa SendContextualMessage; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class SendContextualMessage {
  constructor(private repo: IChatContextualRepository) {}
  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  execute(data: Omit<ContextualMessage, 'id' | 'timestamp'>) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.sendMessage(data);
  }
}

/**
 * Implementa SubscribeToChatContext; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class SubscribeToChatContext {
  constructor(private repo: IChatContextualRepository) {}
  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  execute(origenRefId: string, callback: (msgs: ContextualMessage[]) => void) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.subscribeToContext(origenRefId, callback);
  }
}
