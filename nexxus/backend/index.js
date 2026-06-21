/**
 * Documentacion Nexxus - nexxus/backend/index.js
 * Capa: backend.
 * Proposito: Backend Firebase Functions. Expone acciones seguras del servidor, valida permisos y escribe datos administrativos en Firebase.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { onCall, HttpsError } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
// Importa admin desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
const admin = require("firebase-admin");
const crypto = require("crypto");

// Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
if (!admin.apps.length) {
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  admin.initializeApp();
}

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "drsygtiob";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "";
const PLAN_PRICES = { Starter: 20, Business: 50, Enterprise: 200 };
const VALID_BILLING_CYCLES = new Set(["monthly", "annual"]);

const getCaller = async (auth) => {
  if (!auth) throw new HttpsError("unauthenticated", "Usuario no autenticado.");
  const snap = await admin.firestore().collection("usuarios").doc(auth.uid).get();
  if (!snap.exists) throw new HttpsError("permission-denied", "No se encontró el usuario.");
  const data = snap.data() || {};
  return { id: auth.uid, ...data, empresaId: data.empresaId || data.empresa_id || "" };
};

const sameCompany = (caller, empresaId) => String(caller.empresaId || caller.empresa_id || "") === String(empresaId || "");
const isAdmin = (caller) => String(caller.rol || "").toLowerCase() === "admin";

const assertUploadAccess = (caller, data) => {
  const { kind, empresaId, ownerId, documentUserId } = data;
  if (!sameCompany(caller, empresaId)) throw new HttpsError("permission-denied", "No tienes acceso a esta empresa.");
  if (kind === "profilePhoto" && ownerId !== caller.id && !isAdmin(caller)) {
    throw new HttpsError("permission-denied", "No puedes modificar esta foto.");
  }
  if (kind === "companyLogo" && !isAdmin(caller)) {
    throw new HttpsError("permission-denied", "Solo un administrador puede cambiar el logo.");
  }
  if (kind === "document" && !isAdmin(caller)) {
    throw new HttpsError("permission-denied", "Solo un administrador puede subir documentos.");
  }
  if (kind === "document" && !documentUserId) {
    throw new HttpsError("invalid-argument", "El documento necesita usuario destino.");
  }
};

const enforceUploadRateLimit = async (uid) => {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const ref = admin.firestore().collection("upload_rate_limits").doc(uid);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : {};
  const windowStart = Number(data.windowStart || 0);
  const count = now - windowStart > windowMs ? 0 : Number(data.count || 0);
  if (count >= 10) {
    throw new HttpsError("resource-exhausted", "Demasiadas subidas. Intenta nuevamente en unos minutos.");
  }
  await ref.set({
    uid,
    windowStart: count === 0 ? now : windowStart,
    count: count + 1,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
};

const signCloudinaryParams = (params) => {
  const payload = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(payload + CLOUDINARY_API_SECRET).digest("hex");
};

const destroyCloudinary = async (publicId, resourceType = "image") => {
  if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn("Cloudinary API secret no configurado; se omite borrado server-side.");
    return { skipped: true };
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { public_id: publicId, timestamp };
  const body = new URLSearchParams({
    ...params,
    api_key: CLOUDINARY_API_KEY,
    signature: signCloudinaryParams(params),
  });
  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new HttpsError("internal", json?.error?.message || "No se pudo borrar el archivo en Cloudinary.");
  return json;
};

const subscriptionExpiration = (billing) => {
  const expiresAt = new Date();
  if (billing === "annual") expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  else expiresAt.setMonth(expiresAt.getMonth() + 1);
  return expiresAt;
};

exports.confirmPlanPurchase = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Usuario no autenticado.");
  const db = admin.firestore();
  const userRef = db.collection("usuarios").doc(request.auth.uid);
  const userSnapshot = await userRef.get();
  const userData = userSnapshot.exists ? userSnapshot.data() || {} : {};
  const caller = {
    id: request.auth.uid,
    correo: userData.correo || request.auth.token.email || "",
    empresaId: userData.empresaId || userData.empresa_id || "",
  };
  const plan = String(request.data?.plan || "");
  const billing = String(request.data?.billing || "");
  const purchaseId = String(request.data?.purchaseId || "").trim();
  const promotionCode = String(request.data?.promotionCode || "").trim().toUpperCase();
  const automaticBilling = request.data?.automaticBilling !== false;
  if (!PLAN_PRICES[plan] || !VALID_BILLING_CYCLES.has(billing) || !purchaseId) {
    throw new HttpsError("invalid-argument", "Plan, ciclo o identificador de pago inválido.");
  }

  const paymentRef = db.collection("payments").doc(purchaseId);
  const existingPayment = await paymentRef.get();
  if (existingPayment.exists) {
    const payment = existingPayment.data() || {};
    if (payment.userId !== caller.id) throw new HttpsError("permission-denied", "El pago pertenece a otra cuenta.");
    return { confirmed: true, plan: payment.plan, expiresAt: payment.expiresAt?.toDate?.().toISOString() || null };
  }

  const expiresAt = subscriptionExpiration(billing);
  const companyRef = caller.empresaId ? db.collection("empresas").doc(caller.empresaId) : null;
  const monthlyPrice = PLAN_PRICES[plan];
  const amount = promotionCode === "FR33" ? 0 : billing === "annual" ? Math.round(monthlyPrice * 12 * 0.6) : monthlyPrice;
  const subscriptionData = {
    automaticBilling,
    plan,
    planActivo: plan,
    planBilling: billing,
    planCancelAtPeriodEnd: false,
    planCancellationRequestedAt: null,
    planCodigoPromocional: promotionCode || null,
    planDataDeletionAt: null,
    planExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    planGraceStartedAt: null,
    planPaymentStatus: "paid",
    planPurchaseId: purchaseId,
    planStartedAt: admin.firestore.FieldValue.serverTimestamp(),
    planUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    subscriptionStatus: "active",
  };
  const batch = db.batch();
  batch.set(userRef, { correo: caller.correo || request.auth.token.email || "", id: caller.id, ...subscriptionData }, { merge: true });
  if (companyRef) batch.set(companyRef, { ...subscriptionData, "configuracion.plan": plan }, { merge: true });
  batch.create(paymentRef, {
    amount,
    automaticBilling,
    billing,
    confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
    currency: "USD",
    empresaId: caller.empresaId || null,
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    plan,
    promotionCode: promotionCode || null,
    status: "confirmed",
    userId: caller.id,
  });
  await batch.commit();
  return { confirmed: true, plan, expiresAt: expiresAt.toISOString() };
});

exports.cancelPlanAtPeriodEnd = onCall({ cors: true }, async (request) => {
  const caller = await getCaller(request.auth);
  if (!isAdmin(caller) && caller.empresaId) throw new HttpsError("permission-denied", "Solo el administrador puede cancelar el plan.");
  if (!PLAN_PRICES[caller.planActivo]) throw new HttpsError("failed-precondition", "No hay un plan activo para cancelar.");
  const expiresAt = caller.planExpiresAt?.toDate?.();
  if (!expiresAt) throw new HttpsError("failed-precondition", "El plan no tiene un período de facturación válido.");
  const deletionAt = new Date(expiresAt);
  deletionAt.setMonth(deletionAt.getMonth() + 3);
  const cancellationData = {
    automaticBilling: false,
    planAccessEndsAt: admin.firestore.Timestamp.fromDate(expiresAt),
    planCancelAtPeriodEnd: true,
    planCancellationRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
    planDataDeletionAt: admin.firestore.Timestamp.fromDate(deletionAt),
    planUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    subscriptionStatus: "canceling",
  };
  const db = admin.firestore();
  const batch = db.batch();
  batch.set(db.collection("usuarios").doc(caller.id), cancellationData, { merge: true });
  if (caller.empresaId) batch.set(db.collection("empresas").doc(caller.empresaId), cancellationData, { merge: true });
  await batch.commit();
  return { canceledAtPeriodEnd: true, accessEndsAt: expiresAt.toISOString(), deletionAt: deletionAt.toISOString() };
});

exports.prepareCloudinaryUpload = onCall({ cors: true }, async (request) => {
  const caller = await getCaller(request.auth);
  const data = request.data || {};
  assertUploadAccess(caller, data);
  await enforceUploadRateLimit(caller.id);
  const duplicateSnap = await admin.firestore().collection("archivos_cloudinary")
    .where("empresaId", "==", data.empresaId)
    .where("hash", "==", data.hash)
    .where("kind", "==", data.kind)
    .where("activo", "==", true)
    .limit(1)
    .get();
  if (!duplicateSnap.empty) {
    const doc = duplicateSnap.docs[0];
    const found = doc.data();
    return { duplicate: true, assetId: doc.id, url: found.url, publicId: found.publicId };
  }
  return { duplicate: false };
});

exports.registerUploadMetadata = onCall({ cors: true }, async (request) => {
  const caller = await getCaller(request.auth);
  const data = request.data || {};
  assertUploadAccess(caller, data);
  const now = admin.firestore.FieldValue.serverTimestamp();
  const duplicateSnap = await admin.firestore().collection("archivos_cloudinary")
    .where("empresaId", "==", data.empresaId)
    .where("hash", "==", data.hash)
    .where("kind", "==", data.kind)
    .where("activo", "==", true)
    .limit(1)
    .get();
  if (!duplicateSnap.empty) {
    const doc = duplicateSnap.docs[0];
    const found = doc.data();
    return { assetId: doc.id, url: found.url, publicId: found.publicId, duplicate: true };
  }
  const ref = await admin.firestore().collection("archivos_cloudinary").add({
    kind: data.kind,
    empresaId: data.empresaId,
    ownerId: data.ownerId,
    documentUserId: data.documentUserId || null,
    title: data.title || null,
    hash: data.hash,
    size: Number(data.size || 0),
    originalSize: Number(data.originalSize || data.size || 0),
    mime: data.mime || "",
    publicId: data.publicId,
    url: data.url,
    resourceType: data.resourceType || "image",
    activo: true,
    createdBy: caller.id,
    createdAt: now,
    updatedAt: now,
  });
  return { assetId: ref.id, url: data.url, publicId: data.publicId, duplicate: false };
});

exports.deleteCloudinaryAsset = onCall({ cors: true }, async (request) => {
  const caller = await getCaller(request.auth);
  const { publicId, assetId } = request.data || {};
  if (!publicId && !assetId) throw new HttpsError("invalid-argument", "Falta el archivo a eliminar.");
  let assetDoc = null;
  let assetRef = null;
  if (assetId) {
    assetRef = admin.firestore().collection("archivos_cloudinary").doc(assetId);
    const snap = await assetRef.get();
    if (snap.exists) assetDoc = { id: snap.id, ...snap.data() };
  } else {
    const snap = await admin.firestore().collection("archivos_cloudinary").where("publicId", "==", publicId).limit(1).get();
    if (!snap.empty) {
      assetRef = snap.docs[0].ref;
      assetDoc = { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
  }
  if (!assetDoc) throw new HttpsError("not-found", "No se encontró el archivo registrado.");
  if (assetDoc && !sameCompany(caller, assetDoc.empresaId)) throw new HttpsError("permission-denied", "No puedes eliminar este archivo.");
  if (assetDoc?.kind !== "profilePhoto" && !isAdmin(caller)) throw new HttpsError("permission-denied", "Solo un administrador puede eliminar este archivo.");
  if (assetDoc?.kind === "profilePhoto" && assetDoc.ownerId !== caller.id && !isAdmin(caller)) throw new HttpsError("permission-denied", "No puedes eliminar esta foto.");

  const targetPublicId = assetDoc?.publicId || publicId;
  const refs = await admin.firestore().collection("archivos_cloudinary")
    .where("publicId", "==", targetPublicId)
    .where("activo", "==", true)
    .get();
  if (refs.size <= 1) await destroyCloudinary(targetPublicId, assetDoc?.resourceType || "image");
  if (assetRef) await assetRef.set({ activo: false, deletedBy: caller.id, deletedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  return { success: true };
});

exports.cleanupOrphanCloudinaryAssets = onCall({ cors: true }, async (request) => {
  const caller = await getCaller(request.auth);
  if (!isAdmin(caller)) throw new HttpsError("permission-denied", "Solo un administrador puede limpiar archivos.");
  const snap = await admin.firestore().collection("archivos_cloudinary")
    .where("empresaId", "==", caller.empresaId)
    .where("activo", "==", false)
    .limit(25)
    .get();
  let deleted = 0;
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    await destroyCloudinary(data.publicId, data.resourceType || "image").catch((error) => console.warn("cleanup cloudinary", error.message));
    await docSnap.ref.delete();
    deleted += 1;
  }
  return { deleted };
});

exports.getStorageStatsByCompany = onCall({ cors: true }, async (request) => {
  const caller = await getCaller(request.auth);
  const empresaId = request.data?.empresaId || caller.empresaId;
  if (!sameCompany(caller, empresaId)) throw new HttpsError("permission-denied", "No tienes acceso a esta empresa.");
  const snap = await admin.firestore().collection("archivos_cloudinary")
    .where("empresaId", "==", empresaId)
    .where("activo", "==", true)
    .get();
  const byUser = {};
  let totalBytes = 0;
  snap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const size = Number(data.size || 0);
    totalBytes += size;
    const userKey = data.ownerId || data.documentUserId || "sin_usuario";
    byUser[userKey] = (byUser[userKey] || 0) + size;
  });
  return {
    totalBytes,
    uploadCount: snap.size,
    topUsers: Object.entries(byUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, bytes]) => ({ userId, bytes })),
  };
});

/**
 * crearEmpresaAdmin: Funcion callable invocada desde la app. Valida contexto, consulta o escribe Firebase y devuelve solo la informacion que la UI necesita.
 */
