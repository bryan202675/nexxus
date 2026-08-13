import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.ts'],
    rules: {
      // Codigo de dominio portado desde apps/mobile, usa "any" en varios puntos
      // de mapeo de datos crudos hacia entidades -- ver mismo criterio en
      // apps/mobile/eslint.config.js y apps/dashboard/eslint.config.js.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  }
);
