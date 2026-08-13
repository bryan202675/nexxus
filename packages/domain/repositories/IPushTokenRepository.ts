/**
 * Documentacion Nexxus - packages/domain/repositories/IPushTokenRepository.ts
 * Capa: dominio.
 * Proposito: Contrato de repositorio para registrar/quitar tokens de Expo Push y consultarlos al
 * enviar una notificacion (Fase 10).
 */

import { PushToken, PushPlatform } from '../entities/PushToken';

export interface IPushTokenRepository {
  /** Registra un token para un usuario. Idempotente: si el par (usuario, token) ya existe, no falla. */
  register(usuarioId: string, token: string, plataforma?: PushPlatform): Promise<void>;

  /** Quita un token (p.ej. al cerrar sesion o si Expo lo reporta invalido). */
  unregister(token: string): Promise<void>;

  /** Todos los tokens activos de un usuario, para enviarles un push. */
  getByUser(usuarioId: string): Promise<PushToken[]>;
}
