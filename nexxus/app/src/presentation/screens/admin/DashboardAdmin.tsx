/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/admin/DashboardAdmin.tsx
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useEffect, useMemo, useRef, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useMemo, useRef, useState } from 'react';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { Animated, Easing, View, Text as NativeText, ScrollView, Dimensions, StyleSheet, ActivityIndicator, TouchableOpacity, Platform, useWindowDimensions } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Animated, Easing, View, Text as NativeText, ScrollView, Dimensions, StyleSheet, ActivityIndicator, TouchableOpacity, Platform, useWindowDimensions, Image } from 'react-native';
// Importa Svg, { Circle, Defs, Line, LinearGradient as SvgLinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import Svg, { Circle, Defs, Line, LinearGradient as SvgLinearGradient, Path, Rect, Stop, Text as SvgText, G } from 'react-native-svg';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa { addDoc, collection, doc, onSnapshot, query, updateDoc, where } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { addDoc, collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Activity,
  ClipboardList,
  HeartPulse,
  CalendarClock,
  Bell,
  ShieldCheck,
  UserCheck,
  UserX,
  Timer,
  Building2,
  Zap,
  CheckCircle2,
  CircleDot,
  Flame,
  PauseCircle,
  Clock3,
  FileText,
  Inbox,
  MessageSquareWarning,
  Check,
  X,
} from 'lucide-react-native';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from '@/infrastructure/firebase/firebaseConfig';
// Importa { useAuth }; reutiliza hooks propios que encapsulan estado, auth o consultas.
import { useAuth } from '@/presentation/hooks/useAuth';
// Importa { obtenerEmpresaIdAdmin }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { obtenerEmpresaIdAdmin } from './adminUtils';
// Importa { ADMIN, sombraAdmin, sombraVioleta, useAdminAppearance }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { ADMIN, sombraAdmin, sombraVioleta, useAdminAppearance } from './adminTheme';
// Importa { useAdminToast }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { useAdminToast } from './adminToast';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { AdminModal } from './AdminModal';
import { AdminModalFormGlass } from './AdminModalFormGlass';

const Text = AdminTranslatedText;


/**
 * Componente BRAND. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const BRAND = {
  richBlack: ADMIN.fondo,
  darkBlue: ADMIN.fondoElevado,
  bangladeshBlue: ADMIN.primario,
  caribbeanBlue: ADMIN.primarioClaro,
  iconBright: ADMIN.violeta,
  textMain: ADMIN.texto,
  textSec: ADMIN.textoSecundario,
  success: ADMIN.exito,
  warning: ADMIN.alerta,
  error: ADMIN.error,
  violet: ADMIN.violeta,
  cyan: ADMIN.azul
};

/**
 * Componente CHART_FONT. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const CHART_FONT = Platform.OS === 'ios' ? 'Avenir Next' : Platform.OS === 'web' ? 'Avenir Next, Satoshi, Segoe UI, sans-serif' : 'sans-serif';

/**
 * Describe la forma tipada UsuarioAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type UsuarioAdmin = {
  id?: string;
  nombre?: string;
  correo?: string;
  rol?: string;
  departamento?: string;
  activo?: boolean;
  estado_activo?: boolean;
  estado_trabajo?: string;
  ultimoCheckIn?: string;
  empresaId?: string;
  foto_perfil?: string | null;
  fotoPerfil?: string | null;
  photoURL?: string | null;
  avatarUrl?: string | null;
};

/**
 * Describe la forma tipada TareaAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type TareaAdmin = {
  id?: string;
  titulo?: string;
  estado?: string;
  prioridad?: string;
  fecha_creacion?: string;
  createdAt?: string;
  fecha_limite?: string;
  tiempoEstimado?: number;
  empresaId?: string;
};

/**
 * Describe la forma tipada PagoAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type PagoAdmin = {
  salario_bruto?: number;
  salario_neto?: number;
  estado?: string;
  empresaId?: string;
};

/**
 * Describe la forma tipada CheckInAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type CheckInAdmin = {
  id?: string;
  userId?: string;
  usuarioNombre?: string;
  departamento?: string;
  fecha?: string;
  timestamp?: any;
  estres?: number;
  balanceEmocional?: number;
  cargaLaboral?: number;
  energia?: string;
  empresaId?: string;
  empresa_id?: string;
};

/**
 * Describe la forma tipada AuditoriaAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type AuditoriaAdmin = {
  id?: string;
  estado?: string;
  accion?: string;
  modulo?: string;
  usuarioNombre?: string;
  timestamp?: string;
  empresaId?: string;
};

/**
 * Describe la forma tipada AusenciaAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type AusenciaAdmin = {
  id?: string;
  usuario_id?: string;
  usuario_nombre?: string;
  estado?: string;
  tipo?: string;
  asunto?: string;
  fecha_solicitud?: string;
  empresaId?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  motivo?: string;
  descripcion_detallada?: string;
  prioridad?: string;
  contacto_emergencia?: string;
  archivo_adjunto?: string;
};

/**
 * Describe la forma tipada NotificacionAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type NotificacionAdmin = {
  id?: string;
  titulo?: string;
  mensaje?: string;
  tipo?: string;
  leida?: boolean;
  fecha?: string;
  empresaId?: string;
};

/**
 * Describe la forma tipada AsistenciaAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type AsistenciaAdmin = {
  id?: string;
  userId?: string;
  tipo?: 'entrada' | 'salida' | 'inicio_pausa' | 'fin_pausa';
  timestamp?: string;
  estado_aprobacion?: string;
  horas_extra_calculadas?: number;
  empresaId?: string;
};

/**
 * Describe la forma tipada SolicitudInternaAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type SolicitudInternaAdmin = {
  id?: string;
  userId?: string;
  titulo?: string;
  descripcion?: string;
  tipo?: string;
  estado?: string;
  prioridad?: string;
  timestamp?: string;
  empresaId?: string;
  monto?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  archivo_adjunto?: string;
};

/**
 * Describe la forma tipada FeedbackAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type FeedbackAdmin = {
  id?: string;
  userId?: string;
  tipo?: string;
  mensaje?: string;
  nivelSatisfaccion?: number;
  estado?: string;
  fecha?: string;
  empresaId?: string;
};

/**
 * Describe la forma tipada InboxAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type InboxAdmin = {
  id?: string;
  userId?: string;
  tipo?: string;
  prioridad?: string;
  estado?: string;
  titulo?: string;
  mensaje?: string;
  timestamp?: string;
  empresaId?: string;
};

/**
 * Describe la forma tipada DocumentoAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type DocumentoAdmin = {
  id?: string;
  userId?: string;
  titulo?: string;
  tipo?: string;
  leido?: boolean;
  fechaSubida?: string;
  empresaId?: string;
};

/**
 * Componente PremiumCard. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const PremiumCard = ({ children, style }: { children: React.ReactNode; style?: object }) => {
  // Inicializa entrada; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const entrada = useRef(new Animated.Value(0)).current;

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(entrada, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View style={[estilos.premiumCard, style, { opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
};

/**
 * Componente IconWrapper. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const IconWrapper = ({
  children,
  tono = 'blue',
}: {
  children: React.ReactNode;
  tono?: 'blue' | 'success' | 'warning' | 'error' | 'violet' | 'cyan';
}) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={[estilos.iconWrapperBase, estilos[`iconWrapper_${tono}`]]}>
    {children}
  </View>
);

/**
 * Declaracion obtenerFecha. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const obtenerFecha = (valor: any): Date | null => {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!valor) return null;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (typeof valor?.toDate === 'function') return valor.toDate();
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (typeof valor?.seconds === 'number') return new Date(valor.seconds * 1000);
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (typeof valor === 'number') return new Date(valor);
  // Calcula fecha; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const fecha = new Date(valor);
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

/**
 * Declaracion obtenerFechaTarea. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const obtenerFechaTarea = (tarea: TareaAdmin): Date | null => obtenerFecha(
  tarea.fecha_creacion ||
  tarea.createdAt ||
  (tarea as any).fechaCreacion ||
  (tarea as any).created_at ||
  (tarea as any).timestamp ||
  tarea.fecha_limite
);

/**
 * Declaracion obtenerFechaCheckIn. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const obtenerFechaCheckIn = (checkIn: CheckInAdmin): Date | null => obtenerFecha(
  checkIn.fecha ||
  checkIn.timestamp ||
  (checkIn as any).createdAt ||
  (checkIn as any).created_at
);

/**
 * Declaracion valorEscalaCinco. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const valorEscalaCinco = (valor: any) => {
  // Declara numero; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const numero = Number(valor);
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return Number.isFinite(numero) ? Math.max(0, Math.min(5, numero)) : 0;
};

/**
 * Declaracion formatearMoneda. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const formatearMoneda = (valor: number) => `$${valor.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

/**
 * Declaracion porcentaje. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const porcentaje = (valor: number, total: number) => total > 0 ? Math.round((valor / total) * 100) : 0;

/**
 * Declaracion mismoDia. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const mismoDia = (fecha: Date | null) => {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!fecha) return false;
  // Calcula hoy; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const hoy = new Date();
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth() && fecha.getDate() === hoy.getDate();
};

/**
 * Declaracion estaVencida. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const estaVencida = (valor?: string) => {
  // Declara fecha; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const fecha = obtenerFecha(valor);
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!fecha) return false;
  // Calcula hoy; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const hoy = new Date();
  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  hoy.setHours(0, 0, 0, 0);
  // Devuelve el JSX que React Native renderiza en pantalla.
  return fecha < hoy;
};

/**
 * Describe la forma tipada PuntoGrafico; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type PuntoGrafico = {
  label: string;
  rendimiento: number;
  carga: number;
  estres: number;
};

/**
 * Describe la forma tipada ModoGrafico; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type ModoGrafico = 'diario' | 'semanal' | 'mensual';

/**
 * Componente FondoHeaderTech. Renderiza una telemetría digital fluida con ondas curvas, regleta de escalas y matriz de puntos.
 */
function FondoHeaderTech() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 1000 320" preserveAspectRatio="none">
        <Defs>
          {/* Degradado para la onda de área degradada */}
          <SvgLinearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#7C3AED" stopOpacity={0.08} />
            <Stop offset="100%" stopColor="#7C3AED" stopOpacity={0.00} />
          </SvgLinearGradient>
        </Defs>

        {/* Matriz de Puntos de Fondo (Dot Grid) */}
        <Path
          d="M 20,40 L 980,40 M 20,120 L 980,120 M 20,200 L 980,200 M 20,280 L 980,280"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="0 80"
        />



        {/* Onda C: Relleno suave degradado */}
        <Path
          d="M -20,280 Q 250,120 450,200 T 850,140 Q 920,110 1020,120 L 1020,320 L -20,320 Z"
          fill="url(#waveGrad)"
        />

        {/* Onda A: Línea Principal Púrpura (Fluido) */}
        <Path
          d="M -20,240 C 200,100 380,300 550,160 C 720,20 860,260 1020,180"
          stroke="rgba(168, 85, 247, 0.22)"
          strokeWidth={3}
          fill="none"
        />

        {/* Onda B: Línea Secundaria Azul Segmentada */}
        <Path
          d="M -20,180 C 180,280 400,80 580,220 C 760,360 880,120 1020,150"
          stroke="rgba(37, 99, 235, 0.16)"
          strokeWidth={2}
          strokeDasharray="6 4"
          fill="none"
        />

        {/* Intersecciones y Nodos de Control */}
        {/* Nodo en Onda A (Pico central) */}
        <Circle cx={550} cy={160} r={4} fill="#A855F7" opacity={0.8} />
        <Circle cx={550} cy={160} r={10} stroke="#A855F7" strokeWidth={1} fill="none" opacity={0.25} />

        {/* Nodo en Onda B */}
        <Circle cx={580} cy={220} r={3} fill="#2563EB" opacity={0.8} />
        <Circle cx={580} cy={220} r={8} stroke="#2563EB" strokeWidth={1} fill="none" opacity={0.2} />

        {/* Marcador Cruz de Objetivo */}
        <Path d="M 850,136 L 850,144 M 846,140 L 854,140" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
        <Circle cx={850} cy={140} r={8} stroke="rgba(255,255,255,0.1)" strokeWidth={1} fill="none" />


      </Svg>
    </View>
  );
}

/**
 * HeroMiniChart – animated SVG sparkline for the header health score panel.
 * Clean gradient sparkline with glowing dots, no bars. Draws left-to-right on mount and data change.
 */
