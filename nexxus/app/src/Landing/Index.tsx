import { CSSProperties, ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/infrastructure/firebase/firebaseConfig';
import { destinoWorkspaceAdmin } from './workspaceRoutes';
import BorderGlow from './BorderGlow';
import GlassSurface from './GlassSurface';
import LandingFooter from './LandingFooter';
import { getActivePlan, NexxusPlan, PLAN_ORDER } from './planAccess';
import StarButton from './StarButton';
import './Landing.css';

// ============================================================================
// Tipos
// ============================================================================
type BillingCycle = 'monthly' | 'annual';
type IconName = 'activity' | 'ai' | 'analytics' | 'automation' | 'briefcase' | 'building' | 'chart' | 'check' | 'clock' | 'command' | 'database' | 'file' | 'lock' | 'message' | 'payroll' | 'shield' | 'spark' | 'users' | 'workflow' | 'zap';

// ============================================================================
// Contenido / copy (landingText)
// ============================================================================
const landingText = {
  meta: {
    title: 'Nexxus | Impulsa tu empresa con rendimiento real',
    description: 'Nexxus centraliza empleados, tareas, asistencia, nómina, IA y analytics para empresas modernas.',
  },
  nav: [
    ['Sistema', 'sistema'],
    ['Módulos', 'modulos'],
    ['Admin', 'admin'],
    ['Planes', 'planes'],
    ['IA', 'ia'],
  ] as [string, string][],
  hero: {
    title: 'Gestiona tu empresa desde un solo lugar',
    subtitle: 'Nexxus conecta administración, empleados, tareas, asistencia, nómina, bienestar e IA en un solo lugar para operar con claridad y velocidad.',
    createCompany: 'Registrarse',
    knowPlans: 'Conocer Planes',
  },
  access: {
    guestEyebrow: 'Conoce Nexxus',
    guestTitle: 'Descubre una forma más clara de gestionar tu empresa.',
    guestText: 'Conoce el sistema que conecta personas, procesos e información en un solo lugar.',
    learnMore: 'Ver cómo funciona',
    login: 'Iniciar sesión',
    companyEyebrow: 'Tu espacio empresarial',
    companyTitle: 'Tu empresa está lista para continuar.',
    companyText: 'Accede directamente a tu espacio de trabajo y retoma la operación donde la dejaste.',
    enterCompany: 'Acceder a mi empresa',
    account: 'Gestionar cuenta',
    createEyebrow: 'Completa tu configuración',
    createTitle: 'Crea tu empresa para empezar a trabajar en Nexxus.',
    createText: 'Configura los datos de tu organización y activa tu espacio empresarial.',
    createCompany: 'Crear empresa',
  },
  metrics: [
    ['34%', 'menos tiempo operativo', 'zap'],
    ['4.8x', 'más trazabilidad', 'shield'],
    ['72h', 'para activar equipos', 'clock'],
    ['99.9%', 'visión centralizada', 'activity'],
  ] as [string, string, IconName][],
  system: {
    eyebrow: 'Sistema',
    title: 'La plataforma operativa para equipos modernos.',
    text: 'Todo lo que necesitas para administrar tu organización desde una única plataforma.',
    cards: [
      ['Automatización', 'Flujos inteligentes que eliminan tareas repetitivas.', 'automation'],
      ['Visibilidad', 'Información actualizada para actuar sin retrasos.', 'activity'],
      ['Inteligencia', 'IA que transforma datos en decisiones accionables.', 'ai'],
    ] as [string, string, IconName][],
  },
  modules: {
    eyebrow: 'Módulos',
    title: 'Todo lo que tu empresa necesita en una sola plataforma.',
    text: 'Gestiona operaciones, equipos, comunicación e inteligencia empresarial desde un único lugar.',
    cards: [
      ['Operación diaria', 'Tareas, asistencia y calendarios para mantener cada operación bajo control.', 'command'],
      ['Personas y estructura', 'Empleados, roles, departamentos y sucursales organizados de forma centralizada.', 'users'],
      ['Comunicación interna', 'Chats, anuncios y documentos compartidos para equipos mejor conectados.', 'message'],
      ['Inteligencia y control', 'Reportes, métricas e IA para supervisar el negocio y tomar decisiones con confianza.', 'analytics'],
    ] as [string, string, IconName][],
  },
  admin: {
    eyebrow: 'Administrador',
    title: 'Control total de la operación.',
    text: 'Supervisa equipos, procesos y métricas desde un panel centralizado diseñado para tomar decisiones con rapidez y confianza.',
    live: 'Operaciones en vivo',
    active: '',
    items: ['Equipo', 'Nómina', 'Auditoría', 'Comunicación'],
  },
  security: {
    eyebrow: 'Seguridad y control',
    title: 'Diseñado para crecer sin perder el control.',
    text: 'Estructura, permisos y procesos que mantienen la operación segura, organizada y escalable.',
    cards: [
      ['Auditoría continua', 'Cada acción queda registrada para garantizar trazabilidad y cumplimiento.', 'shield'],
      ['Datos centralizados', 'Toda la información de la empresa conectada en una única fuente de verdad.', 'database'],
      ['Flujos inteligentes', 'Aprobaciones, solicitudes y procesos automatizados con reglas claras.', 'workflow'],
      ['Gestión documental', 'Documentos protegidos, organizados y accesibles cuando se necesitan.', 'file'],
    ] as [string, string, IconName][],
  },
  implementation: {
    eyebrow: 'Implementación',
    title: 'Se adapta a tu operación desde el primer día.',
    text: 'Implementa Nexxus sin cambiar la forma en que tu empresa trabaja. Centraliza procesos, equipos e información en una sola plataforma.',
    items: [
      ['Datos en la nube', 'database'],
      ['RRHH', 'users'],
      ['Nómina', 'payroll'],
      ['Datos en tiempo real', 'analytics'],
      ['Documentos', 'file'],
      ['Comunicación', 'message'],
    ] as [string, IconName][],
  },
  pricing: {
    eyebrow: 'Planes',
    title: 'Desde equipos pequeños hasta operaciones empresariales.',
    monthly: 'Mensual',
    annual: 'Anual -20%',
    includes: 'Incluye:',
    viewBenefits: 'Ver beneficios del plan',
    hideBenefits: 'Ocultar beneficios del plan',
    choosePlan: 'Elegir plan',
    createWithPlan: 'Crear con este plan',
  },
  plans: [
    {
      name: 'Starter',
      monthly: 20,
      badge: 'Para equipos en crecimiento',
      users: '1 empresa · hasta 15 empleados · 1 sucursal · 1 administrador',
      benefits: ['Empleados, asistencia y tareas', 'Anuncios, chat interno y calendario', 'Documentos básicos', 'Reportes básicos'],
      detailGroups: [
        { title: 'Empresa', items: ['1 empresa', 'Hasta 15 empleados', '1 sucursal', '1 administrador'] },
        { title: 'Módulos incluidos', items: ['Empleados', 'Asistencia', 'Tareas', 'Anuncios', 'Chat interno', 'Calendario', 'Documentos básicos'] },
        { title: 'Limitaciones funcionales', items: ['Historial de 30 días', 'Máximo 3 departamentos', 'Reportes básicos', 'Exportaciones limitadas', 'Sin personalización avanzada', 'Sin permisos avanzados', 'Sin métricas avanzadas'] },
      ],
    },
    {
      name: 'Business',
      monthly: 50,
      badge: 'Más elegido',
      users: 'Todo lo del Starter + hasta 100 empleados',
      benefits: ['Reportes avanzados', 'Exportación Excel/PDF', 'Dashboard avanzado', 'Roles personalizados'],
      detailGroups: [
        { title: 'Escalabilidad', items: ['Hasta 100 empleados', 'Hasta 10 administradores', 'Hasta 10 departamentos', 'Hasta 5 sucursales'] },
        { title: 'Funciones desbloqueadas', items: ['Reportes avanzados', 'Exportación Excel/PDF', 'Dashboard avanzado', 'Estadísticas empresariales', 'Gestión avanzada de permisos', 'Roles personalizados', 'Historial de 1 año', 'Filtros avanzados', 'Prioridades en tareas', 'Gestión de equipos'] },
        { title: 'Comunicación', items: ['Canales internos', 'Mensajes destacados', 'Encuestas internas', 'Archivos compartidos'] },
        { title: 'Seguridad', items: ['Registro de actividad'] },
      ],
      featured: true,
    },
    {
      name: 'Enterprise',
      monthly: 200,
      badge: 'Operación corporativa',
      users: 'Todo lo del Business + empleados, sedes y administradores ilimitados',
      benefits: ['Multiempresa', 'Panel corporativo global', 'Auditoría completa', 'KPIs empresariales'],
      detailGroups: [
        { title: 'Sin límites', items: ['Empleados ilimitados', 'Administradores ilimitados', 'Departamentos ilimitados', 'Sucursales ilimitadas'] },
        { title: 'Funciones enterprise', items: ['Multiempresa', 'Panel corporativo global', 'Auditoría completa', 'Historial ilimitado', 'Logs empresariales', 'Permisos ultra avanzados', 'Control por sucursal', 'Control por departamento', 'Accesos jerárquicos'] },
        { title: 'Analítica avanzada', items: ['KPIs empresariales', 'Métricas en tiempo real', 'Reportes ejecutivos', 'Estadísticas avanzadas'] },
      ],
    },
  ],
  ai: {
    eyebrow: 'Inteligencia operativa',
    title: 'IA que transforma datos operativos en decisiones estratégicas.',
    text: 'Nexxus IA analiza tu operación en tiempo real para detectar riesgos, priorizar acciones y aumentar la eficiencia de tu equipo.',
    features: [
      ['Rendimiento de equipos', 'Mide productividad y cumplimiento por áreas y equipos.', 'analytics'],
      ['Alertas inteligentes', 'Detecta incidencias y oportunidades antes de que ocurran.', 'shield'],
      ['Resumen ejecutivo', 'Reportes claros y listos para decidir.', 'users'],
      ['Acciones prioritarias', 'La IA sugiere qué hacer y en qué enfocarse.', 'command'],
      ['Bienestar y carga laboral', 'Monitorea la carga operativa y el bienestar del equipo.', 'activity'],
    ] as [string, string, IconName][],
  },
  testimonial: 'Nexxus transforma la gestión empresarial en una operación conectada, medible y preparada para crecer.',
  finalCta: {
    title: 'Tu empresa no necesita más herramientas. Necesita un sistema conectado.',
    text: 'Centraliza personas, procesos y decisiones en una plataforma diseñada para operar, controlar y escalar con confianza.',
  },
  footer: {
    product: 'Producto',
    plans: 'Planes',
    security: 'Seguridad',
    contact: 'Contacto',
    privacy: 'Privacidad',
    tagline: 'Inteligencia para operaciones modernas',
  },
};

// ============================================================================
// Datos de iconos (paths SVG)
// ============================================================================
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

// ============================================================================
// Componentes auxiliares
// ============================================================================
function Icon({ name }: { name: IconName }) {
  return (
    <svg className="nx-icon" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      {iconPaths[name].map((path, index) => (
        <path d={path} key={index} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} />
      ))}
    </svg>
  );
}

