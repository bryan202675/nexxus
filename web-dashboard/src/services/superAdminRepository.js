import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { auth, db, getSecondaryApp } from "firebaseClient/firebaseConfig";

// Puerto de nexxus/app/src/infrastructure/firebase/FirebaseSuperAdminRepository.ts (misma logica,
// mismas colecciones/queries) para el dashboard web separado. El original resuelve las acciones
// administrativas (crear/banear/eliminar cuentas, reset password, impersonar soporte) con Cloud
// Functions (Admin SDK); este proyecto Firebase no esta en plan Blaze y esas funciones nunca se
// desplegaron. Donde hay un equivalente real solo con el SDK de cliente lo usamos (ver cada
// funcion); donde no lo hay (impersonar soporte: firmar un token para OTRO usuario es
// intrinsecamente cosa de servidor) la funcion sigue lanzando BLAZE_REQUIRED en vez de fingir.
export const BLAZE_REQUIRED = "BLAZE_REQUIRED";

const requiresBlaze = () => {
  const error = new Error(
    "Esta accion requiere firmar credenciales de OTRO usuario del lado del servidor (Admin SDK) y el proyecto Firebase no esta en plan Blaze. No tiene equivalente seguro solo-cliente."
  );
  error.code = BLAZE_REQUIRED;
  throw error;
};

const textValue = (value, fallback = "") =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
const numberValue = (value) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
const boolValue = (value) => value === true;
const isoDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return null;
};

export const ROLE_ALIAS_GROUPS = {
  super_admin: ["super_admin"],
  admin_empresa: ["admin", "admin_empresa"],
  jefe: ["jefe", "jefe_sector"],
  empleado: ["empleado", "psicologo"],
};

const normalizeRoleClient = (rol) => {
  const value = String(rol || "").trim().toLowerCase();
  for (const [canonical, aliases] of Object.entries(ROLE_ALIAS_GROUPS)) {
    if (aliases.includes(value)) return canonical;
  }
  return "empleado";
};

const expirationDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
};

const mapEmpresa = (docSnap) => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    nombre: textValue(data.nombre, textValue(data.empresaNombre, "Empresa sin nombre")),
    codigo: textValue(data.codigo, docSnap.id.slice(0, 8)),
    estado: textValue(data.subscriptionStatus, textValue(data.estado, data.estado_activo === false ? "inactive" : "active")),
    plan: textValue(data.planActivo, textValue(data.plan, "Sin plan")),
    paymentStatus: textValue(data.planPaymentStatus, textValue(data.status, "sin_estado")),
    fechaCreacion: isoDate(data.fecha_creacion),
    logoUrl: textValue(data.logo_url),
  };
};

const mapEmpresaDetalle = (docSnap, usuariosTotal = 0) => {
  const data = docSnap.data();
  return {
    ...mapEmpresa(docSnap),
    giro: textValue(data.giro),
    tamanoEquipo: textValue(data.tamanoEquipo),
    logoUrl: textValue(data.logo_url),
    adminId: textValue(data.adminId, textValue(data.adminUid)),
    adminNombre: "",
    adminCorreo: "",
    subscriptionStatus: textValue(data.subscriptionStatus, "active"),
    subscriptionSuspended: boolValue(data.subscriptionSuspended),
    planBilling: textValue(data.planBilling, "monthly"),
    planExpiresAt: isoDate(data.planExpiresAt),
    planCancelAtPeriodEnd: boolValue(data.planCancelAtPeriodEnd),
    baneada: boolValue(data.baneada),
    estadoActivo: data.estado_activo !== false,
    fechaCreacion: isoDate(data.fecha_creacion),
    usuariosTotal,
  };
};

const mapPago = (docSnap) => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    empresaId: textValue(data.empresaId, "sin_empresa"),
    plan: textValue(data.plan, "Plan"),
    status: textValue(data.status, "sin_estado"),
    amount: numberValue(data.amount),
    createdAt: isoDate(data.confirmedAt ?? data.createdAt),
  };
};

