import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "firebaseClient/firebaseConfig";
import { planEntitlements, subscriptionExpiration, purchaseId as generarPurchaseId } from "services/checkout";

// Reglas y textos portados de nexxus/app/src/Landing/LandingAuth.tsx, adaptados a JS/Horizon.
// El batch de creación de empresa (empresa + usuario admin + sede + departamento +
// configuraciones_empresa) reproduce exactamente el de crearEmpresa en ese archivo, solo que
// redirige a /admin/empresa-resumen en vez de /app y no sube logo (Cloudinary no está portado
// aún; se puede agregar el logo después desde Configuración).

export function limpiarTexto(valor) {
  return valor.replace(/\s+/g, " ").trim();
}

export function normalizar(valor) {
  return limpiarTexto(valor).toLowerCase();
}

export function validarCorreo(correo) {
  const limpio = correo.trim().toLowerCase();
  if (limpio !== correo || /\s/.test(correo)) return "El correo no debe tener espacios.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpio)) return "Ingresa un correo válido.";
  const dominio = limpio.split("@")[1] ?? "";
  if (!dominio.includes(".") || dominio.length < 4) return "El dominio del correo no es válido.";
  return undefined;
}

export function reglasPassword(password) {
  return [
    ["Mínimo 8 caracteres", password.length >= 8],
    ["Una mayúscula", /[A-Z]/.test(password)],
    ["Una minúscula", /[a-z]/.test(password)],
    ["Un número", /\d/.test(password)],
    ["Un carácter especial", /[^A-Za-z0-9]/.test(password)],
  ];
}

export function seguridadPassword(password) {
  return reglasPassword(password).filter(([, valido]) => valido).length;
}

export const PHONE_CONFIGS = {
  "+503": { minLength: 8, maxLength: 8, hyphenPositions: [4], placeholder: "Ej. 7000-0000" },
  "+502": { minLength: 8, maxLength: 8, hyphenPositions: [4], placeholder: "Ej. 5000-0000" },
  "+504": { minLength: 8, maxLength: 8, hyphenPositions: [4], placeholder: "Ej. 9000-0000" },
  "+505": { minLength: 8, maxLength: 8, hyphenPositions: [4], placeholder: "Ej. 8000-0000" },
  "+506": { minLength: 8, maxLength: 8, hyphenPositions: [4], placeholder: "Ej. 8000-0000" },
  "+507": { minLength: 8, maxLength: 8, hyphenPositions: [4], placeholder: "Ej. 6000-0000" },
  "+52": { minLength: 10, maxLength: 10, hyphenPositions: [2, 6], placeholder: "Ej. 55-1234-5678" },
  "+57": { minLength: 10, maxLength: 10, hyphenPositions: [3, 6], placeholder: "Ej. 300-123-4567" },
  "+1": { minLength: 10, maxLength: 10, hyphenPositions: [3, 6], placeholder: "Ej. 202-555-0143" },
  "+34": { minLength: 9, maxLength: 9, hyphenPositions: [3, 6], placeholder: "Ej. 600-123-456" },
  "+54": { minLength: 10, maxLength: 10, hyphenPositions: [2, 6], placeholder: "Ej. 11-1234-5678" },
  "+56": { minLength: 9, maxLength: 9, hyphenPositions: [1, 5], placeholder: "Ej. 9-1234-5678" },
  "+51": { minLength: 9, maxLength: 9, hyphenPositions: [3, 6], placeholder: "Ej. 912-345-678" },
  "+593": { minLength: 9, maxLength: 9, hyphenPositions: [2, 5], placeholder: "Ej. 09-123-4567" },
  "+591": { minLength: 8, maxLength: 8, hyphenPositions: [4], placeholder: "Ej. 7000-0000" },
  "+58": { minLength: 10, maxLength: 10, hyphenPositions: [3, 6], placeholder: "Ej. 412-123-4567" },
};

const FALLBACK_PHONE_CONFIG = { minLength: 7, maxLength: 15, hyphenPositions: [], placeholder: "Ej. 12345678" };

export function formatPhoneNumber(rawDigits, prefix) {
  const config = PHONE_CONFIGS[prefix] || FALLBACK_PHONE_CONFIG;
  const clean = rawDigits.replace(/\D/g, "").slice(0, config.maxLength);
  let formatted = "";
  for (let i = 0; i < clean.length; i++) {
    formatted += clean[i];
    if (config.hyphenPositions.includes(i + 1) && i < clean.length - 1) formatted += "-";
  }
  return formatted;
}

