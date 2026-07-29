/**
 * Documentacion Nexxus - nexxus/app/src/Landing/AuthPage.tsx
 * Capa: landing.
 * Proposito: Redirige el login y registro de la landing hacia web-dashboard (Nexxus Workspace).
 * El formulario propio de LandingAuth ya no se usa aqui: login y creacion de empresa viven ahora
 * en web-dashboard (views/nexxus/sa-login y views/nexxus/registro), servido en el mismo origen
 * bajo /workspace en produccion, para compartir sesion de Firebase Auth sin doble login.
 * Consideracion de mantenimiento: preservar el mapeo modo -> ruta de destino al extender este archivo.
 */

// Importa { createElement, useEffect } desde React; habilita componentes, hooks y tipos base para esta pieza.
import { createElement, useEffect } from 'react';

const h = createElement;

// Mismo patron que WORKSPACE_ORIGIN en LandingAuth.tsx: vacio en produccion (mismo origen via
// Firebase Hosting, ver nexxus/firebase.json), configurable en dev con
// EXPO_PUBLIC_WORKSPACE_ORIGIN (nexxus/app/.env.local) porque Expo y web-dashboard corren en
// puertos distintos localmente.
const WORKSPACE_ORIGIN = process.env.EXPO_PUBLIC_WORKSPACE_ORIGIN || '';

function modoInicial() {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (typeof window !== 'undefined' && window.location.pathname.includes('/login')) return 'login';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return 'registro';
}

function destinoWorkspace(modo: string) {
  const ruta = modo === 'login' ? '/workspace/auth/sa-login' : '/workspace/auth/registro';
  return `${WORKSPACE_ORIGIN}${ruta}`;
}

/**
 * Componente AuthPage. Redirige de inmediato al login/registro de web-dashboard.
 */
export default function AuthPage() {
  const modo = modoInicial();

  useEffect(() => {
    window.location.replace(destinoWorkspace(modo));
  }, [modo]);

  return h(
    'main',
    { style: { display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#fbfafc' } },
    h('p', { style: { opacity: 0.5, fontFamily: 'sans-serif' } }, 'Redirigiendo...')
  );
}
