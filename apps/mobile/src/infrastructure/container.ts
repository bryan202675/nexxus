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
import { SupabaseTaskCommentRepository } from './supabase/SupabaseTaskCommentRepository';
import { SupabaseTaskSubtaskRepository } from './supabase/SupabaseTaskSubtaskRepository';
import { SupabaseTaskAttachmentRepository } from './supabase/SupabaseTaskAttachmentRepository';
import { SupabaseTicketRepository } from './supabase/SupabaseTicketRepository';
import { SupabaseTicketMessageRepository } from './supabase/SupabaseTicketMessageRepository';
import { SupabaseSessionDeviceRepository } from './supabase/SupabaseSessionDeviceRepository';
import { SupabasePauseRepository } from './supabase/SupabasePauseRepository';
import { SavePause, GetPausesByUser } from './PauseUseCases';

// Casos de Uso
import { GetTasks } from 'domain/application/use-cases/tasks/GetTasks';
import { CreateTask } from 'domain/application/use-cases/tasks/CreateTask';
import { UpdateTask } from 'domain/application/use-cases/tasks/UpdateTask';
import { SubscribeTasks } from 'domain/application/use-cases/tasks/SubscribeTasks';
import { DeleteTask } from 'domain/application/use-cases/tasks/DeleteTask';
import { GetTasksByIds } from 'domain/application/use-cases/tasks/GetTasksByIds';
import { GetTasksByCompany } from 'domain/application/use-cases/tasks/GetTasksByCompany';
import { GetTaskComments, SubscribeTaskComments, CreateTaskComment, UpdateTaskComment, DeleteTaskComment } from 'domain/application/use-cases/task-comments/TaskCommentUseCases';
import { GetTaskSubtasks, SubscribeTaskSubtasks, CreateTaskSubtask, ToggleTaskSubtask, DeleteTaskSubtask } from 'domain/application/use-cases/task-subtasks/TaskSubtaskUseCases';
import { GetTaskAttachments, SubscribeTaskAttachments, CreateTaskAttachment, DeleteTaskAttachment } from 'domain/application/use-cases/task-attachments/TaskAttachmentUseCases';
import { GetTicketsForUser, SubscribeTicketsForUser, GetTicketsForCompany, SubscribeTicketsForCompany, CreateTicket, UpdateTicketEstado } from 'domain/application/use-cases/tickets/TicketUseCases';
import { GetTicketMessages, SubscribeTicketMessages, CreateTicketMessage } from 'domain/application/use-cases/ticket-messages/TicketMessageUseCases';
import { GetSessionDevices, SubscribeSessionDevices, RegisterSessionDevice, RemoveSessionDevice, RemoveOtherSessionDevices } from 'domain/application/use-cases/session-devices/SessionDeviceUseCases';

import { GetAbsences } from 'domain/application/use-cases/absences/GetAbsences';
import { CreateAbsence } from 'domain/application/use-cases/absences/CreateAbsence';
import { SubscribeAbsences } from 'domain/application/use-cases/absences/SubscribeAbsences';
import { UpdateAbsenceState } from 'domain/application/use-cases/absences/UpdateAbsenceState';
import { UpdateAbsence } from 'domain/application/use-cases/absences/UpdateAbsence';
import { DeleteAbsence } from 'domain/application/use-cases/absences/DeleteAbsence';

import { GetPayments } from 'domain/application/use-cases/payments/GetPayments';
import { SubscribePayments } from 'domain/application/use-cases/payments/SubscribePayments';

import { GetAppointments } from 'domain/application/use-cases/appointments/GetAppointments';
import { CreateAppointment } from 'domain/application/use-cases/appointments/CreateAppointment';

import { GetNotifications } from 'domain/application/use-cases/notifications/GetNotifications';
import { MarkNotificationRead } from 'domain/application/use-cases/notifications/MarkNotificationRead';
import { SubscribeNotifications } from 'domain/application/use-cases/notifications/SubscribeNotifications';

import { GetDocumentos, MarkDocumentRead, GetCompanyDocuments, CreateDocument, DeleteDocument, SubscribeCompanyDocuments, DeleteDocumentWithAsset, GetDocumentStorageStats, AddDocumentVersion } from 'domain/application/use-cases/documents/DocumentUseCases';
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
import { SupabasePlanRepository } from './supabase/SupabasePlanRepository';
import { SupabaseAchievementRepository } from './supabase/SupabaseAchievementRepository';
import { SupabaseObjectiveRepository } from './supabase/SupabaseObjectiveRepository';
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
import { LogoutOtherSessions } from 'domain/application/use-cases/auth/LogoutOtherSessions';
import { GetCurrentUser } from 'domain/application/use-cases/auth/GetCurrentUser';
import { RecordCheckIn } from 'domain/application/use-cases/wellness/RecordCheckIn';
import { GetWellnessMetrics } from 'domain/application/use-cases/wellness/GetWellnessMetrics';
import { GetAllUsers } from 'domain/application/use-cases/admin/GetAllUsers';
import { UpdateUserProfile } from 'domain/application/use-cases/admin/UpdateUserProfile';

