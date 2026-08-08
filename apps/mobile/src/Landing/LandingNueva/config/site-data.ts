import type { IconName } from './icons';

export const siteData = {
  meta: {
    title: 'Nexxus | Impulsa tu empresa con rendimiento real',
    description: 'Nexxus centraliza empleados, tareas, asistencia, nómina, IA y analytics para empresas modernas.',
  },

  nav: [
    { label: 'Sistema', id: 'sistema' },
    { label: 'Módulos', id: 'modulos' },
    { label: 'Admin', id: 'admin' },
    { label: 'Planes', id: 'planes' },
    { label: 'IA', id: 'ia' },
  ],

  hero: {
    title: 'Gestiona tu empresa desde un solo lugar',
    subtitle:
      'Nexxus conecta administración, empleados, tareas, asistencia, nómina, bienestar e IA en un solo lugar para operar con claridad y velocidad.',
    primaryCta: { label: 'Registrarse', icon: 'building' as IconName },
    secondaryCta: { label: 'Conocer Planes', icon: 'briefcase' as IconName, targetId: 'planes' },
  },

  access: {
    guest: {
      eyebrow: 'Conoce Nexxus',
      title: 'Descubre una forma más clara de gestionar tu empresa.',
      text: 'Conoce el sistema que conecta personas, procesos e información en un solo lugar.',
      primaryCta: { label: 'Ver cómo funciona', targetId: 'sistema' },
      secondaryCta: { label: 'Iniciar sesión' },
    },
    company: {
      eyebrow: 'Tu espacio empresarial',
      title: 'Tu empresa está lista para continuar.',
      text: 'Accede directamente a tu espacio de trabajo y retoma la operación donde la dejaste.',
      primaryCta: { label: 'Acceder a mi empresa' },
      secondaryCta: { label: 'Gestionar cuenta' },
    },
    createCompany: {
      eyebrow: 'Completa tu configuración',
      title: 'Crea tu empresa para empezar a trabajar en Nexxus.',
      text: 'Configura los datos de tu organización y activa tu espacio empresarial.',
      primaryCta: { label: 'Crear empresa' },
    },
  },

  metrics: [
    { value: '34%', label: 'menos tiempo operativo', icon: 'zap' as IconName },
    { value: '4.8x', label: 'más trazabilidad', icon: 'shield' as IconName },
    { value: '72h', label: 'para activar equipos', icon: 'clock' as IconName },
    { value: '99.9%', label: 'visión centralizada', icon: 'activity' as IconName },
  ],

  system: {
    eyebrow: 'Sistema',
    title: 'La plataforma operativa para equipos modernos.',
    text: 'Todo lo que necesitas para administrar tu organización desde una única plataforma.',
    cards: [
      { title: 'Automatización', text: 'Flujos inteligentes que eliminan tareas repetitivas.', icon: 'automation' as IconName },
      { title: 'Visibilidad', text: 'Información actualizada para actuar sin retrasos.', icon: 'activity' as IconName },
      { title: 'Inteligencia', text: 'IA que transforma datos en decisiones accionables.', icon: 'ai' as IconName },
    ],
  },

  modules: {
    eyebrow: 'Módulos',
    title: 'Todo lo que tu empresa necesita en una sola plataforma.',
    text: 'Gestiona operaciones, equipos, comunicación e inteligencia empresarial desde un único lugar.',
    cards: [
      { title: 'Operación diaria', text: 'Tareas, asistencia y calendarios para mantener cada operación bajo control.', icon: 'command' as IconName },
      { title: 'Personas y estructura', text: 'Empleados, roles, departamentos y sucursales organizados de forma centralizada.', icon: 'users' as IconName },
      { title: 'Comunicación interna', text: 'Chats, anuncios y documentos compartidos para equipos mejor conectados.', icon: 'message' as IconName },
      { title: 'Inteligencia y control', text: 'Reportes, métricas e IA para supervisar el negocio y tomar decisiones con confianza.', icon: 'analytics' as IconName },
    ],
  },

  admin: {
    eyebrow: 'Administrador',
    title: 'Control total de la operación.',
    text: 'Supervisa equipos, procesos y métricas desde un panel centralizado diseñado para tomar decisiones con rapidez y confianza.',
    liveLabel: 'Operaciones en vivo',
    items: [
      { label: 'Equipo', value: 92 },
      { label: 'Nómina', value: 85 },
      { label: 'Auditoría', value: 78 },
      { label: 'Comunicación', value: 71 },
    ],
  },

  security: {
    eyebrow: 'Seguridad y control',
    title: 'Diseñado para crecer sin perder el control.',
    text: 'Estructura, permisos y procesos que mantienen la operación segura, organizada y escalable.',
    cards: [
      { title: 'Auditoría continua', text: 'Cada acción queda registrada para garantizar trazabilidad y cumplimiento.', icon: 'shield' as IconName },
      { title: 'Datos centralizados', text: 'Toda la información de la empresa conectada en una única fuente de verdad.', icon: 'database' as IconName },
      { title: 'Flujos inteligentes', text: 'Aprobaciones, solicitudes y procesos automatizados con reglas claras.', icon: 'workflow' as IconName },
      { title: 'Gestión documental', text: 'Documentos protegidos, organizados y accesibles cuando se necesitan.', icon: 'file' as IconName },
    ],
  },

  implementation: {
    eyebrow: 'Implementación',
    title: 'Se adapta a tu operación desde el primer día.',
    text: 'Implementa Nexxus sin cambiar la forma en que tu empresa trabaja. Centraliza procesos, equipos e información en una sola plataforma.',
    items: [
      { label: 'Datos en la nube', icon: 'database' as IconName },
      { label: 'RRHH', icon: 'users' as IconName },
      { label: 'Nómina', icon: 'payroll' as IconName },
      { label: 'Datos en tiempo real', icon: 'analytics' as IconName },
      { label: 'Documentos', icon: 'file' as IconName },
      { label: 'Comunicación', icon: 'message' as IconName },
    ],
  },

  pricing: {
    eyebrow: 'Planes',
    title: 'Desde equipos pequeños hasta operaciones empresariales.',
    monthlyLabel: 'Mensual',
    annualLabel: 'Anual -20%',
    includesLabel: 'Incluye:',
    viewBenefitsLabel: 'Ver beneficios del plan',
    hideBenefitsLabel: 'Ocultar beneficios del plan',
    choosePlanLabel: 'Elegir plan',
    createWithPlanLabel: 'Crear con este plan',
    annualDiscount: 0.6,
  },

  plans: [
    {
      name: 'Starter',
      monthly: 20,
      badge: 'Para equipos en crecimiento',
      icon: 'briefcase' as IconName,
      users: '1 empresa · hasta 15 empleados · 1 sucursal · 1 administrador',
      benefits: ['Empleados, asistencia y tareas', 'Anuncios, chat interno y calendario', 'Documentos básicos', 'Reportes básicos'],
      detailGroups: [
        { title: 'Empresa', items: ['1 empresa', 'Hasta 15 empleados', '1 sucursal', '1 administrador'] },
        { title: 'Módulos incluidos', items: ['Empleados', 'Asistencia', 'Tareas', 'Anuncios', 'Chat interno', 'Calendario', 'Documentos básicos'] },
        { title: 'Limitaciones funcionales', items: ['Historial de 30 días', 'Máximo 3 departamentos', 'Reportes básicos', 'Exportaciones limitadas', 'Sin personalización avanzada', 'Sin permisos avanzados', 'Sin métricas avanzadas'] },
      ],
      featured: false,
    },
    {
      name: 'Business',
      monthly: 50,
      badge: 'Más elegido',
      icon: 'zap' as IconName,
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
      icon: 'shield' as IconName,
      users: 'Todo lo del Business + empleados, sedes y administradores ilimitados',
      benefits: ['Multiempresa', 'Panel corporativo global', 'Auditoría completa', 'KPIs empresariales'],
      detailGroups: [
        { title: 'Sin límites', items: ['Empleados ilimitados', 'Administradores ilimitados', 'Departamentos ilimitados', 'Sucursales ilimitadas'] },
        { title: 'Funciones enterprise', items: ['Multiempresa', 'Panel corporativo global', 'Auditoría completa', 'Historial ilimitado', 'Logs empresariales', 'Permisos ultra avanzados', 'Control por sucursal', 'Control por departamento', 'Accesos jerárquicos'] },
        { title: 'Analítica avanzada', items: ['KPIs empresariales', 'Métricas en tiempo real', 'Reportes ejecutivos', 'Estadísticas avanzadas'] },
      ],
      featured: false,
    },
  ],

  ai: {
    eyebrow: 'Inteligencia operativa',
    title: 'IA que transforma datos operativos en decisiones estratégicas.',
    titleEmphasis: 'transforma',
    text: 'Nexxus IA analiza tu operación en tiempo real para detectar riesgos, priorizar acciones y aumentar la eficiencia de tu equipo.',
    features: [
      { title: 'Rendimiento de equipos', text: 'Mide productividad y cumplimiento por áreas y equipos.', icon: 'analytics' as IconName },
      { title: 'Alertas inteligentes', text: 'Detecta incidencias y oportunidades antes de que ocurran.', icon: 'shield' as IconName },
      { title: 'Resumen ejecutivo', text: 'Reportes claros y listos para decidir.', icon: 'users' as IconName },
      { title: 'Acciones prioritarias', text: 'La IA sugiere qué hacer y en qué enfocarse.', icon: 'command' as IconName },
      { title: 'Bienestar y carga laboral', text: 'Monitorea la carga operativa y el bienestar del equipo.', icon: 'activity' as IconName },
    ],
    dashboard: {
      title: 'Nexxus IA',
      statusLabel: 'Análisis en tiempo real',
      performance: {
        label: 'Rendimiento general',
        value: '92%',
        change: '↑ 18%',
        changeLabel: 'vs. semana anterior',
      },
      alerts: {
        label: 'Alertas activas',
        value: '7',
        subtext: 'Requieren atención',
        bars: [52, 68, 61, 74, 58],
      },
      tasksCompleted: {
        label: 'Tareas completadas',
        value: '128',
        change: '↑ 24%',
        bars: [38, 61, 34, 52, 84, 58, 71, 92, 67],
      },
      impactAreas: {
        label: 'Áreas con mayor impacto',
        items: [
          { label: 'Operaciones', value: 92 },
          { label: 'Logística', value: 78 },
          { label: 'Soporte', value: 65 },
        ],
      },
    },
  },

  testimonial: 'Nexxus transforma la gestión empresarial en una operación conectada, medible y preparada para crecer.',

  finalCta: {
    title: 'Tu empresa no necesita más herramientas. Necesita un sistema conectado.',
    text: 'Centraliza personas, procesos y decisiones en una plataforma diseñada para operar, controlar y escalar con confianza.',
  },

  footer: {
    brand: 'Nexxus',
    tagline: 'Inteligencia para operaciones modernas',
    links: {
      product: 'Producto',
      plans: 'Planes',
      security: 'Seguridad',
      contact: 'Contacto',
      privacy: 'Privacidad',
    },
  },
};

export type SiteData = typeof siteData;
