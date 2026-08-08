/**
 * Documentacion Nexxus - apps/mobile/src/domain/repositories/IFase2Repositories.ts
 * Capa: dominio.
 * Proposito: Contrato de repositorio. Describe las operaciones esperadas para persistencia sin imponer una implementacion concreta.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa { InternalRequest, NuevaSolicitudInterna }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { InternalRequest, NuevaSolicitudInterna } from '../entities/InternalRequest';

/**
 * Define el contrato de datos ContextualMessage; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface ContextualMessage {
  id: string;
  userId: string;
  usuario_nombre: string;
  empresaId: string;
  origenRefId: string; // ID de tarea, proyecto o solicitud
  tipoOrigen: 'tarea' | 'proyecto' | 'solicitud' | 'ticket';
  mensaje: string;
  archivo_url?: string;
  timestamp: string;
}

/**
 * Define el contrato de datos IInternalRequestRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IInternalRequestRepository {
  create(userId: string, data: NuevaSolicitudInterna): Promise<InternalRequest>;
  getByUser(userId: string): Promise<InternalRequest[]>;
}

/**
 * Define el contrato de datos IChatContextualRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IChatContextualRepository {
  sendMessage(data: Omit<ContextualMessage, 'id' | 'timestamp'>): Promise<ContextualMessage>;
  getMessagesByContext(origenRefId: string): Promise<ContextualMessage[]>;
  subscribeToContext(origenRefId: string, callback: (msgs: ContextualMessage[]) => void): () => void;
}
