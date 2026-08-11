/**
 * DI container de Nexxus. Wiring completo sobre Supabase (ver
 * nexxus/app/src/infrastructure/supabase/).
 */

import { SupabaseTaskRepository } from './supabase/SupabaseTaskRepository';
import { SupabaseAbsenceRepository } from './supabase/SupabaseAbsenceRepository';
import { SupabasePaymentRepository } from './supabase/SupabasePaymentRepository';
import { SupabasePayrollRepository } from './supabase/SupabasePayrollRepository';
import { SupabaseAppointmentRepository } from './supabase/SupabaseAppointmentRepository';
import { SupabaseNotificationRepository } from './supabase/SupabaseNotificationRepository';
import { SupabaseDepartmentRepository } from './supabase/SupabaseDepartmentRepository';
import { SupabaseAuditLogRepository } from './supabase/SupabaseAuditLogRepository';
import { SupabaseAnnouncementRepository } from './supabase/SupabaseAnnouncementRepository';
import { SupabaseCourseRepository } from './supabase/SupabaseCourseRepository';

// Casos de Uso
import { GetTasks } from 'domain/application/use-cases/tasks/GetTasks';
import { CreateTask } from 'domain/application/use-cases/tasks/CreateTask';
import { UpdateTask } from 'domain/application/use-cases/tasks/UpdateTask';
import { SubscribeTasks } from 'domain/application/use-cases/tasks/SubscribeTasks';

import { GetAbsences } from 'domain/application/use-cases/absences/GetAbsences';
import { CreateAbsence } from 'domain/application/use-cases/absences/CreateAbsence';

import { GetPayments } from 'domain/application/use-cases/payments/GetPayments';
import { SubscribePayments } from 'domain/application/use-cases/payments/SubscribePayments';

import { GetAppointments } from 'domain/application/use-cases/appointments/GetAppointments';
import { CreateAppointment } from 'domain/application/use-cases/appointments/CreateAppointment';

import { GetNotifications } from 'domain/application/use-cases/notifications/GetNotifications';
import { MarkNotificationRead } from 'domain/application/use-cases/notifications/MarkNotificationRead';
import { SubscribeNotifications } from 'domain/application/use-cases/notifications/SubscribeNotifications';

import { GetDocumentos, MarkDocumentRead, GetCompanyDocuments, CreateDocument, DeleteDocument, SubscribeCompanyDocuments, DeleteDocumentWithAsset, GetDocumentStorageStats } from 'domain/application/use-cases/documents/DocumentUseCases';
import { GetFocusSessions, SaveFocusSession } from 'domain/application/use-cases/wellness/FocusSessionUseCases';
import { GetFeedbacks, SubmitFeedback } from 'domain/application/use-cases/feedback/FeedbackUseCases';

import { SupabaseAuthRepository } from './supabase/SupabaseAuthRepository';
import { SupabaseUserRepository } from './supabase/SupabaseUserRepository';
import { SupabaseCheckInRepository } from './supabase/SupabaseCheckInRepository';
import { SupabaseFocusSessionRepository } from './supabase/SupabaseFocusSessionRepository';
import { SupabaseDocumentoRepository } from './supabase/SupabaseDocumentoRepository';
import { SupabaseFeedbackRepository } from './supabase/SupabaseFeedbackRepository';
import { SupabaseAttendanceRepository } from './supabase/SupabaseAttendanceRepository';
import { SupabaseInboxRepository } from './supabase/SupabaseInboxRepository';
import { SupabasePushTokenRepository } from './supabase/SupabasePushTokenRepository';
import { SupabasePushSenderRepository } from './supabase/SupabasePushSenderRepository';
import { SupabaseAutomationRuleRepository } from './supabase/SupabaseAutomationRuleRepository';
import { SupabaseGraphRelationRepository } from './supabase/SupabaseGraphRelationRepository';
import { SupabaseInternalRequestRepository, SupabaseChatContextualRepository } from './supabase/SupabaseFase2Repositories';
import { SupabaseRequestReportRepository } from './supabase/SupabaseRequestReportRepository';
import { SupabaseLeaderRepository } from './supabase/SupabaseLeaderRepository';
import { SupabaseSuperAdminRepository } from './supabase/SupabaseSuperAdminRepository';
import { SupabaseInternalChatRepository } from './supabase/SupabaseInternalChatRepository';
import { SupabaseAiAssistantRepository } from './supabase/SupabaseAiAssistantRepository';
import { SupabaseInventoryRepository } from './supabase/SupabaseInventoryRepository';
import { SupabaseExportRepository } from './supabase/SupabaseExportRepository';
import { SupabaseSensitiveProfileRepository } from './supabase/SupabaseSensitiveProfileRepository';
import { SupabaseCompanySettingsRepository } from './supabase/SupabaseCompanySettingsRepository';
import { SupabaseCompanyCalendarRepository } from './supabase/SupabaseCompanyCalendarRepository';

import { LoginUser } from 'domain/application/use-cases/auth/LoginUser';
import { LoginEmpresarial } from 'domain/application/use-cases/auth/LoginEmpresarial';
import { LogoutUser } from 'domain/application/use-cases/auth/LogoutUser';
import { GetCurrentUser } from 'domain/application/use-cases/auth/GetCurrentUser';
import { RecordCheckIn } from 'domain/application/use-cases/wellness/RecordCheckIn';
import { GetWellnessMetrics } from 'domain/application/use-cases/wellness/GetWellnessMetrics';
import { GetAllUsers } from 'domain/application/use-cases/admin/GetAllUsers';
import { UpdateUserProfile } from 'domain/application/use-cases/admin/UpdateUserProfile';

