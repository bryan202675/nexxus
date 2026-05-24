/**
 * Documentacion Nexxus - nexxus/app/src/Landing/Index.tsx
 * Capa: landing.
 * Proposito: Pantalla o recurso visual del flujo publico de autenticacion/landing. Centraliza la presentacion inicial antes de entrar a la app privada.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { createElement, ReactNode, useEffect, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import { createElement, ReactNode, useEffect, useState } from 'react';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { changeLanguage }; inicializa o consume configuracion de internacionalizacion.
import { changeLanguage } from '../shared/i18n/config';
// Importa BorderGlow; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import BorderGlow from './BorderGlow';
// Importa StarBorder; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import StarBorder from './StarBorder';
// Importa StarButton; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import StarButton from './StarButton';
// Importa estilos CSS; aplica clases, animaciones o efectos visuales usados por este componente web.
import './Landing.css';

/**
 * Declaracion h. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const h = createElement;

/**
 * Describe la forma tipada BillingCycle; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type BillingCycle = 'monthly' | 'annual';
/**
 * Describe la forma tipada IconName; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type IconName = 'activity' | 'ai' | 'analytics' | 'automation' | 'briefcase' | 'building' | 'chart' | 'check' | 'clock' | 'command' | 'database' | 'file' | 'lock' | 'message' | 'payroll' | 'shield' | 'spark' | 'users' | 'workflow' | 'zap';

/**
 * Declaracion modules. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const modules: [string, string, IconName][] = [
  ['landing.module_ops_title', 'landing.module_ops_desc', 'command'],
  ['landing.module_people_title', 'landing.module_people_desc', 'users'],
  ['landing.module_comms_title', 'landing.module_comms_desc', 'message'],
  ['landing.module_intelligence_title', 'landing.module_intelligence_desc', 'analytics'],
];

/**
 * Declaracion plans. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const plans = [
  {
    name: 'Starter',
    monthly: 20,
    badge: 'landing.starter_badge',
    users: 'landing.starter_users',
    benefits: ['landing.starter_benefit1', 'landing.starter_benefit2', 'landing.starter_benefit3', 'landing.starter_benefit4'],
    detailGroups: [
      { title: 'landing.plan_company', items: ['landing.starter_company1', 'landing.starter_company2', 'landing.starter_company3', 'landing.starter_company4'] },
      { title: 'landing.plan_modules', items: ['landing.starter_module1', 'landing.starter_module2', 'landing.starter_module3', 'landing.starter_module4', 'landing.starter_module5', 'landing.starter_module6', 'landing.starter_module7'] },
      { title: 'landing.plan_limits', items: ['landing.starter_limit1', 'landing.starter_limit2', 'landing.starter_limit3', 'landing.starter_limit4', 'landing.starter_limit5', 'landing.starter_limit6', 'landing.starter_limit7'] },
    ],
  },
  {
    name: 'Business',
    monthly: 50,
    badge: 'landing.business_badge',
    users: 'landing.business_users',
    benefits: ['landing.business_benefit1', 'landing.business_benefit2', 'landing.business_benefit3', 'landing.business_benefit4'],
    detailGroups: [
      { title: 'landing.plan_scalability', items: ['landing.business_scale1', 'landing.business_scale2', 'landing.business_scale3', 'landing.business_scale4'] },
      { title: 'landing.plan_unlocked', items: ['landing.business_unlock1', 'landing.business_unlock2', 'landing.business_unlock3', 'landing.business_unlock4', 'landing.business_unlock5', 'landing.business_unlock6', 'landing.business_unlock7', 'landing.business_unlock8', 'landing.business_unlock9', 'landing.business_unlock10'] },
      { title: 'landing.plan_communication', items: ['landing.business_comm1', 'landing.business_comm2', 'landing.business_comm3', 'landing.business_comm4'] },
      { title: 'landing.plan_security', items: ['landing.business_security1'] },
    ],
    featured: true,
  },
  {
    name: 'Enterprise',
    monthly: 200,
    badge: 'landing.enterprise_badge',
    users: 'landing.enterprise_users',
    benefits: ['landing.enterprise_benefit1', 'landing.enterprise_benefit2', 'landing.enterprise_benefit3', 'landing.enterprise_benefit4'],
    detailGroups: [
      { title: 'landing.plan_unlimited', items: ['landing.enterprise_unlimited1', 'landing.enterprise_unlimited2', 'landing.enterprise_unlimited3', 'landing.enterprise_unlimited4'] },
      { title: 'landing.plan_enterprise', items: ['landing.enterprise_feature1', 'landing.enterprise_feature2', 'landing.enterprise_feature3', 'landing.enterprise_feature4', 'landing.enterprise_feature5', 'landing.enterprise_feature6', 'landing.enterprise_feature7', 'landing.enterprise_feature8', 'landing.enterprise_feature9'] },
      { title: 'landing.plan_analytics', items: ['landing.enterprise_analytics1', 'landing.enterprise_analytics2', 'landing.enterprise_analytics3', 'landing.enterprise_analytics4'] },
    ],
  },
];

/**
 * Declaracion metrics. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const metrics = [
  ['34%', 'landing.less_ops_time'],
  ['4.8x', 'landing.more_traceability'],
  ['72h', 'landing.to_activate_teams'],
  ['99.9%', 'landing.centralized_vision'],
];

/**
 * Declaracion iconPaths. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
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

/**
 * Componente Icon. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function Icon({ name }: { name: IconName }) {
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return h(
    'svg',
    { className: 'nx-icon', fill: 'none', viewBox: '0 0 24 24', 'aria-hidden': true },
    iconPaths[name].map((path, index) => h('path', { d: path, key: index, stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.9 }))
  );
}

/**
 * Componente GlowCard. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function GlowCard({ children, className, animated = false }: { animated?: boolean; children?: ReactNode; className: string }) {
  // Devuelve el valor final calculado para esta funcion o caso de uso.
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

/**
 * Declaracion scrollToId. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function scrollToId(id: string) {
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function goToLandingPath(path: string) {
  if (path.startsWith('/landing#') || path === '/landing' || path === '/landing/seguridad' || path === '/landing/privacidad') {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('nexxus:navigate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  window.location.assign(path);
}

/**
 * Declaracion abrirAuth. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function abrirAuth(modo: 'registro' | 'login', plan = 'Business') {
  // Declara ruta; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const ruta = modo === 'login' ? '/landing/login' : '/landing/registro';
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  window.history.pushState({}, '', `${ruta}?plan=${encodeURIComponent(plan)}`);
  window.dispatchEvent(new Event('nexxus:navigate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Declaracion priceFor. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function priceFor(monthly: number, cycle: BillingCycle) {
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return cycle === 'annual' ? Math.round(monthly * 12 * 0.6) : monthly;
}

/**
 * Componente Landing. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function Landing() {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Inicializa [billing, setBilling]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [billing, setBilling] = useState<BillingCycle>('annual');
  // Inicializa [selectedPlan, setSelectedPlan]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [selectedPlan, setSelectedPlan] = useState('Business');
  // Inicializa [menuMovilAbierto, setMenuMovilAbierto]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    document.title = 'Nexxus | Impulsa tu empresa con rendimiento real';
    // Declara description; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const description = 'Nexxus centraliza empleados, tareas, asistencia, nómina, IA y analytics para empresas modernas.';
    // Declara meta; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let meta = document.querySelector('meta[name="description"]');
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!meta) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      meta = document.createElement('meta');
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      meta.setAttribute('name', 'description');
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      document.head.appendChild(meta);
    }
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    meta.setAttribute('content', description);

    // Declara revealItems; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const revealItems = Array.from(document.querySelectorAll('.nx-reveal'));
    // Declara observer; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.16 }
    );
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    revealItems.forEach((item) => observer.observe(item));
    if (window.location.hash.length > 1) {
      window.requestAnimationFrame(() => scrollToId(window.location.hash.slice(1)));
    }

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      observer.disconnect();
    };
  }, []);

  // Declara choosePlan; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const choosePlan = (plan: string) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setSelectedPlan(plan);
  };

  // Declara enlacesNav; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const enlacesNav: [string, string][] = [
    [t('landing.nav_system'), 'sistema'],
    [t('landing.nav_modules'), 'modulos'],
    [t('landing.nav_admin'), 'admin'],
    [t('landing.nav_plans'), 'planes'],
    [t('landing.nav_ia'), 'ia'],
  ];

  // Declara navegarA; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const navegarA = (id: string) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setMenuMovilAbierto(false);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    scrollToId(id);
  };

  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return h(
    'main',
    { className: 'nx-landing' },
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
        h('button', { onClick: () => { setMenuMovilAbierto(false); changeLanguage(i18n.language === 'es' ? 'en' : 'es'); } }, `${t('common.language')}: ${i18n.language === 'es' ? 'EN' : 'ES'}`),
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
            h(
              'div',
              { className: 'nx-plan-details' },
              plan.detailGroups.map((group) =>
                h(
                  'div',
                  { className: 'nx-plan-detail-group', key: group.title },
                  h('h4', null, t(group.title)),
                  h('ul', null, group.items.map((item) => h('li', { key: item }, t(item))))
                )
              )
            ),
            h('button', { className: 'nx-btn nx-btn-plan', onClick: () => { choosePlan(plan.name); abrirAuth('registro', plan.name); } }, selectedPlan === plan.name ? t('landing.create_with_this_plan') : t('landing.choose_plan'))
          )
        )
      )
    ),
    h(
      'section',
      { className: 'nx-ai-section nx-reveal', id: 'ia' },
      h(
        'div',
        { className: 'nx-ai-core' },
        h('span', null, t('landing.section_ai_title')),
        h('h2', null, t('landing.section_ai_h2')),
        h('p', null, t('landing.section_ai_p')),
        h(
          'div',
          { className: 'nx-ai-proof-grid' },
          [
            ['landing.ai_proof_1_title', 'landing.ai_proof_1_desc', 'spark'],
            ['landing.ai_proof_2_title', 'landing.ai_proof_2_desc', 'shield'],
            ['landing.ai_proof_3_title', 'landing.ai_proof_3_desc', 'analytics'],
          ].map(([title, text, icon]) => h('div', { className: 'nx-ai-proof', key: title }, h(Icon, { name: icon as IconName }), h('strong', null, t(title)), h('small', null, t(text))))
        )
      ),
      h(
        GlowCard,
        { className: 'nx-ai-stream' },
        h('div', { className: 'nx-ai-stream-head' }, h('span', null, 'Nexxus IA')),
        [t('landing.ai_stream_item1'), t('landing.ai_stream_item2'), t('landing.ai_stream_item3'), t('landing.ai_stream_item4'), t('landing.ai_stream_item5'), t('landing.ai_stream_item6')].map((item) => h('div', { className: 'nx-ai-signal', key: item }, h('span', null), item)),
        h('div', { className: 'nx-ai-outcome' }, h('strong', null, t('landing.ai_outcome_title')), h('p', null, t('landing.ai_outcome_desc')))
      )
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
      h('div', null,
        h('button', { onClick: () => scrollToId('hero') }, t('landing.footer_product')),
        h('button', { onClick: () => scrollToId('planes') }, t('landing.footer_plans')),
        h('button', { onClick: () => goToLandingPath('/landing/seguridad') }, t('landing.footer_security')),
        h('button', { onClick: () => scrollToId('hero') }, t('landing.footer_contact')),
        h('button', { onClick: () => goToLandingPath('/landing/privacidad') }, t('landing.footer_privacy'))
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
      h('span', null, t('landing.footer_tagline'))
    )
  );
}