const mapAudit = (docSnap) => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    empresaId: textValue(data.empresaId, textValue(data.empresa_id, "")) || null,
    empresaNombre: textValue(data.empresaNombre),
    accion: textValue(data.accion, "Evento"),
    modulo: textValue(data.modulo, "Sistema"),
    estado: textValue(data.estado, "Success"),
    actorNombre: textValue(data.usuarioNombre),
    detalles: textValue(data.detalles),
    timestamp: isoDate(data.timestamp) || (typeof data.timestamp === "string" ? data.timestamp : null),
  };
};

const mapUsuario = (docSnap, empresaNombre = "", adminId = "") => {
  const data = docSnap.data();
  const empresaId = textValue(data.empresaId, textValue(data.empresa_id));
  return {
    id: docSnap.id,
    nombre: textValue(data.nombre, "Sin nombre"),
    correo: textValue(data.correo, textValue(data.email)),
    telefono: textValue(data.telefono),
    rol: normalizeRoleClient(data.rol),
    rolCrudo: textValue(data.rol),
    empresaId,
    empresaNombre: textValue(data.empresaNombre, empresaNombre),
    departamento: textValue(data.departamento),
    cargo: textValue(data.cargo),
    sede: textValue(data.sede),
    salarioBase: numberValue(data.salarioBase),
    usuarioInterno: textValue(data.usuarioInterno),
    codigoEmpresa: textValue(data.codigoEmpresa),
    activo: data.activo !== false && data.estado_activo !== false,
    baneado: boolValue(data.baneado),
    eliminado: boolValue(data.eliminado),
    esPropietario: Boolean(adminId) && docSnap.id === adminId,
    fechaCreacion: isoDate(data.fecha_creacion),
    fotoPerfil: textValue(data.foto_perfil),
  };
};

const mergeDualSchemaDocs = (snapshots) => {
  const map = new Map();
  snapshots.flat().forEach((entry) => map.set(entry.id, entry));
  return [...map.values()];
};

function applyUserClientFilters(items, filtros) {
  let result = items;
  if (filtros.rol && filtros.empresaId) result = result.filter((entry) => entry.rol === filtros.rol);
  if (filtros.estado === "activos") result = result.filter((entry) => entry.activo && !entry.eliminado && !entry.baneado);
  else if (filtros.estado === "inactivos") result = result.filter((entry) => !entry.activo && !entry.eliminado);
  else if (filtros.estado === "baneados") result = result.filter((entry) => entry.baneado);
  else if (filtros.estado === "eliminados") result = result.filter((entry) => entry.eliminado);
  else result = result.filter((entry) => !entry.eliminado);
  return result;
}

