import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View, Text, ScrollView, Dimensions, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient as SvgLinearGradient, Polygon, Polyline, Stop, Text as SvgText } from 'react-native-svg';
import { addDoc, collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import {
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Activity,
  MoreVertical,
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

const PremiumCard = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <View style={[estilos.premiumCard, style]}>
    {children}
  </View>
);

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
    const checkInsHoy = checkIns.filter((checkIn) => mismoDia(obtenerFecha(checkIn.fecha || checkIn.timestamp))).length;
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
          id: checkIn.id || checkIn.userId || `${checkIn.fecha}-${checkIn.estres}`,
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
          id: checkIn.id || checkIn.userId || Math.random().toString(),
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
      label: "Empleados Activos",
      val: metricas.activos.toString(),
      trend: `${usuarios.length} registrados`,
      tono: 'success' as const,
      icon: <Users size={24} color={BRAND.success} />,
    },
    {
      label: "Costo Mensual de Planilla",
      val: formatearMoneda(metricas.costoMensual),
      trend: `${metricas.payrollProcesando} pagos abiertos`,
      tono: 'blue' as const,
      icon: <DollarSign size={24} color={BRAND.iconBright} />,
    },
    {
      label: "Productividad General",
      val: `${metricas.productividad}%`,
      trend: `${metricas.tareasPendientes} tareas pendientes`,
      tono: metricas.productividad >= 75 ? 'success' as const : 'warning' as const,
      icon: <ClipboardList size={24} color={metricas.productividad >= 75 ? BRAND.success : BRAND.warning} />,
    },
    {
      label: "Riesgo Operativo",
      val: `${metricas.riesgo}%`,
      trend: `${metricas.aprobacionesPendientes} aprobaciones pendientes`,
      tono: metricas.riesgo > 45 || metricas.alertas > 0 ? 'error' as const : 'cyan' as const,
      icon: <AlertTriangle size={24} color={metricas.riesgo > 45 || metricas.alertas > 0 ? BRAND.error : BRAND.cyan} />,
    }
  ];

  const positiveStroke = (metricas.bienestar / 100) * 251;
  const neutralStroke = (metricas.neutral / 100) * 251;
  const riskStroke = (metricas.riesgo / 100) * 251;
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
          <Text style={estilos.headerTitle}>Panel Ejecutivo</Text>
          <Text style={estilos.headerSubtitle}>Centro de mando para empleados, operación y bienestar</Text>
        </View>
        <View style={estilos.livePill}>
          <View style={estilos.liveDot} />
          <Text style={estilos.liveText}>Nexus System Live</Text>
        </View>
      </View>

      <HeroTrustPanel activos={metricas.activos} aprobaciones={metricas.aprobacionesPendientes} productividad={metricas.productividad} />

      <View style={[estilos.statsGrid, !isTabletOrWeb && estilos.statsGridMobile]}>
        {stats.map((stat, i) => (
          <View key={stat.label} style={[estilos.statCardContainer, { width: isTabletOrWeb ? '23.5%' : '48%' }]}>
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
                <IconWrapper tono="cyan"><Activity size={20} color={BRAND.cyan} /></IconWrapper>
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
          <PremiumCard style={estilos.moodCard}>
            <View style={estilos.chartHeader}>
              <Text style={estilos.chartTitle}>Nexus-Mood IA</Text>
              <MoreVertical size={18} color={BRAND.textSec} />
            </View>

            <View style={estilos.moodCircleContainer}>
              <Svg height="190" width="190" viewBox="0 0 100 100" style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
                <Circle cx="50" cy="50" r="40" fill="transparent" stroke={BRAND.success} strokeWidth="12" strokeDasharray={`${positiveStroke} 251`} strokeLinecap="round" />
                <Circle cx="50" cy="50" r="40" fill="transparent" stroke={BRAND.warning} strokeWidth="12" strokeDasharray={`${neutralStroke} 251`} strokeDashoffset={-positiveStroke} strokeLinecap="round" />
                <Circle cx="50" cy="50" r="40" fill="transparent" stroke={BRAND.error} strokeWidth="12" strokeDasharray={`${riskStroke} 251`} strokeDashoffset={-(positiveStroke + neutralStroke)} strokeLinecap="round" />
              </Svg>
              <View style={estilos.moodCircleTextContainer}>
                <Text style={estilos.moodCircleValue}>{metricas.bienestar}%</Text>
                <Text style={[estilos.moodCircleLabel, { color: metricas.bienestar >= 70 ? BRAND.success : metricas.bienestar >= 45 ? BRAND.warning : BRAND.error }]}>
                  {metricas.bienestar >= 70 ? 'ÓPTIMO' : metricas.bienestar >= 45 ? 'OBSERVAR' : 'CRÍTICO'}
                </Text>
              </View>
            </View>

            <View style={estilos.moodLegendContainer}>
              <View style={estilos.legendItem}>
                <View style={estilos.legendLabelContainer}>
                  <View style={[estilos.legendDot, { backgroundColor: BRAND.success }]} />
                  <Text style={estilos.legendText}>Bienestar</Text>
                </View>
                <Text style={estilos.legendValue}>{metricas.bienestar}%</Text>
              </View>
              <View style={estilos.legendItem}>
                <View style={estilos.legendLabelContainer}>
                  <View style={[estilos.legendDot, { backgroundColor: BRAND.warning }]} />
                  <Text style={estilos.legendText}>Carga</Text>
                </View>
                <Text style={estilos.legendValue}>{metricas.neutral}%</Text>
              </View>
              <View style={estilos.legendItem}>
                <View style={estilos.legendLabelContainer}>
                  <View style={[estilos.legendDot, { backgroundColor: BRAND.error }]} />
                  <Text style={estilos.legendText}>Riesgo</Text>
                </View>
                <Text style={estilos.legendValue}>{metricas.riesgo}%</Text>
              </View>
            </View>
          </PremiumCard>
        </View>
      </View>

      <PremiumCard style={estilos.checkInResultsCard}>
        <View style={estilos.panelHeader}>
          <View>
            <Text style={estilos.panelTitle}>Resultados del Check-in de Hoy</Text>
            <Text style={estilos.panelSubtitle}>Lectura directa de bienestar, energía, carga y estrés en tiempo real</Text>
          </View>
          <IconWrapper tono="error"><HeartPulse size={20} color={BRAND.error} /></IconWrapper>
        </View>
        <CheckInResultsPanel
          checkIns={metricas.checkInsHoyDetalle}
          distribucion={metricas.energiaDistribucion}
          participacion={metricas.participacion}
          totalActivos={metricas.activos}
          compacto={!isTabletOrWeb}
        />
      </PremiumCard>

      <View style={[estilos.operationalGrid, !isTabletOrWeb && estilos.topGridMobile]}>
        <PremiumCard style={estilos.operationalCard}>
          <View style={estilos.panelHeader}>
            <View>
              <Text style={estilos.panelTitle}>Pulso Operativo en Vivo</Text>
              <Text style={estilos.panelSubtitle}>Asistencia, carga, productividad y riesgo con datos Firebase</Text>
            </View>
            <IconWrapper tono="violet"><Activity size={20} color={BRAND.violet} /></IconWrapper>
          </View>
          <OperationalBarsChart
            datos={[
              { label: 'Activos', valor: metricas.activos, total: Math.max(usuarios.length, metricas.activos, 1), color: BRAND.success, detalle: `${metricas.empleadosConectados} conectados ahora` },
              { label: 'Asistencia', valor: metricas.entradasHoy, total: Math.max(metricas.activos, 1), color: BRAND.cyan, detalle: `${metricas.retrasos} retrasos registrados` },
              { label: 'Productividad', valor: metricas.productividad, total: 100, color: BRAND.violet, detalle: `${metricas.tareasCompletadas} tareas completadas` },
              { label: 'Aprobaciones', valor: metricas.aprobacionesPendientes, total: Math.max(metricas.aprobacionesPendientes + metricas.tareasPendientes, 1), color: BRAND.warning, detalle: `${metricas.ausenciasPendientes} ausencias por revisar` },
              { label: 'Riesgo', valor: metricas.riesgo, total: 100, color: BRAND.error, detalle: `${metricas.incidenciasAbiertas} incidencias abiertas` },
            ]}
          />
        </PremiumCard>

        <PremiumCard style={estilos.operationalSideCard}>
          <View style={estilos.panelHeader}>
            <View>
              <Text style={estilos.panelTitle}>Estado de Tareas</Text>
              <Text style={estilos.panelSubtitle}>Pendiente, progreso y completado</Text>
            </View>
            <IconWrapper tono="warning"><ClipboardList size={20} color={BRAND.warning} /></IconWrapper>
          </View>
          <TaskDistributionChart
            pendientes={metricas.tareasPendientes}
            progreso={metricas.tareasProgreso}
            completadas={metricas.tareasCompletadas}
          />
        </PremiumCard>
      </View>

      <View style={estilos.monitorGrid}>
        <PremiumCard style={estilos.panelCard}>
          <View style={estilos.panelHeader}>
            <View>
              <Text style={estilos.panelTitle}>Monitoreo de Plantilla</Text>
              <Text style={estilos.panelSubtitle}>Estado operativo de empleados</Text>
            </View>
            <IconWrapper tono="success"><UserCheck size={20} color={BRAND.success} /></IconWrapper>
          </View>
          <View style={estilos.metricRows}>
            <MetricRow icon={<UserCheck size={16} color={BRAND.success} />} label="Conectados" value={metricas.empleadosConectados} total={metricas.activos} color={BRAND.success} />
            <MetricRow icon={<PauseCircle size={16} color={BRAND.warning} />} label="En pausa" value={metricas.pausasActivas} total={metricas.activos} color={BRAND.warning} />
            <MetricRow icon={<UserX size={16} color={BRAND.error} />} label="Ausentes" value={metricas.empleadosAusentes} total={metricas.activos} color={BRAND.error} />
            <MetricRow icon={<Timer size={16} color={BRAND.cyan} />} label="Check-in de hoy" value={metricas.checkInsHoy} total={metricas.activos} color={BRAND.cyan} />
          </View>
        </PremiumCard>

        <PremiumCard style={estilos.panelCard}>
          <View style={estilos.panelHeader}>
            <View>
              <Text style={estilos.panelTitle}>Carga de Trabajo</Text>
              <Text style={estilos.panelSubtitle}>Tareas y prioridad</Text>
            </View>
            <IconWrapper tono="warning"><ClipboardList size={20} color={BRAND.warning} /></IconWrapper>
          </View>
          <View style={estilos.metricRows}>
            <MetricRow icon={<CircleDot size={16} color={BRAND.warning} />} label="Pendientes" value={metricas.tareasPendientes} total={tareas.length} color={BRAND.warning} />
            <MetricRow icon={<Clock3 size={16} color={BRAND.error} />} label="Vencidas" value={metricas.tareasVencidas} total={tareas.length} color={BRAND.error} />
            <MetricRow icon={<Zap size={16} color={BRAND.iconBright} />} label="En progreso" value={metricas.tareasProgreso} total={tareas.length} color={BRAND.iconBright} />
            <MetricRow icon={<CheckCircle2 size={16} color={BRAND.success} />} label="Completadas" value={metricas.tareasCompletadas} total={tareas.length} color={BRAND.success} />
          </View>
        </PremiumCard>

        <PremiumCard style={estilos.panelCard}>
          <View style={estilos.panelHeader}>
            <View>
              <Text style={estilos.panelTitle}>Alertas RRHH</Text>
              <Text style={estilos.panelSubtitle}>Bienestar y solicitudes</Text>
            </View>
            <IconWrapper tono="error"><HeartPulse size={20} color={BRAND.error} /></IconWrapper>
          </View>
          <View style={estilos.alertGrid}>
            <MiniKpi icon={<Flame size={18} color={BRAND.error} />} label="Incidencias" value={metricas.incidenciasAbiertas} color={BRAND.error} />
            <MiniKpi icon={<CalendarClock size={18} color={BRAND.warning} />} label="Aprobaciones" value={metricas.aprobacionesPendientes} color={BRAND.warning} />
            <MiniKpi icon={<Bell size={18} color={BRAND.violet} />} label="Inbox crítico" value={metricas.inboxCritico} color={BRAND.violet} />
          </View>
        </PremiumCard>
      </View>

      <View style={estilos.monitorGrid}>
        <PremiumCard style={estilos.panelCard}>
          <View style={estilos.panelHeader}>
            <View>
              <Text style={estilos.panelTitle}>Monitor de Asistencia</Text>
              <Text style={estilos.panelSubtitle}>Jornada en tiempo real desde empleado</Text>
            </View>
            <IconWrapper tono="cyan"><Timer size={20} color={BRAND.cyan} /></IconWrapper>
          </View>
          <View style={estilos.metricRows}>
            <MetricRow icon={<UserCheck size={16} color={BRAND.success} />} label="Entradas hoy" value={metricas.entradasHoy} total={metricas.activos} color={BRAND.success} />
            <MetricRow icon={<Clock3 size={16} color={BRAND.warning} />} label="Retrasos" value={metricas.retrasos} total={metricas.activos} color={BRAND.warning} />
            <MetricRow icon={<PauseCircle size={16} color={BRAND.violet} />} label="Pausas activas" value={metricas.pausasActivas} total={metricas.activos} color={BRAND.violet} />
            <MetricRow icon={<Zap size={16} color={BRAND.cyan} />} label="Horas extra" value={metricas.horasExtra} total={Math.max(metricas.horasExtra, metricas.activos)} color={BRAND.cyan} />
          </View>
        </PremiumCard>

        <PremiumCard style={estilos.panelCard}>
          <View style={estilos.panelHeader}>
            <View>
              <Text style={estilos.panelTitle}>Centro de Aprobaciones</Text>
              <Text style={estilos.panelSubtitle}>Ausencias y solicitudes internas</Text>
            </View>
            <IconWrapper tono="warning"><Inbox size={20} color={BRAND.warning} /></IconWrapper>
          </View>
          <View style={estilos.listadoCompacto}>
            {metricas.solicitudesPendientes.length > 0 ? metricas.solicitudesPendientes.map((item) => (
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

        <PremiumCard style={estilos.panelCard}>
          <View style={estilos.panelHeader}>
            <View>
              <Text style={estilos.panelTitle}>Alertas Operativas</Text>
              <Text style={estilos.panelSubtitle}>Inbox, feedback y documentos</Text>
            </View>
            <IconWrapper tono="error"><MessageSquareWarning size={20} color={BRAND.error} /></IconWrapper>
          </View>
          <View style={estilos.alertGrid}>
            <MiniKpi icon={<Inbox size={18} color={BRAND.error} />} label="Urgentes" value={metricas.inboxCritico} color={BRAND.error} />
            <MiniKpi icon={<MessageSquareWarning size={18} color={BRAND.warning} />} label="Feedback" value={metricas.incidenciasAbiertas} color={BRAND.warning} />
            <MiniKpi icon={<FileText size={18} color={BRAND.cyan} />} label="Documentos" value={metricas.documentosPendientes} color={BRAND.cyan} />
          </View>
          <View style={estilos.listadoCompacto}>
            {metricas.alertasOperativas.length > 0 ? metricas.alertasOperativas.map((alerta) => (
              <ListItem key={alerta.id} inicial="!" titulo={alerta.titulo} detalle={alerta.detalle} badge="Abierta" color={alerta.color} />
            )) : (
              <EmptyState texto="Sin alertas abiertas" />
            )}
          </View>
        </PremiumCard>
      </View>

      <View style={[estilos.bottomGrid, !isTabletOrWeb && estilos.topGridMobile]}>
        <PremiumCard style={estilos.listCard}>
          <View style={estilos.panelHeader}>
            <View>
              <Text style={estilos.panelTitle}>Empleados en Seguimiento</Text>
              <Text style={estilos.panelSubtitle}>Estrés o carga elevada</Text>
            </View>
            <IconWrapper tono="error"><AlertTriangle size={20} color={BRAND.error} /></IconWrapper>
          </View>
          <View style={estilos.listado}>
            {metricas.empleadosRiesgo.length > 0 ? metricas.empleadosRiesgo.map((empleado) => (
              <ListItem key={empleado.id} inicial={empleado.nombre[0]} titulo={empleado.nombre} detalle={empleado.depto} badge={`Estrés ${empleado.estres}/5`} color={BRAND.error} />
            )) : (
              <EmptyState texto="Sin empleados en riesgo alto" />
            )}
          </View>
        </PremiumCard>

        <PremiumCard style={estilos.listCard}>
          <View style={estilos.panelHeader}>
            <View>
              <Text style={estilos.panelTitle}>Check-ins Pendientes</Text>
              <Text style={estilos.panelSubtitle}>Empleados activos sin pulso de hoy</Text>
            </View>
            <IconWrapper tono="cyan"><Timer size={20} color={BRAND.cyan} /></IconWrapper>
          </View>
          <View style={estilos.listado}>
            {metricas.empleadosSinCheckIn.length > 0 ? metricas.empleadosSinCheckIn.map((empleado) => (
              <ListItem key={empleado.id || empleado.correo} inicial={(empleado.nombre || '?')[0]} titulo={empleado.nombre || 'Empleado'} detalle={empleado.departamento || 'Sin departamento'} badge="Pendiente" color={BRAND.cyan} />
            )) : (
              <EmptyState texto="Check-ins al día" />
            )}
          </View>
        </PremiumCard>

        <PremiumCard style={estilos.listCard}>
          <View style={estilos.panelHeader}>
            <View>
              <Text style={estilos.panelTitle}>Departamentos</Text>
              <Text style={estilos.panelSubtitle}>Distribución de plantilla</Text>
            </View>
            <IconWrapper tono="violet"><Building2 size={20} color={BRAND.violet} /></IconWrapper>
          </View>
          <View style={estilos.listado}>
            {metricas.topDepartamentos.length > 0 ? metricas.topDepartamentos.map((depto) => (
              <DepartmentRow key={depto.nombre} nombre={depto.nombre} total={depto.total} share={depto.share} />
            )) : (
              <EmptyState texto="Sin departamentos registrados" />
            )}
          </View>
        </PremiumCard>
      </View>

      <PremiumCard style={estilos.activityCard}>
        <View style={estilos.panelHeader}>
          <View>
            <Text style={estilos.panelTitle}>Actividad Reciente</Text>
            <Text style={estilos.panelSubtitle}>Eventos de auditoría en tiempo real</Text>
          </View>
          <IconWrapper tono="blue"><ShieldCheck size={20} color={BRAND.iconBright} /></IconWrapper>
        </View>
        <View style={estilos.timeline}>
          {metricas.actividad.length > 0 ? metricas.actividad.map((log) => (
            <View key={log.id} style={estilos.timelineItem}>
              <View style={[estilos.timelineDot, { backgroundColor: log.estado === 'Error' ? BRAND.error : log.estado === 'Warning' ? BRAND.warning : BRAND.success }]} />
              <View style={estilos.timelineContent}>
                <Text style={estilos.timelineTitle}>{log.accion || 'Evento del sistema'}</Text>
                <Text style={estilos.timelineMeta}>{log.usuarioNombre || 'Sistema'} · {log.modulo || 'General'} · {log.timestamp || ''}</Text>
              </View>
              <Text style={[estilos.timelineEstado, { color: log.estado === 'Error' ? BRAND.error : log.estado === 'Warning' ? BRAND.warning : BRAND.success }]}>{log.estado || 'Success'}</Text>
            </View>
          )) : (
            <EmptyState texto="Sin actividad reciente" />
          )}
        </View>
      </PremiumCard>
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

const MiniKpi = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) => (
  <View style={estilos.miniKpi}>
    {icon}
    <Text style={[estilos.miniKpiValue, { color }]}>{value}</Text>
    <Text style={estilos.miniKpiLabel}>{label}</Text>
  </View>
);

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

const DepartmentRow = ({ nombre, total, share }: { nombre: string; total: number; share: number }) => (
  <View style={estilos.departmentRow}>
    <View style={estilos.departmentTop}>
      <Text style={estilos.departmentName}>{nombre}</Text>
      <Text style={estilos.departmentValue}>{total}</Text>
    </View>
    <View style={estilos.progressTrack}>
      <View style={[estilos.progressFill, { width: `${Math.max(share, 4)}%`, backgroundColor: BRAND.violet }]} />
    </View>
  </View>
);

type BarraOperativa = {
  label: string;
  valor: number;
  total: number;
  color: string;
  detalle?: string;
};

type CheckInResultado = {
  id: string;
  nombre: string;
  departamento: string;
  estres: number;
  carga: number;
  balance: number;
  energia: string;
  bienestar: number;
  fecha: Date | null;
};

const CheckInResultsPanel = ({
  checkIns,
  distribucion,
  participacion,
  totalActivos,
  compacto,
}: {
  checkIns: CheckInResultado[];
  distribucion: { alto: number; medio: number; bajo: number };
  participacion: number;
  totalActivos: number;
  compacto?: boolean;
}) => {
  const totalCheckIns = checkIns.length;
  const promedioBienestar = totalCheckIns > 0
    ? Math.round(checkIns.reduce((total, item) => total + item.bienestar, 0) / totalCheckIns)
    : 0;
  const promedioEstres = totalCheckIns > 0
    ? (checkIns.reduce((total, item) => total + item.estres, 0) / totalCheckIns).toFixed(1)
    : '0.0';
  const promedioCarga = totalCheckIns > 0
    ? (checkIns.reduce((total, item) => total + item.carga, 0) / totalCheckIns).toFixed(1)
    : '0.0';
  const totalEnergia = Math.max(distribucion.alto + distribucion.medio + distribucion.bajo, 1);

  return (
    <View style={[estilos.checkInResultsGrid, compacto && estilos.checkInResultsGridCompact]}>
      <View style={[estilos.checkInSummary, compacto && estilos.checkInSummaryCompact]}>
        <View style={estilos.checkInRingWrap}>
          <Svg width="158" height="158" viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="38" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.06)" strokeWidth="11" />
            <Circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke={promedioBienestar >= 70 ? BRAND.success : promedioBienestar >= 45 ? BRAND.warning : BRAND.error}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={`${(promedioBienestar / 100) * 239} 239`}
              transform="rotate(-90 50 50)"
            />
          </Svg>
          <View style={estilos.checkInRingText}>
            <Text style={estilos.checkInRingValue}>{promedioBienestar}%</Text>
            <Text style={estilos.checkInRingLabel}>Bienestar</Text>
          </View>
        </View>
        <View style={estilos.checkInKpiGrid}>
          <MiniCheckInStat label="Participación" value={`${participacion}%`} detail={`${totalCheckIns}/${totalActivos} activos`} color={BRAND.cyan} />
          <MiniCheckInStat label="Estrés prom." value={promedioEstres} detail="escala 1-5" color={BRAND.error} />
          <MiniCheckInStat label="Carga prom." value={promedioCarga} detail="escala 1-5" color={BRAND.warning} />
        </View>
        <View style={estilos.energyStrip}>
          <EnergySegment label="Alta" value={distribucion.alto} total={totalEnergia} color={BRAND.success} />
          <EnergySegment label="Media" value={distribucion.medio} total={totalEnergia} color={BRAND.warning} />
          <EnergySegment label="Baja" value={distribucion.bajo} total={totalEnergia} color={BRAND.error} />
        </View>
      </View>

      <View style={estilos.checkInPeopleList}>
        {checkIns.length > 0 ? checkIns.map((item) => (
          <View key={item.id} style={estilos.checkInPersonRow}>
            <View style={[estilos.checkInPersonAvatar, { borderColor: item.bienestar >= 70 ? `${BRAND.success}55` : item.bienestar >= 45 ? `${BRAND.warning}55` : `${BRAND.error}55` }]}>
              <Text style={estilos.checkInPersonInitial}>{item.nombre[0]?.toUpperCase() || '?'}</Text>
            </View>
            <View style={estilos.checkInPersonInfo}>
              <Text style={estilos.checkInPersonName} numberOfLines={1}>{item.nombre}</Text>
              <Text style={estilos.checkInPersonMeta} numberOfLines={1}>{item.departamento} · energía {item.energia}</Text>
            </View>
            <View style={estilos.checkInBadges}>
              <Text style={[estilos.checkInBadge, { color: BRAND.error }]}>E {item.estres}/5</Text>
              <Text style={[estilos.checkInBadge, { color: BRAND.warning }]}>C {item.carga}/5</Text>
              <Text style={[estilos.checkInBadge, { color: BRAND.success }]}>{item.bienestar}%</Text>
            </View>
          </View>
        )) : (
          <EmptyState texto="Aún no hay check-ins de hoy" />
        )}
      </View>
    </View>
  );
};

const MiniCheckInStat = ({ label, value, detail, color }: { label: string; value: string; detail: string; color: string }) => (
  <View style={estilos.checkInMiniStat}>
    <Text style={[estilos.checkInMiniValue, { color }]}>{value}</Text>
    <Text style={estilos.checkInMiniLabel}>{label}</Text>
    <Text style={estilos.checkInMiniDetail}>{detail}</Text>
  </View>
);

const EnergySegment = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => {
  const ancho = Math.max(5, Math.round((value / total) * 100));
  return (
    <View style={estilos.energySegment}>
      <View style={estilos.energyHeader}>
        <Text style={estilos.energyLabel}>{label}</Text>
        <Text style={[estilos.energyValue, { color }]}>{value}</Text>
      </View>
      <View style={estilos.energyTrack}>
        <View style={[estilos.energyFill, { width: `${ancho}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const OperationalBarsChart = ({ datos }: { datos: BarraOperativa[] }) => {
  const animacion = useRef(new Animated.Value(0)).current;
  const [avance, setAvance] = useState(0);
  const [activo, setActivo] = useState<BarraOperativa | null>(null);
  const claveDatos = datos.map((item) => `${item.label}-${item.valor}-${item.total}`).join('|');

  useEffect(() => {
    animacion.stopAnimation();
    animacion.setValue(0);
    const listener = animacion.addListener(({ value }) => setAvance(value));
    Animated.timing(animacion, {
      toValue: 1,
      duration: 820,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => animacion.removeListener(listener);
  }, [animacion, claveDatos]);

  return (
    <View style={estilos.operationalPulseGrid}>
      {datos.map((item, indice) => {
        const porcentajeItem = item.total > 0 ? Math.min(100, Math.round((item.valor / item.total) * 100)) : 0;
        const progreso = porcentajeItem * avance;
        const radio = 32;
        const circunferencia = 2 * Math.PI * radio;
        const dash = (progreso / 100) * circunferencia;

        return (
          <TouchableOpacity
            key={item.label}
            activeOpacity={0.88}
            onPress={() => setActivo(item)}
            style={[estilos.operationalPulseCard, activo?.label === item.label && estilos.operationalPulseCardActive]}
          >
            <View style={estilos.operationalPulseHalo} />
            <Svg width="86" height="86" viewBox="0 0 86 86">
              <Circle cx="43" cy="43" r={radio} fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
              <Circle
                cx="43"
                cy="43"
                r={radio}
                fill="transparent"
                stroke={item.color}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circunferencia}`}
                transform="rotate(-90 43 43)"
              />
              <SvgText x="43" y="40" fill={BRAND.textMain} fontSize="16" fontWeight="900" textAnchor="middle">{porcentajeItem}%</SvgText>
              <SvgText x="43" y="56" fill={BRAND.textSec} fontSize="8" fontWeight="900" textAnchor="middle">LIVE</SvgText>
            </Svg>
            <View style={estilos.operationalPulseInfo}>
              <Text style={estilos.operationalPulseLabel}>{item.label}</Text>
              <Text style={estilos.operationalPulseValue}>{item.valor}<Text style={estilos.operationalPulseBase}> / {item.total}</Text></Text>
              <Text style={estilos.operationalPulseDetail} numberOfLines={2}>{item.detalle || 'Actualizado en tiempo real'}</Text>
            </View>
            <View style={[estilos.operationalPulseAccent, { backgroundColor: item.color }]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const TaskDistributionChart = ({ pendientes, progreso, completadas }: { pendientes: number; progreso: number; completadas: number }) => {
  const total = pendientes + progreso + completadas;
  const datos = [
    { label: 'Pendiente', valor: pendientes, color: BRAND.warning },
    { label: 'Progreso', valor: progreso, color: BRAND.violet },
    { label: 'Completada', valor: completadas, color: BRAND.success },
  ];

  return (
    <View style={estilos.taskChart}>
      {datos.map((item) => {
        const ancho = total > 0 ? Math.max(8, Math.round((item.valor / total) * 100)) : 0;
        return (
          <View key={item.label} style={estilos.taskSegmentRow}>
            <View style={estilos.taskSegmentHeader}>
              <Text style={estilos.taskSegmentLabel}>{item.label}</Text>
              <Text style={[estilos.taskSegmentValue, { color: item.color }]}>{item.valor}</Text>
            </View>
            <View style={estilos.taskSegmentTrack}>
              <View style={[estilos.taskSegmentFill, { width: `${ancho}%`, backgroundColor: item.color }]} />
            </View>
          </View>
        );
      })}
      <View style={estilos.taskTotalBox}>
        <Text style={estilos.taskTotalValue}>{total}</Text>
        <Text style={estilos.taskTotalLabel}>Tareas monitoreadas</Text>
      </View>
    </View>
  );
};

const EmptyState = ({ texto }: { texto: string }) => (
  <View style={estilos.emptyState}>
    <Text style={estilos.emptyText}>{texto}</Text>
  </View>
);

const HeroTrustPanel = ({ activos, aprobaciones, productividad }: { activos: number; aprobaciones: number; productividad: number }) => (
  <View style={estilos.heroPanel}>
    <View style={estilos.heroGlowA} />
    <View style={estilos.heroGlowB} />
    <View style={estilos.heroCopy}>
      <Text style={estilos.heroEyebrow}>Admin Control Center</Text>
      <Text style={estilos.heroTitle}>Built on Trust and Standards</Text>
      <Text style={estilos.heroText}>Supervisa plantilla, nómina, bienestar y auditoría con señales en vivo y acciones listas para resolver.</Text>
      <View style={estilos.heroActions}>
        <View style={estilos.heroButton}>
          <Text style={estilos.heroButtonText}>Start Now</Text>
        </View>
        <View style={estilos.heroMetricPill}>
          <Text style={estilos.heroMetricValue}>{activos}</Text>
          <Text style={estilos.heroMetricLabel}>Activos</Text>
        </View>
        <View style={estilos.heroMetricPill}>
          <Text style={estilos.heroMetricValue}>{productividad}%</Text>
          <Text style={estilos.heroMetricLabel}>Productividad</Text>
        </View>
      </View>
    </View>
    <View style={estilos.heroCrystalWrap}>
      <Svg width="220" height="150" viewBox="0 0 220 150">
        <Defs>
          <SvgLinearGradient id="crystalCore" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
            <Stop offset="45%" stopColor="#C4B5FD" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#4C1D95" stopOpacity="0.92" />
          </SvgLinearGradient>
          <SvgLinearGradient id="crystalShadow" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#B69CFF" stopOpacity="0.05" />
            <Stop offset="100%" stopColor="#B69CFF" stopOpacity="0.52" />
          </SvgLinearGradient>
        </Defs>
        <Polygon points="110,10 154,34 176,82 110,136 44,82 66,34" fill="url(#crystalCore)" stroke="rgba(255,255,255,0.62)" strokeWidth="1.4" />
        <Polygon points="110,10 110,136 66,34" fill="rgba(255,255,255,0.20)" />
        <Polygon points="110,10 154,34 110,136" fill="rgba(76,29,149,0.34)" />
        <Polygon points="44,82 110,136 18,136" fill="url(#crystalShadow)" />
        <Polygon points="176,82 110,136 204,136" fill="url(#crystalShadow)" />
        <Line x1="44" y1="82" x2="176" y2="82" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        <Line x1="66" y1="34" x2="154" y2="34" stroke="rgba(255,255,255,0.32)" strokeWidth="1" />
      </Svg>
      <View style={estilos.heroGlassMetric}>
        <Text style={estilos.heroMetricValue}>{aprobaciones}</Text>
        <Text style={estilos.heroMetricLabel}>Pendientes</Text>
      </View>
    </View>
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
    padding: 24,
    paddingTop: 84,
    paddingBottom: 64,
  },
  header: {
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: BRAND.textMain,
    letterSpacing: -1,
  },
  headerSubtitle: {
    color: BRAND.textSec,
    fontWeight: '600',
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.4,
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
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  premiumCard: {
    backgroundColor: ADMIN.fondoElevado,
    borderRadius: ADMIN.radio,
    borderWidth: 1,
    borderColor: ADMIN.borde,
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
    marginBottom: 14,
  },
  statsGridMobile: {
    gap: 16,
  },
  statCardContainer: {
    minHeight: 106,
  },
  statCard: {
    padding: 15,
    minHeight: 106,
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
    fontSize: 9,
    fontWeight: '900',
    color: BRAND.textSec,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
    lineHeight: 13,
  },
  statValue: {
    fontSize: 23,
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
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  topGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  operationalGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  checkInResultsCard: {
    padding: 18,
    marginBottom: 14,
  },
  checkInResultsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  checkInResultsGridCompact: {
    flexDirection: 'column',
  },
  checkInSummary: {
    width: 430,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.12)',
    backgroundColor: 'rgba(255,255,255,0.028)',
    padding: 16,
  },
  checkInSummaryCompact: {
    width: '100%',
  },
  checkInRingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 168,
  },
  checkInRingText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInRingValue: {
    color: BRAND.textMain,
    fontSize: 32,
    fontWeight: '900',
  },
  checkInRingLabel: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  checkInKpiGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  checkInMiniStat: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.10)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    padding: 11,
  },
  checkInMiniValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  checkInMiniLabel: {
    color: BRAND.textMain,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 3,
  },
  checkInMiniDetail: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 3,
  },
  energyStrip: {
    gap: 10,
    marginTop: 14,
  },
  energySegment: {
    gap: 7,
  },
  energyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  energyLabel: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  energyValue: {
    fontSize: 11,
    fontWeight: '900',
  },
  energyTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.055)',
  },
  energyFill: {
    height: '100%',
    borderRadius: 999,
  },
  checkInPeopleList: {
    flex: 1,
    gap: 10,
  },
  checkInPersonRow: {
    minHeight: 62,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.10)',
    backgroundColor: 'rgba(255,255,255,0.026)',
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  checkInPersonAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInPersonInitial: {
    color: BRAND.textMain,
    fontSize: 12,
    fontWeight: '900',
  },
  checkInPersonInfo: {
    flex: 1,
    minWidth: 0,
  },
  checkInPersonName: {
    color: BRAND.textMain,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  checkInPersonMeta: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },
  checkInBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  checkInBadge: {
    fontSize: 10,
    fontWeight: '900',
  },
  operationalCard: {
    flex: 1.45,
    padding: 18,
    minWidth: 360,
  },
  operationalSideCard: {
    flex: 0.85,
    padding: 18,
    minWidth: 300,
  },
  operationalPulseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  operationalPulseCard: {
    flex: 1,
    minWidth: 178,
    minHeight: 156,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.12)',
    backgroundColor: 'rgba(255,255,255,0.032)',
    padding: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  operationalPulseCardActive: {
    borderColor: 'rgba(196,181,253,0.34)',
    backgroundColor: 'rgba(124,58,237,0.11)',
  },
  operationalPulseHalo: {
    position: 'absolute',
    right: -42,
    top: -46,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(182,156,255,0.08)',
  },
  operationalPulseInfo: {
    flex: 1,
    minWidth: 0,
  },
  operationalPulseLabel: {
    color: BRAND.textMain,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  operationalPulseValue: {
    color: BRAND.textMain,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 7,
  },
  operationalPulseBase: {
    color: BRAND.textSec,
    fontSize: 11,
    fontWeight: '800',
  },
  operationalPulseDetail: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
    marginTop: 6,
  },
  operationalPulseAccent: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 999,
  },
  taskChart: {
    gap: 14,
  },
  taskSegmentRow: {
    gap: 8,
  },
  taskSegmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskSegmentLabel: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  taskSegmentValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  taskSegmentTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.055)',
  },
  taskSegmentFill: {
    height: '100%',
    borderRadius: 999,
  },
  taskTotalBox: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.12)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    padding: 14,
  },
  taskTotalValue: {
    color: BRAND.textMain,
    fontSize: 28,
    fontWeight: '900',
  },
  taskTotalLabel: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginTop: 3,
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
    minHeight: 360,
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
    textTransform: 'uppercase',
    letterSpacing: -0.2,
  },
  chartSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: BRAND.textSec,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(0,7,45,0.45)',
  },
  chartToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  chartToggleActivo: {
    backgroundColor: 'rgba(96,165,250,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.26)',
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
    height: 330,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.18)',
    backgroundColor: 'rgba(0,7,45,0.28)',
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
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.035)',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.10)',
  },
  bar: {
    width: '100%',
    borderRadius: 18,
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
    minHeight: 360,
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
    borderRadius: 16,
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
    gap: 14,
    marginBottom: 14,
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
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  panelSubtitle: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
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
    borderRadius: 18,
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
    borderRadius: 18,
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
    borderRadius: 18,
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
    minHeight: 158,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.16)',
    backgroundColor: 'rgba(13,7,24,0.92)',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    ...sombraVioleta,
  },
  heroGlowA: {
    position: 'absolute',
    right: 80,
    top: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(124,58,237,0.24)',
  },
  heroGlowB: {
    position: 'absolute',
    right: -60,
    bottom: -90,
    width: 260,
    height: 190,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroCopy: {
    flex: 1,
    maxWidth: 620,
    zIndex: 2,
  },
  heroEyebrow: {
    color: BRAND.iconBright,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    color: BRAND.textMain,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  heroText: {
    color: BRAND.textSec,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 17,
    maxWidth: 560,
    marginTop: 7,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  heroButton: {
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
    backgroundColor: BRAND.caribbeanBlue,
  },
  heroButtonText: {
    color: '#150B2C',
    fontSize: 10,
    fontWeight: '900',
  },
  heroMetricPill: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    paddingVertical: 7,
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
  heroCrystalWrap: {
    width: 260,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  heroGlassMetric: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(4,3,12,0.72)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