exports.crearEmpresaAdmin = onCall({ cors: true }, async (request) => {
  // Declara { nombreEmpresa, nombreAdmin, correoAdmin, contrasenaAdmin, giroActividad, tamanoEquipo }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { nombreEmpresa, nombreAdmin, correoAdmin, contrasenaAdmin, giroActividad, tamanoEquipo } = request.data;
  
  // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
  try {
    // Declara userRecord; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const userRecord = await admin.auth().createUser({
      email: correoAdmin,
      password: contrasenaAdmin,
      displayName: nombreAdmin,
    });

    // Generar un código de acceso de empresa único (ej. NEX-4927)
    let codigo = '';
    // Declara unico; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let unico = false;
    // Declara prefix; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const prefix = (nombreEmpresa || 'EMP').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'EMP';
    // Declara attempts; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let attempts = 0;
    // Repite el bloque hasta cumplir la condicion; se usa para buscar o construir un valor valido.
    while (!unico && attempts < 10) {
      // Declara num; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const num = Math.floor(1000 + Math.random() * 9000);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      codigo = `${prefix}-${num}`;
      // Prepara dup; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
      const dup = await admin.firestore().collection('empresas').where('codigo', '==', codigo).get();
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (dup.empty) {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        unico = true;
      }
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      attempts++;
    }

    // Prepara empresaRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const empresaRef = admin.firestore().collection('empresas').doc();
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await empresaRef.set({
      id: empresaRef.id,
      nombre: nombreEmpresa,
      codigo: codigo || `${prefix}-1111`,
      giro: giroActividad || '',
      tamanoEquipo: tamanoEquipo || '',
      adminId: userRecord.uid,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      estado_activo: true
    });

    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await admin.firestore().collection('usuarios').doc(userRecord.uid).set({
      id: userRecord.uid,
      empresa_id: empresaRef.id,
      empresaId: empresaRef.id,
      empresaNombre: nombreEmpresa,
      nombre: nombreAdmin,
      correo: correoAdmin,
      rol: 'admin',
      departamento: 'Dirección General',
      estado_activo: true,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp()
    });

    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await admin.firestore().collection('logs').add({
      empresa_id: empresaRef.id,
      usuario_id: userRecord.uid,
      accion: 'CREAR_EMPRESA_ADMIN',
      modulo: 'AUTH',
      fecha: admin.firestore.FieldValue.serverTimestamp()
    });

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { success: true, empresaId: empresaRef.id };
  } catch (error) {
    // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
    throw new HttpsError("internal", "Error interno al crear la empresa: " + error.message);
  }
});

