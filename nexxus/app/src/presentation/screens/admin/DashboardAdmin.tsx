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
import { Animated, Easing, View, Text as NativeText, ScrollView, Dimensions, StyleSheet, ActivityIndicator, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
// Importa Svg, { Circle, Defs, Line, LinearGradient as SvgLinearGradient, Path, Stop, Text as SvgText } desde react-native-svg; agrega una dependencia externa necesaria para este modulo.
import Svg, { Circle, Defs, Line, LinearGradient as SvgLinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
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
 * Componente PARTICULAS_HERO. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const PARTICULAS_HERO = [
  // Orbe Azul Izquierda (Detrás del Título)
  { left: '-5%', top: '-8%', size: 240, color: 'rgba(37, 99, 235, 0.16)' },
  // Orbe Morado Centro-Izquierda (Detrás de Métricas)
  { left: '18%', top: '48%', size: 280, color: 'rgba(168, 85, 247, 0.15)' },
  // Orbe Azul Centro-Derecha
  { left: '42%', top: '-2%', size: 220, color: 'rgba(37, 99, 235, 0.12)' },
  // Orbe Morado Extremo Derecho (Fondo general)
  { left: '65%', top: '38%', size: 260, color: 'rgba(168, 85, 247, 0.14)' },
] as const;

/**
 * Componente CampoParticulasHero. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function CampoParticulasHero() {
  // Inicializa avance; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const avance = useRef(new Animated.Value(0)).current;

  // Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
  useEffect(() => {
    // Declara animacion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const animacion = Animated.loop(
      Animated.timing(avance, {
        toValue: 1,
        duration: 22000, // Movimiento ultra lento y majestuoso
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    animacion.start();
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => animacion.stop();
  }, [avance]);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PARTICULAS_HERO.map((particula, index) => {
        // Declara translateX; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const translateX = avance.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, index % 2 === 0 ? 38 : -38, 0],
        });
        // Declara translateY; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const translateY = avance.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, index % 2 === 0 ? -22 : 22, 0],
        });
        // Declara opacity; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const opacity = avance.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.7, 0.95, 0.7],
        });

        // Devuelve el JSX que React Native renderiza en pantalla.
        return (
          // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
          <Animated.View
            key={index}
            style={{
              position: 'absolute',
              left: particula.left,
              top: particula.top,
              width: particula.size,
              height: particula.size,
              borderRadius: particula.size / 2,
              opacity,
              backgroundColor: particula.color,
              shadowColor: particula.color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.95,
              shadowRadius: 50, // Gran radio para difuminar como orbe suave
              transform: [{ translateX }, { translateY }],
            }}
          />
        );
      })}
    </View>
  );
}

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
  // Inicializa entrada; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const entrada = useRef(new Animated.Value(0)).current;
  // Inicializa brilloAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const brilloAnim = useRef(new Animated.Value(0)).current;

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

  // Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
  useEffect(() => {
    // Declara anim; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const anim = Animated.loop(
      Animated.timing(brilloAnim, {
        toValue: 1,
        duration: 24000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    anim.start();
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => anim.stop();
  }, [brilloAnim]);

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

    // Declara cargadas; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const cargadas = new Set<string>();
    // Declara marcarCargada; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const marcarCargada = (clave: string) => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      cargadas.add(clave);
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (cargadas.size >= 12) setCargando(false);
    };

    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setCargando(true);

    // Calcula crearListener; transforma la lista original en datos listos para renderizar o guardar.
    const crearListener = <T,>(clave: string, coleccion: string, actualizar: (datos: T[]) => void) => onSnapshot(
      query(collection(db, coleccion), where('empresaId', '==', empresaId)),
      (snapshot) => {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        actualizar(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T));
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        marcarCargada(clave);
      },
      () => {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        actualizar([]);
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        marcarCargada(clave);
      }
    );

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
    return () => consultas.forEach((unsubscribe) => unsubscribe());
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
      // Declara rendimientoPeriodo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const rendimientoPeriodo = tareasPeriodo.length > 0
        ? porcentaje(completadasPeriodo, tareasPeriodo.length)
        : esUltimoPeriodo
          ? productividad
          : 0;
      // Calcula cargaPeriodo; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
      const cargaPeriodo = checkInsPeriodo.length > 0
        ? Math.round((checkInsPeriodo.reduce((total, checkIn) => total + valorEscalaCinco(checkIn.cargaLaboral), 0) / checkInsPeriodo.length / 5) * 100)
        : esUltimoPeriodo
          ? Math.round((cargaPromedio / 5) * 100)
          : 0;
      // Calcula estresPeriodo; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
      const estresPeriodo = checkInsPeriodo.length > 0
        ? Math.round((checkInsPeriodo.reduce((total, checkIn) => total + valorEscalaCinco(checkIn.estres), 0) / checkInsPeriodo.length / 5) * 100)
        : esUltimoPeriodo
          ? Math.round((estresPromedio / 5) * 100)
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
        .map((solicitud) => ({
          id: solicitud.id || '',
          tipo: 'ausencia' as const,
          titulo: solicitud.asunto || solicitud.tipo || 'Ausencia',
          empleado: solicitud.usuario_nombre || 'Empleado',
          prioridad: solicitud.tipo || 'permiso',
          fecha: solicitud.fecha_solicitud || '',
          solicitud,
        })),
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
    <ScrollView style={estilos.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={estilos.scrollViewContent}>
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={estilos.header}>
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
      <View style={estilos.heroPanel}>
        {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <Animated.View
          pointerEvents="none"
          style={[
            estilos.heroGlowA,
            {
              transform: [
                {
                  translateX: brilloAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 36, 0],
                  }),
                },
                {
                  translateY: brilloAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, -22, 0],
                  }),
                },
              ],
            },
          ]}
        />
        {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <Animated.View
          pointerEvents="none"
          style={[
            estilos.heroGlowB,
            {
              transform: [
                {
                  translateX: brilloAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, -32, 0],
                  }),
                },
                {
                  translateY: brilloAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 26, 0],
                  }),
                },
              ],
            },
          ]}
        />
        {/* CampoParticulasHero renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <CampoParticulasHero />
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.heroCopy}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.heroKicker}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.heroKickerDot} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.heroEyebrow}>{t('admin.dashboard.hero.eyebrow')}</Text>
          </View>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.heroTitle}>{t('admin.dashboard.hero.title')}</Text>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.heroActions}>
            {/* Activos */}
            <View style={[estilos.heroMetricPill, estilos.heroMetricPillBlue]}>
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
            </View>

            {/* Productividad */}
            <View style={[estilos.heroMetricPill, estilos.heroMetricPillViolet]}>
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
            </View>

            {/* Check-ins */}
            <View style={[estilos.heroMetricPill, estilos.heroMetricPillEmerald]}>
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
            </View>
          </View>
        </View>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.heroDashboardShell}>
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
          <View style={estilos.heroDashboardGrid}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[estilos.heroPanelCard, estilos.heroPanelMain]}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.heroPanelMainCopy}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.heroPanelLabel}>{t('admin.dashboard.hero.health_score')}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.heroPanelValue}>{Math.max(0, Math.min(100, metricas.productividad - Math.round(metricas.riesgo / 3)))}%</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.heroPanelText}>{t('admin.dashboard.hero.health_detail')}</Text>
              </View>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.heroChart}>
                {datosGrafico.slice(-6).map((punto, index) => (
                  // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                  <View key={`${punto.label}-${index}`} style={[estilos.heroChartBar, { height: `${Math.max(18, punto.rendimiento)}%`, opacity: 0.48 + index * 0.08 }]} />
                ))}
              </View>
            </View>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.heroPanelCard}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.heroPanelLabel}>{t('admin.dashboard.hero.load')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.heroPanelStrong}>{datosGrafico[datosGrafico.length - 1]?.carga || 0}%</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.heroPanelText}>{t('admin.dashboard.hero.active_capacity')}</Text>
            </View>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.heroPanelCard}>
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
          <PremiumCard style={estilos.barChartCard}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.chartHeader}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.chartTitleContainer}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <IconWrapper tono="violet"><Activity size={20} color={theme.isDark ? '#FEFEFE' : '#7C3AED'} /></IconWrapper>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.chartTitle}>{t('admin.dashboard.chart.title')}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.chartSubtitle}>{subtituloGrafico}</Text>
                </View>
              </View>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.chartActions}>
                {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                <TouchableOpacity onPress={() => setModoGrafico('diario')} style={[estilos.chartToggle, modoGrafico === 'diario' && estilos.chartToggleActivo]}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={[estilos.chartToggleText, modoGrafico === 'diario' && estilos.chartToggleTextActivo]}>{t('admin.dashboard.chart.days')}</Text>
                </TouchableOpacity>
                {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                <TouchableOpacity onPress={() => setModoGrafico('semanal')} style={[estilos.chartToggle, modoGrafico === 'semanal' && estilos.chartToggleActivo]}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={[estilos.chartToggleText, modoGrafico === 'semanal' && estilos.chartToggleTextActivo]}>{t('common.weekly')}</Text>
                </TouchableOpacity>
                {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                <TouchableOpacity onPress={() => setModoGrafico('mensual')} style={[estilos.chartToggle, modoGrafico === 'mensual' && estilos.chartToggleActivo]}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={[estilos.chartToggleText, modoGrafico === 'mensual' && estilos.chartToggleTextActivo]}>{t('common.monthly')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[estilos.chartBody, !isTabletOrWeb && estilos.chartBodyMobile]}>
              {isWidescreen ? (
                <>
                  {/* ChartEventsPanel renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                  <ChartEventsPanel eventos={eventosCalendario} />
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View style={estilos.chartGraphArea}>
                    {/* PerformanceLineChart renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                    <PerformanceLineChart datos={datosGrafico} />
                  </View>
                  {/* ChartDetailPanel renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                  <ChartDetailPanel datos={datosGrafico} />
                </>
              ) : (
                // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
                <View style={estilos.chartMediumLayout}>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View style={[estilos.chartGraphArea, { maxWidth: '100%', width: '100%', minWidth: '100%', marginBottom: 12 }]}>
                    {/* PerformanceLineChart renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                    <PerformanceLineChart datos={datosGrafico} />
                  </View>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View style={estilos.chartBottomRow}>
                    {/* ChartEventsPanel renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                    <ChartEventsPanel eventos={eventosCalendario} />
                    {/* ChartDetailPanel renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                    <ChartDetailPanel datos={datosGrafico} />
                  </View>
                </View>
              )}
            </View>
          </PremiumCard>
        </View>
      </View>

      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={estilos.detalleOperativoBar}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.detalleOperativoTitulo}>{t('admin.dashboard.advanced.bar_title')}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.detalleOperativoTexto}>{t('admin.dashboard.advanced.bar_subtitle')}</Text>
        </View>
        {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
        <TouchableOpacity onPress={() => setMostrarDetalleOperativo((valor) => !valor)} activeOpacity={0.88} style={estilos.detalleOperativoBoton}>
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
          <PremiumCard style={estilos.advancedCard}>
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
            <View style={estilos.metricRows}>
              {/* MetricRow renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <MetricRow icon={<Timer size={16} color={BRAND.cyan} />} label={t('admin.dashboard.checkin.participation')} value={metricas.checkInsHoy} total={metricas.activos} color={BRAND.cyan} />
              {/* MetricRow renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <MetricRow icon={<HeartPulse size={16} color={BRAND.error} />} label={t('admin.dashboard.checkin.followup')} value={metricas.empleadosRiesgo.length} total={Math.max(metricas.activos, 1)} color={BRAND.error} />
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
          <PremiumCard style={estilos.advancedCard}>
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
                  detalle={`${item.empleado} · ${item.prioridad}`}
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
          <PremiumCard style={estilos.advancedCard}>
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
          <PremiumCard style={estilos.advancedCard}>
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

/**
 * Componente ApprovalItem. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const ApprovalItem = ({ titulo, detalle, onAprobar, onRechazar }: { titulo: string; detalle: string; onAprobar: () => void; onRechazar: () => void }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={estilos.approvalItem}>
    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
    <View style={estilos.approvalInfo}>
      {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
      <Text style={estilos.listTitle} numberOfLines={1}>{titulo}</Text>
      {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
      <Text style={estilos.listDetail} numberOfLines={1}>{detalle}</Text>
    </View>
    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
    <View style={estilos.approvalActions}>
      {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
      <TouchableOpacity onPress={onAprobar} style={[estilos.approvalButton, estilos.approvalButtonSuccess]}>
        {/* Check renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <Check size={15} color={BRAND.success} />
      </TouchableOpacity>
      {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
      <TouchableOpacity onPress={onRechazar} style={[estilos.approvalButton, estilos.approvalButtonError]}>
        {/* X renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <X size={15} color={BRAND.error} />
      </TouchableOpacity>
    </View>
  </View>
);

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
 * Componente PerformanceLineChart. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const PerformanceLineChart = ({ datos }: { datos: PuntoGrafico[] }) => {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa animacion; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const animacion = useRef(new Animated.Value(1)).current;
  // Inicializa [avanceAnimado, setAvanceAnimado]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [avanceAnimado, setAvanceAnimado] = useState(1);
  // Inicializa [puntoActivo, setPuntoActivo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [puntoActivo, setPuntoActivo] = useState<PuntoGrafico | null>(null);
  // Calcula claveDatos; transforma la lista original en datos listos para renderizar o guardar.
  const claveDatos = datos.map((punto) => `${punto.label}-${punto.rendimiento}-${punto.carga}-${punto.estres}`).join('|');

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    animacion.stopAnimation();
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    animacion.setValue(0);
    // Declara listener; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const listener = animacion.addListener(({ value }) => setAvanceAnimado(value));
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(animacion, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => animacion.removeListener(listener);
  }, [animacion, claveDatos]);

  // Declara ancho; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const ancho = 760;
  // Declara alto; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const alto = 330;
  // Declara margen; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const margen = { top: 24, right: 24, bottom: 54, left: 64 };
  // Declara anchoInterno; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const anchoInterno = ancho - margen.left - margen.right;
  // Declara altoInterno; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const altoInterno = alto - margen.top - margen.bottom;
  // Declara valoresY; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const valoresY = [100, 75, 50, 25, 0];
  // Declara datosSeguros; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const datosSeguros = datos.length > 0 ? datos : [{ label: '', rendimiento: 0, carga: 0, estres: 0 }];

  // Declara obtenerX; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const obtenerX = (indice: number) => margen.left + (datosSeguros.length === 1 ? anchoInterno / 2 : (indice / (datosSeguros.length - 1)) * anchoInterno);
  // Declara obtenerY; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const obtenerY = (valor: number) => margen.top + altoInterno - (Math.max(0, Math.min(100, valor)) / 100) * altoInterno;
  // Inicializa datosVisibles; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const datosVisibles = useMemo(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (datosSeguros.length <= 1) return datosSeguros;
    // Declara cantidad; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const cantidad = Math.max(1, Math.ceil((datosSeguros.length - 1) * avanceAnimado) + 1);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return datosSeguros.slice(0, Math.min(cantidad, datosSeguros.length));
  }, [avanceAnimado, datosSeguros]);

  // Declara obtenerXVisible; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const obtenerXVisible = (indice: number) => margen.left + (datosSeguros.length === 1 ? anchoInterno / 2 : (indice / (datosSeguros.length - 1)) * anchoInterno);
  // Calcula puntosSerie; transforma la lista original en datos listos para renderizar o guardar.
  const puntosSerie = (clave: keyof Omit<PuntoGrafico, 'label'>) => datosVisibles.map((punto, indice) => ({
    x: obtenerXVisible(indice),
    y: obtenerY(punto[clave]),
  }));

  // Declara crearCurvaSuave; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const crearCurvaSuave = (puntos: { x: number; y: number }[]) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (puntos.length === 0) return '';
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (puntos.length === 1) return `M ${puntos[0].x} ${puntos[0].y}`;

    // Declara comandos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const comandos = [`M ${puntos[0].x} ${puntos[0].y}`];
    // Recorre una coleccion para procesar cada elemento con la misma regla.
    for (let i = 0; i < puntos.length - 1; i += 1) {
      // Declara actual; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const actual = puntos[i];
      // Declara siguiente; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const siguiente = puntos[i + 1];
      // Declara anterior; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const anterior = puntos[i - 1] || actual;
      // Declara posterior; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const posterior = puntos[i + 2] || siguiente;
      // Declara tension; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const tension = 0.18;
      // Declara cp1x; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const cp1x = actual.x + (siguiente.x - anterior.x) * tension;
      // Declara cp1y; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const cp1y = actual.y + (siguiente.y - anterior.y) * tension;
      // Declara cp2x; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const cp2x = siguiente.x - (posterior.x - actual.x) * tension;
      // Declara cp2y; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const cp2y = siguiente.y - (posterior.y - actual.y) * tension;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      comandos.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${siguiente.x} ${siguiente.y}`);
    }
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return comandos.join(' ');
  };

  // Declara areaSerie; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const areaSerie = (clave: keyof Omit<PuntoGrafico, 'label'>) => {
    // Declara puntos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const puntos = puntosSerie(clave);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (puntos.length === 0) return '';
    // Declara baseline; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const baseline = margen.top + altoInterno;
    // Declara primero; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const primero = puntos[0];
    // Declara ultimo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const ultimo = puntos[puntos.length - 1];
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return `M ${primero.x} ${baseline} L ${primero.x} ${primero.y} ${crearCurvaSuave(puntos).replace(/^M [^C]+/, '')} L ${ultimo.x} ${baseline} Z`;
  };

  // Calcula renderSerie; transforma la lista original en datos listos para renderizar o guardar.
  const renderSerie = (clave: keyof Omit<PuntoGrafico, 'label'>, color: string, gradiente: string) => (
    <>
      {/* Path renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Path d={areaSerie(clave)} fill={`url(#${gradiente})`} />
      {/* Path renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Path d={crearCurvaSuave(puntosSerie(clave))} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {datosVisibles.map((punto, indice) => (
        // Circle renderiza una pieza visual reutilizable dentro de esta pantalla.
        <Circle
          key={`${clave}-${punto.label}-${indice}`}
          cx={obtenerX(indice)}
          cy={obtenerY(punto[clave])}
          r={puntoActivo?.label === punto.label ? '8' : '6'}
          fill={BRAND.darkBlue}
          stroke={color}
          strokeWidth="3"
          onPress={() => setPuntoActivo(punto)}
        />
      ))}
    </>
  );

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View style={[estilos.lineChartShell, { opacity: animacion, transform: [{ scale: animacion.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) }] }]}>
      {/* Svg renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Svg width="100%" height="100%" viewBox={`0 0 ${ancho} ${alto}`}>
        {/* Defs renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <Defs>
          {/* SvgLinearGradient renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <SvgLinearGradient id="rendimientoFill" x1="0" y1="0" x2="0" y2="1">
            {/* Stop renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <Stop offset="0%" stopColor={BRAND.success} stopOpacity="0.32" />
            {/* Stop renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <Stop offset="100%" stopColor={BRAND.success} stopOpacity="0.02" />
          </SvgLinearGradient>
          {/* SvgLinearGradient renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <SvgLinearGradient id="cargaFill" x1="0" y1="0" x2="0" y2="1">
            {/* Stop renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <Stop offset="0%" stopColor={BRAND.warning} stopOpacity="0.24" />
            {/* Stop renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <Stop offset="100%" stopColor={BRAND.warning} stopOpacity="0.02" />
          </SvgLinearGradient>
          {/* SvgLinearGradient renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <SvgLinearGradient id="estresFill" x1="0" y1="0" x2="0" y2="1">
            {/* Stop renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <Stop offset="0%" stopColor={BRAND.error} stopOpacity="0.2" />
            {/* Stop renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <Stop offset="100%" stopColor={BRAND.error} stopOpacity="0.02" />
          </SvgLinearGradient>
        </Defs>

        {/* Line renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <Line x1={margen.left} y1={margen.top} x2={margen.left} y2={margen.top + altoInterno} stroke={ADMIN.borde} strokeWidth="1" strokeDasharray="10 12" />
        {valoresY.map((valor) => {
          // Declara y; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const y = obtenerY(valor);
          // Devuelve el JSX que React Native renderiza en pantalla.
          return (
            // React.Fragment renderiza una pieza visual reutilizable dentro de esta pantalla.
            <React.Fragment key={valor}>
              {/* Line renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Line x1={margen.left} y1={y} x2={margen.left + anchoInterno} y2={y} stroke={valor === 0 ? ADMIN.bordeFuerte : 'rgba(96,165,250,0.22)'} strokeWidth="2" strokeDasharray={valor === 0 ? '1 0' : '18 22'} strokeLinecap="round" />
              {/* SvgText renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <SvgText x={margen.left - 18} y={y + 5} fill={BRAND.textSec} fontSize="12" fontWeight="800" fontFamily={CHART_FONT} textAnchor="end">{valor}</SvgText>
            </React.Fragment>
          );
        })}

        {renderSerie('carga', BRAND.warning, 'cargaFill')}
        {renderSerie('rendimiento', BRAND.success, 'rendimientoFill')}
        {renderSerie('estres', BRAND.error, 'estresFill')}

        {datosSeguros.map((punto, indice) => {
          // Declara mostrar; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const mostrar = datosSeguros.length <= 14 || indice % 2 === 0 || indice === datosSeguros.length - 1;
          // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
          if (!mostrar) return null;
          // Devuelve el JSX que React Native renderiza en pantalla.
          return (
            // SvgText renderiza una pieza visual reutilizable dentro de esta pantalla.
            <SvgText key={`${punto.label}-${indice}`} x={obtenerX(indice)} y={alto - 18} fill={BRAND.textMain} fontSize={datosSeguros.length > 10 ? '11' : '12'} fontWeight="800" fontFamily={CHART_FONT} textAnchor="middle">
              {punto.label}
            </SvgText>
          );
        })}
      </Svg>
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={estilos.chartTooltip}>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.chartTooltipLabel}>{puntoActivo?.label || datosSeguros[datosSeguros.length - 1]?.label || t('admin.dashboard.chart.period')}</Text>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.chartTooltipValues}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={[estilos.chartTooltipValue, { color: BRAND.success }]}>R {puntoActivo?.rendimiento ?? datosSeguros[datosSeguros.length - 1]?.rendimiento ?? 0}%</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={[estilos.chartTooltipValue, { color: BRAND.warning }]}>C {puntoActivo?.carga ?? datosSeguros[datosSeguros.length - 1]?.carga ?? 0}%</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={[estilos.chartTooltipValue, { color: BRAND.error }]}>E {puntoActivo?.estres ?? datosSeguros[datosSeguros.length - 1]?.estres ?? 0}%</Text>
        </View>
      </View>
    </Animated.View>
  );
};

/**
 * Componente ChartEventsPanel. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const ChartEventsPanel = ({ eventos }: { eventos: any[] }) => {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Calcula hoy; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const hoy = new Date();
  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  hoy.setHours(0, 0, 0, 0);

  // Inicializa proximosEventos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const proximosEventos = useMemo(() => {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return (eventos || [])
      .filter((evento) => {
        // Declara fecha; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const fecha = obtenerFecha(evento.inicio || evento.fechaInicio);
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return fecha && fecha >= hoy;
      })
      .sort((a, b) => {
        // Declara dateA; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const dateA = obtenerFecha(a.inicio || a.fechaInicio)?.getTime() || 0;
        // Declara dateB; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const dateB = obtenerFecha(b.inicio || b.fechaInicio)?.getTime() || 0;
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return dateA - dateB;
      })
      .slice(0, 3);
  }, [eventos]);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
    <View style={estilos.chartDetailPanel}>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={estilos.chartDetailEyebrow}>{t('admin.dashboard.chart.corporate_agenda')}</Text>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={estilos.chartDetailTitle}>{t('admin.dashboard.chart.next_dates')}</Text>
      
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={estilos.chartEventsList}>
        {proximosEventos.length > 0 ? (
          proximosEventos.map((evento) => {
            // Declara fecha; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
            const fecha = obtenerFecha(evento.inicio || evento.fechaInicio);
            // Declara dia; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
            const dia = fecha ? fecha.getDate().toString() : '1';
            // Declara mes; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
            const mes = fecha ? fecha.toLocaleDateString('es-ES', { month: 'short' }).substring(0, 3).toUpperCase().replace('.', '') : 'ENE';
            // Declara hora; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
            const hora = fecha ? fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '00:00';

            // Devuelve el JSX que React Native renderiza en pantalla.
            return (
              // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
              <View key={evento.id} style={estilos.chartEventRowBig}>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.chartEventDateBoxBig}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.chartEventDateDayBig}>{dia}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.chartEventDateMonthBig}>{mes}</Text>
                </View>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.chartEventInfo}>
                  {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                  <Text style={estilos.chartEventNameBig} numberOfLines={1}>{evento.titulo}</Text>
                  {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                  <Text style={estilos.chartEventTimeBig} numberOfLines={2}>{evento.descripcion || t('admin.dashboard.chart.no_description')}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.chartEventMetaBig}>{hora} · {evento.tipo || t('common.general')}</Text>
                </View>
              </View>
            );
          })
        ) : (
          // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
          <View style={estilos.chartEventsEmptyBoxBig}>
            {/* CalendarClock renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <CalendarClock size={24} color={BRAND.textSec} style={{ marginBottom: 8, opacity: 0.5 }} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.chartEventsEmpty}>{t('admin.dashboard.chart.no_events')}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

/**
 * Componente ChartDetailPanel. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const ChartDetailPanel = ({ datos }: { datos: PuntoGrafico[] }) => {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Declara actual; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const actual = datos[datos.length - 1] || { label: t('admin.dashboard.chart.period'), rendimiento: 0, carga: 0, estres: 0 };
  // Declara anterior; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const anterior = datos[datos.length - 2] || actual;
  // Declara rows; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const rows = [
    { label: t('admin.dashboard.chart.performance'), value: actual.rendimiento, prev: anterior.rendimiento, color: BRAND.success },
    { label: t('admin.dashboard.chart.load'), value: actual.carga, prev: anterior.carga, color: BRAND.warning },
    { label: t('admin.dashboard.chart.stress'), value: actual.estres, prev: anterior.estres, color: BRAND.error },
  ];

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
    <View style={estilos.chartDetailPanel}>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={estilos.chartDetailEyebrow}>{t('admin.dashboard.chart.period_detail')}</Text>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={estilos.chartDetailTitle}>{actual.label}</Text>
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={estilos.chartDetailRows}>
        {rows.map((row) => {
          // Declara delta; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const delta = row.value - row.prev;
          // Devuelve el JSX que React Native renderiza en pantalla.
          return (
            // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
            <View key={row.label} style={estilos.chartDetailRow}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={[estilos.chartDetailDot, { backgroundColor: row.color }]} />
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.chartDetailCopy}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.chartDetailLabel}>{row.label}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.chartDetailDelta}>
                  {delta === 0
                    ? t('admin.dashboard.chart.no_variation')
                    : t('admin.dashboard.chart.delta_vs_previous', { delta: `${delta > 0 ? '+' : ''}${delta}` })}
                </Text>
              </View>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.chartDetailValue, { color: row.color }]}>{row.value}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

/**
 * Componente LegendItem. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
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
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 10,
  },
  // advancedGridCompact: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  advancedGridCompact: {
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
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
  // chartBody: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartBody: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 32,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-start',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
  },
  // chartBodyMobile: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartBodyMobile: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'column',
    // gap define separacion uniforme entre elementos hijos.
    gap: 20,
  },
  // chartGraphArea: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartGraphArea: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1.5,
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 720,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 500,
  },
  // chartMediumLayout: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartMediumLayout: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 24,
  },
  // chartBottomRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartBottomRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-start',
    // gap define separacion uniforme entre elementos hijos.
    gap: 32,
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
  },
  // chartDetailPanel: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartDetailPanel: {
    // width fija o calcula el ancho del elemento.
    width: 510,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 320,
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: '100%',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // padding agrega espacio interno alrededor del contenido.
    padding: 14,
  },
  // chartDetailEyebrow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartDetailEyebrow: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.4,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // chartDetailTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  chartDetailTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 22,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 8,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 14,
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
  // chartToggle: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartToggle: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 8,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
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
    gap: 10,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 16,
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
  // heroGlowA: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroGlowA: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 240,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: -140,
    // width fija o calcula el ancho del elemento.
    width: 380,
    // height fija o calcula el alto del elemento.
    height: 380,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 190,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(37,99,235,0.18)',
  },
  // heroGlowB: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroGlowB: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: -80,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: -120,
    // width fija o calcula el ancho del elemento.
    width: 360,
    // height fija o calcula el alto del elemento.
    height: 280,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 120,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(168,85,247,0.18)',
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
  // heroPanelMain: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroPanelMain: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 138,
    // paddingRight ajusta una propiedad visual especifica de este estilo.
    paddingRight: 178,
  },
  // heroPanelMainCopy: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroPanelMainCopy: {
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 178,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 2,
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
});
