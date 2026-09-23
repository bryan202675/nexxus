const path = require('path');

let workletsPlugin = 'react-native-worklets/plugin';
try {
  workletsPlugin = require.resolve('react-native-worklets/plugin');
} catch (e) {
  try {
    workletsPlugin = require.resolve('react-native-worklets/plugin', {
      paths: [path.resolve(__dirname, 'apps/mobile')]
    });
  } catch (err) {
    // If not found, keep string and let babel handle error reporting
  }
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [workletsPlugin],
  };
};