/**
 * crearUsuarioEmpresa: Funcion callable invocada desde la app. Valida contexto, consulta o escribe Firebase y devuelve solo la informacion que la UI necesita.
 */
exports.crearUsuarioEmpresa = onCall({ cors: true }, async (request) => {
  // Declara { auth, data }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { auth, data } = request;

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!auth) {
    // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
    throw new HttpsError('unauthenticated', 'Usuario no autenticado.');
  }
  
  // Prepara callerDoc; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const callerDoc = await admin.firestore().collection('usuarios').doc(auth.uid).get();
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!callerDoc.exists) {
    // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
    throw new HttpsError('permission-denied', 'No se encontró el usuario.');
  }

  // Declara callerData; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const callerData = callerDoc.data();
  // Declara rolCaller; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const rolCaller = String(callerData.rol || '').toLowerCase();
  // Declara modulosCaller; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const modulosCaller = Array.isArray(callerData.permisos?.modulos) ? callerData.permisos.modulos : [];
  // Declara puedeCrearUsuarios; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const puedeCrearUsuarios = rolCaller === 'admin' || modulosCaller.includes('admin') || modulosCaller.includes('plantilla');
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!puedeCrearUsuarios) {
    // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
    throw new HttpsError('permission-denied', 'Solo los administradores pueden crear usuarios.');
  }

  // Declara { nombre, correo, contrasena, rol, departamento_id, empleado }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { nombre, correo, contrasena, rol, departamento_id, empleado } = data;
  // Declara empresa_id; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const empresa_id = callerData.empresa_id || callerData.empresaId;

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!empresa_id) {
    // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
    throw new HttpsError('failed-precondition', 'El administrador no tiene empresa asignada.');
  }

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!nombre || !correo || !contrasena || !rol) {
    // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
    throw new HttpsError('invalid-argument', 'Nombre, correo, contraseña y rol son obligatorios.');
  }

  // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
  try {
    // Declara userRecord; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const userRecord = await admin.auth().createUser({
      email: correo,
      password: contrasena,
      displayName: nombre,
    });

    // Declara datosEmpleado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const datosEmpleado = empleado && typeof empleado === 'object' ? empleado : {};
    // Declara departamentoNombre; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const departamentoNombre = datosEmpleado.departamento || departamento_id || 'General';

    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await admin.firestore().collection('usuarios').doc(userRecord.uid).set({
      ...datosEmpleado,
      id: userRecord.uid,
      empresa_id: empresa_id,
      empresaId: empresa_id,
      nombre: nombre,
      correo: correo,
      rol: rol,
      departamento_id: datosEmpleado.departamentoId || departamento_id || null,
      departamentoId: datosEmpleado.departamentoId || null,
      departamento: departamentoNombre,
      estado_activo: true,
      activo: true,
      eliminado: false,
      estado_onboarding: 'pendiente',
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await admin.firestore().collection('logs').add({
      empresa_id: empresa_id,
      empresaId: empresa_id,
      usuario_id: auth.uid,
      accion: 'CREAR_USUARIO',
      modulo: 'AUTH',
      detalles: userRecord.uid,
      fecha: admin.firestore.FieldValue.serverTimestamp()
    });

    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await admin.firestore().collection('audit_logs').add({
      empresa_id: empresa_id,
      empresaId: empresa_id,
      usuarioId: auth.uid,
      usuarioNombre: callerData.nombre || callerData.correo || 'Administrador',
      rol: callerData.rol || 'admin',
      accion: 'Creación de Empleado',
      modulo: 'Plantilla',
      detalles: `${nombre} · ${correo}`,
      estado: 'Success',
      ipAddress: 'Cloud Function',
      timestamp: new Date().toISOString()
    });

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { success: true, uid: userRecord.uid };
  } catch (error) {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (error.code === 'auth/email-already-exists') {
      // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
      throw new HttpsError('already-exists', 'Ya existe un usuario con ese correo.');
    }
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (error.code === 'auth/invalid-password') {
      // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
      throw new HttpsError('invalid-argument', 'La contraseña no cumple los requisitos mínimos.');
    }
    // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
    throw new HttpsError("internal", "Error al crear el usuario: " + error.message);
  }
});