// --- Resumen / stats ---
// El backend original resuelve esto con una Cloud Function (saPlatformStats) que usa count()
// server-side y .select() para no bajar documentos completos. Sin Blaze reimplementamos el mismo
// calculo desde el cliente: los conteos usan getCountFromServer (si las reglas lo permiten, que es
// el caso para super_admin) y porPlan/ingresos requieren traer los documentos completos porque el
// SDK de cliente no soporta proyeccion de campos.
export async function getPlatformStats() {
  const now = new Date();
  const hace30d = Timestamp.fromDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
  const empresasRef = collection(db, "empresas");
  const usuariosRef = collection(db, "usuarios");
  const paymentsRef = collection(db, "payments");

  const countOf = async (q) => (await getCountFromServer(q)).data().count;

  const [
    empresasTotal,
    empresasActivas,
    empresasSuspendidas,
    empresasExpiradas,
    empresasBaneadas,
    usuariosTotal,
    usuariosActivos,
    empresasNuevas30d,
    usuariosNuevos30d,
    porRolEntries,
  ] = await Promise.all([
    countOf(query(empresasRef)),
    countOf(query(empresasRef, where("estado_activo", "==", true))),
    countOf(query(empresasRef, where("subscriptionStatus", "==", "grace_period"))),
    countOf(query(empresasRef, where("subscriptionStatus", "==", "expired"))),
    countOf(query(empresasRef, where("baneada", "==", true))),
    countOf(query(usuariosRef)),
    countOf(query(usuariosRef, where("activo", "==", true))),
    countOf(query(empresasRef, where("fecha_creacion", ">=", hace30d))),
    countOf(query(usuariosRef, where("fecha_creacion", ">=", hace30d))),
    Promise.all(
      Object.entries(ROLE_ALIAS_GROUPS).map(async ([role, aliases]) => [
        role,
        await countOf(query(usuariosRef, where("rol", "in", aliases))),
      ])
    ),
  ]);
  const porRol = Object.fromEntries(porRolEntries);

  const [empresasSnap, paymentsSnap] = await Promise.all([
    getDocs(empresasRef),
    // El campo real en produccion es "confirmed" (coincide con confirmedAt), no "paid" -- el
    // codigo original (saPlatformStats, nunca desplegado) asumia "paid" y nunca se probo contra
    // datos reales; confirmado viendo los pagos reales en Pagos y Planes.
    getDocs(query(paymentsRef, where("status", "==", "confirmed"))),
  ]);

  const porPlan = {};
  empresasSnap.docs.forEach((entry) => {
    const data = entry.data();
    const plan = textValue(data.planActivo, textValue(data.plan, "Sin plan"));
    porPlan[plan] = (porPlan[plan] || 0) + 1;
  });

  let ingresosTotales = 0;
  let ingresos30d = 0;
  const hace30dMs = hace30d.toMillis();
  paymentsSnap.docs.forEach((entry) => {
    const data = entry.data();
    const amount = numberValue(data.amount);
    ingresosTotales += amount;
    const confirmedAt = data.confirmedAt?.toMillis ? data.confirmedAt.toMillis() : null;
    if (confirmedAt && confirmedAt >= hace30dMs) ingresos30d += amount;
  });

  return {
    empresasTotal,
    empresasActivas,
    empresasSuspendidas,
    empresasExpiradas,
    empresasBaneadas,
    usuariosTotal,
    usuariosActivos,
    porRol,
    porPlan,
    empresasNuevas30d,
    usuariosNuevos30d,
    ingresosTotales,
    ingresos30d,
  };
}

export function subscribePlatform(callback, onError) {
  const nextSnapshot = { empresas: [], pagos: [], auditoria: [], usuariosTotal: 0 };
  const publish = () => callback({ ...nextSnapshot });

  const unsubscribers = [
    onSnapshot(query(collection(db, "empresas"), limit(50)), (docs) => {
      nextSnapshot.empresas = docs.docs.map(mapEmpresa);
      publish();
    }, onError),
    onSnapshot(query(collection(db, "payments"), orderBy("confirmedAt", "desc"), limit(20)), (docs) => {
      nextSnapshot.pagos = docs.docs.map(mapPago);
      publish();
    }, onError),
    onSnapshot(query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(20)), (docs) => {
      nextSnapshot.auditoria = docs.docs.map(mapAudit);
      publish();
    }, onError),
  ];

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

// --- Empresas ---

function companyFilterConstraints(filtros) {
  if (filtros.estado === "activas") return [where("estado_activo", "==", true)];
  if (filtros.estado === "suspendidas") return [where("subscriptionStatus", "==", "grace_period")];
  if (filtros.estado === "expiradas") return [where("subscriptionStatus", "==", "expired")];
  if (filtros.estado === "baneadas") return [where("baneada", "==", true)];
  return [];
}

export function subscribeCompanies(filtros, limite, callback, onError) {
  const q = query(collection(db, "empresas"), ...companyFilterConstraints(filtros), limit(limite + 1));
  return onSnapshot(q, (snap) => {
    let docs = snap.docs;
    if (filtros.plan) docs = docs.filter((entry) => textValue(entry.data().planActivo, textValue(entry.data().plan)) === filtros.plan);
    const hayMas = docs.length > limite;
    const page = docs.slice(0, limite);
    callback({ items: page.map((entry) => mapEmpresaDetalle(entry)), cursor: page[page.length - 1] ?? null, hayMas });
  }, onError);
}

export async function loadMoreCompanies(filtros, limite, cursor) {
  const q = query(
    collection(db, "empresas"),
    ...companyFilterConstraints(filtros),
    ...(cursor ? [startAfter(cursor)] : []),
    limit(limite + 1)
  );
  const snap = await getDocs(q);
  let docs = snap.docs;
  if (filtros.plan) docs = docs.filter((entry) => textValue(entry.data().planActivo, textValue(entry.data().plan)) === filtros.plan);
  const hayMas = docs.length > limite;
  const page = docs.slice(0, limite);
  return { items: page.map((entry) => mapEmpresaDetalle(entry)), cursor: page[page.length - 1] ?? null, hayMas };
}

