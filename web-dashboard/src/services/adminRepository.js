import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  limit as fsLimit,
} from "firebase/firestore";
import { db } from "firebaseClient/firebaseConfig";

// Lecturas en tiempo real para el panel de Admin (propietario de una empresa). A diferencia de
// superAdminRepository.js (que cruza toda la plataforma), aqui TODO va acotado a empresaId --
// ese es el limite de seguridad real, reforzado ademas por las reglas de Firestore
// (puedeLeerTenant/mismaEmpresa: exige que el usuario autenticado pertenezca a esa empresa,
// salvo que sea super_admin). Puerto de las queries documentadas en
// nexxus/app/src/presentation/screens/admin/**.
//
// Cada pantalla (empresa-*) importa de aqui las suscripciones que necesita y maneja sus propias
// escrituras directamente con firebase/firestore + `db` de este mismo archivo, para no convertir
// esto en un unico archivo gigante de 2000 lineas.

export { db };

const scoped = (col, empresaId, ...extra) =>
  query(collection(db, col), where("empresaId", "==", empresaId), ...extra);

export function subscribeEmpleados(empresaId, callback, onError) {
  return onSnapshot(scoped("usuarios", empresaId), (snap) => callback(snap.docs), onError);
}

export function subscribeTareas(empresaId, callback, onError) {
  return onSnapshot(scoped("tareas", empresaId), (snap) => callback(snap.docs), onError);
}

// checkins usa dos convenciones de campo (empresaId / empresa_id) segun cuando se creo el doc;
// se fusionan por id igual que en subscribeCompanyDetail de superAdminRepository.
export function subscribeCheckIns(empresaId, callback, onError) {
  const a = [];
  const b = [];
  const publish = () => {
    const map = new Map();
    [...a, ...b].forEach((entry) => map.set(entry.id, entry));
    callback([...map.values()]);
  };
  const unsubA = onSnapshot(scoped("checkins", empresaId), (snap) => {
    a.length = 0;
    a.push(...snap.docs);
    publish();
  }, onError);
  const unsubB = onSnapshot(
    query(collection(db, "checkins"), where("empresa_id", "==", empresaId)),
    (snap) => {
      b.length = 0;
      b.push(...snap.docs);
      publish();
    },
    onError
  );
  return () => {
    unsubA();
    unsubB();
  };
}

export function subscribeAuditLogs(empresaId, callback, onError, limite = 150) {
  return onSnapshot(
    scoped("audit_logs", empresaId, orderBy("timestamp", "desc"), fsLimit(limite)),
    (snap) => callback(snap.docs),
    onError
  );
}

export function subscribeSolicitudesAusencia(empresaId, callback, onError) {
  return onSnapshot(
    scoped("solicitudes_ausencia", empresaId, orderBy("fecha_solicitud", "desc"), fsLimit(200)),
    (snap) => callback(snap.docs),
    onError
  );
}

export function subscribeSolicitudesInternas(empresaId, callback, onError) {
  return onSnapshot(
    scoped("solicitudes_internas", empresaId, orderBy("timestamp", "desc"), fsLimit(200)),
    (snap) => callback(snap.docs),
    onError
  );
}

export function subscribeReportes(empresaId, callback, onError) {
  return onSnapshot(
    scoped("reportes", empresaId, orderBy("fecha", "desc"), fsLimit(200)),
    (snap) => callback(snap.docs),
    onError
  );
}

export function subscribeNotificaciones(empresaId, callback, onError) {
  return onSnapshot(scoped("notificaciones", empresaId, fsLimit(500)), (snap) => callback(snap.docs), onError);
}

export function subscribeAsistenciasHoy(empresaId, fechaJornada, callback, onError, limite = 1000) {
  return onSnapshot(
    scoped("asistencias", empresaId, where("fechaJornada", "==", fechaJornada), orderBy("timestamp", "asc"), fsLimit(limite)),
    (snap) => callback(snap.docs),
    onError
  );
}

export function subscribeFeedbacks(empresaId, callback, onError) {
  return onSnapshot(scoped("feedbacks", empresaId, fsLimit(300)), (snap) => callback(snap.docs), onError);
}

export function subscribeInboxUnificado(empresaId, callback, onError) {
  return onSnapshot(scoped("inbox_unificado", empresaId, fsLimit(300)), (snap) => callback(snap.docs), onError);
}

export function subscribeDocumentos(empresaId, callback, onError) {
  return onSnapshot(
    scoped("documentos", empresaId, orderBy("fechaSubida", "desc"), fsLimit(300)),
    (snap) => callback(snap.docs),
    onError
  );
}

export function subscribeCalendario(empresaId, callback, onError) {
  return onSnapshot(
    scoped("calendario_empresarial", empresaId, orderBy("inicio", "asc"), fsLimit(500)),
    (snap) => callback(snap.docs),
    onError
  );
}

export function subscribePayments(empresaId, callback, onError) {
  return onSnapshot(scoped("payments", empresaId, fsLimit(500)), (snap) => callback(snap.docs), onError);
}

export function subscribeNominas(empresaId, periodo, callback, onError) {
  return onSnapshot(
    scoped("nominas", empresaId, where("periodo", "==", periodo), fsLimit(500)),
    (snap) => callback(snap.docs),
    onError
  );
}

export function subscribeDepartamentos(empresaId, callback, onError) {
  return onSnapshot(scoped("departments", empresaId), (snap) => callback(snap.docs), onError);
}

export function subscribeSedes(empresaId, callback, onError) {
  return onSnapshot(scoped("sedes", empresaId), (snap) => callback(snap.docs), onError);
}

export function subscribeCargos(empresaId, callback, onError) {
  return onSnapshot(scoped("cargos", empresaId), (snap) => callback(snap.docs), onError);
}

export function subscribeRolesPersonalizados(empresaId, callback, onError) {
  return onSnapshot(scoped("roles_personalizados", empresaId), (snap) => callback(snap.docs), onError);
}

export function subscribeInventario(empresaId, callback, onError) {
  return onSnapshot(
    scoped("inventario_activos", empresaId, orderBy("fechaActualizacion", "desc"), fsLimit(500)),
    (snap) => callback(snap.docs),
    onError
  );
}

export function subscribeIncidencias(empresaId, callback, onError) {
  return onSnapshot(
    scoped("incidencias", empresaId, orderBy("fechaCreacion", "desc"), fsLimit(300)),
    (snap) => callback(snap.docs),
    onError
  );
}

export function subscribeAnnouncements(empresaId, callback, onError) {
  return onSnapshot(
    scoped("announcements", empresaId, orderBy("fecha", "desc"), fsLimit(100)),
    (snap) => callback(snap.docs),
    onError
  );
}

// Doc unico (no coleccion), lectura en vivo por si la generan/editan desde otra pantalla.
export function subscribeConfiguracionEmpresa(empresaId, callback, onError) {
  return onSnapshot(doc(db, "configuraciones_empresa", empresaId), (snap) => callback(snap), onError);
}
