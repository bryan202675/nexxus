/**
 * Documentacion Nexxus - nexxus/app/src/shared/constants/diseno.ts
 * Capa: compartido.
 * Proposito: Constantes compartidas. Centraliza tokens visuales y valores comunes para evitar estilos duplicados.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
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
    elevation: 3,
  },
  tarjeta: {
    shadowColor: COLORES.sombra,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  flotante: {
    shadowColor: COLORES.sombra,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 10,
  },
  premium: {
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 15,
  }
};
