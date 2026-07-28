/**
 * Documentacion Nexxus - nexxus/app/src/Landing/AuthPage.tsx
 * Capa: landing.
 * Proposito: Pantalla o recurso visual del flujo publico de autenticacion/landing. Centraliza la presentacion inicial antes de entrar a la app privada.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LandingAuth from './LandingAuth';
import GlassSurface from './GlassSurface';
import './Landing.css';
import './AuthPage.css';

// =========================================================================
// Helpers: lectura de parametros de la URL y modo inicial de la pantalla
// =========================================================================

function parametroPlan() {
  if (typeof window === 'undefined') return 'Business';
  return new URLSearchParams(window.location.search).get('plan') || 'Business';
}

function parametroRetorno() {
  if (typeof window === 'undefined') return '';
  const returnTo = new URLSearchParams(window.location.search).get('returnTo') ?? '';
  return returnTo.startsWith('/landing/checkout?') ? returnTo : '';
}

function modoInicial() {
  if (typeof window !== 'undefined' && window.location.pathname.includes('/login')) return 'login';
  if (typeof window !== 'undefined' && window.location.pathname.includes('/crear-empresa')) return 'empresa';
  return 'registro';
}

function irLanding() {
  window.history.pushState({}, '', '/landing');
  window.dispatchEvent(new Event('nexxus:navigate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Componente AuthPage. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function AuthPage() {
  const { t } = useTranslation();
  const modo = modoInicial();

  useEffect(() => {
    document.title = modo === 'login' ? t('landing_auth.page_title_login') : t('landing_auth.page_title_register');
  }, [t, modo]);

  return (
    <main className="nx-landing nx-auth-page">
      <div className="nx-orb nx-orb-a" aria-hidden="true" />
      <div className="nx-orb nx-orb-b" aria-hidden="true" />

      <div className="nx-nav-layer">
        <GlassSurface
          as="nav"
          backgroundOpacity={0.08}
          blur={8}
          borderRadius={999}
          brightness={58}
          displace={0.25}
          distortionScale={-34}
          greenOffset={3}
          blueOffset={6}
          saturation={1.24}
          className="nx-nav nx-hero-nav is-floating is-ready is-pinned nx-auth-page-nav"
          style={{ top: 8 }}
        >
          <button
            className="nx-policy-back nx-auth-page-back"
            onClick={irLanding}
            aria-label={t('landing_auth.nav_back_home')}
          >
            <svg fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14 7l-5 5 5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} />
              <path d="M9.5 12H18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} />
            </svg>
          </button>
        </GlassSurface>
      </div>

      <section className="nx-auth-page-stage">
        <div className="nx-auth-page-copy">
          <div className="nx-kicker">
            <span />
            {modo === 'login' ? t('landing_auth.kicker_login') : t('landing_auth.kicker_register')}
          </div>
          <h1>{modo === 'login' ? t('landing_auth.h1_login') : t('landing_auth.h1_register')}</h1>
          <p>{t('landing_auth.p_desc')}</p>
        </div>

        <LandingAuth modoInicial={modo} planSeleccionado={parametroPlan()} returnTo={parametroRetorno()} />
      </section>
    </main>
  );
}