const HeroMiniChart = ({ datos }: { datos: PuntoGrafico[] }) => {
  const animProg = useRef(new Animated.Value(0)).current;
  const [prog, setProg] = useState(0);
  const glowPulse = useRef(new Animated.Value(0)).current;

  const clave = datos.map((p) => p.rendimiento).join(',');

  useEffect(() => {
    animProg.setValue(0);
    const listener = animProg.addListener(({ value }) => setProg(value));
    Animated.timing(animProg, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    // Endpoint glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(glowPulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    ).start();
    return () => animProg.removeListener(listener);
  }, [clave]);

  const pts = datos.length > 0 ? datos.slice(-7) : [{ label: '', rendimiento: 0, carga: 0, estres: 0 }];
  const W = 156; const H = 88;
  const padL = 4; const padR = 6; const padT = 8; const padB = 8;
  const iW = W - padL - padR;
  const iH = H - padT - padB;
  const n = pts.length;

  const px = (i: number) => padL + (n === 1 ? iW / 2 : (i / (n - 1)) * iW);
  const py = (v: number) => padT + iH - (Math.max(0, Math.min(100, v)) / 100) * iH;

  // Smooth catmull-rom bezier
  const buildPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return points.length === 1 ? `M${points[0].x} ${points[0].y}` : '';
    const cmds = [`M${points[0].x} ${points[0].y}`];
    const t2 = 0.2;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]; const b = points[i + 1];
      const prev = points[i - 1] || a; const next = points[i + 2] || b;
      cmds.push(`C${a.x + (b.x - prev.x) * t2} ${a.y + (b.y - prev.y) * t2},${b.x - (next.x - a.x) * t2} ${b.y - (next.y - a.y) * t2},${b.x} ${b.y}`);
    }
    return cmds.join(' ');
  };

  // Animate: only show points up to current progress
  const visCount = Math.max(1, Math.ceil((n - 1) * prog) + 1);
  const allPts = pts.map((p, i) => ({ x: px(i), y: py(p.rendimiento) }));
  const visPts = allPts.slice(0, visCount);

  const linePath = buildPath(visPts);
  const baseY = padT + iH;
  const areaPath = visPts.length > 0
    ? `M${visPts[0].x} ${baseY} L${visPts[0].x} ${visPts[0].y} ${buildPath(visPts).replace(/^M[^ ]+ [^ ]+/, '')} L${visPts[visPts.length - 1].x} ${baseY} Z`
    : '';
  const lastPt = visPts[visPts.length - 1];

  return (
    <View style={estilos.heroChart} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          {/* Area gradient — deep violet to transparent */}
          <SvgLinearGradient id="hAreaGr" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#A855F7" stopOpacity="0.48" />
            <Stop offset="75%" stopColor="#6D28D9" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#6D28D9" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        {/* Subtle horizontal grid lines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <Line
            key={`hg-${f}`}
            x1={padL}
            y1={padT + iH * (1 - f)}
            x2={W - padR}
            y2={padT + iH * (1 - f)}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
            strokeDasharray="3 6"
          />
        ))}

        {/* Gradient fill area */}
        {areaPath ? <Path d={areaPath} fill="url(#hAreaGr)" /> : null}

        {/* Main sparkline */}
        {linePath ? (
          <Path
            d={linePath}
            fill="none"
            stroke="#C084FC"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Dots at each visible data point (except last which gets the glow dot) */}
        {visPts.map((pt, i) => (
          i < visPts.length - 1 ? (
            <Circle
              key={`hdot-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={2.2}
              fill="#C084FC"
              opacity={0.55 + (i / n) * 0.4}
            />
          ) : null
        ))}

        {/* Glowing endpoint dot */}
        {lastPt && (
          <G>
            {/* Outer glow ring */}
            <Circle cx={lastPt.x} cy={lastPt.y} r={8} fill="#A855F7" opacity={0.16} />
            <Circle cx={lastPt.x} cy={lastPt.y} r={5} fill="#A855F7" opacity={0.10} />
            {/* Core dot */}
            <Circle cx={lastPt.x} cy={lastPt.y} r={3} fill="#0D0B1E" stroke="#C084FC" strokeWidth={2} />
          </G>
        )}
      </Svg>
    </View>
  );
};

/**
 * Componente DashboardAdmin. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function DashboardAdmin() {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  // Inicializa toast; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const toast = useAdminToast();
  // Calcula { width }; adapta el comportamiento o diseno segun plataforma/tamano disponible.
  const { width } = useWindowDimensions();
  // Declara isTabletOrWeb; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const isTabletOrWeb = width > 900;
  // Define isMobileOrTablet para el comportamiento responsivo del drawer y espaciado
  const isMobileOrTablet = width < 1024;
  const isPhone = width < 640;
  // Declara isWidescreen; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const isWidescreen = width > 1500;
  // Inicializa { user }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { user } = useAuth();
  // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const empresaId = obtenerEmpresaIdAdmin(user);
  // Declara nombreEmpresa; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const nombreEmpresa = (user?.empresa || (user as any)?.empresaNombre || (user as any)?.nombreEmpresa || 'Nexxus Enterprise').trim();

  // Inicializa [usuarios, setUsuarios]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  // Inicializa [tareas, setTareas]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [tareas, setTareas] = useState<TareaAdmin[]>([]);
  // Inicializa [pagos, setPagos]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [pagos, setPagos] = useState<PagoAdmin[]>([]);
  // Inicializa [checkIns, setCheckIns]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [checkIns, setCheckIns] = useState<CheckInAdmin[]>([]);
  // Inicializa [logs, setLogs]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [logs, setLogs] = useState<AuditoriaAdmin[]>([]);
  // Inicializa [ausencias, setAusencias]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [ausencias, setAusencias] = useState<AusenciaAdmin[]>([]);
  // Inicializa [notificaciones, setNotificaciones]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [notificaciones, setNotificaciones] = useState<NotificacionAdmin[]>([]);
  // Inicializa [asistencias, setAsistencias]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [asistencias, setAsistencias] = useState<AsistenciaAdmin[]>([]);
  // Inicializa [solicitudesInternas, setSolicitudesInternas]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [solicitudesInternas, setSolicitudesInternas] = useState<SolicitudInternaAdmin[]>([]);
  // Inicializa [feedbacks, setFeedbacks]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [feedbacks, setFeedbacks] = useState<FeedbackAdmin[]>([]);
  // Inicializa [inboxItems, setInboxItems]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [inboxItems, setInboxItems] = useState<InboxAdmin[]>([]);
  // Inicializa [documentos, setDocumentos]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [documentos, setDocumentos] = useState<DocumentoAdmin[]>([]);
  // Inicializa [eventosCalendario, setEventosCalendario]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [eventosCalendario, setEventosCalendario] = useState<any[]>([]);
  // Inicializa [modoGrafico, setModoGrafico]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [modoGrafico, setModoGrafico] = useState<ModoGrafico>('semanal');
  // Inicializa [mostrarDetalleOperativo, setMostrarDetalleOperativo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [mostrarDetalleOperativo, setMostrarDetalleOperativo] = useState(false);
  // Inicializa [cargando, setCargando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cargando, setCargando] = useState(true);
  // Inicializa [solicitudSeleccionada, setSolicitudSeleccionada]; para ver detalles y motivos de aprobaciones
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any | null>(null);
  // Inicializa entrada; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const entrada = useRef(new Animated.Value(0)).current;

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(entrada, {
      toValue: 1,
      duration: 720,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setUsuarios([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setTareas([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setPagos([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCheckIns([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setLogs([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setAusencias([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setNotificaciones([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setAsistencias([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setSolicitudesInternas([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setFeedbacks([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setInboxItems([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setDocumentos([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setEventosCalendario([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    const TOTAL_CONSULTAS_DASHBOARD = 12;
    const cargadas = new Set<string>();
    const marcarCargada = (clave: string) => {
      cargadas.add(clave);
      if (cargadas.size >= TOTAL_CONSULTAS_DASHBOARD) setCargando(false);
    };

    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setCargando(true);
    const fallbackCarga = setTimeout(() => {
      setCargando(false);
    }, 4500);

    // Calcula crearListener; transforma la lista original en datos listos para renderizar o guardar.
    const crearListener = <T,>(clave: string, coleccion: string, actualizar: (datos: T[]) => void) => {
      try {
        return onSnapshot(
          query(collection(db, coleccion), where('empresaId', '==', empresaId)),
          (snapshot) => {
            actualizar(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T));
            marcarCargada(clave);
          },
          (error) => {
            if (__DEV__) console.warn(`[DashboardAdmin] ${coleccion} no disponible`, error);
            actualizar([]);
            marcarCargada(clave);
          }
        );
      } catch (error) {
        if (__DEV__) console.warn(`[DashboardAdmin] No se pudo escuchar ${coleccion}`, error);
        actualizar([]);
        marcarCargada(clave);
        return () => {};
      }
    };

    // Declara consultas; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const consultas = [
      crearListener<UsuarioAdmin>('usuarios', 'usuarios', setUsuarios),
      crearListener<TareaAdmin>('tareas', 'tareas', setTareas),
      crearListener<PagoAdmin>('pagos', 'payments', setPagos),
      crearListener<AuditoriaAdmin>('logs', 'audit_logs', setLogs),
      crearListener<AusenciaAdmin>('ausencias', 'solicitudes_ausencia', setAusencias),
      crearListener<NotificacionAdmin>('notificaciones', 'notificaciones', setNotificaciones),
      crearListener<AsistenciaAdmin>('asistencias', 'asistencias', setAsistencias),
      crearListener<SolicitudInternaAdmin>('solicitudesInternas', 'solicitudes_internas', setSolicitudesInternas),
      crearListener<FeedbackAdmin>('feedbacks', 'feedbacks', setFeedbacks),
      crearListener<InboxAdmin>('inboxItems', 'inbox_unificado', setInboxItems),
      crearListener<DocumentoAdmin>('documentos', 'documentos', setDocumentos),
      crearListener<any>('eventos', 'calendario_empresarial', setEventosCalendario),
    ];

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      clearTimeout(fallbackCarga);
      consultas.forEach((unsubscribe) => unsubscribe());
    };
  }, [empresaId]);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCheckIns([]);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    // Calcula idsUsuarios; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const idsUsuarios = usuarios
      .map((usuario) => usuario.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    // Declara gruposIds; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const gruposIds = Array.from({ length: Math.ceil(idsUsuarios.length / 10) }, (_, indice) => idsUsuarios.slice(indice * 10, indice * 10 + 10));
    // Declara mapasPorFuente; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const mapasPorFuente = new Map<string, Map<string, CheckInAdmin>>();

    // Declara publicar; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const publicar = () => {
      // Declara combinados; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const combinados = new Map<string, CheckInAdmin>();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      mapasPorFuente.forEach((mapa) => {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        mapa.forEach((checkIn, id) => combinados.set(id, checkIn));
      });
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCheckIns(Array.from(combinados.values()));
    };

    // Declara consultas; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const consultas: Array<() => void> = [];

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    consultas.push(onSnapshot(
      query(collection(db, 'checkins'), where('empresaId', '==', empresaId)),
      (snapshot) => {
        // Declara mapa; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const mapa = new Map<string, CheckInAdmin>();
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        snapshot.docs.forEach((documento) => {
          // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
          mapa.set(documento.id, { id: documento.id, ...documento.data() } as CheckInAdmin);
        });
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        mapasPorFuente.set('empresa', mapa);
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        publicar();
      },
      () => publicar()
    ));

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    consultas.push(onSnapshot(
      query(collection(db, 'checkins'), where('empresa_id', '==', empresaId)),
      (snapshot) => {
        // Declara mapa; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const mapa = new Map<string, CheckInAdmin>();
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        snapshot.docs.forEach((documento) => {
          // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
          mapa.set(documento.id, { id: documento.id, ...documento.data() } as CheckInAdmin);
        });
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        mapasPorFuente.set('empresa_legacy', mapa);
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        publicar();
      },
      () => publicar()
    ));

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    gruposIds.forEach((grupo, indice) => {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (grupo.length === 0) return;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      consultas.push(onSnapshot(
        query(collection(db, 'checkins'), where('userId', 'in', grupo)),
        (snapshot) => {
          // Declara mapa; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const mapa = new Map<string, CheckInAdmin>();
          // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
          snapshot.docs.forEach((documento) => {
            // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
            mapa.set(documento.id, { id: documento.id, ...documento.data() } as CheckInAdmin);
          });
          // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
          mapasPorFuente.set(`usuarios-${indice}`, mapa);
          // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
          publicar();
        },
        () => publicar()
      ));
    });

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => consultas.forEach((unsubscribe) => unsubscribe());
  }, [empresaId, usuarios]);

  // Prepara registrarAuditoria; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const registrarAuditoria = async (accion: string, modulo: string, detalles: string, estado: 'Success' | 'Warning' | 'Error' = 'Success') => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId) return;
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await addDoc(collection(db, 'audit_logs'), {
      empresaId,
      usuarioNombre: user?.nombre || user?.correo || 'Administrador',
      usuarioId: user?.id || '',
      rol: user?.rol || 'admin',
      accion,
      modulo,
      detalles,
      estado,
      ipAddress: 'Cliente Web',
      timestamp: new Date().toISOString(),
    });
  };

  // Prepara actualizarSolicitudAusencia; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const actualizarSolicitudAusencia = async (solicitud: AusenciaAdmin, estado: 'aprobada' | 'rechazada') => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!solicitud.id) return;
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await updateDoc(doc(db, 'solicitudes_ausencia', solicitud.id), {
        estado,
        resuelto_por: user?.id || '',
        resuelto_por_nombre: user?.nombre || 'Administrador',
        fecha_resolucion: new Date().toISOString(),
      });
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await registrarAuditoria(
        estado === 'aprobada' ? 'Aprobación de Ausencia' : 'Rechazo de Ausencia',
        'Centro de Aprobaciones',
        `${solicitud.usuario_nombre || 'Empleado'} · ${solicitud.asunto || solicitud.tipo || 'Solicitud'}`,
        estado === 'aprobada' ? 'Success' : 'Warning'
      );
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (solicitud.usuario_id) {
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await addDoc(collection(db, 'notificaciones'), {
          empresaId,
          usuario_id: solicitud.usuario_id,
          titulo: estado === 'aprobada' ? 'Ausencia aprobada' : 'Ausencia rechazada',
          mensaje: `${solicitud.asunto || solicitud.tipo || 'Tu solicitud'} fue ${estado}.`,
          tipo: 'aprobacion',
          leida: false,
          fecha: new Date().toISOString(),
        });
      }
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.success({ title: 'Solicitud actualizada', description: `La ausencia fue ${estado} correctamente.` });
    } catch (error: any) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.error({ title: 'No se pudo actualizar', description: error?.message || 'Intenta nuevamente.' });
    }
  };

  // Prepara actualizarSolicitudInterna; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const actualizarSolicitudInterna = async (solicitud: SolicitudInternaAdmin, estado: 'aprobado' | 'rechazado' | 'resuelto') => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!solicitud.id) return;
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await updateDoc(doc(db, 'solicitudes_internas', solicitud.id), {
        estado,
        fecha_resolucion: new Date().toISOString(),
        resuelto_por: user?.id || '',
        resuelto_por_nombre: user?.nombre || 'Administrador',
      });
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await registrarAuditoria(
        estado === 'aprobado' ? 'Aprobación de Solicitud Interna' : estado === 'resuelto' ? 'Resolución de Solicitud Interna' : 'Rechazo de Solicitud Interna',
        'Centro de Aprobaciones',
        solicitud.titulo || solicitud.tipo || 'Solicitud interna',
        estado === 'rechazado' ? 'Warning' : 'Success'
      );
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (solicitud.userId) {
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await addDoc(collection(db, 'inbox_unificado'), {
          empresaId,
          userId: solicitud.userId,
          origenRefId: solicitud.id,
          tipo: 'aprobacion',
          prioridad: estado === 'rechazado' ? 'urgente' : 'normal',
          estado: 'pendiente',
          titulo: estado === 'aprobado' ? 'Solicitud aprobada' : estado === 'resuelto' ? 'Solicitud resuelta' : 'Solicitud rechazada',
          mensaje: solicitud.titulo || solicitud.descripcion || 'Tu solicitud fue actualizada por administración.',
          timestamp: new Date().toISOString(),
        });
      }
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.success({ title: 'Solicitud actualizada', description: `La solicitud quedó en estado ${estado}.` });
    } catch (error: any) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.error({ title: 'No se pudo actualizar', description: error?.message || 'Intenta nuevamente.' });
    }
  };

  // Inicializa metricas; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const metricas = useMemo(() => {
    // Calcula activos; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const activos = usuarios.filter((usuario) => usuario.activo !== false && usuario.estado_activo !== false).length;
    // Declara inactivos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const inactivos = usuarios.length - activos;
    // Calcula empleadosEnPausa; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const empleadosEnPausa = usuarios.filter((usuario) => usuario.estado_trabajo === 'en_pausa').length;
    // Calcula empleadosOcupados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const empleadosOcupados = usuarios.filter((usuario) => usuario.estado_trabajo === 'ocupado' || usuario.estado_trabajo === 'en_reunion').length;
    // Calcula empleadosConectados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const empleadosConectados = usuarios.filter((usuario) => usuario.estado_activo === true || usuario.estado_trabajo === 'disponible' || usuario.estado_trabajo === 'ocupado' || usuario.estado_trabajo === 'en_reunion' || usuario.estado_trabajo === 'en_pausa').length;
    // Calcula empleadosAusentes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const empleadosAusentes = usuarios.filter((usuario) => usuario.activo !== false && (usuario.estado_trabajo === 'fuera_oficina' || usuario.estado_activo === false)).length;
    // Calcula tareasPendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const tareasPendientes = tareas.filter((tarea) => tarea.estado === 'pendiente' || !tarea.estado).length;
    // Calcula tareasProgreso; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const tareasProgreso = tareas.filter((tarea) => tarea.estado === 'en_progreso').length;
    // Calcula tareasCompletadas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const tareasCompletadas = tareas.filter((tarea) => tarea.estado === 'completada').length;
    // Calcula tareasAltaPrioridad; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const tareasAltaPrioridad = tareas.filter((tarea) => tarea.prioridad === 'Alta').length;
    // Calcula tareasVencidas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const tareasVencidas = tareas.filter((tarea) => tarea.estado !== 'completada' && estaVencida(tarea.fecha_limite)).length;
    // Declara productividad; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const productividad = porcentaje(tareasCompletadas, tareas.length);
    // Calcula tiempoPromedioTareas; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
    const tiempoPromedioTareas = tareas.length > 0 ? Math.round(tareas.reduce((total, tarea) => total + (Number(tarea.tiempoEstimado) || 0), 0) / tareas.length) : 0;
    // Calcula costoMensual; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
    const costoMensual = pagos.reduce((total, pago) => total + (pago.salario_bruto || pago.salario_neto || 0), 0);
    // Calcula payrollProcesando; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const payrollProcesando = pagos.filter((pago) => pago.estado !== 'Pagado').length;
    // Calcula checkInsHoy; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const checkInsHoy = checkIns.filter((checkIn) => mismoDia(obtenerFechaCheckIn(checkIn))).length;
    // Declara participacion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const participacion = porcentaje(checkInsHoy, activos);
    // Calcula asistenciasHoy; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const asistenciasHoy = asistencias.filter((asistencia) => mismoDia(obtenerFecha(asistencia.timestamp)));
    // Calcula entradasHoy; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const entradasHoy = asistenciasHoy.filter((asistencia) => asistencia.tipo === 'entrada');
    // Calcula salidasHoy; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const salidasHoy = asistenciasHoy.filter((asistencia) => asistencia.tipo === 'salida');
    // Calcula pausasActivas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const pausasActivas = Math.max(0, asistenciasHoy.filter((asistencia) => asistencia.tipo === 'inicio_pausa').length - asistenciasHoy.filter((asistencia) => asistencia.tipo === 'fin_pausa').length);
    // Calcula retrasos; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const retrasos = entradasHoy.filter((asistencia) => {
      // Declara fecha; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const fecha = obtenerFecha(asistencia.timestamp);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return !!fecha && fecha.getHours() >= 9 && fecha.getMinutes() > 0;
    }).length;
    // Calcula horasExtra; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
    const horasExtra = Math.round(asistenciasHoy.reduce((total, asistencia) => total + (Number(asistencia.horas_extra_calculadas) || 0), 0));
    // Calcula tiempoTrabajadoTotal: tiempo acumulado de jornadas iniciadas hoy
    const ahora = new Date();
    const tiempoTrabajadoPorUsuario: Record<string, number> = {};
    asistenciasHoy.forEach((asistencia) => {
      const uId = asistencia.userId;
      if (!uId) return;
      const t = obtenerFecha(asistencia.timestamp);
      if (!t) return;
      if (asistencia.tipo === 'entrada') {
        tiempoTrabajadoPorUsuario[uId] = t.getTime();
      }
    });
    let totalMs = 0;
    Object.entries(tiempoTrabajadoPorUsuario).forEach(([uId, entradaTime]) => {
      const salida = asistenciasHoy.find((a) => a.userId === uId && a.tipo === 'salida');
      const tFin = salida ? (obtenerFecha(salida.timestamp)?.getTime() || ahora.getTime()) : ahora.getTime();
      if (tFin > entradaTime) {
        totalMs += tFin - entradaTime;
      }
    });
    const totalMinutos = Math.round(totalMs / (1000 * 60));
    const hrs = Math.floor(totalMinutos / 60);
    const mins = totalMinutos % 60;
    const tiempoTrabajadoTotal = `${hrs}h ${mins}m`;
    // Calcula estresPromedio; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
    const estresPromedio = checkIns.length > 0
      ? checkIns.reduce((total, checkIn) => total + (Number(checkIn.estres) || 0), 0) / checkIns.length
      : 0;
    // Calcula cargaPromedio; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
    const cargaPromedio = checkIns.length > 0
      ? checkIns.reduce((total, checkIn) => total + (Number(checkIn.cargaLaboral) || 0), 0) / checkIns.length
      : 0;
    // Declara bienestar; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const bienestar = checkIns.length > 0 ? Math.max(0, Math.min(100, Math.round(((5 - estresPromedio) / 5) * 100))) : 0;
    // Declara neutral; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const neutral = checkIns.length > 0 ? Math.max(0, Math.min(100, Math.round((Number((5 - cargaPromedio).toFixed(1)) / 5) * 100))) : 0;
    // Declara riesgo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const riesgo = Math.max(0, 100 - bienestar);
    // Calcula alertas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const alertas = logs.filter((log) => log.estado === 'Error' || log.estado === 'Warning').length;
    // Calcula ausenciasPendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const ausenciasPendientes = ausencias.filter((ausencia) => ausencia.estado === 'pendiente').length;
    // Calcula solicitudesInternasPendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const solicitudesInternasPendientes = solicitudesInternas.filter((solicitud) => solicitud.estado === 'pendiente' || solicitud.estado === 'revisado').length;
    // Declara aprobacionesPendientes; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const aprobacionesPendientes = ausenciasPendientes + solicitudesInternasPendientes;
    // Calcula incidenciasAbiertas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const incidenciasAbiertas = feedbacks.filter((feedback) => feedback.estado !== 'resuelto' && (feedback.tipo === 'problema' || feedback.tipo === 'dificultad')).length;
    // Calcula inboxCritico; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const inboxCritico = inboxItems.filter((item) => item.estado !== 'resuelto' && item.prioridad === 'urgente').length;
    // Calcula documentosPendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const documentosPendientes = documentos.filter((documento) => !documento.leido).length;
    // Calcula notificacionesNoLeidas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const notificacionesNoLeidas = notificaciones.filter((notificacion) => !notificacion.leida).length;
    // Declara departamentos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const departamentos = usuarios.reduce<Record<string, number>>((acumulado, usuario) => {
      // Declara nombre; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const nombre = usuario.departamento || 'Sin departamento';
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      acumulado[nombre] = (acumulado[nombre] || 0) + 1;
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return acumulado;
    }, {});

    // Calcula crearPeriodos; transforma la lista original en datos listos para renderizar o guardar.
    const crearPeriodos = (modo: ModoGrafico) => {
      // Declara totalPeriodos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const totalPeriodos = 8;
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return Array.from({ length: totalPeriodos }).map((_, indice) => {
        // Calcula inicio; normaliza fechas para comparaciones, filtros o etiquetas visibles.
        const inicio = new Date();
        // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
        if (modo === 'diario') {
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          inicio.setDate(inicio.getDate() - (totalPeriodos - 1 - indice));
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          inicio.setHours(0, 0, 0, 0);
          // Calcula fin; normaliza fechas para comparaciones, filtros o etiquetas visibles.
          const fin = new Date(inicio);
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          fin.setHours(23, 59, 59, 999);
          // Devuelve el valor final calculado para esta funcion o caso de uso.
          return {
            inicio,
            fin,
            label: inicio.toLocaleDateString(i18n.language === 'es' ? 'es-SV' : 'en-US', { weekday: 'short' }).replace('.', '').toUpperCase(),
          };
        }
        // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
        if (modo === 'semanal') {
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          inicio.setDate(inicio.getDate() - ((totalPeriodos - 1 - indice) * 7));
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          inicio.setHours(0, 0, 0, 0);
          // Calcula fin; normaliza fechas para comparaciones, filtros o etiquetas visibles.
          const fin = new Date(inicio);
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          fin.setDate(fin.getDate() + 6);
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          fin.setHours(23, 59, 59, 999);
          // Devuelve el valor final calculado para esta funcion o caso de uso.
          return {
            inicio,
            fin,
            label: `S${indice + 1}`,
          };
        }
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        inicio.setMonth(inicio.getMonth() - (totalPeriodos - 1 - indice), 1);
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        inicio.setHours(0, 0, 0, 0);
        // Calcula fin; normaliza fechas para comparaciones, filtros o etiquetas visibles.
        const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0, 23, 59, 59, 999);
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return {
          inicio,
          fin,
          label: inicio.toLocaleDateString(i18n.language === 'es' ? 'es-SV' : 'en-US', { month: 'short' }).replace('.', '').toUpperCase(),
        };
      });
    };

    // Calcula crearSerie; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const crearSerie = (modo: ModoGrafico): PuntoGrafico[] => {
      // Declara periodos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const periodos = crearPeriodos(modo);
      // Devuelve el JSX que React Native renderiza en pantalla.
      return periodos.map((periodo, indice) => {
        // Declara esUltimoPeriodo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const esUltimoPeriodo = indice === periodos.length - 1;
        // Calcula tareasPeriodo; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
        const tareasPeriodo = tareas.filter((tarea) => {
          // Declara fecha; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const fecha = obtenerFechaTarea(tarea);
          // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
          if (!fecha) return esUltimoPeriodo;
          // Devuelve el JSX que React Native renderiza en pantalla.
          return fecha >= periodo.inicio && fecha <= periodo.fin;
        });
        // Calcula checkInsPeriodo; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
        const checkInsPeriodo = checkIns.filter((checkIn) => {
          // Declara fecha; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const fecha = obtenerFechaCheckIn(checkIn);
          // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
          if (!fecha) return esUltimoPeriodo;
          // Devuelve el JSX que React Native renderiza en pantalla.
          return fecha >= periodo.inicio && fecha <= periodo.fin;
        });
        // Calcula completadasPeriodo; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
        const completadasPeriodo = tareasPeriodo.filter((tarea) => tarea.estado === 'completada').length;
        // Calcula rendimientoPeriodo; muestra 0 si no hay datos reales en el periodo actual.
        const rendimientoPeriodo = tareasPeriodo.length > 0
          ? porcentaje(completadasPeriodo, tareasPeriodo.length)
          : 0;
        // Calcula cargaPeriodo; muestra 0 si no hay check-ins reales en el periodo actual.
        const cargaPeriodo = checkInsPeriodo.length > 0
          ? Math.round((checkInsPeriodo.reduce((total, checkIn) => total + valorEscalaCinco(checkIn.cargaLaboral), 0) / checkInsPeriodo.length / 5) * 100)
          : 0;
        // Calcula estresPeriodo; muestra 0 si no hay check-ins reales en el periodo actual.
        const estresPeriodo = checkInsPeriodo.length > 0
          ? Math.round((checkInsPeriodo.reduce((total, checkIn) => total + valorEscalaCinco(checkIn.estres), 0) / checkInsPeriodo.length / 5) * 100)
          : 0;


        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return {
          label: periodo.label,
          rendimiento: rendimientoPeriodo,
          carga: cargaPeriodo,
          estres: estresPeriodo,
        };
      });
    };

    // Calcula empleadosSinCheckIn; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const empleadosSinCheckIn = usuarios.filter((usuario) => {
      // Declara ultimo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const ultimo = obtenerFecha(usuario.ultimoCheckIn);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return usuario.activo !== false && !mismoDia(ultimo);
    }).slice(0, 5);

    // Calcula checkInsHoyDetalle; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const checkInsHoyDetalle = checkIns
      .filter((checkIn) => mismoDia(obtenerFechaCheckIn(checkIn)))
      .sort((a, b) => (obtenerFechaCheckIn(b)?.getTime() || 0) - (obtenerFechaCheckIn(a)?.getTime() || 0))
      .slice(0, 6)
      .map((checkIn) => {
        // Declara usuario; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const usuario = usuarios.find((item) => item.id === checkIn.userId);
        // Declara estres; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const estres = valorEscalaCinco(checkIn.estres);
        // Declara carga; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const carga = valorEscalaCinco(checkIn.cargaLaboral);
        // Declara balance; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const balance = valorEscalaCinco(checkIn.balanceEmocional);
        // Declara bienestarEmpleado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const bienestarEmpleado = Math.max(0, Math.min(100, Math.round(((balance + (5 - estres) + (5 - carga)) / 15) * 100)));
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return {
          id: checkIn.id || checkIn.userId || `${checkIn.fecha || checkIn.timestamp}-${checkIn.estres || 0}`,
          nombre: checkIn.usuarioNombre || usuario?.nombre || 'Empleado',
          departamento: checkIn.departamento || usuario?.departamento || 'Sin departamento',
          estres,
          carga,
          balance,
          energia: checkIn.energia || 'medio',
          bienestar: bienestarEmpleado,
          fecha: obtenerFechaCheckIn(checkIn),
        };
      });

    // Calcula energiaDistribucion; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
    const energiaDistribucion = checkInsHoyDetalle.reduce(
      (acumulado, checkIn) => {
        // Declara energia; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const energia = String(checkIn.energia).toLowerCase();
        // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
        if (energia === 'alto') acumulado.alto += 1;
        else if (energia === 'bajo') acumulado.bajo += 1;
        else acumulado.medio += 1;
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return acumulado;
      },
      { alto: 0, medio: 0, bajo: 0 }
    );

    // Calcula solicitudesPendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const solicitudesPendientes = [
      ...ausencias
        .filter((solicitud) => solicitud.estado === 'pendiente')
        .map((solicitud) => {
          // Declara usuario; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const usuario = usuarios.find((item) => item.id === solicitud.usuario_id);
          // Devuelve el valor final calculado para esta funcion o caso de uso.
          return {
            id: solicitud.id || '',
            tipo: 'ausencia' as const,
            titulo: solicitud.asunto || solicitud.tipo || 'Ausencia',
            empleado: solicitud.usuario_nombre || usuario?.nombre || 'Empleado',
            prioridad: solicitud.prioridad || solicitud.tipo || 'permiso',
            fecha: solicitud.fecha_solicitud || '',
            fotoPerfil: usuario?.foto_perfil || usuario?.fotoPerfil || usuario?.photoURL || usuario?.avatarUrl || null,
            solicitud,
          };
        }),
      ...solicitudesInternas
        .filter((solicitud) => solicitud.estado === 'pendiente' || solicitud.estado === 'revisado')
        .map((solicitud) => {
          // Declara usuario; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const usuario = usuarios.find((item) => item.id === solicitud.userId);
          // Devuelve el valor final calculado para esta funcion o caso de uso.
          return {
            id: solicitud.id || '',
            tipo: 'interna' as const,
            titulo: solicitud.titulo || solicitud.tipo || 'Solicitud interna',
            empleado: usuario?.nombre || 'Empleado',
            prioridad: solicitud.prioridad || 'media',
            fecha: solicitud.timestamp || '',
            fotoPerfil: usuario?.foto_perfil || usuario?.fotoPerfil || usuario?.photoURL || usuario?.avatarUrl || null,
            solicitud,
          };
        }),
    ].sort((a, b) => (obtenerFecha(b.fecha)?.getTime() || 0) - (obtenerFecha(a.fecha)?.getTime() || 0)).slice(0, 5);

    // Calcula alertasOperativas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const alertasOperativas = [
      ...inboxItems
        .filter((item) => item.estado !== 'resuelto')
        .map((item) => ({ id: item.id || '', titulo: item.titulo || item.tipo || 'Inbox', detalle: item.mensaje || 'Pendiente', color: item.prioridad === 'urgente' ? BRAND.error : BRAND.warning })),
      ...feedbacks
        .filter((feedback) => feedback.estado !== 'resuelto')
        .map((feedback) => ({ id: feedback.id || '', titulo: feedback.tipo || 'Feedback', detalle: feedback.mensaje || 'Sin detalle', color: feedback.tipo === 'problema' || feedback.tipo === 'dificultad' ? BRAND.error : BRAND.cyan })),
    ].slice(0, 5);

    // Calcula empleadosRiesgo; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const empleadosRiesgo = checkIns
      .filter((checkIn) => (Number(checkIn.estres) || 0) >= 4 || (Number(checkIn.cargaLaboral) || 0) >= 4)
      .sort((a, b) => (Number(b.estres) || 0) - (Number(a.estres) || 0))
      .slice(0, 5)
      .map((checkIn) => {
        // Declara usuario; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const usuario = usuarios.find((item) => item.id === checkIn.userId);
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return {
          id: checkIn.id || checkIn.userId || `${checkIn.fecha || checkIn.timestamp}-${checkIn.estres || 0}`,
          nombre: usuario?.nombre || 'Empleado',
          depto: usuario?.departamento || 'Sin departamento',
          estres: Number(checkIn.estres) || 0,
        };
      });

    // Declara actividad; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const actividad = logs
      .slice()
      .sort((a, b) => (obtenerFecha(b.timestamp)?.getTime() || 0) - (obtenerFecha(a.timestamp)?.getTime() || 0))
      .slice(0, 5);

    // Calcula topDepartamentos; transforma la lista original en datos listos para renderizar o guardar.
    const topDepartamentos = Object.entries(departamentos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([nombre, total]) => ({ nombre, total, share: porcentaje(total, usuarios.length) }));

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return {
      activos,
      inactivos,
      empleadosEnPausa,
      empleadosOcupados,
      empleadosConectados,
      empleadosAusentes,
      tareasPendientes,
      tareasProgreso,
      tareasCompletadas,
      tareasAltaPrioridad,
      tareasVencidas,
      tiempoPromedioTareas,
      productividad,
      costoMensual,
      payrollProcesando,
      checkInsHoy,
      participacion,
      entradasHoy: entradasHoy.length,
      salidasHoy: salidasHoy.length,
      pausasActivas: Math.max(pausasActivas, empleadosEnPausa),
      retrasos,
      horasExtra,
      tiempoTrabajadoTotal,
      bienestar,
      neutral,
      riesgo,
      alertas,
      ausenciasPendientes,
      solicitudesInternasPendientes,
      aprobacionesPendientes,
      incidenciasAbiertas,
      inboxCritico,
      documentosPendientes,
      notificacionesNoLeidas,
      serieDiaria: crearSerie('diario'),
      serieSemanal: crearSerie('semanal'),
      serieMensual: crearSerie('mensual'),
      checkInsHoyDetalle,
      energiaDistribucion,
      empleadosSinCheckIn,
      empleadosRiesgo,
      solicitudesPendientes,
      alertasOperativas,
      actividad,
      topDepartamentos,
    };
  }, [usuarios, tareas, pagos, checkIns, logs, ausencias, notificaciones, asistencias, solicitudesInternas, feedbacks, inboxItems, documentos]);

  // Calcula el resumen del periodo seleccionado
  const resumenPeriodo = useMemo(() => {
    const totalPeriodos = 8;
    const periodos = Array.from({ length: totalPeriodos }).map((_, indice) => {
      const inicio = new Date();
      if (modoGrafico === 'diario') {
        inicio.setDate(inicio.getDate() - (totalPeriodos - 1 - indice));
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(inicio);
        fin.setHours(23, 59, 59, 999);
        return { inicio, fin };
      }
      if (modoGrafico === 'semanal') {
        inicio.setDate(inicio.getDate() - ((totalPeriodos - 1 - indice) * 7));
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(inicio);
        fin.setDate(fin.getDate() + 6);
        fin.setHours(23, 59, 59, 999);
        return { inicio, fin };
      }
      // mensual
      inicio.setMonth(inicio.getMonth() - (totalPeriodos - 1 - indice), 1);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0, 23, 59, 59, 999);
      return { inicio, fin };
    });

    const inicioPeriodo = periodos[0].inicio;
    const finPeriodo = periodos[periodos.length - 1].fin;

    // Generar la lista de días calendario comprendidos en el período
    const diasArray: Date[] = [];
    let current = new Date(inicioPeriodo);
    let limit = 0;
    while (current <= finPeriodo && limit < 400) {
      diasArray.push(new Date(current));
      current.setDate(current.getDate() + 1);
      limit++;
    }

    const activos = usuarios.filter((usuario) => usuario.activo !== false && usuario.estado_activo !== false).length || 1;

    // 1. Asistencia Promedio
    let sumaAsistenciaPct = 0;
    diasArray.forEach((day) => {
      const entradasDia = asistencias.filter((a) => {
        if (a.tipo !== 'entrada') return false;
        const t = obtenerFecha(a.timestamp);
        return !!t &&
               t.getFullYear() === day.getFullYear() &&
               t.getMonth() === day.getMonth() &&
               t.getDate() === day.getDate();
      }).length;
      const pct = Math.min(100, Math.round((entradasDia / activos) * 100));
      sumaAsistenciaPct += pct;
    });
    const asistenciaPct = diasArray.length > 0 ? Math.round(sumaAsistenciaPct / diasArray.length) : 0;

    // 2. Tiempo Laborado total
    const ahora = new Date();
    let totalMsPeriodo = 0;
    diasArray.forEach((day) => {
      const asistenciasDia = asistencias.filter((a) => {
        const t = obtenerFecha(a.timestamp);
        return !!t &&
               t.getFullYear() === day.getFullYear() &&
               t.getMonth() === day.getMonth() &&
               t.getDate() === day.getDate();
      });
      const tiempoTrabajadoPorUsuarioDia: Record<string, number> = {};
      asistenciasDia.forEach((asistencia) => {
        const uId = asistencia.userId;
        if (!uId) return;
        const t = obtenerFecha(asistencia.timestamp);
        if (!t) return;
        if (asistencia.tipo === 'entrada') {
          tiempoTrabajadoPorUsuarioDia[uId] = t.getTime();
        }
      });
      Object.entries(tiempoTrabajadoPorUsuarioDia).forEach(([uId, entradaTime]) => {
        const salida = asistenciasDia.find((a) => a.userId === uId && a.tipo === 'salida');
        const esHoy = day.getFullYear() === ahora.getFullYear() && day.getMonth() === ahora.getMonth() && day.getDate() === ahora.getDate();
        let tFinTime: number;
        if (salida) {
          tFinTime = obtenerFecha(salida.timestamp)?.getTime() || entradaTime;
        } else if (esHoy) {
          tFinTime = ahora.getTime();
        } else {
          tFinTime = entradaTime + 8 * 60 * 60 * 1000;
        }
        if (tFinTime > entradaTime) {
          totalMsPeriodo += tFinTime - entradaTime;
        }
      });
    });
    const totalMinutosPeriodo = Math.round(totalMsPeriodo / (1000 * 60));
    const hrsPeriodo = Math.floor(totalMinutosPeriodo / 60);
    const minsPeriodo = totalMinutosPeriodo % 60;
    const tiempoTrabajado = `${hrsPeriodo}h ${minsPeriodo}m`;

    // 3. Check-ins Hechos en el periodo
    const checkInsPeriodo = checkIns.filter((c) => {
      const t = obtenerFechaCheckIn(c);
      return !!t && t >= inicioPeriodo && t <= finPeriodo;
    }).length;

    // 4. Aprobaciones sin resolver creadas en el periodo
    const ausenciasPeriodo = ausencias.filter((a) => {
      if (a.estado !== 'pendiente') return false;
      const t = obtenerFecha(a.fecha_solicitud);
      return !!t && t >= inicioPeriodo && t <= finPeriodo;
    }).length;

    const solicitudesPeriodo = solicitudesInternas.filter((s) => {
      if (s.estado !== 'pendiente' && s.estado !== 'revisado') return false;
      const t = obtenerFecha(s.timestamp);
      return !!t && t >= inicioPeriodo && t <= finPeriodo;
    }).length;

    const aprobacionesPendientes = ausenciasPeriodo + solicitudesPeriodo;

    return {
      asistenciaPct,
      tiempoTrabajado,
      checkInsPeriodo,
      aprobacionesPendientes,
    };
  }, [modoGrafico, usuarios, asistencias, checkIns, ausencias, solicitudesInternas]);


  // Declara stats; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const stats = [
    {
      label: t('admin.dashboard.stats.active_team'),
      val: metricas.activos.toString(),
      trend: t('admin.dashboard.stats.registered_count', { count: usuarios.length }),
      tono: 'cyan' as const,
      icon: <Users size={24} color={ADMIN.iconos.personas} />,
    },
    {
      label: t('admin.dashboard.stats.productivity'),
      val: `${metricas.productividad}%`,
      trend: t('admin.dashboard.stats.pending_tasks', { count: metricas.tareasPendientes }),
      tono: metricas.productividad >= 75 ? 'success' as const : 'warning' as const,
      icon: <ClipboardList size={24} color={metricas.productividad >= 75 ? ADMIN.iconos.exito : ADMIN.iconos.tareas} />,
    },
    {
      label: t('admin.dashboard.stats.priorities'),
      val: `${metricas.riesgo}%`,
      trend: t('admin.dashboard.stats.pending_approvals', { count: metricas.aprobacionesPendientes }),
      tono: metricas.riesgo > 45 || metricas.alertas > 0 ? 'error' as const : 'cyan' as const,
      icon: <AlertTriangle size={24} color={metricas.riesgo > 45 || metricas.alertas > 0 ? ADMIN.iconos.peligro : ADMIN.iconos.auditoria} />,
    }
  ];

  // Declara datosGrafico; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const datosGrafico = modoGrafico === 'diario' ? metricas.serieDiaria : modoGrafico === 'semanal' ? metricas.serieSemanal : metricas.serieMensual;
  // Declara subtituloGrafico; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const subtituloGrafico = modoGrafico === 'diario'
    ? t('admin.dashboard.chart.subtitle_diario')
    : t(`admin.dashboard.chart.subtitle_${modoGrafico}`);

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (cargando) {
    // Devuelve el JSX que React Native renderiza en pantalla.
    return (
      // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
      <View style={[estilos.scrollView, estilos.estadoCarga]}>
        {/* Indicador de carga; comunica que hay una operacion asincrona en progreso. */}
        <ActivityIndicator size="large" color={BRAND.iconBright} />
      </View>
    );
  }

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View style={[estilos.animatedScreen, { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView style={estilos.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={[estilos.scrollViewContent, { paddingTop: isMobileOrTablet ? 110 : 260 }]}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.header, isMobileOrTablet && { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.headerTitle}>{nombreEmpresa}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.headerSubtitle}>{t('admin.dashboard.title')}</Text>
          </View>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.livePill}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.liveDot} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.liveText}>Nexxus Cloud</Text>
          </View>
        </View>

        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.heroPanel, isMobileOrTablet && estilos.heroPanelMobile, isPhone && estilos.heroPanelPhone]}>
          {/* FondoHeaderTech renderiza la cuadrícula de fondo y el pulso operativo de datos sin usar esferas ni partículas. */}
          {!isPhone && <FondoHeaderTech />}
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[estilos.heroCopy, isMobileOrTablet && estilos.heroCopyMobile]}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.heroKicker}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.heroKickerDot} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.heroEyebrow}>{t('admin.dashboard.hero.eyebrow')}</Text>
            </View>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.heroTitle, isMobileOrTablet && estilos.heroTitleMobile, isPhone && estilos.heroTitlePhone]}>
              {isPhone ? 'Centro operativo en vivo' : t('admin.dashboard.hero.title')}
            </Text>
            {isPhone && (
              <Text style={estilos.heroSubtitlePhone}>
                Señales clave de tu equipo en una vista limpia para móvil.
              </Text>
            )}
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[estilos.heroActions, isMobileOrTablet && estilos.heroActionsMobile, isPhone && estilos.heroActionsPhone]}>
              {/* Activos */}
              <BlurView intensity={theme.isDark ? 25 : 55} tint={theme.isDark ? 'dark' : 'light'} style={[estilos.heroMetricPill, estilos.heroMetricPillBlue, isPhone && estilos.heroMetricPillPhone]}>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.heroMetricHeader}>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View style={[estilos.heroMetricIconBg, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                    {/* Users renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                    <Users size={12} color="#60A5FA" />
                  </View>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.heroMetricLabel}>{t('admin.dashboard.hero.active')}</Text>
                </View>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.heroMetricBody}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.heroMetricValue}>{metricas.activos}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={[estilos.heroMetricTrend, { color: '#60A5FA' }]}>{t('admin.dashboard.hero.online')}</Text>
                </View>
              </BlurView>

              {/* Productividad */}
              <BlurView intensity={theme.isDark ? 25 : 55} tint={theme.isDark ? 'dark' : 'light'} style={[estilos.heroMetricPill, estilos.heroMetricPillViolet, isPhone && estilos.heroMetricPillPhone]}>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.heroMetricHeader}>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View style={[estilos.heroMetricIconBg, { backgroundColor: 'rgba(168,85,247,0.12)' }]}>
                    {/* Zap renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                    <Zap size={12} color="#C084FC" />
                  </View>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.heroMetricLabel}>{t('admin.dashboard.hero.productivity')}</Text>
                </View>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.heroMetricBody}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.heroMetricValue}>{metricas.productividad}%</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={[estilos.heroMetricTrend, { color: '#C084FC' }]}>+2.4%</Text>
                </View>
              </BlurView>

              {/* Check-ins */}
              <BlurView intensity={theme.isDark ? 25 : 55} tint={theme.isDark ? 'dark' : 'light'} style={[estilos.heroMetricPill, estilos.heroMetricPillEmerald, isPhone && estilos.heroMetricPillPhone]}>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.heroMetricHeader}>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View style={[estilos.heroMetricIconBg, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                    {/* UserCheck renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                    <UserCheck size={12} color="#34D399" />
                  </View>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.heroMetricLabel}>{t('admin.dashboard.hero.checkins')}</Text>
                </View>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.heroMetricBody}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.heroMetricValue}>{metricas.checkInsHoy}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={[estilos.heroMetricTrend, { color: '#34D399' }]}>{t('admin.dashboard.hero.completed')}</Text>
                </View>
              </BlurView>
            </View>
          </View>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[estilos.heroDashboardShell, isMobileOrTablet && estilos.heroDashboardShellMobile, isPhone && estilos.heroDashboardShellPhone]}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.heroWindowBar}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={[estilos.heroWindowDot, { backgroundColor: BRAND.error }]} />
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={[estilos.heroWindowDot, { backgroundColor: BRAND.warning }]} />
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={[estilos.heroWindowDot, { backgroundColor: BRAND.success }]} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.heroWindowTitle}>{t('admin.dashboard.hero.live_ops')}</Text>
            </View>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[estilos.heroDashboardGrid, isPhone && estilos.heroDashboardGridPhone]}>
              {/* Main health card */}
              <View style={[estilos.heroPanelCard, estilos.heroPanelMain, isPhone && estilos.heroPanelMainPhone, { backgroundColor: theme.isDark ? ADMIN.fondoVidrioFuerte : '#FFFFFF', borderColor: theme.isDark ? ADMIN.borde : 'rgba(91,65,150,0.16)' }]}>
                <View style={[estilos.heroPanelMainCopy, isPhone && estilos.heroPanelMainCopyPhone]}>
                  <Text style={estilos.heroPanelLabel}>{t('admin.dashboard.hero.health_score')}</Text>
                  <Text style={estilos.heroPanelValue}>{Math.max(0, Math.min(100, metricas.productividad - Math.round(metricas.riesgo / 3)))}%</Text>
                  <Text style={estilos.heroPanelText}>{t('admin.dashboard.hero.health_detail')}</Text>
                </View>
                {/* Animated mini sparkline chart */}
                {!isPhone && <HeroMiniChart datos={datosGrafico} />}
              </View>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={[estilos.heroPanelCard, isPhone && estilos.heroPanelCardPhone, { backgroundColor: theme.isDark ? ADMIN.fondoVidrioFuerte : '#FFFFFF', borderColor: theme.isDark ? ADMIN.borde : 'rgba(91,65,150,0.16)' }]}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.heroPanelLabel}>{t('admin.dashboard.hero.load')}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.heroPanelStrong}>{datosGrafico[datosGrafico.length - 1]?.carga || 0}%</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.heroPanelText}>{t('admin.dashboard.hero.active_capacity')}</Text>
              </View>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={[estilos.heroPanelCard, isPhone && estilos.heroPanelCardPhone, { backgroundColor: theme.isDark ? ADMIN.fondoVidrioFuerte : '#FFFFFF', borderColor: theme.isDark ? ADMIN.borde : 'rgba(91,65,150,0.16)' }]}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.heroPanelLabel}>{t('admin.dashboard.hero.stress')}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.heroPanelStrong}>{datosGrafico[datosGrafico.length - 1]?.estres || 0}%</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.heroPanelText}>{t('admin.dashboard.hero.emotional_signal')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.topGrid, !isTabletOrWeb && estilos.topGridMobile]}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.anchoTotal}>
            {/* PremiumCard renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <PremiumCard style={[estilos.barChartCard, isPhone && estilos.barChartCardPhone]}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={[estilos.chartHeader, isPhone && estilos.chartHeaderPhone]}>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={[estilos.chartTitleContainer, isPhone && estilos.chartTitleContainerPhone]}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <IconWrapper tono="violet"><Activity size={20} color={theme.isDark ? '#FEFEFE' : '#7C3AED'} /></IconWrapper>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.chartTitle, isPhone && estilos.chartTitlePhone]}>{t('admin.dashboard.chart.title')}</Text>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.chartSubtitle, isPhone && estilos.chartSubtitlePhone]}>{subtituloGrafico}</Text>
                  </View>
                </View>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={[estilos.chartActions, isPhone && estilos.chartActionsPhone]}>
                  {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                  <TouchableOpacity onPress={() => setModoGrafico('diario')} style={[estilos.chartToggle, isPhone && estilos.chartTogglePhone, modoGrafico === 'diario' && estilos.chartToggleActivo]}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.chartToggleText, modoGrafico === 'diario' && estilos.chartToggleTextActivo]}>{t('admin.dashboard.chart.days')}</Text>
                  </TouchableOpacity>
                  {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                  <TouchableOpacity onPress={() => setModoGrafico('semanal')} style={[estilos.chartToggle, isPhone && estilos.chartTogglePhone, modoGrafico === 'semanal' && estilos.chartToggleActivo]}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.chartToggleText, modoGrafico === 'semanal' && estilos.chartToggleTextActivo]}>{t('common.weekly')}</Text>
                  </TouchableOpacity>
                  {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                  <TouchableOpacity onPress={() => setModoGrafico('mensual')} style={[estilos.chartToggle, isPhone && estilos.chartTogglePhone, modoGrafico === 'mensual' && estilos.chartToggleActivo]}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.chartToggleText, modoGrafico === 'mensual' && estilos.chartToggleTextActivo]}>{t('common.monthly')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Chart + side panel side-by-side */}
              <View style={[estilos.chartBody, !isTabletOrWeb && { flexDirection: 'column' }, isPhone && estilos.chartBodyPhone]}>
                <View style={[estilos.chartGraphArea, isPhone && estilos.chartGraphAreaPhone]}>
                  {isPhone ? <MobileSignalDonut datos={datosGrafico} /> : <PerformanceSparkChart datos={datosGrafico} />}
                </View>
                <ChartSidePanel
                  datos={datosGrafico}
                  eventos={eventosCalendario}
                  metricas={metricas}
                  resumenPeriodo={resumenPeriodo}
                  modoGrafico={modoGrafico}
                />
              </View>
            </PremiumCard>
          </View>
        </View>

        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.detalleOperativoBar, isPhone && estilos.detalleOperativoBarPhone]}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={isPhone && estilos.detalleOperativoCopyPhone}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.detalleOperativoTitulo}>{t('admin.dashboard.advanced.bar_title')}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.detalleOperativoTexto}>{t('admin.dashboard.advanced.bar_subtitle')}</Text>
          </View>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity onPress={() => setMostrarDetalleOperativo((valor) => !valor)} activeOpacity={0.88} style={[estilos.detalleOperativoBoton, isPhone && estilos.detalleOperativoBotonPhone]}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.detalleOperativoBotonTexto}>{mostrarDetalleOperativo ? t('common.hide') : t('common.open_action')}</Text>
          </TouchableOpacity>
        </View>

        {mostrarDetalleOperativo && (
          // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
          <Animated.View style={[estilos.detalleOperativoContenido, { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[estilos.advancedGrid, estilos.advancedGridCompact, !isTabletOrWeb && estilos.topGridMobile]}>
              {/* PremiumCard renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <PremiumCard style={[estilos.advancedCard, estilos.advancedCardFullWidth]}>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.panelHeader}>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.panelTitle}>{t('admin.dashboard.checkin.title')}</Text>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.panelSubtitle}>{t('admin.dashboard.checkin.subtitle')}</Text>
                  </View>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <IconWrapper tono="cyan"><Timer size={20} color={theme.isDark ? '#22D3EE' : '#0891B2'} /></IconWrapper>
                </View>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.checkInMetricGrid}>
                  {/* MetricRow renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                  <View style={estilos.checkInMetricItem}>
                    <MetricRow icon={<Timer size={16} color={BRAND.cyan} />} label={t('admin.dashboard.checkin.participation')} value={metricas.checkInsHoy} total={metricas.activos} color={BRAND.cyan} />
                  </View>
                  {/* MetricRow renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                  <View style={estilos.checkInMetricItem}>
                    <MetricRow icon={<HeartPulse size={16} color={BRAND.error} />} label={t('admin.dashboard.checkin.followup')} value={metricas.empleadosRiesgo.length} total={Math.max(metricas.activos, 1)} color={BRAND.error} />
                  </View>
                </View>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.listadoCompacto}>
                  {metricas.empleadosSinCheckIn.slice(0, 3).map((empleado) => (
                    // ListItem renderiza una pieza visual reutilizable dentro de esta pantalla.
                    <ListItem key={empleado.id || empleado.correo} inicial={(empleado.nombre || '?')[0]} titulo={empleado.nombre || t('common.employee')} detalle={empleado.departamento || t('common.no_department')} badge={t('common.pending')} color={BRAND.cyan} />
                  ))}
                  {metricas.empleadosSinCheckIn.length === 0 && <EmptyState texto={t('admin.dashboard.checkin.all_up_to_date')} />}
                </View>
              </PremiumCard>

              {/* PremiumCard renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <PremiumCard style={[estilos.advancedCard, estilos.advancedCardFullWidth]}>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.panelHeader}>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.panelTitle}>{t('admin.dashboard.approvals.title')}</Text>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.panelSubtitle}>{t('admin.dashboard.approvals.subtitle')}</Text>
                  </View>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <IconWrapper tono="warning"><Inbox size={20} color={theme.isDark ? '#FBBF24' : '#D97706'} /></IconWrapper>
                </View>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.listadoCompacto}>
                  {metricas.solicitudesPendientes.length > 0 ? metricas.solicitudesPendientes.slice(0, 5).map((item) => (
                    // ApprovalItem renderiza una pieza visual reutilizable dentro de esta pantalla.
                    <ApprovalItem
                      key={`${item.tipo}-${item.id}`}
                      titulo={item.titulo}
                      detalle={item.empleado}
                      tipo={item.tipo}
                      prioridad={item.prioridad}
                      fotoPerfil={item.fotoPerfil}
                      onPress={() => setSolicitudSeleccionada(item)}
                      onAprobar={() => item.tipo === 'ausencia' ? actualizarSolicitudAusencia(item.solicitud as AusenciaAdmin, 'aprobada') : actualizarSolicitudInterna(item.solicitud as SolicitudInternaAdmin, 'aprobado')}
                      onRechazar={() => item.tipo === 'ausencia' ? actualizarSolicitudAusencia(item.solicitud as AusenciaAdmin, 'rechazada') : actualizarSolicitudInterna(item.solicitud as SolicitudInternaAdmin, 'rechazado')}
                    />
                  )) : (
                    // EmptyState renderiza una pieza visual reutilizable dentro de esta pantalla.
                    <EmptyState texto={t('admin.dashboard.approvals.empty')} />
                  )}
                </View>
              </PremiumCard>
              {/* PremiumCard renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <PremiumCard style={[estilos.advancedCard, estilos.advancedCardFullWidth]}>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.panelHeader}>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.panelTitle}>{t('admin.dashboard.alerts.title')}</Text>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.panelSubtitle}>{t('admin.dashboard.alerts.subtitle')}</Text>
                  </View>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <IconWrapper tono="error"><MessageSquareWarning size={20} color={theme.isDark ? '#F87171' : '#DC2626'} /></IconWrapper>
                </View>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.listadoCompacto}>
                  {metricas.alertasOperativas.length > 0 ? metricas.alertasOperativas.slice(0, 5).map((alerta) => (
                    // ListItem renderiza una pieza visual reutilizable dentro de esta pantalla.
                    <ListItem key={alerta.id} inicial="!" titulo={alerta.titulo} detalle={alerta.detalle} badge={t('common.open')} color={alerta.color} />
                  )) : (
                    // EmptyState renderiza una pieza visual reutilizable dentro de esta pantalla.
                    <EmptyState texto={t('admin.dashboard.alerts.empty')} />
                  )}
                </View>
              </PremiumCard>

              {/* PremiumCard renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <PremiumCard style={[estilos.advancedCard, estilos.advancedCardFullWidth]}>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.panelHeader}>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.panelTitle}>{t('admin.dashboard.activity.title')}</Text>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.panelSubtitle}>{t('admin.dashboard.activity.subtitle')}</Text>
                  </View>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <IconWrapper tono="blue"><ShieldCheck size={20} color={theme.isDark ? '#60A5FA' : '#2563EB'} /></IconWrapper>
                </View>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.timeline}>
                  {metricas.actividad.length > 0 ? metricas.actividad.slice(0, 5).map((log) => (
                    // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                    <View key={log.id} style={estilos.timelineItem}>
                      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                      <View style={[estilos.timelineDot, { backgroundColor: log.estado === 'Error' ? BRAND.error : log.estado === 'Warning' ? BRAND.warning : BRAND.success }]} />
                      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                      <View style={estilos.timelineContent}>
                        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                        <Text style={estilos.timelineTitle}>{log.accion || t('admin.dashboard.activity.system_event')}</Text>
                        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                        <Text style={estilos.timelineMeta}>{log.usuarioNombre || t('common.system')} · {log.modulo || t('common.general')}</Text>
                      </View>
                    </View>
                  )) : (
                    // EmptyState renderiza una pieza visual reutilizable dentro de esta pantalla.
                    <EmptyState texto={t('admin.dashboard.activity.empty')} />
                  )}
                </View>
              </PremiumCard>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Ventana modal para inspeccionar a detalle una solicitud de aprobación */}
      <AdminModal
        visible={solicitudSeleccionada !== null}
        animationType="fade"
        onRequestClose={() => setSolicitudSeleccionada(null)}
      >
        <View style={estilos.modalOverlay}>
          <AdminModalFormGlass style={estilos.modalCard}>
            <View style={estilos.modalHeader}>
              <View>
                <Text style={estilos.modalTitle}>
                  {solicitudSeleccionada?.tipo === 'ausencia'
                    ? t('admin.dashboard.approvals.absence_detail', { defaultValue: 'DETALLES DE AUSENCIA' })
                    : t('admin.dashboard.approvals.request_detail', { defaultValue: 'DETALLES DE SOLICITUD' })}
                </Text>
                <Text style={estilos.modalSubtitle}>
                  {t('admin.dashboard.approvals.modal_subtitle', { defaultValue: 'CENTRO DE APROBACIONES NEXXUS' })}
                </Text>
              </View>
              <TouchableOpacity style={estilos.modalClose} onPress={() => setSolicitudSeleccionada(null)}>
                <X size={20} color={BRAND.textSec} />
              </TouchableOpacity>
            </View>

            <ScrollView style={estilos.modalBody} showsVerticalScrollIndicator={false}>
              {solicitudSeleccionada && (
                <View style={estilos.modalContentContainer}>
                  {/* Card de Empleado */}
                  <View style={estilos.employeeCard}>
                    <View style={estilos.employeeAvatar}>
                      {solicitudSeleccionada.fotoPerfil ? (
                        <Image
                          source={{ uri: solicitudSeleccionada.fotoPerfil }}
                          style={estilos.employeeAvatarImage}
                        />
                      ) : (
                        <Text style={estilos.employeeAvatarText}>
                          {(solicitudSeleccionada.empleado || '?')[0].toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={estilos.employeeInfo}>
                      <Text style={estilos.employeeName}>{solicitudSeleccionada.empleado}</Text>
                      <Text style={estilos.employeeLabel}>{t('common.employee', { defaultValue: 'Colaborador' })}</Text>
                    </View>
                  </View>

                  {/* Grid de Detalles */}
                  <View style={estilos.detailsGrid}>
                    <View style={estilos.detailsGridCol}>
                      <Text style={estilos.detailsLabel}>{t('common.type', { defaultValue: 'Tipo' })}</Text>
                      <Text style={estilos.detailsValue}>
                        {obtenerTextoTipo(t, solicitudSeleccionada)}
                      </Text>
                    </View>

                    <View style={estilos.detailsGridCol}>
                      <Text style={estilos.detailsLabel}>{t('common.priority_title', { defaultValue: 'Prioridad' })}</Text>
                      <View style={[
                        estilos.priorityBadge,
                        {
                          backgroundColor: obtenerColorPrioridad(solicitudSeleccionada.prioridad).bg,
                          alignSelf: 'flex-start',
                          marginTop: 4
                        }
                      ]}>
                        <Text style={[
                          estilos.priorityBadgeText,
                          { color: obtenerColorPrioridad(solicitudSeleccionada.prioridad).text }
                        ]}>
                          {obtenerTextoPrioridad(t, solicitudSeleccionada.prioridad).toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={estilos.detailsGridCol}>
                      <Text style={estilos.detailsLabel}>{t('admin.dashboard.approvals.start_date', { defaultValue: 'Fecha Inicio' })}</Text>
                      <Text style={estilos.detailsValue}>
                        {solicitudSeleccionada.solicitud?.fecha_inicio || solicitudSeleccionada.solicitud?.fecha_solicitud || t('admin.dashboard.approvals.not_specified', { defaultValue: 'No especificada' })}
                      </Text>
                    </View>

                    <View style={estilos.detailsGridCol}>
                      <Text style={estilos.detailsLabel}>{t('admin.dashboard.approvals.end_date', { defaultValue: 'Fecha Fin' })}</Text>
                      <Text style={estilos.detailsValue}>
                        {solicitudSeleccionada.solicitud?.fecha_fin || t('admin.dashboard.approvals.not_specified', { defaultValue: 'No especificada' })}
                      </Text>
                    </View>

                    {solicitudSeleccionada.solicitud?.monto !== undefined && (
                      <View style={estilos.detailsGridCol}>
                        <Text style={estilos.detailsLabel}>{t('admin.dashboard.approvals.amount', { defaultValue: 'Monto' })}</Text>
                        <Text style={[estilos.detailsValue, { color: BRAND.cyan }]}>
                          ${Number(solicitudSeleccionada.solicitud.monto).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Tarjeta de Motivo / Descripción */}
                  <View style={estilos.reasonSection}>
                    <Text style={estilos.sectionTitle}>
                      {t('admin.dashboard.approvals.reason_title', { defaultValue: 'MOTIVO Y DETALLES DE LA SOLICITUD' })}
                    </Text>
                    <View style={estilos.reasonCard}>
                      <Text style={estilos.reasonText}>
                        {solicitudSeleccionada.solicitud?.descripcion_detallada ||
                          solicitudSeleccionada.solicitud?.motivo ||
                          solicitudSeleccionada.solicitud?.descripcion ||
                          t('admin.dashboard.approvals.no_description', { defaultValue: 'Sin descripción detallada proporcionada.' })}
                      </Text>
                    </View>
                  </View>

                  {/* Información de Emergencia si existe */}
                  {solicitudSeleccionada.solicitud?.contacto_emergencia ? (
                    <View style={estilos.extraInfoRow}>
                      <HeartPulse size={18} color={BRAND.error} style={{ marginRight: 8 }} />
                      <Text style={estilos.extraInfoText}>
                        <Text style={{ fontWeight: 'bold' }}>{t('admin.dashboard.approvals.emergency_contact', { defaultValue: 'Contacto Emergencia' })}: </Text>
                        {solicitudSeleccionada.solicitud.contacto_emergencia}
                      </Text>
                    </View>
                  ) : null}

                  {/* Adjunto si existe */}
                  {solicitudSeleccionada.solicitud?.archivo_adjunto ? (
                    <View style={estilos.extraInfoRow}>
                      <FileText size={18} color={BRAND.cyan} style={{ marginRight: 8 }} />
                      <Text style={estilos.extraInfoText} numberOfLines={1}>
                        <Text style={{ fontWeight: 'bold' }}>{t('admin.dashboard.approvals.attachment', { defaultValue: 'Adjunto' })}: </Text>
                        {solicitudSeleccionada.solicitud.archivo_adjunto}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </ScrollView>

            {/* Acciones del Modal */}
            <View style={estilos.modalFooter}>
              <TouchableOpacity
                style={[estilos.footerButton, estilos.footerButtonError]}
                onPress={async () => {
                  const item = solicitudSeleccionada;
                  setSolicitudSeleccionada(null);
                  if (item.tipo === 'ausencia') {
                    await actualizarSolicitudAusencia(item.solicitud as AusenciaAdmin, 'rechazada');
                  } else {
                    await actualizarSolicitudInterna(item.solicitud as SolicitudInternaAdmin, 'rechazado');
                  }
                }}
              >
                <X size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={estilos.footerButtonTextPrimary}>
                  {t('common.reject', { defaultValue: 'Rechazar' })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[estilos.footerButton, estilos.footerButtonSuccess]}
                onPress={async () => {
                  const item = solicitudSeleccionada;
                  setSolicitudSeleccionada(null);
                  if (item.tipo === 'ausencia') {
                    await actualizarSolicitudAusencia(item.solicitud as AusenciaAdmin, 'aprobada');
                  } else {
                    await actualizarSolicitudInterna(item.solicitud as SolicitudInternaAdmin, 'aprobado');
                  }
                }}
              >
                <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={estilos.footerButtonTextPrimary}>
                  {t('common.approve', { defaultValue: 'Aprobar' })}
                </Text>
              </TouchableOpacity>
            </View>
          </AdminModalFormGlass>
        </View>
      </AdminModal>
    </Animated.View>
  );
};

/**
 * Componente MetricRow. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const MetricRow = ({ icon, label, value, total, color }: { icon: React.ReactNode; label: string; value: number; total: number; color: string }) => {
  // Declara avance; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const avance = porcentaje(value, total);
  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
    <View style={estilos.metricRow}>
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={estilos.metricRowTop}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.metricRowLabel}>
          {icon}
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.metricLabel}>{label}</Text>
        </View>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.metricValue}>{value}</Text>
      </View>
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={estilos.progressTrack}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.progressFill, { width: `${Math.max(avance, value > 0 ? 6 : 0)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

/**
 * Componente ListItem. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const ListItem = ({ inicial, titulo, detalle, badge, color }: { inicial: string; titulo: string; detalle: string; badge: string; color: string }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={estilos.listItem}>
    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
    <View style={[estilos.listAvatar, { borderColor: `${color}55` }]}>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={[estilos.listAvatarText, { color }]}>{inicial.toUpperCase()}</Text>
    </View>
    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
    <View style={estilos.listInfo}>
      {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
      <Text style={estilos.listTitle} numberOfLines={1}>{titulo}</Text>
      {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
      <Text style={estilos.listDetail} numberOfLines={1}>{detalle}</Text>
    </View>
    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
    <View style={[estilos.listBadge, { borderColor: `${color}55`, backgroundColor: `${color}16` }]}>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={[estilos.listBadgeText, { color }]}>{badge}</Text>
    </View>
  </View>
);

const obtenerColorPrioridad = (prioridad?: string) => {
  const p = (prioridad || 'media').toLowerCase();
  if (p === 'alta' || p === 'urgente' || p === 'high') return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' };
  if (p === 'media' || p === 'medium' || p === 'normal') return { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B' };
  return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' };
};

const obtenerTextoPrioridad = (t: any, prioridad?: string) => {
  if (!prioridad) return '';
  const p = prioridad.toLowerCase();

  // Si es un tipo de ausencia
  if (['vacaciones', 'enfermedad', 'personal', 'emergencia', 'capacitacion'].includes(p)) {
    return t(`solicitudesAusencia.categories.${p}`, { defaultValue: prioridad });
  }

  // Prioridades estándar
  if (p === 'low' || p === 'baja') return t('common.priority.baja', { defaultValue: 'Baja' });
  if (p === 'medium' || p === 'media') return t('common.priority.media', { defaultValue: 'Media' });
  if (p === 'high' || p === 'alta') return t('common.priority.alta', { defaultValue: 'Alta' });
  if (p === 'urgent' || p === 'urgente') return t('common.priority.urgente', { defaultValue: 'Urgente' });

  return t(`common.priority.${p}`, { defaultValue: prioridad });
};

const obtenerTextoTipo = (t: any, item: any) => {
  if (!item) return '';
  const tipoSolicitud = item.tipo; // 'ausencia' o 'interna'
  const valorTipo = item.solicitud?.tipo || item.titulo || '';
  const vtLower = valorTipo.toLowerCase();

  if (tipoSolicitud === 'ausencia') {
    return t(`solicitudesAusencia.categories.${vtLower}`, { defaultValue: valorTipo });
  } else {
    if (['vacaciones', 'permiso', 'adelanto_salarial', 'soporte_tecnico', 'compra_material'].includes(vtLower)) {
      return t(`solicitudesInternas.types.${vtLower}`, { defaultValue: valorTipo });
    }
    return t(`solicitudesInternas.types.${vtLower}`, { defaultValue: valorTipo });
  }
};

/**
 * Componente ApprovalItem. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const ApprovalItem = ({
  titulo,
  detalle,
  tipo,
  prioridad,
  fotoPerfil,
  onPress,
  onAprobar,
  onRechazar,
}: {
  titulo: string;
  detalle: string;
  tipo: 'ausencia' | 'interna';
  prioridad: string;
  fotoPerfil?: string | null;
  onPress: () => void;
  onAprobar: () => void;
  onRechazar: () => void;
}) => {
  const { t } = useTranslation();
  const pColors = obtenerColorPrioridad(prioridad);
  const Icono = tipo === 'ausencia' ? CalendarClock : Inbox;

  // Traducir el título si es un tipo crudo o base
  let tituloTraducido = titulo;
  const tLower = titulo.toLowerCase();
  if (tipo === 'ausencia') {
    tituloTraducido = t(`solicitudesAusencia.categories.${tLower}`, { defaultValue: titulo });
  } else {
    tituloTraducido = t(`solicitudesInternas.types.${tLower}`, { defaultValue: titulo });
  }

  // Traducir la prioridad / categoría
  const prioridadTraducido = obtenerTextoPrioridad(t, prioridad);

  return (
    <View style={estilos.approvalItem}>
      <TouchableOpacity onPress={onPress} style={estilos.approvalInfoContainer} activeOpacity={0.7}>
        <View style={[estilos.approvalIconWrapper, { backgroundColor: tipo === 'ausencia' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)' }]}>
          {fotoPerfil ? (
            <Image source={{ uri: fotoPerfil }} style={estilos.approvalAvatarImage} />
          ) : (
            <Icono size={18} color={tipo === 'ausencia' ? '#3B82F6' : '#10B981'} />
          )}
        </View>
        <View style={estilos.approvalInfo}>
          <View style={estilos.approvalTitleRow}>
            <Text style={estilos.listTitle} numberOfLines={1}>{tituloTraducido}</Text>
            <View style={[estilos.priorityBadge, { backgroundColor: pColors.bg }]}>
              <Text style={[estilos.priorityBadgeText, { color: pColors.text }]}>
                {prioridadTraducido.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={estilos.listDetail} numberOfLines={1}>{detalle}</Text>
        </View>
      </TouchableOpacity>

      <View style={estilos.approvalActions}>
        <TouchableOpacity onPress={onAprobar} style={[estilos.approvalButton, estilos.approvalButtonSuccess]} activeOpacity={0.6}>
          <Check size={14} color={BRAND.success} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onRechazar} style={[estilos.approvalButton, estilos.approvalButtonError]} activeOpacity={0.6}>
          <X size={14} color={BRAND.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Componente EmptyState. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const EmptyState = ({ texto }: { texto: string }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={estilos.emptyState}>
    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
    <Text style={estilos.emptyText}>{texto}</Text>
  </View>
);



/**
 * PerformanceSparkChart – advanced multi-line chart with Y-axis labels, interactive tooltip, entry & update animations.
 * Shows rendimiento (green), carga (amber) and estrés (red) as smooth bezier lines in the same graph.
 */
const PerformanceSparkChart = ({ datos }: { datos: PuntoGrafico[] }) => {
  const { t } = useTranslation();
  // Main entrance/update animation (0 → 1)
  const animacion = useRef(new Animated.Value(0)).current;
  const [avance, setAvance] = useState(0);
  // Tooltip state: which point index is selected (-1 = none)
  const [tooltipIdx, setTooltipIdx] = useState(-1);
  // Glow pulse for hovered dot
  const glowAnim = useRef(new Animated.Value(0)).current;

  const claveDatos = datos.map((p) => `${p.label}-${p.rendimiento}-${p.carga}-${p.estres}`).join('|');

  // Entry + update animation
  useEffect(() => {
    animacion.stopAnimation();
    animacion.setValue(0);
    setTooltipIdx(-1);
    const listener = animacion.addListener(({ value }) => setAvance(value));
    Animated.timing(animacion, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => animacion.removeListener(listener);
  }, [claveDatos]);

  // Pulsing glow loop when tooltip is active
  useEffect(() => {
    if (tooltipIdx >= 0) {
      glowAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        ])
      ).start();
    } else {
      glowAnim.stopAnimation();
      glowAnim.setValue(0);
    }
  }, [tooltipIdx]);

  // SVG canvas dimensions
  const W = 780;
  const H = 270;
  // Margins: left larger for Y-axis labels
  const mg = { t: 32, r: 18, b: 40, l: 46 };
  const iW = W - mg.l - mg.r;
  const iH = H - mg.t - mg.b;

  const datos2 = datos.length > 0 ? datos : [{ label: '', rendimiento: 0, carga: 0, estres: 0 }];
  const n = datos2.length;

  // X coordinate for data point i (centered in its slot)
  const cx = (i: number) => mg.l + (n === 1 ? iW / 2 : (i / (n - 1)) * iW);
  // Y coordinate for value v (0-100)
  const cy = (v: number) => mg.t + iH - (Math.max(0, Math.min(100, v)) / 100) * iH;

  // Smooth catmull-rom bezier path builder
  const buildPath = (pts: { x: number; y: number }[], animated?: boolean, prog?: number) => {
    const usePts = animated && prog !== undefined
      ? pts.slice(0, Math.max(1, Math.ceil((pts.length - 1) * prog) + 1))
      : pts;
    if (usePts.length < 2) return usePts.length === 1 ? `M${usePts[0].x} ${usePts[0].y}` : '';
    const cmds = [`M${usePts[0].x} ${usePts[0].y}`];
    const t2 = 0.18;
    for (let i = 0; i < usePts.length - 1; i++) {
      const a = usePts[i]; const b = usePts[i + 1];
      const prev = usePts[i - 1] || a; const next = usePts[i + 2] || b;
      cmds.push(`C${a.x + (b.x - prev.x) * t2} ${a.y + (b.y - prev.y) * t2},${b.x - (next.x - a.x) * t2} ${b.y - (next.y - a.y) * t2},${b.x} ${b.y}`);
    }
    return cmds.join(' ');
  };

  const buildAreaPath = (pts: { x: number; y: number }[], prog?: number) => {
    const baseY = mg.t + iH;
    const usePts = prog !== undefined
      ? pts.slice(0, Math.max(1, Math.ceil((pts.length - 1) * prog) + 1))
      : pts;
    if (usePts.length === 0) return '';
    const linePath = buildPath(usePts);
    const startX = usePts[0].x;
    const endX = usePts[usePts.length - 1].x;
    return `M${startX} ${baseY} L${startX} ${usePts[0].y} ${linePath.replace(/^M[^ ]+ [^ ]+/, '')} L${endX} ${baseY} Z`;
  };

  // Build all three point sets
  const rPts = datos2.map((p, i) => ({ x: cx(i), y: cy(p.rendimiento) }));
  const cPts = datos2.map((p, i) => ({ x: cx(i), y: cy(p.carga) }));
  const ePts = datos2.map((p, i) => ({ x: cx(i), y: cy(p.estres) }));

  // Animated paths (drawn progressively)
  const rPath = buildPath(rPts, true, avance);
  const cPath = buildPath(cPts, true, avance);
  const ePath = buildPath(ePts, true, avance);
  const rArea = buildAreaPath(rPts, avance);
  const cArea = buildAreaPath(cPts, avance);
  const eArea = buildAreaPath(ePts, avance);

  // Visible points up to animation progress
  const visibleCount = Math.max(1, Math.ceil((n - 1) * avance) + 1);
  const rPtsVis = rPts.slice(0, visibleCount);
  const cPtsVis = cPts.slice(0, visibleCount);
  const ePtsVis = ePts.slice(0, visibleCount);

  // Y-axis grid values
  const gridValues = [0, 25, 50, 75, 100];

  // Tooltip data
  const tooltipPunto = tooltipIdx >= 0 ? datos2[tooltipIdx] : null;
  const tooltipX = tooltipIdx >= 0 ? cx(tooltipIdx) : 0;
  const tooltipLabelX = tooltipX > W - 145 ? tooltipX - 143 : tooltipX + 14;
  const tooltipLabelY = mg.t - 4;

  // Zone width for each data point's invisible hover area



  return (
    <Animated.View
      style={[
        estilos.lineChartShell,
        {
          opacity: animacion,
          transform: [{
            translateY: animacion.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
          }],
        },
      ]}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
      >
        <Defs>
          {/* Gradient fills for each line */}
          <SvgLinearGradient id="gradR" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={BRAND.success} stopOpacity="0.22" />
            <Stop offset="100%" stopColor={BRAND.success} stopOpacity="0.01" />
          </SvgLinearGradient>
          <SvgLinearGradient id="gradC" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={BRAND.warning} stopOpacity="0.18" />
            <Stop offset="100%" stopColor={BRAND.warning} stopOpacity="0.01" />
          </SvgLinearGradient>
          <SvgLinearGradient id="gradE" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={BRAND.error} stopOpacity="0.15" />
            <Stop offset="100%" stopColor={BRAND.error} stopOpacity="0.01" />
          </SvgLinearGradient>
          {/* Background gradient */}
          <SvgLinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="rgba(124,58,237,0.04)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(0,0,0,0)" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>

        {/* Chart area subtle background */}
        <Rect x={mg.l} y={mg.t} width={iW} height={iH} fill="url(#bgGrad)" rx={4} />

        {/* Horizontal grid lines + Y-axis labels */}
        {gridValues.map((v) => {
          const yPos = cy(v);
          return (
            <G key={`grid-${v}`}>
              <Line
                x1={mg.l}
                y1={yPos}
                x2={mg.l + iW}
                y2={yPos}
                stroke={v === 0 ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)'}
                strokeWidth={v === 0 ? 1.5 : 1}
                strokeDasharray={v === 0 ? '0' : '5 7'}
              />
              {/* Y-axis label */}
              <SvgText
                x={mg.l - 8}
                y={yPos + 4}
                fill="#94A3B8"
                fontSize={9}
                fontWeight="700"
                fontFamily={CHART_FONT}
                textAnchor="end"
              >
                {`${v}%`}
              </SvgText>
            </G>
          );
        })}

        {/* Vertical separator line (Y-axis) */}
        <Line
          x1={mg.l}
          y1={mg.t}
          x2={mg.l}
          y2={mg.t + iH}
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
        />

        {/* Vertical tick marks at each data point */}
        {datos2.map((_, i) => (
          <Line
            key={`vtick-${i}`}
            x1={cx(i)}
            y1={mg.t + iH}
            x2={cx(i)}
            y2={mg.t + iH + 4}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1}
          />
        ))}

        {/* Tooltip vertical cursor line */}
        {tooltipIdx >= 0 && (
          <Line
            x1={tooltipX}
            y1={mg.t}
            x2={tooltipX}
            y2={mg.t + iH}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={1.5}
            strokeDasharray="3 4"
          />
        )}

        {/* ── Estrés area + line (drawn first, behind others) ── */}
        {eArea ? <Path d={eArea} fill="url(#gradE)" /> : null}
        {ePath ? <Path d={ePath} fill="none" stroke={BRAND.error} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} /> : null}

        {/* ── Carga area + line ── */}
        {cArea ? <Path d={cArea} fill="url(#gradC)" /> : null}
        {cPath ? <Path d={cPath} fill="none" stroke={BRAND.warning} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} /> : null}

        {/* ── Rendimiento area + line (on top) ── */}
        {rArea ? <Path d={rArea} fill="url(#gradR)" /> : null}
        {rPath ? <Path d={rPath} fill="none" stroke={BRAND.success} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /> : null}

        {/* Data dots – rendimiento */}
        {rPtsVis.map((pt, i) => (
          i === rPtsVis.length - 1 ? (
            <G key={`rdot-${i}`}>
              <Circle cx={pt.x} cy={pt.y} r={7} fill={BRAND.success} opacity={0.12} />
              <Circle cx={pt.x} cy={pt.y} r={4} fill={ADMIN.fondoElevado} stroke={BRAND.success} strokeWidth={2} />
            </G>
          ) : null
        ))}

        {/* Data dots – carga */}
        {cPtsVis.map((pt, i) => (
          i === cPtsVis.length - 1 ? (
            <G key={`cdot-${i}`}>
              <Circle cx={pt.x} cy={pt.y} r={6} fill={BRAND.warning} opacity={0.12} />
              <Circle cx={pt.x} cy={pt.y} r={3.5} fill={ADMIN.fondoElevado} stroke={BRAND.warning} strokeWidth={2} />
            </G>
          ) : null
        ))}

        {/* Data dots – estrés */}
        {ePtsVis.map((pt, i) => (
          i === ePtsVis.length - 1 ? (
            <G key={`edot-${i}`}>
              <Circle cx={pt.x} cy={pt.y} r={6} fill={BRAND.error} opacity={0.12} />
              <Circle cx={pt.x} cy={pt.y} r={3.5} fill={ADMIN.fondoElevado} stroke={BRAND.error} strokeWidth={2} />
            </G>
          ) : null
        ))}

        {/* Tooltip hovered dots */}
        {tooltipIdx >= 0 && tooltipIdx < n && (
          <G>
            {/* Rendimiento hovered dot */}
            <Circle cx={rPts[tooltipIdx].x} cy={rPts[tooltipIdx].y} r={9} fill={BRAND.success} opacity={0.18} />
            <Circle cx={rPts[tooltipIdx].x} cy={rPts[tooltipIdx].y} r={5} fill={ADMIN.fondoElevado} stroke={BRAND.success} strokeWidth={2.5} />
            {/* Carga hovered dot */}
            <Circle cx={cPts[tooltipIdx].x} cy={cPts[tooltipIdx].y} r={8} fill={BRAND.warning} opacity={0.18} />
            <Circle cx={cPts[tooltipIdx].x} cy={cPts[tooltipIdx].y} r={4.5} fill={ADMIN.fondoElevado} stroke={BRAND.warning} strokeWidth={2} />
            {/* Estrés hovered dot */}
            <Circle cx={ePts[tooltipIdx].x} cy={ePts[tooltipIdx].y} r={8} fill={BRAND.error} opacity={0.18} />
            <Circle cx={ePts[tooltipIdx].x} cy={ePts[tooltipIdx].y} r={4.5} fill={ADMIN.fondoElevado} stroke={BRAND.error} strokeWidth={2} />
          </G>
        )}

        {/* Tooltip box (SVG inline) */}
        {tooltipIdx >= 0 && tooltipPunto && (
          <G>
            <Rect
              x={tooltipLabelX}
              y={tooltipLabelY + 2}
              width={130}
              height={74}
              rx={8}
              fill={ADMIN.fondoVidrioFuerte}
              stroke={ADMIN.bordeFuerte}
              strokeWidth={1}
              opacity={0.97}
            />
            {/* Period label */}
            <SvgText
              x={tooltipLabelX + 10}
              y={tooltipLabelY + 19}
              fill="rgba(255,255,255,0.45)"
              fontSize={9}
              fontWeight="800"
              fontFamily={CHART_FONT}
            >
              {tooltipPunto.label.toUpperCase()}
            </SvgText>
            {/* Rendimiento */}
            <Circle cx={tooltipLabelX + 14} cy={tooltipLabelY + 34} r={4} fill={BRAND.success} />
            <SvgText x={tooltipLabelX + 24} y={tooltipLabelY + 38} fill={BRAND.success} fontSize={10} fontWeight="700" fontFamily={CHART_FONT}>
              {`Rendimiento  ${tooltipPunto.rendimiento}%`}
            </SvgText>
            {/* Carga */}
            <Circle cx={tooltipLabelX + 14} cy={tooltipLabelY + 51} r={4} fill={BRAND.warning} />
            <SvgText x={tooltipLabelX + 24} y={tooltipLabelY + 55} fill={BRAND.warning} fontSize={10} fontWeight="700" fontFamily={CHART_FONT}>
              {`Carga          ${tooltipPunto.carga}%`}
            </SvgText>
            {/* Estrés */}
            <Circle cx={tooltipLabelX + 14} cy={tooltipLabelY + 68} r={4} fill={BRAND.error} />
            <SvgText x={tooltipLabelX + 24} y={tooltipLabelY + 72} fill={BRAND.error} fontSize={10} fontWeight="700" fontFamily={CHART_FONT}>
              {`Estrés          ${tooltipPunto.estres}%`}
            </SvgText>
          </G>
        )}

         {/* X-axis labels */}
         {datos2.map((p, i) => {
           const show = n <= 12 || i % Math.ceil(n / 12) === 0 || i === n - 1;
           return show ? (
             <SvgText
               key={`xlabel-${i}`}
               x={cx(i)}
               y={H - 10}
               fill="#94A3B8"
               fontSize={n > 14 ? 8 : 9.5}
               fontWeight={tooltipIdx === i ? '800' : '600'}
               fontFamily={CHART_FONT}
               textAnchor="middle"
             >
               {p.label}
             </SvgText>
           ) : null;
         })}

        {/* ── Invisible hover/touch zones per data point — MUST be last so they capture events ── */}
        {datos2.map((_, i) => {
          // Zone spans from midpoint to previous to midpoint to next point
          const x0 = i === 0 ? mg.l : (cx(i - 1) + cx(i)) / 2;
          const x1 = i === n - 1 ? mg.l + iW : (cx(i) + cx(i + 1)) / 2;
          return (
            <Rect
              key={`zone-${i}`}
              x={x0}
              y={mg.t}
              width={x1 - x0}
              height={iH + 4}
              fill="transparent"
              onPressIn={() => setTooltipIdx(i)}
              onPressOut={() => setTimeout(() => setTooltipIdx(-1), 1600)}
              {...(Platform.OS === 'web' ? {
                onMouseEnter: () => setTooltipIdx(i),
                onMouseLeave: () => setTooltipIdx(-1),
              } as any : {})}
            />
          );
        })}
      </Svg>
    </Animated.View>
  );
};

const MobileSignalDonut = ({ datos }: { datos: PuntoGrafico[] }) => {
  const ultimo = datos[datos.length - 1] || { label: '', rendimiento: 0, carga: 0, estres: 0 };
  const size = 210;
  const center = size / 2;
  const radius = 72;
  const stroke = 18;
  const circumference = 2 * Math.PI * radius;
  const values = [
    { key: 'rendimiento', label: 'Rendimiento', value: Math.max(0, Math.min(100, ultimo.rendimiento || 0)), color: BRAND.success },
    { key: 'carga', label: 'Carga', value: Math.max(0, Math.min(100, ultimo.carga || 0)), color: BRAND.warning },
    { key: 'estres', label: 'Estrés', value: Math.max(0, Math.min(100, ultimo.estres || 0)), color: BRAND.error },
  ];
  const total = values.reduce((sum, item) => sum + item.value, 0) || 1;
  let offset = 0;

  return (
    <View style={estilos.mobileDonutCard}>
      <View style={estilos.mobileDonutShell}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={center} cy={center} r={radius} stroke="rgba(124,58,237,0.10)" strokeWidth={stroke} fill="transparent" />
          {values.map((item) => {
            const length = (item.value / total) * circumference;
            const dashOffset = -offset;
            offset += length;
            return (
              <Circle
                key={item.key}
                cx={center}
                cy={center}
                r={radius}
                stroke={item.color}
                strokeWidth={stroke}
                fill="transparent"
                strokeDasharray={`${Math.max(1, length)} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${center}, ${center}`}
              />
            );
          })}
        </Svg>
        <View style={estilos.mobileDonutCenter}>
          <Text style={estilos.mobileDonutValue}>{ultimo.rendimiento || 0}%</Text>
          <Text style={estilos.mobileDonutLabel}>salud</Text>
        </View>
      </View>
      <View style={estilos.mobileDonutLegend}>
        {values.map((item) => (
          <View key={item.key} style={estilos.mobileDonutLegendItem}>
            <View style={[estilos.mobileDonutLegendDot, { backgroundColor: item.color }]} />
            <Text style={estilos.mobileDonutLegendText}>{item.label}</Text>
            <Text style={[estilos.mobileDonutLegendValue, { color: item.color }]}>{item.value}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * ChartSidePanel – unified compact panel showing period metrics + next events as a single table.
 */
const ChartSidePanel = ({
  datos,
  eventos,
  metricas,
  resumenPeriodo,
  modoGrafico
}: {
  datos: PuntoGrafico[];
  eventos: any[];
  metricas: any;
  resumenPeriodo: any;
  modoGrafico: ModoGrafico;
}) => {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const isPhone = width < 640;
  
  // Averages, Peaks, Min
  const n = datos.length || 1;
  const avgRendimiento = Math.round(datos.reduce((acc, d) => acc + d.rendimiento, 0) / n);
  const avgCarga = Math.round(datos.reduce((acc, d) => acc + d.carga, 0) / n);
  const avgEstres = Math.round(datos.reduce((acc, d) => acc + d.estres, 0) / n);

  const maxRendimiento = Math.max(...datos.map(d => d.rendimiento), 0);
  const maxCarga = Math.max(...datos.map(d => d.carga), 0);
  const maxEstres = Math.max(...datos.map(d => d.estres), 0);

  const actual = datos[datos.length - 1] || { label: t('admin.dashboard.chart.period'), rendimiento: 0, carga: 0, estres: 0 };
  const anterior = datos[datos.length - 2] || actual;

  const score = avgRendimiento - (avgEstres * 0.7) - (avgCarga * 0.3);
  let healthLabel = 'Estable';
  let healthColor = BRAND.success;
  if (score > 60) {
    healthLabel = 'Excelente';
    healthColor = BRAND.success;
  } else if (score < 30) {
    healthLabel = 'Atención';
    healthColor = BRAND.error;
  } else if (avgEstres > 50) {
    healthLabel = 'Estrés Alto';
    healthColor = BRAND.error;
  } else if (avgCarga > 75) {
    healthLabel = 'Carga Alta';
    healthColor = BRAND.warning;
  }

  const metrics = [
    {
      label: t('admin.dashboard.chart.performance'),
      actual: actual.rendimiento,
      prev: anterior.rendimiento,
      avg: avgRendimiento,
      max: maxRendimiento,
      color: BRAND.success,
      bg: 'rgba(16,185,129,0.04)'
    },
    {
      label: t('admin.dashboard.chart.load'),
      actual: actual.carga,
      prev: anterior.carga,
      avg: avgCarga,
      max: maxCarga,
      color: BRAND.warning,
      bg: 'rgba(245,158,11,0.04)'
    },
    {
      label: t('admin.dashboard.chart.stress'),
      actual: actual.estres,
      prev: anterior.estres,
      avg: avgEstres,
      max: maxEstres,
      color: BRAND.error,
      bg: 'rgba(239,68,68,0.04)'
    }
  ];

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const proximosEventos = useMemo(() =>
    (eventos || [])
      .filter((ev) => { const f = obtenerFecha(ev.inicio || ev.fechaInicio); return f && f >= hoy; })
      .sort((a, b) => (obtenerFecha(a.inicio || a.fechaInicio)?.getTime() || 0) - (obtenerFecha(b.inicio || b.fechaInicio)?.getTime() || 0))
      .slice(0, 2),
    [eventos]
  );

  const { theme } = useAdminAppearance();

  return (
      <View style={[estilos.sidePanel, isPhone && estilos.sidePanelPhone, { backgroundColor: theme.isDark ? ADMIN.fondoElevado : '#FFFFFF', borderColor: theme.isDark ? ADMIN.borde : 'rgba(91,65,150,0.16)' }]}>
      {/* Header section with Health Status */}
      <View style={[estilos.sidePanelHeader, isPhone && estilos.sidePanelHeaderPhone]}>
        <View style={{ flex: 1 }}>
          <Text style={estilos.sidePanelEyebrow}>{t('admin.dashboard.chart.period_detail')}</Text>
          <Text style={[estilos.sidePanelTitle, { marginBottom: 0 }]}>{actual.label}</Text>
        </View>
        <View style={[estilos.sidePanelBadge, { backgroundColor: healthColor + '12', borderColor: healthColor + '24' }]}>
          <View style={[estilos.sidePanelBadgeDot, { backgroundColor: healthColor }]} />
          <Text style={[estilos.sidePanelBadgeText, { color: healthColor }]}>{healthLabel}</Text>
        </View>
      </View>

      {/* Row containing the 3 metrics side by side */}
      <View style={[estilos.sideMetricsRow, isPhone && estilos.sideMetricsRowPhone]}>
        {metrics.map((m) => {
          const delta = m.actual - m.prev;
          const sign = delta > 0 ? '+' : '';
          return (
            <View key={m.label} style={[estilos.sideMetricCol, isPhone && estilos.sideMetricColPhone, { borderColor: m.color + '18', backgroundColor: m.bg }]}>
              {/* Metric title + dot */}
              <View style={estilos.sideMetricTitleContainer}>
                <View style={[estilos.sidePanelDot, { backgroundColor: m.color }]} />
                <Text style={estilos.sideMetricColLabel} numberOfLines={1}>{m.label}</Text>
              </View>
              {/* Current Value + delta */}
              <View style={[estilos.sideMetricValueContainer, isPhone && estilos.sideMetricValueContainerPhone]}>
                <Text style={[estilos.sideMetricColValue, { color: m.color }]}>{m.actual}%</Text>
                <Text style={[estilos.sideMetricColDelta, { color: delta > 0 ? BRAND.success : delta < 0 ? BRAND.error : BRAND.textSec }]}>
                  {delta === 0 ? '—' : `${sign}${delta}%`}
                </Text>
              </View>
              {/* Stats below */}
              <View style={[estilos.sideMetricStats, isPhone && estilos.sideMetricStatsPhone]}>
                <Text style={estilos.sideMetricStatText}>Prom: <Text style={{ color: BRAND.textMain }}>{m.avg}%</Text></Text>
                <Text style={estilos.sideMetricStatText}>Max: <Text style={{ color: BRAND.textMain }}>{m.max}%</Text></Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Divider */}
      <View style={estilos.sidePanelDivider} />

      {/* Bottom section with Advisor Insight & Agenda side-by-side */}
      <View style={[estilos.sidePanelBottomRow, isPhone && estilos.sidePanelBottomRowPhone]}>
        {/* Control de Jornada */}
        <View style={[estilos.sideAdvisorCol, isPhone && estilos.sideStackedColPhone]}>
          <Text style={estilos.sidePanelEyebrow}>Control de Jornada</Text>
          <View style={[estilos.sideAdvisorCard, isPhone && estilos.sideAdvisorCardPhone, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(91,65,150,0.03)', borderColor: theme.isDark ? ADMIN.borde : 'rgba(91,65,150,0.08)' }]}>
            <View style={{ gap: 5 }}>
              {/* Fila 1: Asistencia */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: BRAND.textMain, fontSize: 10.5, fontWeight: '700' }}>Asistencia</Text>
                  <Text style={{ color: BRAND.textSec, fontSize: 9 }}>
                    {modoGrafico === 'diario' ? 'Promedio: últimos 8 días' : modoGrafico === 'semanal' ? 'Promedio: últimas 8 sem.' : 'Promedio: últimos 8 mes.'}
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: 'rgba(16,185,129,0.08)'
                }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: BRAND.success }}>
                    {resumenPeriodo?.asistenciaPct ?? 0}%
                  </Text>
                </View>
              </View>

              {/* Fila 2: Tiempo Laborado */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', paddingTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: BRAND.textMain, fontSize: 10.5, fontWeight: '700' }}>Tiempo Laborado</Text>
                  <Text style={{ color: BRAND.textSec, fontSize: 9 }}>Total acumulado</Text>
                </View>
                <View style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: 'rgba(59,130,246,0.08)'
                }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#3B82F6' }}>
                    {resumenPeriodo?.tiempoTrabajado ?? '0h 0m'}
                  </Text>
                </View>
              </View>

              {/* Fila 3: Check-ins Hechos */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', paddingTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: BRAND.textMain, fontSize: 10.5, fontWeight: '700' }}>Check-ins Hechos</Text>
                  <Text style={{ color: BRAND.textSec, fontSize: 9 }}>
                    {modoGrafico === 'diario' ? 'Total: últimos 8 días' : modoGrafico === 'semanal' ? 'Total: últimas 8 sem.' : 'Total: últimos 8 mes.'}
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: 'rgba(16,185,129,0.08)'
                }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: BRAND.success }}>
                    {resumenPeriodo?.checkInsPeriodo ?? 0}
                  </Text>
                </View>
              </View>

              {/* Fila 4: Aprobaciones sin resolver */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', paddingTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: BRAND.textMain, fontSize: 10.5, fontWeight: '700' }}>Aprobaciones</Text>
                  <Text style={{ color: BRAND.textSec, fontSize: 9 }}>
                    {modoGrafico === 'diario' ? 'Pendientes: últimos 8 días' : modoGrafico === 'semanal' ? 'Pendientes: últimas 8 sem.' : 'Pendientes: últimos 8 mes.'}
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: (resumenPeriodo?.aprobacionesPendientes || 0) > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)'
                }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: (resumenPeriodo?.aprobacionesPendientes || 0) > 0 ? BRAND.error : BRAND.success }}>
                    {resumenPeriodo?.aprobacionesPendientes ?? 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Agenda column */}
        <View style={[estilos.sideAgendaCol, isPhone && estilos.sideStackedColPhone]}>
          <Text style={estilos.sidePanelEyebrow}>{t('admin.dashboard.chart.corporate_agenda')}</Text>
          <View style={{ gap: 6, marginTop: 4 }}>
            {proximosEventos.length > 0 ? (
              proximosEventos.map((ev) => {
                const fecha = obtenerFecha(ev.inicio || ev.fechaInicio);
                const dia = fecha ? fecha.getDate().toString().padStart(2, '0') : '--';
                const locale = i18n.language === 'es' ? 'es-SV' : 'en-US';
                const mes = fecha ? fecha.toLocaleDateString(locale, { month: 'short' }).substring(0, 3).toUpperCase().replace('.', '') : '---';
                return (
                  <View key={ev.id} style={estilos.sideEventRow}>
                    <View style={estilos.sideEventDate}>
                      <Text style={estilos.sideEventDay}>{dia}</Text>
                      <Text style={estilos.sideEventMonth}>{mes}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={estilos.sideEventName} numberOfLines={1}>{ev.titulo}</Text>
                      <Text style={estilos.sideEventDesc} numberOfLines={1}>{ev.descripcion || t('admin.dashboard.chart.no_description')}</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={[estilos.sideEventEmptyHorizontal, isPhone && estilos.sideEventEmptyHorizontalPhone, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(91,65,150,0.03)', borderColor: theme.isDark ? ADMIN.borde : 'rgba(91,65,150,0.08)' }]}>
                <Text style={estilos.sidePanelRowDelta}>{t('admin.dashboard.chart.no_events')}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

// Legacy aliases kept so old render references still compile (now replaced below)
const ChartEventsPanel = ({ eventos }: { eventos: any[] }) => null;
const ChartDetailPanel = ({ datos }: { datos: PuntoGrafico[] }) => null;

/*** Componente LegendItem. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const LegendItem = ({ color, label, value }: { color: string; label: string; value: string }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={estilos.legendChartItem}>
    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
    <View style={[estilos.legendChartDot, { backgroundColor: color }]} />
    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
    <Text style={estilos.legendChartLabel}>{label}</Text>
    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
    <Text style={[estilos.legendChartValue, { color }]}>{value}</Text>
  </View>
);

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // animatedScreen: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  animatedScreen: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: BRAND.richBlack,
  },
  // scrollView: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  scrollView: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: BRAND.richBlack,
  },
  // estadoCarga: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  estadoCarga: {
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // scrollViewContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  scrollViewContent: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 20,
    // paddingTop separa el contenido del borde superior.
    paddingTop: 260,
    // paddingBottom separa el contenido del borde inferior.
    paddingBottom: 64,
  },
  // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  header: {
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 16,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-end',
  },
  // headerTitle: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerTitle: {
    // fontSize controla el tamanio del texto.
    fontSize: 28,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // headerSubtitle: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerSubtitle: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontWeight define el peso visual del texto.
    fontWeight: '600',
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // livePill: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  livePill: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 8,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
  },
  // liveDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  liveDot: {
    // width fija o calcula el ancho del elemento.
    width: 9,
    // height fija o calcula el alto del elemento.
    height: 9,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 9,
    // backgroundColor define el fondo del bloque.
    backgroundColor: BRAND.success,
  },
  // liveText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  liveText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // premiumCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  premiumCard: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 14,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...sombraAdmin,
  },
  // iconWrapperBase: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconWrapperBase: {
    // width fija o calcula el ancho del elemento.
    width: 36,
    // height fija o calcula el alto del elemento.
    height: 36,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
  },
  // iconWrapper_blue: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconWrapper_blue: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(96,165,250,0.1)',
    // borderColor define el color del borde.
    borderColor: 'rgba(96,165,250,0.2)',
  },
  // iconWrapper_success: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconWrapper_success: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(34,197,94,0.1)',
    // borderColor define el color del borde.
    borderColor: 'rgba(34,197,94,0.22)',
  },
  // iconWrapper_warning: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconWrapper_warning: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(245,158,11,0.11)',
    // borderColor define el color del borde.
    borderColor: 'rgba(245,158,11,0.24)',
  },
  // iconWrapper_error: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconWrapper_error: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(239,68,68,0.1)',
    // borderColor define el color del borde.
    borderColor: 'rgba(239,68,68,0.24)',
  },
  // iconWrapper_violet: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconWrapper_violet: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(167,139,250,0.1)',
    // borderColor define el color del borde.
    borderColor: 'rgba(167,139,250,0.24)',
  },
  // iconWrapper_cyan: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconWrapper_cyan: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(34,211,238,0.1)',
    // borderColor define el color del borde.
    borderColor: 'rgba(34,211,238,0.24)',
  },
  // statsGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  statsGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 18,
  },
  // statsGridMobile: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  statsGridMobile: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
  },
  // statCardContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  statCardContainer: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 106,
  },
  // statCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  statCard: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 100,
    // position define como se posiciona el elemento respecto al layout.
    position: 'relative',
  },
  // statAccent: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statAccent: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 0,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 0,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: 0,
    // width fija o calcula el ancho del elemento.
    width: 4,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(196,181,253,0.42)',
  },
  // statCardInner: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  statCardInner: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
  },
  // statTextContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  statTextContainer: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
  },
  // statLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  statLabel: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.4,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 10,
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 13,
  },
  // statValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 26,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 8,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.6,
  },
  // trendContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  trendContainer: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 6,
  },
  // trendText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  trendText: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // topGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  topGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 18,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 18,
  },
  // detalleOperativoBar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  detalleOperativoBar: {
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 18,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrio,
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
  },
  detalleOperativoBarPhone: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 14,
    gap: 12,
  },
  detalleOperativoCopyPhone: {
    width: '100%',
    minWidth: 0,
  },
  // detalleOperativoTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  detalleOperativoTitulo: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // detalleOperativoTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  detalleOperativoTexto: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // detalleOperativoBoton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  detalleOperativoBoton: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 9,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(168,85,247,0.44)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124,58,237,0.18)',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 14,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
  },
  detalleOperativoBotonPhone: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  // detalleOperativoBotonTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  detalleOperativoBotonTexto: {
    // color define el color del texto o icono.
    color: BRAND.iconBright,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // detalleOperativoContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
  detalleOperativoContenido: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // advancedGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  advancedGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'column',
    alignItems: 'stretch',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 10,
  },
  // advancedGridCompact: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  advancedGridCompact: {
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'nowrap',
  },
  // advancedCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  advancedCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 260,
    // padding agrega espacio interno alrededor del contenido.
    padding: 14,
  },
  advancedCardFullWidth: {
    width: '100%',
    alignSelf: 'stretch',
    flexBasis: 'auto' as any,
    minWidth: 0,
    flexGrow: 0,
    flexShrink: 0,
    padding: 14,
  },
  checkInMetricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  checkInMetricItem: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
    padding: 10,
  },
  // topGridMobile: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  topGridMobile: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'column',
  },
  // anchoTotal: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  anchoTotal: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
  },
  // columnaPrincipal: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  columnaPrincipal: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1.65,
  },
  // columnaLateral: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  columnaLateral: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 0.95,
  },
  // barChartCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  barChartCard: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 18,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 430,
  },
  barChartCardPhone: {
    padding: 14,
    minHeight: 0,
  },
  // chartHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  chartHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 18,
  },
  chartHeaderPhone: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
    marginBottom: 14,
  },
  // chartInsightRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartInsightRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 14,
  },
  // chartInsightCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  chartInsightCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 74,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // padding agrega espacio interno alrededor del contenido.
    padding: 13,
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
  },
  // chartInsightLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  chartInsightLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontFamily ajusta una propiedad visual especifica de este estilo.
    fontFamily: CHART_FONT,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // chartInsightValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartInsightValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 22,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontFamily ajusta una propiedad visual especifica de este estilo.
    fontFamily: CHART_FONT,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // chartBody: side-by-side chart + panel
  chartBody: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'stretch',
  },
  chartBodyPhone: {
    gap: 12,
  },
  // chartGraphArea: chart takes most of the width
  chartGraphArea: {
    flex: 1,
    minWidth: 200,
  },
  chartGraphAreaPhone: {
    minWidth: 0,
  },
  mobileDonutCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
    padding: 14,
    alignItems: 'center',
    gap: 12,
  },
  mobileDonutShell: {
    width: 210,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileDonutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileDonutValue: {
    color: BRAND.textMain,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
  },
  mobileDonutLabel: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mobileDonutLegend: {
    width: '100%',
    gap: 8,
  },
  mobileDonutLegendItem: {
    minHeight: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    gap: 9,
  },
  mobileDonutLegendDot: {
    width: 9,
    height: 9,
    borderRadius: 99,
  },
  mobileDonutLegendText: {
    flex: 1,
    minWidth: 0,
    color: BRAND.textSec,
    fontSize: 11,
    fontWeight: '900',
  },
  mobileDonutLegendValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  // sidePanel: unified events + metrics side panel
  sidePanel: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
    overflow: 'hidden',
  },
  sidePanelPhone: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto' as any,
    overflow: 'visible',
    paddingBottom: 14,
  },
  sidePanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sidePanelHeaderPhone: {
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingTop: 14,
    gap: 10,
  },
  sidePanelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sidePanelBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  sidePanelBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sideMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sideMetricsRowPhone: {
    flexDirection: 'column',
    gap: 8,
    paddingHorizontal: 14,
  },
  sideMetricCol: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    justifyContent: 'space-between',
  },
  sideMetricColPhone: {
    minHeight: 64,
    padding: 10,
  },
  sideMetricTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sideMetricColLabel: {
    color: BRAND.textSec,
    fontSize: 11,
    fontWeight: '800',
  },
  sideMetricValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sideMetricValueContainerPhone: {
    marginTop: 6,
  },
  sideMetricColValue: {
    fontSize: 17,
    fontWeight: '900',
  },
  sideMetricColDelta: {
    fontSize: 11,
    fontWeight: '800',
  },
  sideMetricStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: 4,
  },
  sideMetricStatsPhone: {
    justifyContent: 'flex-start',
    gap: 16,
  },
  sideMetricStatText: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '600',
  },
  sidePanelBottomRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flex: 1,
  },
  sidePanelBottomRowPhone: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto' as any,
  },
  sideAdvisorCol: {
    flex: 1.1,
  },
  sideStackedColPhone: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto' as any,
    width: '100%',
    minWidth: 0,
  },
  sideAdvisorCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    flex: 1,
    justifyContent: 'center',
  },
  sideAdvisorCardPhone: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto' as any,
    width: '100%',
    minHeight: 0,
    padding: 12,
    marginTop: 8,
  },
  sideAdvisorText: {
    color: BRAND.textMain,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  sideAgendaCol: {
    flex: 1.3,
  },
  sideEventEmptyHorizontal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 8,
    paddingVertical: 14,
  },
  sideEventEmptyHorizontalPhone: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto' as any,
    width: '100%',
    minHeight: 72,
    marginTop: 8,
    paddingHorizontal: 12,
  },
  sidePanelSection: {
    padding: 12,
  },
  sidePanelDivider: {
    height: 1,
    backgroundColor: ADMIN.borde,
    marginHorizontal: 12,
  },
  sidePanelEyebrow: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900' as const,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },
  sidePanelTitle: {
    color: BRAND.textMain,
    fontSize: 15.5,
    fontWeight: '900' as const,
    marginTop: 2,
    marginBottom: 8,
  },
  sidePanelTable: {
    gap: 4,
  },
  sidePanelTableRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  sidePanelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sidePanelRowLabel: {
    flex: 1,
    color: BRAND.textMain,
    fontSize: 10,
    fontWeight: '700' as const,
    minWidth: 0,
  },
  sidePanelRowDelta: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '600' as const,
  },
  sidePanelRowValue: {
    fontSize: 11,
    fontWeight: '900' as const,
    minWidth: 32,
    textAlign: 'right' as const,
  },
  sideEventRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 6,
  },
  sideEventDate: {
    width: 30,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.2)',
    borderRadius: 6,
    paddingVertical: 3,
  },
  sideEventDay: {
    color: BRAND.violet,
    fontSize: 15,
    fontWeight: '900' as const,
    lineHeight: 15,
  },
  sideEventMonth: {
    color: BRAND.violet,
    fontSize: 8.5,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  sideEventName: {
    color: BRAND.textMain,
    fontSize: 12,
    fontWeight: '800' as const,
  },
  sideEventDesc: {
    color: BRAND.textSec,
    fontSize: 10.5,
    marginTop: 1,
  },
  sideEventEmpty: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    opacity: 0.6,
    paddingVertical: 6,
  },
  // chartDetailPanel: kept for legacy (unused now)
  chartDetailPanel: {
    display: 'none' as any,
  },
  chartDetailEyebrow: {
    display: 'none' as any,
  },
  chartDetailTitle: {
    display: 'none' as any,
  },
  // chartDetailRows: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartDetailRows: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // chartDetailRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartDetailRow: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 58,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrio,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 10,
  },
  // chartDetailDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartDetailDot: {
    // width fija o calcula el ancho del elemento.
    width: 9,
    // height fija o calcula el alto del elemento.
    height: 9,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
  },
  // chartDetailCopy: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartDetailCopy: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // chartDetailLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  chartDetailLabel: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // chartDetailDelta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartDetailDelta: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // chartEventsSection: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventsSection: {
    // marginTop separa este bloque del elemento anterior.
    marginTop: 18,
    // borderTopWidth ajusta una propiedad visual especifica de este estilo.
    borderTopWidth: 1,
    // borderTopColor ajusta una propiedad visual especifica de este estilo.
    borderTopColor: ADMIN.borde,
    // paddingTop separa el contenido del borde superior.
    paddingTop: 16,
  },
  // chartEventsHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  chartEventsHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 12,
  },
  // chartEventsTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  chartEventsTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.4,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // chartEventsList: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventsList: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // chartEventRowBig: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventRowBig: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrio,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // padding agrega espacio interno alrededor del contenido.
    padding: 10,
  },
  // chartEventDateBoxBig: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventDateBoxBig: {
    // width fija o calcula el ancho del elemento.
    width: 44,
    // height fija o calcula el alto del elemento.
    height: 44,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 8,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(168,85,247,0.3)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124,58,237,0.08)',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // chartEventDateDayBig: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventDateDayBig: {
    // color define el color del texto o icono.
    color: BRAND.violet,
    // fontSize controla el tamanio del texto.
    fontSize: 16,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 16,
  },
  // chartEventDateMonthBig: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventDateMonthBig: {
    // color define el color del texto o icono.
    color: BRAND.violet,
    // fontSize controla el tamanio del texto.
    fontSize: 8,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.5,
  },
  // chartEventInfo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventInfo: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // chartEventNameBig: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventNameBig: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // chartEventTimeBig: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventTimeBig: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 2,
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 13,
  },
  // chartEventMetaBig: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventMetaBig: {
    // color define el color del texto o icono.
    color: BRAND.violet,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.5,
  },
  // chartEventsEmptyBoxBig: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  chartEventsEmptyBoxBig: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 180,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderStyle ajusta una propiedad visual especifica de este estilo.
    borderStyle: 'dashed',
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
  },
  // chartEventsEmpty: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  chartEventsEmpty: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
  },
  // chartDetailValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartDetailValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 18,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // chartTitleContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  chartTitleContainer: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
  },
  chartTitleContainerPhone: {
    gap: 10,
    alignItems: 'flex-start',
  },
  // chartTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  chartTitle: {
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  chartTitlePhone: {
    fontSize: 13,
    lineHeight: 17,
  },
  // chartSubtitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  chartSubtitle: {
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  chartSubtitlePhone: {
    fontSize: 9,
    lineHeight: 13,
  },
  // kpiInline: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  kpiInline: {
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-end',
  },
  // kpiInlineValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  kpiInlineValue: {
    // color define el color del texto o icono.
    color: BRAND.success,
    // fontSize controla el tamanio del texto.
    fontSize: 26,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // kpiInlineLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  kpiInlineLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 2,
  },
  // chartActions: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartActions: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // padding agrega espacio interno alrededor del contenido.
    padding: 4,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
  },
  chartActionsPhone: {
    width: '100%',
    gap: 6,
    justifyContent: 'space-between',
  },
  // chartToggle: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartToggle: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 8,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
  },
  chartTogglePhone: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  // chartToggleActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartToggleActivo: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124,58,237,0.22)',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(168,85,247,0.34)',
  },
  // chartToggleText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartToggleText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontFamily ajusta una propiedad visual especifica de este estilo.
    fontFamily: CHART_FONT,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.4,
  },
  // chartToggleTextActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartToggleTextActivo: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
  },
  // lineChartShell: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  lineChartShell: {
    // height fija o calcula el alto del elemento.
    height: 330,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrio,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // paddingBottom agrega espacio interno en la parte inferior.
    paddingBottom: 2,
  },
  // chartLegendRow: fila de leyenda del grafico avanzado.
  chartLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexWrap: 'wrap',
  },
  // chartLegendPill: pastilla individual de leyenda.
  chartLegendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
  },
  // chartLegendDot: punto de color de la leyenda.
  chartLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  // chartLegendText: texto de la leyenda.
  chartLegendText: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // chartLegendHint: texto de ayuda de interaccion.
  chartLegendHint: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '500',
    opacity: 0.55,
    marginLeft: 4,
  },
  // chartTooltip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartTooltip: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 14,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 14,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.bordeFuerte,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrioFuerte,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 8,
  },
  // chartTooltipLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  chartTooltipLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontFamily ajusta una propiedad visual especifica de este estilo.
    fontFamily: CHART_FONT,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 4,
  },
  // chartTooltipValues: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartTooltipValues: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // chartTooltipValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartTooltipValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontFamily ajusta una propiedad visual especifica de este estilo.
    fontFamily: CHART_FONT,
  },
  // chartLegend: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartLegend: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 18,
  },
  // legendChartItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  legendChartItem: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 9,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 14,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
  },
  // legendChartDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  legendChartDot: {
    // width fija o calcula el ancho del elemento.
    width: 9,
    // height fija o calcula el alto del elemento.
    height: 9,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
  },
  // legendChartLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  legendChartLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontFamily ajusta una propiedad visual especifica de este estilo.
    fontFamily: CHART_FONT,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.1,
  },
  // legendChartValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  legendChartValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontFamily ajusta una propiedad visual especifica de este estilo.
    fontFamily: CHART_FONT,
  },
  // barChartArea: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  barChartArea: {
    // height fija o calcula el alto del elemento.
    height: 250,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-end',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 10,
  },
  // barWrapper: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  barWrapper: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // height fija o calcula el alto del elemento.
    height: '100%',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'flex-end',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 7,
  },
  // barLabelBox: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  barLabelBox: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#FFF',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 9,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 5,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 10,
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 4 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.18,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 10,
    // elevation agrega sombra en Android.
    elevation: 4,
  },
  // barLabelText: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  barLabelText: {
    // color define el color del texto o icono.
    color: BRAND.richBlack,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // barTrack: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  barTrack: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 46,
    // height fija o calcula el alto del elemento.
    height: 170,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.035)',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'flex-end',
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(196,181,253,0.10)',
  },
  // bar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bar: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // position define como se posiciona el elemento respecto al layout.
    position: 'relative',
  },
  // barMonthLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  barMonthLabel: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.5,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 13,
  },
  // barTinyLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  barTinyLabel: {
    // fontSize controla el tamanio del texto.
    fontSize: 8,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: 'rgba(148,163,184,0.65)',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // moodCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  moodCard: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 18,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 340,
  },
  // priorityCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  priorityCard: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 18,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 340,
  },
  // moodCircleContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  moodCircleContainer: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'relative',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 12,
  },
  // moodCircleTextContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  moodCircleTextContainer: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 0,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 0,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 0,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: 0,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // moodCircleValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  moodCircleValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 38,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.5,
  },
  // moodCircleLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  moodCircleLabel: {
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 3,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // moodLegendContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  moodLegendContainer: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 18,
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // legendItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  legendItem: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.025)',
    // padding agrega espacio interno alrededor del contenido.
    padding: 12,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(196,181,253,0.12)',
  },
  // legendLabelContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  legendLabelContainer: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // legendDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  legendDot: {
    // width fija o calcula el ancho del elemento.
    width: 10,
    // height fija o calcula el alto del elemento.
    height: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 5,
  },
  // legendText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  legendText: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
  },
  // legendValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  legendValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textMain,
  },
  // monitorGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  monitorGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 18,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 18,
  },
  // panelCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  panelCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 320,
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
  },
  // panelHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  panelHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 14,
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
  },
  // panelTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  panelTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // panelSubtitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  panelSubtitle: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // metricRows: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricRows: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 13,
  },
  // metricRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricRow: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // metricRowTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricRowTop: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // metricRowLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  metricRowLabel: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // metricLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  metricLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.1,
  },
  // metricValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricValue: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 15,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // progressTrack: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  progressTrack: {
    // height fija o calcula el alto del elemento.
    height: 8,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  // progressFill: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  progressFill: {
    // height fija o calcula el alto del elemento.
    height: '100%',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
  },
  // alertGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  alertGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // miniKpi: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  miniKpi: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 112,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // padding agrega espacio interno alrededor del contenido.
    padding: 12,
  },
  // miniKpiValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  miniKpiValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 26,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 8,
  },
  // miniKpiLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  miniKpiLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // bottomGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  bottomGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 14,
  },
  // listCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  listCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 320,
  },
  // listado: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  listado: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // listadoCompacto: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  listadoCompacto: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 12,
  },
  // listItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  listItem: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // padding agrega espacio interno alrededor del contenido.
    padding: 12,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
  },
  // listAvatar: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  listAvatar: {
    // width fija o calcula el ancho del elemento.
    width: 40,
    // height fija o calcula el alto del elemento.
    height: 40,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 14,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.035)',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // listAvatarText: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  listAvatarText: {
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // listInfo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  listInfo: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // listTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  listTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // listDetail: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  listDetail: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // listBadge: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  listBadge: {
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 10,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 6,
  },
  // listBadgeText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  listBadgeText: {
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
  },
  // approvalItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  approvalItem: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // padding agrega espacio interno alrededor del contenido.
    padding: 12,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
  },
  // approvalInfo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  approvalInfo: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // approvalActions: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  approvalActions: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // approvalButton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  approvalButton: {
    // width fija o calcula el ancho del elemento.
    width: 34,
    // height fija o calcula el alto del elemento.
    height: 34,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
  },
  // approvalButtonSuccess: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  approvalButtonSuccess: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(34,197,94,0.1)',
    // borderColor define el color del borde.
    borderColor: 'rgba(34,197,94,0.24)',
  },
  // approvalButtonError: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  approvalButtonError: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(239,68,68,0.1)',
    // borderColor define el color del borde.
    borderColor: 'rgba(239,68,68,0.24)',
  },
  // departmentRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  departmentRow: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // padding agrega espacio interno alrededor del contenido.
    padding: 12,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
  },
  // departmentTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  departmentTop: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // departmentName: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  departmentName: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // departmentValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  departmentValue: {
    // color define el color del texto o icono.
    color: BRAND.violet,
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // emptyState: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyState: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 68,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
  },
  // emptyText: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.3,
  },
  // activityCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  activityCard: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
  },
  // timeline: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  timeline: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // timelineItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  timelineItem: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
    // padding agrega espacio interno alrededor del contenido.
    padding: 14,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
  },
  // timelineDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  timelineDot: {
    // width fija o calcula el ancho del elemento.
    width: 10,
    // height fija o calcula el alto del elemento.
    height: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
  },
  // timelineContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  timelineContent: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // timelineTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  timelineTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // timelineMeta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  timelineMeta: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // timelineEstado: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  timelineEstado: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
  },
  // heroPanel: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroPanel: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 320,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 20,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 18,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrio,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 38,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 32,
    // gap define separacion uniforme entre elementos hijos.
    gap: 300,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...sombraVioleta,
  },
  heroPanelMobile: {
    minHeight: 0,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 18,
  },
  heroPanelPhone: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 12,
    marginBottom: 14,
  },

  // heroCopy: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroCopy: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1.4,
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 800,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 360,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 2,
    // paddingRight ajusta una propiedad visual especifica de este estilo.
    paddingRight: 8,
  },
  heroCopyMobile: {
    flex: 0,
    maxWidth: '100%',
    minWidth: 0,
    paddingRight: 0,
  },
  // heroKicker: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroKicker: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 12,
  },
  // heroKickerDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroKickerDot: {
    // width fija o calcula el ancho del elemento.
    width: 8,
    // height fija o calcula el alto del elemento.
    height: 8,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#C084FC',
    // shadowColor define el color base de sombra.
    shadowColor: '#C084FC',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 0 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.9,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 20,
  },
  // heroEyebrow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroEyebrow: {
    // color define el color del texto o icono.
    color: BRAND.violet,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.8,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // heroTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  heroTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 40,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.8,
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 48,
    // fontStyle ajusta una propiedad visual especifica de este estilo.
    fontStyle: 'italic',
  },
  heroTitleMobile: {
    fontSize: 28,
    lineHeight: 34,
  },
  heroTitlePhone: {
    fontSize: 24,
    lineHeight: 29,
    fontStyle: 'normal',
  },
  heroSubtitlePhone: {
    color: BRAND.textSec,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 8,
  },
  // heroText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 24,
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 560,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 12,
  },
  // heroActions: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroActions: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 20,
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
  },
  heroActionsMobile: {
    alignItems: 'stretch',
  },
  heroActionsPhone: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
    marginTop: 14,
  },
  // heroButtonGlow: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  heroButtonGlow: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // padding agrega espacio interno alrededor del contenido.
    padding: 1,
    // shadowColor define el color base de sombra.
    shadowColor: '#7C3AED',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 18 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.26,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 34,
  },
  // heroButton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  heroButton: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 20,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 13,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(13,9,27,0.92)',
  },
  // heroButtonText: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  heroButtonText: {
    // color define el color del texto o icono.
    color: '#FFFFFF',
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // heroMetricPill: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroMetricPill: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 120,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 14,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 12,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 14,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.02)',
    // borderColor define el color del borde.
    borderColor: 'rgba(255,255,255,0.06)',
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  heroMetricPillPhone: {
    flexBasis: 'auto' as any,
    minWidth: 0,
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
  },
  // heroMetricPillBlue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroMetricPillBlue: {
    // borderColor define el color del borde.
    borderColor: 'rgba(59,130,246,0.18)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(59,130,246,0.03)',
  },
  // heroMetricPillViolet: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroMetricPillViolet: {
    // borderColor define el color del borde.
    borderColor: 'rgba(168,85,247,0.18)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(168,85,247,0.03)',
  },
  // heroMetricPillEmerald: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroMetricPillEmerald: {
    // borderColor define el color del borde.
    borderColor: 'rgba(16,185,129,0.18)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(16,185,129,0.03)',
  },
  // heroMetricHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  heroMetricHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 8,
  },
  // heroMetricIconBg: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  heroMetricIconBg: {
    // width fija o calcula el ancho del elemento.
    width: 22,
    // height fija o calcula el alto del elemento.
    height: 22,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // heroMetricLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  heroMetricLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.8,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // heroMetricBody: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroMetricBody: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-end',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
  },
  // heroMetricValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroMetricValue: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 24,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 28,
  },
  // heroMetricTrend: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroMetricTrend: {
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.2,
  },
  // heroDashboardShell: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroDashboardShell: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 0.75,
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 420,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 340,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 16,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrioFuerte,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 2,
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 28 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.18,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 54,
  },
  heroDashboardShellMobile: {
    flex: 0,
    maxWidth: '100%',
    minWidth: 0,
    width: '100%',
  },
  heroDashboardShellPhone: {
    display: 'none',
    borderRadius: 14,
    shadowOpacity: 0,
  },
  // heroWindowBar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroWindowBar: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 38,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 16,
    // borderBottomWidth ajusta una propiedad visual especifica de este estilo.
    borderBottomWidth: 1,
    // borderBottomColor ajusta una propiedad visual especifica de este estilo.
    borderBottomColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrio,
  },
  // heroWindowDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroWindowDot: {
    // width fija o calcula el ancho del elemento.
    width: 10,
    // height fija o calcula el alto del elemento.
    height: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
  },
  // heroWindowTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  heroWindowTitle: {
    // marginLeft ajusta una propiedad visual especifica de este estilo.
    marginLeft: 'auto',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
  },
  // heroDashboardGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  heroDashboardGrid: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 14,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  heroDashboardGridPhone: {
    padding: 10,
    gap: 8,
  },
  // heroPanelCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  heroPanelCard: {
    // width fija o calcula el ancho del elemento.
    width: '48.4%',
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 76,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrioFuerte,
    // padding agrega espacio interno alrededor del contenido.
    padding: 13,
  },
  heroPanelCardPhone: {
    width: '48%',
    minHeight: 86,
    padding: 11,
  },
  // heroPanelMain: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroPanelMain: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 138,
    // paddingRight ajusta una propiedad visual especifica de este estilo.
    paddingRight: 178,
  },
  heroPanelMainPhone: {
    minHeight: 0,
    paddingRight: 12,
    paddingVertical: 14,
  },
  // heroPanelMainCopy: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroPanelMainCopy: {
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 178,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 2,
  },
  heroPanelMainCopyPhone: {
    maxWidth: '100%',
  },
  // heroPanelLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  heroPanelLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
  },
  // heroPanelValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroPanelValue: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 34,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // heroPanelStrong: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroPanelStrong: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 17,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 8,
  },
  // heroPanelText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroPanelText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 6,
  },
  // heroChart: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroChart: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 16,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: 16,
    // height fija o calcula el alto del elemento.
    height: 96,
    // width fija o calcula el ancho del elemento.
    width: 154,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-end',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // heroChartBar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroChartBar: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#C084FC',
    // shadowColor define el color base de sombra.
    shadowColor: '#C084FC',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 0 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.26,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 14,
  },
  // heroPanelTable: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroPanelTable: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // gap define separacion uniforme entre elementos hijos.
    gap: 9,
  },
  // heroTableRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroTableRow: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 28,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.055)',
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 10,
  },
  // heroTableText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroTableText: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
  },
  // heroTableStatus: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroTableStatus: {
    // width fija o calcula el ancho del elemento.
    width: 42,
    // height fija o calcula el alto del elemento.
    height: 5,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#A855F7',
  },
  // approvalInfoContainer: clickable container inside the item
  approvalInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  // approvalLeftContainer: layout container
  approvalLeftContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  // approvalIconWrapper: rounded container for the type icon
  approvalIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // approvalTitleRow: row layout for title and priority badge
  approvalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  // priorityBadge: small colored badge
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  // priorityBadgeText: small bold text
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  // modalOverlay: blurred/dimmed backdrop container
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  // modalCard: main dialog container
  modalCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '85%',
    borderRadius: ADMIN.radio,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    overflow: 'hidden',
  },
  // modalHeader: modal top section
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // modalTitle: modal heading text
  modalTitle: {
    color: BRAND.textMain,
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.4,
  },
  // modalSubtitle: secondary description text
  modalSubtitle: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 3,
  },
  // modalClose: close button
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // modalBody: scrollable section
  modalBody: {
    padding: 20,
  },
  // modalContentContainer: layout wrapper for modal body
  modalContentContainer: {
    gap: 20,
    paddingBottom: 20,
  },
  // employeeCard: premium card showing requester profile info
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  // employeeAvatar: avatar wrapper
  employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // employeeAvatarText: bold large initial
  employeeAvatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#A855F7',
  },
  // employeeInfo: labels
  employeeInfo: {
    flex: 1,
  },
  // employeeName: requester name text
  employeeName: {
    fontSize: 16,
    fontWeight: '800',
    color: BRAND.textMain,
  },
  // employeeLabel: subtitle
  employeeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: BRAND.textSec,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 1,
  },
  // detailsGrid: two column layout for details
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  // detailsGridCol: individual column item
  detailsGridCol: {
    width: '47%',
    minWidth: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 10,
    padding: 10,
  },
  // detailsLabel: field title
  detailsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: BRAND.textSec,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  // detailsValue: field value text
  detailsValue: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.textMain,
  },
  // reasonSection: container for reason description
  reasonSection: {
    gap: 8,
  },
  // sectionTitle: section header
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: BRAND.textSec,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  // reasonCard: highlighted card for the reason details
  reasonCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: '#A855F7',
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 8,
    padding: 14,
  },
  // reasonText: reason message content
  reasonText: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.textMain,
  },
  // extraInfoRow: inline icon and message row
  extraInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 10,
    padding: 12,
  },
  // extraInfoText: description text
  extraInfoText: {
    fontSize: 12,
    color: BRAND.textMain,
    flex: 1,
  },
  // modalFooter: footer controls panel
  modalFooter: {
    padding: 16,
    backgroundColor: ADMIN.fondoCampo,
    borderTopWidth: 1,
    borderTopColor: ADMIN.borde,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  // footerButton: action buttons in footer
  footerButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  // footerButtonSecondary: secondary style button
  footerButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ADMIN.borde,
  },
  // footerButtonError: action style button for reject
  footerButtonError: {
    backgroundColor: '#EF4444',
  },
  // footerButtonSuccess: action style button for approve
  footerButtonSuccess: {
    backgroundColor: '#10B981',
  },
  // footerButtonTextSecondary: text inside secondary button
  footerButtonTextSecondary: {
    color: BRAND.textSec,
    fontSize: 12,
    fontWeight: '800',
  },
  // footerButtonTextPrimary: text inside primary action buttons
  footerButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  // employeeAvatarImage: profile photo inside the modal detail card
  employeeAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  // approvalAvatarImage: profile photo inside each approval list item
  approvalAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
});