export function subscribeCompanyDetail(empresaId, callback, onError) {
  if (!empresaId) {
    callback({ empresa: null, usuarios: [], pagos: [] });
    return () => {};
  }

  const state = { empresa: null, usuarios: [], pagos: [] };
  let ownerNombre = "";
  let ownerCorreo = "";
  let empresaNombre = "";
  let adminId = "";
  const publish = () => callback({ ...state });

  const usersA = [];
  const usersB = [];
  const republishUsers = () => {
    const merged = mergeDualSchemaDocs([usersA, usersB]);
    state.usuarios = merged.map((entry) => mapUsuario(entry, empresaNombre, adminId));
    publish();
  };

  const unsubEmpresa = onSnapshot(doc(db, "empresas", empresaId), (snap) => {
    if (!snap.exists()) {
      state.empresa = null;
      publish();
      return;
    }
    const detalle = mapEmpresaDetalle(snap, state.usuarios.length);
    adminId = detalle.adminId;
    empresaNombre = detalle.nombre;
    state.empresa = { ...detalle, adminNombre: ownerNombre, adminCorreo: ownerCorreo };
    publish();
    if (adminId) {
      getDoc(doc(db, "usuarios", adminId)).then((ownerSnap) => {
        if (!ownerSnap.exists()) return;
        const ownerData = ownerSnap.data() || {};
        ownerNombre = textValue(ownerData.nombre);
        ownerCorreo = textValue(ownerData.correo, textValue(ownerData.email));
        if (state.empresa) state.empresa = { ...state.empresa, adminNombre: ownerNombre, adminCorreo: ownerCorreo };
        publish();
      }).catch(() => {});
    }
  }, onError);

  const unsubUsersA = onSnapshot(query(collection(db, "usuarios"), where("empresaId", "==", empresaId)), (snap) => {
    usersA.length = 0; usersA.push(...snap.docs); republishUsers();
  }, onError);
  const unsubUsersB = onSnapshot(query(collection(db, "usuarios"), where("empresa_id", "==", empresaId)), (snap) => {
    usersB.length = 0; usersB.push(...snap.docs); republishUsers();
  }, onError);

  const unsubPagos = onSnapshot(
    query(collection(db, "payments"), where("empresaId", "==", empresaId), orderBy("confirmedAt", "desc"), limit(20)),
    (snap) => { state.pagos = snap.docs.map(mapPago); publish(); },
    onError
  );

  return () => { unsubEmpresa(); unsubUsersA(); unsubUsersB(); unsubPagos(); };
}

export async function updateCompanyProfile(empresaId, patch) {
  const fieldMap = { nombre: "nombre", giro: "giro", tamanoEquipo: "tamanoEquipo", codigo: "codigo" };
  const data = {};
  Object.entries(patch).forEach(([key, value]) => {
    const targetKey = fieldMap[key];
    if (targetKey && value !== undefined) data[targetKey] = value;
  });
  if (Object.keys(data).length === 0) return;
  data.planUpdatedAt = serverTimestamp();
  await updateDoc(doc(db, "empresas", empresaId), data);
}

const logAudit = async (accion, actor, { empresaId, targetId, estado = "Success", detalles }) =>
  addDoc(collection(db, "audit_logs"), {
    empresaId: empresaId ?? null,
    empresa_id: empresaId ?? null,
    usuarioId: actor.id,
    usuario_id: actor.id,
    usuarioNombre: actor.nombre,
    rol: actor.rol || "super_admin",
    accion,
    modulo: "Super Admin",
    detalles,
    estado,
    targetId,
    timestamp: new Date().toISOString(),
  });

