import { supabase } from "supabaseClient/supabaseConfig";
import { subscriptionExpiration, purchaseId as generarPurchaseId } from "services/checkout";
import { subirLogoEmpresa } from "services/companyLogoUpload";

// Reglas y textos portados de nexxus/app/src/Landing/LandingAuth.tsx, adaptados a JS/Horizon.
// El alta de empresa (empresa + usuario admin + sede + departamento + configuraciones_empresa +
// suscripcion) reproduce el flujo de crearEmpresa de ese archivo, con el esquema de Supabase
// (Fase 0) en vez del de Firestore -- ya no hay que denormalizar el plan en cada fila de usuario:
// vive en una sola tabla "suscripciones" por empresa.

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

export function reglasPassword(password: string): [string, boolean][] {
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

export function traducirErrorAuth(mensajeOCodigo) {
  const texto = String(mensajeOCodigo || "").toLowerCase();
  if (texto.includes("already registered") || texto.includes("already-in-use") || texto.includes("already exists")) {
    return "Ese correo ya tiene una cuenta. Inicia sesión en su lugar.";
  }
  if (texto.includes("invalid login credentials") || texto.includes("invalid-credential")) return "Correo o contraseña incorrectos.";
  if (texto.includes("popup closed")) return "Ventana de Google cerrada antes de terminar.";
  if (texto.includes("password") && texto.includes("weak")) return "La contraseña es demasiado débil.";
  return "Ocurrió un error. Intenta de nuevo.";
}

export async function nombreEmpresaDuplicado(nombre) {
  const { data, error } = await supabase
    .from("empresas")
    .select("id")
    .eq("nombre_normalizado", normalizar(nombre))
    .limit(1);
  if (error) throw error;
  return (data || []).length > 0;
}

export function validarEmpresaForm(empresa: any, prefijoSeleccionado: string) {
  const errores: Record<string, string> = {};
  if (limpiarTexto(empresa.nombre).length < 2) errores.nombre = "Ingresa el nombre de la empresa.";
  if (limpiarTexto(empresa.pais).length < 2) errores.pais = "Selecciona un país.";
  if (limpiarTexto(empresa.ciudad).length < 2) errores.ciudad = "Ingresa una ciudad.";
  if (limpiarTexto(empresa.direccion).length < 6) errores.direccion = "Ingresa una dirección más completa.";
  const errorTelefono = validarTelefono(empresa.telefono, prefijoSeleccionado);
  if (errorTelefono) errores.telefono = errorTelefono;
  if (limpiarTexto(empresa.sedePrincipal).length < 2) errores.sedePrincipal = "Ingresa el nombre de la sede.";
  return errores;
}

// Genera un codigo de acceso de empresa unico (NEX-1234), igual que
// createCompanyWithOwner en las Edge Functions (Fase 2).
async function generarCodigoEmpresa(nombreEmpresa) {
  const prefix = (nombreEmpresa.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase()) || "EMP";
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidato = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data } = await supabase.from("empresas").select("id").eq("codigo", candidato).maybeSingle();
    if (!data) return candidato;
  }
  return `${prefix}-${Date.now().toString().slice(-4)}`;
}