// Importa { onDocumentCreated, onDocumentUpdated } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");

/**
 * Declaracion obtenerTokensPush. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
async function obtenerTokensPush(usuariosIds) {
  // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
  try {
    // Prepara tokensQuery; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const tokensQuery = admin.firestore().collection('push_tokens')
      .where('usuario_id', 'in', usuariosIds.slice(0, 10))
      .where('activo', '==', true);
    
    // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snapshot = await tokensQuery.get();
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snapshot.docs.map(doc => doc.data().token);
  } catch (error) {
    // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
    console.error('Error al obtener tokens:', error);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return [];
  }
}

/**
 * Declaracion enviarPushNotification. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
async function enviarPushNotification(tokens, titulo, cuerpo, datos = {}) {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!tokens || tokens.length === 0) return;

  // Calcula mensajes; transforma la lista original en datos listos para renderizar o guardar.
  const mensajes = tokens.map(token => ({
    token: token,
    notification: {
      title: titulo,
      body: cuerpo,
    },
    data: datos,
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
  }));

  // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
  try {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await Promise.all(
      mensajes.map(mensaje => admin.messaging().send(mensaje))
    );
    // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
    console.log(`${mensajes.length} notificaciones push enviadas`);
  } catch (error) {
    // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
    console.error('Error al enviar push notifications:', error);
  }
}

/**
 * onAnuncioCreado: Trigger Firestore al crear documento. Valida contexto, consulta o escribe Firebase y devuelve solo la informacion que la UI necesita.
 */