function GlowCard({ animated = false, children, className }: { animated?: boolean; children?: ReactNode; className: string }) {
  return (
    <BorderGlow
      animated={animated}
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

// ============================================================================
// Funciones utilitarias
// ============================================================================
function profileInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'N';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function ProfileAvatar({ initials, onImageError, photo }: { initials: string; onImageError: () => void; photo: string }) {
  return photo
    ? <img alt="" aria-hidden="true" onError={onImageError} src={photo} />
    : <span className="nx-profile-initials" aria-hidden="true">{initials}</span>;
}

function scrollToId(id: string, navHeight = 0, behavior: ScrollBehavior = 'smooth') {
  const element = document.getElementById(id);
  if (!element) return;
  const measuredNavHeight = document.querySelector<HTMLElement>('.nx-hero-nav')?.getBoundingClientRect().height || navHeight;
  const offsetNavHeight = window.matchMedia('(max-width: 980px)').matches ? Math.max(measuredNavHeight, 78) : measuredNavHeight;
  const elementPosition = element.getBoundingClientRect().top + window.scrollY;
  const previousScrollBehavior = document.documentElement.style.scrollBehavior;
  if (behavior === 'auto') document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo({ top: Math.max(0, elementPosition - (offsetNavHeight + 20)), behavior });
  if (behavior === 'auto') document.documentElement.style.scrollBehavior = previousScrollBehavior;
}

function goToLandingPath(path: string) {
  if (path.startsWith('/landing#') || path === '/landing' || path === '/landing/cuenta' || path === '/landing/seguridad' || path === '/landing/privacidad' || path === '/landing/soporte') {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('nexxus:navigate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  window.location.assign(path);
}

function abrirAuth(modo: 'registro' | 'login', plan = 'Business', returnTo = '') {
  const ruta = modo === 'login' ? '/landing/login' : '/landing/registro';
  const params = new URLSearchParams({ plan });
  if (returnTo) params.set('returnTo', returnTo);
  window.history.pushState({}, '', `${ruta}?${params.toString()}`);
  window.dispatchEvent(new Event('nexxus:navigate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function priceFor(monthly: number, cycle: BillingCycle) {
  return cycle === 'annual' ? Math.round(monthly * 12 * 0.6) : monthly;
}

// ============================================================================
// Componente principal: Landing
// ============================================================================
export default function Landing() {
  // --- Estado (UI, navegacion, autenticacion/perfil) ---
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [selectedPlan, setSelectedPlan] = useState('Business');
  const [plansExpanded, setPlansExpanded] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [navHeight, setNavHeight] = useState(0);
  const [navReady, setNavReady] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [activePlan, setActivePlan] = useState<NexxusPlan | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(auth.currentUser));
  const [authReady, setAuthReady] = useState(false);
  const [hasCompany, setHasCompany] = useState(false);
  const [rolUsuario, setRolUsuario] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(auth.currentUser?.photoURL || '');
  const [profileLetters, setProfileLetters] = useState(profileInitials(auth.currentUser?.displayName || auth.currentUser?.email || 'N'));
  // --- Refs ---
  const rootRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuBackdropRef = useRef<HTMLButtonElement>(null);
  const mobileMenuReadyRef = useRef(false);
  const bodyOverflowRef = useRef('');
  const navRestTopRef = useRef(0);
  const navWasPinnedRef = useRef(false);
  const bounceTimerRef = useRef(0);

  // Efecto: escucha cambios de sesion (Firebase Auth) y carga datos del usuario/empresa/plan
  useEffect(() => onAuthStateChanged(auth, async (user) => {
    setIsAuthenticated(Boolean(user));
    if (!user) {
      setActivePlan(null);
      setHasCompany(false);
      setRolUsuario('');
      setProfilePhoto('');
      setProfileLetters('N');
      setAuthReady(true);
      return;
    }
    const userSnapshot = await getDoc(doc(db, 'usuarios', user.uid)).catch(() => null);
    const userData = userSnapshot?.exists() ? userSnapshot.data() : {};
    const profileName = String(userData.nombre || user.displayName || user.email?.split('@')[0] || 'N');
    setHasCompany(Boolean(userData.empresaId || userData.empresa_id || userData.empresaID));
    setRolUsuario(String(userData.rol || userData.role || ''));
    setProfilePhoto(String(userData.foto_perfil || user.photoURL || ''));
    setProfileLetters(profileInitials(profileName));
    setAuthReady(true);
    getActivePlan(user).then(setActivePlan).catch(() => setActivePlan(null));
  }), []);

  // Efecto: anima apertura/cierre del menu movil (GSAP) y maneja foco/teclado
  useEffect(() => {
    const menu = mobileMenuRef.current;
    const backdrop = mobileMenuBackdropRef.current;
    if (!menu || !backdrop) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = Array.from(menu.querySelectorAll<HTMLElement>('.nx-mobile-menu-animate'));

    gsap.killTweensOf([menu, backdrop, ...items]);
    if (!mobileMenuReadyRef.current) {
      menu.inert = true;
      gsap.set(menu, { autoAlpha: 0, transform: `translate3d(${reduceMotion ? 0 : -100}%, 0, 0)` });
      gsap.set(backdrop, { autoAlpha: 0 });
      mobileMenuReadyRef.current = true;
    }

    if (menuMovilAbierto) {
      menu.inert = false;
      bodyOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      gsap.set([menu, backdrop], { visibility: 'visible' });
      gsap.timeline({ defaults: { overwrite: 'auto' } })
        .to(backdrop, { autoAlpha: 1, duration: 0.18, ease: 'power2.out' }, 0)
        .to(menu, {
          autoAlpha: 1,
          transform: 'translate3d(0%, 0, 0)',
          duration: reduceMotion ? 0.16 : 0.28,
          ease: 'power3.out',
        }, 0)
        .fromTo(items, {
          autoAlpha: 0,
          y: reduceMotion ? 0 : 8,
        }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.2,
          ease: 'power3.out',
          stagger: reduceMotion ? 0 : 0.03,
        }, 0.08);
      window.requestAnimationFrame(() => menu.querySelector<HTMLButtonElement>('.nx-mobile-menu-close')?.focus());
    } else {
      if (menu.contains(document.activeElement)) {
        mobileMenuTriggerRef.current?.focus({ preventScroll: true });
      }
      menu.inert = true;
      gsap.timeline({ defaults: { overwrite: 'auto' } })
        .to(menu, {
          autoAlpha: 0,
          transform: `translate3d(${reduceMotion ? 0 : -100}%, 0, 0)`,
          duration: reduceMotion ? 0.12 : 0.22,
          ease: 'power3.inOut',
        }, 0)
        .to(backdrop, { autoAlpha: 0, duration: 0.16, ease: 'power2.out' }, 0.04)
        .set([menu, backdrop], { visibility: 'hidden' });
      document.body.style.overflow = bodyOverflowRef.current;
    }

    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuMovilAbierto(false);
        return;
      }
      if (event.key !== 'Tab' || !menuMovilAbierto) return;
      const focusable = Array.from(menu.querySelectorAll<HTMLElement>('button:not([disabled])'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => {
      window.removeEventListener('keydown', handleKeyboard);
    };
  }, [menuMovilAbierto]);

  // Efecto: cierra el menu movil automaticamente si la vista pasa a desktop
  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 980px)');
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (!event.matches) setMenuMovilAbierto(false);
    };
    mobileQuery.addEventListener('change', closeOnDesktop);
    return () => {
      mobileQuery.removeEventListener('change', closeOnDesktop);
      document.body.style.overflow = bodyOverflowRef.current;
    };
  }, []);

  // Efecto: titulo/meta, animaciones de scroll-reveal, observers de seccion activa y medicion de performance
  useEffect(() => {
    document.title = landingText.meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', landingText.meta.description);

    const root = rootRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealItems = Array.from(root?.querySelectorAll<HTMLElement>('.nx-reveal') ?? []);
    const gsapContext = gsap.context(() => {
      gsap.set('.nx-reveal', {
        autoAlpha: 0,
        y: reduceMotion ? 0 : 18,
        filter: reduceMotion ? 'none' : 'blur(3px)',
      });
      gsap.set('.nx-radar i', { autoAlpha: 0, scale: 0.58 });
      const aiSignalDots = root?.querySelectorAll<HTMLElement>('.nx-ai-signal span') ?? [];
      if (aiSignalDots.length) gsap.set(aiSignalDots, { scale: 0.82, autoAlpha: 0.58 });
      gsap.to('.nx-orb-a', {
        y: reduceMotion ? 0 : -14,
        x: reduceMotion ? 0 : 8,
        duration: 7,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
      gsap.to('.nx-orb-b', {
        y: reduceMotion ? 0 : 16,
        x: reduceMotion ? 0 : -10,
        duration: 8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    }, root || undefined);
    const revealObserver = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const target = entry.target as HTMLElement;
        target.classList.add('is-visible');
        gsap.to(target, {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: reduceMotion ? 0.18 : 0.72,
          ease: 'power3.out',
          overwrite: 'auto',
        });
        const staggerItems = target.querySelectorAll<HTMLElement>(
          '.nx-section-head > *, .nx-admin-copy > *, .nx-pricing-head > *, .nx-ai-core > *, .nx-value-card, .nx-module-card, .nx-ops-card, .nx-plan, .nx-ai-proof, .nx-testimonial-metric, .nx-integration-rail span, .nx-admin-console li, .nx-ai-signal'
        );
        if (staggerItems.length) {
          gsap.fromTo(staggerItems, {
            autoAlpha: 0,
            y: reduceMotion ? 0 : 14,
            scale: reduceMotion ? 1 : 0.985,
          }, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: reduceMotion ? 0.16 : 0.5,
            ease: 'power3.out',
            stagger: reduceMotion ? 0 : 0.045,
            overwrite: 'auto',
          });
        }
        const radarRings = target.querySelectorAll<HTMLElement>('.nx-radar i');
        if (radarRings.length && !reduceMotion) {
          gsap.fromTo(radarRings, { autoAlpha: 0.88, scale: 0.48 }, {
            autoAlpha: 0,
            scale: 1.28,
            duration: 2.4,
            ease: 'none',
            stagger: 0.48,
          });
        }
        const aiDots = target.querySelectorAll<HTMLElement>('.nx-ai-signal span');
        if (aiDots.length && !reduceMotion) {
          gsap.to(aiDots, {
            autoAlpha: 1,
            scale: 1.18,
            duration: 0.95,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            stagger: 0.12,
          });
        }
        revealObserver.unobserve(entry.target);
      }),
      { threshold: 0.16 }
    );
    revealItems.forEach((item) => revealObserver.observe(item));

    const sectionElements = ['hero', 'sistema', 'modulos', 'admin', 'planes', 'ia']
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (!visibleEntries.length) return;
        visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        setActiveSection(visibleEntries[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5] },
    );
    sectionElements.forEach((element) => sectionObserver.observe(element));

    let hashFrame = 0;
    let hashTimer = 0;
    if (window.location.hash.length > 1) {
      const alignHashTarget = () => scrollToId(window.location.hash.slice(1), navHeight, 'auto');
      hashFrame = window.requestAnimationFrame(() => {
        hashFrame = window.requestAnimationFrame(alignHashTarget);
      });
      hashTimer = window.setTimeout(alignHashTarget, 220);
    }

    const perfEnabled = window.location.search.includes('perf=1') || window.localStorage.getItem('nexxus:perf') === '1';
    const perfStops: (() => void)[] = [];
    if (perfEnabled) {
      const samples: number[] = [];
      let lastFrame = performance.now();
      let raf = 0;
      const tick = (now: number) => {
        samples.push(now - lastFrame);
        lastFrame = now;
        raf = window.requestAnimationFrame(tick);
      };
      raf = window.requestAnimationFrame(tick);
      perfStops.push(() => window.cancelAnimationFrame(raf));

      const metrics: Record<string, number> = {};
      const observe = (type: string, handler: (entry: PerformanceEntry) => void) => {
        try {
          const observer = new PerformanceObserver((list) => list.getEntries().forEach(handler));
          observer.observe({ buffered: true, type });
          perfStops.push(() => observer.disconnect());
        } catch {
          return;
        }
      };
      observe('largest-contentful-paint', (entry) => {
        metrics.lcp = entry.startTime;
      });
      observe('layout-shift', (entry) => {
        const layoutEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!layoutEntry.hadRecentInput) metrics.cls = (metrics.cls || 0) + (layoutEntry.value || 0);
      });
      observe('event', (entry) => {
        metrics.inp = Math.max(metrics.inp || 0, (entry as PerformanceEntry & { duration?: number }).duration || 0);
      });

      const report = window.setTimeout(() => {
        const avgFrame = samples.reduce((total, frame) => total + frame, 0) / Math.max(samples.length, 1);
        console.info('[Nexxus perf]', {
          avgFps: Math.round(1000 / Math.max(avgFrame, 1)),
          longFrames: samples.filter((frame) => frame > 50).length,
          samples: samples.length,
          ...metrics,
        });
      }, 8000);
      perfStops.push(() => window.clearTimeout(report));
    }

    return () => {
      gsapContext.revert();
      revealObserver.disconnect();
      sectionObserver.disconnect();
      window.cancelAnimationFrame(hashFrame);
      window.clearTimeout(hashTimer);
      perfStops.forEach((stop) => stop());
    };
  }, []);

  // --- Medicion y fijado (pin) del nav al hacer scroll ---
  const measureNavAnchor = () => {
    const hero = document.getElementById('hero');
    const copy = hero?.querySelector('.nx-hero-copy');
    const nav = navRef.current;
    if (!hero || !copy || !nav) return false;

    const measuredGap = parseFloat(window.getComputedStyle(hero).gap);
    const gap = Number.isFinite(measuredGap) ? measuredGap : 44;
    const marginTop = parseFloat(window.getComputedStyle(nav).marginTop) || 0;
    const navRect = nav.getBoundingClientRect();
    const heroTop = hero.getBoundingClientRect().top + window.scrollY;
    const restTop = heroTop + (copy as HTMLElement).offsetTop + (copy as HTMLElement).offsetHeight + gap + marginTop;

    navRestTopRef.current = restTop;
    setNavHeight(navRect.height + marginTop);
    return true;
  };

  // Efecto (layout): mide la posicion de reposo del nav antes de pintar
  useLayoutEffect(() => {
    const copy = document.querySelector<HTMLElement>('.nx-hero-copy');
    const measure = () => {
      if (window.scrollY <= 12 && measureNavAnchor()) setNavReady(true);
    };
    const frame = window.requestAnimationFrame(measure);
    const resizeObserver = new ResizeObserver(measure);
    if (copy) resizeObserver.observe(copy);
    document.fonts.ready.then(measure);
    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, []);

  // Efecto: fija (pin) el nav en la parte superior al hacer scroll, con animacion
  useEffect(() => {
    const navPinTop = 8;
    const animateNavState = (kind: 'pin' | 'return') => {
      const nav = navRef.current;
      if (!nav) return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isMobile = window.matchMedia('(max-width: 980px)').matches;

      if (isMobile) {
        const restContent = nav.querySelector<HTMLElement>('.nx-mobile-nav-rest');
        const pinnedContent = nav.querySelector<HTMLElement>('.nx-mobile-nav-pinned');
        if (!restContent || !pinnedContent) return;
        const entering = kind === 'pin' ? pinnedContent : restContent;
        const leaving = kind === 'pin' ? restContent : pinnedContent;
        const width = kind === 'pin' ? 'calc(100vw - 28px)' : '206px';
        const height = kind === 'pin' ? 78 : 54;

        gsap.killTweensOf([nav, restContent, pinnedContent]);
        if (reduceMotion) {
          gsap.set(nav, { width, height });
          gsap.set(leaving, { autoAlpha: 0, scale: 0.97 });
          gsap.set(entering, { autoAlpha: 1, scale: 1 });
          return;
        }
        gsap.timeline({ defaults: { overwrite: 'auto' } })
          .to(leaving, { autoAlpha: 0, scale: 0.97, duration: 0.12, ease: 'power2.out' }, 0)
          .to(nav, { width, height, duration: 0.3, ease: 'power3.inOut' }, 0)
          .fromTo(entering, { autoAlpha: 0, scale: 0.97 }, {
            autoAlpha: 1,
            scale: 1,
            duration: 0.18,
            ease: 'power3.out',
          }, 0.12);
        return;
      }

      if (reduceMotion) return;
      gsap.fromTo(nav, {
        scale: kind === 'pin' ? 0.992 : 1.006,
        y: kind === 'pin' ? 2 : -1,
      }, {
        scale: 1,
        y: 0,
        duration: kind === 'pin' ? 0.34 : 0.26,
        ease: 'back.out(1.8)',
        overwrite: 'auto',
      });
    };
    const updateNavPosition = () => {
      const nextTop = Math.max(navPinTop, navRestTopRef.current - window.scrollY);
      const nextPinned = nextTop <= navPinTop + 0.5;

      const nav = navRef.current;
      if (nav) {
        nav.style.top = `${nextTop}px`;
        if (nextPinned) {
          nav.classList.add('is-pinned');
        } else {
          nav.classList.remove('is-pinned');
        }
      }

      if (nextPinned && !navWasPinnedRef.current) animateNavState('pin');
      if (!nextPinned && navWasPinnedRef.current) {
        setMenuMovilAbierto(false);
        animateNavState('return');
      }
      navWasPinnedRef.current = nextPinned;
    };
    const remeasure = () => {
      if (window.scrollY > 12) return;
      if (measureNavAnchor()) updateNavPosition();
    };
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateNavPosition();
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', remeasure);
    updateNavPosition();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', remeasure);
    };
  }, [navReady]);

  // --- Handlers de UI ---
  const choosePlan = (plan: string) => setSelectedPlan(plan);
  const togglePlanBenefits = (plan: string) => {
    setSelectedPlan(plan);
    setPlansExpanded((current) => !current);
  };
  const abrirCheckout = (plan: string) => {
    setSelectedPlan(plan);
    const checkoutPath = `/landing/checkout?plan=${encodeURIComponent(plan)}&billing=${billing}`;
    if (!auth.currentUser) {
      abrirAuth('registro', plan, checkoutPath);
      return;
    }
    window.history.pushState({}, '', checkoutPath);
    window.dispatchEvent(new Event('nexxus:navigate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const navegarA = (id: string) => {
    setMenuMovilAbierto(false);
    scrollToId(id, navHeight);
  };
  const finalCtaLabel = !authReady
    ? 'Comprobando sesión…'
    : !isAuthenticated
      ? 'Registrarse'
      : hasCompany
        ? 'Ingresar a la empresa'
        : 'Crear empresa';
  const handleFinalCta = () => {
    if (!authReady) return;
    if (!isAuthenticated) {
      abrirAuth('registro', selectedPlan);
      return;
    }
    if (hasCompany) {
      window.location.assign(destinoWorkspaceAdmin(rolUsuario));
      return;
    }
    goToLandingPath('/landing/crear-empresa');
  };

  // --- Valores computados para el nav ---
  const navClassName = [
    'nx-nav',
    'nx-hero-nav',
    'is-floating',
    navReady ? 'is-ready' : '',
  ].filter(Boolean).join(' ');
  const navStyle = navReady ? ({ top: `${Math.max(8, navRestTopRef.current - window.scrollY)}px` } as CSSProperties) : undefined;

  // --- Render ---
  return (
    <div className="nx-landing" ref={rootRef}>
      <div className="nx-orb nx-orb-a" aria-hidden="true" />
      <div className="nx-orb nx-orb-b" aria-hidden="true" />

      {/* Hero */}
      <div className="nx-hero" id="hero">
        <div className="nx-hero-copy nx-reveal">
          <h1>{landingText.hero.title}</h1>
          <p>{landingText.hero.subtitle}</p>
          <div className="nx-hero-actions">
            <StarButton className="nx-btn nx-btn-primary" onClick={() => abrirAuth('registro', selectedPlan)}>
              <Icon name="building" />
              {landingText.hero.createCompany}
            </StarButton>
            <button className="nx-btn nx-btn-minimal" onClick={() => scrollToId('planes', navHeight)}>
              <Icon name="briefcase" />
              {landingText.hero.knowPlans}
            </button>
          </div>
          <div className="nx-trust-row">
            {landingText.metrics.map(([value, label, icon]) => (
              <GlowCard className="nx-metric-card" key={label}>
                <Icon name={icon} />
                <strong>{value}</strong>
                <span>{label}</span>
              </GlowCard>
            ))}
          </div>
        </div>
        {navReady ? <div aria-hidden="true" className="nx-hero-nav-slot" style={{ height: navHeight }} /> : null}
      </div>

      {/* Navegacion (flotante, con menu movil) */}
      <div className="nx-nav-layer">
        <GlassSurface
          as="nav"
          ref={navRef}
          backgroundOpacity={0.08}
          blur={8}
          borderRadius={999}
          brightness={58}
          displace={0.25}
          distortionScale={-34}
          greenOffset={3}
          blueOffset={6}
          saturation={1.24}
          className={navClassName}
          style={navStyle}
        >
          <button className="nx-brand" onClick={() => scrollToId('hero', navHeight)}><span>N</span>Nexxus</button>
          <div className="nx-nav-links">
            {landingText.nav.map(([label, id]) => (
              <button key={id} onClick={() => navegarA(id)} className={activeSection === id ? 'is-active' : ''}>{label}</button>
            ))}
          </div>
          <div className="nx-nav-actions">
            {isAuthenticated ? (
              <button className="nx-nav-profile" aria-label="Perfil" onClick={() => goToLandingPath('/landing/cuenta')} type="button">
                <ProfileAvatar initials={profileLetters} onImageError={() => setProfilePhoto('')} photo={profilePhoto} />
              </button>
            ) : (
              <StarButton className="nx-nav-cta" onClick={() => abrirAuth('registro', selectedPlan)}>
                Registrate
              </StarButton>
            )}
          </div>
          <div className="nx-mobile-nav-rest">
            <button onClick={() => navegarA('sistema')}>
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 5.5 18 12 8 18.5Z" /></svg>
              <span>Ver plataforma</span>
            </button>
          </div>
          <div className="nx-mobile-nav-pinned">
            <button
              ref={mobileMenuTriggerRef}
              aria-expanded={menuMovilAbierto}
              aria-label={menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'}
              className={`nx-menu-toggle ${menuMovilAbierto ? 'is-open' : ''}`}
              onClick={() => setMenuMovilAbierto((abierto) => !abierto)}
            >
              <span />
              <span />
            </button>
            {isAuthenticated ? (
              <button className="nx-mobile-profile" aria-label="Perfil" onClick={() => goToLandingPath('/landing/cuenta')} type="button">
                <ProfileAvatar initials={profileLetters} onImageError={() => setProfilePhoto('')} photo={profilePhoto} />
              </button>
            ) : (
              <StarButton className="nx-nav-cta nx-mobile-register" onClick={() => abrirAuth('registro', selectedPlan)}>
                Registrarse
              </StarButton>
            )}
          </div>
        </GlassSurface>
        <button
          ref={mobileMenuBackdropRef}
          className="nx-mobile-menu-backdrop"
          aria-label="Cerrar menú"
          onClick={() => setMenuMovilAbierto(false)}
        />
        <div
          ref={mobileMenuRef}
          className={`nx-mobile-menu ${menuMovilAbierto ? 'is-open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Navegación de Nexxus"
        >
          <div className="nx-mobile-menu-head nx-mobile-menu-animate">
            <strong>Nexxus</strong>
            <button className="nx-mobile-menu-close" aria-label="Cerrar menú" onClick={() => setMenuMovilAbierto(false)}>
              <span />
              <span />
            </button>
          </div>
          <div className="nx-mobile-menu-links">
            {landingText.nav.map(([label, id], index) => (
              <button className={`nx-mobile-menu-animate ${activeSection === id ? 'is-active' : ''}`} key={id} onClick={() => navegarA(id)}>
                <Icon name={(['workflow', 'database', 'users', 'briefcase', 'spark'] as IconName[])[index]} />
                <span>{label}</span>
                <span className="nx-mobile-menu-arrow">→</span>
              </button>
            ))}
          </div>
          <div className="nx-mobile-menu-actions nx-mobile-menu-animate">
            {isAuthenticated ? (
              <button className="nx-mobile-menu-access" onClick={() => window.location.assign(destinoWorkspaceAdmin(rolUsuario))}>
                Acceder a tu empresa
              </button>
            ) : (
              <>
                <button className="nx-mobile-menu-login" onClick={() => { setMenuMovilAbierto(false); abrirAuth('login', selectedPlan); }}>
                  Iniciar sesión
                </button>
                <button className="nx-mobile-menu-register" onClick={() => { setMenuMovilAbierto(false); abrirAuth('registro', selectedPlan); }}>
                  Registrarse
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Seccion de acceso segun estado de autenticacion */}
      <div className="nx-access-section nx-reveal" aria-live="polite">
        <div className={`nx-access-card ${authReady ? 'is-ready' : 'is-loading'}`}>
          {!authReady ? (
            <div className="nx-access-loading" aria-label="Comprobando sesión" />
          ) : !isAuthenticated ? (
            <>
              <div className="nx-access-copy">
                <span>{landingText.access.guestEyebrow}</span>
                <h2>{landingText.access.guestTitle}</h2>
                <p>{landingText.access.guestText}</p>
              </div>
              <div className="nx-access-actions">
                <StarButton className="nx-btn nx-btn-primary" onClick={() => scrollToId('sistema', navHeight)}>
                  {landingText.access.learnMore}
                </StarButton>
                <button className="nx-btn nx-btn-minimal" onClick={() => abrirAuth('login', selectedPlan)}>
                  {landingText.access.login}
                </button>
              </div>
            </>
          ) : hasCompany ? (
            <>
              <div className="nx-access-copy">
                <span>{landingText.access.companyEyebrow}</span>
                <h2>{landingText.access.companyTitle}</h2>
                <p>{landingText.access.companyText}</p>
              </div>
              <div className="nx-access-actions">
                <StarButton className="nx-btn nx-btn-primary" onClick={() => window.location.assign(destinoWorkspaceAdmin(rolUsuario))}>
                  {landingText.access.enterCompany}
                </StarButton>
                <button className="nx-btn nx-btn-minimal" onClick={() => goToLandingPath('/landing/cuenta')}>
                  {landingText.access.account}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="nx-access-copy">
                <span>{landingText.access.createEyebrow}</span>
                <h2>{landingText.access.createTitle}</h2>
                <p>{landingText.access.createText}</p>
              </div>
              <div className="nx-access-actions">
                <StarButton className="nx-btn nx-btn-primary" onClick={() => goToLandingPath('/landing/crear-empresa')}>
                  {landingText.access.createCompany}
                </StarButton>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sistema */}
      <div className="nx-section nx-reveal" id="sistema">
        <div className="nx-section-head">
          <span>{landingText.system.eyebrow}</span>
          <h2>{landingText.system.title}</h2>
          <p>{landingText.system.text}</p>
        </div>
        <div className="nx-value-grid">
          {landingText.system.cards.map(([title, text, icon], index) => (
            <GlowCard animated={index === 0} className="nx-value-card" key={title}>
              <div className="nx-card-topline"><Icon name={icon} /><span>{`0${index + 1}`}</span></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </GlowCard>
          ))}
        </div>
      </div>

      {/* Modulos */}
      <div className="nx-section nx-reveal" id="modulos">
        <div className="nx-section-head">
          <span>{landingText.modules.eyebrow}</span>
          <h2>{landingText.modules.title}</h2>
          <p>{landingText.modules.text}</p>
        </div>
        <div className="nx-module-grid">
          {landingText.modules.cards.map(([title, text, icon]) => (
            <GlowCard className="nx-module-card" key={title}>
              <div className="nx-module-icon"><Icon name={icon} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </GlowCard>
          ))}
        </div>
      </div>

      {/* Admin */}
      <div className="nx-admin-section nx-reveal" id="admin">
        <div className="nx-admin-copy">
          <span>{landingText.admin.eyebrow}</span>
          <h2>{landingText.admin.title}</h2>
          <p>{landingText.admin.text}</p>
        </div>
        <GlowCard className="nx-admin-console">
          <div><strong>{landingText.admin.live} </strong><span>{landingText.admin.active}</span></div>
          <ul>
            {landingText.admin.items.map((item, index) => (
              <li key={item}><span>{item}</span><b>{92 - index * 7}%</b></li>
            ))}
          </ul>
          <div className="nx-radar"><i /><i /><i /></div>
        </GlowCard>
      </div>

      {/* Seguridad */}
      <div className="nx-section nx-reveal" id="seguridad">
        <div className="nx-section-head">
          <span>{landingText.security.eyebrow}</span>
          <h2>{landingText.security.title}</h2>
          <p>{landingText.security.text}</p>
        </div>
        <div className="nx-ops-grid">
          {landingText.security.cards.map(([title, text, icon]) => (
            <GlowCard className="nx-ops-card" key={title}>
              <Icon name={icon} />
              <h3>{title}</h3>
              <p>{text}</p>
            </GlowCard>
          ))}
        </div>
      </div>

      {/* Implementacion */}
      <div className="nx-section nx-reveal" id="implementacion">
        <div className="nx-section-head">
          <span>{landingText.implementation.eyebrow}</span>
          <h2>{landingText.implementation.title}</h2>
          <p>{landingText.implementation.text}</p>
        </div>
        <div className="nx-integration-rail">
          {landingText.implementation.items.map(([item, icon]) => (
            <span key={item}><Icon name={icon} />{item}</span>
          ))}
        </div>
      </div>

      {/* Planes / Pricing */}
      <div className="nx-section nx-reveal" id="planes">
        <div className="nx-pricing-head">
          <div>
            <span>{landingText.pricing.eyebrow}</span>
            <h2>{landingText.pricing.title}</h2>
          </div>
          <div className="nx-toggle" role="group" aria-label="Facturación">
            <button className={billing === 'monthly' ? 'active' : ''} onClick={() => setBilling('monthly')}>{landingText.pricing.monthly}</button>
            <button className={billing === 'annual' ? 'active' : ''} onClick={() => setBilling('annual')}>{landingText.pricing.annual}</button>
          </div>
        </div>
        <div className="nx-plan-grid">
          {landingText.plans.map((plan) => {
            const benefitsOpen = plansExpanded;
            const planName = plan.name as NexxusPlan;
            const activeRank = activePlan ? PLAN_ORDER.indexOf(activePlan) : -1;
            const planRank = PLAN_ORDER.indexOf(planName);
            const isOwned = activePlan === planName;
            const isLowerPlan = activeRank > planRank;
            const isUpgrade = activeRank >= 0 && planRank > activeRank;
            return (
              <GlowCard className={`nx-plan ${plan.featured ? 'featured' : ''} ${selectedPlan === plan.name ? 'selected' : ''} ${isOwned ? 'is-owned-plan' : ''} ${isLowerPlan ? 'is-lower-plan' : ''}`} key={plan.name}>
                <div className="nx-plan-header">
                  <Icon name={plan.name === 'Starter' ? 'briefcase' : plan.name === 'Business' ? 'zap' : 'shield'} />
                  <span className="nx-plan-badge">{plan.badge}</span>
                </div>
                <h3>{plan.name}</h3>
                <div className="nx-price">${priceFor(plan.monthly, billing)}<small>/{billing === 'annual' ? 'Año' : 'Mes'}</small></div>
                <p className="nx-plan-users">{plan.users}</p>
                <div className="nx-plan-includes">
                  <strong>{landingText.pricing.includes}</strong>
                  <ul className="nx-plan-benefits">
                    {plan.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
                  </ul>
                </div>
                <button aria-expanded={benefitsOpen} className="nx-plan-benefits-toggle" onClick={() => togglePlanBenefits(plan.name)} type="button">
                  {benefitsOpen ? landingText.pricing.hideBenefits : landingText.pricing.viewBenefits}
                  <span>{benefitsOpen ? '-' : '+'}</span>
                </button>
                <div aria-hidden={!benefitsOpen} className={`nx-plan-details ${benefitsOpen ? 'is-open' : ''}`}>
                  {plan.detailGroups.map((group) => (
                    <div className="nx-plan-detail-group" key={group.title}>
                      <h4>{group.title}</h4>
                      <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
                    </div>
                  ))}
                </div>
                {isOwned || isLowerPlan ? (
                  <button className="nx-btn nx-btn-plan nx-plan-cta nx-plan-status" disabled type="button">
                    {isOwned ? 'Obtenido' : 'Incluido en tu plan'}
                  </button>
                ) : (
                  <StarButton className="nx-btn nx-btn-plan nx-plan-cta" onClick={() => { choosePlan(plan.name); abrirCheckout(plan.name); }}>
                    {isUpgrade ? 'Mejorar plan' : selectedPlan === plan.name ? landingText.pricing.createWithPlan : landingText.pricing.choosePlan}
                  </StarButton>
                )}
              </GlowCard>
            );
          })}
        </div>
      </div>

      {/* IA */}
      <section className="nx-ai-showcase nx-reveal" id="ia">
        <div className="nx-ai-showcase-main">
          <div className="nx-ai-showcase-copy">
            <span className="nx-ai-eyebrow"><Icon name="spark" />{landingText.ai.eyebrow}</span>
            <h2>IA que <em>transforma</em> datos operativos en decisiones estratégicas.</h2>
            <p>{landingText.ai.text}</p>
          </div>

          <div className="nx-ai-dashboard">
            <div className="nx-ai-dashboard-head">
              <strong><Icon name="spark" />Nexxus IA</strong>
              <span><i />Análisis en tiempo real</span>
            </div>
            <div className="nx-ai-dashboard-body">
              <div className="nx-ai-feature-list">
                {landingText.ai.features.map(([title, text, icon]) => (
                  <div className="nx-ai-feature" key={title}>
                    <div><Icon name={icon} /></div>
                    <span><strong>{title}</strong><small>{text}</small></span>
                  </div>
                ))}
              </div>
              <div className="nx-ai-analytics">
                <div className="nx-ai-chart-card">
                  <span>Rendimiento general</span>
                  <strong>92%</strong>
                  <small>↑ 18% <b>vs. semana anterior</b></small>
                  <svg aria-hidden="true" className="nx-ai-line-chart" viewBox="0 0 360 130" preserveAspectRatio="none">
                    <defs><linearGradient id="nx-ai-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#a855f7" stopOpacity=".4" /><stop offset="1" stopColor="#7c3aed" stopOpacity="0" /></linearGradient></defs>
                    <path d="M0 112 C24 93 34 104 55 86 S88 112 110 92 S145 49 166 68 S196 80 218 43 S256 34 277 36 S318 20 360 2 L360 130 L0 130Z" fill="url(#nx-ai-area)" />
                    <path d="M0 112 C24 93 34 104 55 86 S88 112 110 92 S145 49 166 68 S196 80 218 43 S256 34 277 36 S318 20 360 2" fill="none" stroke="#a855f7" strokeWidth="3" />
                  </svg>
                </div>
                <div className="nx-ai-mini-grid">
                  <div className="nx-ai-mini-card is-alert">
                    <span>Alertas activas</span>
                    <strong>7</strong>
                    <small>Requieren atención</small>
                    <div>
                      {[52, 68, 61, 74, 58].map((height, index) => (
                        <i key={index} style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="nx-ai-mini-card">
                    <span>Tareas completadas</span>
                    <strong>128</strong>
                    <small>↑ 24%</small>
                    <div>
                      {[38, 61, 34, 52, 84, 58, 71, 92, 67].map((height, index) => (
                        <i key={index} style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="nx-ai-impact-card">
                  <span>Áreas con mayor impacto</span>
                  {[['Operaciones', 92], ['Logística', 78], ['Soporte', 65]].map(([label, value]) => (
                    <div key={label}>
                      <small>{label}</small>
                      <i><b style={{ width: `${value}%` }} /></i>
                      <strong>{value}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="nx-ai-metrics">
          {landingText.metrics.map(([value, label, icon]) => (
            <div className="nx-ai-metric" key={label}><span><Icon name={icon} /></span><div><small>{label}</small><strong>{value}</strong></div></div>
          ))}
        </div>
        <blockquote className="nx-ai-legend"><Icon name="spark" /><span>{landingText.testimonial}</span></blockquote>
      </section>

      {/* CTA final */}
      <div className="nx-final-cta nx-reveal">
        <h2>{landingText.finalCta.title}</h2>
        <p>{landingText.finalCta.text}</p>
        <StarButton className="nx-btn nx-btn-primary" disabled={!authReady} onClick={handleFinalCta}>
          {finalCtaLabel}
        </StarButton>
      </div>

      {/* Footer */}
      <LandingFooter onSection={(id) => scrollToId(id, navHeight)} />
    </div>
  );
}