import { createElement, ReactNode, useEffect, useState } from 'react';
import BorderGlow from './BorderGlow';
import DarkVeil from './DarkVeil';
import StarBorder from './StarBorder';
import './Landing.css';

const h = createElement;

type BillingCycle = 'monthly' | 'annual';
type IconName = 'activity' | 'ai' | 'analytics' | 'automation' | 'briefcase' | 'building' | 'chart' | 'check' | 'clock' | 'command' | 'database' | 'file' | 'lock' | 'message' | 'payroll' | 'shield' | 'spark' | 'users' | 'workflow' | 'zap';

const modules: [string, string, IconName][] = [
  ['Dashboard empresarial', 'Visibilidad ejecutiva de productividad, clima laboral, asistencia y operación diaria.', 'command'],
  ['Gestión de empleados', 'Directorio multiempresa con roles, permisos, estados y trazabilidad laboral.', 'users'],
  ['Tareas inteligentes', 'Prioridades, progreso, dependencias, seguimiento y señales de carga en tiempo real.', 'check'],
  ['IA integrada', 'Resúmenes operativos, alertas de riesgo, automatización y asistencia contextual.', 'ai'],
  ['Nómina', 'Control de pagos, estados, deducciones, reportes y auditoría financiera.', 'payroll'],
  ['Asistencia', 'Entradas, salidas, pausas, estado laboral y cobertura por equipo.', 'clock'],
  ['Analytics', 'Métricas ejecutivas, tendencias, estrés, rendimiento y alertas de RRHH.', 'analytics'],
  ['Comunicación interna', 'Anuncios segmentados, inbox unificado y colaboración contextual.', 'message'],
  ['Multiempresa', 'Arquitectura preparada para organizaciones, sedes, departamentos y escalamiento.', 'building'],
];

const plans = [
  {
    name: 'Starter',
    monthly: 20,
    badge: 'Para equipos en crecimiento',
    users: 'Hasta 40 empleados',
    benefits: ['Dashboard base', 'Tareas y asistencia', 'Centro de documentos', 'Soporte estándar'],
  },
  {
    name: 'Business',
    monthly: 50,
    badge: 'Más elegido',
    users: 'Hasta 180 empleados',
    benefits: ['IA operativa', 'Nómina y auditoría', 'Analytics avanzado', 'Automatizaciones'],
    featured: true,
  },
  {
    name: 'Enterprise',
    monthly: 200,
    badge: 'Operación corporativa',
    users: 'Usuarios y sedes escalables',
    benefits: ['Multiempresa', 'SLA prioritario', 'Onboarding guiado', 'Gobernanza avanzada'],
  },
];

