/**
 * Documentacion Nexxus - nexxus/app/index.ts
 * Capa: app.
 * Proposito: Punto de entrada o barril de exportaciones. Conecta este modulo con el resto del proyecto.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { registerRootComponent } desde expo; agrega una dependencia externa necesaria para este modulo.
import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

const isLandingWeb = Platform.OS === 'web'
  && typeof window !== 'undefined'
  && window.location.pathname !== '/workspace-login'
  && require('./src/Landing/LandingRoot').isLandingPath(window.location.pathname);

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
registerRootComponent(isLandingWeb ? require('./src/Landing/LandingRoot').default : require('./App').default);
