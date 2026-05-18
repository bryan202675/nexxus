
import { FirebaseTaskRepository } from './FirebaseTaskRepository';
import { FirebaseAbsenceRepository } from './FirebaseAbsenceRepository';
import { FirebasePaymentRepository } from './FirebasePaymentRepository';
import { FirebaseAppointmentRepository } from './FirebaseAppointmentRepository';
import { FirebaseNotificationRepository } from './FirebaseNotificationRepository';
import { FirebaseDepartmentRepository } from './FirebaseDepartmentRepository';
import { FirebaseAuditLogRepository } from './FirebaseAuditLogRepository';
import { FirebaseAnnouncementRepository } from './FirebaseAnnouncementRepository';
import { FirebaseCourseRepository } from './FirebaseCourseRepository';

// Casos de Uso
import { GetTasks } from '@/application/use-cases/tasks/GetTasks';
import { CreateTask } from '@/application/use-cases/tasks/CreateTask';
import { UpdateTask } from '@/application/use-cases/tasks/UpdateTask';
import { SubscribeTasks } from '@/application/use-cases/tasks/SubscribeTasks';

import { GetAbsences } from '@/application/use-cases/absences/GetAbsences';
import { CreateAbsence } from '@/application/use-cases/absences/CreateAbsence';

import { GetPayments } from '@/application/use-cases/payments/GetPayments';

import { GetAppointments } from '@/application/use-cases/appointments/GetAppointments';
import { CreateAppointment } from '@/application/use-cases/appointments/CreateAppointment';

import { GetNotifications } from '@/application/use-cases/notifications/GetNotifications';
import { MarkNotificationRead } from '@/application/use-cases/notifications/MarkNotificationRead';

import { GetDocumentos, MarkDocumentRead } from '@/application/use-cases/documents/DocumentUseCases';
import { GetFocusSessions, SaveFocusSession } from '@/application/use-cases/wellness/FocusSessionUseCases';
import { GetFeedbacks, SubmitFeedback } from '@/application/use-cases/feedback/FeedbackUseCases';

import { FirebaseAuthRepository } from './FirebaseAuthRepository';
import { FirebaseUserRepository } from './FirebaseUserRepository';
import { FirebaseCheckInRepository } from './FirebaseCheckInRepository';
import { FirebasePauseRepository } from './FirebasePauseRepository';
import { FirebaseFocusSessionRepository } from './FirebaseFocusSessionRepository';
import { FirebaseDocumentoRepository } from './FirebaseDocumentoRepository';
import { FirebaseFeedbackRepository } from './FirebaseFeedbackRepository';
import { FirebaseAttendanceRepository } from './FirebaseAttendanceRepository';
import { FirebaseInboxRepository } from './FirebaseInboxRepository';
import { FirebaseInternalRequestRepository, FirebaseChatContextualRepository } from './FirebaseFase2Repositories';

import { LoginUser } from '@/application/use-cases/auth/LoginUser';
import { LoginEmpresarial } from '@/application/use-cases/auth/LoginEmpresarial';
import { LogoutUser } from '@/application/use-cases/auth/LogoutUser';
import { GetCurrentUser } from '@/application/use-cases/auth/GetCurrentUser';
import { RecordCheckIn } from '@/application/use-cases/wellness/RecordCheckIn';
import { GetWellnessMetrics } from '@/application/use-cases/wellness/GetWellnessMetrics';
import { GetAllUsers } from '@/application/use-cases/admin/GetAllUsers';
import { UpdateUserProfile } from '@/application/use-cases/admin/UpdateUserProfile';

import { RecordAttendance, GetAttendanceHistory, GetCurrentShift } from '@/application/use-cases/attendance/AttendanceUseCases';
import { GetInbox, ResolveInboxItem, SubscribeToInbox } from '@/application/use-cases/inbox/InboxUseCases';
import { CreateInternalRequest, GetInternalRequests, SendContextualMessage, SubscribeToChatContext } from '@/application/use-cases/fase2/Fase2UseCases';

// New Admin Use Cases
import { AdminPaymentUseCases } from '@/application/use-cases/admin/AdminPaymentUseCases';
import { AdminDepartmentUseCases } from '@/application/use-cases/admin/AdminDepartmentUseCases';
import { AdminAuditLogUseCases } from '@/application/use-cases/admin/AdminAuditLogUseCases';
import { AdminAnnouncementUseCases } from '@/application/use-cases/admin/AdminAnnouncementUseCases';

// ── Repositorios (REALEZ - FIREBASE) ──────────────────────────
const authRepository = new FirebaseAuthRepository();
const userRepository = new FirebaseUserRepository();

const checkInRepository = new FirebaseCheckInRepository();
const taskRepository = new FirebaseTaskRepository();
const absenceRepository = new FirebaseAbsenceRepository();
const paymentRepository = new FirebasePaymentRepository();
const appointmentRepository = new FirebaseAppointmentRepository();
const notificationRepository = new FirebaseNotificationRepository();
const departmentRepository = new FirebaseDepartmentRepository();
const auditLogRepository = new FirebaseAuditLogRepository();
const announcementRepository = new FirebaseAnnouncementRepository();
const focusSessionRepository = new FirebaseFocusSessionRepository();
const documentoRepository = new FirebaseDocumentoRepository();
const feedbackRepository = new FirebaseFeedbackRepository();
const attendanceRepository = new FirebaseAttendanceRepository();
const inboxRepository = new FirebaseInboxRepository();
const internalRequestRepository = new FirebaseInternalRequestRepository();
const chatContextualRepository = new FirebaseChatContextualRepository();
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
  },
  admin: {
    getAllUsers: new GetAllUsers(userRepository),
    updateUserProfile: new UpdateUserProfile(userRepository),
    payments: new AdminPaymentUseCases(paymentRepository),
    departments: new AdminDepartmentUseCases(departmentRepository),
    auditLogs: new AdminAuditLogUseCases(auditLogRepository),
    announcements: new AdminAnnouncementUseCases(announcementRepository),
  },
  documents: {
    getDocumentos: new GetDocumentos(documentoRepository),
    marcarLeido: new MarkDocumentRead(documentoRepository),
  },
  feedback: {
    getFeedbacks: new GetFeedbacks(feedbackRepository),
    sendFeedback: new SubmitFeedback(feedbackRepository),
  },
  attendance: {
    record: new RecordAttendance(attendanceRepository),
    getHistory: new GetAttendanceHistory(attendanceRepository),
    getCurrentShift: new GetCurrentShift(attendanceRepository),
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
  chat: {
    send: new SendContextualMessage(chatContextualRepository),
    subscribe: new SubscribeToChatContext(chatContextualRepository),
  },
  training: {
    getCourses: (empresaId: string) => courseRepository.getAll(empresaId),
    getCourseById: (id: string) => courseRepository.getById(id),
  }
};
