import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/presentation/hooks/useAuth';
import { useWellness } from '@/presentation/hooks/useWellness';
import { User } from '@/domain/entities/User';
import { CreateCheckInDTO, WellnessMetricsDTO } from '@/application/dtos/CheckInDTO';
import { LoginDTO } from '@/application/dtos/AuthDTO';
import { useCases } from '@/infrastructure/firebase/container';
import { Task } from '@/domain/entities/Task';
import { Absence } from '@/domain/entities/Absence';
import { Payment } from '@/domain/entities/Payment';
import { Appointment } from '@/domain/entities/Appointment';
import { Notification } from '@/domain/entities/Notification';
import { Documento } from '@/domain/entities/Documento';
import { FocusSession } from '@/domain/entities/FocusSession';
import { Feedback } from '@/domain/entities/Feedback';
import { InternalRequest, NuevaSolicitudInterna } from '@/domain/entities/InternalRequest';
import { ContextualMessage } from '@/domain/repositories/IFase2Repositories';
import { subirFotoPerfil } from '@/infrastructure/services/almacenamiento';

interface EstadoContextoUsuario {
  perfil: User | null;
  uidUsuario: string | null;
  autenticado: boolean;
  cargando: boolean;
  error: string | null;
  metrics: WellnessMetricsDTO | null;
  
  // Modulos SaaS
  tareas: Task[];
  solicitudes: Absence[];
  pagos: Payment[];
  citas: Appointment[];
  notificaciones: Notification[];
  documentos: Documento[];
  focusSessions: FocusSession[];
  feedbacks: Feedback[];
  inboxItems: any[];
  solicitudesInternas: InternalRequest[];
  especialistas: any[];
  alertasNoLeidas: number;

  // Acciones Auth/Wellness
  login: (dto: LoginDTO) => Promise<User>;
  loginEmpresarial: (dto: any) => Promise<User>;
  cerrarSesion: () => Promise<void>;
  registrarCheckIn: (dto: CreateCheckInDTO) => Promise<void>;
  registrarPausaGuiada: (dto: any) => Promise<void>;
  recargarDatos: () => Promise<void>;

  // Acciones SaaS
  cambiarEstadoTarea: (id: string, estado: Task['estado']) => Promise<void>;
  actualizarTarea: (id: string, data: Partial<Task>) => Promise<void>;
  crearSolicitudAusencia: (dto: any) => Promise<void>;
  crearSolicitudInterna: (dto: NuevaSolicitudInterna) => Promise<void>;
  registrarCita: (dto: any) => Promise<void>;
  leerNotificacion: (id: string) => Promise<void>;
  marcarAsistencia: (tipo: 'entrada' | 'salida') => Promise<void>;
  marcarEstadoTrabajo: (estado: User['estado_trabajo']) => Promise<void>;
  guardarSesionEnfoque: (dto: Omit<FocusSession, 'id'>) => Promise<void>;
  marcarDocumentoLeido: (id: string) => Promise<void>;
  enviarFeedback: (dto: Omit<Feedback, 'id' | 'estado' | 'fecha'>) => Promise<void>;
  resolverItemInbox: (id: string) => Promise<void>;
  registrarEventoAsistencia: (tipo: any, metadata?: any) => Promise<void>;
  enviarMensajeChat: (data: Omit<ContextualMessage, 'id' | 'timestamp'>) => Promise<void>;
  generarResumenJornada: () => Promise<string>;
  actualizarFotoPerfil: (blob: any) => Promise<void>;
}

const ContextoUsuario = createContext<EstadoContextoUsuario | null>(null);

const obtenerEmpresaId = (user: User | null | undefined) => {
  const valor = user?.empresaId;
  return typeof valor === 'string' ? valor.trim() : '';
};