export function validarTelefono(telefono, prefix) {
  const config = PHONE_CONFIGS[prefix] || FALLBACK_PHONE_CONFIG;
  const digitsOnly = telefono.replace(/\D/g, "");
  if (digitsOnly.length === 0) return "Ingresa un teléfono.";
  if (digitsOnly.length < config.minLength) return "El teléfono es muy corto.";
  if (digitsOnly.length > config.maxLength) return "El teléfono es muy largo.";
  return undefined;
}

export const FALLBACK_COUNTRIES = [
  { name: "Argentina", code: "AR", dialCode: "+54" },
  { name: "Bolivia", code: "BO", dialCode: "+591" },
  { name: "Canadá", code: "CA", dialCode: "+1" },
  { name: "Chile", code: "CL", dialCode: "+56" },
  { name: "Colombia", code: "CO", dialCode: "+57" },
  { name: "Costa Rica", code: "CR", dialCode: "+506" },
  { name: "Ecuador", code: "EC", dialCode: "+593" },
  { name: "El Salvador", code: "SV", dialCode: "+503" },
  { name: "España", code: "ES", dialCode: "+34" },
  { name: "Estados Unidos", code: "US", dialCode: "+1" },
  { name: "Guatemala", code: "GT", dialCode: "+502" },
  { name: "Honduras", code: "HN", dialCode: "+504" },
  { name: "México", code: "MX", dialCode: "+52" },
  { name: "Nicaragua", code: "NI", dialCode: "+505" },
  { name: "Panamá", code: "PA", dialCode: "+507" },
  { name: "Perú", code: "PE", dialCode: "+51" },
  { name: "Venezuela", code: "VE", dialCode: "+58" },
];

export function traducirErrorFirebase(codigo) {
  const errores = {
    "auth/email-already-in-use": "Ese correo ya tiene una cuenta. Inicia sesión en su lugar.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/popup-closed-by-user": "Ventana de Google cerrada antes de terminar.",
    "auth/weak-password": "La contraseña es demasiado débil.",
  };
  return errores[codigo] || "Ocurrió un error. Intenta de nuevo.";
}

export async function nombreEmpresaDuplicado(nombre) {
  const duplicado = await getDocs(
    query(collection(db, "empresas"), where("nombre_normalizado", "==", normalizar(nombre)), limit(1))
  );
  return !duplicado.empty;
}

export function validarEmpresaForm(empresa, prefijoSeleccionado) {
  const errores = {};
  if (limpiarTexto(empresa.nombre).length < 2) errores.nombre = "Ingresa el nombre de la empresa.";
  if (limpiarTexto(empresa.pais).length < 2) errores.pais = "Selecciona un país.";
  if (limpiarTexto(empresa.ciudad).length < 2) errores.ciudad = "Ingresa una ciudad.";
  if (limpiarTexto(empresa.direccion).length < 6) errores.direccion = "Ingresa una dirección más completa.";
  const errorTelefono = validarTelefono(empresa.telefono, prefijoSeleccionado);
  if (errorTelefono) errores.telefono = errorTelefono;
  if (limpiarTexto(empresa.sedePrincipal).length < 2) errores.sedePrincipal = "Ingresa el nombre de la sede.";
  return errores;
}