import { RecordAttendance, GetAttendanceHistory, GetCurrentShift, GetCompanyAttendance, GetCompanyDailyAttendanceSummary } from 'domain/application/use-cases/attendance/AttendanceUseCases';
import { GetInbox, ResolveInboxItem, SubscribeToInbox, AddInboxItem } from 'domain/application/use-cases/inbox/InboxUseCases';
import { RegisterPushToken, UnregisterPushToken, GetPushTokens, SendPushNotification } from 'domain/application/use-cases/push/PushTokenUseCases';
import { GetAutomationRules, CreateAutomationRule, SetAutomationRuleActive, DeleteAutomationRule, RunAutomationRulesNow } from 'domain/application/use-cases/automations/AutomationRuleUseCases';
import { AddGraphRelation, GetEntityRelations } from 'domain/application/use-cases/graph/GraphRelationUseCases';
import { CreateInternalRequest, GetInternalRequests, SendContextualMessage, SubscribeToChatContext } from 'domain/application/use-cases/fase2/Fase2UseCases';

import { AdminPaymentUseCases } from 'domain/application/use-cases/admin/AdminPaymentUseCases';
import { AdminPayrollUseCases } from 'domain/application/use-cases/admin/AdminPayrollUseCases';
import { AdminDepartmentUseCases } from 'domain/application/use-cases/admin/AdminDepartmentUseCases';
import { AdminAuditLogUseCases } from 'domain/application/use-cases/admin/AdminAuditLogUseCases';
import { AdminAnnouncementUseCases } from 'domain/application/use-cases/admin/AdminAnnouncementUseCases';
import { AdminRequestReportUseCases } from 'domain/application/use-cases/admin/AdminRequestReportUseCases';
import { LeaderUseCases } from 'domain/application/use-cases/leader/LeaderUseCases';
import { SuperAdminUseCases } from 'domain/application/use-cases/admin/SuperAdminUseCases';
import { InternalChatUseCases } from 'domain/application/use-cases/chat/InternalChatUseCases';
import { AiAssistantUseCases } from 'domain/application/use-cases/ai/AiAssistantUseCases';
import { InventoryUseCases } from 'domain/application/use-cases/inventory/InventoryUseCases';
import { ExportUseCases } from 'domain/application/use-cases/admin/ExportUseCases';
import { SensitiveProfileUseCases } from 'domain/application/use-cases/admin/SensitiveProfileUseCases';
import { CompanySettingsUseCases } from 'domain/application/use-cases/admin/CompanySettingsUseCases';
import { CompanyCalendarUseCases } from 'domain/application/use-cases/admin/CompanyCalendarUseCases';

// ── Repositorios (Supabase) ──────────────────────────
const authRepository = new SupabaseAuthRepository();
const userRepository = new SupabaseUserRepository();
const checkInRepository = new SupabaseCheckInRepository();
const taskRepository = new SupabaseTaskRepository();
const absenceRepository = new SupabaseAbsenceRepository();
const paymentRepository = new SupabasePaymentRepository();
const payrollRepository = new SupabasePayrollRepository();
const appointmentRepository = new SupabaseAppointmentRepository();
const notificationRepository = new SupabaseNotificationRepository();
const departmentRepository = new SupabaseDepartmentRepository();
const auditLogRepository = new SupabaseAuditLogRepository();
const announcementRepository = new SupabaseAnnouncementRepository();
const focusSessionRepository = new SupabaseFocusSessionRepository();
const documentoRepository = new SupabaseDocumentoRepository();
const feedbackRepository = new SupabaseFeedbackRepository();
const attendanceRepository = new SupabaseAttendanceRepository();
const inboxRepository = new SupabaseInboxRepository();
const pushTokenRepository = new SupabasePushTokenRepository();
const pushSenderRepository = new SupabasePushSenderRepository();
const automationRuleRepository = new SupabaseAutomationRuleRepository();
const graphRelationRepository = new SupabaseGraphRelationRepository();
const internalRequestRepository = new SupabaseInternalRequestRepository();
const chatContextualRepository = new SupabaseChatContextualRepository();
const requestReportRepository = new SupabaseRequestReportRepository();
const leaderRepository = new SupabaseLeaderRepository();
const superAdminRepository = new SupabaseSuperAdminRepository();
const internalChatRepository = new SupabaseInternalChatRepository();
const aiAssistantRepository = new SupabaseAiAssistantRepository();
const inventoryRepository = new SupabaseInventoryRepository();
const exportRepository = new SupabaseExportRepository();
const sensitiveProfileRepository = new SupabaseSensitiveProfileRepository();
const companySettingsRepository = new SupabaseCompanySettingsRepository();
const companyCalendarRepository = new SupabaseCompanyCalendarRepository();
const courseRepository = new SupabaseCourseRepository();

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
    subscribe: new SubscribePayments(paymentRepository),
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
    add: new AddInboxItem(inboxRepository),
  },
  push: {
    register: new RegisterPushToken(pushTokenRepository),
    unregister: new UnregisterPushToken(pushTokenRepository),
    getByUser: new GetPushTokens(pushTokenRepository),
    send: new SendPushNotification(pushSenderRepository),
  },
  automations: {
    getByCompany: new GetAutomationRules(automationRuleRepository),
    create: new CreateAutomationRule(automationRuleRepository),
    setActive: new SetAutomationRuleActive(automationRuleRepository),
    remove: new DeleteAutomationRule(automationRuleRepository),
    runNow: new RunAutomationRulesNow(automationRuleRepository),
  },
  graph: {
    addRelation: new AddGraphRelation(graphRelationRepository),
    getForEntity: new GetEntityRelations(graphRelationRepository),
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
