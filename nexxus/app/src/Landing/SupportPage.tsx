/**
 * Soporte Nexxus - nexxus/app/src/Landing/SupportPage.tsx
 * Capa: landing.
 * Proposito: Pantalla publica de soporte y contacto.
 */

import { createElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import BorderGlow from './BorderGlow';
import GlassSurface from './GlassSurface';
import LandingFooter from './LandingFooter';
import StarButton from './StarButton';
import './Landing.css';

const h = createElement;

const supportChannels = [
  {
    icon: 'mail',
    title: 'Soporte técnico',
    text: 'Accesos, incidencias, configuración y operación diaria de la plataforma.',
    action: 'soporte@nexxus.app',
    href: 'mailto:soporte@nexxus.app?subject=Soporte%20Nexxus',
  },
  {
    icon: 'briefcase',
    title: 'Ventas empresariales',
    text: 'Planes, demos, implementación y acompañamiento para nuevas empresas.',
    action: 'ventas@nexxus.app',
    href: 'mailto:ventas@nexxus.app?subject=Ventas%20Nexxus',
  },
  {
    icon: 'receipt',
    title: 'Facturación',
    text: 'Pagos, comprobantes, cambios de plan y consultas administrativas.',
    action: 'facturacion@nexxus.app',
    href: 'mailto:facturacion@nexxus.app?subject=Facturacion%20Nexxus',
  },
];

const supportAreas = [
  {
    title: 'Implementación y onboarding',
    text: 'Acompañamos la creación de la empresa, roles iniciales, estructura operativa y primer flujo de trabajo.',
    items: ['Configuración inicial', 'Activación de equipos', 'Revisión de permisos'],
  },
  {
    title: 'Soporte operativo',
    text: 'Atendemos bloqueos de acceso, dudas de uso, incidencias de módulos y seguimiento de casos activos.',
    items: ['Accesos y usuarios', 'Incidencias funcionales', 'Estado de solicitudes'],
  },
  {
    title: 'Administración de cuenta',
    text: 'Gestionamos consultas comerciales, facturación, cambios de plan y necesidades de crecimiento.',
    items: ['Planes y licencias', 'Pagos y comprobantes', 'Escalamiento empresarial'],
  },
  {
    title: 'Seguridad y privacidad',
    text: 'Canalizamos solicitudes sensibles relacionadas con datos, controles internos y políticas de uso.',
    items: ['Protección de datos', 'Revisión de accesos', 'Consultas de privacidad'],
  },
];

const supportIconPaths: Record<string, string[]> = {
  briefcase: ['M10 6V5a2 2 0 012-2h0a2 2 0 012 2v1', 'M3 8h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8z', 'M3 12h18', 'M9 12v2h6v-2'],
  clock: ['M12 22a10 10 0 100-20 10 10 0 000 20z', 'M12 6v6l4 2'],
  mail: ['M4 6h16v12H4z', 'M4 7l8 6 8-6'],
  receipt: ['M6 3h12v18l-3-2-3 2-3-2-3 2V3z', 'M9 8h6', 'M9 12h6', 'M9 16h4'],
  shield: ['M12 2l8 4v6c0 5-3.3 8.6-8 10-4.7-1.4-8-5-8-10V6l8-4z', 'M9 12l2 2 4-5'],
  spark: ['M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z'],
};

function goTo(path: string) {
  if (path.startsWith('/landing#') || path === '/landing' || path === '/landing/seguridad' || path === '/landing/privacidad' || path === '/landing/soporte' || path === '/landing/login' || path === '/landing/registro') {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('nexxus:navigate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  window.location.assign(path);
}

function openExternal(href: string) {
  window.location.href = href;
}

function GlowCard({ children, className }: { children?: ReactNode; className: string }) {
  return h(
    BorderGlow,
    {
      backgroundColor: 'rgba(12, 9, 27, 0.76)',
      className,
      colors: ['#8b5cf6', '#a855f7', '#38bdf8'],
      glowColor: '268 88 72',
      glowIntensity: 0.7,
      glowRadius: 24,
    },
    children
  );
}

function SupportIcon({ name }: { name: string }) {
  return h(
    'svg',
    { className: 'nx-policy-svg', fill: 'none', viewBox: '0 0 24 24', 'aria-hidden': true },
    supportIconPaths[name].map((path, index) => h('path', { d: path, key: index, stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.8 }))
  );
}

export default function SupportPage() {
  const { t } = useTranslation();

  return h(
    'main',
    { className: 'nx-landing nx-policy-page nx-support-page' },
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
          className: 'nx-nav nx-hero-nav is-floating is-ready is-pinned nx-policy-nav',
          style: { top: 8 },
        },
        h(
          'button',
          { className: 'nx-policy-back', onClick: () => goTo('/landing'), 'aria-label': 'Volver a la landing' },
          h(
            'svg',
            { fill: 'none', viewBox: '0 0 24 24', 'aria-hidden': true },
            h('path', { d: 'M14 7l-5 5 5 5', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2.2 }),
            h('path', { d: 'M9.5 12H18', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2.2 })
          )
        )
      ),
    ),
    h(
      'section',
      { className: 'nx-policy-hero nx-support-hero nx-reveal is-visible' },
      h('div', null,
        h('div', { className: 'nx-kicker' }, h('span', null), 'Soporte Nexxus'),
        h('h1', null, 'Soporte y contacto para empresas que operan con Nexxus.'),
        h('p', null, 'Centralizamos los canales de ayuda para implementación, soporte técnico, facturación y consultas de seguridad.'),
        h('div', { className: 'nx-hero-actions' },
          h(StarButton, { className: 'nx-btn nx-btn-primary', onClick: () => goTo('/landing/registro') }, t('landing.create_company')),
          h('button', { className: 'nx-btn nx-btn-minimal', onClick: () => openExternal('mailto:soporte@nexxus.app?subject=Contacto%20Nexxus') }, 'Contactar soporte')
        )
      ),
      h('div', { className: 'nx-support-summary', 'aria-label': 'Resumen de soporte' },
        h('div', null, h(SupportIcon, { name: 'clock' }), h('strong', null, 'Mismo dia habil'), h('span', null, 'Primer contacto para solicitudes empresariales')),
        h('div', null, h(SupportIcon, { name: 'shield' }), h('strong', null, 'Casos prioritarios'), h('span', null, 'Escalamiento para accesos y operacion critica')),
        h('div', null, h(SupportIcon, { name: 'spark' }), h('strong', null, 'Acompanamiento'), h('span', null, 'Guia para activacion y crecimiento'))
      )
    ),
    h(
      'section',
      { className: 'nx-section nx-support-channels nx-reveal is-visible' },
      supportChannels.map((channel) =>
        h(GlowCard, { className: 'nx-support-channel', key: channel.title },
          h(SupportIcon, { name: channel.icon }),
          h('h2', null, channel.title),
          h('p', null, channel.text),
          h('button', { onClick: () => openExternal(channel.href) }, channel.action)
        )
      )
    ),
    h(
      'section',
      { className: 'nx-section nx-policy-content nx-support-content nx-reveal is-visible' },
      supportAreas.map((area, index) =>
        h(GlowCard, { className: 'nx-policy-card', key: area.title },
          h('div', { className: 'nx-card-topline' }, h('span', null, `0${index + 1}`)),
          h('h2', null, area.title),
          h('p', null, area.text),
          h('ul', null, area.items.map((item) => h('li', { key: item }, item)))
        )
      )
    ),
    h(LandingFooter)
  );
}
