/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/DashboardAdmin.tsx
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
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
import { supabase } from '@/infrastructure/supabase/supabaseClient';
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
import {
  UsuarioAdmin,
  TareaAdmin,
  PagoAdmin,
  CheckInAdmin,
  AuditoriaAdmin,
  AusenciaAdmin,
  NotificacionAdmin,
  AsistenciaAdmin,
  SolicitudInternaAdmin,
  FeedbackAdmin,
  InboxAdmin,
  DocumentoAdmin,
  PuntoGrafico,
  ModoGrafico,
} from './dashboardAdminTypes';
import { BRAND, CHART_FONT } from './dashboardAdminConstants';
import {
  obtenerFecha,
  obtenerFechaTarea,
  obtenerFechaCheckIn,
  valorEscalaCinco,
  formatearMoneda,
  porcentaje,
  mismoDia,
} from './dashboardAdminHelpers';
import { estilos } from './dashboardAdminStyles';
import { FondoHeaderTech, HeroMiniChart, PerformanceSparkChart, MobileSignalDonut, ChartSidePanel, LegendItem } from './DashboardCharts';
import { MetricRow, ListItem, ApprovalItem, EmptyState, obtenerColorPrioridad, obtenerTextoPrioridad, obtenerTextoTipo, PremiumCard, IconWrapper } from './DashboardListItems';
// Centro Inteligente: unica fuente de verdad para "vencida"/"proxima a vencer" y para el score de
// urgencia -- ver packages/domain/services/priorityEngine.ts. No reintroducir un estaVencida propio aqui.
import { computeUrgencyFromDate, computeSignalScore } from 'domain/services/priorityEngine';