export async function applyCompanyAction(companyId, action, actor) {
  if (action === "banear" || action === "desbanear") {
    await setCompanyBan(companyId, action === "banear", actor);
    return;
  }
  const common = { planUpdatedAt: serverTimestamp(), updatedBySuperAdmin: actor.id };
  const patch = action === "reactivar_business"
    ? {
        ...common, plan: "Business", planActivo: "Business", planBilling: "monthly",
        planCancelAtPeriodEnd: false, planDataDeletionAt: null,
        planExpiresAt: Timestamp.fromDate(expirationDate()), planPaymentStatus: "paid",
        subscriptionStatus: "active", subscriptionSuspended: false, estado_activo: true,
      }
    : action === "suspender"
      ? { ...common, planPaymentStatus: "grace_period", subscriptionStatus: "grace_period", subscriptionSuspended: true, estado_activo: false }
      : { ...common, planPaymentStatus: "expired", subscriptionStatus: "expired", subscriptionSuspended: true, estado_activo: false };

  await updateDoc(doc(db, "empresas", companyId), patch);
  await addDoc(collection(db, "audit_logs"), {
    empresaId: companyId,
    empresa_id: companyId,
    usuarioId: actor.id,
    usuario_id: actor.id,
    usuarioNombre: actor.nombre,
    rol: actor.rol || "super_admin",
    accion: `Super Admin empresa ${action}`,
    modulo: "Super Admin",
    detalles: `Empresa ${companyId}`,
    estado: action === "reactivar_business" ? "Success" : "Warning",
    targetId: companyId,
    timestamp: new Date().toISOString(),
  });
}

// Impersonar a otro usuario exige firmar un custom token PARA ESE UID, algo que solo puede hacer
// una cuenta de servicio (Admin SDK). No hay manera segura de lograrlo solo con el SDK de
// cliente, con o sin Blaze de por medio de otra forma; esta es la unica accion que de verdad se
// queda bloqueada.
export const startSupportSession = () => requiresBlaze();

// Ban "de datos": no deshabilita la cuenta de Firebase Auth (eso si requiere Admin SDK), pero
// bloquea la empresa y sus usuarios a nivel Firestore, que es lo que la app y las reglas de
// seguridad realmente consultan para autorizar cualquier lectura/escritura.
export async function setCompanyBan(empresaId, banned, actor) {
  await updateDoc(doc(db, "empresas", empresaId), {
    baneada: banned,
    estado_activo: !banned,
    planUpdatedAt: serverTimestamp(),
  });
  const usuarios = await getDocs(query(collection(db, "usuarios"), where("empresaId", "==", empresaId)));
  const usuariosB = await getDocs(query(collection(db, "usuarios"), where("empresa_id", "==", empresaId)));
  const merged = new Map();
  [...usuarios.docs, ...usuariosB.docs].forEach((entry) => merged.set(entry.id, entry));
  await Promise.all(
    [...merged.values()].map((entry) => updateDoc(entry.ref, { baneado: banned, activo: !banned }))
  );
  if (actor) {
    await logAudit(`Super Admin empresa ${banned ? "baneada" : "desbaneada"}`, actor, {
      empresaId,
      targetId: empresaId,
      estado: banned ? "Warning" : "Success",
      detalles: `${merged.size} usuario(s) afectados`,
    });
  }
  return { usuariosAfectados: merged.size };
}

// Delete real del documento en Firestore (las reglas ya permiten esSuperAdmin() -> delete). La
// cuenta de Firebase Auth del propietario y colecciones secundarias (pagos, auditoria...) no se
// tocan aqui -- limpiarlas de verdad necesita Admin SDK -- pero para la app la empresa desaparece:
// ya no hay doc que leer, ya no aparece en ningun listado ni chequeo de acceso.
export async function deleteCompany(empresaId, confirmName, actor) {
  const snap = await getDoc(doc(db, "empresas", empresaId));
  if (!snap.exists()) throw new Error("Esa empresa ya no existe.");
  const nombre = snap.data()?.nombre || "";
  if (confirmName.trim() !== nombre.trim()) {
    throw new Error(`Escribe exactamente "${nombre}" para confirmar la eliminación.`);
  }
  const usuarios = await getDocs(query(collection(db, "usuarios"), where("empresaId", "==", empresaId)));
  const usuariosB = await getDocs(query(collection(db, "usuarios"), where("empresa_id", "==", empresaId)));
  const merged = new Map();
  [...usuarios.docs, ...usuariosB.docs].forEach((entry) => merged.set(entry.id, entry));
  await Promise.all([...merged.values()].map((entry) => deleteDoc(entry.ref)));
  await deleteDoc(doc(db, "empresas", empresaId));
  if (actor) {
    await logAudit("Super Admin eliminó empresa", actor, {
      empresaId,
      targetId: empresaId,
      estado: "Warning",
      detalles: `${nombre} — ${merged.size} usuario(s) eliminados`,
    });
  }
  return { usuariosEliminados: merged.size };
}

