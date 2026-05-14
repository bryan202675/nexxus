import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View, Text, ScrollView, Dimensions, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient as SvgLinearGradient, Polygon, Polyline, Stop, Text as SvgText } from 'react-native-svg';
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
import { db } from '@/infrastructure/firebase/firebaseConfig';
import { useAuth } from '@/presentation/hooks/useAuth';
import { obtenerEmpresaIdAdmin } from './adminUtils';
import { ADMIN, sombraAdmin, sombraVioleta } from './adminTheme';

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

type PagoAdmin = {
  salario_bruto?: number;
  salario_neto?: number;
  estado?: string;
  empresaId?: string;
};

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

type AuditoriaAdmin = {
  id?: string;
  estado?: string;
  accion?: string;
  modulo?: string;
  usuarioNombre?: string;
  timestamp?: string;
  empresaId?: string;
};

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

type NotificacionAdmin = {
  id?: string;
  titulo?: string;
  mensaje?: string;
  tipo?: string;
  leida?: boolean;
  fecha?: string;
  empresaId?: string;
};

type AsistenciaAdmin = {
  id?: string;
  userId?: string;
  tipo?: 'entrada' | 'salida' | 'inicio_pausa' | 'fin_pausa';
  timestamp?: string;
  estado_aprobacion?: string;
  horas_extra_calculadas?: number;
  empresaId?: string;
};

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

type DocumentoAdmin = {
  id?: string;
  userId?: string;
  titulo?: string;
  tipo?: string;
  leido?: boolean;
  fechaSubida?: string;
  empresaId?: string;
};