const Text = AdminTranslatedText;







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

    // Calcula crearListener; se suscribe a una tabla filtrada por empresa_id y republica en cada cambio.
    const crearListener = <T,>(clave: string, tabla: string, actualizar: (datos: T[]) => void) => {
      const run = async () => {
        try {
          const { data, error } = await supabase.from(tabla).select('*').eq('empresa_id', empresaId);
          if (error) throw error;
          actualizar((data || []) as T[]);
        } catch (error) {
          if (__DEV__) console.warn(`[DashboardAdmin] ${tabla} no disponible`, error);
          actualizar([]);
        }
        marcarCargada(clave);
      };
      run();
      const channel = supabase
        .channel(`dashboard-admin:${tabla}:${empresaId}:${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tabla, filter: `empresa_id=eq.${empresaId}` }, run)
        .subscribe();
      return () => supabase.removeChannel(channel);
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

    // El esquema de Supabase normaliza empresaId/empresa_id a una sola columna empresa_id,
    // asi que ya no hace falta fusionar listeners por fuente (empresa/empresa_legacy/usuarios en lotes de 10).
    let active = true;
    const cargarCheckIns = async () => {
      const { data, error } = await supabase.from('checkins').select('*').eq('empresa_id', empresaId);
      if (!active) return;
      setCheckIns(error ? [] : ((data || []) as CheckInAdmin[]));
    };
    cargarCheckIns();
    const channel = supabase
      .channel(`dashboard-admin:checkins:${empresaId}:${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins', filter: `empresa_id=eq.${empresaId}` }, cargarCheckIns)
      .subscribe();

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [empresaId, usuarios]);

  // Prepara registrarAuditoria; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const registrarAuditoria = async (accion: string, modulo: string, detalles: string, estado: 'Success' | 'Warning' | 'Error' = 'Success') => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId) return;
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await supabase.from('audit_logs').insert({
      empresa_id: empresaId,
      actor_id: user?.id || null,
      accion,
      modulo,
      detalles,
    });
  };

  // Prepara actualizarSolicitudAusencia; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const actualizarSolicitudAusencia = async (solicitud: AusenciaAdmin, estado: 'aprobada' | 'rechazada') => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!solicitud.id) return;
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      const { error: updateError } = await supabase.from('solicitudes_ausencia').update({
        estado,
        resuelto_por: user?.id || null,
        resolved_at: new Date().toISOString(),
      }).eq('id', solicitud.id);
      if (updateError) throw updateError;
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
        await supabase.from('notificaciones').insert({
          empresa_id: empresaId,
          usuario_id: solicitud.usuario_id,
          titulo: estado === 'aprobada' ? 'Ausencia aprobada' : 'Ausencia rechazada',
          cuerpo: `${solicitud.asunto || solicitud.tipo || 'Tu solicitud'} fue ${estado}.`,
          tipo: 'aprobacion',
          leida: false,
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
      const { error: updateError } = await supabase.from('solicitudes_internas').update({
        estado,
        resolved_at: new Date().toISOString(),
      }).eq('id', solicitud.id);
      if (updateError) throw updateError;
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
        const titulo = estado === 'aprobado' ? 'Solicitud aprobada' : estado === 'resuelto' ? 'Solicitud resuelta' : 'Solicitud rechazada';
        const mensaje = solicitud.titulo || solicitud.descripcion || 'Tu solicitud fue actualizada por administración.';
        await supabase.from('inbox_unificado').insert({
          empresa_id: empresaId,
          usuario_id: solicitud.userId,
          origen: 'solicitudes_internas',
          contenido: `${titulo}: ${mensaje}`,
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
    const tareasVencidas = tareas.filter((tarea) => tarea.estado !== 'completada' && computeUrgencyFromDate(tarea.fecha_limite) === 'vencida').length;
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
          // Centro Inteligente: fecha_inicio es la fecha real de la ausencia (cuando "pasa"), no cuando
          // se solicito -- es la referencia correcta de urgencia, no fecha_solicitud.
          const fechaReferencia = solicitud.fecha_inicio || solicitud.fecha_solicitud || '';
          return {
            id: solicitud.id || '',
            tipo: 'ausencia' as const,
            titulo: solicitud.asunto || solicitud.tipo || 'Ausencia',
            empleado: solicitud.usuario_nombre || usuario?.nombre || 'Empleado',
            prioridad: solicitud.prioridad || solicitud.tipo || 'permiso',
            fecha: fechaReferencia,
            score: computeSignalScore(computeUrgencyFromDate(fechaReferencia), fechaReferencia, solicitud.prioridad),
            fotoPerfil: usuario?.foto_perfil || usuario?.fotoPerfil || usuario?.photoURL || usuario?.avatarUrl || null,
            solicitud,
          };
        }),
      ...solicitudesInternas
        .filter((solicitud) => solicitud.estado === 'pendiente' || solicitud.estado === 'revisado')
        .map((solicitud) => {
          // Declara usuario; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const usuario = usuarios.find((item) => item.id === solicitud.userId);
          const fechaReferencia = solicitud.fecha_inicio || solicitud.timestamp || '';
          // Devuelve el valor final calculado para esta funcion o caso de uso.
          return {
            id: solicitud.id || '',
            tipo: 'interna' as const,
            titulo: solicitud.titulo || solicitud.tipo || 'Solicitud interna',
            empleado: usuario?.nombre || 'Empleado',
            prioridad: solicitud.prioridad || 'media',
            fecha: fechaReferencia,
            score: computeSignalScore(computeUrgencyFromDate(fechaReferencia), fechaReferencia, solicitud.prioridad),
            fotoPerfil: usuario?.foto_perfil || usuario?.fotoPerfil || usuario?.photoURL || usuario?.avatarUrl || null,
            solicitud,
          };
        }),
      // Centro Inteligente: ordena por urgencia por tiempo (vencida > hoy > proxima > normal) + prioridad
      // declarada, no por fecha de envio -- ver packages/domain/services/priorityEngine.ts.
    ].sort((a, b) => b.score - a.score).slice(0, 5);

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

