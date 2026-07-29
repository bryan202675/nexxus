import React, { useEffect, useState } from 'react';
import './Landing.css';
import '../shared/i18n/config';

// ---------------------------------------------------------------------------
// Tablas de rutas
// ---------------------------------------------------------------------------

const landingRoutes = ['/', '/landing', '/src/landing', '/src/landing/index', '/src/landing/index.tsx'];
const nuevaRoutes = ['/landing/nueva'];
const infoRoutes = ['/landing/seguridad', '/landing/privacidad'];
const supportRoutes = ['/landing/soporte'];
const checkoutRoutes = ['/landing/checkout'];
const accountRoutes = ['/landing/cuenta'];
const authRoutes = ['/landing/registro', '/landing/login', '/landing/crear-empresa'];

// ---------------------------------------------------------------------------
// Efectos de <head> / estilos globales
// ---------------------------------------------------------------------------

function injectLandingHead() {
  if (typeof document === 'undefined') return;

  // Preconnects + fuente Sora
  if (!document.querySelector('link[data-nx-font]')) {
    const preconnectFonts = document.createElement('link');
    preconnectFonts.rel = 'preconnect';
    preconnectFonts.href = 'https://fonts.googleapis.com';
    document.head.insertBefore(preconnectFonts, document.head.firstChild);

    const preconnectStatic = document.createElement('link');
    preconnectStatic.rel = 'preconnect';
    preconnectStatic.href = 'https://fonts.gstatic.com';
    (preconnectStatic as HTMLLinkElement).crossOrigin = 'anonymous';
    document.head.insertBefore(preconnectStatic, document.head.firstChild);

    const font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap';
    font.setAttribute('data-nx-font', 'sora');
    document.head.insertBefore(font, document.head.firstChild);
  }

  // Estilos globales de scroll (evitar rebote/scroll horizontal)
  if (!document.querySelector('style[data-nx-landing-scroll]')) {
    const style = document.createElement('style');
    style.setAttribute('data-nx-landing-scroll', 'true');
    style.textContent = `
      html, body, #root { overscroll-behavior-x: none !important; }
      body { -webkit-overflow-scrolling: touch !important; touch-action: pan-y !important; }
    `;
    document.head.appendChild(style);
  }
}

// ---------------------------------------------------------------------------
// Resolución de superficie (routing)
// ---------------------------------------------------------------------------

function resolveSurface(pathname: string) {
  if (nuevaRoutes.includes(pathname)) return require('./LandingNueva/index').default; // landing "nueva"
  if (accountRoutes.includes(pathname)) return require('./AccountPage').default; // cuenta
  if (checkoutRoutes.includes(pathname)) return require('./CheckoutPage').default; // checkout
  if (authRoutes.includes(pathname)) return require('./AuthPage').default; // registro / login / crear-empresa
  if (supportRoutes.includes(pathname)) return require('./SupportPage').default; // soporte
  if (infoRoutes.includes(pathname)) return require('./PolicyPage').default; // seguridad / privacidad
  return require('./Index').default; // landing principal (fallback)
}

export function isLandingPath(pathname: string) {
  return [...landingRoutes, ...nuevaRoutes, ...infoRoutes, ...supportRoutes, ...checkoutRoutes, ...accountRoutes, ...authRoutes].includes(pathname);
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function LandingRoot() {
  const [pathname, setPathname] = useState(() => (typeof window === 'undefined' ? '/landing' : window.location.pathname));
  const DarkVeil = require('./DarkVeil').default;
  const LandingSurface = resolveSurface(pathname);

  useEffect(() => {
    injectLandingHead();
    if (typeof window === 'undefined') return;
    const update = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', update);
    window.addEventListener('nexxus:navigate', update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('nexxus:navigate', update);
    };
  }, []);

  return (
    <>
      <DarkVeil
        maxFps={30}
        noiseIntensity={0.015}
        resolutionScale={0.56}
        speed={0.38}
        staticTime={18}
        warpAmount={0.06}
      />
      <LandingSurface />
    </>
  );
}