import { readFileSync } from 'node:fs';

const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const backend = readFileSync(new URL('../backend/index.js', import.meta.url), 'utf8');
const firestoreIndexes = readFileSync(new URL('../firestore.indexes.json', import.meta.url), 'utf8');
const adminNavigator = readFileSync(new URL('../app/src/presentation/navigation/AdminNavigator.tsx', import.meta.url), 'utf8');
const superAdminDashboard = readFileSync(new URL('../app/src/presentation/screens/admin/SuperAdminDashboard.tsx', import.meta.url), 'utf8');
const attendanceRepository = readFileSync(new URL('../app/src/infrastructure/firebase/FirebaseAttendanceRepository.ts', import.meta.url), 'utf8');
const attendanceScreen = readFileSync(new URL('../app/src/presentation/screens/ControlAsistencia.tsx', import.meta.url), 'utf8');
const attendanceAdminScreen = readFileSync(new URL('../app/src/presentation/screens/admin/GestionAsistencia.tsx', import.meta.url), 'utf8');
const payrollRepository = readFileSync(new URL('../app/src/infrastructure/firebase/FirebasePayrollRepository.ts', import.meta.url), 'utf8');
const payrollScreen = readFileSync(new URL('../app/src/presentation/screens/admin/GestionNomina.tsx', import.meta.url), 'utf8');
const sensitiveProfileRepository = readFileSync(new URL('../app/src/infrastructure/firebase/FirebaseSensitiveProfileRepository.ts', import.meta.url), 'utf8');
const plantillaScreen = readFileSync(new URL('../app/src/presentation/screens/admin/GestionPlantilla.tsx', import.meta.url), 'utf8');
const salaryScreen = readFileSync(new URL('../app/src/presentation/screens/MiSalario.tsx', import.meta.url), 'utf8');
const notificationRepository = readFileSync(new URL('../app/src/infrastructure/firebase/FirebaseNotificationRepository.ts', import.meta.url), 'utf8');
const userContext = readFileSync(new URL('../app/src/presentation/context/ContextoUsuario.tsx', import.meta.url), 'utf8');
const appShell = readFileSync(new URL('../app/App.tsx', import.meta.url), 'utf8');
const userNavigator = readFileSync(new URL('../app/src/presentation/navigation/UserNavigator.tsx', import.meta.url), 'utf8');
const internalChatScreen = readFileSync(new URL('../app/src/presentation/screens/ChatInterno.tsx', import.meta.url), 'utf8');
const adminMessagingScreen = readFileSync(new URL('../app/src/presentation/screens/admin/MensajeriaInternaAdmin.tsx', import.meta.url), 'utf8');
const leaderScreen = readFileSync(new URL('../app/src/presentation/screens/PanelJefe.tsx', import.meta.url), 'utf8');
const leaderRepository = readFileSync(new URL('../app/src/infrastructure/firebase/FirebaseLeaderRepository.ts', import.meta.url), 'utf8');
const leaderEvaluationForm = readFileSync(new URL('../app/src/presentation/components/LeaderEvaluationForm.tsx', import.meta.url), 'utf8');
const superAdminRepository = readFileSync(new URL('../app/src/infrastructure/firebase/FirebaseSuperAdminRepository.ts', import.meta.url), 'utf8');
const internalChatRepository = readFileSync(new URL('../app/src/infrastructure/firebase/FirebaseInternalChatRepository.ts', import.meta.url), 'utf8');
const uploadLimits = readFileSync(new URL('../app/src/infrastructure/storage/uploadLimits.ts', import.meta.url), 'utf8');
const chatIAScreen = readFileSync(new URL('../app/src/presentation/screens/ChatIA.tsx', import.meta.url), 'utf8');
const aiRepository = readFileSync(new URL('../app/src/infrastructure/firebase/FirebaseAiAssistantRepository.ts', import.meta.url), 'utf8');
const aiUseCases = readFileSync(new URL('../app/src/application/use-cases/ai/AiAssistantUseCases.ts', import.meta.url), 'utf8');
const planCatalog = readFileSync(new URL('../app/src/shared/billing/plans.ts', import.meta.url), 'utf8');
const planAccess = readFileSync(new URL('../app/src/Landing/planAccess.ts', import.meta.url), 'utf8');
const configAdmin = readFileSync(new URL('../app/src/presentation/screens/admin/ConfiguracionAdmin.tsx', import.meta.url), 'utf8');
const companySettingsRepository = readFileSync(new URL('../app/src/infrastructure/firebase/FirebaseCompanySettingsRepository.ts', import.meta.url), 'utf8');
const requestReportsScreen = readFileSync(new URL('../app/src/presentation/screens/admin/CentroReportesSolicitudes.tsx', import.meta.url), 'utf8');
const requestReportRepository = readFileSync(new URL('../app/src/infrastructure/firebase/FirebaseRequestReportRepository.ts', import.meta.url), 'utf8');
const exportRepository = readFileSync(new URL('../app/src/infrastructure/firebase/FirebaseExportRepository.ts', import.meta.url), 'utf8');
const communicationAdmin = readFileSync(new URL('../app/src/presentation/screens/admin/ComunicacionAdmin.tsx', import.meta.url), 'utf8');
const announcementRepository = readFileSync(new URL('../app/src/infrastructure/firebase/FirebaseAnnouncementRepository.ts', import.meta.url), 'utf8');
const documentsAdminScreen = readFileSync(new URL('../app/src/presentation/screens/admin/GestionDocumentos.tsx', import.meta.url), 'utf8');
const documentRepository = readFileSync(new URL('../app/src/infrastructure/firebase/FirebaseDocumentoRepository.ts', import.meta.url), 'utf8');
const calendarAdminScreen = readFileSync(new URL('../app/src/presentation/screens/admin/CalendarioEmpresarial.tsx', import.meta.url), 'utf8');
const calendarRepository = readFileSync(new URL('../app/src/infrastructure/firebase/FirebaseCompanyCalendarRepository.ts', import.meta.url), 'utf8');
const inventoryRepository = readFileSync(new URL('../app/src/infrastructure/firebase/FirebaseInventoryRepository.ts', import.meta.url), 'utf8');
const inventoryUseCases = readFileSync(new URL('../app/src/application/use-cases/inventory/InventoryUseCases.ts', import.meta.url), 'utf8');
const courseRepository = readFileSync(new URL('../app/src/infrastructure/firebase/FirebaseCourseRepository.ts', import.meta.url), 'utf8');
const learningScreen = readFileSync(new URL('../app/src/presentation/screens/CentroAprendizaje.tsx', import.meta.url), 'utf8');
const superAdminSeed = readFileSync(new URL('../backend/scripts/seed-super-admin.js', import.meta.url), 'utf8');
const secretsDoc = readFileSync(new URL('../docs/configuracion-secretos-nexxus.md', import.meta.url), 'utf8');
const parsedIndexes = JSON.parse(firestoreIndexes);