// Crea empresa + usuario admin + sede + departamento "Administración" + configuraciones_empresa,
// igual que crearEmpresa en LandingAuth.tsx (sin logo: Cloudinary no está portado a este panel).
//
// El plan viene del checkout simulado (services/checkout.js, ver views/nexxus/registro) y se
// activa AQUÍ MISMO, como parte de este único batch de creación (que Firestore evalúa como
// "create" porque el doc de usuario todavía no existe). No se activa en un paso aparte: las
// reglas de Firestore bloquean a propósito que un usuario se auto-otorgue un plan actualizando
// su propio doc ya existente (usuarioAutoUpdateSeguro no incluye campos de plan), así que atar la
// activación a la creación de la empresa evita ese hueco sin necesidad de Cloud Functions.
export async function crearCuentaYEmpresa({ uid, correo, nombreAdmin, fotoPerfil, empresa, prefijoSeleccionado, checkout }) {
  const empresaRef = doc(collection(db, "empresas"));
  const sedeRef = doc(collection(db, "sedes"));
  const departamentoRef = doc(collection(db, "departments"));
  const configuracionRef = doc(collection(db, "configuraciones_empresa"));
  const ahoraIso = new Date().toISOString();
  const telefonoCompleto = `${prefijoSeleccionado.trim()} ${limpiarTexto(empresa.telefono)}`.trim();

  const plan = checkout.plan;
  const billing = checkout.billing === "annual" ? "annual" : "monthly";
  const { planFeatures, planLimits } = planEntitlements(plan);
  const planExpiresAt = subscriptionExpiration(billing).toISOString();
  const datosPlan = {
    plan,
    planActivo: plan,
    planFeatures,
    planLimits,
    automaticBilling: checkout.automaticBilling !== false,
    planAccessEndsAt: null,
    planBilling: billing,
    planCancelAtPeriodEnd: false,
    planDataDeletionAt: null,
    planExpiresAt,
    planCodigoPromocional: checkout.promotionCode || null,
    planPaymentStatus: "paid",
    planPurchaseId: checkout.purchaseId || generarPurchaseId(),
    subscriptionStatus: "active",
  };

  const batchInicial = writeBatch(db);
  batchInicial.set(empresaRef, {
    adminId: uid,
    adminUid: uid,
    ciudad: limpiarTexto(empresa.ciudad),
    configuracion: { asistencia: true, auditoria: true, ia: true, nomina: true, plan },
    createdAt: serverTimestamp(),
    direccion: limpiarTexto(empresa.direccion),
    empresa_id: empresaRef.id,
    estado: "activa",
    logo_url: "",
    logo_public_id: "",
    logo_hash: "",
    logo_size: 0,
    nombre: limpiarTexto(empresa.nombre),
    nombre_normalizado: normalizar(empresa.nombre),
    pais: limpiarTexto(empresa.pais),
    ...datosPlan,
    sedes: [],
    telefono: telefonoCompleto,
    updatedAt: serverTimestamp(),
  });
  batchInicial.set(
    doc(db, "usuarios", uid),
    {
      activo: true,
      createdAt: ahoraIso,
      correo,
      departamento: "Administración",
      departamentoId: departamentoRef.id,
      dias_vacaciones_disponibles: 15,
      empresa: limpiarTexto(empresa.nombre),
      empresaId: empresaRef.id,
      estado_activo: true,
      estado_trabajo: "disponible",
      foto_perfil: fotoPerfil ?? "",
      foto_public_id: null,
      foto_hash: null,
      foto_size: 0,
      horario_laboral: "08:00 - 17:00",
      id: uid,
      nombre: nombreAdmin,
      permisos: {
        modulos: ["dashboard", "usuarios", "nomina", "auditoria", "comunicacion", "documentos", "analytics"],
        sedes: [sedeRef.id],
      },
      puntos_recompensa: 0,
      racha: 0,
      rol: "admin",
      salarioBase: 0,
      sede: limpiarTexto(empresa.sedePrincipal),
      sedeId: sedeRef.id,
      telefono: telefonoCompleto,
      ...datosPlan,
    },
    { merge: true }
  );
  await batchInicial.commit();

  const batchEstructura = writeBatch(db);
  batchEstructura.set(sedeRef, {
    activa: true,
    ciudad: limpiarTexto(empresa.ciudad),
    direccion: limpiarTexto(empresa.direccion),
    empresaId: empresaRef.id,
    id: sedeRef.id,
    nombre: limpiarTexto(empresa.sedePrincipal),
    principal: true,
    createdAt: serverTimestamp(),
  });
  batchEstructura.set(departamentoRef, {
    activo: true,
    createdAt: ahoraIso,
    empresaId: empresaRef.id,
    empleadosCount: 1,
    id: departamentoRef.id,
    jefeId: uid,
    jefeNombre: nombreAdmin,
    nombre: "Administración",
    productividad: 100,
    sectores: [],
  });
  batchEstructura.set(configuracionRef, {
    ajustes: { idioma: "es", moneda: "USD", zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone },
    branding: { colorPrimario: "#7C3AED", colorSecundario: "#A855F7", logoUrl: "" },
    configuracion_id: configuracionRef.id,
    asistencia: {
      horaEntrada: "08:00",
      horaSalida: "17:00",
      horasEsperadas: 8,
      toleranciaMinutos: 10,
      metodoRegistroDefault: "manual",
    },
    departamentosIniciales: ["Administración", "Recursos Humanos", "Operaciones"],
    empresaId: empresaRef.id,
    updatedAt: serverTimestamp(),
  });
  batchEstructura.update(empresaRef, { sedes: [sedeRef.id], updatedAt: serverTimestamp() });
  await batchEstructura.commit();

  return empresaRef.id;
}
