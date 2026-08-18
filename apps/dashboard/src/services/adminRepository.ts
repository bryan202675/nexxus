import { supabase } from "supabaseClient/supabaseConfig";

// Lecturas en tiempo real para el panel de Admin (propietario de una empresa).
// Puerto de Firestore a Supabase -- se conserva el MISMO contrato de retorno
// que antes (arrays de objetos "tipo docSnap" con .id y .data()) para no
// tener que reescribir los ~20 archivos de vista que consumen estas
// funciones con `docs.map(d => ({ id: d.id, ...d.data() }))`.
//
// Nota: la duplicidad empresaId/empresa_id de Firestore ya no existe -- el
// esquema de Supabase (Fase 0) normaliza todo a una sola columna empresa_id,
// asi que subscribeCheckIns ya no necesita fusionar dos listeners.

// exists() se conserva porque algunas vistas (ej. empresa-asistencia) todavia siguen el
// contrato de Firestore (snap.exists() ? snap.data() : null) heredado de antes de la
// Fase 0 -- sin este metodo, un docSnap "encontrado" (a diferencia del branch explicito
// de "no encontrado" en subscribeConfiguracionEmpresa) revienta con "snap.exists is not
// a function" en cuanto la fila sí existe.
const asDocSnap = (row: any) => ({ id: row.id, data: () => row, exists: () => true });

type SubscribeTableOptions = {
  orderColumn?: string;
  ascending?: boolean;
  limit?: number;
  extraFilter?: (query: any) => any;
};

// Fetch puntual (sin suscripcion), misma forma de retorno que subscribeTable. Se usa como
// refresco manual inmediato despues de crear/editar/eliminar, en vez de depender solo del
// canal de Realtime -- si Realtime no esta habilitado para la tabla en el proyecto de
// Supabase (Database > Replication) o llega con retraso, la lista se quedaba desactualizada
// hasta recargar la pagina o remontar la pantalla.
export async function fetchTableOnce(table: string, empresaId: string, { orderColumn, ascending = true, limit, extraFilter }: SubscribeTableOptions = {}) {
  let q = supabase.from(table).select("*").eq("empresa_id", empresaId);
  if (extraFilter) q = extraFilter(q);
  if (orderColumn) q = q.order(orderColumn, { ascending });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(asDocSnap);
}

