/**
 * Documentacion Nexxus - nexxus/app/src/shared/i18n/config.ts
 * Capa: compartido.
 * Proposito: Configuracion o recurso de internacionalizacion. Mantiene textos y cambio de idioma separados de la UI.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa i18n; permite traducir textos visibles y respetar el idioma activo del usuario.
import i18n from 'i18next';
// Importa { initReactI18next }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { initReactI18next } from 'react-i18next';
// Importa AsyncStorage desde @react-native-async-storage/async-storage; agrega una dependencia externa necesaria para este modulo.
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importa es; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import es from './locales/es.json';
import { translateManyWithApi, translateWithApi } from './translatorApi';

/**
 * Declaracion LANGUAGE_KEY. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const LANGUAGE_KEY = '@nexxus_language';
const LANGUAGE_SOURCE_KEY = '@nexxus_language_source';
const SOURCE_LANGUAGE = 'es';
const TARGET_LANGUAGES = ['en'];

type TranslationTree = Record<string, any>;
const sourceTranslations = es as TranslationTree;

const pendingTranslations = new Map<string, string>();
const pendingResourceUpdates: Record<string, TranslationTree> = {};
const loadedLanguages = new Set<string>([SOURCE_LANGUAGE]);
const loadingLanguages = new Map<string, Promise<void>>();
let processingTranslations = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const PRIORITY_PREFIXES = ['common.', 'landing.', 'admin.', 'app.', 'perfilLaboral.'];
const SUPPORTED_LANGUAGES = [SOURCE_LANGUAGE, ...TARGET_LANGUAGES];

const normalizeLanguage = (language?: string | null) => {
  const normalized = language?.toLowerCase().split('-')[0];
  return normalized && SUPPORTED_LANGUAGES.includes(normalized) ? normalized : SOURCE_LANGUAGE;
};

const getDeviceLanguage = () => {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  return normalizeLanguage(nav?.languages?.[0] || nav?.language);
};

const EN_TRANSLATION_OVERRIDES: TranslationTree = {
  common: {
    employee: 'Employee',
    general: 'General',
    pending: 'Pending',
    type: 'Type',
    priority_title: 'Priority',
    priority: {
      baja: 'Low',
      media: 'Medium',
      alta: 'High',
      urgente: 'Urgent',
      permiso: 'Permission',
      licencia: 'License',
      incapacidad: 'Incapacity',
      vacaciones: 'Vacation'
    },
    close: 'Close',
    reject: 'Reject',
    approve: 'Approve',
  },
  landing: {
    hero_title: 'Manage your company from one place',
    hero_subtitle: 'Nexxus connects administration, employees, tasks, attendance, payroll, wellbeing and AI in one place so you can operate with clarity and speed.',
    plan_includes: 'Includes:',
    view_plan_benefits: 'View plan benefits',
    hide_plan_benefits: 'Hide plan benefits',
    checkout_eyebrow: 'Get a plan',
    checkout_title: 'Complete your activation in minutes.',
    checkout_subtitle: 'Choose a plan, add your company details and simulate payment to prepare your Nexxus workspace.',
    checkout_selected_plan: 'Selected plan',
    checkout_step_company: 'Company details',
    checkout_step_company_text: 'We use this information to prepare the workspace and payment receipt.',
    checkout_company: 'Company',
    checkout_name: 'Owner',
    checkout_owner_placeholder: 'Owner name',
    checkout_email: 'Email',
    checkout_phone: 'Phone',
    checkout_step_payment: 'Payment method',
    checkout_step_payment_text: 'Enter a test card to review the payment experience for this plan.',
    checkout_card: 'Card number',
    checkout_expiry: 'Expiry',
    checkout_cvc: 'CVC',
    checkout_step_review: 'Confirmation',
    checkout_step_review_text: 'Review the summary before completing the payment simulation.',
    checkout_billing: 'Billing',
    checkout_total: 'Total',
    checkout_back: 'Back',
    checkout_continue: 'Continue',
    checkout_pay_now: 'Complete payment',
    checkout_processing_title: 'Validating payment',
    checkout_processing: 'Processing secure payment...',
    checkout_success_title: 'Subscription completed',
    checkout_success_text: 'You have successfully subscribed to the {{plan}} plan. You can now continue to the next step and create your company.',
    checkout_new_payment: 'Run another test',
    checkout_create_company: 'Create company',
    checkout_do_later: 'Do it later',
    checkout_plan_confirmed: '{{plan}} plan acquired',
    checkout_plan_saved: 'Payment confirmed and saved to your account',
    checkout_back_to_plans: 'Back to plans',
    checkout_secure_badge: 'Secure checkout',
    checkout_tax_id: 'Tax ID',
    checkout_address: 'Billing address',
    checkout_card_name: 'Name on card',
    checkout_card_name_placeholder: 'Cardholder name',
    checkout_country: 'Country',
    checkout_accept_terms: 'I confirm the plan, billing cycle and secure payment authorization.',
    checkout_payment_logos: 'Payment methods',
    checkout_test_card_placeholder: 'Test card number',
    checkout_validation_notice: 'Review the highlighted fields before continuing.',
    checkout_error_required: 'This field is required.',
    checkout_error_email: 'Enter a valid email.',
    checkout_error_phone: 'Enter a valid phone number.',
    checkout_error_card: 'Enter 12 to 19 digits for the test card.',
    checkout_error_expiry: 'Enter a valid future expiry date.',
    checkout_error_cvc: 'Enter a valid security code.',
    checkout_error_terms: 'You must accept the payment authorization.',
    checkout_error_bank: 'Enter at least 8 account digits.',
    checkout_language: 'Change language',
    checkout_subscribe_to: 'Subscribe to',
    checkout_plan_starter: 'Essential operations for growing teams.',
    checkout_plan_business: 'Advanced control for expanding companies.',
    checkout_plan_enterprise: 'Corporate scale, security and unlimited control.',
    checkout_save: 'Save',
    checkout_annual_billing: 'with annual billing',
    checkout_subtotal: 'Subtotal',
    checkout_tax: 'Tax',
    checkout_total_today: 'Total due today',
    checkout_encrypted: 'Encrypted information',
    checkout_or: 'or',
    checkout_contact_information: 'Contact information',
    checkout_card_method: 'Card',
    checkout_card_information: 'Card information',
    checkout_expiry_placeholder: 'MM / YY',
    checkout_bank: 'Bank',
    checkout_bank_badge: 'Secure transfer',
    checkout_bank_owner: 'Account holder',
    checkout_bank_owner_placeholder: 'Full name',
    checkout_bank_name: 'Bank',
    checkout_bank_name_placeholder: 'Bank name',
    checkout_bank_account: 'Account number',
    checkout_selected_method: 'Selected method:',
    checkout_address_line1: 'Address line 1',
    checkout_address_line2: 'Address line 2 (optional)',
    checkout_postal: 'Postal code',
    checkout_city: 'City',
    checkout_province: 'State or province',
    checkout_save_details: 'Save my details for faster checkout',
    checkout_save_details_text: 'Your details remain protected inside this payment demonstration.',
    checkout_pay_with: 'Pay with',
    checkout_authorization: 'By continuing, you authorize this payment simulation for the selected plan and billing cycle.',
    checkout_plan_label: 'Selected plan',
    checkout_more_plan_info: 'More information about plans',
    checkout_auto_billing: 'Automatic billing',
    checkout_auto_billing_monthly: 'The plan will be charged automatically every month. You can disable this later in Settings.',
    checkout_auto_billing_annual: 'The plan will renew automatically every year. You can disable this later in Settings.',
    checkout_auto_billing_off: 'Automatic renewal is disabled. You can enable it again later in Settings.',
    checkout_code_label: 'Promotion code',
    checkout_code_placeholder: 'Enter your code',
    checkout_code_apply: 'Apply',
    checkout_code_applied: 'Code applied. The plan now has zero cost.',
    checkout_code_invalid: 'The entered code is not valid.',
    checkout_discount: 'Discount',
    checkout_activate_plan: 'Activate plan',
    checkout_auth_required: 'Checking your session to continue...',
    checkout_plan_save_error: 'The plan could not be saved. Check your session and try again.',
    footer_security: 'Security',
    footer_privacy: 'Privacy',
  },
  solicitudesInternas: {
    types: {
      vacaciones: 'VACATION',
      permiso: 'PERMISSION',
      adelanto_salarial: 'SALARY ADVANCE',
      soporte_tecnico: 'TECHNICAL SUPPORT',
      compra_material: 'MATERIAL PURCHASE'
    }
  },
  solicitudesAusencia: {
    categories: {
      vacaciones: 'Vacation',
      enfermedad: 'Illness',
      personal: 'Personal',
      emergencia: 'Emergency',
      capacitacion: 'Training'
    }
  },
  admin: {
    dashboard: {
      approvals: {
        title: 'Approvals',
        subtitle: 'Absences and internal requests',
        empty: 'No pending approvals',
        absence_detail: 'Absence Details',
        request_detail: 'Request Details',
        modal_subtitle: 'Nexxus Approvals Center',
        start_date: 'Start Date',
        end_date: 'End Date',
        amount: 'Amount',
        reason_title: 'Reason and Request Details',
        no_description: 'No detailed description provided.',
        not_specified: 'Not specified',
        emergency_contact: 'Emergency Contact',
        attachment: 'Attachment',
      }
    }
  },
  app: {
    home: 'Home',
    tasks: 'Tasks',
    ai: 'AI',
    resources: 'Resources',
    settings_title: 'Your Settings',
    privacy: 'Privacy',
    support_help: 'Support and Help',
  },
  miPulso: {
    title: 'My Pulse',
    greeting: 'Hello {{name}}',
    flow_title: 'Your workday is flowing.',
    pending_tasks_msg: 'You have {{count}} pending tasks for today.',
    search_placeholder: 'Search, create or ask Nexxus',
    quick_checkin: 'Check-in',
    quick_data: 'Data',
    quick_ai: 'AI',
    daily_action: 'DAILY ACTION',
    checkin_title: 'Pulse Check-in',
    checkin_desc: 'Record how you feel today to optimize your day.',
    ai_suggestion: 'AI TIP',
    daily_agenda: 'Agenda for Today',
    see_all: 'See All',
    no_pending_tasks: 'You have no pending tasks for today.',
  },
  perfilLaboral: {
    role: 'Role',
    position: 'Position',
    department: 'Department',
    location: 'Headquarters',
    schedule: 'Working Hours',
    vacations: 'Vacation',
    base_salary: 'Base Salary',
    last_checkin: 'Last Check-in',
    central_headquarters: 'Central headquarters',
    my_profile: 'My Profile',
    labor_record: 'LABOR RECORD',
    active: 'ACTIVE',
    inactive: 'INACTIVE',
    daily_operation: 'Daily Operation',
    no_defined: 'Not defined',
    no_assigned: 'Not assigned',
    no_registered: 'Not registered',
    no_date: 'No date',
  },
  notificaciones: {
    title: 'Notifications',
    summary_title: 'Notification Center',
    pending_msg: '{{count}} notifications pending review.',
    tray: 'Inbox',
    visible_count: '{{count}} visible',
    all: 'All',
    unread: 'Unread',
    no_notifications: 'You have no notifications in this view.',
    summary: {
      unread: 'Unread',
      read: 'Read',
      types: 'Types',
    },
    types: {
      tarea: 'TASK',
      anuncio: 'ANNOUNCEMENT',
      privada: 'PRIVATE',
      info: 'INFO',
      ausencia: 'ABSENCE',
      bienestar: 'WELLBEING',
      aprobacion: 'APPROVAL',
      general: 'GENERAL',
    },
  },
  recursos: {
    title: 'Resources',
    hero_title: 'Your Digital Library',
    hero_subtitle: 'Access all the documents, manuals and certificates assigned by your company in one place.',
    your_documents: 'Your documents',
    no_docs_msg: 'You do not have assigned documents yet.',
    useful_access: 'Useful access',
    read: 'Read',
    pending: 'Pending',
    summary: {
      documents: 'Documents',
      pending: 'Pending',
      categories: 'Categories',
    },
    shortcuts: {
      center_docs: 'Docs Center',
      learn: 'Learn',
      support: 'Support',
    },
  },
  historialCompleto: {
    title: 'History',
    subtitle: 'WORK ACTIVITY AND WELL-BEING',
    summary_events: 'Events',
    summary_resolved: 'Resolved',
    summary_pending: 'Pending',
    summary_wellness: 'Well-being',
    filter_all: 'Everything',
    filter_tasks: 'Tasks',
    filter_attendance: 'Attendance',
    filter_requests: 'Requests',
    filter_wellness: 'Well-being',
    filter_docs: 'Docs',
    filter_payroll: 'Payroll',
    empty_msg: 'There is no activity in this category.',
    empty_detail: 'When you complete tasks, requests, check-ins or documents, they will appear here.',
    priority_label: '{{prioridad}} priority',
    activity_types: {
      tarea: 'Task',
      ausencia: 'Absence',
      solicitud_interna: 'Internal request',
      bienestar: 'Well-being',
      pulso: 'Pulse',
      asistencia: 'Attendance',
      documento: 'Document',
      nomina: 'Payroll',
      cita: 'Appointment',
      notificacion: 'Notification',
      feedback: 'Feedback',
    },
    status: {
      completada: 'Completed',
      aprobada: 'Approved',
      rechazada: 'Rejected',
      pendiente: 'Pending',
      aprobado: 'Approved',
      resuelto: 'Resolved',
      rechazado: 'Rejected',
      registrado: 'Registered',
      activo: 'Active',
      leido: 'Read',
      leida: 'Read',
      no_leida: 'Unread',
      pagado: 'Paid',
      procesando: 'Processing',
      cancelada: 'Canceled',
    },
  },
  centroDocumentos: {
    require_review: 'Require review',
    pending_count: '{{count}} pending',
    read: 'READ',
    pending: 'PENDING',
    summary: {
      pending: 'Pending',
      read: 'Read',
    },
  },
  centroAprendizaje: {
    module_types: {
      pending: 'Pending content',
    },
  },
  misTareas: {
    pending: 'Pending',
    estimated_load_desc: '{{count}} minutes pending',
  },
  planificadorJornada: {
    pending: 'Pending',
  },
  bandejaUnificada: {
    pending_items: '{{count}} pending',
  },
};

/**
 * Declaracion resources. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const resources = {
  en: { translation: EN_TRANSLATION_OVERRIDES },
  es: { translation: sourceTranslations }
};

const setNestedValue = (target: TranslationTree, key: string, value: string) => {
  const parts = key.split('.');
  let cursor = target;

  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = value;
      return;
    }

    cursor[part] = cursor[part] || {};
    cursor = cursor[part];
  });
};

const flattenTranslations = (tree: TranslationTree, prefix = '', output: Record<string, string> = {}) => {
  Object.entries(tree).forEach(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      output[nextKey] = value;
      return;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenTranslations(value, nextKey, output);
    }
  });

  return output;
};

const humanizeMissingKey = (key: string) => {
  const lastSegment = key.split('.').pop() || key;
  return lastSegment
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || key;
};

const applyLanguageOverrides = (language: string) => {
  if (!language.startsWith('en') || !i18n.isInitialized) return;
  i18n.addResourceBundle(language, 'translation', EN_TRANSLATION_OVERRIDES, true, true);
};

const flushResourceUpdates = (language: string) => {
  const bundle = pendingResourceUpdates[language];
  if (!bundle || !i18n.isInitialized) return;

  delete pendingResourceUpdates[language];
  i18n.addResourceBundle(language, 'translation', bundle, true, true);
  applyLanguageOverrides(language);

  if (i18n.language === language) {
    i18n.changeLanguage(language);
  }
};

const scheduleResourceFlush = (language: string) => {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => flushResourceUpdates(language), 180);
};

const queueTranslation = (language: string, key: string, source: string) => {
  if (language === SOURCE_LANGUAGE || !TARGET_LANGUAGES.includes(language) || !source.trim()) return;
  if (typeof i18n.getResource(language, 'translation', key) === 'string') return;

  pendingTranslations.set(`${language}:${key}`, source);
  processTranslationQueue();
};

const processTranslationQueue = async () => {
  if (processingTranslations) return;
  processingTranslations = true;

  while (pendingTranslations.size > 0) {
    const [queueKey, source] = pendingTranslations.entries().next().value as [string, string];
    pendingTranslations.delete(queueKey);

    const separatorIndex = queueKey.indexOf(':');
    const language = queueKey.slice(0, separatorIndex);
    const key = queueKey.slice(separatorIndex + 1);
    const translated = await translateWithApi(source, language);

    pendingResourceUpdates[language] = pendingResourceUpdates[language] || {};
    setNestedValue(pendingResourceUpdates[language], key, translated);
    scheduleResourceFlush(language);
  }

  processingTranslations = false;
};

const applyTranslatedEntries = async (language: string, entries: [string, string][]) => {
  if (entries.length === 0) return;

  const translatedValues = await translateManyWithApi(entries.map(([, value]) => value), language);
  const bundle: TranslationTree = {};

  entries.forEach(([key, value]) => {
    setNestedValue(bundle, key, translatedValues.get(value) || value);
  });

  i18n.addResourceBundle(language, 'translation', bundle, true, true);
  applyLanguageOverrides(language);

  if (i18n.language === language) {
    await i18n.changeLanguage(language);
  }
};

const splitPriorityEntries = (entries: [string, string][]) => {
  const priority: [string, string][] = [];
  const remaining: [string, string][] = [];

  entries.forEach((entry) => {
    const [key] = entry;
    if (PRIORITY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      priority.push(entry);
    } else {
      remaining.push(entry);
    }
  });

  return { priority, remaining };
};

const loadLanguageFromApi = async (language: string) => {
  if (language === SOURCE_LANGUAGE || !TARGET_LANGUAGES.includes(language) || loadedLanguages.has(language)) return;
  if (loadingLanguages.has(language)) return loadingLanguages.get(language);

  const promise = (async () => {
    const sourceStrings = flattenTranslations(sourceTranslations);
    const { priority, remaining } = splitPriorityEntries(Object.entries(sourceStrings));

    await applyTranslatedEntries(language, priority);
    await applyTranslatedEntries(language, remaining);
    loadedLanguages.add(language);
  })().finally(() => {
    loadingLanguages.delete(language);
  });

  loadingLanguages.set(language, promise);
  return promise;
};

/**
 * Declaracion initI18n. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const initI18n = async () => {
  // Declara savedLanguage; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  const languageSource = await AsyncStorage.getItem(LANGUAGE_SOURCE_KEY);

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!savedLanguage || languageSource !== 'manual') {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    savedLanguage = getDeviceLanguage();
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    await AsyncStorage.setItem(LANGUAGE_KEY, savedLanguage);
    await AsyncStorage.setItem(LANGUAGE_SOURCE_KEY, 'auto');
  } else {
    savedLanguage = normalizeLanguage(savedLanguage);
  }

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage === SOURCE_LANGUAGE ? savedLanguage : SOURCE_LANGUAGE,
      fallbackLng: 'es',
      saveMissing: true,
      returnEmptyString: false,
      interpolation: {
        escapeValue: false 
      },
      missingKeyHandler: (_languages, _namespace, key, fallbackValue) => {
        if (typeof key !== 'string') return;
        const source = typeof fallbackValue === 'string' && fallbackValue.trim() ? fallbackValue : key;
        queueTranslation(i18n.language, key, source);
      },
      parseMissingKeyHandler: (key) => humanizeMissingKey(key),
      compatibilityJSON: 'v4'
    });

  if (savedLanguage && savedLanguage !== SOURCE_LANGUAGE) {
    await loadLanguageFromApi(savedLanguage);
    await i18n.changeLanguage(savedLanguage);
  }
};

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
initI18n();

/**
 * Declaracion changeLanguage. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const changeLanguage = async (lng: string) => {
  const language = normalizeLanguage(lng);
  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
  await AsyncStorage.setItem(LANGUAGE_SOURCE_KEY, 'manual');
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  await i18n.changeLanguage(language);
  await loadLanguageFromApi(language);
};

export default i18n;
