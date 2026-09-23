// Desactiva la pagina intermedia /_expo/loading para evitar fallos de resolucion en clientes nativos
process.env.EXPO_NO_REDIRECT_PAGE = '1';

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

config.watchFolders = Array.from(new Set([
  ...config.watchFolders,
  path.resolve(__dirname, 'packages/domain'),
  path.resolve(__dirname, 'apps/mobile'),
]));

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, 'apps/mobile/node_modules'),
];

delete config.resolver.unstable_enableSymlinks;

// Enrutamiento seguro para solicitudes a /_expo/loading.bundle desde Android / DevLauncher
const prevEnhanceMiddleware = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, server) => {
    const customMiddleware = (req, res, next) => {
      if (req.url && req.url.startsWith('/_expo/loading.bundle')) {
        req.url = req.url.replace('/_expo/loading.bundle', '/apps/mobile/index.ts.bundle');
      }
      return metroMiddleware(req, res, next);
    };
    return typeof prevEnhanceMiddleware === 'function'
      ? prevEnhanceMiddleware(customMiddleware, server)
      : customMiddleware;
  },
};

module.exports = config;
