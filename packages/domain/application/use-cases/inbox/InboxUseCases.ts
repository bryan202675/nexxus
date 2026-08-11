/**
 * Documentacion Nexxus - apps/mobile/src/application/use-cases/inbox/InboxUseCases.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa { IInboxRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IInboxRepository } from '../../../repositories/IInboxRepository';
// Importa { InboxItem }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { InboxItem } from '../../../entities/Inbox';

/**
 * Implementa GetInbox; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class GetInbox {
  constructor(private repo: IInboxRepository) {}
  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  execute(userId: string) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.getByUser(userId);
  }
}

/**
 * Implementa ResolveInboxItem; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class ResolveInboxItem {
  constructor(private repo: IInboxRepository) {}
  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  execute(itemId: string) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.resolveItem(itemId);
  }
}

/**
 * Publica un item real en la Bandeja Unificada de un usuario (Fase 9). El repositorio ya sabia
 * escribir (`addItem`), pero no habia forma de llamarlo desde la app -- sin este caso de uso la
 * bandeja solo podia leerse/resolverse, nunca recibir contenido real.
 */
export class AddInboxItem {
  constructor(private repo: IInboxRepository) {}
  execute(item: Omit<InboxItem, 'id' | 'timestamp'>) {
    return this.repo.addItem(item);
  }
}

/**
 * Implementa SubscribeToInbox; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class SubscribeToInbox {
  constructor(private repo: IInboxRepository) {}
  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  execute(userId: string, callback: (items: InboxItem[]) => void) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.subscribeToInbox(userId, callback);
  }
}
