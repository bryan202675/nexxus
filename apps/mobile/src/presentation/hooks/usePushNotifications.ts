/**
 * Documentacion Nexxus - apps/mobile/src/presentation/hooks/usePushNotifications.ts
 * Capa: presentacion.
 * Proposito: Registra el token de Expo Push del dispositivo actual para el usuario autenticado
 * (Fase 10). Sin efecto en web (Expo Notifications no soporta push remoto en esa plataforma) ni en
 * simuladores/emuladores (Expo exige un dispositivo fisico para getExpoPushTokenAsync).
 * Consideracion de mantenimiento: requiere que el proyecto tenga un projectId de EAS configurado
 * (`expo.extra.eas.projectId` en app.json, normalmente generado por `eas init`) -- sin eso, el hook
 * no intenta pedir el token y solo deja un aviso en consola, no revienta la app.
 */

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useCases } from '@/infrastructure/container';

// Controla como se muestra una notificacion recibida con la app en primer plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const obtenerProjectId = (): string | null => {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId ?? null;
  return typeof projectId === 'string' && projectId ? projectId : null;
};

/**
 * Pide permiso y registra el push token del dispositivo para `usuarioId`. Se debe llamar una vez
 * el usuario ya esta autenticado (necesita saber a quien pertenece el token).
 */
export function usePushNotifications(usuarioId: string | null | undefined) {
  const yaRegistrado = useRef<string | null>(null);

  useEffect(() => {
    if (!usuarioId || Platform.OS === 'web' || yaRegistrado.current === usuarioId) return;

    if (!Device.isDevice) {
      // Los simuladores/emuladores no pueden recibir push -- Expo lo documenta como limitacion
      // conocida, no es un error de configuracion.
      return;
    }

    const projectId = obtenerProjectId();
    if (!projectId) {
      console.warn(
        '[usePushNotifications] Falta expo.extra.eas.projectId en app.json (correr "eas init" una vez) -- no se puede pedir el push token todavia.'
      );
      return;
    }

    let cancelado = false;

    const registrar = async () => {
      try {
        const permisoActual = await Notifications.getPermissionsAsync();
        let estado = permisoActual.status;
        if (estado !== 'granted') {
          const solicitado = await Notifications.requestPermissionsAsync();
          estado = solicitado.status;
        }
        if (estado !== 'granted' || cancelado) return;

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        if (cancelado || !token) return;

        await useCases.push.register.execute(usuarioId, token, Platform.OS as 'ios' | 'android');
        yaRegistrado.current = usuarioId;
      } catch (error) {
        // No bloquea el uso de la app si el registro de push falla (permiso denegado, red, etc.).
        console.error('[usePushNotifications] Error registrando push token:', error);
      }
    };

    registrar();

    return () => {
      cancelado = true;
    };
  }, [usuarioId]);
}
