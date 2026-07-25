/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/container.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */


// Importa { FirebaseTaskRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseTaskRepository } from './FirebaseTaskRepository';
// Importa { FirebaseAbsenceRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseAbsenceRepository } from './FirebaseAbsenceRepository';
// Importa { FirebasePaymentRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebasePaymentRepository } from './FirebasePaymentRepository';
import { FirebasePayrollRepository } from './FirebasePayrollRepository';
// Importa { FirebaseAppointmentRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseAppointmentRepository } from './FirebaseAppointmentRepository';
// Importa { FirebaseNotificationRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseNotificationRepository } from './FirebaseNotificationRepository';
// Importa { FirebaseDepartmentRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseDepartmentRepository } from './FirebaseDepartmentRepository';
// Importa { FirebaseAuditLogRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseAuditLogRepository } from './FirebaseAuditLogRepository';
// Importa { FirebaseAnnouncementRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseAnnouncementRepository } from './FirebaseAnnouncementRepository';
// Importa { FirebaseCourseRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseCourseRepository } from './FirebaseCourseRepository';

// Casos de Uso
// Importa { GetTasks }; ejecuta casos de uso que concentran reglas de negocio.
import { GetTasks } from '@/application/use-cases/tasks/GetTasks';
// Importa { CreateTask }; ejecuta casos de uso que concentran reglas de negocio.
import { CreateTask } from '@/application/use-cases/tasks/CreateTask';
// Importa { UpdateTask }; ejecuta casos de uso que concentran reglas de negocio.
import { UpdateTask } from '@/application/use-cases/tasks/UpdateTask';
// Importa { SubscribeTasks }; ejecuta casos de uso que concentran reglas de negocio.
import { SubscribeTasks } from '@/application/use-cases/tasks/SubscribeTasks';

// Importa { GetAbsences }; ejecuta casos de uso que concentran reglas de negocio.
import { GetAbsences } from '@/application/use-cases/absences/GetAbsences';
// Importa { CreateAbsence }; ejecuta casos de uso que concentran reglas de negocio.
import { CreateAbsence } from '@/application/use-cases/absences/CreateAbsence';

// Importa { GetPayments }; ejecuta casos de uso que concentran reglas de negocio.
import { GetPayments } from '@/application/use-cases/payments/GetPayments';

// Importa { GetAppointments }; ejecuta casos de uso que concentran reglas de negocio.
import { GetAppointments } from '@/application/use-cases/appointments/GetAppointments';
// Importa { CreateAppointment }; ejecuta casos de uso que concentran reglas de negocio.
import { CreateAppointment } from '@/application/use-cases/appointments/CreateAppointment';

// Importa { GetNotifications }; ejecuta casos de uso que concentran reglas de negocio.
import { GetNotifications } from '@/application/use-cases/notifications/GetNotifications';
// Importa { MarkNotificationRead }; ejecuta casos de uso que concentran reglas de negocio.
import { MarkNotificationRead } from '@/application/use-cases/notifications/MarkNotificationRead';
import { SubscribeNotifications } from '@/application/use-cases/notifications/SubscribeNotifications';

// Importa { GetDocumentos, MarkDocumentRead }; ejecuta casos de uso que concentran reglas de negocio.
import { GetDocumentos, MarkDocumentRead, GetCompanyDocuments, CreateDocument, DeleteDocument, SubscribeCompanyDocuments, DeleteDocumentWithAsset, GetDocumentStorageStats } from '@/application/use-cases/documents/DocumentUseCases';
// Importa { GetFocusSessions, SaveFocusSession }; ejecuta casos de uso que concentran reglas de negocio.
import { GetFocusSessions, SaveFocusSession } from '@/application/use-cases/wellness/FocusSessionUseCases';
// Importa { GetFeedbacks, SubmitFeedback }; ejecuta casos de uso que concentran reglas de negocio.
import { GetFeedbacks, SubmitFeedback } from '@/application/use-cases/feedback/FeedbackUseCases';