exports.onAnuncioCreado = onDocumentCreated("anuncios/{anuncioId}", async (event) => {
  // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const snapshot = event.data;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!snapshot) return;

  // Declara anuncio; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const anuncio = snapshot.data();
  // Declara anuncioId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const anuncioId = event.params.anuncioId;
  // Declara { titulo, contenido, tipo, destinatarios, empresaId, empresa_id, adminId }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { titulo, contenido, tipo, destinatarios, empresaId, empresa_id, adminId } = anuncio;
  // Declara targetEmpresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const targetEmpresaId = empresaId || empresa_id;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!targetEmpresaId) return;

  // Declara usuariosIds; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  let usuariosIds = [];

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (tipo === "global" || tipo === "empresa") {
    // Prepara snapshotUsuarios; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const snapshotUsuarios = await admin.firestore().collection("usuarios")
      .where("empresaId", "==", targetEmpresaId)
      .get();
    
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    snapshotUsuarios.forEach(doc => {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (doc.id !== adminId) {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        usuariosIds.push(doc.id);
      }
    });
  } else if (tipo === "privado" && Array.isArray(destinatarios)) {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    usuariosIds = destinatarios;
  }

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (usuariosIds.length === 0) return;

  // Declara loteNotificaciones; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const loteNotificaciones = admin.firestore().batch();
  // Declara ahora; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const ahora = admin.firestore.FieldValue.serverTimestamp();

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  usuariosIds.forEach(uid => {
    // Declara notifId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const notifId = `anuncio_${uid}_${anuncioId}`;
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = admin.firestore().collection("notificaciones").doc(notifId);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    loteNotificaciones.set(docRef, {
      id: notifId,
      usuario_id: uid,
      titulo: `Nuevo anuncio: ${titulo}`,
      mensaje: contenido,
      leida: false,
      fecha: ahora,
      anuncio_id: anuncioId,
      empresaId: targetEmpresaId,
      tipo: 'anuncio'
    });
  });

  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await loteNotificaciones.commit();

  // Declara tokens; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tokens = await obtenerTokensPush(usuariosIds);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await enviarPushNotification(tokens, 'Nuevo Anuncio', titulo, {
    tipo: 'anuncio',
    anuncioId: anuncioId,
    empresaId: targetEmpresaId
  });

  // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
  try {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (tipo === "global") {
       // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
       await admin.messaging().send({
          topic: `anuncios_${targetEmpresaId}`,
          notification: { title: titulo, body: contenido }
       });
    }
  } catch (error) {
    // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
    console.error("Error FCM:", error);
  }
});

