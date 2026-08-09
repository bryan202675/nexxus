import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// Nexxus Super Admin dashboard. Se sirve bajo /workspace en el mismo origen que apps/mobile
// en producción (ver vercel.json) para compartir sesión de Supabase Auth sin doble login.
// El "base" de assets solo aplica al build de producción: en dev, Vite sirve todo desde la raíz
// del puerto 3000 (igual que hacía CRA con "homepage", que tampoco afectaba al dev server) --
// la app igual navega bajo /workspace en dev porque BrowserRouter usa basename="/workspace" fijo.
export default defineConfig(({ command }) => {
  const base = process.env.VITE_ROUTER_BASENAME ? `${process.env.VITE_ROUTER_BASENAME}/` : '/';
  return {
    base,
    plugins: [react(), tsconfigPaths()],
    server: {
      port: 3000,
    },
    build: {
      outDir: 'dist',
    },
  };
});
