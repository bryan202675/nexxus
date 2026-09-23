/**
 * Documentacion Nexxus - apps/mobile/metro.config.js
 * Capa: app.
 * Proposito: Modulo metro.config. Agrupa logica, tipos o configuracion usados por la app Nexxus.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Desactiva la pagina intermedia /_expo/loading para evitar fallos de resolucion en clientes nativos
process.env.EXPO_NO_REDIRECT_PAGE = '1';

// Importa { getDefaultConfig } desde expo/metro-config; agrega una dependencia externa necesaria para este modulo.
const { getDefaultConfig } = require('expo/metro-config');
// Importa path; usa utilidades de Node necesarias para scripts o configuracion local.
const path = require('path');
const fs = require('fs');

/**
 * Configuracion config. Reune valores que otras piezas consumen para evitar duplicacion y cambios dispersos.
 */
const config = getDefaultConfig(__dirname);

const monorepoRoot = path.resolve(__dirname, '../..');

// Conserva las carpetas que Expo detecta automáticamente y garantiza el paquete
// compartido aunque la estructura del workspace cambie.
config.watchFolders = Array.from(new Set([
  ...config.watchFolders,
  path.resolve(monorepoRoot, 'packages/domain'),
]));
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
delete config.resolver.unstable_enableSymlinks;

// Bloquear escaneo de carpetas fuera del frontend para mejorar rendimiento
config.resolver.blockList = [
  /\.\.\/backend\/.*/,
  /\.\.\/scripts\/.*/,
  /\.\.\/docs\/.*/,
  /\.\.\/config\/.*/,
];

// Enrutamiento seguro para solicitudes a /_expo/loading.bundle desde Android / DevLauncher
const prevEnhanceMiddleware = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, server) => {
    const customMiddleware = (req, res, next) => {
      if (req.url && req.url.startsWith('/_expo/loading.bundle')) {
        const entryBundle = fs.existsSync(path.resolve(__dirname, 'index.ts'))
          ? '/index.ts.bundle'
          : '/apps/mobile/index.ts.bundle';
        req.url = req.url.replace('/_expo/loading.bundle', entryBundle);
      }
      return metroMiddleware(req, res, next);
    };
    return typeof prevEnhanceMiddleware === 'function'
      ? prevEnhanceMiddleware(customMiddleware, server)
      : customMiddleware;
  },
};

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
module.exports = config;
