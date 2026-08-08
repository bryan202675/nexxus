/**
 * Documentacion Nexxus - apps/mobile/src/Landing/PolicyPage.tsx
 * Capa: landing.
 * Proposito: Pantalla informativa publica para seguridad y privacidad de Nexxus.
 */

import { ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import BorderGlow from './BorderGlow';
import GlassSurface from './GlassSurface';
import LandingFooter from './LandingFooter';
import StarButton from './StarButton';
import './Landing.css';

type PolicyKind = 'security' | 'privacy';

type PolicySection = {
  title: string;
  text: string;
  items: string[];
};

// ---------------------------------------------------------------------------
// Contenido de cada tipo de política
// ---------------------------------------------------------------------------

const pageContent: Record<PolicyKind, {
  eyebrow: string;
  title: string;
  subtitle: string;
  heroIcons: { icon: string; label: string }[];
  sections: PolicySection[];
}> = {
  // ---- Seguridad ----
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
  // ---- Privacidad ----
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

// ---------------------------------------------------------------------------
// Utilidades de ruta
// ---------------------------------------------------------------------------

function currentKind(): PolicyKind {
  if (typeof window === 'undefined') return 'security';
  return window.location.pathname.includes('privacidad') ? 'privacy' : 'security';
}

function goTo(path: string) {
  if (path.startsWith('/landing#') || path === '/landing' || path === '/landing/seguridad' || path === '/landing/privacidad' || path === '/landing/soporte' || path === '/landing/login' || path === '/landing/registro') {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('nexxus:navigate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  window.location.assign(path);
}

// ---------------------------------------------------------------------------
// Tarjeta con borde luminoso
// ---------------------------------------------------------------------------

function GlowCard({ children, className }: { children?: ReactNode; className: string }) {
  return (
    <BorderGlow
      backgroundColor="rgba(12, 9, 27, 0.76)"
      className={className}
      colors={['#8b5cf6', '#a855f7', '#38bdf8']}
      glowColor="268 88 72"
      glowIntensity={0.7}
      glowRadius={24}
    >
      {children}
    </BorderGlow>
  );
}

// ---------------------------------------------------------------------------
// Íconos de la página
// ---------------------------------------------------------------------------

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
  return (
    <svg className="nx-policy-svg" fill="none" viewBox="0 0 24 24" aria-hidden={true}>
      {policyIconPaths[name].map((path, index) => (
        <path
          d={path}
          key={index}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function PolicyPage() {
  const { t } = useTranslation();
  const kind = currentKind();
  const content = pageContent[kind];
  const alternate = useMemo(
    () =>
      kind === 'security'
        ? {
            label: 'landing.policy_view_privacy',
            path: '/landing/privacidad',
          }
        : {
            label: 'landing.policy_view_security',
            path: '/landing/seguridad',
          },
    [kind]
  );

  return (
    <main className={`nx-landing nx-policy-page nx-policy-${kind}`}>
      {/* Fondo decorativo */}
      <div className="nx-orb nx-orb-a" aria-hidden={true} />
      <div className="nx-orb nx-orb-b" aria-hidden={true} />

      {/* Navegación (botón volver) */}
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
          className="nx-nav nx-hero-nav is-floating is-ready is-pinned nx-policy-nav"
          style={{ top: 8 }}
        >
          <button
            className="nx-policy-back"
            onClick={() => goTo('/landing')}
            aria-label={t('landing.footer_product')}
          >
            <svg fill="none" viewBox="0 0 24 24" aria-hidden={true}>
              <path
                d="M14 7l-5 5 5 5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
              />
              <path
                d="M9.5 12H18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
              />
            </svg>
          </button>
        </GlassSurface>
      </div>

      {/* Hero: título, subtítulo, CTA e íconos */}
      <section className="nx-policy-hero nx-reveal is-visible">
        <div>
          <div className="nx-kicker">
            <span />
            {t(content.eyebrow)}
          </div>
          <h1>{t(content.title)}</h1>
          <p>{t(content.subtitle)}</p>
          <div className="nx-hero-actions">
            <StarButton className="nx-btn nx-btn-primary" onClick={() => goTo('/landing/registro')}>
              {t('landing.create_company')}
            </StarButton>
            <button className="nx-btn nx-btn-minimal" onClick={() => goTo(alternate.path)}>
              {t(alternate.label)}
            </button>
          </div>
        </div>
        <div className="nx-policy-icons" aria-label={t(content.eyebrow)}>
          {content.heroIcons.map((item) => (
            <div className="nx-policy-icon" key={item.label}>
              <PolicyIcon name={item.icon} />
              <span>{t(item.label)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Contenido: tarjetas de secciones de la política */}
      <section className="nx-section nx-policy-content nx-reveal is-visible">
        {content.sections.map((section, index) => (
          <GlowCard className="nx-policy-card" key={section.title}>
            <div className="nx-card-topline">
              <span>{`0${index + 1}`}</span>
            </div>
            <h2>{t(section.title)}</h2>
            <p>{t(section.text)}</p>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{t(item)}</li>
              ))}
            </ul>
          </GlowCard>
        ))}
      </section>

      <LandingFooter />
    </main>
  );
}