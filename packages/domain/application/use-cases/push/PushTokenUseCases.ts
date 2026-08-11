/**
 * Documentacion Nexxus - packages/domain/application/use-cases/push/PushTokenUseCases.ts
 * Capa: aplicacion.
 * Proposito: Casos de uso para registrar/quitar tokens de Expo Push (Fase 10).
 */

import { PushToken, PushPlatform } from '../../../entities/PushToken';
import { IPushTokenRepository } from '../../../repositories/IPushTokenRepository';
import { IPushSenderRepository } from '../../../repositories/IPushSenderRepository';

export class RegisterPushToken {
  constructor(private repo: IPushTokenRepository) {}
  execute(usuarioId: string, token: string, plataforma?: PushPlatform): Promise<void> {
    return this.repo.register(usuarioId, token, plataforma);
  }
}

export class UnregisterPushToken {
  constructor(private repo: IPushTokenRepository) {}
  execute(token: string): Promise<void> {
    return this.repo.unregister(token);
  }
}

export class GetPushTokens {
  constructor(private repo: IPushTokenRepository) {}
  execute(usuarioId: string): Promise<PushToken[]> {
    return this.repo.getByUser(usuarioId);
  }
}

export class SendPushNotification {
  constructor(private repo: IPushSenderRepository) {}
  execute(userId: string, titulo: string, mensaje: string, data?: Record<string, unknown>): Promise<void> {
    return this.repo.send(userId, titulo, mensaje, data);
  }
}
