const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

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

module.exports = config;
