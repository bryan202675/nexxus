/**
 * Documentacion Nexxus - apps/mobile/src/presentation/context/ContextoUsuario.tsx
 * Capa: presentacion.
 * Proposito: Contexto de React. Agrupa estado compartido, suscripciones y acciones para que las pantallas no consulten datos de forma aislada.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback, useMemo } from 'react';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { useAuth }; reutiliza hooks propios que encapsulan estado, auth o consultas.
import { useAuth } from '@/presentation/hooks/useAuth';
// Importa { useWellness }; reutiliza hooks propios que encapsulan estado, auth o consultas.
import { useWellness } from '@/presentation/hooks/useWellness';
// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from 'domain/entities/User';
// Importa { CreateCheckInDTO, WellnessMetricsDTO }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { CreateCheckInDTO, WellnessMetricsDTO } from 'domain/application/dtos/CheckInDTO';
// Importa { LoginDTO }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { LoginDTO } from 'domain/application/dtos/AuthDTO';
// Importa { useCases }; contenedor de DI ya resuelto sobre Supabase.
import { useCases } from '@/infrastructure/container';
import { obtenerDeviceId, obtenerNombreDispositivo, obtenerSistemaOperativo, obtenerVersionApp } from '@/infrastructure/storage/deviceIdentity';
import { getTenantId } from '@/shared/auth/tenant';
// Importa { Task }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Task } from 'domain/entities/Task';
// Importa { Absence }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Absence } from 'domain/entities/Absence';
// Importa { Payment }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Payment } from 'domain/entities/Payment';
// Importa { Appointment }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Appointment } from 'domain/entities/Appointment';
// Importa { Notification }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Notification } from 'domain/entities/Notification';
// Importa { Documento }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Documento } from 'domain/entities/Documento';
// Importa { FocusSession }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { FocusSession } from 'domain/entities/FocusSession';
// Importa { Feedback }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Feedback } from 'domain/entities/Feedback';
// Importa { InternalRequest, NuevaSolicitudInterna }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { InternalRequest, NuevaSolicitudInterna } from 'domain/entities/InternalRequest';
import { CompanyCalendarEvent } from 'domain/entities/CompanyCalendar';
import { calcularDiasVacacionesDisponibles } from 'domain/services/vacationEngine';
// Importa { ContextualMessage }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { ContextualMessage } from 'domain/repositories/IFase2Repositories';
// Importa { subirFotoPerfil }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { subirFotoPerfilCompleta } from '@/infrastructure/services/almacenamiento';
// Fase 10: registra el push token del dispositivo apenas hay un usuario autenticado.
import { usePushNotifications } from '@/presentation/hooks/usePushNotifications';

/**
 * Define el contrato de datos EstadoContextoUsuario; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
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
  eventosCalendario: CompanyCalendarEvent[];
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
  actualizarSolicitudAusencia?: (id: string, data: Partial<Absence>) => Promise<void>;
  cancelarSolicitudAusencia?: (id: string) => Promise<void>;
  crearSolicitudInterna: (dto: NuevaSolicitudInterna) => Promise<void>;
  registrarCita: (dto: any) => Promise<void>;
  leerNotificacion: (id: string) => Promise<void>;
  marcarAsistencia: (tipo: 'entrada' | 'salida') => Promise<void>;
  marcarEstadoTrabajo: (estado: User['estado_trabajo']) => Promise<void>;
  guardarSesionEnfoque: (dto: Omit<FocusSession, 'id'>) => Promise<void>;
  marcarDocumentoLeido: (id: string) => Promise<void>;
  enviarFeedback: (dto: Omit<Feedback, 'id' | 'estado' | 'fecha'>) => Promise<void>;
  resolverItemInbox: (id: string) => Promise<void>;
  registrarEventoAsistencia: (tipo: 'entrada' | 'salida' | 'inicio_pausa' | 'fin_pausa') => Promise<void>;
  enviarMensajeChat: (data: Omit<ContextualMessage, 'id' | 'timestamp'>) => Promise<void>;
  generarResumenJornada: () => Promise<string>;
  actualizarFotoPerfil: (blob: any) => Promise<void>;
}

/**
 * Componente ContextoUsuario. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const ContextoUsuario = createContext<EstadoContextoUsuario | null>(null);

/**
 * Declaracion obtenerEmpresaId. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const obtenerEmpresaId = (user: User | null | undefined) => getTenantId(user);

/**
 * Componente ProveedorUsuario. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export function ProveedorUsuario({ children }: { children: ReactNode }) {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Inicializa { user, isAuthenticated, loading: authLoading, error: authError, login, loginEmpresarial, logout, updateUser }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { user, isAuthenticated, loading: authLoading, error: authError, login, loginEmpresarial, logout, updateUser } = useAuth();
  // Declara { metrics, loading: wellnessLoading, fetchMetrics, recordCheckIn }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { metrics, loading: wellnessLoading, fetchMetrics, recordCheckIn } = useWellness(user?.id, user?.nombre);
  // Fase 10: registro de push token, sin efecto en web/simulador (ver usePushNotifications).
  usePushNotifications(isAuthenticated ? user?.id : null);

  // Inicializa [tareas, setTareas]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [tareas, setTareas] = useState<Task[]>([]);
  // Inicializa [solicitudes, setSolicitudes]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [solicitudes, setSolicitudes] = useState<Absence[]>([]);
  // Inicializa [pagos, setPagos]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [pagos, setPagos] = useState<Payment[]>([]);
  // Inicializa [citas, setCitas]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [citas, setCitas] = useState<Appointment[]>([]);
  // Inicializa [notificaciones, setNotificaciones]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [notificaciones, setNotificaciones] = useState<Notification[]>([]);
  // Inicializa [documentos, setDocumentos]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  // Inicializa [focusSessions, setFocusSessions]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  // Inicializa [feedbacks, setFeedbacks]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  // Inicializa [inboxItems, setInboxItems]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [inboxItems, setInboxItems] = useState<any[]>([]);
  // Inicializa [solicitudesInternas, setSolicitudesInternas]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [solicitudesInternas, setSolicitudesInternas] = useState<InternalRequest[]>([]);
  // Sin esto, CalendarioLaboral.tsx (la única pantalla de calendario del empleado) nunca podía
  // mostrar eventos de calendario_empresarial creados por un admin -- solo leía tareas/solicitudes/
  // citas. Se filtra por relevancia (ver eventosCalendarioRelevantes más abajo).
  const [eventosCalendarioRaw, setEventosCalendarioRaw] = useState<CompanyCalendarEvent[]>([]);
  // Inicializa [especialistas, setEspecialistas]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [especialistas, setEspecialistas] = useState<any[]>([]);
  // Inicializa [cargandoSaaS, setCargandoSaaS]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cargandoSaaS, setCargandoSaaS] = useState(false);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (isAuthenticated && user) {
      const empresaId = obtenerEmpresaId(user);
      // Declara unsubInbox; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const unsubInbox = useCases.inbox.subscribe.execute(user.id, (items) => {
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        setInboxItems(items);
      });
      // Declara unsubTasks; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const unsubTasks = useCases.tasks.subscribe.execute(user.id, (t) => {
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        setTareas(t);
      });
      const unsubNotifications = useCases.notifications.subscribe.execute(user.id, empresaId, (items) => {
        setNotificaciones(items);
      });
      const unsubPayments = useCases.payments.subscribe.execute(user.id, empresaId, (items) => {
        setPagos(items);
      });
      const unsubAbsences = useCases.absences.subscribe.execute(user.id, (items) => {
        setSolicitudes(items);
      });
      const unsubCalendar = useCases.admin.calendar.subscribe(empresaId, (snapshot: { eventos?: CompanyCalendarEvent[] }) => {
        setEventosCalendarioRaw(snapshot.eventos || []);
      });
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return () => {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        unsubInbox();
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        unsubTasks();
        unsubNotifications();
        unsubPayments();
        unsubAbsences();
        unsubCalendar();
      };
    }
  }, [isAuthenticated, user]);

  // Fase H: registra este dispositivo en sesiones_dispositivo al iniciar sesion, para que
  // ConfiguracionApp.tsx pueda mostrar una lista real de sesiones activas (no simulada).
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let cancelado = false;
    obtenerDeviceId().then((deviceId) => {
      if (cancelado) return;
      useCases.sessionDevices.register.execute({
        userId: user.id,
        empresaId: obtenerEmpresaId(user),
        deviceId,
        deviceName: obtenerNombreDispositivo(),
        deviceOs: obtenerSistemaOperativo(),
        appVersion: obtenerVersionApp(),
      }).catch(() => {});
    }).catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [isAuthenticated, user]);

  // Inicializa fetchSaaSData; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const fetchSaaSData = useCallback(async () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!user) return;
    // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empresaId = obtenerEmpresaId(user);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setCargandoSaaS(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara [t, a, p, c, n, allUsers, docs, focus, feeds, ri]; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const [a, p, c, n, allUsers, docs, focus, feeds, ri] = await Promise.all([
        useCases.absences.getAbsences.execute(user.id),
        useCases.payments.getPayments.execute(user.id, empresaId),
        useCases.appointments.getAppointments.execute(user.id),
        useCases.notifications.getNotifications.execute(user.id, empresaId),
        useCases.admin.getAllUsers.execute(empresaId),
        // Documentos corporativos se comparten por empresa_id; getDocumentos solo
        // filtra por usuario_id y dejaba fuera los archivos publicados para el equipo.
        useCases.documents.getByCompany.execute(empresaId),
        useCases.wellness.getFocusSessions.execute(user.id),
        useCases.feedback.getFeedbacks.execute(user.id),
        useCases.requests.getByUser.execute(user.id),
      ]);
      // Tareas se manejan en el listener (unsubTasks). Pagos tiene listener propio (unsubPayments)
      // pero en RN los listeners de Firestore a veces se quedan colgados al volver de segundo plano
      // o con red inestable -- por eso "recargar" hace ademas este fetch directo como respaldo.
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setSolicitudes(a);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setPagos(p);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCitas(c);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setNotificaciones(n);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setDocumentos(docs);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setFocusSessions(focus);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setFeedbacks(feeds);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setSolicitudesInternas(ri);
      
      // Calcula psicologos; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
      const psicologos = (allUsers as User[])
        .filter((u: User) => u.rol === 'psicologo' && u.empresaId === empresaId)
        .map((u: User) => ({
          id: u.id,
          nombre: u.nombre,
          especialidad: u.departamento || 'Psicología',
          emoji: '👩‍⚕️',
          disponible: true
        }));

      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setEspecialistas(psicologos.length > 0 ? psicologos : [
        { id: 'default', nombre: 'Centro Nexxus', especialidad: 'Soporte General', emoji: '🏢', disponible: true }
      ]);
    } catch (e) {
      // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
      console.error('Error fetching SaaS data:', e);
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargandoSaaS(false);
    }
  }, [user]);

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (isAuthenticated && user) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      fetchMetrics();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      fetchSaaSData();
    }
  }, [isAuthenticated, user, fetchMetrics, fetchSaaSData]);

  // Declara registrarPausaGuiada; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const registrarPausaGuiada = async (dto: any) => {
    if (!user) return;
    try {
      const payload = {
        tipo: dto?.tipo || 'respiracion_4x4',
        duracion: typeof dto?.duracion === 'number' && dto.duracion > 0 ? dto.duracion : 60,
        fecha: dto?.fecha || new Date().toISOString(),
      };
      // Persiste la pausa en Supabase antes de refrescar metricas.
      await useCases.pauses.save.execute(user.id, payload);
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await fetchMetrics();
    } catch (e) {
      console.error('Error registrando pausa guiada:', e);
    }
  };

  // Declara actualizarTarea; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const actualizarTarea = async (id: string, data: Partial<Task>) => {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await useCases.tasks.updateTask.execute(id, data);
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await fetchSaaSData();
  };

  // Declara cambiarEstadoTarea; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const cambiarEstadoTarea = async (id: string, estado: Task['estado']) => {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await useCases.tasks.updateTask.execute(id, { estado });
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await fetchSaaSData();
  };

  // Bandeja Unificada (Fase 9): publica un item real de "aprobacion pendiente" para el jefe directo
  // del solicitante, si lo tiene asignado. Sin jefeId no se adivina un destinatario -- se documenta
  // como limitacion conocida en vez de asignarlo a "cualquier admin".
  const publicarAprobacionPendiente = async (params: { titulo: string; mensaje: string; origenRefId: string }) => {
    if (!user?.jefeId) return;
    try {
      await useCases.inbox.add.execute({
        userId: user.jefeId,
        empresaId: obtenerEmpresaId(user),
        origenRefId: params.origenRefId,
        tipo: 'aprobacion',
        prioridad: 'normal',
        estado: 'pendiente',
        titulo: params.titulo,
        mensaje: params.mensaje,
      });
    } catch (e) {
      // No bloquea el flujo principal (la solicitud ya se creo) si la bandeja falla al publicar.
      console.error('Error publicando en Bandeja Unificada:', e);
    }
    // Fase 10: push real, en paralelo a la bandeja -- mismo criterio de "no bloquear si falla"
    // (sin token registrado -- web, simulador, o el jefe nunca abrió la app en un dispositivo -- la
    // Edge Function simplemente no envía nada, no es un error).
    useCases.push.send.execute(user.jefeId, params.titulo, params.mensaje).catch((e) => {
      console.error('Error enviando push:', e);
    });
  };

  // Declara crearSolicitudAusencia; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const crearSolicitudAusencia = async (dto: any) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!user) return;
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await useCases.absences.createAbsence.execute({ ...dto, usuario_id: user.id, usuario_nombre: user.nombre, empresaId: obtenerEmpresaId(user) });
    await publicarAprobacionPendiente({
      titulo: `Ausencia: ${dto.asunto || dto.tipo || 'Solicitud'}`,
      mensaje: `${user.nombre} solicitó una ausencia.`,
      origenRefId: '',
    });
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await fetchSaaSData();
  };

  const actualizarSolicitudAusencia = async (id: string, data: Partial<Absence>) => {
    if (!user) return;
    setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    try {
      if ((useCases.absences as any).updateAbsence) {
        await (useCases.absences as any).updateAbsence.execute(id, data);
      }
    } catch (e) {
      console.error('Error actualizando ausencia:', e);
    }
    await fetchSaaSData();
  };

  const cancelarSolicitudAusencia = async (id: string) => {
    if (!user) return;
    setSolicitudes((prev) => prev.filter((s) => s.id !== id));
    try {
      if ((useCases.absences as any).deleteAbsence) {
        await (useCases.absences as any).deleteAbsence.execute(id);
      } else if ((useCases.absences as any).updateState) {
        await (useCases.absences as any).updateState.execute(id, 'rechazada');
      }
    } catch (e) {
      console.error('Error cancelando ausencia:', e);
    }
    await fetchSaaSData();
  };

  // Declara crearSolicitudInterna; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const crearSolicitudInterna = async (dto: NuevaSolicitudInterna) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!user) return;
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    const creada = await useCases.requests.create.execute(user.id, { ...dto, empresaId: obtenerEmpresaId(user) });
    await publicarAprobacionPendiente({
      titulo: creada.titulo || 'Solicitud interna',
      mensaje: `${user.nombre} envió una solicitud interna.`,
      origenRefId: creada.id,
    });
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await fetchSaaSData();
  };

  // Declara registrarCita; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const registrarCita = async (dto: any) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!user) return;
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await useCases.appointments.createAppointment.execute({ ...dto, usuario_id: user.id, usuario_nombre: user.nombre, empresaId: obtenerEmpresaId(user) });
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await fetchSaaSData();
  };

  // Declara leerNotificacion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const leerNotificacion = async (id: string) => {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await useCases.notifications.markAsRead.execute(id);
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await fetchSaaSData();
  };

  // Declara marcarAsistencia; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const marcarAsistencia = async (tipo: 'entrada' | 'salida') => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!user) return;
    const estadoActivo = tipo === 'entrada';
    // Avoid issuing a no-op UPDATE. The legacy database trigger used by some
    // environments cannot iterate a NULL array when no column actually changes.
    if (user.estado_activo === estadoActivo) return;
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await useCases.admin.updateUserProfile.execute(user.id, { estado_activo: estadoActivo });
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await fetchSaaSData();
  };

  // Declara marcarEstadoTrabajo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const marcarEstadoTrabajo = async (estado: User['estado_trabajo']) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!user) return;
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await useCases.admin.updateUserProfile.execute(user.id, { estado_trabajo: estado });
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await fetchSaaSData();
  };

  // Declara guardarSesionEnfoque; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const guardarSesionEnfoque = async (dto: Omit<FocusSession, 'id'>) => {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await useCases.wellness.saveFocusSession.execute(dto);
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await fetchSaaSData();
  };

  // Declara marcarDocumentoLeido; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const marcarDocumentoLeido = async (id: string) => {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await useCases.documents.marcarLeido.execute(id);
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await fetchSaaSData();
  };

  // Declara enviarFeedback; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const enviarFeedback = async (dto: Omit<Feedback, 'id' | 'estado' | 'fecha'>) => {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await useCases.feedback.sendFeedback.execute(dto);
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await fetchSaaSData();
  };

  // Declara resolverItemInbox; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const resolverItemInbox = async (id: string) => {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await useCases.inbox.resolve.execute(id);
  };

  // Declara registrarEventoAsistencia; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const registrarEventoAsistencia = async (tipo: 'entrada' | 'salida' | 'inicio_pausa' | 'fin_pausa') => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!user) return;
    try {
      await useCases.attendance.record.execute(user.id, {
        userId: user.id,
        empresaId: obtenerEmpresaId(user),
        tipo,
        metodoRegistro: 'manual',
        estado_aprobacion: 'pendiente',
      });
    } catch (err) {
      console.error("Error crítico al crear el registro de asistencia (asistencias collection):", err);
      throw err;
    }

    if (tipo === 'entrada' || tipo === 'salida') {
      try {
        await marcarAsistencia(tipo);
      } catch (err) {
        console.error("Error no crítico al actualizar el perfil (usuarios collection):", err);
        // No lanzamos el error para no bloquear la app, la asistencia ya se guardó.
      }
    }
    
    try {
      await fetchSaaSData();
    } catch (err) {
      console.error("Error al recargar datos:", err);
    }
  };

  // Declara enviarMensajeChat; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const enviarMensajeChat = async (data: Omit<ContextualMessage, 'id' | 'timestamp'>) => {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await useCases.chat.send.execute(data);
  };

  // Declara actualizarFotoPerfil; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const actualizarFotoPerfil = async (blob: Blob | File | string | any) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!user) return;
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara url; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const uploaded = await subirFotoPerfilCompleta(user.id, blob, obtenerEmpresaId(user), (user as any).foto_public_id || null);
      const url = uploaded.url;
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await useCases.admin.updateUserProfile.execute(user.id, {
        foto_perfil: url,
        foto_public_id: uploaded.publicId,
        foto_hash: uploaded.hash,
        foto_size: uploaded.size,
      } as any);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      updateUser({ ...user, foto_perfil: url, foto_public_id: uploaded.publicId, foto_hash: uploaded.hash, foto_size: uploaded.size });
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await fetchSaaSData();
    } catch (e) {
      // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
      console.error('Error actualizando foto de perfil:', e);
      // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
      throw e;
    }
  };

  const generarResumenJornada = async () => {
    const fecha = new Date().toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const tareasPendientes = tareas.filter((t) => t.estado !== 'completada');
    const tareasUrgentes = tareasPendientes.filter((t) => t.prioridad === 'Urgente');
    const notifsNoLeidas = notificaciones.filter((n) => !n.leida).length;
    const solicitudesPend = solicitudesInternas.filter((s) => s.estado === 'pendiente').length;

    return `Aquí tienes el resumen de tu jornada laboral (${fecha}):\n\n` +
      `* Tareas Activas: ${tareasPendientes.length} tareas pendientes${tareasUrgentes.length > 0 ? ` (${tareasUrgentes.length} urgentes)` : ''}.\n` +
      `* Notificaciones: ${notifsNoLeidas > 0 ? `${notifsNoLeidas} avisos sin leer` : 'Bandeja al día sin avisos pendientes'}.\n` +
      `* Trámites y Solicitudes: ${solicitudesPend > 0 ? `${solicitudesPend} solicitudes en revisión` : 'Sin solicitudes pendientes'}.\n` +
      `* Registro de Asistencia: Racha de ${metrics?.racha || 1} días de actividad.\n\n` +
      `¿Deseas que te ayude a priorizar tus actividades de hoy?`;
  };

  // Calcula alertasNoLeidas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const alertasNoLeidas = notificaciones.filter(n => !n.leida).length;

  // Un evento es relevante para este empleado si no tiene ninguna segmentación (empresa completa)
  // o si el empleado coincide con alguna de las segmentaciones que sí tiene (empleado, su
  // departamento o su sede) -- la misma semántica "enviar a cualquiera de estas audiencias" que
  // usa el formulario de creación en CalendarioEmpresarial.tsx (admin).
  const eventosCalendario = useMemo(() => {
    if (!user) return [];
    return eventosCalendarioRaw.filter((evento) => {
      const sinSegmentar =
        !(evento.empleadoIds?.length) && !(evento.departamentoIds?.length) && !(evento.sedeIds?.length);
      if (sinSegmentar) return true;
      if (evento.empleadoIds?.includes(user.id)) return true;
      if (user.departamentoId && evento.departamentoIds?.includes(user.departamentoId)) return true;
      if (user.sedeId && evento.sedeIds?.includes(user.sedeId)) return true;
      return false;
    });
  }, [eventosCalendarioRaw, user]);

  // dias_vacaciones_disponibles no se guarda como columna -- se calcula aqui (Codigo de Trabajo de
  // El Salvador, Art. 177) a partir de fecha_ingreso + las solicitudes ya cargadas en memoria, sin
  // pedir datos extra. Se recalcula solo si fecha_ingreso o las solicitudes cambian.
  const perfilConVacaciones = useMemo(() => {
    if (!user) return user;
    return {
      ...user,
      dias_vacaciones_disponibles: calcularDiasVacacionesDisponibles(user.fecha_ingreso, solicitudes),
    };
  }, [user, solicitudes]);

  // Declara valor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const valor: EstadoContextoUsuario = {
    perfil: perfilConVacaciones,
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
    eventosCalendario,
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
    actualizarSolicitudAusencia,
    cancelarSolicitudAusencia,
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

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Proveedor de contexto; entrega estado o servicios compartidos a sus componentes hijos.
    <ContextoUsuario.Provider value={valor}>
      {children}
    </ContextoUsuario.Provider>
  );
}

/**
 * Hook useContextoUsuario. Expone estado derivado y acciones reutilizables para componentes React.
 */
export function useContextoUsuario(): EstadoContextoUsuario {
  // Inicializa contexto; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const contexto = useContext(ContextoUsuario);
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!contexto) throw new Error('useContextoUsuario debe usarse dentro de ProveedorUsuario');
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return contexto;
}