// Crea la cuenta de Firebase Auth del dueño en una app secundaria (para no cerrar la sesión del
// super admin, que es lo que pasaría si se usara la app principal) y luego escribe empresas/
// usuarios desde el cliente ya autenticado como super admin -- las reglas ya permiten ambas
// escrituras para esSuperAdmin().
export async function createCompany(payload, actor) {
  const { nombreEmpresa, nombreAdmin, correoAdmin, contrasenaAdmin, giroActividad, tamanoEquipo, plan } = payload;
  if (!nombreEmpresa || !nombreAdmin || !correoAdmin || !contrasenaAdmin) {
    throw new Error("Empresa, administrador, correo y contraseña son obligatorios.");
  }
  const secondaryAuth = getAuth(getSecondaryApp());
  const credencial = await createUserWithEmailAndPassword(secondaryAuth, correoAdmin.trim().toLowerCase(), contrasenaAdmin);
  const adminUid = credencial.user.uid;
  await signOut(secondaryAuth);

  const empresaRef = doc(collection(db, "empresas"));
  const ahoraIso = new Date().toISOString();
  await setDoc(empresaRef, {
    id: empresaRef.id,
    nombre: nombreEmpresa.trim(),
    nombre_normalizado: nombreEmpresa.trim().toLowerCase(),
    giro: giroActividad || "",
    tamanoEquipo: tamanoEquipo || "",
    adminId: adminUid,
    adminUid,
    plan: plan || "Starter",
    planActivo: plan || "Starter",
    estado_activo: true,
    subscriptionStatus: "active",
    fecha_creacion: ahoraIso,
    createdAt: serverTimestamp(),
    createdBySuperAdmin: actor?.id || null,
  });
  await setDoc(doc(db, "usuarios", adminUid), {
    id: adminUid,
    nombre: nombreAdmin.trim(),
    correo: correoAdmin.trim().toLowerCase(),
    empresaId: empresaRef.id,
    empresa_id: empresaRef.id,
    empresaNombre: nombreEmpresa.trim(),
    rol: "admin_empresa",
    activo: true,
    estado_activo: true,
    fecha_creacion: ahoraIso,
  });
  if (actor) {
    await logAudit("Super Admin creó empresa", actor, {
      empresaId: empresaRef.id,
      targetId: empresaRef.id,
      detalles: `${nombreEmpresa} (dueño: ${correoAdmin})`,
    });
  }
  return { empresaId: empresaRef.id, adminUid, codigo: empresaRef.id.slice(0, 8) };
}

// --- Usuarios de plataforma ---

export function subscribeUsers(filtros, limite, callback, onError) {
  if (filtros.empresaId) {
    const docsA = [];
    const docsB = [];
    const publish = () => {
      let merged = mergeDualSchemaDocs([docsA, docsB]).map((entry) => mapUsuario(entry));
      merged = applyUserClientFilters(merged, filtros);
      callback({ items: merged.slice(0, limite), cursor: null, hayMas: merged.length > limite });
    };
    const unsubA = onSnapshot(query(collection(db, "usuarios"), where("empresaId", "==", filtros.empresaId)), (snap) => {
      docsA.length = 0; docsA.push(...snap.docs); publish();
    }, onError);
    const unsubB = onSnapshot(query(collection(db, "usuarios"), where("empresa_id", "==", filtros.empresaId)), (snap) => {
      docsB.length = 0; docsB.push(...snap.docs); publish();
    }, onError);
    return () => { unsubA(); unsubB(); };
  }

  const constraints = filtros.rol && ROLE_ALIAS_GROUPS[filtros.rol] ? [where("rol", "in", ROLE_ALIAS_GROUPS[filtros.rol])] : [];
  const q = query(collection(db, "usuarios"), ...constraints, orderBy("nombre"), limit(limite + 1));
  return onSnapshot(q, (snap) => {
    let docs = snap.docs;
    const hayMasCruda = docs.length > limite;
    docs = docs.slice(0, limite);
    let items = docs.map((entry) => mapUsuario(entry));
    items = applyUserClientFilters(items, filtros);
    callback({ items, cursor: docs[docs.length - 1] ?? null, hayMas: hayMasCruda });
  }, onError);
}

