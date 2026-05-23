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
// Importa { changeLanguage }; inicializa o consume configuracion de internacionalizacion.
import { changeLanguage } from '../shared/i18n/config';
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

/**
 * Declaracion modoInicial. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function modoInicial() {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (typeof window !== 'undefined' && window.location.pathname.includes('/login')) return 'login';
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
  const { t, i18n } = useTranslation();

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    document.title = modoInicial() === 'login' ? t('landing_auth.page_title_login') : t('landing_auth.page_title_register');
  }, [t]);

  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return h(
    'main',
    { className: 'nx-auth-page' },
    h('div', { className: 'nx-auth-page-light nx-auth-page-light-a', 'aria-hidden': true }),
    h('div', { className: 'nx-auth-page-light nx-auth-page-light-b', 'aria-hidden': true }),
    h(
      'nav',
      { className: 'nx-nav nx-auth-page-nav' },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '20px' } },
        h('button', { className: 'nx-brand', onClick: irLanding }, h('span', null, 'N'), 'Nexxus'),
        h('div', { className: 'nx-lang-selector', style: { display: 'flex', gap: '8px', alignItems: 'center' } },
          h('button', { 
            onClick: () => changeLanguage('es'), 
            style: { background: 'none', border: 'none', color: i18n.language === 'es' ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px', fontWeight: i18n.language === 'es' ? 'bold' : 'normal' }
          }, 'ES'),
          h('span', { style: { color: 'rgba(255,255,255,0.2)', fontSize: '12px' } }, '|'),
          h('button', { 
            onClick: () => changeLanguage('en'), 
            style: { background: 'none', border: 'none', color: i18n.language === 'en' ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px', fontWeight: i18n.language === 'en' ? 'bold' : 'normal' }
          }, 'EN')
        )
      ),
      h('button', { 'aria-label': t('landing_auth.nav_back_home'), className: 'nx-auth-mobile-back', onClick: irLanding }, h('span', null)),
      h('button', { className: 'nx-btn-ghost nx-auth-back', onClick: irLanding }, t('landing_auth.nav_back_home'))
    ),
    h(
      'section',
      { className: 'nx-auth-page-stage' },
      h(
        'div',
        { className: 'nx-auth-page-copy' },
        h('div', { className: 'nx-kicker' }, h('span', null), modoInicial() === 'login' ? t('landing_auth.kicker_login') : t('landing_auth.kicker_register')),
        h('h1', null, modoInicial() === 'login' ? t('landing_auth.h1_login') : t('landing_auth.h1_register')),
        h('p', null, t('landing_auth.p_desc'))
      ),
      h(LandingAuth, { modoInicial: modoInicial(), planSeleccionado: parametroPlan() })
    )
  );
}
