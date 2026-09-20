import { Platform } from 'react-native';

/**
 * Documentacion Nexxus - apps/mobile/src/shared/constants/diseno.ts
 * Capa: compartido.
 * Proposito: Constantes compartidas. Centraliza tokens visuales y valores comunes para evitar estilos duplicados.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

export const ANIMACIONES = {
  spring: {
    bouncy: { tension: 60, friction: 5, useNativeDriver: true },
    smooth: { tension: 40, friction: 8, useNativeDriver: true },
    stiff: { tension: 100, friction: 10, useNativeDriver: true },
  },
  timing: {
    rapida: { duration: 150, useNativeDriver: true },
    normal: { duration: 300, useNativeDriver: true },
    lenta: { duration: 500, useNativeDriver: true },
  }
};

/**
 * Declaracion COLORES. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const COLORES = {
  primario: '#7C3AED',
  primarioFuerte: '#6D28D9',
  primarioClaro: '#A78BFA',
  blanco: '#FFFFFF',
  secundario: '#2563EB',
  secundarioFuerte: '#2563EB',
  secundarioClaro: '#38BDF8',
  acento: '#C084FC',
  exito: '#22C55E',
  alerta: '#F59E0B',
  error: '#EF4444',
  fondo: '#070712',
  fondoOscuro: '#02030A',
  fondoProfundo: '#02030A',
  fondoVioleta: '#1E1B4B',
  superficie: '#121226',
  superficieVidrio: 'rgba(255, 255, 255, 0.075)',
  superficieVidrioOscura: 'rgba(255, 255, 255, 0.045)',
  superficieSuave: 'rgba(255, 255, 255, 0.06)',
  superficieSecundaria: '#0D1020',
  borde: 'rgba(255, 255, 255, 0.12)',
  bordeFuerte: 'rgba(255, 255, 255, 0.2)',
  texto: '#F8FAFF',
  textoSecundario: 'rgba(232,238,255,0.72)',
  textoSuave: 'rgba(232,238,255,0.48)',
  textoInverso: '#000000',
  sombra: '#000000',
  cardGradient: ['#171717', '#0A0A0A'] as const,

  // Aliases para compatibilidad
  sobreSuperficie: '#F8FAFC',
  sobreSuperficieVariante: '#94A3B8',
  superficieContenedorBaja: '#111827',
  superficieContenedorAlta: 'rgba(255, 255, 255, 0.08)',
  superficieContenedorMinima: '#0F172A',
  superficieContenedorMaxima: 'rgba(255, 255, 255, 0.12)',
  contorno: '#64748B',
  contornoVariante: 'rgba(255, 255, 255, 0.1)',
  contenedorPrimario: 'rgba(124, 58, 237, 0.2)',
  contenedorSecundario: 'rgba(59, 130, 246, 0.2)',
  contenedorError: 'rgba(239, 68, 68, 0.2)',
  fijoPrimarioDim: '#7C3AED',
  terciarioDim: '#8B5CF6',
};

/**
 * Declaracion GRADIENTES. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const GRADIENTES = {
  principal: ['#7C3AED', '#8B5CF6', '#38BDF8'] as const,
  premium: ['#6D28D9', '#A78BFA', '#2563EB'] as const,
  suave: ['#11102A', '#02030A'] as const,
  aurora: ['#070712', '#11102A', '#02030A'] as const,
  glass: ['rgba(255, 255, 255, 0.13)', 'rgba(255, 255, 255, 0.035)'] as const,
  enfasis: ['#A78BFA', '#6D28D9'] as const,
  exito: ['#4ADE80', '#22C55E'] as const,
  peligro: ['#F87171', '#EF4444'] as const,
};

/**
 * Declaracion TIPOGRAFIA. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const TIPOGRAFIA = {
  hero: { fontSize: 40, fontWeight: '900' as const, lineHeight: 48, letterSpacing: 0 },
  tituloPantalla: { fontSize: 32, fontWeight: '800' as const, lineHeight: 40, letterSpacing: 0 },
  tituloSeccion: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32, letterSpacing: 0 },
  tituloTarjeta: { fontSize: 18, fontWeight: '700' as const, lineHeight: 24 },
  cuerpoGrande: { fontSize: 16, fontWeight: '500' as const, lineHeight: 24 },
  cuerpo: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  cuerpoPequeno: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  leyenda: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  micro: { fontSize: 11, fontWeight: '700' as const, lineHeight: 14, textTransform: 'uppercase' as const },
};

/**
 * Declaracion ESPACIADO. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const ESPACIADO = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
};

/**
 * Declaracion RADIOS. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const RADIOS = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 32,
  completo: 999,
};

/**
 * Declaracion SOMBRAS. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const SOMBRAS = {
  suave: {
    shadowColor: COLORES.sombra,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: Platform.OS === 'android' ? 1 : 3,
  },
  tarjeta: {
    shadowColor: COLORES.sombra,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: Platform.OS === 'android' ? 3 : 6,
  },
  flotante: {
    shadowColor: COLORES.sombra,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: Platform.OS === 'android' ? 5 : 10,
  },
  premium: {
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: Platform.OS === 'android' ? 7 : 15,
  }
};

/** Tokens semánticos para superficies privadas. Los valores conservan la paleta actual. */
export const BORDES = {
  subtle: 'rgba(255,255,255,0.08)',
  default: 'rgba(255,255,255,0.12)',
  strong: 'rgba(255,255,255,0.20)',
  focus: 'rgba(124,58,237,0.56)',
} as const;