import { RecordAttendance, GetAttendanceHistory, GetCurrentShift, GetCompanyAttendance, GetCompanyDailyAttendanceSummary } from 'domain/application/use-cases/attendance/AttendanceUseCases';
import { GetInbox, ResolveInboxItem, SubscribeToInbox, AddInboxItem } from 'domain/application/use-cases/inbox/InboxUseCases';
import { RegisterPushToken, UnregisterPushToken, GetPushTokens, SendPushNotification } from 'domain/application/use-cases/push/PushTokenUseCases';
import { GetPlans } from 'domain/application/use-cases/plans/PlanUseCases';
import { GetEarnedAchievements, SyncAchievements } from 'domain/application/use-cases/achievements/AchievementUseCases';
import { GetObjectivesForUser, SubscribeObjectives, CreateObjective, UpdateKeyResultValue, UpdateObjectiveEstado, DeleteObjective } from 'domain/application/use-cases/objectives/ObjectiveUseCases';
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
const planRepository = new SupabasePlanRepository();
const achievementRepository = new SupabaseAchievementRepository();
const objectiveRepository = new SupabaseObjectiveRepository();
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
const taskCommentRepository = new SupabaseTaskCommentRepository();
const taskSubtaskRepository = new SupabaseTaskSubtaskRepository();
const taskAttachmentRepository = new SupabaseTaskAttachmentRepository();
const ticketRepository = new SupabaseTicketRepository();
const ticketMessageRepository = new SupabaseTicketMessageRepository();
const sessionDeviceRepository = new SupabaseSessionDeviceRepository();
const pauseRepository = new SupabasePauseRepository();

// ── Casos de Uso ─────────────────────────────────────────────
export const useCases = {
  auth: {
    login: new LoginUser(authRepository),
    loginEmpresarial: new LoginEmpresarial(authRepository),
    logout: new LogoutUser(authRepository),
    logoutOtherSessions: new LogoutOtherSessions(authRepository),
    getCurrentUser: new GetCurrentUser(authRepository),
  },
  wellness: {
    recordCheckIn: new RecordCheckIn(checkInRepository, userRepository),
    getMetrics: new GetWellnessMetrics(checkInRepository),
    getFocusSessions: new GetFocusSessions(focusSessionRepository),
    saveFocusSession: new SaveFocusSession(focusSessionRepository),
  },
  pauses: {
    save: new SavePause(pauseRepository),
    getByUser: new GetPausesByUser(pauseRepository),
  },
  tasks: {
    getTasks: new GetTasks(taskRepository),
    createTask: new CreateTask(taskRepository),
    updateTask: new UpdateTask(taskRepository),
    subscribe: new SubscribeTasks(taskRepository),
    remove: new DeleteTask(taskRepository),
    getByIds: new GetTasksByIds(taskRepository),
    getByCompany: new GetTasksByCompany(taskRepository),
    comments: {
      get: new GetTaskComments(taskCommentRepository),
      subscribe: new SubscribeTaskComments(taskCommentRepository),
      create: new CreateTaskComment(taskCommentRepository),
      update: new UpdateTaskComment(taskCommentRepository),
      remove: new DeleteTaskComment(taskCommentRepository),
    },
    subtasks: {
      get: new GetTaskSubtasks(taskSubtaskRepository),
      subscribe: new SubscribeTaskSubtasks(taskSubtaskRepository),
      create: new CreateTaskSubtask(taskSubtaskRepository),
      toggle: new ToggleTaskSubtask(taskSubtaskRepository),
      remove: new DeleteTaskSubtask(taskSubtaskRepository),
    },
    attachments: {
      get: new GetTaskAttachments(taskAttachmentRepository),
      subscribe: new SubscribeTaskAttachments(taskAttachmentRepository),
      create: new CreateTaskAttachment(taskAttachmentRepository),
      remove: new DeleteTaskAttachment(taskAttachmentRepository),
    },
  },
  absences: {
    getAbsences: new GetAbsences(absenceRepository),
    createAbsence: new CreateAbsence(absenceRepository),
    subscribe: new SubscribeAbsences(absenceRepository),
    updateState: new UpdateAbsenceState(absenceRepository),
    updateAbsence: new UpdateAbsence(absenceRepository),
    deleteAbsence: new DeleteAbsence(absenceRepository),
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
    addVersion: new AddDocumentVersion(documentoRepository),
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
  plans: {
    getAll: new GetPlans(planRepository),
  },
  achievements: {
    getEarned: new GetEarnedAchievements(achievementRepository),
    sync: new SyncAchievements(achievementRepository),
  },
  objectives: {
    getByUser: new GetObjectivesForUser(objectiveRepository),
    subscribe: new SubscribeObjectives(objectiveRepository),
    create: new CreateObjective(objectiveRepository),
    updateKeyResult: new UpdateKeyResultValue(objectiveRepository),
    updateEstado: new UpdateObjectiveEstado(objectiveRepository),
    remove: new DeleteObjective(objectiveRepository),
  },
  tickets: {
    getByUser: new GetTicketsForUser(ticketRepository),
    subscribeByUser: new SubscribeTicketsForUser(ticketRepository),
    getByCompany: new GetTicketsForCompany(ticketRepository),
    subscribeByCompany: new SubscribeTicketsForCompany(ticketRepository),
    create: new CreateTicket(ticketRepository),
    updateEstado: new UpdateTicketEstado(ticketRepository),
    messages: {
      get: new GetTicketMessages(ticketMessageRepository),
      subscribe: new SubscribeTicketMessages(ticketMessageRepository),
      create: new CreateTicketMessage(ticketMessageRepository),
    },
  },
  sessionDevices: {
    getByUser: new GetSessionDevices(sessionDeviceRepository),
    subscribe: new SubscribeSessionDevices(sessionDeviceRepository),
    register: new RegisterSessionDevice(sessionDeviceRepository),
    remove: new RemoveSessionDevice(sessionDeviceRepository),
    removeOthers: new RemoveOtherSessionDevices(sessionDeviceRepository),
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
