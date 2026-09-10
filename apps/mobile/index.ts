/**
 * Documentacion Nexxus - apps/mobile/index.ts
 * Capa: app.
 * Proposito: Punto de entrada o barril de exportaciones. Conecta este modulo con el resto del proyecto.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { Platform, LogBox } from 'react-native';
import App from './App';

console.log('[NEXXUS] Starting mobile entry point...');

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
]);

let RootComponent = App;

if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.pathname !== '/workspace-login') {
  try {
    const landingRoot = require('./src/Landing/LandingRoot');
    if (landingRoot.isLandingPath(window.location.pathname)) {
      RootComponent = landingRoot.default;
    }
  } catch (e) {
    console.error('[NEXXUS] Error loading landing root:', e);
  }
}

registerRootComponent(RootComponent);

