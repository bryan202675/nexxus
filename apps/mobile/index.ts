/**
 * Documentacion Nexxus - apps/mobile/index.ts
 * Capa: app.
 * Proposito: Punto de entrada o barril de exportaciones. Conecta este modulo con el resto del proyecto.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Debe ser el primer import del entry point (requisito de react-native-gesture-handler).
import 'react-native-gesture-handler';
// Importa { registerRootComponent } desde expo; agrega una dependencia externa necesaria para este modulo.
import { registerRootComponent } from 'expo';
import { Platform, LogBox } from 'react-native';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
]);

const isLandingWeb = Platform.OS === 'web'
  && typeof window !== 'undefined'
  && window.location.pathname !== '/workspace-login'
  && require('./src/Landing/LandingRoot').isLandingPath(window.location.pathname);

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
registerRootComponent(isLandingWeb ? require('./src/Landing/LandingRoot').default : require('./App').default);
