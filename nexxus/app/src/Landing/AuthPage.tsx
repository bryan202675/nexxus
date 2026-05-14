import { createElement, useEffect } from 'react';
import DarkVeil from './DarkVeil';
import LandingAuth from './LandingAuth';
import StarButton from './StarButton';
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
  useEffect(() => {
    document.title = modoInicial() === 'login' ? 'Iniciar sesión | Nexxus' : 'Crear empresa | Nexxus';
  }, []);

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
      h('button', { className: 'nx-brand', onClick: irLanding }, h('span', null, 'N'), 'Nexxus'),
      h('button', { 'aria-label': 'Volver a la landing', className: 'nx-auth-mobile-back', onClick: irLanding }, h('span', null)),
      h(StarButton, { className: 'nx-auth-back', onClick: irLanding }, 'Volver al inicio')
    ),
    h(
      'section',
      { className: 'nx-auth-page-stage' },
      h(
        'div',
        { className: 'nx-auth-page-copy' },
        h('div', { className: 'nx-kicker' }, h('span', null), modoInicial() === 'login' ? 'Acceso administrador' : 'Onboarding empresarial'),
        h('h1', null, modoInicial() === 'login' ? 'Entra a tu centro de control.' : 'Activa tu empresa en Nexxus.'),
        h('p', null, 'Empieza ahora y lleva tu empresa al siguiente nivel. Nexxus convierte la administración diaria en una operación medible, elegante y lista para crecer.')
      ),
      h(LandingAuth, { modoInicial: modoInicial(), planSeleccionado: parametroPlan() })
    )
  );
}
