const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Bloquear escaneo de carpetas fuera del frontend para mejorar rendimiento
config.resolver.blockList = [
  /\.\.\/backend\/.*/,
  /\.\.\/scripts\/.*/,
  /\.\.\/docs\/.*/,
  /\.\.\/config\/.*/,
];

module.exports = config;