const metrics = [
  ['34%', 'menos tiempo operativo'],
  ['4.8x', 'más trazabilidad'],
  ['72h', 'para activar equipos'],
  ['99.9%', 'visión centralizada'],
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
  const [billing, setBilling] = useState<BillingCycle>('annual');
  const [selectedPlan, setSelectedPlan] = useState('Business');
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  useEffect(() => {
    document.title = 'Nexxus | Plataforma SaaS empresarial con IA';
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
    ['Sistema', 'sistema'],
    ['Módulos', 'modulos'],
    ['Admin', 'admin'],
    ['Planes', 'planes'],
    ['IA', 'ia'],
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
        h('button', { className: 'nx-nav-login', onClick: () => abrirAuth('login', selectedPlan) }, 'Iniciar sesión'),
        h(StarButton, { className: 'nx-nav-cta', onClick: () => abrirAuth('registro', selectedPlan) }, 'Crear empresa')
      ),
      h(
        'button',
        {
          'aria-expanded': menuMovilAbierto,
          'aria-label': menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú',
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
        h('button', { onClick: () => abrirAuth('login', selectedPlan) }, 'Iniciar sesión')
      )
    ),
    h(
      'section',
      { className: 'nx-hero', id: 'hero' },
      h(
        'div',
        { className: 'nx-hero-copy nx-reveal is-visible' },
        h('div', { className: 'nx-kicker' }, h('span', null), 'Sistema operativo empresarial con IA'),
        h('h1', null, 'Transforma la gestión de tu empresa en un centro de control inteligente.'),
        h('p', null, 'Nexxus conecta administración, empleados, tareas, asistencia, nómina, bienestar e IA en una plataforma SaaS premium para operar con claridad y velocidad.'),
        h(
          'div',
          { className: 'nx-hero-actions' },
          h(StarButton, { className: 'nx-btn nx-btn-primary', onClick: () => abrirAuth('registro', selectedPlan) }, h(Icon, { name: 'building' }), 'Crear Empresa'),
          h('button', { className: 'nx-btn nx-btn-ghost', onClick: () => scrollToId('sistema') }, h(Icon, { name: 'chart' }), 'Ver Demo'),
          h('button', { className: 'nx-btn nx-btn-minimal', onClick: () => scrollToId('planes') }, h(Icon, { name: 'briefcase' }), 'Conocer Planes')
        ),
        h(
          'div',
          { className: 'nx-trust-row' },
          metrics.map(([value, label], index) => h(GlowCard, { className: 'nx-metric-card', key: label }, h(Icon, { name: index === 0 ? 'zap' : index === 1 ? 'shield' : index === 2 ? 'clock' : 'activity' }), h('strong', null, value), h('span', null, label)))
        )
      ),
      h(
        'div',
        { className: 'nx-dashboard-shell nx-reveal is-visible' },
        h('div', { className: 'nx-window-bar' }, h('span', null), h('span', null), h('span', null), h('strong', null, 'Nexxus Command')),
        h(
          'div',
          { className: 'nx-dashboard-grid' },
          h('div', { className: 'nx-panel nx-panel-main' }, h('span', null, 'Productividad'), h('strong', null, '87%'), h('div', { className: 'nx-chart' }, h('i'), h('i'), h('i'), h('i'), h('i'))),
          h('div', { className: 'nx-panel' }, h('span', null, 'Nexus IA'), h('strong', null, '12 alertas resueltas'), h('p', null, 'Riesgo operativo bajo')),
          h('div', { className: 'nx-panel' }, h('span', null, 'Asistencia'), h('strong', null, '142 activos'), h('p', null, '3 sedes sincronizadas')),
          h('div', { className: 'nx-panel nx-table-panel' }, h('span', null, 'Operación'), ['Nómina lista', 'Tareas críticas', 'Check-ins pendientes'].map((item) => h('b', { key: item }, item, h('em', null))))
        )
      )
    ),
    h(
      'section',
      { className: 'nx-section nx-reveal', id: 'sistema' },
      h('div', { className: 'nx-section-head' }, h('span', null, 'Sistema'), h('h2', null, 'Una plataforma para operar personas, procesos y decisiones.'), h('p', null, 'Nexxus reduce el ruido operativo y convierte cada señal de la empresa en acción: productividad, bienestar, asistencia, nómina, documentos y comunicación.')),
      h(
        'div',
        { className: 'nx-value-grid' },
        [
          ['Automatización diaria', 'Flujos que eliminan tareas repetitivas y mantienen al administrador informado.', 'automation'],
          ['Tiempo real', 'Datos vivos de empleados, solicitudes, pagos, tareas y actividad operativa.', 'activity'],
          ['Decision intelligence', 'IA para detectar riesgo, resumir jornadas y priorizar lo que importa.', 'ai'],
        ].map(([title, text, icon], index) => h(GlowCard, { animated: index === 0, className: 'nx-value-card', key: title }, h('div', { className: 'nx-card-topline' }, h(Icon, { name: icon as IconName }), h('span', null, `0${index + 1}`)), h('h3', null, title), h('p', null, text)))
      )
    ),
    h(
      'section',
      { className: 'nx-section nx-reveal', id: 'modulos' },
      h('div', { className: 'nx-section-head' }, h('span', null, 'Módulos'), h('h2', null, 'Todo el stack empresarial en una sola experiencia.'), h('p', null, 'Cada módulo fue pensado para que la operación sea medible, auditable y fácil de escalar.')),
      h('div', { className: 'nx-module-grid' }, modules.map(([title, text, icon]) => h(GlowCard, { className: 'nx-module-card', key: title }, h('div', { className: 'nx-module-icon' }, h(Icon, { name: icon })), h('h3', null, title), h('p', null, text))))
    ),
    h(
      'section',
      { className: 'nx-admin-section nx-reveal', id: 'admin' },
      h('div', { className: 'nx-admin-copy' }, h('span', null, 'Administrador'), h('h2', null, 'Control total sin fricción operativa.'), h('p', null, 'El administrador obtiene un cockpit empresarial: métricas, permisos, nómina, auditoría, reportes, automatizaciones y monitoreo de equipos desde una vista premium.')),
      h(
        GlowCard,
        { className: 'nx-admin-console' },
        h('div', null, h('strong', null, 'Live Operations      '), h('span', null, ' Sistema activo')),
        h('ul', null, ['Plantilla', 'Nómina', 'Auditoría', 'Comunicación'].map((item, index) => h('li', { key: item }, h('span', null, item), h('b', null, `${92 - index * 7}%`)))),
        h('div', { className: 'nx-radar' }, h('i'), h('i'), h('i'))
      )
    ),
    h(
      'section',
      { className: 'nx-section nx-reveal', id: 'seguridad' },
      h('div', { className: 'nx-section-head' }, h('span', null, 'Seguridad y operación'), h('h2', null, 'Gobernanza preparada para empresas reales.'), h('p', null, 'Nexxus no solo se ve premium: estructura permisos, auditoría, datos y procesos para que el crecimiento no rompa la operación.')),
      h(
        'div',
        { className: 'nx-ops-grid' },
        [
          ['Auditoría continua', 'Historial de acciones, cambios críticos y trazabilidad por usuario.', 'shield'],
          ['Datos centralizados', 'Usuarios, tareas, pagos, documentos y check-ins conectados por empresa.', 'database'],
          ['Workflows claros', 'Flujos de aprobación para solicitudes, soporte, ausencias y tareas.', 'workflow'],
          ['Documentos seguros', 'Centro documental para contratos, certificados, nómina y políticas internas.', 'file'],
        ].map(([title, text, icon]) => h(GlowCard, { className: 'nx-ops-card', key: title }, h(Icon, { name: icon as IconName }), h('h3', null, title), h('p', null, text)))
      )
    ),
    h(
      'section',
      { className: 'nx-integrations nx-reveal' },
      h('div', null, h('span', null, 'Implementación'), h('h2', null, 'Listo para conectarse al ritmo de tu operación.'), h('p', null, 'Diseñado para convivir con procesos existentes: RRHH, reportes, comunicación, documentos y tableros ejecutivos.')),
      h(
        'div',
        { className: 'nx-integration-rail' },
        ['Datos en la nube', 'RRHH', 'Nómina', 'Datos reales', 'Docs', 'Inbox'].map((item, index) => h('span', { key: item }, h(Icon, { name: index === 0 ? 'database' : index === 1 ? 'users' : index === 2 ? 'payroll' : index === 3 ? 'analytics' : index === 4 ? 'file' : 'message' }), item))
      )
    ),
    h(
      'section',
      { className: 'nx-section nx-reveal', id: 'planes' },
      h(
        'div',
        { className: 'nx-pricing-head' },
        h('div', null, h('span', null, 'Planes'), h('h2', null, 'Escala desde un equipo hasta una organización completa.')),
        h('div', { className: 'nx-toggle', role: 'group', 'aria-label': 'Facturación' }, h('button', { className: billing === 'monthly' ? 'active' : '', onClick: () => setBilling('monthly') }, 'Mensual'), h('button', { className: billing === 'annual' ? 'active' : '', onClick: () => setBilling('annual') }, 'Anual -20%'))
      ),
      h(
        'div',
        { className: 'nx-plan-grid' },
        plans.map((plan) =>
          h(
            GlowCard,
            { className: `nx-plan ${plan.featured ? 'featured' : ''} ${selectedPlan === plan.name ? 'selected' : ''}`, key: plan.name },
            h('div', { className: 'nx-plan-header' }, h(Icon, { name: plan.name === 'Starter' ? 'briefcase' : plan.name === 'Business' ? 'zap' : 'shield' }), h('span', { className: 'nx-plan-badge' }, plan.badge)),
            h('h3', null, plan.name),
            h('div', { className: 'nx-price' }, '$', priceFor(plan.monthly, billing), h('small', null, billing === 'annual' ? '/año' : '/mes')),
            h('p', null, plan.users),
            h('ul', null, plan.benefits.map((benefit) => h('li', { key: benefit }, benefit))),
            h('button', { className: 'nx-btn nx-btn-plan', onClick: () => { choosePlan(plan.name); abrirAuth('registro', plan.name); } }, selectedPlan === plan.name ? 'Crear con este plan' : 'Elegir plan')
          )
        )
      )
    ),
    h(
      'section',
      { className: 'nx-ai-section nx-reveal', id: 'ia' },
      h('div', { className: 'nx-ai-core' }, h('span', null, 'IA'), h('h2', null, 'Automatizaciones que entienden el pulso de tu empresa.'), h('p', null, 'Nexxus IA resume jornadas, detecta sobrecarga, anticipa riesgos de RRHH y convierte datos dispersos en decisiones accionables.')),
      h('div', { className: 'nx-ai-stream' }, ['Análisis de productividad', 'Alertas de bienestar', 'Resumen ejecutivo', 'Prioridad operativa'].map((item) => h('div', { key: item }, h('span', null), item)))
    ),
    h(
      'section',
      { className: 'nx-testimonials nx-reveal' },
      metrics.map(([value, label], index) => h(GlowCard, { className: 'nx-testimonial-metric', key: label }, h(Icon, { name: index === 0 ? 'zap' : index === 1 ? 'shield' : index === 2 ? 'clock' : 'activity' }), h('strong', null, value), h('span', null, label))),
      h('blockquote', null, 'Nexxus convierte la administración diaria en una operación medible, elegante y lista para crecer.')
    ),
    h(
      'section',
      { className: 'nx-final-cta nx-reveal' },
      h('h2', null, 'Tu empresa no necesita más hojas sueltas. Necesita un sistema vivo.'),
      h('p', null, 'Activa Nexxus y convierte tu operación en una plataforma inteligente, auditable y lista para escalar.'),
      h(StarButton, { className: 'nx-btn nx-btn-primary', onClick: () => abrirAuth('registro', selectedPlan) }, 'Crear mi empresa')
    ),
    h(
      'footer',
      { className: 'nx-footer' },
      h('strong', null, 'Nexxus'),
      h('div', null, ['Producto', 'Planes', 'Seguridad', 'Contacto', 'Privacidad'].map((item) => h('button', { key: item, onClick: () => item === 'Planes' ? scrollToId('planes') : scrollToId('hero') }, item))),
      h('span', null, 'Inteligencia para operaciones modernas')
    )
  );
}
