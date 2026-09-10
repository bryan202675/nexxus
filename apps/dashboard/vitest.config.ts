import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  // Testing Library is hoisted to the workspace root; share its React instance.
  resolve: {
    alias: {
      'react': new URL('../../node_modules/react', import.meta.url).pathname,
      'react-dom': new URL('../../node_modules/react-dom', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
  },
});
