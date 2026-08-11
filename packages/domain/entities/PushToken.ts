/**
 * Documentacion Nexxus - packages/domain/entities/PushToken.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio para el registro de tokens de Expo Push por usuario (Fase 10).
 * Dependencias clave: ninguna.
 * Consideracion de mantenimiento: `token` es el ExponentPushToken devuelto por
 * Notifications.getExpoPushTokenAsync() en el cliente -- nunca un token nativo (FCM/APNs) crudo.
 */

export type PushPlatform = 'ios' | 'android' | 'web';

export interface PushToken {
  id: string;
  usuarioId: string;
  token: string;
  plataforma?: PushPlatform;
  createdAt: string;
}
