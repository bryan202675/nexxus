/**
 * Documentacion Nexxus - nexxus/app/src/Landing/AuthPage.tsx
 * Capa: landing.
 * Proposito: Pantalla o recurso visual del flujo publico de autenticacion/landing. Centraliza la presentacion inicial antes de entrar a la app privada.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { createElement, useEffect } desde React; habilita componentes, hooks y tipos base para esta pieza.
import { createElement, useEffect } from 'react';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa LandingAuth; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import LandingAuth from './LandingAuth';
import GlassSurface from './GlassSurface';
// Importa estilos CSS; aplica clases, animaciones o efectos visuales usados por este componente web.
import './Landing.css';
// Importa estilos CSS; aplica clases, animaciones o efectos visuales usados por este componente web.
import './AuthPage.css';

/**
 * Declaracion h. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const h = createElement;

/**
 * Declaracion parametroPlan. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function parametroPlan() {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (typeof window === 'undefined') return 'Business';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return new URLSearchParams(window.location.search).get('plan') || 'Business';
}

function parametroRetorno() {
  if (typeof window === 'undefined') return '';
  const returnTo = new URLSearchParams(window.location.search).get('returnTo') ?? '';
  return returnTo.startsWith('/landing/checkout?') ? returnTo : '';
}

/**
 * Declaracion modoInicial. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function modoInicial() {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (typeof window !== 'undefined' && window.location.pathname.includes('/login')) return 'login';
  if (typeof window !== 'undefined' && window.location.pathname.includes('/crear-empresa')) return 'empresa';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return 'registro';
}

/**
 * Declaracion irLanding. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function irLanding() {
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  window.history.pushState({}, '', '/landing');
  window.dispatchEvent(new Event('nexxus:navigate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Componente AuthPage. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function AuthPage() {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  const modo = modoInicial();

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    document.title = modo === 'login' ? t('landing_auth.page_title_login') : t('landing_auth.page_title_register');
  }, [t, modo]);

  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return h(
    'main',
    { className: 'nx-landing nx-auth-page' },
    h('div', { className: 'nx-orb nx-orb-a', 'aria-hidden': true }),
    h('div', { className: 'nx-orb nx-orb-b', 'aria-hidden': true }),
    h(
      'div',
      { className: 'nx-nav-layer' },
      h(
        GlassSurface,
        {
          as: 'nav',
          backgroundOpacity: 0.08,
          blur: 8,
          borderRadius: 999,
          brightness: 58,
          displace: 0.25,
          distortionScale: -34,
          greenOffset: 3,
          blueOffset: 6,
          saturation: 1.24,
          className: 'nx-nav nx-hero-nav is-floating is-ready is-pinned nx-auth-page-nav',
          style: { top: 8 },
        },
        h(
          'button',
          { className: 'nx-policy-back nx-auth-page-back', onClick: irLanding, 'aria-label': t('landing_auth.nav_back_home') },
          h(
            'svg',
            { fill: 'none', viewBox: '0 0 24 24', 'aria-hidden': true },
            h('path', { d: 'M14 7l-5 5 5 5', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2.2 }),
            h('path', { d: 'M9.5 12H18', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2.2 })
          )
        )
      )
    ),
    h(
      'section',
      { className: 'nx-auth-page-stage' },
      h(
        'div',
        { className: 'nx-auth-page-copy' },
        h('div', { className: 'nx-kicker' }, h('span', null), modo === 'login' ? t('landing_auth.kicker_login') : t('landing_auth.kicker_register')),
        h('h1', null, modo === 'login' ? t('landing_auth.h1_login') : t('landing_auth.h1_register')),
        h('p', null, t('landing_auth.p_desc'))
      ),
      h(LandingAuth, { modoInicial: modo, planSeleccionado: parametroPlan(), returnTo: parametroRetorno() })
    )
  );
}
