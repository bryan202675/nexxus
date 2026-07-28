/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/admin/adminTheme.ts
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { createContext, useContext } desde React; habilita componentes, hooks y tipos base para esta pieza.
import { createContext, useContext } from 'react';
// Importa { Platform } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Platform } from 'react-native';

/**
 * Declaracion ADMIN. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const ADMIN = {
  fondo: 'var(--nx-admin-fondo, #040404)',
  fondoProfundo: 'var(--nx-admin-fondo-profundo, #040404)',
  fondoElevado: 'var(--nx-admin-fondo-elevado, rgba(12, 10, 26, 0.86))',
  fondoVidrio: 'var(--nx-admin-fondo-vidrio, rgba(13, 11, 30, 0.60))',
  fondoVidrioFuerte: 'var(--nx-admin-fondo-vidrio-fuerte, rgba(13, 11, 30, 0.92))',
  fondoCampo: 'var(--nx-admin-fondo-campo, rgba(255,255,255,0.045))',
  borde: 'var(--nx-admin-borde, rgba(210, 198, 255, 0.13))',
  bordeFuerte: 'var(--nx-admin-borde-fuerte, rgba(210, 198, 255, 0.26))',
  bordeSuave: 'var(--nx-admin-borde-suave, rgba(255,255,255,0.07))',
  texto: 'var(--nx-admin-texto, #F8FBFF)',
  textoSecundario: 'var(--nx-admin-texto-secundario, #B8B0D8)',
  textoSuave: 'var(--nx-admin-texto-suave, #817AA6)',
  primario: 'var(--nx-admin-primario, #7C3AED)',
  primarioClaro: 'var(--nx-admin-primario-claro, #A855F7)',
  violeta: 'var(--nx-admin-violeta, #C4B5FD)',
  azul: 'var(--nx-admin-azul, #2563EB)',
  cyanReal: '#22D3EE',
  exito: '#22C55E',
  alerta: '#F59E0B',
  error: '#EF4444',
  cyan: '#C084FC',
  grafito: 'var(--nx-admin-grafito, #0D0B1E)',
  superficie: 'var(--nx-admin-superficie, rgba(13, 11, 30, 0.64))',
  superficieSuave: 'var(--nx-admin-superficie-suave, rgba(255,255,255,0.035))',
  superficieHover: 'var(--nx-admin-superficie-hover, rgba(255,255,255,0.065))',
  gradientePrincipal: ['#7C3AED', '#A855F7', '#2563EB'] as const,
  gradienteSutil: ['rgba(124,58,237,0.34)', 'rgba(37,99,235,0.16)'] as const,
  iconos: {
    personas: '#38BDF8',
    organizacion: '#8B5CF6',
    comunicacion: '#06B6D4',
    calendario: '#3B82F6',
    dinero: '#22C55E',
    tareas: '#F59E0B',
    auditoria: '#A78BFA',
    documentos: '#60A5FA',
    seguridad: '#C084FC',
    exito: '#22C55E',
    advertencia: '#F59E0B',
    peligro: '#EF4444',
    neutro: '#B7ACD8',
  },
  radio: 12,
  radioPequeno: 8,
  radioGrande: 16,
};

/**
 * Declaracion sombraAdmin. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const sombraAdmin = {
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.28,
      shadowRadius: 30,
    },
    android: {
      elevation: 10,
    },
    web: {
      boxShadow: '0 16px 30px rgba(0,0,0,0.28)',
    },
  }),
};

/**
 * Describe la forma tipada AdminMode; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type AdminMode = 'dark' | 'light';

/**
 * Describe la forma tipada AdminPalette; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type AdminPalette = {
  mode: AdminMode;
  isDark: boolean;
  bg: string;
  bgDeep: string;
  sidebar: string;
  sidebarStrong: string;
  panel: string;
  panelStrong: string;
  chip: string;
  chipStrong: string;
  border: string;
  borderStrong: string;
  text: string;
  muted: string;
  soft: string;
  primary: string;
  purple: string;
  blue: string;
  glowA: string;
  glowB: string;
  success: string;
  warning: string;
  danger: string;
  navTint: 'dark' | 'light';
  gradient: readonly [string, string, string];
  adminVars: Record<string, string>;
};

/**
 * Declaracion ADMIN_THEMES. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const ADMIN_THEMES: Record<AdminMode, AdminPalette> = {
  dark: {
    mode: 'dark',
    isDark: true,
    bg: '#040404',
    bgDeep: '#040404',
    sidebar: '#040404',
    sidebarStrong: '#040404',
    panel: 'rgba(13, 9, 27, 0.72)',
    panelStrong: 'rgba(15, 11, 34, 0.92)',
    chip: 'rgba(255,255,255,0.045)',
    chipStrong: 'rgba(255,255,255,0.075)',
    border: 'rgba(210,198,255,0.14)',
    borderStrong: 'rgba(210,198,255,0.28)',
    text: '#F8FBFF',
    muted: '#B8B0D8',
    soft: '#817AA6',
    primary: '#7C3AED',
    purple: '#A855F7',
    blue: '#2563EB',
    glowA: 'rgba(124,58,237,0.16)',
    glowB: 'rgba(37,99,235,0.11)',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    navTint: 'dark',
    gradient: ['#7C3AED', '#A855F7', '#2563EB'],
    adminVars: {
      '--nx-admin-fondo': '#040404',
      '--nx-admin-fondo-profundo': '#040404',
      '--nx-admin-fondo-elevado': 'rgba(12, 10, 26, 0.86)',
      '--nx-admin-fondo-vidrio': 'rgba(13, 11, 30, 0.60)',
      '--nx-admin-fondo-vidrio-fuerte': 'rgba(13, 11, 30, 0.92)',
      '--nx-admin-fondo-campo': 'rgba(255,255,255,0.045)',
      '--nx-admin-borde': 'rgba(210, 198, 255, 0.13)',
      '--nx-admin-borde-fuerte': 'rgba(210, 198, 255, 0.26)',
      '--nx-admin-borde-suave': 'rgba(255,255,255,0.07)',
      '--nx-admin-texto': '#F8FBFF',
      '--nx-admin-texto-secundario': '#B8B0D8',
      '--nx-admin-texto-suave': '#817AA6',
      '--nx-admin-primario': '#7C3AED',
      '--nx-admin-primario-claro': '#A855F7',
      '--nx-admin-violeta': '#C4B5FD',
      '--nx-admin-azul': '#2563EB',
      '--nx-admin-grafito': '#0D0B1E',
      '--nx-admin-superficie': 'rgba(13, 11, 30, 0.64)',
      '--nx-admin-superficie-suave': 'rgba(255,255,255,0.035)',
      '--nx-admin-superficie-hover': 'rgba(255,255,255,0.065)',
    },
  },
  light: {
    mode: 'light',
    isDark: false,
    bg: '#F4F7FE',
    bgDeep: '#E2E8F0',
    sidebar: '#FFFFFF',
    sidebarStrong: '#FFFFFF',
    panel: '#FFFFFF',
    panelStrong: '#FFFFFF',
    chip: '#F4F7FE',
    chipStrong: '#E2E8F0',
    border: '#E2E8F0',
    borderStrong: 'rgba(124,58,237,0.34)',
    text: '#17122B',
    muted: '#5F577D',
    soft: '#857DA4',
    primary: '#6D28D9',
    purple: '#9333EA',
    blue: '#2563EB',
    glowA: 'rgba(124,58,237,0.18)',
    glowB: 'rgba(37,99,235,0.13)',
    success: '#15803D',
    warning: '#B45309',
    danger: '#DC2626',
    navTint: 'light',
    gradient: ['#7C3AED', '#A855F7', '#2563EB'],
    adminVars: {
      '--nx-admin-fondo': '#F7F5FF',
      '--nx-admin-fondo-profundo': '#EEE9FF',
      '--nx-admin-fondo-elevado': 'rgba(255, 255, 255, 0.88)',
      '--nx-admin-fondo-vidrio': 'rgba(255, 255, 255, 0.68)',
      '--nx-admin-fondo-vidrio-fuerte': 'rgba(255, 255, 255, 0.96)',
      '--nx-admin-fondo-campo': 'rgba(82,58,150,0.07)',
      '--nx-admin-borde': 'rgba(91,65,150,0.16)',
      '--nx-admin-borde-fuerte': 'rgba(124,58,237,0.34)',
      '--nx-admin-borde-suave': 'rgba(91,65,150,0.10)',
      '--nx-admin-texto': '#17122B',
      '--nx-admin-texto-secundario': '#5F577D',
      '--nx-admin-texto-suave': '#857DA4',
      '--nx-admin-primario': '#6D28D9',
      '--nx-admin-primario-claro': '#9333EA',
      '--nx-admin-violeta': '#6D28D9',
      '--nx-admin-azul': '#2563EB',
      '--nx-admin-grafito': '#FFFFFF',
      '--nx-admin-superficie': 'rgba(255, 255, 255, 0.78)',
      '--nx-admin-superficie-suave': 'rgba(82,58,150,0.055)',
      '--nx-admin-superficie-hover': 'rgba(124,58,237,0.10)',
    },
  },
};

/**
 * Describe la forma tipada AdminAppearanceContextValue; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type AdminAppearanceContextValue = {
  theme: AdminPalette;
  mode: AdminMode;
  toggleMode: () => void;
  setMode: (mode: AdminMode) => void;
};

/**
 * Declaracion AdminAppearanceContext. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const AdminAppearanceContext = createContext<AdminAppearanceContextValue>({
  theme: ADMIN_THEMES.dark,
  mode: 'dark',
  toggleMode: () => {},
  setMode: () => {},
});

/**
 * Hook useAdminAppearance. Expone estado derivado y acciones reutilizables para componentes React.
 */
export const useAdminAppearance = () => useContext(AdminAppearanceContext);

/**
 * Declaracion sombraVioleta. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const sombraVioleta = {
  ...Platform.select({
    ios: {
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.16,
      shadowRadius: 28,
    },
    android: {
      elevation: 8,
    },
    web: {
      boxShadow: '0 14px 28px rgba(124,58,237,0.16)',
    },
  }),
};