// Crea empresa + usuario admin + sede + departamento "Administración" +
// configuraciones_empresa + suscripcion. A diferencia de la version Firebase,
// el plan NO se denormaliza en cada fila (usuarios/empresas): vive solo en
// "suscripciones", una fila por empresa.
export async function crearCuentaYEmpresa({ uid, correo, nombreAdmin, fotoPerfil, empresa, prefijoSeleccionado, checkout, logo }) {
  const emailSeguro = correo || "";
  const telefonoCompleto = `${prefijoSeleccionado.trim()} ${limpiarTexto(empresa.telefono)}`.trim();
  const codigo = await generarCodigoEmpresa(empresa.nombre);

  // 1. Crear empresa (admin_id = uid)
  const { data: empresaRow, error: empresaError } = await supabase
    .from("empresas")
    .insert({
      nombre: limpiarTexto(empresa.nombre),
      nombre_normalizado: normalizar(empresa.nombre),
      codigo,
      admin_id: uid,
    })
    .select("id")
    .single();
  if (empresaError) throw empresaError;
  const empresaId = empresaRow.id;

  // 2. Crear primero la fila de usuario admin_empresa para satisfacer la RLS de sedes / departamentos
  const { error: usuarioInicialError } = await supabase.from("usuarios").upsert({
    id: uid,
    empresa_id: empresaId,
    rol: "admin_empresa",
    nombre: nombreAdmin,
    correo: emailSeguro,
    telefono: telefonoCompleto,
    usuario_interno: (emailSeguro.split("@")[0] || "admin").toLowerCase(),
    codigo_empresa: codigo,
    foto_perfil: fotoPerfil || null,
  });
  if (usuarioInicialError) throw usuarioInicialError;

  // 2.1 Logo de la empresa (opcional) — sube a Cloudinary y lo guarda en empresas.datos.
  // Necesita el empresaId ya creado para la carpeta, por eso va después del paso 1.
  if (logo) {
    const { url: logoUrl, publicId: logoPublicId } = await subirLogoEmpresa(logo, empresaId);
    const { error: logoError } = await supabase
      .from("empresas")
      .update({ datos: { logo_url: logoUrl, logo_public_id: logoPublicId } })
      .eq("id", empresaId);
    if (logoError) throw logoError;
    if (!fotoPerfil) {
      await supabase.from("usuarios").update({ foto_perfil: logoUrl }).eq("id", uid);
    }
  }

  // 3. Crear sede principal
  const { data: sedeRow, error: sedeError } = await supabase
    .from("sedes")
    .insert({ empresa_id: empresaId, nombre: limpiarTexto(empresa.sedePrincipal) })
    .select("id")
    .single();
  if (sedeError) throw sedeError;

  // 4. Crear departamento "Administración"
  const { data: deptoRow, error: deptoError } = await supabase
    .from("departamentos")
    .insert({ empresa_id: empresaId, nombre: "Administración" })
    .select("id")
    .single();
  if (deptoError) throw deptoError;

  // 5. Vincular sede y departamento al usuario
  const { error: usuarioUpdateError } = await supabase
    .from("usuarios")
    .update({
      sede_id: sedeRow.id,
      departamento_id: deptoRow.id,
    })
    .eq("id", uid);
  if (usuarioUpdateError) throw usuarioUpdateError;

  // 6. Configuraciones de la empresa
  await supabase.from("configuraciones_empresa").upsert({
    empresa_id: empresaId,
    configuracion: {
      ajustes: { idioma: "es", moneda: "USD", zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone },
      branding: { colorPrimario: "#7C3AED", colorSecundario: "#A855F7" },
      asistencia: { horaEntrada: "08:00", horaSalida: "17:00", horasEsperadas: 8, toleranciaMinutos: 10 },
    },
  });

  // 7. Suscripción y pago
  const plan = checkout.plan;
  const billing = checkout.billing === "annual" ? "annual" : "monthly";
  const { data: planRow } = await supabase.from("planes").select("id").eq("nombre", plan).maybeSingle();
  await supabase.from("suscripciones").upsert({
    empresa_id: empresaId,
    plan_id: planRow?.id || null,
    estado: "activa",
    periodo_fin: subscriptionExpiration(billing).toISOString(),
  });
  if (planRow?.id) await supabase.from("empresas").update({ plan_id: planRow.id }).eq("id", empresaId);

  await supabase.from("payments").insert({
    empresa_id: empresaId,
    usuario_id: uid,
    monto: 0,
    estado: "confirmado",
    referencia_externa: checkout.purchaseId || generarPurchaseId(),
  });

  return empresaId;
}