/**
 * onTareaCreada: Trigger Firestore al crear documento. Valida contexto, consulta o escribe Firebase y devuelve solo la informacion que la UI necesita.
 */
exports.onTareaCreada = onDocumentCreated("tareas/{tareaId}", async (event) => {
  // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const snapshot = event.data;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!snapshot) return;

  // Declara tarea; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tarea = snapshot.data();
  // Declara tareaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tareaId = event.params.tareaId;
  // Declara { titulo, descripcion, asignado_a, asignado_por_nombre, empresaId }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { titulo, descripcion, asignado_a, asignado_por_nombre, empresaId } = tarea;

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!asignado_a) return;

  // Declara notifId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const notifId = `tarea_creada_${tareaId}`;
  // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const docRef = admin.firestore().collection("notificaciones").doc(notifId);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await docRef.set({
    id: notifId,
    usuario_id: asignado_a,
    titulo: `Nueva tarea asignada`,
    mensaje: `${asignado_por_nombre || 'Tu jefe'} te asignó: "${titulo}". ${descripcion || ''}`.trim(),
    tipo: "tarea",
    leida: false,
    fecha: admin.firestore.FieldValue.serverTimestamp(),
    tarea_id: tareaId,
    empresaId: empresaId || '',
  });

  // Declara tokens; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tokens = await obtenerTokensPush([asignado_a]);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await enviarPushNotification(tokens, 'Nueva Tarea', `${asignado_por_nombre || 'Tu jefe'} te asignó: "${titulo}"`, {
    tipo: 'tarea',
    tareaId: tareaId,
    empresaId: empresaId || ''
  });
});

/**
 * onTareaActualizada: Trigger Firestore al actualizar documento. Valida contexto, consulta o escribe Firebase y devuelve solo la informacion que la UI necesita.
 */
exports.onTareaActualizada = onDocumentUpdated("tareas/{tareaId}", async (event) => {
  // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const snapshot = event.data;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!snapshot) return;

  // Declara before; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const before = snapshot.before.data();
  // Declara after; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const after = snapshot.after.data();
  // Declara tareaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tareaId = event.params.tareaId;

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (after.estado === 'completada') return;

  // Declara huboCambios; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const huboCambios = 
    before.titulo !== after.titulo || 
    before.descripcion !== after.descripcion || 
    before.prioridad !== after.prioridad;

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!huboCambios) return;

  // Declara { asignado_a, empresaId, titulo }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { asignado_a, empresaId, titulo } = after;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!asignado_a) return;

  // Declara notifId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const notifId = `tarea_modificada_${tareaId}`;
  // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const docRef = admin.firestore().collection("notificaciones").doc(notifId);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await docRef.set({
    id: notifId,
    usuario_id: asignado_a,
    titulo: `Tarea modificada`,
    mensaje: `La tarea "${titulo}" ha sido modificada por el administrador. Por favor, revisa los cambios.`,
    tipo: "tarea_modificada",
    leida: false,
    fecha: admin.firestore.FieldValue.serverTimestamp(),
    tarea_id: tareaId,
    empresaId: empresaId || '',
  });

  // Declara tokens; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tokens = await obtenerTokensPush([asignado_a]);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await enviarPushNotification(tokens, 'Tarea Actualizada', `La tarea "${titulo}" ha sido modificada`, {
    tipo: 'tarea_modificada',
    tareaId: tareaId,
    empresaId: empresaId || ''
  });
});

/**
 * onSolicitudAusenciaCreada: Trigger Firestore al crear documento. Valida contexto, consulta o escribe Firebase y devuelve solo la informacion que la UI necesita.
 */