// Importa { FirebaseAuthRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseAuthRepository } from './FirebaseAuthRepository';
// Importa { FirebaseUserRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseUserRepository } from './FirebaseUserRepository';
// Importa { FirebaseCheckInRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseCheckInRepository } from './FirebaseCheckInRepository';
// Importa { FirebasePauseRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebasePauseRepository } from './FirebasePauseRepository';
// Importa { FirebaseFocusSessionRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseFocusSessionRepository } from './FirebaseFocusSessionRepository';
// Importa { FirebaseDocumentoRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseDocumentoRepository } from './FirebaseDocumentoRepository';
// Importa { FirebaseFeedbackRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseFeedbackRepository } from './FirebaseFeedbackRepository';
// Importa { FirebaseAttendanceRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseAttendanceRepository } from './FirebaseAttendanceRepository';
// Importa { FirebaseInboxRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseInboxRepository } from './FirebaseInboxRepository';
// Importa { FirebaseInternalRequestRepository, FirebaseChatContextualRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseInternalRequestRepository, FirebaseChatContextualRepository } from './FirebaseFase2Repositories';
import { FirebaseRequestReportRepository } from './FirebaseRequestReportRepository';
import { FirebaseLeaderRepository } from './FirebaseLeaderRepository';
import { FirebaseSuperAdminRepository } from './FirebaseSuperAdminRepository';
import { FirebaseInternalChatRepository } from './FirebaseInternalChatRepository';
import { FirebaseAiAssistantRepository } from './FirebaseAiAssistantRepository';
import { FirebaseInventoryRepository } from './FirebaseInventoryRepository';
import { FirebaseExportRepository } from './FirebaseExportRepository';
import { FirebaseSensitiveProfileRepository } from './FirebaseSensitiveProfileRepository';
import { FirebaseCompanySettingsRepository } from './FirebaseCompanySettingsRepository';
import { FirebaseCompanyCalendarRepository } from './FirebaseCompanyCalendarRepository';

// Importa { LoginUser }; ejecuta casos de uso que concentran reglas de negocio.
import { LoginUser } from '@/application/use-cases/auth/LoginUser';
// Importa { LoginEmpresarial }; ejecuta casos de uso que concentran reglas de negocio.
import { LoginEmpresarial } from '@/application/use-cases/auth/LoginEmpresarial';
// Importa { LogoutUser }; ejecuta casos de uso que concentran reglas de negocio.
import { LogoutUser } from '@/application/use-cases/auth/LogoutUser';
// Importa { GetCurrentUser }; ejecuta casos de uso que concentran reglas de negocio.
import { GetCurrentUser } from '@/application/use-cases/auth/GetCurrentUser';
// Importa { RecordCheckIn }; ejecuta casos de uso que concentran reglas de negocio.
import { RecordCheckIn } from '@/application/use-cases/wellness/RecordCheckIn';
// Importa { GetWellnessMetrics }; ejecuta casos de uso que concentran reglas de negocio.
import { GetWellnessMetrics } from '@/application/use-cases/wellness/GetWellnessMetrics';
// Importa { GetAllUsers }; ejecuta casos de uso que concentran reglas de negocio.
import { GetAllUsers } from '@/application/use-cases/admin/GetAllUsers';
// Importa { UpdateUserProfile }; ejecuta casos de uso que concentran reglas de negocio.
import { UpdateUserProfile } from '@/application/use-cases/admin/UpdateUserProfile';

// Importa { RecordAttendance, GetAttendanceHistory, GetCurrentShift }; ejecuta casos de uso que concentran reglas de negocio.
import { RecordAttendance, GetAttendanceHistory, GetCurrentShift, GetCompanyAttendance, GetCompanyDailyAttendanceSummary } from '@/application/use-cases/attendance/AttendanceUseCases';
// Importa { GetInbox, ResolveInboxItem, SubscribeToInbox }; ejecuta casos de uso que concentran reglas de negocio.
import { GetInbox, ResolveInboxItem, SubscribeToInbox } from '@/application/use-cases/inbox/InboxUseCases';
// Importa { CreateInternalRequest, GetInternalRequests, SendContextualMessage, SubscribeToChatContext }; ejecuta casos de uso que concentran reglas de negocio.
import { CreateInternalRequest, GetInternalRequests, SendContextualMessage, SubscribeToChatContext } from '@/application/use-cases/fase2/Fase2UseCases';

