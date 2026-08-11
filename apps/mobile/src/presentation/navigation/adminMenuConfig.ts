/**
 * Documentacion Nexxus - apps/mobile/src/presentation/navigation/adminMenuConfig.ts
 * Capa: presentacion.
 * Proposito: Configuracion de menu, busqueda y banners del shell de AdminNavigator, separada por rol
 * (admin de empresa vs super admin) para que ambos paneles compartan el mismo shell visual sin
 * mezclar sus rutas.
 * Consideracion de mantenimiento: agregar aqui cualquier pantalla nueva de uno u otro panel; nunca
 * dentro de AdminNavigator.tsx directamente.
 */

import { MaterialIcons } from '@expo/vector-icons';
import { isSuperAdminRole } from '@/shared/auth/roles';

export type AdminMenuItem = {
  name: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

export type AdminSearchItem = {
  route: string;
  title: string;
  detail: string;
};

export type AdminScreenBanner = {
  title: string;
  eyebrow: string;
  description: string;
  icon: string;
};

export const COMPANY_MENU_ITEMS: AdminMenuItem[] = [
  { name: 'DashboardGeneral', label: 'Centro operativo', icon: 'dashboard-customize' },
  { name: 'CentroReportesSolicitudes', label: 'Solicitudes', icon: 'assignment' },
  { name: 'GestionAsistencia', label: 'Asistencia', icon: 'schedule' },
  { name: 'CalendarioEmpresarial', label: 'Calendario', icon: 'event-note' },
  { name: 'GestionPlantilla', label: 'Plantilla', icon: 'people-outline' },
  { name: 'EstructuraOrganizativa', label: 'Estructura', icon: 'account-tree' },
  { name: 'GestionNomina', label: 'Nómina', icon: 'payments' },
  { name: 'GestionInventario', label: 'Inventario', icon: 'inventory-2' },
  { name: 'MensajeriaInternaAdmin', label: 'Mensajería', icon: 'chat' },
  { name: 'ChatIAAdmin', label: 'IA', icon: 'auto-awesome' },
  { name: 'ComunicacionAdmin', label: 'Comunicación', icon: 'forum' },
  { name: 'GestionDocumentos', label: 'Documentos', icon: 'folder' },
  { name: 'Automatizaciones', label: 'Automatizaciones', icon: 'bolt' },
  { name: 'AuditoriaLogs', label: 'Auditoría', icon: 'manage-search' },
  { name: 'ConfiguracionAdmin', label: 'Configuración', icon: 'tune' },
];

export const SUPERADMIN_MENU_ITEMS: AdminMenuItem[] = [
  { name: 'SaResumen', label: 'Resumen global', icon: 'public' },
  { name: 'SaEmpresas', label: 'Empresas', icon: 'domain' },
  { name: 'SaUsuarios', label: 'Usuarios', icon: 'groups' },
  { name: 'SaNexxusIA', label: 'Nexxus AI', icon: 'auto-awesome' },
  { name: 'SaPagosPlanes', label: 'Pagos y planes', icon: 'payments' },
  { name: 'SaAuditoria', label: 'Auditoría', icon: 'manage-search' },
  { name: 'SaSoporte', label: 'Soporte', icon: 'support-agent' },
  { name: 'SaConfiguracion', label: 'Configuración', icon: 'tune' },
];

export const COMPANY_SEARCH_ITEMS: AdminSearchItem[] = [
  { route: 'DashboardGeneral', title: 'Centro operativo', detail: 'productividad, aprobaciones, alertas, check-ins, actividad' },
  { route: 'CentroReportesSolicitudes', title: 'Reportes y solicitudes', detail: 'ausencias, permisos, aprobaciones, reportes disciplinarios, desempeño' },
  { route: 'GestionAsistencia', title: 'Asistencia y horarios', detail: 'entradas, salidas, tardanzas, horas trabajadas, salidas anticipadas' },
  { route: 'CalendarioEmpresarial', title: 'Calendario empresarial', detail: 'eventos, reuniones, feriados, agenda' },
  { route: 'GestionPlantilla', title: 'Plantilla', detail: 'empleados, sedes, roles, departamentos, tareas' },
  { route: 'EstructuraOrganizativa', title: 'Estructura organizativa', detail: 'departamentos, cargos, jerarquías, sedes' },
  { route: 'GestionNomina', title: 'Nómina', detail: 'pagos, salarios, planilla, compensación' },
  { route: 'GestionInventario', title: 'Inventario e incidencias', detail: 'activos asignados, equipo, herramientas, reportes internos' },
  { route: 'MensajeriaInternaAdmin', title: 'Mensajería interna', detail: 'conversaciones, mensajes, imágenes, documentos, soporte' },
  { route: 'ChatIAAdmin', title: 'IA empresarial', detail: 'resumen semanal, asistencia, tareas, reportes, nómina, rendimiento' },
  { route: 'ComunicacionAdmin', title: 'Comunicación', detail: 'anuncios, notificaciones, mensajes' },
  { route: 'GestionDocumentos', title: 'Documentos', detail: 'pdf, archivos, cloudinary, almacenamiento, métricas' },
  { route: 'Automatizaciones', title: 'Automatizaciones', detail: 'reglas SI/ENTONCES, tareas vencidas, solicitudes pendientes, check-in faltante' },
  { route: 'AuditoriaLogs', title: 'Auditoría', detail: 'logs, seguridad, eventos, actividad' },
  { route: 'ConfiguracionAdmin', title: 'Configuración', detail: 'tema, cuenta, preferencias, sistema' },
];

export const SUPERADMIN_SEARCH_ITEMS: AdminSearchItem[] = [
  { route: 'SaResumen', title: 'Resumen global', detail: 'empresas, usuarios, planes, ingresos, riesgos de la plataforma' },
  { route: 'SaEmpresas', title: 'Empresas', detail: 'todas las empresas, planes, propietarios, banear, eliminar, soporte' },
  { route: 'SaUsuarios', title: 'Usuarios', detail: 'usuarios de cualquier empresa, roles, banear, eliminar, restablecer contraseña' },
  { route: 'SaNexxusIA', title: 'Nexxus AI', detail: 'gasto, tokens, costo por empresa, consultas recientes' },
  { route: 'SaPagosPlanes', title: 'Pagos y planes', detail: 'ingresos, catálogo de planes, suscripciones' },
  { route: 'SaAuditoria', title: 'Auditoría global', detail: 'logs de toda la plataforma, seguridad, eventos críticos' },
  { route: 'SaSoporte', title: 'Soporte', detail: 'sesiones de soporte, impersonación, respaldos' },
  { route: 'SaConfiguracion', title: 'Configuración', detail: 'tema, idioma, cuenta, contraseña de acceso' },
];

export const COMPANY_SCREEN_BANNERS: Record<string, AdminScreenBanner> = {
  DashboardGeneral: {
    title: 'Centro operativo',
    eyebrow: 'Nexxus Command',
    description: 'Visión general de actividad, riesgo, productividad y señales vivas de la empresa.',
    icon: 'dashboard-customize',
  },
  CentroReportesSolicitudes: {
    title: 'Reportes y solicitudes',
    eyebrow: 'RRHH operativo',
    description: 'Bandeja unificada de ausencias, solicitudes internas, reportes y aprobaciones con trazabilidad.',
    icon: 'assignment',
  },
  GestionAsistencia: {
    title: 'Asistencia y horarios',
    eyebrow: 'Control operativo',
    description: 'Entradas, salidas, tardanzas, horas trabajadas y salidas anticipadas según horario de empresa.',
    icon: 'schedule',
  },
  CalendarioEmpresarial: {
    title: 'Calendario empresarial',
    eyebrow: 'Agenda central',
    description: 'Eventos, feriados, reuniones y planificación operativa en un solo panel.',
    icon: 'event-note',
  },
  GestionPlantilla: {
    title: 'Gestión de plantilla',
    eyebrow: 'Personas y equipos',
    description: 'Géstion de todo tu equipo en un solo lugar.',
    icon: 'people-outline',
  },
  EstructuraOrganizativa: {
    title: 'Estructura organizativa',
    eyebrow: 'Arquitectura interna',
    description: 'Departamentos, jerarquías, líderes y distribución funcional de la empresa.',
    icon: 'account-tree',
  },
  GestionNomina: {
    title: 'Gestión de nómina',
    eyebrow: 'Pagos y compensación',
    description: 'Salarios, estados de pago, configuración y trazabilidad financiera.',
    icon: 'payments',
  },
  GestionInventario: {
    title: 'Inventario e incidencias',
    eyebrow: 'Activos internos',
    description: 'Control de activos asignados, devoluciones e incidencias reportadas por empleados.',
    icon: 'inventory-2',
  },
  ComunicacionAdmin: {
    title: 'Comunicación',
    eyebrow: 'Mensajería empresarial',
    description: 'Anuncios, audiencias, notificaciones y canales internos.',
    icon: 'forum',
  },
  MensajeriaInternaAdmin: {
    title: 'Mensajería',
    eyebrow: 'Chat interno',
    description: 'Conversaciones internas entre colaboradores.',
    icon: 'chat',
  },
  ChatIAAdmin: {
    title: 'IA empresarial',
    eyebrow: 'Nexxus AI',
    description: 'Consultas operativas de empresa, asistencia, rendimiento, reportes, nómina y señales ejecutivas con aislamiento por tenant.',
    icon: 'auto-awesome',
  },
  GestionDocumentos: {
    title: 'Documentos',
    eyebrow: 'Almacenamiento controlado',
    description: 'PDFs, uso por empresa, deduplicación y limpieza segura de archivos.',
    icon: 'folder',
  },
  Automatizaciones: {
    title: 'Automatizaciones',
    eyebrow: 'Reglas SI/ENTONCES',
    description: 'Tareas vencidas, solicitudes sin resolver y check-in faltante, notificados solos en la Bandeja Unificada.',
    icon: 'bolt',
  },
  AuditoriaLogs: {
    title: 'Auditoría',
    eyebrow: 'Seguridad y eventos',
    description: 'Logs, acciones críticas, advertencias y revisión de actividad del sistema.',
    icon: 'manage-search',
  },
  ConfiguracionAdmin: {
    title: 'Configuración',
    eyebrow: 'Control del sistema',
    description: 'Tema, idioma, accesos de navbar, cuenta, seguridad y preferencias del admin.',
    icon: 'tune',
  },
};

export const SUPERADMIN_SCREEN_BANNERS: Record<string, AdminScreenBanner> = {
  SaResumen: {
    title: 'Resumen global',
    eyebrow: 'Nexxus Platform',
    description: 'Empresas, usuarios, planes e ingresos de toda la plataforma en un solo panel.',
    icon: 'public',
  },
  SaEmpresas: {
    title: 'Empresas',
    eyebrow: 'Control de tenants',
    description: 'Todas las empresas de Nexxus: plan, estado de suscripción, propietario y acciones administrativas.',
    icon: 'domain',
  },
  SaUsuarios: {
    title: 'Usuarios',
    eyebrow: 'Cuentas de la plataforma',
    description: 'Usuarios de cualquier empresa y rol: editar, cambiar rol, banear, eliminar o restablecer contraseña.',
    icon: 'groups',
  },
  SaNexxusIA: {
    title: 'Nexxus AI',
    eyebrow: 'Gasto de la plataforma',
    description: 'Costo real, tokens y consultas de Nexxus AI por empresa y por modelo.',
    icon: 'auto-awesome',
  },
  SaPagosPlanes: {
    title: 'Pagos y planes',
    eyebrow: 'Ingresos de la plataforma',
    description: 'Ingresos confirmados, distribución de planes y catálogo de precios.',
    icon: 'payments',
  },
  SaAuditoria: {
    title: 'Auditoría global',
    eyebrow: 'Seguridad de la plataforma',
    description: 'Todos los eventos auditados de todas las empresas, sin excepción.',
    icon: 'manage-search',
  },
  SaSoporte: {
    title: 'Soporte',
    eyebrow: 'Asistencia técnica',
    description: 'Sesiones de soporte auditadas e impersonación temporal de administradores de empresa.',
    icon: 'support-agent',
  },
  SaConfiguracion: {
    title: 'Configuración',
    eyebrow: 'Cuenta de plataforma',
    description: 'Tema, idioma, contraseña de acceso y tarifas de Nexxus AI.',
    icon: 'tune',
  },
};

export const esPanelSuperAdmin = (rol?: string | null) => isSuperAdminRole(rol);

export const getAdminMenu = (rol?: string | null): AdminMenuItem[] =>
  esPanelSuperAdmin(rol) ? SUPERADMIN_MENU_ITEMS : COMPANY_MENU_ITEMS;

export const getAdminSearchItems = (rol?: string | null): AdminSearchItem[] =>
  esPanelSuperAdmin(rol) ? SUPERADMIN_SEARCH_ITEMS : COMPANY_SEARCH_ITEMS;

export const getScreenBanners = (rol?: string | null): Record<string, AdminScreenBanner> =>
  esPanelSuperAdmin(rol) ? SUPERADMIN_SCREEN_BANNERS : COMPANY_SCREEN_BANNERS;

export const getInitialRoute = (rol?: string | null): string => getAdminMenu(rol)[0].name;

export const ADMIN_ROUTE_NAMES: string[] = [
  ...COMPANY_MENU_ITEMS.map((item) => item.name),
  ...SUPERADMIN_MENU_ITEMS.map((item) => item.name),
];