export const MOVIMIENTO = {
  pressScale: 0.985,
  pressDuration: 160,
  stateDuration: 220,
  surfaceDuration: 220,
  spring: { damping: 26, stiffness: 140, mass: 1 },
} as const;

export const TEMAS_MOVILES = {
  oscuro: {
    fondo: '#070712',
    fondoProfundo: '#02030A',
    superficie: 'rgba(18,18,38,0.78)',
    superficieElevada: 'rgba(20,20,42,0.92)',
    modal: '#1A1B24',
    input: '#20212B',
    inputPlaceholder: 'rgba(232,238,255,0.52)',
    deshabilitado: 'rgba(255,255,255,0.10)',
    exito: '#76C893',
    advertencia: '#E8B86D',
    advertenciaSuperficie: '#382F22',
    error: '#E59898',
    informacion: '#82B9E8',
    skeletonBase: 'rgba(255,255,255,0.08)',
    skeletonHighlight: 'rgba(255,255,255,0.16)',
    navegacion: '#171820',
    navegacionActiva: '#F2F0F2',
    texto: '#F8FAFF',
    textoSecundario: 'rgba(232,238,255,0.72)',
    textoSuave: 'rgba(232,238,255,0.52)',
    vidrioSutil: 'rgba(255,255,255,0.035)',
    vidrio: 'rgba(255,255,255,0.075)',
    vidrioFuerte: 'rgba(255,255,255,0.13)',
    vidrioProfundo: 'rgba(10,10,24,0.72)',
    borde: BORDES.default,
    bordeSutil: BORDES.subtle,
    bordeFuerte: BORDES.strong,
    bordeFocus: BORDES.focus,
    sombra: '#0F0A2A',
    primario: '#7C3AED',
    primarioClaro: '#A78BFA',
    secundario: '#38BDF8',
    pulso: {
      background: '#0C0D11',
      ambient: ['#17111B', '#10131B', '#0C0D11'] as const,
      heroSurface: '#1A1A20',
      heroGradient: ['#24212B', '#18191F'] as const,
      heroText: '#F5F2F5',
      heroTextSecondary: '#C4BFC8',
      heroMetricSurface: '#202126',
      heroMetricBorder: 'rgba(255,255,255,0.07)',
      heroIconSurface: '#2A2B32',
      surface: '#17181D',
      surfaceElevated: '#1D1E24',
      pill: '#24252C',
      inverse: '#F2F0F2',
      text: '#F4F2F4',
      textSecondary: '#B5B1B8',
      textTertiary: '#A29EA7',
      textInverse: '#252329',
      border: 'rgba(255,255,255,0.065)',
      borderStrong: 'rgba(255,255,255,0.10)',
      iconSurface: '#292A31',
      icon: '#F4F2F4',
      statusTrack: '#34353D',
      errorSurface: '#321E22',
      errorText: '#F2B5B2',
      shadow: '#050609',
      navSurface: '#18191F',
      navInactive: '#AAA6AE',
      energyHigh: '#C9D96F',
      energyMedium: '#B39AEF',
      energyLow: '#E9A982',
      chipActive: '#F2F0F2',
      chipTextActive: '#252329',
      chipCountActive: '#FFFFFF',
      accent: '#F2F0F2',
      textMuted: '#A29EA7',
    },
    gradienteFondo: ['#070712', '#0B0B19', '#02030A'] as const,
  },
  claro: {
    fondo: '#FBF8F7',
    fondoProfundo: '#FFFDFC',
    superficie: 'rgba(255,255,255,0.78)',
    superficieElevada: 'rgba(255,255,255,0.92)',
    modal: '#FFFFFF',
    input: '#F5F2EF',
    inputPlaceholder: 'rgba(15,23,42,0.50)',
    deshabilitado: 'rgba(36,29,40,0.08)',
    exito: '#2D7A4B',
    advertencia: '#A96913',
    advertenciaSuperficie: '#FFE4BA',
    error: '#B4534D',
    informacion: '#2563EB',
    skeletonBase: 'rgba(36,29,40,0.10)',
    skeletonHighlight: 'rgba(36,29,40,0.16)',
    navegacion: '#FFFFFF',
    navegacionActiva: '#202020',
    texto: '#111827',
    textoSecundario: 'rgba(15,23,42,0.68)',
    textoSuave: 'rgba(15,23,42,0.50)',
    vidrioSutil: 'rgba(255,255,255,0.42)',
    vidrio: 'rgba(255,255,255,0.62)',
    vidrioFuerte: 'rgba(255,255,255,0.82)',
    vidrioProfundo: 'rgba(255,255,255,0.92)',
    borde: 'rgba(36,29,40,0.10)',
    bordeSutil: 'rgba(36,29,40,0.06)',
    bordeFuerte: 'rgba(36,29,40,0.16)',
    bordeFocus: 'rgba(109,40,217,0.48)',
    sombra: '#7F6D78',
    primario: '#6D28D9',
    primarioClaro: '#8B5CF6',
    secundario: '#2563EB',
    pulso: {
      background: '#FFFDFC',
      ambient: ['#FBEDE8', '#F6ECF6', '#FFFDFC'] as const,
      heroSurface: '#222222',
      heroGradient: ['#222126', '#17161A'] as const,
      heroText: '#FFFFFF',
      heroTextSecondary: 'rgba(255,255,255,0.70)',
      heroMetricSurface: 'rgba(255,255,255,0.05)',
      heroMetricBorder: 'rgba(255,255,255,0.04)',
      heroIconSurface: 'rgba(255,255,255,0.08)',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      pill: '#F5F2EF',
      inverse: '#202020',
      text: '#1F1D1C',
      textSecondary: '#5F5A56',
      textTertiary: '#8B8681',
      textInverse: '#FFFFFF',
      border: 'rgba(43,36,31,0.035)',
      borderStrong: 'rgba(43,36,31,0.10)',
      iconSurface: '#F5F2EF',
      icon: '#202020',
      statusTrack: '#E5E1DE',
      errorSurface: '#FFF0EE',
      errorText: '#9A453F',
      shadow: '#7F6D78',
      navSurface: '#FFFFFF',
      navInactive: 'rgba(48,45,43,0.68)',
      energyHigh: '#D5E774',
      energyMedium: '#A78BFA',
      energyLow: '#F2AD84',
      chipActive: '#D5E774',
      chipTextActive: '#2E3023',
      chipCountActive: '#FFFFFF',
      accent: '#202020',
      textMuted: '#5F5A56',
    },
    gradienteFondo: ['#FFFDFC', '#FAF3F5', '#F6F0F8'] as const,
  },
} as const;

export type PulseColors = {
  background: string;
  ambient: readonly [string, string, string];
  heroSurface: string;
  heroGradient: readonly [string, string];
  heroText: string;
  heroTextSecondary: string;
  heroMetricSurface: string;
  heroMetricBorder: string;
  heroIconSurface: string;
  surface: string;
  surfaceElevated: string;
  pill: string;
  inverse: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  border: string;
  borderStrong: string;
  iconSurface: string;
  icon: string;
  statusTrack: string;
  errorSurface: string;
  errorText: string;
  shadow: string;
  navSurface: string;
  navInactive: string;
  energyHigh: string;
  energyMedium: string;
  energyLow: string;
  chipActive: string;
  chipTextActive: string;
  chipCountActive: string;
  accent: string;
  textMuted: string;
};
