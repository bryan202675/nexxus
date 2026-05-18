import { createElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DarkVeil from './DarkVeil';
import LandingAuth from './LandingAuth';
import StarButton from './StarButton';
import { changeLanguage } from '../shared/i18n/config';
import './Landing.css';
import './AuthPage.css';

const h = createElement;

function parametroPlan() {
  if (typeof window === 'undefined') return 'Business';
  return new URLSearchParams(window.location.search).get('plan') || 'Business';
}

function modoInicial() {
  if (typeof window !== 'undefined' && window.location.pathname.includes('/login')) return 'login';
  return 'registro';
}

function irLanding() {
  window.location.assign('/landing');
}

export default function AuthPage() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = modoInicial() === 'login' ? t('landing_auth.page_title_login') : t('landing_auth.page_title_register');
  }, [t]);

  return h(
    'main',
    { className: 'nx-auth-page' },
    h(DarkVeil, {
      noiseIntensity: 0.012,
      resolutionScale: 0.68,
      speed: 0.34,
      warpAmount: 0.055,
    }),
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
      h(StarButton, { className: 'nx-auth-back', onClick: irLanding }, t('landing_auth.nav_back_home'))
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