function subscribeTable(table: string, empresaId: string, options: SubscribeTableOptions = {}) {
  const { orderColumn, ascending = true, limit, extraFilter } = options;
  return (callback, onError) => {
    let active = true;
    const fetchDocs = () => fetchTableOnce(table, empresaId, { orderColumn, ascending, limit, extraFilter });
    const run = () => {
      fetchDocs()
        .then((docs) => active && callback(docs))
        .catch((err) => active && onError && onError(err));
    };
    run();
    const channel = supabase
      .channel(`admin:${table}:${empresaId}:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table, filter: `empresa_id=eq.${empresaId}` }, run)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  };
}

export function subscribeEmpleados(empresaId, callback, onError) {
  return subscribeTable("usuarios", empresaId)(callback, onError);
}

export function subscribeTareas(empresaId, callback, onError) {
  return subscribeTable("tareas", empresaId)(callback, onError);
}

export function subscribeCheckIns(empresaId, callback, onError) {
  return subscribeTable("checkins", empresaId)(callback, onError);
}

export function subscribeAuditLogs(empresaId, callback, onError, limite = 150) {
  return subscribeTable("audit_logs", empresaId, { orderColumn: "created_at", ascending: false, limit: limite })(callback, onError);
}

export function subscribeSolicitudesAusencia(empresaId, callback, onError) {
  return subscribeTable("solicitudes_ausencia", empresaId, { orderColumn: "created_at", ascending: false, limit: 200 })(callback, onError);
}

export function subscribeSolicitudesInternas(empresaId, callback, onError) {
  return subscribeTable("solicitudes_internas", empresaId, { orderColumn: "created_at", ascending: false, limit: 200 })(callback, onError);
}

export function subscribeSolicitudesExtensionTarea(empresaId, callback, onError) {
  return subscribeTable("solicitudes_extension_tarea", empresaId, { orderColumn: "created_at", ascending: false, limit: 200 })(callback, onError);
}

export function subscribeReportes(empresaId, callback, onError) {
  return subscribeTable("reportes", empresaId, { orderColumn: "created_at", ascending: false, limit: 200 })(callback, onError);
}

export function subscribeNotificaciones(empresaId, callback, onError) {
  return subscribeTable("notificaciones", empresaId, { limit: 500 })(callback, onError);
}

// Solo las alertas de bienestar (tipo='bienestar') -- fuente compartida del timbre de
// la navbar y del badge del sidebar en TeamCareAlertsContext. RLS ya restringe estas
// filas a es_jefe() o al propio empleado (ver migracion cuidado_equipo_bienestar).
export function subscribeAlertasBienestar(empresaId, callback, onError, limite = 300) {
  return subscribeTable("notificaciones", empresaId, {
    orderColumn: "created_at",
    ascending: false,
    limit: limite,
    extraFilter: (q) => q.eq("tipo", "bienestar"),
  })(callback, onError);
}

export function subscribeAsistencias(empresaId: string, callback: any, onError: any, limite = 1000) {
  return subscribeTable("asistencias", empresaId, {
    orderColumn: "created_at",
    ascending: false,
    limit: limite,
  })(callback, onError);
}

export function subscribeAsistenciasHoy(empresaId: string, fechaJornada: string, callback: any, onError: any, limite = 1000) {
  return subscribeTable("asistencias", empresaId, {
    orderColumn: "created_at",
    ascending: true,
    limit: limite,
    extraFilter: (q) => q.eq("fecha_jornada", fechaJornada),
  })(callback, onError);
}

export function subscribeFeedbacks(empresaId, callback, onError) {
  return subscribeTable("feedbacks", empresaId, { limit: 300 })(callback, onError);
}

export function subscribeInboxUnificado(empresaId, callback, onError) {
  return subscribeTable("inbox_unificado", empresaId, { limit: 300 })(callback, onError);
}

export function subscribeDocumentos(empresaId, callback, onError) {
  return subscribeTable("documentos", empresaId, { orderColumn: "created_at", ascending: false, limit: 300 })(callback, onError);
}

export function subscribeCalendario(empresaId, callback, onError) {
  return subscribeTable("calendario_empresarial", empresaId, { orderColumn: "fecha_inicio", ascending: true, limit: 500 })(callback, onError);
}

export function subscribePayments(empresaId, callback, onError) {
  return subscribeTable("payments", empresaId, { limit: 500 })(callback, onError);
}

export function subscribeNominas(empresaId, periodo, callback, onError) {
  return subscribeTable("nominas", empresaId, { limit: 500, extraFilter: (q) => q.eq("periodo", periodo) })(callback, onError);
}

export function subscribeDepartamentos(empresaId, callback, onError) {
  return subscribeTable("departamentos", empresaId)(callback, onError);
}

export function subscribeSedes(empresaId, callback, onError) {
  return subscribeTable("sedes", empresaId)(callback, onError);
}

export function subscribeCargos(empresaId, callback, onError) {
  return subscribeTable("cargos", empresaId)(callback, onError);
}

export function subscribeRolesPersonalizados(empresaId, callback, onError) {
  return subscribeTable("roles_personalizados", empresaId)(callback, onError);
}

export function subscribeInventario(empresaId, callback, onError) {
  return subscribeTable("inventario_activos", empresaId, { orderColumn: "created_at", ascending: false, limit: 500 })(callback, onError);
}

export function subscribeIncidencias(empresaId, callback, onError) {
  return subscribeTable("incidencias", empresaId, { orderColumn: "created_at", ascending: false, limit: 300 })(callback, onError);
}

// "announcements" (Firestore) y "anuncios" quedaron consolidados en una sola
// tabla (anuncios) en la Fase 0 -- ya no hace falta la coleccion duplicada.
export function subscribeAnnouncements(empresaId, callback, onError) {
  return subscribeTable("anuncios", empresaId, { orderColumn: "created_at", ascending: false, limit: 100 })(callback, onError);
}

// Fila unica (no tabla completa): lectura en vivo por si la generan/editan desde otra pantalla.
export function subscribeConfiguracionEmpresa(empresaId, callback, onError) {
  let active = true;
  const run = async () => {
    try {
      const { data, error } = await supabase.from("configuraciones_empresa").select("*").eq("empresa_id", empresaId).maybeSingle();
      if (error) throw error;
      if (active) callback(data ? asDocSnap({ id: empresaId, ...data }) : { id: empresaId, exists: () => false, data: () => undefined });
    } catch (err) {
      if (active && onError) onError(err);
    }
  };
  run();
  const channel = supabase
    .channel(`admin:configuraciones_empresa:${empresaId}:${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "configuraciones_empresa", filter: `empresa_id=eq.${empresaId}` }, run)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}
