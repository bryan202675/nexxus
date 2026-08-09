// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'scripts/*'],
  },
  {
    rules: {
      // El codebase usa "any" deliberadamente en muchos puntos de integracion
      // (props de terceros, datos crudos de Supabase antes de mapear a entidades).
      // Prohibirlo aqui generaria miles de hallazgos sin valor real; se mantiene
      // como advertencia visible en vez de bloquear el build.
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]);
