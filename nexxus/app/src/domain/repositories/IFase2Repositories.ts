import { InternalRequest, NuevaSolicitudInterna } from '@/domain/entities/InternalRequest';

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

export interface IInternalRequestRepository {
  create(userId: string, data: NuevaSolicitudInterna): Promise<InternalRequest>;
  getByUser(userId: string): Promise<InternalRequest[]>;
}

export interface IChatContextualRepository {
  sendMessage(data: Omit<ContextualMessage, 'id' | 'timestamp'>): Promise<ContextualMessage>;
  getMessagesByContext(origenRefId: string): Promise<ContextualMessage[]>;
  subscribeToContext(origenRefId: string, callback: (msgs: ContextualMessage[]) => void): () => void;
}
