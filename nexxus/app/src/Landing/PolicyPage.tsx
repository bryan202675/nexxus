/**
 * Documentacion Nexxus - nexxus/app/src/Landing/PolicyPage.tsx
 * Capa: landing.
 * Proposito: Pantalla informativa publica para seguridad y privacidad de Nexxus.
 */

import { createElement, ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../shared/i18n/config';
import BorderGlow from './BorderGlow';
import StarButton from './StarButton';
import './Landing.css';

const h = createElement;

type PolicyKind = 'security' | 'privacy';

type PolicySection = {
  title: string;
  text: string;
  items: string[];
};

const pageContent: Record<PolicyKind, {
  eyebrow: string;
  title: string;
  subtitle: string;
  heroIcons: { icon: string; label: string }[];
  sections: PolicySection[];
}> = {
  security: {
    eyebrow: 'landing.policy_security_eyebrow',
    title: 'landing.policy_security_title',
    subtitle: 'landing.policy_security_subtitle',
    heroIcons: [
      { icon: 'lock', label: 'landing.policy_security_icon_1' },
      { icon: 'shield', label: 'landing.policy_security_icon_2' },
      { icon: 'key', label: 'landing.policy_security_icon_3' },
      { icon: 'audit', label: 'landing.policy_security_icon_4' },
    ],
    sections: [
      {
        title: 'landing.policy_security_section_1_title',
        text: 'landing.policy_security_section_1_text',
        items: ['landing.policy_security_section_1_item_1', 'landing.policy_security_section_1_item_2', 'landing.policy_security_section_1_item_3'],
      },
      {
        title: 'landing.policy_security_section_2_title',
        text: 'landing.policy_security_section_2_text',
        items: ['landing.policy_security_section_2_item_1', 'landing.policy_security_section_2_item_2', 'landing.policy_security_section_2_item_3'],
      },
      {
        title: 'landing.policy_security_section_3_title',
        text: 'landing.policy_security_section_3_text',
        items: ['landing.policy_security_section_3_item_1', 'landing.policy_security_section_3_item_2', 'landing.policy_security_section_3_item_3'],
      },
      {
        title: 'landing.policy_security_section_4_title',
        text: 'landing.policy_security_section_4_text',
        items: ['landing.policy_security_section_4_item_1', 'landing.policy_security_section_4_item_2', 'landing.policy_security_section_4_item_3'],
      },
    ],
  },
  privacy: {
    eyebrow: 'landing.policy_privacy_eyebrow',
    title: 'landing.policy_privacy_title',
    subtitle: 'landing.policy_privacy_subtitle',
    heroIcons: [
      { icon: 'database', label: 'landing.policy_privacy_icon_1' },
      { icon: 'users', label: 'landing.policy_privacy_icon_2' },
      { icon: 'file', label: 'landing.policy_privacy_icon_3' },
      { icon: 'check', label: 'landing.policy_privacy_icon_4' },
    ],
    sections: [
      {
        title: 'landing.policy_privacy_section_1_title',
        text: 'landing.policy_privacy_section_1_text',
        items: ['landing.policy_privacy_section_1_item_1', 'landing.policy_privacy_section_1_item_2', 'landing.policy_privacy_section_1_item_3'],
      },
      {
        title: 'landing.policy_privacy_section_2_title',
        text: 'landing.policy_privacy_section_2_text',
        items: ['landing.policy_privacy_section_2_item_1', 'landing.policy_privacy_section_2_item_2', 'landing.policy_privacy_section_2_item_3'],
      },
      {
        title: 'landing.policy_privacy_section_3_title',
        text: 'landing.policy_privacy_section_3_text',
        items: ['landing.policy_privacy_section_3_item_1', 'landing.policy_privacy_section_3_item_2', 'landing.policy_privacy_section_3_item_3'],
      },
      {
        title: 'landing.policy_privacy_section_4_title',
        text: 'landing.policy_privacy_section_4_text',
        items: ['landing.policy_privacy_section_4_item_1', 'landing.policy_privacy_section_4_item_2', 'landing.policy_privacy_section_4_item_3'],
      },
    ],
  },
};

function currentKind(): PolicyKind {
  if (typeof window === 'undefined') return 'security';
  return window.location.pathname.includes('privacidad') ? 'privacy' : 'security';
}

function goTo(path: string) {
  if (path.startsWith('/landing#') || path === '/landing' || path === '/landing/seguridad' || path === '/landing/privacidad' || path === '/landing/login' || path === '/landing/registro') {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('nexxus:navigate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  window.location.assign(path);
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

const policyIconPaths: Record<string, string[]> = {
  audit: ['M4 5h16', 'M6 5v14h12V5', 'M9 10h6', 'M9 14h4'],
  check: ['M20 6L9 17l-5-5'],
  database: ['M4 6c0-2 16-2 16 0s-16 2-16 0z', 'M4 6v6c0 2 16 2 16 0V6', 'M4 12v6c0 2 16 2 16 0v-6'],
  file: ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M8 13h8', 'M8 17h6'],
  key: ['M15 7a4 4 0 11-2.8 6.8L5 21H2v-3l7.2-7.2A4 4 0 0115 7z', 'M16 7h.01'],
  lock: ['M7 11V8a5 5 0 0110 0v3', 'M5 11h14v10H5z'],
  shield: ['M12 2l8 4v6c0 5-3.3 8.6-8 10-4.7-1.4-8-5-8-10V6l8-4z', 'M9 12l2 2 4-5'],
  users: ['M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2', 'M9 11a4 4 0 100-8 4 4 0 000 8z', 'M22 21v-2a4 4 0 00-3-3.87'],
};

function PolicyIcon({ name }: { name: string }) {
  return h(
    'svg',
    { className: 'nx-policy-svg', fill: 'none', viewBox: '0 0 24 24', 'aria-hidden': true },
    policyIconPaths[name].map((path, index) => h('path', { d: path, key: index, stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.8 }))
  );
}

export default function PolicyPage() {
  const { t, i18n } = useTranslation();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const kind = currentKind();
  const content = pageContent[kind];
  const landingLinks = [
    [t('landing.nav_system'), '/landing#sistema'],
    [t('landing.nav_modules'), '/landing#modulos'],
    [t('landing.nav_admin'), '/landing#admin'],
    [t('landing.nav_plans'), '/landing#planes'],
    [t('landing.nav_ia'), '/landing#ia'],
  ];
  const alternate = useMemo(() => kind === 'security' ? {
    label: 'landing.policy_view_privacy',
    path: '/landing/privacidad',
  } : {
    label: 'landing.policy_view_security',
    path: '/landing/seguridad',
  }, [kind]);

  return h(
    'main',
    { className: `nx-landing nx-policy-page nx-policy-${kind}` },
    h('div', { className: 'nx-orb nx-orb-a', 'aria-hidden': true }),
    h('div', { className: 'nx-orb nx-orb-b', 'aria-hidden': true }),
    h(
      'nav',
      { className: 'nx-nav' },
      h('button', { className: 'nx-brand', onClick: () => goTo('/landing') }, h('span', null, 'N'), 'Nexxus'),
      h('div', { className: 'nx-nav-links' },
        landingLinks.map(([label, path]) => h('button', { key: label, onClick: () => goTo(path) }, label))
      ),
      h('div', { className: 'nx-nav-actions' },
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
        ),
        h('button', { className: 'nx-nav-login', onClick: () => goTo('/landing/login') }, t('landing.login')),
        h(StarButton, { className: 'nx-nav-cta', onClick: () => goTo('/landing/registro') }, t('landing.create_company'))
      ),
      h(
        'button',
        {
          'aria-expanded': menuMovilAbierto,
          'aria-label': menuMovilAbierto ? t('common.cancel') : t('landing.hero_kicker'),
          className: `nx-menu-toggle ${menuMovilAbierto ? 'is-open' : ''}`,
          onClick: () => setMenuMovilAbierto((abierto) => !abierto),
        },
        h('span', null),
        h('span', null)
      ),
      h(
        'div',
        { className: `nx-mobile-menu ${menuMovilAbierto ? 'is-open' : ''}` },
        landingLinks.map(([label, path]) => h('button', { key: label, onClick: () => { setMenuMovilAbierto(false); goTo(path); } }, label)),
        h('button', { onClick: () => { setMenuMovilAbierto(false); changeLanguage(i18n.language === 'es' ? 'en' : 'es'); } }, `${t('common.language')}: ${i18n.language === 'es' ? 'EN' : 'ES'}`),
        h('button', { onClick: () => { setMenuMovilAbierto(false); goTo('/landing/login'); } }, t('landing.login'))
      )
    ),
    h(
      'section',
      { className: 'nx-policy-hero nx-reveal is-visible' },
      h('div', null,
        h('div', { className: 'nx-kicker' }, h('span', null), t(content.eyebrow)),
        h('h1', null, t(content.title)),
        h('p', null, t(content.subtitle)),
        h('div', { className: 'nx-hero-actions' },
          h(StarButton, { className: 'nx-btn nx-btn-primary', onClick: () => goTo('/landing/registro') }, t('landing.create_company')),
          h('button', { className: 'nx-btn nx-btn-minimal', onClick: () => goTo(alternate.path) }, t(alternate.label))
        )
      ),
      h('div', { className: 'nx-policy-icons', 'aria-label': t(content.eyebrow) },
        content.heroIcons.map((item) =>
          h('div', { className: 'nx-policy-icon', key: item.label },
            h(PolicyIcon, { name: item.icon }),
            h('span', null, t(item.label))
          )
        )
      )
    ),
    h(
      'section',
      { className: 'nx-section nx-policy-content nx-reveal is-visible' },
      content.sections.map((section, index) =>
        h(GlowCard, { className: 'nx-policy-card', key: section.title },
          h('div', { className: 'nx-card-topline' }, h('span', null, `0${index + 1}`)),
          h('h2', null, t(section.title)),
          h('p', null, t(section.text)),
          h('ul', null, section.items.map((item) => h('li', { key: item }, t(item))))
        )
      )
    ),
    h(
      'footer',
      { className: 'nx-footer' },
      h('strong', null, 'Nexxus'),
      h('div', null,
        h('button', { onClick: () => goTo('/landing') }, t('landing.footer_product')),
        h('button', { onClick: () => goTo('/landing#planes') }, t('landing.footer_plans')),
        h('button', { onClick: () => goTo('/landing/seguridad') }, t('landing.footer_security')),
        h('button', { onClick: () => goTo('/landing/privacidad') }, t('landing.footer_privacy'))
      ),
      h('div', { className: 'nx-lang-selector', style: { display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px' } },
        h('span', { style: { color: 'rgba(255,255,255,0.5)', fontSize: '12px' } }, t('common.language') + ':'),
        h('button', {
          onClick: () => changeLanguage('es'),
          style: { background: 'none', border: 'none', color: i18n.language === 'es' ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: i18n.language === 'es' ? 'bold' : 'normal' }
        }, 'ES'),
        h('span', { style: { color: 'rgba(255,255,255,0.2)' } }, '|'),
        h('button', {
          onClick: () => changeLanguage('en'),
          style: { background: 'none', border: 'none', color: i18n.language === 'en' ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: i18n.language === 'en' ? 'bold' : 'normal' }
        }, 'EN')
      ),
      h('small', null, t('landing.policy_footer_note'))
    )
  );
}