exports.onSolicitudAusenciaCreada = onDocumentCreated("solicitudes_ausencia/{solicitudId}", async (event) => {
  // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const snapshot = event.data;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!snapshot) return;

  // Declara solicitud; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const solicitud = snapshot.data();
  // Declara solicitudId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const solicitudId = event.params.solicitudId;
  // Declara { usuario_id, usuario_nombre, tipo, fecha_inicio, fecha_fin, empresaId }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { usuario_id, usuario_nombre, tipo, fecha_inicio, fecha_fin, empresaId } = solicitud;

  // Prepara adminSnapshot; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const adminSnapshot = await admin.firestore().collection("usuarios")
    .where("empresaId", "==", empresaId)
    .where("rol", "==", "admin")
    .get();

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (adminSnapshot.empty) return;

  // Declara loteNotificaciones; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const loteNotificaciones = admin.firestore().batch();
  // Declara ahora; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const ahora = admin.firestore.FieldValue.serverTimestamp();

  // Declara adminsIds; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const adminsIds = [];
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  adminSnapshot.forEach(doc => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    adminsIds.push(doc.id);
    // Declara notifId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const notifId = `solicitud_${doc.id}_${solicitudId}`;
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = admin.firestore().collection("notificaciones").doc(notifId);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    loteNotificaciones.set(docRef, {
      id: notifId,
      usuario_id: doc.id,
      titulo: `Nueva solicitud de ausencia`,
      mensaje: `${usuario_nombre} solicitó ${tipo} del ${fecha_inicio} al ${fecha_fin}`,
      tipo: "solicitud_ausencia",
      leida: false,
      fecha: ahora,
      solicitud_id: solicitudId,
      empresaId: empresaId,
    });
  });

  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await loteNotificaciones.commit();

  // Declara tokens; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tokens = await obtenerTokensPush(adminsIds);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await enviarPushNotification(tokens, 'Nueva Solicitud', `${usuario_nombre} solicitó ${tipo}`, {
    tipo: 'solicitud_ausencia',
    solicitudId: solicitudId,
    empresaId: empresaId
  });
});

/**
 * onSolicitudAusenciaActualizada: Trigger Firestore al actualizar documento. Valida contexto, consulta o escribe Firebase y devuelve solo la informacion que la UI necesita.
 */
exports.onSolicitudAusenciaActualizada = onDocumentUpdated("solicitudes_ausencia/{solicitudId}", async (event) => {
  // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const snapshot = event.data;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!snapshot) return;

  // Declara before; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const before = snapshot.before.data();
  // Declara after; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const after = snapshot.after.data();

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (before.estado === after.estado) return;

  // Declara { usuario_id, usuario_nombre, tipo, estado, empresaId }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { usuario_id, usuario_nombre, tipo, estado, empresaId } = after;

  // Declara notifId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const notifId = `solicitud_resp_${event.params.solicitudId}`;
  // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const docRef = admin.firestore().collection("notificaciones").doc(notifId);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await docRef.set({
    id: notifId,
    usuario_id: usuario_id,
    titulo: `Solicitud ${estado === 'aprobada' ? 'aprobada' : 'rechazada'}`,
    mensaje: `Tu solicitud de ${tipo} ha sido ${estado === 'aprobada' ? 'aprobada' : 'rechazada'} por el administrador.`,
    tipo: "solicitud_ausencia_respuesta",
    leida: false,
    fecha: admin.firestore.FieldValue.serverTimestamp(),
    solicitud_id: event.params.solicitudId,
    empresaId: empresaId,
  });

  // Declara tokens; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tokens = await obtenerTokensPush([usuario_id]);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await enviarPushNotification(tokens, 'Solicitud Actualizada', `Tu solicitud de ${tipo} ha sido ${estado}`, {
    tipo: 'solicitud_ausencia_respuesta',
    estado: estado
  });
});

/**
 * onCitaPsicologoCreada: Trigger Firestore al crear documento. Valida contexto, consulta o escribe Firebase y devuelve solo la informacion que la UI necesita.
 */
exports.onCitaPsicologoCreada = onDocumentCreated("usuarios/{uid}/citas/{citaId}", async (event) => {
  // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const snapshot = event.data;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!snapshot) return;

  // Declara cita; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const cita = snapshot.data();
  // Declara citaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const citaId = event.params.citaId;
  // Declara { especialista, fecha, horario, usuario_nombre }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { especialista, fecha, horario, usuario_nombre } = cita;

  // Prepara psicologoSnapshot; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const psicologoSnapshot = await admin.firestore().collection("usuarios")
    .where("nombre", "==", especialista)
    .where("rol", "==", "psicologo")
    .get();

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (psicologoSnapshot.empty) return;

  // Declara psicologoId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const psicologoId = psicologoSnapshot.docs[0].id;

  // Declara notifId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const notifId = `cita_psicologo_${citaId}`;
  // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const docRef = admin.firestore().collection("notificaciones").doc(notifId);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await docRef.set({
    id: notifId,
    usuario_id: psicologoId,
    titulo: `Nueva cita agendada`,
    mensaje: `${usuario_nombre} agendó una cita contigo para el ${fecha} a las ${horario}`,
    tipo: "cita_psicologo",
    leida: false,
    fecha: admin.firestore.FieldValue.serverTimestamp(),
    cita_id: citaId,
  });

  // Declara tokens; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tokens = await obtenerTokensPush([psicologoId]);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await enviarPushNotification(tokens, 'Nueva Cita', `${usuario_nombre} agendó una cita`, {
    tipo: 'cita_psicologo',
    citaId: citaId
  });
});

