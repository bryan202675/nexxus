/**
 * Documentacion Nexxus - nexxus/app/src/presentation/context/ContextoUsuario.tsx
 * Capa: presentacion.
 * Proposito: Contexto de React. Agrupa estado compartido, suscripciones y acciones para que las pantallas no consulten datos de forma aislada.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { useAuth }; reutiliza hooks propios que encapsulan estado, auth o consultas.
import { useAuth } from '@/presentation/hooks/useAuth';
// Importa { useWellness }; reutiliza hooks propios que encapsulan estado, auth o consultas.
import { useWellness } from '@/presentation/hooks/useWellness';
// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from '@/domain/entities/User';
// Importa { CreateCheckInDTO, WellnessMetricsDTO }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { CreateCheckInDTO, WellnessMetricsDTO } from '@/application/dtos/CheckInDTO';
// Importa { LoginDTO }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { LoginDTO } from '@/application/dtos/AuthDTO';
// Importa { useCases } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { useCases } from '@/infrastructure/firebase/container';
// Importa { Task }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Task } from '@/domain/entities/Task';
// Importa { Absence }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Absence } from '@/domain/entities/Absence';
// Importa { Payment }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Payment } from '@/domain/entities/Payment';
// Importa { Appointment }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Appointment } from '@/domain/entities/Appointment';
// Importa { Notification }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Notification } from '@/domain/entities/Notification';
// Importa { Documento }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Documento } from '@/domain/entities/Documento';
// Importa { FocusSession }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { FocusSession } from '@/domain/entities/FocusSession';
// Importa { Feedback }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Feedback } from '@/domain/entities/Feedback';
// Importa { InternalRequest, NuevaSolicitudInterna }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { InternalRequest, NuevaSolicitudInterna } from '@/domain/entities/InternalRequest';
// Importa { ContextualMessage }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { ContextualMessage } from '@/domain/repositories/IFase2Repositories';
// Importa { subirFotoPerfil }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { subirFotoPerfilCompleta } from '@/infrastructure/services/almacenamiento';

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

/**
 * Componente ContextoUsuario. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const ContextoUsuario = createContext<EstadoContextoUsuario | null>(null);

/**
 * Declaracion obtenerEmpresaId. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const obtenerEmpresaId = (user: User | null | undefined) => {
  // Declara valor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const valor = user?.empresaId || (user as any)?.empresa_id || (user as any)?.empresaID;
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return typeof valor === 'string' ? valor.trim() : '';
};

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
  // Inicializa [especialistas, setEspecialistas]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [especialistas, setEspecialistas] = useState<any[]>([]);
  // Inicializa [cargandoSaaS, setCargandoSaaS]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cargandoSaaS, setCargandoSaaS] = useState(false);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (isAuthenticated && user) {
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
      const unsubNotifications = useCases.notifications.subscribe.execute(user.id, (items) => {
        setNotificaciones(items);
      });
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return () => {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        unsubInbox();
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        unsubTasks();
        unsubNotifications();
      };
    }
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
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setTareas(t);
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
    // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
    console.log('Pausa registrada:', dto);
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await fetchMetrics();
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

  // Declara crearSolicitudAusencia; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const crearSolicitudAusencia = async (dto: any) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!user) return;
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await useCases.absences.createAbsence.execute({ ...dto, usuario_id: user.id, usuario_nombre: user.nombre, empresaId: obtenerEmpresaId(user) });
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await fetchSaaSData();
  };

  // Declara crearSolicitudInterna; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const crearSolicitudInterna = async (dto: NuevaSolicitudInterna) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!user) return;
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await useCases.requests.create.execute(user.id, { ...dto, empresaId: obtenerEmpresaId(user) });
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
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await useCases.admin.updateUserProfile.execute(user.id, { estado_activo: tipo === 'entrada' });
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
  const registrarEventoAsistencia = async (tipo: any, metadata?: any) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!user) return;
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await useCases.attendance.record.execute(user.id, {
      userId: user.id,
      empresaId: obtenerEmpresaId(user),
      tipo,
      gps: metadata?.gps,
      estado_aprobacion: 'pendiente',
    });
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (tipo === 'entrada' || tipo === 'salida') {
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await marcarAsistencia(tipo);
    }
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await fetchSaaSData();
  };

  // Declara enviarMensajeChat; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const enviarMensajeChat = async (data: Omit<ContextualMessage, 'id' | 'timestamp'>) => {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await useCases.chat.send.execute(data);
  };

  // Declara actualizarFotoPerfil; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const actualizarFotoPerfil = async (blob: Blob) => {
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

  // Calcula generarResumenJornada; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const generarResumenJornada = async () => {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return t('miPulso.summary_jornada', { 
      date: new Date().toLocaleDateString(i18n.language === 'es' ? 'es-MX' : 'en-US'), 
      tasks: tareas.length, 
      notifications: notificaciones.filter(n => !n.leida).length 
    });
  };

  // Calcula alertasNoLeidas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const alertasNoLeidas = notificaciones.filter(n => !n.leida).length;

  // Declara valor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
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
