/**
 * Documentacion Nexxus - nexxus/app/src/Landing/workspaceRoutes.ts
 * Capa: landing.
 * Proposito: Fuente unica de las rutas de web-dashboard (Nexxus Workspace) usadas desde la
 * landing (AuthPage.tsx, Index.tsx) para no duplicar el mapeo modo/rol -> ruta en cada archivo.
 */

// Vacio en produccion (mismo origen via Firebase Hosting, ver nexxus/firebase.json),
// configurable en dev con EXPO_PUBLIC_WORKSPACE_ORIGIN (nexxus/app/.env.development.local)
// porque Expo (8081) y web-dashboard (3000) corren en puertos distintos localmente.
export const WORKSPACE_ORIGIN = process.env.EXPO_PUBLIC_WORKSPACE_ORIGIN || '';

export function destinoWorkspaceAuth(modo: 'login' | 'registro') {
  const ruta = modo === 'login' ? '/workspace/auth/sa-login' : '/workspace/auth/registro';
  return `${WORKSPACE_ORIGIN}${ruta}`;
}

// El botón "Acceder a mi empresa" de la landing debe llevar a cada rol a su propio panel del
// nuevo dashboard (web-dashboard), no al dashboard nativo antiguo en "/app".
export function destinoWorkspaceAdmin(rol?: string | null) {
  const rolNormalizado = String(rol || '').trim().toLowerCase();
  const ruta = rolNormalizado === 'super_admin'
    ? '/workspace/admin'
    : '/workspace/admin/empresa-resumen';
  return `${WORKSPACE_ORIGIN}${ruta}`;
}