const COMPANY_COLLECTIONS = [
  "anuncios", "asistencias", "audit_logs", "calendario_empresarial", "cargos",
  "chat_contextual", "checkins", "citas", "configuraciones_empresa", "cursos",
  "departments", "documentos", "feedbacks", "focus_sessions", "inbox_unificado",
  "logs", "notificaciones", "nominas", "pausas", "roles_personalizados", "sedes",
  "solicitudes_ausencia", "solicitudes_internas", "tareas",
];

const deleteDocumentRefs = async (refs) => {
  const uniqueRefs = [...new Map(refs.map((ref) => [ref.path, ref])).values()];
  for (let index = 0; index < uniqueRefs.length; index += 400) {
    const batch = admin.firestore().batch();
    uniqueRefs.slice(index, index + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
};

const companyDocumentRefs = async (collectionName, empresaId) => {
  const collectionRef = admin.firestore().collection(collectionName);
  const results = await Promise.all([
    collectionRef.where("empresaId", "==", empresaId).get(),
    collectionRef.where("empresa_id", "==", empresaId).get(),
  ]);
  return results.flatMap((snapshot) => snapshot.docs.map((entry) => entry.ref));
};

const deleteExpiredCompany = async (companySnapshot) => {
  const db = admin.firestore();
  const company = companySnapshot.data() || {};
  if (company.subscriptionStatus !== "grace_period") return;
  const empresaId = companySnapshot.id;
  const ownerId = company.adminId || company.adminUid || "";
  const assets = await db.collection("archivos_cloudinary").where("empresaId", "==", empresaId).get();
  for (const asset of assets.docs) {
    const data = asset.data() || {};
    if (data.publicId) await destroyCloudinary(data.publicId, data.resourceType || "image").catch((error) => console.warn("subscription cleanup cloudinary", error.message));
  }
  if (company.logo_public_id && !assets.docs.some((entry) => entry.data()?.publicId === company.logo_public_id)) {
    await destroyCloudinary(company.logo_public_id, "image").catch((error) => console.warn("subscription cleanup logo", error.message));
  }

  const employeeSnapshots = await Promise.all([
    db.collection("usuarios").where("empresaId", "==", empresaId).get(),
    db.collection("usuarios").where("empresa_id", "==", empresaId).get(),
  ]);
  const employees = [...new Map(employeeSnapshots.flatMap((snapshot) => snapshot.docs).map((entry) => [entry.id, entry])).values()];
  for (const employee of employees) {
    if (employee.id === ownerId) continue;
    await db.recursiveDelete(employee.ref);
  }

  const refs = assets.docs.map((entry) => entry.ref);
  for (const collectionName of COMPANY_COLLECTIONS) refs.push(...await companyDocumentRefs(collectionName, empresaId));
  await deleteDocumentRefs(refs);
  if (ownerId) {
    await db.collection("usuarios").doc(ownerId).set({
      automaticBilling: false,
      empresa: admin.firestore.FieldValue.delete(),
      empresaId: admin.firestore.FieldValue.delete(),
      empresa_id: admin.firestore.FieldValue.delete(),
      plan: admin.firestore.FieldValue.delete(),
      planActivo: admin.firestore.FieldValue.delete(),
      planPaymentStatus: "expired",
      planUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      subscriptionStatus: "expired",
    }, { merge: true });
  }
  await db.recursiveDelete(companySnapshot.ref);
};

exports.processSubscriptionLifecycle = onSchedule({ schedule: "every 24 hours", timeZone: "America/El_Salvador" }, async () => {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  const ending = await db.collection("empresas")
    .where("subscriptionStatus", "==", "canceling")
    .where("planAccessEndsAt", "<=", now)
    .get();
  for (const companySnapshot of ending.docs) {
    const company = companySnapshot.data() || {};
    const graceData = {
      automaticBilling: false,
      plan: admin.firestore.FieldValue.delete(),
      planActivo: admin.firestore.FieldValue.delete(),
      planGraceStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      planPaymentStatus: "grace_period",
      planUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      subscriptionStatus: "grace_period",
    };
    const batch = db.batch();
    batch.set(companySnapshot.ref, graceData, { merge: true });
    const ownerId = company.adminId || company.adminUid;
    if (ownerId) batch.set(db.collection("usuarios").doc(ownerId), graceData, { merge: true });
    await batch.commit();
  }

  const expired = await db.collection("empresas")
    .where("subscriptionStatus", "==", "grace_period")
    .where("planDataDeletionAt", "<=", now)
    .get();
  for (const companySnapshot of expired.docs) await deleteExpiredCompany(companySnapshot);
});
