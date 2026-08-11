/**
 * Documentacion Nexxus - packages/domain/repositories/IPushSenderRepository.ts
 * Capa: dominio.
 * Proposito: Contrato para disparar el envio de una notificacion push a un usuario (Fase 10) --
 * separado de IPushTokenRepository porque enviar no es una operacion CRUD sobre push_tokens, es una
 * llamada a la Edge Function send-push-notification (que a su vez habla con el Expo Push Service).
 */

export interface IPushSenderRepository {
  send(userId: string, titulo: string, mensaje: string, data?: Record<string, unknown>): Promise<void>;
}
