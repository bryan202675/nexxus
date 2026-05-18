import { createElement, ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../shared/i18n/config';
import BorderGlow from './BorderGlow';
import DarkVeil from './DarkVeil';
import StarBorder from './StarBorder';
import './Landing.css';

const h = createElement;

type BillingCycle = 'monthly' | 'annual';
type IconName = 'activity' | 'ai' | 'analytics' | 'automation' | 'briefcase' | 'building' | 'chart' | 'check' | 'clock' | 'command' | 'database' | 'file' | 'lock' | 'message' | 'payroll' | 'shield' | 'spark' | 'users' | 'workflow' | 'zap';

const modules: [string, string, IconName][] = [
  ['landing.module_dashboard_title', 'landing.module_dashboard_desc', 'command'],
  ['landing.module_employees_title', 'landing.module_employees_desc', 'users'],
  ['landing.module_tasks_title', 'landing.module_tasks_desc', 'check'],
  ['landing.module_ai_title', 'landing.module_ai_desc', 'ai'],
  ['landing.module_payroll_title', 'landing.module_payroll_desc', 'payroll'],
  ['landing.module_attendance_title', 'landing.module_attendance_desc', 'clock'],
  ['landing.module_analytics_title', 'landing.module_analytics_desc', 'analytics'],
  ['landing.module_communication_title', 'landing.module_communication_desc', 'message'],
  ['landing.module_multi_title', 'landing.module_multi_desc', 'building'],
];

const plans = [
  {
    name: 'Starter',
    monthly: 20,
    badge: 'landing.starter_badge',
    users: 'landing.starter_users',
    benefits: ['landing.starter_benefit1', 'landing.starter_benefit2', 'landing.starter_benefit3', 'landing.starter_benefit4'],
  },
  {
    name: 'Business',
    monthly: 50,
    badge: 'landing.business_badge',
    users: 'landing.business_users',
    benefits: ['landing.business_benefit1', 'landing.business_benefit2', 'landing.business_benefit3', 'landing.business_benefit4'],
    featured: true,
  },
  {
    name: 'Enterprise',
    monthly: 200,
    badge: 'landing.enterprise_badge',
    users: 'landing.enterprise_users',
    benefits: ['landing.enterprise_benefit1', 'landing.enterprise_benefit2', 'landing.enterprise_benefit3', 'landing.enterprise_benefit4'],
  },
];

const metrics = [
  ['34%', 'landing.less_ops_time'],
  ['4.8x', 'landing.more_traceability'],
  ['72h', 'landing.to_activate_teams'],
  ['99.9%', 'landing.centralized_vision'],
];

const iconPaths: Record<IconName, string[]> = {
  activity: ['M22 12h-4l-3 8-6-16-3 8H2'],
  ai: ['M12 2l1.6 5.2L19 8.8l-5.4 1.6L12 16l-1.6-5.6L5 8.8l5.4-1.6L12 2z', 'M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z'],
  analytics: ['M4 19V5', 'M4 19h16', 'M8 16v-5', 'M12 16V8', 'M16 16v-8'],
  automation: ['M4 12a8 8 0 0114.8-4.2', 'M20 4v5h-5', 'M20 12a8 8 0 01-14.8 4.2', 'M4 20v-5h5'],
  briefcase: ['M10 6V5a2 2 0 012-2h0a2 2 0 012 2v1', 'M3 8h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8z', 'M3 13h18'],
  building: ['M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16', 'M16 9h2a2 2 0 012 2v10', 'M8 7h4', 'M8 11h4', 'M8 15h4'],
  chart: ['M4 19V5', 'M4 19h16', 'M7 15l4-4 3 3 5-7'],
  check: ['M20 6L9 17l-5-5'],
  clock: ['M12 22a10 10 0 100-20 10 10 0 000 20z', 'M12 6v6l4 2'],
  command: ['M8 8H6a3 3 0 110-6 3 3 0 013 3v14a3 3 0 11-3-3h12a3 3 0 113 3 3 3 0 01-3-3V5a3 3 0 113 3H6'],
  database: ['M4 6c0-2 16-2 16 0s-16 2-16 0z', 'M4 6v6c0 2 16 2 16 0V6', 'M4 12v6c0 2 16 2 16 0v-6'],
  file: ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M8 13h8', 'M8 17h6'],
  lock: ['M7 11V8a5 5 0 0110 0v3', 'M5 11h14v10H5z'],
  message: ['M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z'],
  payroll: ['M4 7h16v10H4z', 'M8 11h8', 'M8 15h4', 'M17 7V5', 'M7 7V5'],
  shield: ['M12 2l8 4v6c0 5-3.3 8.6-8 10-4.7-1.4-8-5-8-10V6l8-4z', 'M9 12l2 2 4-5'],
  spark: ['M13 2L3 14h8l-1 8 10-12h-8l1-8z'],
  users: ['M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2', 'M9 11a4 4 0 100-8 4 4 0 000 8z', 'M22 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75'],
  workflow: ['M6 4a2 2 0 100 4 2 2 0 000-4z', 'M18 16a2 2 0 100 4 2 2 0 000-4z', 'M6 8v3a3 3 0 003 3h6a3 3 0 013 3v-1', 'M18 4v6', 'M15 7h6'],
  zap: ['M13 2L3 14h8l-1 8 10-12h-8l1-8z'],
};

function Icon({ name }: { name: IconName }) {
  return h(
    'svg',
    { className: 'nx-icon', fill: 'none', viewBox: '0 0 24 24', 'aria-hidden': true },
    iconPaths[name].map((path, index) => h('path', { d: path, key: index, stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.9 }))
  );
}

function GlowCard({ children, className, animated = false }: { animated?: boolean; children?: ReactNode; className: string }) {
  return h(
    BorderGlow,
    {
      animated,
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

function StarButton({
  children,
  className = '',
  onClick,
  type = 'button',
}: {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  return h(
    StarBorder,
    {
      as: 'button',
      className: `nx-star-button ${className}`,
      color: '#d8b4fe',
      onClick,
      speed: '5s',
      thickness: 1,
      type,
    },
    children
  );
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function abrirAuth(modo: 'registro' | 'login', plan = 'Business') {
  const ruta = modo === 'login' ? '/landing/login' : '/landing/registro';
  window.location.assign(`${ruta}?plan=${encodeURIComponent(plan)}`);
}

function priceFor(monthly: number, cycle: BillingCycle) {
  return cycle === 'annual' ? Math.round(monthly * 12 * 0.6) : monthly;
}

export default function Landing() {
  const { t, i18n } = useTranslation();
  const [billing, setBilling] = useState<BillingCycle>('annual');
  const [selectedPlan, setSelectedPlan] = useState('Business');
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  useEffect(() => {
    document.title = 'Nexxus | Impulsa tu empresa con rendimiento real';
    const description = 'Nexxus centraliza empleados, tareas, asistencia, nómina, IA y analytics para empresas modernas.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    const revealItems = Array.from(document.querySelectorAll('.nx-reveal'));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.16 }
    );
    revealItems.forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
    };
  }, []);

  const choosePlan = (plan: string) => {
    setSelectedPlan(plan);
  };

  const enlacesNav: [string, string][] = [
    [t('landing.nav_system'), 'sistema'],
    [t('landing.nav_modules'), 'modulos'],
    [t('landing.nav_admin'), 'admin'],
    [t('landing.nav_plans'), 'planes'],
    [t('landing.nav_ia'), 'ia'],
  ];

  const navegarA = (id: string) => {
    setMenuMovilAbierto(false);
    scrollToId(id);
  };

  return h(
    'main',
    { className: 'nx-landing' },
    h(DarkVeil, {
      noiseIntensity: 0.015,
      resolutionScale: 0.72,
      speed: 0.38,
      warpAmount: 0.06,
    }),
    h('div', { className: 'nx-orb nx-orb-a', 'aria-hidden': true }),
    h('div', { className: 'nx-orb nx-orb-b', 'aria-hidden': true }),
    h(
      'nav',
      { className: 'nx-nav' },
      h('button', { className: 'nx-brand', onClick: () => scrollToId('hero') }, h('span', null, 'N'), 'Nexxus'),
      h(
        'div',
        { className: 'nx-nav-links' },
        enlacesNav.map(([label, id]) => h('button', { key: label, onClick: () => navegarA(id) }, label))
      ),
      h(
        'div',
        { className: 'nx-nav-actions' },
        h('button', { className: 'nx-nav-login', onClick: () => abrirAuth('login', selectedPlan) }, t('landing.login')),
        h(StarButton, { className: 'nx-nav-cta', onClick: () => abrirAuth('registro', selectedPlan) }, t('landing.create_company'))
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
        enlacesNav.map(([label, id]) => h('button', { key: label, onClick: () => navegarA(id) }, label)),
        h('button', { onClick: () => abrirAuth('login', selectedPlan) }, t('landing.login'))
      )
    ),
    h(
      'section',
      { className: 'nx-hero', id: 'hero' },
      h(
        'div',
        { className: 'nx-hero-copy nx-reveal is-visible' },
        h('div', { className: 'nx-kicker' }, h('span', null), t('landing.hero_kicker')),
        h('h1', null, t('landing.hero_title')),
        h('p', null, t('landing.hero_subtitle')),
        h(
          'div',
          { className: 'nx-hero-actions' },
          h(StarButton, { className: 'nx-btn nx-btn-primary', onClick: () => abrirAuth('registro', selectedPlan) }, h(Icon, { name: 'building' }), t('landing.create_company')),
          h('button', { className: 'nx-btn nx-btn-ghost', onClick: () => scrollToId('sistema') }, h(Icon, { name: 'chart' }), t('landing.view_demo')),
          h('button', { className: 'nx-btn nx-btn-minimal', onClick: () => scrollToId('planes') }, h(Icon, { name: 'briefcase' }), t('landing.know_plans'))
        ),
        h(
          'div',
          { className: 'nx-trust-row' },
          metrics.map(([value, label], index) => h(GlowCard, { className: 'nx-metric-card', key: label }, h(Icon, { name: index === 0 ? 'zap' : index === 1 ? 'shield' : index === 2 ? 'clock' : 'activity' }), h('strong', null, value), h('span', null, t(label))))
        )
      ),
      h(
        'div',
        { className: 'nx-dashboard-shell nx-reveal is-visible' },
        h('div', { className: 'nx-window-bar' }, h('span', null), h('span', null), h('span', null), h('strong', null, 'Nexxus Command')),
        h(
          'div',
          { className: 'nx-dashboard-grid' },
          h('div', { className: 'nx-panel nx-panel-main' }, h('span', null, t('landing.productivity')), h('strong', null, '87%'), h('div', { className: 'nx-chart' }, h('i'), h('i'), h('i'), h('i'), h('i'))),
          h('div', { className: 'nx-panel' }, h('span', null, 'Nexus IA'), h('strong', null, `12 ${t('landing.ai_alerts_resolved')}`), h('p', null, t('landing.low_ops_risk'))),
          h('div', { className: 'nx-panel' }, h('span', null, t('landing.attendance')), h('strong', null, `142 ${t('landing.active_employees')}`), h('p', null, `3 ${t('landing.synced_locations')}`)),
          h('div', { className: 'nx-panel nx-table-panel' }, h('span', null, t('landing.operation')), [t('landing.payroll_ready'), t('landing.critical_tasks'), t('landing.pending_checkins')].map((item) => h('b', { key: item }, item, h('em', null))))
        )
      )
    ),
    h(
      'section',
      { className: 'nx-section nx-reveal', id: 'sistema' },
      h('div', { className: 'nx-section-head' }, h('span', null, t('landing.section_system_title')), h('h2', null, t('landing.section_system_h2')), h('p', null, t('landing.section_system_p'))),
      h(
        'div',
        { className: 'nx-value-grid' },
        [
          [t('landing.value_auto_title'), t('landing.value_auto_desc'), 'automation'],
          [t('landing.value_realtime_title'), t('landing.value_realtime_desc'), 'activity'],
          [t('landing.value_ai_title'), t('landing.value_ai_desc'), 'ai'],
        ].map(([title, text, icon], index) => h(GlowCard, { animated: index === 0, className: 'nx-value-card', key: title }, h('div', { className: 'nx-card-topline' }, h(Icon, { name: icon as IconName }), h('span', null, `0${index + 1}`)), h('h3', null, title), h('p', null, text)))
      )
    ),
    h(
      'section',
      { className: 'nx-section nx-reveal', id: 'modulos' },
      h('div', { className: 'nx-section-head' }, h('span', null, t('landing.section_modules_title')), h('h2', null, t('landing.section_modules_h2')), h('p', null, t('landing.section_modules_p'))),
      h('div', { className: 'nx-module-grid' }, modules.map(([title, text, icon]) => h(GlowCard, { className: 'nx-module-card', key: title }, h('div', { className: 'nx-module-icon' }, h(Icon, { name: icon })), h('h3', null, t(title)), h('p', null, t(text)))))
    ),
    h(
      'section',
      { className: 'nx-admin-section nx-reveal', id: 'admin' },
      h('div', { className: 'nx-admin-copy' }, h('span', null, t('landing.section_admin_title')), h('h2', null, t('landing.section_admin_h2')), h('p', null, t('landing.section_admin_p'))),
      h(
        GlowCard,
        { className: 'nx-admin-console' },
        h('div', null, h('strong', null, `${t('landing.live_operations')}      `), h('span', null, t('landing.system_active'))),
        h('ul', null, [t('landing.team'), t('landing.payroll'), t('landing.audit'), t('landing.communication')].map((item, index) => h('li', { key: item }, h('span', null, item), h('b', null, `${92 - index * 7}%`)))),
        h('div', { className: 'nx-radar' }, h('i'), h('i'), h('i'))
      )
    ),
    h(
      'section',
      { className: 'nx-section nx-reveal', id: 'seguridad' },
      h('div', { className: 'nx-section-head' }, h('span', null, t('landing.section_security_title')), h('h2', null, t('landing.section_security_h2')), h('p', null, t('landing.section_security_p'))),
      h(
        'div',
        { className: 'nx-ops-grid' },
        [
          [t('landing.ops_audit_title'), t('landing.ops_audit_desc'), 'shield'],
          [t('landing.ops_data_title'), t('landing.ops_data_desc'), 'database'],
          [t('landing.ops_workflows_title'), t('landing.ops_workflows_desc'), 'workflow'],
          [t('landing.ops_docs_title'), t('landing.ops_docs_desc'), 'file'],
        ].map(([title, text, icon]) => h(GlowCard, { className: 'nx-ops-card', key: title }, h(Icon, { name: icon as IconName }), h('h3', null, title), h('p', null, text)))
      )
    ),
    h(
      'section',
      { className: 'nx-integrations nx-reveal' },
      h('div', null, h('span', null, t('landing.section_impl_title')), h('h2', null, t('landing.section_impl_h2')), h('p', null, t('landing.section_impl_p'))),
      h(
        'div',
        { className: 'nx-integration-rail' },
        [t('landing.cloud_data'), t('landing.hr'), t('landing.payroll'), t('landing.real_data'), t('landing.docs'), t('landing.inbox')].map((item, index) => h('span', { key: item }, h(Icon, { name: index === 0 ? 'database' : index === 1 ? 'users' : index === 2 ? 'payroll' : index === 3 ? 'analytics' : index === 4 ? 'file' : 'message' }), item))
      )
    ),
    h(
      'section',
      { className: 'nx-section nx-reveal', id: 'planes' },
      h(
        'div',
        { className: 'nx-pricing-head' },
        h('div', null, h('span', null, t('landing.section_plans_title')), h('h2', null, t('landing.section_plans_h2'))),
        h('div', { className: 'nx-toggle', role: 'group', 'aria-label': 'Facturación' }, h('button', { className: billing === 'monthly' ? 'active' : '', onClick: () => setBilling('monthly') }, t('landing.billing_monthly')), h('button', { className: billing === 'annual' ? 'active' : '', onClick: () => setBilling('annual') }, t('landing.billing_annual')))
      ),
      h(
        'div',
        { className: 'nx-plan-grid' },
        plans.map((plan) =>
          h(
            GlowCard,
            { className: `nx-plan ${plan.featured ? 'featured' : ''} ${selectedPlan === plan.name ? 'selected' : ''}`, key: plan.name },
            h('div', { className: 'nx-plan-header' }, h(Icon, { name: plan.name === 'Starter' ? 'briefcase' : plan.name === 'Business' ? 'zap' : 'shield' }), h('span', { className: 'nx-plan-badge' }, t(plan.badge))),
            h('h3', null, plan.name),
            h('div', { className: 'nx-price' }, '$', priceFor(plan.monthly, billing), h('small', null, billing === 'annual' ? `/${t('common.year')}` : `/${t('common.month')}`)),
            h('p', null, t(plan.users)),
            h('ul', null, plan.benefits.map((benefit) => h('li', { key: benefit }, t(benefit)))),
            h('button', { className: 'nx-btn nx-btn-plan', onClick: () => { choosePlan(plan.name); abrirAuth('registro', plan.name); } }, selectedPlan === plan.name ? t('landing.create_with_this_plan') : t('landing.choose_plan'))
          )
        )
      )
    ),
    h(
      'section',
      { className: 'nx-ai-section nx-reveal', id: 'ia' },
      h('div', { className: 'nx-ai-core' }, h('span', null, t('landing.section_ai_title')), h('h2', null, t('landing.section_ai_h2')), h('p', null, t('landing.section_ai_p'))),
      h('div', { className: 'nx-ai-stream' }, [t('landing.ai_stream_item1'), t('landing.ai_stream_item2'), t('landing.ai_stream_item3'), t('landing.ai_stream_item4')].map((item) => h('div', { key: item }, h('span', null), item)))
    ),
    h(
      'section',
      { className: 'nx-testimonials nx-reveal' },
      metrics.map(([value, label], index) => h(GlowCard, { className: 'nx-testimonial-metric', key: label }, h(Icon, { name: index === 0 ? 'zap' : index === 1 ? 'shield' : index === 2 ? 'clock' : 'activity' }), h('strong', null, value), h('span', null, t(label)))),
      h('blockquote', null, t('landing.testimonial_quote'))
    ),
    h(
      'section',
      { className: 'nx-final-cta nx-reveal' },
      h('h2', null, t('landing.final_cta_h2')),
      h('p', null, t('landing.final_cta_p')),
      h(StarButton, { className: 'nx-btn nx-btn-primary', onClick: () => abrirAuth('registro', selectedPlan) }, t('landing.create_company'))
    ),
    h(
      'footer',
      { className: 'nx-footer' },
      h('strong', null, 'Nexxus'),
      h('div', null, [t('landing.footer_product'), t('landing.footer_plans'), t('landing.footer_security'), t('landing.footer_contact'), t('landing.footer_privacy')].map((item) => h('button', { key: item, onClick: () => item === t('landing.footer_plans') ? scrollToId('planes') : scrollToId('hero') }, item))),
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
      h('span', null, t('landing.footer_tagline'))
    )
  );
}
