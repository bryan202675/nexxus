import React, { useEffect, useState } from 'react';
import './Landing.css';
import '../shared/i18n/config';

const landingRoutes = ['/', '/landing', '/src/landing', '/src/landing/index', '/src/landing/index.tsx'];
const nuevaRoutes = ['/landing/nueva'];
const infoRoutes = ['/landing/seguridad', '/landing/privacidad'];
const supportRoutes = ['/landing/soporte'];
const checkoutRoutes = ['/landing/checkout'];
const accountRoutes = ['/landing/cuenta'];
const authRoutes = ['/landing/registro', '/landing/login', '/landing/crear-empresa'];

function injectLandingHead() {
  if (typeof document === 'undefined') return;
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

function resolveSurface(pathname: string) {
  if (nuevaRoutes.includes(pathname)) return require('./LandingNueva/index').default;
  if (accountRoutes.includes(pathname)) return require('./AccountPage').default;
  if (checkoutRoutes.includes(pathname)) return require('./CheckoutPage').default;
  if (authRoutes.includes(pathname)) return require('./AuthPage').default;
  if (supportRoutes.includes(pathname)) return require('./SupportPage').default;
  if (infoRoutes.includes(pathname)) return require('./PolicyPage').default;
  return require('./Index').default;
}

export function isLandingPath(pathname: string) {
  return [...landingRoutes, ...nuevaRoutes, ...infoRoutes, ...supportRoutes, ...checkoutRoutes, ...accountRoutes, ...authRoutes].includes(pathname);
}

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