// New Admin Use Cases
// Importa { AdminPaymentUseCases }; ejecuta casos de uso que concentran reglas de negocio.
import { AdminPaymentUseCases } from '@/application/use-cases/admin/AdminPaymentUseCases';
import { AdminPayrollUseCases } from '@/application/use-cases/admin/AdminPayrollUseCases';
// Importa { AdminDepartmentUseCases }; ejecuta casos de uso que concentran reglas de negocio.
import { AdminDepartmentUseCases } from '@/application/use-cases/admin/AdminDepartmentUseCases';
// Importa { AdminAuditLogUseCases }; ejecuta casos de uso que concentran reglas de negocio.
import { AdminAuditLogUseCases } from '@/application/use-cases/admin/AdminAuditLogUseCases';
// Importa { AdminAnnouncementUseCases }; ejecuta casos de uso que concentran reglas de negocio.
import { AdminAnnouncementUseCases } from '@/application/use-cases/admin/AdminAnnouncementUseCases';
import { AdminRequestReportUseCases } from '@/application/use-cases/admin/AdminRequestReportUseCases';
import { LeaderUseCases } from '@/application/use-cases/leader/LeaderUseCases';
import { SuperAdminUseCases } from '@/application/use-cases/admin/SuperAdminUseCases';
import { InternalChatUseCases } from '@/application/use-cases/chat/InternalChatUseCases';
import { AiAssistantUseCases } from '@/application/use-cases/ai/AiAssistantUseCases';
import { InventoryUseCases } from '@/application/use-cases/inventory/InventoryUseCases';
import { ExportUseCases } from '@/application/use-cases/admin/ExportUseCases';
import { SensitiveProfileUseCases } from '@/application/use-cases/admin/SensitiveProfileUseCases';
import { CompanySettingsUseCases } from '@/application/use-cases/admin/CompanySettingsUseCases';
import { CompanyCalendarUseCases } from '@/application/use-cases/admin/CompanyCalendarUseCases';