export function ProveedorUsuario({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, loading: authLoading, error: authError, login, loginEmpresarial, logout, updateUser } = useAuth();
  const { metrics, loading: wellnessLoading, fetchMetrics, recordCheckIn } = useWellness(user?.id, user?.nombre);

  const [tareas, setTareas] = useState<Task[]>([]);
  const [solicitudes, setSolicitudes] = useState<Absence[]>([]);
  const [pagos, setPagos] = useState<Payment[]>([]);
  const [citas, setCitas] = useState<Appointment[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notification[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [inboxItems, setInboxItems] = useState<any[]>([]);
  const [solicitudesInternas, setSolicitudesInternas] = useState<InternalRequest[]>([]);
  const [especialistas, setEspecialistas] = useState<any[]>([]);
  const [cargandoSaaS, setCargandoSaaS] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const unsubInbox = useCases.inbox.subscribe.execute(user.id, (items) => {
        setInboxItems(items);
      });
      const unsubTasks = useCases.tasks.subscribe.execute(user.id, (t) => {
        setTareas(t);
      });
      return () => {
        unsubInbox();
        unsubTasks();
      };
    }
  }, [isAuthenticated, user]);

  const fetchSaaSData = useCallback(async () => {
    if (!user) return;
    const empresaId = obtenerEmpresaId(user);
    setCargandoSaaS(true);
    try {
      const [t, a, p, c, n, allUsers, docs, focus, feeds, ri] = await Promise.all([
        useCases.tasks.getTasks.execute(user.id),
        useCases.absences.getAbsences.execute(user.id),
        useCases.payments.getPayments.execute(user.id),
        useCases.appointments.getAppointments.execute(user.id),
        useCases.notifications.getNotifications.execute(user.id),
        useCases.admin.getAllUsers.execute(empresaId),
        useCases.documents.getDocumentos.execute(user.id),
        useCases.wellness.getFocusSessions.execute(user.id),
        useCases.feedback.getFeedbacks.execute(user.id),
        useCases.requests.getByUser.execute(user.id),
      ]);
      setTareas(t);
      setSolicitudes(a);
      setPagos(p);
      setCitas(c);
      setNotificaciones(n);
      setDocumentos(docs);
      setFocusSessions(focus);
      setFeedbacks(feeds);
      setSolicitudesInternas(ri);
      
      const psicologos = (allUsers as User[])
        .filter((u: User) => u.rol === 'psicologo' && u.empresaId === empresaId)
        .map((u: User) => ({
          id: u.id,
          nombre: u.nombre,
          especialidad: u.departamento || 'Psicología',
          emoji: '👩‍⚕️',
          disponible: true
        }));

      setEspecialistas(psicologos.length > 0 ? psicologos : [
        { id: 'default', nombre: 'Centro Nexxus', especialidad: 'Soporte General', emoji: '🏢', disponible: true }
      ]);
    } catch (e) {
      console.error('Error fetching SaaS data:', e);
    } finally {
      setCargandoSaaS(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchMetrics();
      fetchSaaSData();
    }
  }, [isAuthenticated, user, fetchMetrics, fetchSaaSData]);

  const registrarPausaGuiada = async (dto: any) => {
    console.log('Pausa registrada:', dto);
    await fetchMetrics();
  };

  const actualizarTarea = async (id: string, data: Partial<Task>) => {
    await useCases.tasks.updateTask.execute(id, data);
    await fetchSaaSData();
  };

  const cambiarEstadoTarea = async (id: string, estado: Task['estado']) => {
    await useCases.tasks.updateTask.execute(id, { estado });
    await fetchSaaSData();
  };

  const crearSolicitudAusencia = async (dto: any) => {
    if (!user) return;
    await useCases.absences.createAbsence.execute({ ...dto, usuario_id: user.id, usuario_nombre: user.nombre, empresaId: obtenerEmpresaId(user) });
    await fetchSaaSData();
  };

  const crearSolicitudInterna = async (dto: NuevaSolicitudInterna) => {
    if (!user) return;
    await useCases.requests.create.execute(user.id, { ...dto, empresaId: obtenerEmpresaId(user) });
    await fetchSaaSData();
  };

  const registrarCita = async (dto: any) => {
    if (!user) return;
    await useCases.appointments.createAppointment.execute({ ...dto, usuario_id: user.id, usuario_nombre: user.nombre, empresaId: obtenerEmpresaId(user) });
    await fetchSaaSData();
  };

  const leerNotificacion = async (id: string) => {
    await useCases.notifications.markAsRead.execute(id);
    await fetchSaaSData();
  };

  const marcarAsistencia = async (tipo: 'entrada' | 'salida') => {
    if (!user) return;
    await useCases.admin.updateUserProfile.execute(user.id, { estado_activo: tipo === 'entrada' });
    await fetchSaaSData();
  };

  const marcarEstadoTrabajo = async (estado: User['estado_trabajo']) => {
    if (!user) return;
    await useCases.admin.updateUserProfile.execute(user.id, { estado_trabajo: estado });
    await fetchSaaSData();
  };

  const guardarSesionEnfoque = async (dto: Omit<FocusSession, 'id'>) => {
    await useCases.wellness.saveFocusSession.execute(dto);
    await fetchSaaSData();
  };

  const marcarDocumentoLeido = async (id: string) => {
    await useCases.documents.marcarLeido.execute(id);
    await fetchSaaSData();
  };

  const enviarFeedback = async (dto: Omit<Feedback, 'id' | 'estado' | 'fecha'>) => {
    await useCases.feedback.sendFeedback.execute(dto);
    await fetchSaaSData();
  };

  const resolverItemInbox = async (id: string) => {
    await useCases.inbox.resolve.execute(id);
  };

  const registrarEventoAsistencia = async (tipo: any, metadata?: any) => {
    if (!user) return;
    await useCases.attendance.record.execute(user.id, {
      userId: user.id,
      empresaId: obtenerEmpresaId(user),
      tipo,
      gps: metadata?.gps,
      estado_aprobacion: 'pendiente',
    });
    if (tipo === 'entrada' || tipo === 'salida') {
      await marcarAsistencia(tipo);
    }
    await fetchSaaSData();
  };

  const enviarMensajeChat = async (data: Omit<ContextualMessage, 'id' | 'timestamp'>) => {
    await useCases.chat.send.execute(data);
  };

  const actualizarFotoPerfil = async (blob: Blob) => {
    if (!user) return;
    try {
      const url = await subirFotoPerfil(user.id, blob);
      await useCases.admin.updateUserProfile.execute(user.id, { foto_perfil: url });
      updateUser({ ...user, foto_perfil: url });
      await fetchSaaSData();
    } catch (e) {
      console.error('Error actualizando foto de perfil:', e);
      throw e;
    }
  };

  const generarResumenJornada = async () => {
    return t('miPulso.summary_jornada', { 
      date: new Date().toLocaleDateString(i18n.language === 'es' ? 'es-MX' : 'en-US'), 
      tasks: tareas.length, 
      notifications: notificaciones.filter(n => !n.leida).length 
    });
  };

  const alertasNoLeidas = notificaciones.filter(n => !n.leida).length;

  const valor: EstadoContextoUsuario = {
    perfil: user,
    uidUsuario: user?.id || null,
    autenticado: isAuthenticated,
    cargando: authLoading,
    error: authError,
    metrics,
    tareas,
    solicitudes,
    pagos,
    citas,
    notificaciones,
    documentos,
    focusSessions,
    feedbacks,
    inboxItems,
    solicitudesInternas,
    especialistas,
    alertasNoLeidas,
    login,
    loginEmpresarial,
    cerrarSesion: logout,
    registrarCheckIn: async (dto) => { await recordCheckIn(dto); await fetchMetrics(); },
    registrarPausaGuiada,
    recargarDatos: fetchSaaSData,
    cambiarEstadoTarea,
    actualizarTarea,
    crearSolicitudAusencia,
    crearSolicitudInterna,
    registrarCita,
    leerNotificacion,
    marcarAsistencia,
    marcarEstadoTrabajo,
    guardarSesionEnfoque,
    marcarDocumentoLeido,
    enviarFeedback,
    resolverItemInbox,
    registrarEventoAsistencia,
    enviarMensajeChat,
    actualizarFotoPerfil,
    generarResumenJornada
  };

  return (
    <ContextoUsuario.Provider value={valor}>
      {children}
    </ContextoUsuario.Provider>
  );
}

export function useContextoUsuario(): EstadoContextoUsuario {
  const contexto = useContext(ContextoUsuario);
  if (!contexto) throw new Error('useContextoUsuario debe usarse dentro de ProveedorUsuario');
  return contexto;
}