export async function loadMoreUsers(filtros, limite, cursor) {
  if (filtros.empresaId) return { items: [], cursor: null, hayMas: false };
  const constraints = filtros.rol && ROLE_ALIAS_GROUPS[filtros.rol] ? [where("rol", "in", ROLE_ALIAS_GROUPS[filtros.rol])] : [];
  const q = query(
    collection(db, "usuarios"),
    ...constraints,
    orderBy("nombre"),
    ...(cursor ? [startAfter(cursor)] : []),
    limit(limite + 1)
  );
  const snap = await getDocs(q);
  const hayMas = snap.docs.length > limite;
  const docs = snap.docs.slice(0, limite);
  let items = docs.map((entry) => mapUsuario(entry));
  items = applyUserClientFilters(items, filtros);
  return { items, cursor: docs[docs.length - 1] ?? null, hayMas };
}

// Reglas: allow update: esSuperAdmin() sin restriccion de campos (aparte de no meter password en
// claro y no auto-ascenderse a super_admin, que no aplica aqui). Update real, directo.
const USER_PATCH_FIELDS = ["nombre", "correo", "telefono", "departamento", "cargo", "sede", "rol"];
export async function updateUser(userId, patch) {
  const data = {};
  USER_PATCH_FIELDS.forEach((key) => {
    if (patch[key] !== undefined && patch[key] !== "") data[key] = patch[key];
  });
  if (Object.keys(data).length === 0) return;
  await updateDoc(doc(db, "usuarios", userId), data);
}

export async function setUserBan(userId, banned) {
  await updateDoc(doc(db, "usuarios", userId), { baneado: banned, activo: !banned });
}

// Delete real del doc (reglas: allow delete: esSuperAdmin()). La cuenta de Firebase Auth de esa
// persona sigue existiendo hasta que haya Blaze para limpiarla, pero sin doc en `usuarios` no
// tiene rol/empresa/acceso: para la app, ya no existe.
export async function deleteUser(userId) {
  await deleteDoc(doc(db, "usuarios", userId));
}

// Sin Admin SDK no se puede fijar la contraseña de OTRA cuenta directamente; el equivalente real
// de cliente es mandar el correo de restablecimiento de Firebase, que el usuario abre el mismo.
export async function resetPassword(correo) {
  if (!correo) throw new Error("Este usuario no tiene correo registrado.");
  await sendPasswordResetEmail(auth, correo);
  return { emailEnviado: true };
}

// Mismo patron que createCompany: cuenta de Auth en la app secundaria (no toca la sesion del
// super admin), doc de Firestore desde el cliente principal.
export async function createUser(payload) {
  const { empresaId, nombre, correo, contrasena, rol } = payload;
  if (!empresaId || !nombre || !correo || !contrasena) {
    throw new Error("Empresa, nombre, correo y contraseña son obligatorios.");
  }
  const secondaryAuth = getAuth(getSecondaryApp());
  const credencial = await createUserWithEmailAndPassword(secondaryAuth, correo.trim().toLowerCase(), contrasena);
  const uid = credencial.user.uid;
  await signOut(secondaryAuth);

  const empresaSnap = await getDoc(doc(db, "empresas", empresaId));
  const empresaNombre = empresaSnap.exists() ? empresaSnap.data()?.nombre || "" : "";

  await setDoc(doc(db, "usuarios", uid), {
    id: uid,
    nombre: nombre.trim(),
    correo: correo.trim().toLowerCase(),
    empresaId,
    empresa_id: empresaId,
    empresaNombre,
    rol: rol || "empleado",
    activo: true,
    estado_activo: true,
    fecha_creacion: new Date().toISOString(),
  });
  return { uid };
}

// --- Auditoria global ---