const PremiumCard = ({ children, style }: { children: React.ReactNode; style?: object }) => {
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  return (
    <Animated.View style={[estilos.premiumCard, style, { opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
};

const IconWrapper = ({
  children,
  tono = 'blue',
}: {
  children: React.ReactNode;
  tono?: 'blue' | 'success' | 'warning' | 'error' | 'violet' | 'cyan';
}) => (
  <View style={[estilos.iconWrapperBase, estilos[`iconWrapper_${tono}`]]}>
    {children}
  </View>
);

const obtenerFecha = (valor: any): Date | null => {
  if (!valor) return null;
  if (typeof valor?.toDate === 'function') return valor.toDate();
  if (typeof valor?.seconds === 'number') return new Date(valor.seconds * 1000);
  if (typeof valor === 'number') return new Date(valor);
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const obtenerFechaTarea = (tarea: TareaAdmin): Date | null => obtenerFecha(
  tarea.fecha_creacion ||
  tarea.createdAt ||
  (tarea as any).fechaCreacion ||
  (tarea as any).created_at ||
  (tarea as any).timestamp ||
  tarea.fecha_limite
);

const obtenerFechaCheckIn = (checkIn: CheckInAdmin): Date | null => obtenerFecha(
  checkIn.fecha ||
  checkIn.timestamp ||
  (checkIn as any).createdAt ||
  (checkIn as any).created_at
);

const valorEscalaCinco = (valor: any) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.max(0, Math.min(5, numero)) : 0;
};

const formatearMoneda = (valor: number) => `$${valor.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const porcentaje = (valor: number, total: number) => total > 0 ? Math.round((valor / total) * 100) : 0;

const mismoDia = (fecha: Date | null) => {
  if (!fecha) return false;
  const hoy = new Date();
  return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth() && fecha.getDate() === hoy.getDate();
};

const estaVencida = (valor?: string) => {
  const fecha = obtenerFecha(valor);
  if (!fecha) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return fecha < hoy;
};

type PuntoGrafico = {
  label: string;
  rendimiento: number;
  carga: number;
  estres: number;
};

type ModoGrafico = 'semanal' | 'mensual';

const DashboardAdmin: React.FC = () => {
  const { width } = Dimensions.get('window');
  const isTabletOrWeb = width > 900;
  const { user } = useAuth();
  const empresaId = obtenerEmpresaIdAdmin(user);

  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [tareas, setTareas] = useState<TareaAdmin[]>([]);
  const [pagos, setPagos] = useState<PagoAdmin[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInAdmin[]>([]);
  const [logs, setLogs] = useState<AuditoriaAdmin[]>([]);
  const [ausencias, setAusencias] = useState<AusenciaAdmin[]>([]);
  const [notificaciones, setNotificaciones] = useState<NotificacionAdmin[]>([]);
  const [asistencias, setAsistencias] = useState<AsistenciaAdmin[]>([]);
  const [solicitudesInternas, setSolicitudesInternas] = useState<SolicitudInternaAdmin[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackAdmin[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxAdmin[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoAdmin[]>([]);
  const [modoGrafico, setModoGrafico] = useState<ModoGrafico>('semanal');
  const [mostrarDetalleOperativo, setMostrarDetalleOperativo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 720,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  useEffect(() => {
    if (!empresaId) {
      setUsuarios([]);
      setTareas([]);
      setPagos([]);
      setCheckIns([]);
      setLogs([]);
      setAusencias([]);
      setNotificaciones([]);
      setAsistencias([]);
      setSolicitudesInternas([]);
      setFeedbacks([]);
      setInboxItems([]);
      setDocumentos([]);
      setCargando(false);
      return;
    }

    const cargadas = new Set<string>();
    const marcarCargada = (clave: string) => {
      cargadas.add(clave);
      if (cargadas.size >= 11) setCargando(false);
    };

    setCargando(true);

    const crearListener = <T,>(clave: string, coleccion: string, actualizar: (datos: T[]) => void) => onSnapshot(
      query(collection(db, coleccion), where('empresaId', '==', empresaId)),
      (snapshot) => {
        actualizar(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T));
        marcarCargada(clave);
      },
      () => {
        actualizar([]);
        marcarCargada(clave);
      }
    );

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
    ];

    return () => consultas.forEach((unsubscribe) => unsubscribe());
  }, [empresaId]);

  useEffect(() => {
    if (!empresaId) {
      setCheckIns([]);
      return;
    }

    const idsUsuarios = usuarios
      .map((usuario) => usuario.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    const gruposIds = Array.from({ length: Math.ceil(idsUsuarios.length / 10) }, (_, indice) => idsUsuarios.slice(indice * 10, indice * 10 + 10));
    const mapasPorFuente = new Map<string, Map<string, CheckInAdmin>>();

    const publicar = () => {
      const combinados = new Map<string, CheckInAdmin>();
      mapasPorFuente.forEach((mapa) => {
        mapa.forEach((checkIn, id) => combinados.set(id, checkIn));
      });
      setCheckIns(Array.from(combinados.values()));
    };

    const consultas: Array<() => void> = [];

    consultas.push(onSnapshot(
      query(collection(db, 'checkins'), where('empresaId', '==', empresaId)),
      (snapshot) => {
        const mapa = new Map<string, CheckInAdmin>();
        snapshot.docs.forEach((documento) => {
          mapa.set(documento.id, { id: documento.id, ...documento.data() } as CheckInAdmin);
        });
        mapasPorFuente.set('empresa', mapa);
        publicar();
      },
      () => publicar()
    ));

    consultas.push(onSnapshot(
      query(collection(db, 'checkins'), where('empresa_id', '==', empresaId)),
      (snapshot) => {
        const mapa = new Map<string, CheckInAdmin>();
        snapshot.docs.forEach((documento) => {
          mapa.set(documento.id, { id: documento.id, ...documento.data() } as CheckInAdmin);
        });
        mapasPorFuente.set('empresa_legacy', mapa);
        publicar();
      },
      () => publicar()
    ));

    gruposIds.forEach((grupo, indice) => {
      if (grupo.length === 0) return;
      consultas.push(onSnapshot(
        query(collection(db, 'checkins'), where('userId', 'in', grupo)),
        (snapshot) => {
          const mapa = new Map<string, CheckInAdmin>();
          snapshot.docs.forEach((documento) => {
            mapa.set(documento.id, { id: documento.id, ...documento.data() } as CheckInAdmin);
          });
          mapasPorFuente.set(`usuarios-${indice}`, mapa);
          publicar();
        },
        () => publicar()
      ));
    });

    return () => consultas.forEach((unsubscribe) => unsubscribe());
  }, [empresaId, usuarios]);

  const registrarAuditoria = async (accion: string, modulo: string, detalles: string, estado: 'Success' | 'Warning' | 'Error' = 'Success') => {
    if (!empresaId) return;
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

  const actualizarSolicitudAusencia = async (solicitud: AusenciaAdmin, estado: 'aprobada' | 'rechazada') => {
    if (!solicitud.id) return;
    await updateDoc(doc(db, 'solicitudes_ausencia', solicitud.id), {
      estado,
      resuelto_por: user?.id || '',
      resuelto_por_nombre: user?.nombre || 'Administrador',
      fecha_resolucion: new Date().toISOString(),
    });
    await registrarAuditoria(
      estado === 'aprobada' ? 'Aprobación de Ausencia' : 'Rechazo de Ausencia',
      'Centro de Aprobaciones',
      `${solicitud.usuario_nombre || 'Empleado'} · ${solicitud.asunto || solicitud.tipo || 'Solicitud'}`,
      estado === 'aprobada' ? 'Success' : 'Warning'
    );
    if (solicitud.usuario_id) {
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
  };

  const actualizarSolicitudInterna = async (solicitud: SolicitudInternaAdmin, estado: 'aprobado' | 'rechazado' | 'resuelto') => {
    if (!solicitud.id) return;
    await updateDoc(doc(db, 'solicitudes_internas', solicitud.id), {
      estado,
      fecha_resolucion: new Date().toISOString(),
      resuelto_por: user?.id || '',
      resuelto_por_nombre: user?.nombre || 'Administrador',
    });
    await registrarAuditoria(
      estado === 'aprobado' ? 'Aprobación de Solicitud Interna' : estado === 'resuelto' ? 'Resolución de Solicitud Interna' : 'Rechazo de Solicitud Interna',
      'Centro de Aprobaciones',
      solicitud.titulo || solicitud.tipo || 'Solicitud interna',
      estado === 'rechazado' ? 'Warning' : 'Success'
    );
    if (solicitud.userId) {
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
  };

  const metricas = useMemo(() => {
    const activos = usuarios.filter((usuario) => usuario.activo !== false && usuario.estado_activo !== false).length;
    const inactivos = usuarios.length - activos;
    const empleadosEnPausa = usuarios.filter((usuario) => usuario.estado_trabajo === 'en_pausa').length;
    const empleadosOcupados = usuarios.filter((usuario) => usuario.estado_trabajo === 'ocupado' || usuario.estado_trabajo === 'en_reunion').length;
    const empleadosConectados = usuarios.filter((usuario) => usuario.estado_activo === true || usuario.estado_trabajo === 'disponible' || usuario.estado_trabajo === 'ocupado' || usuario.estado_trabajo === 'en_reunion' || usuario.estado_trabajo === 'en_pausa').length;
    const empleadosAusentes = usuarios.filter((usuario) => usuario.activo !== false && (usuario.estado_trabajo === 'fuera_oficina' || usuario.estado_activo === false)).length;
    const tareasPendientes = tareas.filter((tarea) => tarea.estado === 'pendiente' || !tarea.estado).length;
    const tareasProgreso = tareas.filter((tarea) => tarea.estado === 'en_progreso').length;
    const tareasCompletadas = tareas.filter((tarea) => tarea.estado === 'completada').length;
    const tareasAltaPrioridad = tareas.filter((tarea) => tarea.prioridad === 'Alta').length;
    const tareasVencidas = tareas.filter((tarea) => tarea.estado !== 'completada' && estaVencida(tarea.fecha_limite)).length;
    const productividad = porcentaje(tareasCompletadas, tareas.length);
    const tiempoPromedioTareas = tareas.length > 0 ? Math.round(tareas.reduce((total, tarea) => total + (Number(tarea.tiempoEstimado) || 0), 0) / tareas.length) : 0;
    const costoMensual = pagos.reduce((total, pago) => total + (pago.salario_bruto || pago.salario_neto || 0), 0);
    const payrollProcesando = pagos.filter((pago) => pago.estado !== 'Pagado').length;
    const checkInsHoy = checkIns.filter((checkIn) => mismoDia(obtenerFechaCheckIn(checkIn))).length;
    const participacion = porcentaje(checkInsHoy, activos);
    const asistenciasHoy = asistencias.filter((asistencia) => mismoDia(obtenerFecha(asistencia.timestamp)));
    const entradasHoy = asistenciasHoy.filter((asistencia) => asistencia.tipo === 'entrada');
    const salidasHoy = asistenciasHoy.filter((asistencia) => asistencia.tipo === 'salida');
    const pausasActivas = Math.max(0, asistenciasHoy.filter((asistencia) => asistencia.tipo === 'inicio_pausa').length - asistenciasHoy.filter((asistencia) => asistencia.tipo === 'fin_pausa').length);
    const retrasos = entradasHoy.filter((asistencia) => {
      const fecha = obtenerFecha(asistencia.timestamp);
      return !!fecha && fecha.getHours() >= 9 && fecha.getMinutes() > 0;
    }).length;
    const horasExtra = Math.round(asistenciasHoy.reduce((total, asistencia) => total + (Number(asistencia.horas_extra_calculadas) || 0), 0));
    const estresPromedio = checkIns.length > 0
      ? checkIns.reduce((total, checkIn) => total + (Number(checkIn.estres) || 0), 0) / checkIns.length
      : 0;
    const cargaPromedio = checkIns.length > 0
      ? checkIns.reduce((total, checkIn) => total + (Number(checkIn.cargaLaboral) || 0), 0) / checkIns.length
      : 0;
    const bienestar = checkIns.length > 0 ? Math.max(0, Math.min(100, Math.round(((5 - estresPromedio) / 5) * 100))) : 0;
    const neutral = checkIns.length > 0 ? Math.max(0, Math.min(100, Math.round((Number((5 - cargaPromedio).toFixed(1)) / 5) * 100))) : 0;
    const riesgo = Math.max(0, 100 - bienestar);
    const alertas = logs.filter((log) => log.estado === 'Error' || log.estado === 'Warning').length;
    const ausenciasPendientes = ausencias.filter((ausencia) => ausencia.estado === 'pendiente').length;
    const solicitudesInternasPendientes = solicitudesInternas.filter((solicitud) => solicitud.estado === 'pendiente' || solicitud.estado === 'revisado').length;
    const aprobacionesPendientes = ausenciasPendientes + solicitudesInternasPendientes;
    const incidenciasAbiertas = feedbacks.filter((feedback) => feedback.estado !== 'resuelto' && (feedback.tipo === 'problema' || feedback.tipo === 'dificultad')).length;
    const inboxCritico = inboxItems.filter((item) => item.estado !== 'resuelto' && item.prioridad === 'urgente').length;
    const documentosPendientes = documentos.filter((documento) => !documento.leido).length;
    const notificacionesNoLeidas = notificaciones.filter((notificacion) => !notificacion.leida).length;
    const departamentos = usuarios.reduce<Record<string, number>>((acumulado, usuario) => {
      const nombre = usuario.departamento || 'Sin departamento';
      acumulado[nombre] = (acumulado[nombre] || 0) + 1;
      return acumulado;
    }, {});

    const crearPeriodos = (modo: ModoGrafico) => {
      const totalPeriodos = modo === 'semanal' ? 8 : 12;
      return Array.from({ length: totalPeriodos }).map((_, indice) => {
        const inicio = new Date();
        if (modo === 'semanal') {
          inicio.setDate(inicio.getDate() - ((totalPeriodos - 1 - indice) * 7));
          inicio.setHours(0, 0, 0, 0);
          const fin = new Date(inicio);
          fin.setDate(fin.getDate() + 6);
          fin.setHours(23, 59, 59, 999);
          return {
            inicio,
            fin,
            label: `S${indice + 1}`,
          };
        }
        inicio.setMonth(inicio.getMonth() - (totalPeriodos - 1 - indice), 1);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0, 23, 59, 59, 999);
        return {
          inicio,
          fin,
          label: inicio.toLocaleDateString('es-SV', { month: 'short' }).replace('.', '').toUpperCase(),
        };
      });
    };

    const crearSerie = (modo: ModoGrafico): PuntoGrafico[] => {
      const periodos = crearPeriodos(modo);
      return periodos.map((periodo, indice) => {
      const esUltimoPeriodo = indice === periodos.length - 1;
      const tareasPeriodo = tareas.filter((tarea) => {
        const fecha = obtenerFechaTarea(tarea);
        if (!fecha) return esUltimoPeriodo;
        return fecha >= periodo.inicio && fecha <= periodo.fin;
      });
      const checkInsPeriodo = checkIns.filter((checkIn) => {
        const fecha = obtenerFechaCheckIn(checkIn);
        if (!fecha) return esUltimoPeriodo;
        return fecha >= periodo.inicio && fecha <= periodo.fin;
      });
      const completadasPeriodo = tareasPeriodo.filter((tarea) => tarea.estado === 'completada').length;
      const rendimientoPeriodo = tareasPeriodo.length > 0
        ? porcentaje(completadasPeriodo, tareasPeriodo.length)
        : esUltimoPeriodo
          ? productividad
          : 0;
      const cargaPeriodo = checkInsPeriodo.length > 0
        ? Math.round((checkInsPeriodo.reduce((total, checkIn) => total + valorEscalaCinco(checkIn.cargaLaboral), 0) / checkInsPeriodo.length / 5) * 100)
        : esUltimoPeriodo
          ? Math.round((cargaPromedio / 5) * 100)
          : 0;
      const estresPeriodo = checkInsPeriodo.length > 0
        ? Math.round((checkInsPeriodo.reduce((total, checkIn) => total + valorEscalaCinco(checkIn.estres), 0) / checkInsPeriodo.length / 5) * 100)
        : esUltimoPeriodo
          ? Math.round((estresPromedio / 5) * 100)
          : 0;

      return {
        label: periodo.label,
        rendimiento: rendimientoPeriodo,
        carga: cargaPeriodo,
        estres: estresPeriodo,
      };
    });
    };

    const empleadosSinCheckIn = usuarios.filter((usuario) => {
      const ultimo = obtenerFecha(usuario.ultimoCheckIn);
      return usuario.activo !== false && !mismoDia(ultimo);
    }).slice(0, 5);

    const checkInsHoyDetalle = checkIns
      .filter((checkIn) => mismoDia(obtenerFechaCheckIn(checkIn)))
      .sort((a, b) => (obtenerFechaCheckIn(b)?.getTime() || 0) - (obtenerFechaCheckIn(a)?.getTime() || 0))
      .slice(0, 6)
      .map((checkIn) => {
        const usuario = usuarios.find((item) => item.id === checkIn.userId);
        const estres = valorEscalaCinco(checkIn.estres);
        const carga = valorEscalaCinco(checkIn.cargaLaboral);
        const balance = valorEscalaCinco(checkIn.balanceEmocional);
        const bienestarEmpleado = Math.max(0, Math.min(100, Math.round(((balance + (5 - estres) + (5 - carga)) / 15) * 100)));
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

    const energiaDistribucion = checkInsHoyDetalle.reduce(
      (acumulado, checkIn) => {
        const energia = String(checkIn.energia).toLowerCase();
        if (energia === 'alto') acumulado.alto += 1;
        else if (energia === 'bajo') acumulado.bajo += 1;
        else acumulado.medio += 1;
        return acumulado;
      },
      { alto: 0, medio: 0, bajo: 0 }
    );

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
          const usuario = usuarios.find((item) => item.id === solicitud.userId);
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

    const alertasOperativas = [
      ...inboxItems
        .filter((item) => item.estado !== 'resuelto')
        .map((item) => ({ id: item.id || '', titulo: item.titulo || item.tipo || 'Inbox', detalle: item.mensaje || 'Pendiente', color: item.prioridad === 'urgente' ? BRAND.error : BRAND.warning })),
      ...feedbacks
        .filter((feedback) => feedback.estado !== 'resuelto')
        .map((feedback) => ({ id: feedback.id || '', titulo: feedback.tipo || 'Feedback', detalle: feedback.mensaje || 'Sin detalle', color: feedback.tipo === 'problema' || feedback.tipo === 'dificultad' ? BRAND.error : BRAND.cyan })),
    ].slice(0, 5);

    const empleadosRiesgo = checkIns
      .filter((checkIn) => (Number(checkIn.estres) || 0) >= 4 || (Number(checkIn.cargaLaboral) || 0) >= 4)
      .sort((a, b) => (Number(b.estres) || 0) - (Number(a.estres) || 0))
      .slice(0, 5)
      .map((checkIn) => {
        const usuario = usuarios.find((item) => item.id === checkIn.userId);
        return {
          id: checkIn.id || checkIn.userId || `${checkIn.fecha || checkIn.timestamp}-${checkIn.estres || 0}`,
          nombre: usuario?.nombre || 'Empleado',
          depto: usuario?.departamento || 'Sin departamento',
          estres: Number(checkIn.estres) || 0,
        };
      });

    const actividad = logs
      .slice()
      .sort((a, b) => (obtenerFecha(b.timestamp)?.getTime() || 0) - (obtenerFecha(a.timestamp)?.getTime() || 0))
      .slice(0, 5);

    const topDepartamentos = Object.entries(departamentos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([nombre, total]) => ({ nombre, total, share: porcentaje(total, usuarios.length) }));

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

  const stats = [
    {
      label: "Equipo activo",
      val: metricas.activos.toString(),
      trend: `${usuarios.length} registrados`,
      tono: 'cyan' as const,
      icon: <Users size={24} color={ADMIN.iconos.personas} />,
    },
    {
      label: "Productividad",
      val: `${metricas.productividad}%`,
      trend: `${metricas.tareasPendientes} tareas pendientes`,
      tono: metricas.productividad >= 75 ? 'success' as const : 'warning' as const,
      icon: <ClipboardList size={24} color={metricas.productividad >= 75 ? ADMIN.iconos.exito : ADMIN.iconos.tareas} />,
    },
    {
      label: "Prioridades",
      val: `${metricas.riesgo}%`,
      trend: `${metricas.aprobacionesPendientes} aprobaciones pendientes`,
      tono: metricas.riesgo > 45 || metricas.alertas > 0 ? 'error' as const : 'cyan' as const,
      icon: <AlertTriangle size={24} color={metricas.riesgo > 45 || metricas.alertas > 0 ? ADMIN.iconos.peligro : ADMIN.iconos.auditoria} />,
    }
  ];

  const datosGrafico = modoGrafico === 'semanal' ? metricas.serieSemanal : metricas.serieMensual;

  if (cargando) {
    return (
      <View style={[estilos.scrollView, estilos.estadoCarga]}>
        <ActivityIndicator size="large" color={BRAND.iconBright} />
      </View>
    );
  }

  return (
    <Animated.View style={[estilos.animatedScreen, { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
    <ScrollView style={estilos.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={estilos.scrollViewContent}>
      <View style={estilos.header}>
        <View>
          <Text style={estilos.headerTitle}>Centro operativo</Text>
          <Text style={estilos.headerSubtitle}>Lo esencial para decidir y actuar sin ruido.</Text>
        </View>
        <View style={estilos.livePill}>
          <View style={estilos.liveDot} />
          <Text style={estilos.liveText}>Firebase live</Text>
        </View>
      </View>

      <View style={[estilos.statsGrid, !isTabletOrWeb && estilos.statsGridMobile]}>
        {stats.map((stat, i) => (
          <View key={stat.label} style={[estilos.statCardContainer, { width: isTabletOrWeb ? '32%' : '100%' }]}>
            <PremiumCard style={estilos.statCard}>
              <View style={estilos.statAccent} />
              <View style={estilos.statCardInner}>
                <View style={estilos.statTextContainer}>
                  <Text style={estilos.statLabel}>{stat.label}</Text>
                  <Text style={estilos.statValue}>{stat.val}</Text>
                  <View style={estilos.trendContainer}>
                    <TrendingUp size={12} color={stat.tono === 'error' ? BRAND.error : stat.tono === 'warning' ? BRAND.warning : BRAND.success} />
                    <Text style={[estilos.trendText, { color: stat.tono === 'error' ? BRAND.error : stat.tono === 'warning' ? BRAND.warning : BRAND.success }]}>
                      {stat.trend}
                    </Text>
                  </View>
                </View>
                <IconWrapper tono={stat.tono}>{stat.icon}</IconWrapper>
              </View>
            </PremiumCard>
          </View>
        ))}
      </View>

      <View style={[estilos.topGrid, !isTabletOrWeb && estilos.topGridMobile]}>
        <View style={!isTabletOrWeb ? estilos.anchoTotal : estilos.columnaPrincipal}>
          <PremiumCard style={estilos.barChartCard}>
            <View style={estilos.chartHeader}>
              <View style={estilos.chartTitleContainer}>
                <IconWrapper tono="violet"><Activity size={20} color={ADMIN.iconos.auditoria} /></IconWrapper>
                <View>
                  <Text style={estilos.chartTitle}>Rendimiento, Carga y Estrés</Text>
                  <Text style={estilos.chartSubtitle}>Promedio general de empleados por {modoGrafico === 'semanal' ? 'semana' : 'mes'}</Text>
                </View>
              </View>
              <View style={estilos.chartActions}>
                <TouchableOpacity onPress={() => setModoGrafico('semanal')} style={[estilos.chartToggle, modoGrafico === 'semanal' && estilos.chartToggleActivo]}>
                  <Text style={[estilos.chartToggleText, modoGrafico === 'semanal' && estilos.chartToggleTextActivo]}>Semanal</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setModoGrafico('mensual')} style={[estilos.chartToggle, modoGrafico === 'mensual' && estilos.chartToggleActivo]}>
                  <Text style={[estilos.chartToggleText, modoGrafico === 'mensual' && estilos.chartToggleTextActivo]}>Mensual</Text>
                </TouchableOpacity>
              </View>
            </View>

            <PerformanceLineChart datos={datosGrafico} />
            <View style={estilos.chartLegend}>
              <LegendItem color={BRAND.success} label="Rendimiento" value={`${datosGrafico[datosGrafico.length - 1]?.rendimiento || 0}%`} />
              <LegendItem color={BRAND.warning} label="Carga" value={`${datosGrafico[datosGrafico.length - 1]?.carga || 0}%`} />
              <LegendItem color={BRAND.error} label="Estrés" value={`${datosGrafico[datosGrafico.length - 1]?.estres || 0}%`} />
            </View>
          </PremiumCard>
        </View>

        <View style={!isTabletOrWeb ? estilos.anchoTotal : estilos.columnaLateral}>
          <PremiumCard style={estilos.priorityCard}>
            <View style={estilos.panelHeader}>
              <View>
                <Text style={estilos.panelTitle}>Prioridades de hoy</Text>
                <Text style={estilos.panelSubtitle}>Acciones reales, sin métricas extra</Text>
              </View>
              <IconWrapper tono="warning"><Inbox size={20} color={BRAND.warning} /></IconWrapper>
            </View>
            <View style={estilos.listadoCompacto}>
              {metricas.solicitudesPendientes.length > 0 ? metricas.solicitudesPendientes.slice(0, 3).map((item) => (
                <ApprovalItem
                  key={`${item.tipo}-${item.id}`}
                  titulo={item.titulo}
                  detalle={`${item.empleado} · ${item.prioridad}`}
                  onAprobar={() => item.tipo === 'ausencia' ? actualizarSolicitudAusencia(item.solicitud as AusenciaAdmin, 'aprobada') : actualizarSolicitudInterna(item.solicitud as SolicitudInternaAdmin, 'aprobado')}
                  onRechazar={() => item.tipo === 'ausencia' ? actualizarSolicitudAusencia(item.solicitud as AusenciaAdmin, 'rechazada') : actualizarSolicitudInterna(item.solicitud as SolicitudInternaAdmin, 'rechazado')}
                />
              )) : metricas.alertasOperativas.length > 0 ? metricas.alertasOperativas.slice(0, 3).map((alerta) => (
                <ListItem key={alerta.id} inicial="!" titulo={alerta.titulo} detalle={alerta.detalle} badge="Abierta" color={alerta.color} />
              )) : (
                <EmptyState texto="Sin prioridades pendientes" />
              )}
            </View>
          </PremiumCard>
        </View>
      </View>

      <View style={estilos.detalleOperativoBar}>
        <View>
          <Text style={estilos.detalleOperativoTitulo}>Operación avanzada</Text>
          <Text style={estilos.detalleOperativoTexto}>Check-ins, asistencia, tareas, alertas y auditoría siguen disponibles bajo demanda.</Text>
        </View>
        <TouchableOpacity onPress={() => setMostrarDetalleOperativo((valor) => !valor)} activeOpacity={0.88} style={estilos.detalleOperativoBoton}>
          <Text style={estilos.detalleOperativoBotonTexto}>{mostrarDetalleOperativo ? 'Ocultar' : 'Abrir'}</Text>
        </TouchableOpacity>
      </View>

      {mostrarDetalleOperativo && (
      <Animated.View style={[estilos.detalleOperativoContenido, { opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
        <View style={[estilos.advancedGrid, !isTabletOrWeb && estilos.topGridMobile]}>
          <PremiumCard style={estilos.advancedCard}>
            <View style={estilos.panelHeader}>
              <View>
                <Text style={estilos.panelTitle}>Check-in de hoy</Text>
                <Text style={estilos.panelSubtitle}>Solo participación y señales principales</Text>
              </View>
              <IconWrapper tono="cyan"><Timer size={20} color={BRAND.cyan} /></IconWrapper>
            </View>
            <View style={estilos.metricRows}>
              <MetricRow icon={<Timer size={16} color={BRAND.cyan} />} label="Participación" value={metricas.checkInsHoy} total={metricas.activos} color={BRAND.cyan} />
              <MetricRow icon={<HeartPulse size={16} color={BRAND.error} />} label="Seguimiento" value={metricas.empleadosRiesgo.length} total={Math.max(metricas.activos, 1)} color={BRAND.error} />
            </View>
            <View style={estilos.listadoCompacto}>
              {metricas.empleadosSinCheckIn.slice(0, 3).map((empleado) => (
                <ListItem key={empleado.id || empleado.correo} inicial={(empleado.nombre || '?')[0]} titulo={empleado.nombre || 'Empleado'} detalle={empleado.departamento || 'Sin departamento'} badge="Pendiente" color={BRAND.cyan} />
              ))}
              {metricas.empleadosSinCheckIn.length === 0 && <EmptyState texto="Check-ins al día" />}
            </View>
          </PremiumCard>

          <PremiumCard style={estilos.advancedCard}>
            <View style={estilos.panelHeader}>
              <View>
                <Text style={estilos.panelTitle}>Aprobaciones</Text>
                <Text style={estilos.panelSubtitle}>Ausencias y solicitudes internas</Text>
              </View>
              <IconWrapper tono="warning"><Inbox size={20} color={BRAND.warning} /></IconWrapper>
            </View>
            <View style={estilos.listadoCompacto}>
              {metricas.solicitudesPendientes.length > 0 ? metricas.solicitudesPendientes.slice(0, 5).map((item) => (
                <ApprovalItem
                  key={`${item.tipo}-${item.id}`}
                  titulo={item.titulo}
                  detalle={`${item.empleado} · ${item.prioridad}`}
                  onAprobar={() => item.tipo === 'ausencia' ? actualizarSolicitudAusencia(item.solicitud as AusenciaAdmin, 'aprobada') : actualizarSolicitudInterna(item.solicitud as SolicitudInternaAdmin, 'aprobado')}
                  onRechazar={() => item.tipo === 'ausencia' ? actualizarSolicitudAusencia(item.solicitud as AusenciaAdmin, 'rechazada') : actualizarSolicitudInterna(item.solicitud as SolicitudInternaAdmin, 'rechazado')}
                />
              )) : (
                <EmptyState texto="Sin aprobaciones pendientes" />
              )}
            </View>
          </PremiumCard>
        </View>

        <View style={[estilos.advancedGrid, !isTabletOrWeb && estilos.topGridMobile]}>
          <PremiumCard style={estilos.advancedCard}>
            <View style={estilos.panelHeader}>
              <View>
                <Text style={estilos.panelTitle}>Alertas abiertas</Text>
                <Text style={estilos.panelSubtitle}>Incidencias, inbox y documentos pendientes</Text>
              </View>
              <IconWrapper tono="error"><MessageSquareWarning size={20} color={BRAND.error} /></IconWrapper>
            </View>
            <View style={estilos.listadoCompacto}>
              {metricas.alertasOperativas.length > 0 ? metricas.alertasOperativas.slice(0, 5).map((alerta) => (
                <ListItem key={alerta.id} inicial="!" titulo={alerta.titulo} detalle={alerta.detalle} badge="Abierta" color={alerta.color} />
              )) : (
                <EmptyState texto="Sin alertas abiertas" />
              )}
            </View>
          </PremiumCard>

          <PremiumCard style={estilos.advancedCard}>
            <View style={estilos.panelHeader}>
              <View>
                <Text style={estilos.panelTitle}>Actividad reciente</Text>
                <Text style={estilos.panelSubtitle}>Últimos eventos de auditoría</Text>
              </View>
              <IconWrapper tono="blue"><ShieldCheck size={20} color={BRAND.iconBright} /></IconWrapper>
            </View>
            <View style={estilos.timeline}>
              {metricas.actividad.length > 0 ? metricas.actividad.slice(0, 5).map((log) => (
                <View key={log.id} style={estilos.timelineItem}>
                  <View style={[estilos.timelineDot, { backgroundColor: log.estado === 'Error' ? BRAND.error : log.estado === 'Warning' ? BRAND.warning : BRAND.success }]} />
                  <View style={estilos.timelineContent}>
                    <Text style={estilos.timelineTitle}>{log.accion || 'Evento del sistema'}</Text>
                    <Text style={estilos.timelineMeta}>{log.usuarioNombre || 'Sistema'} · {log.modulo || 'General'}</Text>
                  </View>
                </View>
              )) : (
                <EmptyState texto="Sin actividad reciente" />
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

const MetricRow = ({ icon, label, value, total, color }: { icon: React.ReactNode; label: string; value: number; total: number; color: string }) => {
  const avance = porcentaje(value, total);
  return (
    <View style={estilos.metricRow}>
      <View style={estilos.metricRowTop}>
        <View style={estilos.metricRowLabel}>
          {icon}
          <Text style={estilos.metricLabel}>{label}</Text>
        </View>
        <Text style={estilos.metricValue}>{value}</Text>
      </View>
      <View style={estilos.progressTrack}>
        <View style={[estilos.progressFill, { width: `${Math.max(avance, value > 0 ? 6 : 0)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const ListItem = ({ inicial, titulo, detalle, badge, color }: { inicial: string; titulo: string; detalle: string; badge: string; color: string }) => (
  <View style={estilos.listItem}>
    <View style={[estilos.listAvatar, { borderColor: `${color}55` }]}>
      <Text style={[estilos.listAvatarText, { color }]}>{inicial.toUpperCase()}</Text>
    </View>
    <View style={estilos.listInfo}>
      <Text style={estilos.listTitle} numberOfLines={1}>{titulo}</Text>
      <Text style={estilos.listDetail} numberOfLines={1}>{detalle}</Text>
    </View>
    <View style={[estilos.listBadge, { borderColor: `${color}55`, backgroundColor: `${color}16` }]}>
      <Text style={[estilos.listBadgeText, { color }]}>{badge}</Text>
    </View>
  </View>
);

const ApprovalItem = ({ titulo, detalle, onAprobar, onRechazar }: { titulo: string; detalle: string; onAprobar: () => void; onRechazar: () => void }) => (
  <View style={estilos.approvalItem}>
    <View style={estilos.approvalInfo}>
      <Text style={estilos.listTitle} numberOfLines={1}>{titulo}</Text>
      <Text style={estilos.listDetail} numberOfLines={1}>{detalle}</Text>
    </View>
    <View style={estilos.approvalActions}>
      <TouchableOpacity onPress={onAprobar} style={[estilos.approvalButton, estilos.approvalButtonSuccess]}>
        <Check size={15} color={BRAND.success} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onRechazar} style={[estilos.approvalButton, estilos.approvalButtonError]}>
        <X size={15} color={BRAND.error} />
      </TouchableOpacity>
    </View>
  </View>
);

const EmptyState = ({ texto }: { texto: string }) => (
  <View style={estilos.emptyState}>
    <Text style={estilos.emptyText}>{texto}</Text>
  </View>
);

export default DashboardAdmin;

const PerformanceLineChart = ({ datos }: { datos: PuntoGrafico[] }) => {
  const animacion = useRef(new Animated.Value(1)).current;
  const [avanceAnimado, setAvanceAnimado] = useState(1);
  const [puntoActivo, setPuntoActivo] = useState<PuntoGrafico | null>(null);
  const claveDatos = datos.map((punto) => `${punto.label}-${punto.rendimiento}-${punto.carga}-${punto.estres}`).join('|');

  useEffect(() => {
    animacion.stopAnimation();
    animacion.setValue(0);
    const listener = animacion.addListener(({ value }) => setAvanceAnimado(value));
    Animated.timing(animacion, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => animacion.removeListener(listener);
  }, [animacion, claveDatos]);

  const ancho = 760;
  const alto = 330;
  const margen = { top: 24, right: 24, bottom: 54, left: 64 };
  const anchoInterno = ancho - margen.left - margen.right;
  const altoInterno = alto - margen.top - margen.bottom;
  const valoresY = [100, 75, 50, 25, 0];
  const datosSeguros = datos.length > 0 ? datos : [{ label: '', rendimiento: 0, carga: 0, estres: 0 }];

  const obtenerX = (indice: number) => margen.left + (datosSeguros.length === 1 ? anchoInterno / 2 : (indice / (datosSeguros.length - 1)) * anchoInterno);
  const obtenerY = (valor: number) => margen.top + altoInterno - (Math.max(0, Math.min(100, valor)) / 100) * altoInterno;
  const datosVisibles = useMemo(() => {
    if (datosSeguros.length <= 1) return datosSeguros;
    const cantidad = Math.max(1, Math.ceil((datosSeguros.length - 1) * avanceAnimado) + 1);
    return datosSeguros.slice(0, Math.min(cantidad, datosSeguros.length));
  }, [avanceAnimado, datosSeguros]);

  const obtenerXVisible = (indice: number) => margen.left + (datosSeguros.length === 1 ? anchoInterno / 2 : (indice / (datosSeguros.length - 1)) * anchoInterno);
  const puntosSerie = (clave: keyof Omit<PuntoGrafico, 'label'>) => datosVisibles.map((punto, indice) => `${obtenerXVisible(indice)},${obtenerY(punto[clave])}`).join(' ');
  const areaSerie = (clave: keyof Omit<PuntoGrafico, 'label'>) => {
    const ultimoIndice = Math.max(datosVisibles.length - 1, 0);
    const ultimoX = obtenerXVisible(ultimoIndice);
    return `${margen.left},${margen.top + altoInterno} ${puntosSerie(clave)} ${ultimoX},${margen.top + altoInterno}`;
  };

  const renderSerie = (clave: keyof Omit<PuntoGrafico, 'label'>, color: string, gradiente: string) => (
    <>
      <Polygon points={areaSerie(clave)} fill={`url(#${gradiente})`} />
      <Polyline points={puntosSerie(clave)} fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      {datosVisibles.map((punto, indice) => (
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

  return (
    <Animated.View style={[estilos.lineChartShell, { opacity: animacion, transform: [{ scale: animacion.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) }] }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${ancho} ${alto}`}>
        <Defs>
          <SvgLinearGradient id="rendimientoFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={BRAND.success} stopOpacity="0.32" />
            <Stop offset="100%" stopColor={BRAND.success} stopOpacity="0.02" />
          </SvgLinearGradient>
          <SvgLinearGradient id="cargaFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={BRAND.warning} stopOpacity="0.24" />
            <Stop offset="100%" stopColor={BRAND.warning} stopOpacity="0.02" />
          </SvgLinearGradient>
          <SvgLinearGradient id="estresFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={BRAND.error} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={BRAND.error} stopOpacity="0.02" />
          </SvgLinearGradient>
        </Defs>

        <Line x1={margen.left} y1={margen.top} x2={margen.left} y2={margen.top + altoInterno} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        {valoresY.map((valor) => {
          const y = obtenerY(valor);
          return (
            <React.Fragment key={valor}>
              <Line x1={margen.left} y1={y} x2={margen.left + anchoInterno} y2={y} stroke={valor === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(96,165,250,0.16)'} strokeWidth="1" />
              <SvgText x={margen.left - 18} y={y + 5} fill={BRAND.textMain} fontSize="14" fontWeight="900" textAnchor="end">{valor}</SvgText>
            </React.Fragment>
          );
        })}

        {renderSerie('carga', BRAND.warning, 'cargaFill')}
        {renderSerie('rendimiento', BRAND.success, 'rendimientoFill')}
        {renderSerie('estres', BRAND.error, 'estresFill')}

        {datosSeguros.map((punto, indice) => {
          const mostrar = datosSeguros.length <= 8 || indice % 2 === 0 || indice === datosSeguros.length - 1;
          if (!mostrar) return null;
          return (
            <SvgText key={`${punto.label}-${indice}`} x={obtenerX(indice)} y={alto - 18} fill={BRAND.textMain} fontSize="13" fontWeight="900" textAnchor="middle">
              {punto.label}
            </SvgText>
          );
        })}
      </Svg>
      <View style={estilos.chartTooltip}>
        <Text style={estilos.chartTooltipLabel}>{puntoActivo?.label || datosSeguros[datosSeguros.length - 1]?.label || 'Periodo'}</Text>
        <View style={estilos.chartTooltipValues}>
          <Text style={[estilos.chartTooltipValue, { color: BRAND.success }]}>R {puntoActivo?.rendimiento ?? datosSeguros[datosSeguros.length - 1]?.rendimiento ?? 0}%</Text>
          <Text style={[estilos.chartTooltipValue, { color: BRAND.warning }]}>C {puntoActivo?.carga ?? datosSeguros[datosSeguros.length - 1]?.carga ?? 0}%</Text>
          <Text style={[estilos.chartTooltipValue, { color: BRAND.error }]}>E {puntoActivo?.estres ?? datosSeguros[datosSeguros.length - 1]?.estres ?? 0}%</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const LegendItem = ({ color, label, value }: { color: string; label: string; value: string }) => (
  <View style={estilos.legendChartItem}>
    <View style={[estilos.legendChartDot, { backgroundColor: color }]} />
    <Text style={estilos.legendChartLabel}>{label}</Text>
    <Text style={[estilos.legendChartValue, { color }]}>{value}</Text>
  </View>
);

const estilos = StyleSheet.create({
  animatedScreen: {
    flex: 1,
    backgroundColor: BRAND.richBlack,
  },
  scrollView: {
    flex: 1,
    backgroundColor: BRAND.richBlack,
  },
  estadoCarga: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewContent: {
    padding: 20,
    paddingTop: 88,
    paddingBottom: 64,
  },
  header: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: BRAND.textMain,
    letterSpacing: 0,
  },
  headerSubtitle: {
    color: BRAND.textSec,
    fontWeight: '600',
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 0,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 9,
    backgroundColor: BRAND.success,
  },
  liveText: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  premiumCard: {
    backgroundColor: 'rgba(13,11,30,0.62)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(210,198,255,0.12)',
    overflow: 'hidden',
    ...sombraAdmin,
  },
  iconWrapperBase: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconWrapper_blue: {
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderColor: 'rgba(96,165,250,0.2)',
  },
  iconWrapper_success: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.22)',
  },
  iconWrapper_warning: {
    backgroundColor: 'rgba(245,158,11,0.11)',
    borderColor: 'rgba(245,158,11,0.24)',
  },
  iconWrapper_error: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.24)',
  },
  iconWrapper_violet: {
    backgroundColor: 'rgba(167,139,250,0.1)',
    borderColor: 'rgba(167,139,250,0.24)',
  },
  iconWrapper_cyan: {
    backgroundColor: 'rgba(34,211,238,0.1)',
    borderColor: 'rgba(34,211,238,0.24)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statsGridMobile: {
    gap: 16,
  },
  statCardContainer: {
    minHeight: 106,
  },
  statCard: {
    padding: 16,
    minHeight: 100,
    position: 'relative',
  },
  statAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: 'rgba(196,181,253,0.42)',
  },
  statCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: BRAND.textSec,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
    lineHeight: 13,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: BRAND.textMain,
    marginBottom: 8,
    letterSpacing: -0.6,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0,
  },
  topGrid: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 18,
  },
  detalleOperativoBar: {
    marginBottom: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(210,198,255,0.16)',
    backgroundColor: 'rgba(13,9,27,0.54)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  detalleOperativoTitulo: {
    color: BRAND.textMain,
    fontSize: 13,
    fontWeight: '900',
  },
  detalleOperativoTexto: {
    color: BRAND.textSec,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  detalleOperativoBoton: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.44)',
    backgroundColor: 'rgba(124,58,237,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  detalleOperativoBotonTexto: {
    color: BRAND.iconBright,
    fontSize: 11,
    fontWeight: '900',
  },
  detalleOperativoContenido: {
    gap: 0,
  },
  advancedGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  advancedCard: {
    flex: 1,
    minWidth: 320,
    padding: 16,
  },
  topGridMobile: {
    flexDirection: 'column',
  },
  anchoTotal: {
    width: '100%',
  },
  columnaPrincipal: {
    flex: 1.65,
  },
  columnaLateral: {
    flex: 0.95,
  },
  barChartCard: {
    padding: 18,
    minHeight: 340,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: BRAND.textMain,
    letterSpacing: 0,
  },
  chartSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: BRAND.textSec,
    letterSpacing: 0,
    marginTop: 4,
  },
  kpiInline: {
    alignItems: 'flex-end',
  },
  kpiInlineValue: {
    color: BRAND.success,
    fontSize: 26,
    fontWeight: '900',
  },
  kpiInlineLabel: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  chartActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(13,9,27,0.64)',
  },
  chartToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  chartToggleActivo: {
    backgroundColor: 'rgba(124,58,237,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.34)',
  },
  chartToggleText: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  chartToggleTextActivo: {
    color: BRAND.textMain,
  },
  lineChartShell: {
    height: 300,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(210,198,255,0.16)',
    backgroundColor: 'rgba(5,3,12,0.42)',
    overflow: 'hidden',
  },
  chartTooltip: {
    position: 'absolute',
    top: 14,
    right: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.16)',
    backgroundColor: 'rgba(5,3,12,0.78)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chartTooltipLabel: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  chartTooltipValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTooltipValue: {
    fontSize: 10,
    fontWeight: '900',
  },
  chartLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
  },
  legendChartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  legendChartDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  legendChartLabel: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  legendChartValue: {
    fontSize: 11,
    fontWeight: '900',
  },
  barChartArea: {
    height: 250,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 7,
  },
  barLabelBox: {
    backgroundColor: '#FFF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  barLabelText: {
    color: BRAND.richBlack,
    fontSize: 10,
    fontWeight: '900',
  },
  barTrack: {
    width: '100%',
    maxWidth: 46,
    height: 170,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.035)',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.10)',
  },
  bar: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  barMonthLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: BRAND.textSec,
    letterSpacing: 0.5,
    marginTop: 13,
  },
  barTinyLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(148,163,184,0.65)',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  moodCard: {
    padding: 18,
    alignItems: 'center',
    minHeight: 340,
  },
  priorityCard: {
    padding: 18,
    minHeight: 340,
  },
  moodCircleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  moodCircleTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodCircleValue: {
    fontSize: 38,
    fontWeight: '900',
    color: BRAND.textMain,
    letterSpacing: -0.5,
  },
  moodCircleLabel: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginTop: 4,
  },
  moodLegendContainer: {
    width: '100%',
    marginTop: 18,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.025)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.12)',
  },
  legendLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: BRAND.textSec,
    letterSpacing: 1,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '900',
    color: BRAND.textMain,
  },
  monitorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    marginBottom: 18,
  },
  panelCard: {
    flex: 1,
    minWidth: 320,
    padding: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 16,
  },
  panelTitle: {
    color: BRAND.textMain,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
  },
  panelSubtitle: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 4,
  },
  metricRows: {
    gap: 13,
  },
  metricRow: {
    gap: 10,
  },
  metricRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricRowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricLabel: {
    color: BRAND.textSec,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  metricValue: {
    color: BRAND.textMain,
    fontSize: 15,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  alertGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  miniKpi: {
    flex: 1,
    minHeight: 112,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.12)',
    backgroundColor: 'rgba(255,255,255,0.025)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  miniKpiValue: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 8,
  },
  miniKpiLabel: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 4,
  },
  bottomGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  listCard: {
    flex: 1,
    padding: 16,
    minWidth: 320,
  },
  listado: {
    gap: 12,
  },
  listadoCompacto: {
    gap: 10,
    marginTop: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.055)',
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listAvatarText: {
    fontSize: 12,
    fontWeight: '900',
  },
  listInfo: {
    flex: 1,
    minWidth: 0,
  },
  listTitle: {
    color: BRAND.textMain,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  listDetail: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },
  listBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  listBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  approvalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.055)',
  },
  approvalInfo: {
    flex: 1,
    minWidth: 0,
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approvalButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  approvalButtonSuccess: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.24)',
  },
  approvalButtonError: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.24)',
  },
  departmentRow: {
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.055)',
  },
  departmentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  departmentName: {
    color: BRAND.textMain,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  departmentValue: {
    color: BRAND.violet,
    fontSize: 14,
    fontWeight: '900',
  },
  emptyState: {
    minHeight: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.055)',
    backgroundColor: 'rgba(255,255,255,0.018)',
  },
  emptyText: {
    color: BRAND.textSec,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  activityCard: {
    padding: 16,
  },
  timeline: {
    gap: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.055)',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  timelineContent: {
    flex: 1,
    minWidth: 0,
  },
  timelineTitle: {
    color: BRAND.textMain,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  timelineMeta: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },
  timelineEstado: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroPanel: {
    minHeight: 246,
    marginBottom: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(210,198,255,0.16)',
    backgroundColor: 'rgba(13,11,30,0.58)',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    gap: 22,
    ...sombraVioleta,
  },
  heroGlowA: {
    position: 'absolute',
    right: 180,
    top: -110,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(37,99,235,0.30)',
  },
  heroGlowB: {
    position: 'absolute',
    right: -80,
    bottom: -120,
    width: 360,
    height: 280,
    borderRadius: 120,
    backgroundColor: 'rgba(168,85,247,0.26)',
  },
  heroCopy: {
    flex: 1,
    maxWidth: 640,
    zIndex: 2,
  },
  heroKicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  heroKickerDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#C084FC',
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
  },
  heroEyebrow: {
    color: '#D8CAFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: BRAND.textMain,
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 36,
  },
  heroText: {
    color: BRAND.textSec,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 24,
    maxWidth: 620,
    marginTop: 12,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  heroButtonGlow: {
    borderRadius: 999,
    padding: 1,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.26,
    shadowRadius: 34,
  },
  heroButton: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 13,
    backgroundColor: 'rgba(13,9,27,0.92)',
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  heroMetricPill: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  heroMetricValue: {
    color: BRAND.textMain,
    fontSize: 15,
    fontWeight: '900',
  },
  heroMetricLabel: {
    color: BRAND.textSec,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroDashboardShell: {
    width: 390,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(210,198,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    overflow: 'hidden',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 28 },
    shadowOpacity: 0.262,
    shadowRadius: 90,
  },
  heroWindowBar: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(210,198,255,0.16)',
    backgroundColor: 'rgba(6,5,18,0.72)',
  },
  heroWindowDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  heroWindowTitle: {
    marginLeft: 'auto',
    color: BRAND.textSec,
    fontSize: 12,
    fontWeight: '800',
  },
  heroDashboardGrid: {
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroPanelCard: {
    width: '48%',
    minHeight: 82,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(210,198,255,0.14)',
    backgroundColor: 'rgba(13,9,27,0.68)',
    padding: 14,
  },
  heroPanelMain: {
    width: '100%',
    minHeight: 112,
  },
  heroPanelLabel: {
    color: BRAND.textSec,
    fontSize: 11,
    fontWeight: '800',
  },
  heroPanelValue: {
    color: BRAND.textMain,
    fontSize: 33,
    fontWeight: '900',
    marginTop: 4,
  },
  heroPanelStrong: {
    color: BRAND.textMain,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 8,
  },
  heroPanelText: {
    color: BRAND.textSec,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  heroChart: {
    position: 'absolute',
    right: 16,
    bottom: 14,
    height: 82,
    width: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 9,
  },
  heroChartBar: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: '#C084FC',
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.26,
    shadowRadius: 14,
  },
  heroPanelTable: {
    width: '100%',
    gap: 9,
  },
  heroTableRow: {
    minHeight: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.055)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  heroTableText: {
    color: BRAND.textMain,
    fontSize: 11,
    fontWeight: '800',
  },
  heroTableStatus: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#A855F7',
  },
});
