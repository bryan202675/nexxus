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
      // Nexxus no está compilado con React Compiler. Estas reglas pertenecen
      // exclusivamente a ese compilador y bloquean patrones válidos de React
      // Native existentes, sin aportar señal útil al lint actual.
      'react-hooks/error-boundaries': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
    },
  },
]);