export function subscribeAuditGlobal(limite, callback, onError) {
  const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(limite + 1));
  return onSnapshot(q, (snap) => {
    const hayMas = snap.docs.length > limite;
    const docs = snap.docs.slice(0, limite);
    callback({ items: docs.map(mapAudit), cursor: docs[docs.length - 1] ?? null, hayMas });
  }, onError);
}

export async function loadMoreAuditGlobal(limite, cursor) {
  const q = query(
    collection(db, "audit_logs"), orderBy("timestamp", "desc"),
    ...(cursor ? [startAfter(cursor)] : []), limit(limite + 1)
  );
  const snap = await getDocs(q);
  const hayMas = snap.docs.length > limite;
  const docs = snap.docs.slice(0, limite);
  return { items: docs.map(mapAudit), cursor: docs[docs.length - 1] ?? null, hayMas };
}

// --- Pagos ---

export function subscribePayments(limite, callback, onError) {
  const q = query(collection(db, "payments"), orderBy("confirmedAt", "desc"), limit(limite + 1));
  return onSnapshot(q, (snap) => {
    const hayMas = snap.docs.length > limite;
    const docs = snap.docs.slice(0, limite);
    callback({ items: docs.map(mapPago), cursor: docs[docs.length - 1] ?? null, hayMas });
  }, onError);
}

// --- Nexxus IA ---

// Eventos crudos (por consulta), escritos directo por askNexxusAI. A diferencia de
// ai_usage_daily (que depende de la Cloud Function programada rollupAiUsageDaily, nunca
// desplegada sin Blaze y por tanto siempre vacia), esta coleccion se llena en cada consulta
// real, asi que es la fuente que hay que usar mientras el proyecto no tenga Blaze.
export function subscribeAiUsage(desde, limite, callback, onError) {
  const q = query(
    collection(db, "ai_usage"),
    where("createdAt", ">=", Timestamp.fromDate(desde)),
    orderBy("createdAt", "desc"),
    limit(limite)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((entry) => {
      const data = entry.data();
      return {
        id: entry.id,
        empresaId: textValue(data.empresaId) || null,
        empresaNombre: textValue(data.empresaNombre),
        userId: textValue(data.userId),
        rol: textValue(data.rol),
        tool: textValue(data.tool),
        provider: textValue(data.provider),
        model: textValue(data.model) || null,
        status: textValue(data.status),
        inputTokens: typeof data.inputTokens === "number" ? data.inputTokens : null,
        outputTokens: typeof data.outputTokens === "number" ? data.outputTokens : null,
        totalTokens: typeof data.totalTokens === "number" ? data.totalTokens : null,
        costUsd: typeof data.costUsd === "number" ? data.costUsd : null,
        createdAt: isoDate(data.createdAt),
      };
    }));
  }, onError);
}

export function subscribeAiUsageDaily(desde, callback, onError) {
  const q = query(collection(db, "ai_usage_daily"), where("dia", ">=", desde), orderBy("dia", "desc"), limit(400));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((entry) => {
      const data = entry.data();
      return {
        id: entry.id,
        dia: textValue(data.dia),
        empresaId: textValue(data.empresaId) || null,
        empresaNombre: textValue(data.empresaNombre),
        requests: numberValue(data.requests),
        inputTokens: numberValue(data.inputTokens),
        outputTokens: numberValue(data.outputTokens),
        totalTokens: numberValue(data.totalTokens),
        costUsd: numberValue(data.costUsd),
        porModelo: data.porModelo && typeof data.porModelo === "object" ? data.porModelo : {},
      };
    }));
  }, onError);
}

// --- Soporte ---

export function subscribeSupportSessions(callback, onError) {
  const q = query(collection(db, "support_sessions"), orderBy("createdAt", "desc"), limit(50));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((entry) => {
      const data = entry.data();
      return {
        id: entry.id,
        empresaId: textValue(data.empresaId),
        targetUserId: textValue(data.targetUserId),
        targetEmail: textValue(data.targetEmail),
        targetRole: textValue(data.targetRole),
        actorId: textValue(data.actorId),
        actorName: textValue(data.actorName),
        status: textValue(data.status, "active"),
        expiresAt: isoDate(data.expiresAt),
        createdAt: isoDate(data.createdAt),
      };
    }));
  }, onError);
}