// ── Repositorios (REALEZ - FIREBASE) ──────────────────────────
const authRepository = new FirebaseAuthRepository();
/**
 * Pieza de repositorio userRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const userRepository = new FirebaseUserRepository();

/**
 * Pieza de repositorio checkInRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const checkInRepository = new FirebaseCheckInRepository();
/**
 * Pieza de repositorio taskRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const taskRepository = new FirebaseTaskRepository();
/**
 * Pieza de repositorio absenceRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const absenceRepository = new FirebaseAbsenceRepository();
/**
 * Pieza de repositorio paymentRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const paymentRepository = new FirebasePaymentRepository();
const payrollRepository = new FirebasePayrollRepository();
/**
 * Pieza de repositorio appointmentRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const appointmentRepository = new FirebaseAppointmentRepository();
/**
 * Pieza de repositorio notificationRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const notificationRepository = new FirebaseNotificationRepository();
/**
 * Pieza de repositorio departmentRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const departmentRepository = new FirebaseDepartmentRepository();
/**
 * Pieza de repositorio auditLogRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const auditLogRepository = new FirebaseAuditLogRepository();
/**
 * Pieza de repositorio announcementRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const announcementRepository = new FirebaseAnnouncementRepository();
/**
 * Pieza de repositorio focusSessionRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const focusSessionRepository = new FirebaseFocusSessionRepository();
/**
 * Pieza de repositorio documentoRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const documentoRepository = new FirebaseDocumentoRepository();
/**
 * Pieza de repositorio feedbackRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const feedbackRepository = new FirebaseFeedbackRepository();
/**
 * Pieza de repositorio attendanceRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const attendanceRepository = new FirebaseAttendanceRepository();
/**
 * Pieza de repositorio inboxRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const inboxRepository = new FirebaseInboxRepository();
/**
 * Pieza de repositorio internalRequestRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const internalRequestRepository = new FirebaseInternalRequestRepository();
/**
 * Pieza de repositorio chatContextualRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const chatContextualRepository = new FirebaseChatContextualRepository();
const requestReportRepository = new FirebaseRequestReportRepository();
const leaderRepository = new FirebaseLeaderRepository();
const superAdminRepository = new FirebaseSuperAdminRepository();
const internalChatRepository = new FirebaseInternalChatRepository();
const aiAssistantRepository = new FirebaseAiAssistantRepository();
const inventoryRepository = new FirebaseInventoryRepository();
const exportRepository = new FirebaseExportRepository();
const sensitiveProfileRepository = new FirebaseSensitiveProfileRepository();
const companySettingsRepository = new FirebaseCompanySettingsRepository();
const companyCalendarRepository = new FirebaseCompanyCalendarRepository();
/**
 * Pieza de repositorio courseRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const courseRepository = new FirebaseCourseRepository();


// ── Casos de Uso ─────────────────────────────────────────────
export const useCases = {
  auth: {
    login: new LoginUser(authRepository),
    loginEmpresarial: new LoginEmpresarial(authRepository),
    logout: new LogoutUser(authRepository),
    getCurrentUser: new GetCurrentUser(authRepository),
  },
  wellness: {
    recordCheckIn: new RecordCheckIn(checkInRepository, userRepository),
    getMetrics: new GetWellnessMetrics(checkInRepository),
    getFocusSessions: new GetFocusSessions(focusSessionRepository),
    saveFocusSession: new SaveFocusSession(focusSessionRepository),
  },
  tasks: {
    getTasks: new GetTasks(taskRepository),
    createTask: new CreateTask(taskRepository),
    updateTask: new UpdateTask(taskRepository),
    subscribe: new SubscribeTasks(taskRepository),
  },
  absences: {
    getAbsences: new GetAbsences(absenceRepository),
    createAbsence: new CreateAbsence(absenceRepository),
  },
  payments: {
    getPayments: new GetPayments(paymentRepository),
  },
  appointments: {
    getAppointments: new GetAppointments(appointmentRepository),
    createAppointment: new CreateAppointment(appointmentRepository),
  },
  notifications: {
    getNotifications: new GetNotifications(notificationRepository),
    markAsRead: new MarkNotificationRead(notificationRepository),
    subscribe: new SubscribeNotifications(notificationRepository),
  },
  admin: {
    getAllUsers: new GetAllUsers(userRepository),
    updateUserProfile: new UpdateUserProfile(userRepository),
    payments: new AdminPaymentUseCases(paymentRepository),
    payroll: new AdminPayrollUseCases(payrollRepository),
    departments: new AdminDepartmentUseCases(departmentRepository),
    auditLogs: new AdminAuditLogUseCases(auditLogRepository),
    announcements: new AdminAnnouncementUseCases(announcementRepository),
    requestReports: new AdminRequestReportUseCases(requestReportRepository),
    superAdmin: new SuperAdminUseCases(superAdminRepository),
    exports: new ExportUseCases(exportRepository),
    sensitiveProfiles: new SensitiveProfileUseCases(sensitiveProfileRepository),
    companySettings: new CompanySettingsUseCases(companySettingsRepository),
    calendar: new CompanyCalendarUseCases(companyCalendarRepository),
  },
  documents: {
    getDocumentos: new GetDocumentos(documentoRepository),
    marcarLeido: new MarkDocumentRead(documentoRepository),
    getByCompany: new GetCompanyDocuments(documentoRepository),
    subscribeByCompany: new SubscribeCompanyDocuments(documentoRepository),
    create: new CreateDocument(documentoRepository),
    delete: new DeleteDocument(documentoRepository),
    deleteWithAsset: new DeleteDocumentWithAsset(documentoRepository),
    getStorageStats: new GetDocumentStorageStats(documentoRepository),
  },
  feedback: {
    getFeedbacks: new GetFeedbacks(feedbackRepository),
    sendFeedback: new SubmitFeedback(feedbackRepository),
  },
  attendance: {
    record: new RecordAttendance(attendanceRepository),
    getHistory: new GetAttendanceHistory(attendanceRepository),
    getCurrentShift: new GetCurrentShift(attendanceRepository),
    getCompany: new GetCompanyAttendance(attendanceRepository),
    getDailySummary: new GetCompanyDailyAttendanceSummary(attendanceRepository),
  },
  inbox: {
    get: new GetInbox(inboxRepository),
    resolve: new ResolveInboxItem(inboxRepository),
    subscribe: new SubscribeToInbox(inboxRepository),
  },
  requests: {
    create: new CreateInternalRequest(internalRequestRepository),
    getByUser: new GetInternalRequests(internalRequestRepository),
  },
  leader: new LeaderUseCases(leaderRepository),
  chat: {
    send: new SendContextualMessage(chatContextualRepository),
    subscribe: new SubscribeToChatContext(chatContextualRepository),
    internal: new InternalChatUseCases(internalChatRepository),
  },
  ai: new AiAssistantUseCases(aiAssistantRepository),
  inventory: new InventoryUseCases(inventoryRepository),
  training: {
    getCourses: (empresaId: string) => courseRepository.getAll(empresaId),
    getCourseById: (id: string) => courseRepository.getById(id),
    getProgressForUser: (empresaId: string, empleadoId: string) => courseRepository.getProgressForUser(empresaId, empleadoId),
    completeModule: (cursoId: string, moduloIndex: number) => courseRepository.completeModule(cursoId, moduloIndex),
  }
};