const hasIndex = (collectionGroup, fields) => parsedIndexes.indexes.some((index) => (
  index.collectionGroup === collectionGroup &&
  fields.every((field) => index.fields.some((item) => (
    item.fieldPath === field.fieldPath &&
    (item.order === field.order || item.arrayConfig === field.arrayConfig)
  )))
));

const checks = [
  {
    name: 'No permissive catch-all write rule',
    pass: !/match\s+\/\{collection\}\/\{document=\*\*\}\s*\{[\s\S]*allow\s+write:\s*if\s+autenticado\(\)/m.test(rules),
  },
  {
    name: 'No globally readable usuarios collection',
    pass: !/match\s+\/usuarios\/\{userId\}\s*\{[\s\S]*allow\s+read:\s*if\s+true\s*;/m.test(rules),
  },
  {
    name: 'Super admin role is recognized in rules',
    pass: /function\s+esSuperAdmin\(\)/.test(rules) && /super_admin/.test(rules),
  },
  {
    name: 'Super admin seed validates secrets and audits without printing password',
    pass: /NEXXUS_SUPER_ADMIN_EMAIL/.test(superAdminSeed) &&
      /NEXXUS_SUPER_ADMIN_PASSWORD/.test(superAdminSeed) &&
      /PASSWORD_PATTERN/.test(superAdminSeed) &&
      /NEXXUS_SUPER_ADMIN_ROTATE_PASSWORD/.test(superAdminSeed) &&
      /collection\("audit_logs"\)\.add/.test(superAdminSeed) &&
      /was not printed/.test(superAdminSeed) &&
      !/console\.log\([^)]*\$\{password\}/i.test(superAdminSeed) &&
      !/console\.log\(password\)/i.test(superAdminSeed),
  },
  {
    name: 'Enterprise login query has an explicit usuarios index',
    pass: /exports\.loginEmpresarial\s*=\s*onCall/.test(backend) &&
      /where\("codigoEmpresa",\s*"==",\s*codigoEmpresa\)/.test(backend) &&
      /where\("usuarioInterno",\s*"==",\s*usuarioInterno\)/.test(backend) &&
      /limit\(2\)/.test(backend) &&
      hasIndex('usuarios', [
        { fieldPath: 'codigoEmpresa', order: 'ASCENDING' },
        { fieldPath: 'usuarioInterno', order: 'ASCENDING' },
      ]),
  },
  {
    name: 'Tenant access helper is present',
    pass: /function\s+accesoEmpresa\(\w+\)/.test(rules),
  },
  {
    name: 'Subscription data deletion requires explicit env opt-in',
    pass: /NEXXUS_ALLOW_SUBSCRIPTION_DATA_DELETION/.test(backend) && /dataDeletionBlocked/.test(backend),
  },
  {
    name: 'Backend uses centralized audit writer',
    pass: /require\("\.\/audit"\)/.test(backend) && /writeAuditLog\(/.test(backend),
  },
  {
    name: 'Super admin route is role-gated in admin shell',
    pass: /isSuperAdminRole\(user\?\.rol\)/.test(adminNavigator) &&
      /SuperAdminDashboard/.test(adminNavigator) &&
      /superAdminOnly/.test(adminNavigator),
  },
  {
    name: 'Super admin dashboard uses bounded global listeners',
    pass: /collection\(db, 'empresas'\), limit\(50\)/.test(superAdminRepository) &&
      /collection\(db, 'usuarios'\), limit\(200\)/.test(superAdminRepository) &&
      /onSnapshot\(/.test(superAdminRepository),
  },
  {
    name: 'Super admin dashboard uses use cases for audited mutations',
    pass: /useCases\.admin\.superAdmin\.subscribePlatform/.test(superAdminDashboard) &&
      /useCases\.admin\.superAdmin\.applyCompanyAction/.test(superAdminDashboard) &&
      !/firebase\/firestore/.test(superAdminDashboard) &&
      /addDoc\(collection\(db, 'audit_logs'\)/.test(superAdminRepository),
  },
  {
    name: 'Super admin support impersonation is backend-only and audited',
    pass: /exports\.createSupportImpersonationSession\s*=\s*onCall/.test(backend) &&
      /if \(!isSuperAdmin\(caller\)\)/.test(backend) &&
      /collection\("support_sessions"\)\.doc\(\)/.test(backend) &&
      /createCustomToken\(targetDoc\.id, supportClaims\)/.test(backend) &&
      /Inicio de sesión de soporte/.test(backend) &&
      /impersonatedBy: caller\.id/.test(backend) &&
      /httpsCallable\(functions, 'createSupportImpersonationSession'\)/.test(superAdminRepository) &&
      /signInWithCustomToken\(auth, data\.token\)/.test(superAdminRepository) &&
      /useCases\.admin\.superAdmin\.startSupportSession/.test(superAdminDashboard) &&
      /match\s+\/support_sessions\/\{id\}/.test(rules) &&
      /allow read: if autenticado\(\) && esSuperAdmin\(\)/.test(rules) &&
      /allow create, update, delete: if false/.test(rules),
  },
  {
    name: 'Reports collection is tenant protected',
    pass: /match\s+\/reportes\/\{id\}/.test(rules) &&
      /allow create: if autenticado\(\) && puedeCrearTenant\(\) && esJefe\(\)/.test(rules),
  },
  {
    name: 'Unified request center uses bounded listeners outside presentation',
    pass: /CentroReportesSolicitudes/.test(adminNavigator) &&
      /FirebaseRequestReportRepository/.test(readFileSync(new URL('../app/src/infrastructure/firebase/container.ts', import.meta.url), 'utf8')) &&
      /firestoreLimit\(limitCount\)/.test(requestReportRepository),
  },
  {
    name: 'Request resolutions keep a visible digital confirmation',
    pass: /confirmacionDigital/.test(requestReportRepository) &&
      /confirmadoPorId/.test(requestReportRepository) &&
      /confirmadoPorNombre/.test(requestReportRepository) &&
      /confirmadoAt/.test(requestReportRepository) &&
      /Confirmado digitalmente/.test(requestReportsScreen) &&
      /signatureBox/.test(requestReportsScreen),
  },
  {
    name: 'Attendance route and calculated fields are present',
    pass: /GestionAsistencia/.test(adminNavigator) &&
      /calculateAttendanceFlags/.test(attendanceRepository) &&
      /getDailySummaryByCompany/.test(attendanceRepository),
  },
  {
    name: 'Attendance captures method and location status',
    pass: /metodoRegistro:\s*data\.metodoRegistro/.test(attendanceRepository) &&
      /ubicacionEstado:\s*data\.ubicacionEstado/.test(attendanceRepository) &&
      /capturarUbicacionAsistencia/.test(attendanceScreen) &&
      /globalThis\.navigator\?\.geolocation/.test(attendanceScreen) &&
      /registrarEventoAsistencia\('entrada', metadata\)/.test(attendanceScreen) &&
      /registrarEventoAsistencia\('salida', metadata\)/.test(attendanceScreen),
  },
  {
    name: 'Attendance export is exposed through reusable tenant export',
    pass: /EXPORT_DATASETS\s*=\s*new Set\(\["request_reports", "payroll", "attendance"\]\)/.test(backend) &&
      /dataset:\s*'attendance'/.test(attendanceAdminScreen) &&
      /saveExportFile/.test(attendanceAdminScreen) &&
      /Exportación \$\{format\.toUpperCase\(\)\} generada/.test(attendanceAdminScreen),
  },
  {
    name: 'Company onboarding seeds attendance schedule',
    pass: /horaEntrada:\s*'08:00'/.test(readFileSync(new URL('../app/src/Landing/LandingAuth.tsx', import.meta.url), 'utf8')) &&
      /toleranciaMinutos:\s*10/.test(readFileSync(new URL('../app/src/Landing/LandingAuth.tsx', import.meta.url), 'utf8')),
  },
  {
    name: 'Company settings persist attendance schedule used by attendance',
    pass: /configuraciones_empresa/.test(companySettingsRepository) &&
      /saveAttendanceSchedule/.test(companySettingsRepository) &&
      /horarioLaboral:\s*schedule/.test(companySettingsRepository) &&
      /getCompanySchedule/.test(attendanceRepository) &&
      /useCases\.admin\.companySettings\.saveAttendanceSchedule/.test(configAdmin) &&
      /Horario laboral/.test(configAdmin),
  },
  {
    name: 'Payroll canonical collection is tenant protected',
    pass: /match\s+\/nominas\/\{id\}/.test(rules) &&
      /resource\.data\.empleadoId == request\.auth\.uid/.test(rules),
  },
  {
    name: 'Payroll generation uses attendance data without simulation',
    pass: /collection\(db, 'nominas'\)/.test(payrollRepository) &&
      /collection\(db, 'asistencias'\)/.test(payrollRepository) &&
      /calculatePayroll/.test(payrollRepository) &&
      /useCases\.admin\.payroll\.generateForPeriod/.test(payrollScreen) &&
      /useCases\.admin\.payroll\.subscribeByPeriod/.test(payrollScreen) &&
      /useCases\.admin\.payroll\.approveAllForPeriod/.test(payrollScreen) &&
      /useCases\.admin\.payroll\.updateStatus/.test(payrollScreen) &&
      !/firebase\/firestore/.test(payrollScreen) &&
      !/Math\.random|todosLosPagos|virtualPago|Registro virtual|calcularNomina/.test(payrollScreen) &&
      /batch\.update\(doc\(db, 'payments', record\.legacyPaymentId\)/.test(payrollRepository) &&
      /collection\(db, 'notificaciones'\)/.test(payrollRepository),
  },
  {
    name: 'Sensitive salary profile changes are backend-audited with immutable history',
    pass: /exports\.updateSensitiveEmployeeProfile\s*=\s*onCall/.test(backend) &&
      /exports\.updateEmployeeRole\s*=\s*onCall/.test(backend) &&
      /SENSITIVE_PROFILE_FIELDS/.test(backend) &&
      /collection\("sensitive_change_history"\)\.doc\(\)/.test(backend) &&
      /Actualización perfil sensible/.test(backend) &&
      /Actualización de rol/.test(backend) &&
      /setCustomUserClaims\(empleadoId/.test(backend) &&
      /sameCompany\(caller, empresaId\)/.test(backend) &&
      /httpsCallable\(functions, 'updateSensitiveEmployeeProfile'\)/.test(sensitiveProfileRepository) &&
      /httpsCallable\(functions, 'updateEmployeeRole'\)/.test(sensitiveProfileRepository) &&
      /useCases\.admin\.sensitiveProfiles\.updateEmployeeProfile/.test(payrollScreen) &&
      /useCases\.admin\.sensitiveProfiles\.updateEmployeeRole/.test(plantillaScreen) &&
      /payloadSinRol/.test(plantillaScreen) &&
      !/Actualización Perfil Salarial/.test(payrollScreen) &&
      /match\s+\/sensitive_change_history\/\{id\}/.test(rules) &&
      /allow create, update, delete: if false/.test(rules),
  },
  {
    name: 'Employee salary screen uses context payments without direct Firestore',
    pass: /MiSalario/.test(salaryScreen) &&
      /pagos/.test(salaryScreen) &&
      /useContextoUsuario/.test(salaryScreen) &&
      !/firebase\/firestore/.test(salaryScreen) &&
      /MiSalario/.test(appShell) &&
      hasIndex('payments', [
        { fieldPath: 'usuario_id', order: 'ASCENDING' },
        { fieldPath: 'empresaId', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' },
      ]),
  },
  {
    name: 'Employee salary receipt is downloadable without extra Firestore reads',
    pass: /buildReceiptText/.test(salaryScreen) &&
      /downloadReceipt/.test(salaryScreen) &&
      /FileSystem\.writeAsStringAsync/.test(salaryScreen) &&
      /Sharing\.shareAsync/.test(salaryScreen) &&
      /new Blob\(\[content\]/.test(salaryScreen) &&
      !/getDocs|onSnapshot|collection\(db/.test(salaryScreen),
  },
  {
    name: 'Notifications are tenant-scoped, bounded and read-only for employees',
    pass: /buildUserQuery/.test(notificationRepository) &&
      /where\('empresaId', '==', empresaId\)/.test(notificationRepository) &&
      /orderBy\('fecha', 'desc'\)/.test(notificationRepository) &&
      /firestoreLimit\(count\)/.test(notificationRepository) &&
      /fechaLectura/.test(notificationRepository) &&
      /notifications\.subscribe\.execute\(user\.id, empresaId/.test(userContext) &&
      /notifications\.getNotifications\.execute\(user\.id, empresaId/.test(userContext) &&
      /affectedKeys\(\)\.hasOnly\(\["leida", "fechaLectura"\]\)/.test(rules) &&
      hasIndex('notificaciones', [
        { fieldPath: 'empresaId', order: 'ASCENDING' },
        { fieldPath: 'usuario_id', order: 'ASCENDING' },
        { fieldPath: 'fecha', order: 'DESCENDING' },
      ]),
  },
  {
    name: 'Admin communication uses repository for directory, notifications and audit',
    pass: !/firebase\/firestore/.test(communicationAdmin) &&
      !/firebaseConfig/.test(communicationAdmin) &&
      /useCases\.admin\.announcements\.subscribeCommunicationDirectory/.test(communicationAdmin) &&
      /useCases\.admin\.announcements\.publish/.test(communicationAdmin) &&
      /subscribeCommunicationDirectory/.test(announcementRepository) &&
      /publishAnnouncement/.test(announcementRepository) &&
      /collection\(db, 'notificaciones'\)/.test(announcementRepository) &&
      /collection\(db, 'audit_logs'\)/.test(announcementRepository) &&
      /firestoreLimit/.test(announcementRepository),
  },
  {
    name: 'Leader panel is role-gated in user shell',
    pass: /normalizeRole\(perfil\?\.rol\) === 'jefe'/.test(userNavigator) &&
      /<Tab\.Screen name="Equipo" component=\{PanelJefe\}/.test(userNavigator),
  },
  {
    name: 'Leader panel does not import Firebase directly',
    pass: /useCases\.leader\.subscribeDashboard/.test(leaderScreen) &&
      !/firebase\/firestore/.test(leaderScreen) &&
      !/from ['"]@\/infrastructure\/firebase\/firebaseConfig['"]/.test(leaderScreen),
  },
  {
    name: 'Leader repository scopes team with bounded listeners',
    pass: /where\('empresaId', '==', leader\.empresaId\)/.test(leaderRepository) &&
      /user\.jefeId === leader\.id/.test(leaderRepository) &&
      /limit\(limitCount\)/.test(leaderRepository) &&
      /onSnapshot\(/.test(leaderRepository),
  },
  {
    name: 'Evaluations collection is tenant protected',
    pass: /match\s+\/evaluaciones\/\{id\}/.test(rules) &&
      /allow create: if autenticado\(\) && puedeCrearTenant\(\) && esJefe\(\)/.test(rules) &&
      /resource\.data\.empleadoId == request\.auth\.uid/.test(rules) &&
      /"evaluaciones"/.test(backend),
  },
  {
    name: 'Leader evaluations use bounded repository and no presentation Firestore',
    pass: /collection\(db, 'evaluaciones'\)/.test(leaderRepository) &&
      /orderBy\('fechaCreacion', 'desc'\), limit\(limitCount\)/.test(leaderRepository) &&
      /createEvaluation/.test(leaderScreen) &&
      !/firebase\/firestore/.test(leaderScreen) &&
      !/firebase\/firestore/.test(leaderEvaluationForm),
  },
  {
    name: 'Internal messaging has separate employee leader admin surfaces',
    pass: /ChatInterno/.test(userNavigator) &&
      /MensajeriaInternaAdmin/.test(adminNavigator) &&
      /ChatIA/.test(userNavigator),
  },
  {
    name: 'Internal chat collections are tenant protected',
    pass: /match\s+\/conversaciones\/\{id\}/.test(rules) &&
      /match\s+\/mensajes\/\{id\}/.test(rules) &&
      /participaEnConversacion/.test(rules) &&
      /soloActualizaUltimoMensaje/.test(rules) &&
      /soloActualizaLecturaMensaje/.test(rules) &&
      /affectedKeys\(\)\.hasOnly\(\["leidoPor"\]\)/.test(rules) &&
      /resource\.data\.creadoPor == request\.auth\.uid/.test(rules) &&
      /esSuperAdmin\(\)/.test(rules) &&
      /request\.resource\.data\.remitenteId == request\.auth\.uid/.test(rules),
  },
  {
    name: 'Internal chat repository uses bounded realtime queries',
    pass: /collection\(db, 'conversaciones'\)/.test(internalChatRepository) &&
      /collection\(db, 'mensajes'\)/.test(internalChatRepository) &&
      /array-contains/.test(internalChatRepository) &&
      /limit\(limitCount\)/.test(internalChatRepository) &&
      /subscribeAdminConversations/.test(internalChatRepository) &&
      /where\('empresaId', '==', empresaId\)/.test(internalChatRepository) &&
      /orderBy\('ultimoMensajeAt', 'desc'\)/.test(internalChatRepository) &&
      /orderBy\('timestamp', 'desc'\)/.test(internalChatRepository),
  },
  {
    name: 'Internal chat deletion removes messages before deleting the conversation',
    pass: /getDocs\(query\(\s*collection\(db, 'mensajes'\)/.test(internalChatRepository) &&
      /where\('empresaId', '==', empresaId\)/.test(internalChatRepository) &&
      /where\('conversacionId', '==', conversationId\)/.test(internalChatRepository) &&
      /writeBatch\(db\)/.test(internalChatRepository) &&
      /batch\.delete\(entry\.ref\)/.test(internalChatRepository) &&
      /deleteDoc\(doc\(db, 'conversaciones', conversationId\)\)/.test(internalChatRepository),
  },
  {
    name: 'Super admin global messaging is read-only unless participating',
    pass: /canWriteSelectedConversation/.test(adminMessagingScreen) &&
      /Modo lectura global del super admin/.test(adminMessagingScreen) &&
      /!superAdmin \|\| selectedConversation\.participanteIds\.includes\(user\.id\)/.test(adminMessagingScreen),
  },
  {
    name: 'Firestore indexes cover chat ordered tenant queries',
    pass: hasIndex('conversaciones', [
      { fieldPath: 'empresaId', order: 'ASCENDING' },
      { fieldPath: 'participanteIds', arrayConfig: 'CONTAINS' },
      { fieldPath: 'ultimoMensajeAt', order: 'DESCENDING' },
    ]) &&
      hasIndex('conversaciones', [
        { fieldPath: 'empresaId', order: 'ASCENDING' },
        { fieldPath: 'ultimoMensajeAt', order: 'DESCENDING' },
      ]) &&
      hasIndex('mensajes', [
        { fieldPath: 'empresaId', order: 'ASCENDING' },
        { fieldPath: 'conversacionId', order: 'ASCENDING' },
        { fieldPath: 'timestamp', order: 'DESCENDING' },
      ]),
  },
  {
    name: 'Internal chat supports image and document attachments through managed uploads',
    pass: /chatAttachment/.test(uploadLimits) &&
      /image\/jpeg/.test(uploadLimits) &&
      /application\/pdf/.test(uploadLimits) &&
      /uploadManagedFile/.test(internalChatScreen) &&
      /uploadManagedFile/.test(adminMessagingScreen) &&
      /pickAttachmentWeb\('image\/jpeg,image\/png,image\/webp'\)/.test(internalChatScreen) &&
      /pickAttachmentWeb\('image\/jpeg,image\/png,image\/webp'\)/.test(adminMessagingScreen) &&
      /pickAttachmentWeb\('application\/pdf,\.pdf'\)/.test(internalChatScreen) &&
      /pickAttachmentWeb\('application\/pdf,\.pdf'\)/.test(adminMessagingScreen) &&
      /kind === "chatAttachment"/.test(backend),
  },
  {
    name: 'Internal chat creates tenant-safe message notifications',
    pass: /exports\.onMensajeInternoCreado\s*=\s*onDocumentCreated\("mensajes\/\{mensajeId\}"/.test(backend) &&
      /conversationEmpresaId !== empresaId/.test(backend) &&
      /participanteIds\.filter\(\(uid\) => uid && uid !== remitenteId\)/.test(backend) &&
      /collection\("notificaciones"\)\.doc\(notifId\)/.test(backend) &&
      /tipo: "mensaje"/.test(backend) &&
      /obtenerTokensPush\(recipients\)/.test(backend) &&
      /'mensaje'/.test(readFileSync(new URL('../app/src/domain/entities/Notification.ts', import.meta.url), 'utf8')),
  },
  {
    name: 'Internal chat lifecycle is included in company data collections',
    pass: /"conversaciones"/.test(backend) && /"mensajes"/.test(backend),
  },
  {
    name: 'AI assistant is served by a backend callable, not only local UI simulation',
    pass: /exports\.askNexxusAI\s*=\s*onCall/.test(backend) &&
      /httpsCallable<\{ prompt: string \}.*>\(functions, 'askNexxusAI'\)/.test(aiRepository) &&
      /useCases\.ai\.ask\.execute/.test(chatIAScreen) &&
      /manejarComandoLocal/.test(chatIAScreen),
  },
  {
    name: 'AI assistant uses Gemini through backend environment configuration',
    pass: /process\.env\.GEMINI_API_KEY/.test(backend) &&
      /process\.env\.GEMINI_MODEL/.test(backend) &&
      /generativelanguage\.googleapis\.com\/v1beta\/models/.test(backend) &&
      /"x-goog-api-key": GEMINI_API_KEY/.test(backend) &&
      /systemInstruction/.test(backend),
  },
  {
    name: 'AI assistant reads are scoped by tenant or authenticated user',
    pass: /where\("empresaId", "==", empresaId\)/.test(backend) &&
      /getOwnTenantRows/.test(backend) &&
      /caller\.empresaId/.test(backend) &&
      /role === "super_admin"/.test(backend),
  },
  {
    name: 'AI assistant training prompt enforces tenant context and friendly tone',
    pass: /Eres Nexxus AI/.test(backend) &&
      /Responde siempre en español claro, con tono amable/.test(backend) &&
      /Usa exclusivamente el CONTEXTO VALIDADO/.test(backend) &&
      /Nunca menciones ni infieras información de otra empresa/.test(backend) &&
      /acciones irreversibles/.test(backend),
  },
  {
    name: 'AI assistant reads canonical attendance and evaluation fields',
    pass: /item\.tarde === true/.test(backend) &&
      /item\.puntajeTotal/.test(backend),
  },
  {
    name: 'AI assistant reads canonical payroll and vacation fields',
    pass: /lastPayroll\.totalPagar/.test(backend) &&
      /lastPayroll\.salarioBruto/.test(backend) &&
      /context\.profile\.dias_vacaciones_disponibles/.test(backend),
  },
  {
    name: 'AI assistant usage is logged and protected',
    pass: /collection\("ai_usage"\)\.add/.test(backend) &&
      /writeAuditLog\(\{[\s\S]*modulo: "IA"/.test(backend) &&
      /match\s+\/ai_usage\/\{id\}/.test(rules) &&
      /allow create, update, delete: if false/.test(rules) &&
      /provider/.test(backend) &&
      /"ai_usage"/.test(backend),
  },
  {
    name: 'AI assistant use case does not write business data from the client',
    pass: /class AiAssistantUseCases/.test(aiUseCases) &&
      !/addDoc|setDoc|updateDoc|deleteDoc/.test(aiRepository) &&
      !/firebase\/firestore/.test(aiRepository),
  },
  {
    name: 'Plan catalog defines feature flags and limits for monetization',
    pass: /PLAN_CATALOG/.test(planCatalog) &&
      /aiRequestsMonthly/.test(planCatalog) &&
      /internalChat/.test(planCatalog) &&
      /incidents/.test(planCatalog) &&
      /inventory/.test(planCatalog) &&
      /customBranding/.test(planCatalog) &&
      /getPlanEntitlements/.test(planCatalog),
  },
  {
    name: 'Checkout persists plan entitlements and subscription records',
    pass: /httpsCallable<PendingPurchase/.test(planAccess) &&
      !/confirmPurchaseDirectly/.test(planAccess) &&
      /NEXXUS_ALLOW_UNVERIFIED_PAID_CHECKOUT/.test(backend) &&
      /amount > 0 && !ALLOW_UNVERIFIED_PAID_CHECKOUT/.test(backend) &&
      /seedPlanCatalog\(batch, db\)/.test(backend) &&
      /collection\("suscripciones"\)\.doc\(caller\.empresaId\)/.test(backend),
  },
  {
    name: 'Plan rules protect planes and tenant subscriptions',
    pass: /match\s+\/planes\/\{id\}/.test(rules) &&
      /match\s+\/suscripciones\/\{id\}/.test(rules) &&
      /allow read: if autenticado\(\)/.test(rules) &&
      /accesoEmpresa\(id\)/.test(rules),
  },
  {
    name: 'Premium modules enforce plan limits server-side',
    pass: /assertPlanFeature\(caller\.empresaId, "ai"\)/.test(backend) &&
      /assertEmployeeCapacity\(empresa_id\)/.test(backend) &&
      /resource-exhausted/.test(backend),
  },
  {
    name: 'Reusable exports are generated server-side with tenant and plan checks',
    pass: /exports\.generateTenantExport\s*=\s*onCall/.test(backend) &&
      /EXPORT_DATASETS/.test(backend) &&
      /sameCompany\(caller, empresaId\)/.test(backend) &&
      /assertPlanFeature\(empresaId, "exports"\)/.test(backend) &&
      /Exportación generada/.test(backend) &&
      /buildSimplePdfBase64/.test(backend) &&
      /buildCsvBase64/.test(backend) &&
      /httpsCallable\(functions, 'generateTenantExport'\)/.test(exportRepository) &&
      /useCases\.admin\.exports\.generate/.test(requestReportsScreen) &&
      /dataset: 'request_reports'/.test(requestReportsScreen) &&
      /saveExportFile/.test(requestReportsScreen),
  },
  {
    name: 'Documents admin is tenant-scoped, indexed and repository-driven',
    pass: /match\s+\/documentos\/\{id\}/.test(rules) &&
      /allow read: if autenticado\(\) && \(/.test(rules) &&
      /puedeLeerTenant\(resource\.data\)/.test(rules) &&
      /allow create: if autenticado\(\) && puedeCrearTenant\(\) && esAdminEmpresa\(\)/.test(rules) &&
      /allow delete: if autenticado\(\) && mantieneTenant\(\) && esAdminEmpresa\(\)/.test(rules) &&
      !/firebase\/firestore/.test(documentsAdminScreen) &&
      !/firebase\/functions/.test(documentsAdminScreen) &&
      !/firebaseConfig/.test(documentsAdminScreen) &&
      /useCases\.documents\.subscribeByCompany\.execute/.test(documentsAdminScreen) &&
      /useCases\.documents\.getStorageStats\.execute/.test(documentsAdminScreen) &&
      /useCases\.documents\.deleteWithAsset\.execute/.test(documentsAdminScreen) &&
      /subscribeByCompany/.test(documentRepository) &&
      /firestoreLimit\(300\)/.test(documentRepository) &&
      /httpsCallable<\{ empresaId: string \}, DocumentStorageStats>/.test(documentRepository) &&
      hasIndex('documentos', [
        { fieldPath: 'empresaId', order: 'ASCENDING' },
        { fieldPath: 'fechaSubida', order: 'DESCENDING' },
      ]) &&
      hasIndex('documentos', [
        { fieldPath: 'userId', order: 'ASCENDING' },
        { fieldPath: 'fechaSubida', order: 'DESCENDING' },
      ]),
  },
  {
    name: 'Company calendar admin is tenant-scoped, indexed and repository-driven',
    pass: /match\s+\/calendario_empresarial\/\{id\}/.test(rules) &&
      /allow read: if autenticado\(\) && puedeLeerTenant\(resource\.data\)/.test(rules) &&
      /allow create: if autenticado\(\) && puedeCrearTenant\(\) && esJefe\(\)/.test(rules) &&
      /allow update, delete: if autenticado\(\) && mantieneTenant\(\) && esJefe\(\)/.test(rules) &&
      !/firebase\/firestore/.test(calendarAdminScreen) &&
      !/firebaseConfig/.test(calendarAdminScreen) &&
      /useCases\.admin\.calendar\.subscribe/.test(calendarAdminScreen) &&
      /useCases\.admin\.calendar\.saveEvent/.test(calendarAdminScreen) &&
      /useCases\.admin\.calendar\.deleteEvent/.test(calendarAdminScreen) &&
      /subscribeCompanyCalendar/.test(calendarRepository) &&
      /orderBy\('inicio', 'asc'\), limit\(500\)/.test(calendarRepository) &&
      /serverTimestamp\(\)/.test(calendarRepository) &&
      hasIndex('calendario_empresarial', [
        { fieldPath: 'empresaId', order: 'ASCENDING' },
        { fieldPath: 'inicio', order: 'ASCENDING' },
      ]),
  },
  {
    name: 'Backend validates company and user creation inputs',
    pass: /EMAIL_PATTERN/.test(backend) &&
      /MIN_PASSWORD_LENGTH/.test(backend) &&
      /assertCompanyPayload/.test(backend) &&
      /normalizeCompanyUserRole/.test(backend) &&
      /COMPANY_USER_ROLES/.test(backend) &&
      /rolSolicitado === 'admin_empresa' && rolCaller !== 'admin_empresa'/.test(backend) &&
      /throw new HttpsError\("internal", "No se pudo crear la empresa\."\)/.test(backend) &&
      /throw new HttpsError\("internal", "No se pudo crear el usuario\."\)/.test(backend),
  },
  {
    name: 'Enterprise login stores hashed internal passwords only for new writes',
    pass: /hashInternalPassword/.test(backend) &&
      /verifyInternalPassword/.test(backend) &&
      /passwordInternoHash/.test(backend) &&
      /passwordInterno: admin\.firestore\.FieldValue\.delete\(\)/.test(backend) &&
      /passwordInicial: admin\.firestore\.FieldValue\.delete\(\)/.test(backend) &&
      /sanitizeEmployeePayload/.test(backend) &&
      /httpsCallable\(functions, 'crearUsuarioEmpresa'\)/.test(plantillaScreen) &&
      !/passwordInterno:/.test(plantillaScreen) &&
      !/passwordInicial:/.test(plantillaScreen) &&
      /sinPasswordPlanoEnCreate/.test(rules) &&
      /sinPasswordPlanoEnUpdate/.test(rules) &&
      /sinEscalarSuperAdmin/.test(rules) &&
      /usuarioAutoUpdateSeguro/.test(rules) &&
      /request\.auth\.uid == userId && usuarioAutoUpdateSeguro\(\)/.test(rules),
  },
  {
    name: 'Inventory and incidents are tenant-scoped with bounded listeners',
    pass: /match\s+\/inventario_activos\/\{id\}/.test(rules) &&
      /match\s+\/inventario_movimientos\/\{id\}/.test(rules) &&
      /match\s+\/incidencias\/\{id\}/.test(rules) &&
      /inventario_activos/.test(backend) &&
      /inventario_movimientos/.test(backend) &&
      /class FirebaseInventoryRepository/.test(inventoryRepository) &&
      /limit\(limitCount\)/.test(inventoryRepository) &&
      /subscribeUserAssets/.test(inventoryUseCases) &&
      hasIndex('inventario_activos', [
        { fieldPath: 'empresaId', order: 'ASCENDING' },
        { fieldPath: 'fechaActualizacion', order: 'DESCENDING' },
      ]) &&
      hasIndex('incidencias', [
        { fieldPath: 'empresaId', order: 'ASCENDING' },
        { fieldPath: 'fechaCreacion', order: 'DESCENDING' },
      ]),
  },
  {
    name: 'Training progress is tenant-scoped and completed through backend validation',
    pass: /exports\.completeTrainingModule\s*=\s*onCall/.test(backend) &&
      /sameCompany\(caller, course\.empresaId\)/.test(backend) &&
      /collection\("capacitacion_avances"\)/.test(backend) &&
      /Curso completado/.test(backend) &&
      /"capacitacion_avances"/.test(backend) &&
      /match\s+\/capacitacion_avances\/\{id\}/.test(rules) &&
      /allow create, update, delete: if false/.test(rules) &&
      /collection\(db, 'capacitacion_avances'\)/.test(courseRepository) &&
      /httpsCallable\(functions, 'completeTrainingModule'\)/.test(courseRepository) &&
      /limit\(200\)/.test(courseRepository) &&
      /useCases\.training\.completeModule/.test(learningScreen) &&
      /certificadoEmitido/.test(learningScreen) &&
      hasIndex('capacitacion_avances', [
        { fieldPath: 'empresaId', order: 'ASCENDING' },
        { fieldPath: 'empleadoId', order: 'ASCENDING' },
      ]),
  },
  {
    name: 'Firestore backups are scheduled and client-protected',
    pass: /FirestoreAdminClient/.test(backend) &&
      /NEXXUS_FIRESTORE_BACKUP_BUCKET/.test(backend) &&
      /exports\.exportFirestoreBackup\s*=\s*onSchedule/.test(backend) &&
      /exportDocuments\(\{/.test(backend) &&
      /collection\("backup_jobs"\)\.add/.test(backend) &&
      /match\s+\/backup_jobs\/\{id\}/.test(rules) &&
      /allow read: if autenticado\(\) && esSuperAdmin\(\)/.test(rules) &&
      /allow create, update, delete: if false/.test(rules) &&
      /NEXXUS_FIRESTORE_BACKUP_BUCKET/.test(secretsDoc),
  },
  {
    name: 'Admin settings surface plan limits and enabled modules',
    pass: /PLAN_CATALOG/.test(configAdmin) &&
      /Plan y módulos/.test(configAdmin) &&
      /IA y métricas/.test(configAdmin) &&
      /Inventario/.test(configAdmin) &&
      /Módulos habilitados/.test(configAdmin),
  },
];

const failed = checks.filter((check) => !check.pass);
for (const check of checks) {
  console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.name}`);
}

if (failed.length > 0) {
  process.exit(1);
}
