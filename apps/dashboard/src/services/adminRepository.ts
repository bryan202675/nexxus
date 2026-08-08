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

const asDocSnap = (row: any) => ({ id: row.id, data: () => row });

type SubscribeTableOptions = {
  orderColumn?: string;
  ascending?: boolean;
  limit?: number;
  extraFilter?: (query: any) => any;
};

function subscribeTable(table: string, empresaId: string, { orderColumn, ascending = true, limit, extraFilter }: SubscribeTableOptions = {}) {
  return (callback, onError) => {
    let active = true;
    const fetchDocs = async () => {
      let q = supabase.from(table).select("*").eq("empresa_id", empresaId);
      if (extraFilter) q = extraFilter(q);
      if (orderColumn) q = q.order(orderColumn, { ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(asDocSnap);
    };
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

export function subscribeReportes(empresaId, callback, onError) {
  return subscribeTable("reportes", empresaId, { orderColumn: "created_at", ascending: false, limit: 200 })(callback, onError);
}

export function subscribeNotificaciones(empresaId, callback, onError) {
  return subscribeTable("notificaciones", empresaId, { limit: 500 })(callback, onError);
}

export function subscribeAsistenciasHoy(empresaId, fechaJornada, callback, onError, limite = 1000) {
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
