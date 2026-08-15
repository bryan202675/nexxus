import { useEffect, useMemo, useState } from "react";
import NexxusCard from "views/nexxus/components/NexxusCard";
import { useAuth } from "context/AuthContext";
import { supabase } from "supabaseClient/supabaseConfig";

const TABLES = ["tareas", "asistencias", "solicitudes_ausencia", "solicitudes_internas", "checkins", "documentos", "payments", "citas", "notificaciones", "feedbacks", "tickets", "audit_logs"];
const labels = { tareas: "Tarea", asistencias: "Asistencia", solicitudes_ausencia: "Ausencia", solicitudes_internas: "Solicitud interna", checkins: "Bienestar", documentos: "Documento", payments: "Nómina", citas: "Cita", notificaciones: "Notificación", feedbacks: "Feedback", tickets: "Ticket", audit_logs: "Auditoría" };
const USER_FILTER_FIELD = { asistencias: "usuario_id", checkins: "usuario_id", solicitudes_ausencia: "usuario_id", solicitudes_internas: "usuario_id", documentos: "usuario_id", payments: "usuario_id", citas: "usuario_id", notificaciones: "usuario_id", feedbacks: "usuario_id", tickets: "creado_por", audit_logs: "actor_id", tareas: "asignado_a" };

function titleFor(table: string, row: any) {
  if (table === "audit_logs") return `${row.accion || "Acción"} · ${row.modulo || "Sistema"}`;
  if (table === "tickets") return row.titulo || "Ticket de soporte";
  return row.titulo || row.tipo || row.nombre || row.categoria || labels[table];
}

export default function WorkspaceHistory() {
  const { empresaId, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("todos");
  useEffect(() => {
    if (!empresaId || !user?.id) return undefined;
    let active = true;
    const load = async () => {
      const results = await Promise.all(TABLES.map(async (table) => {
        const filter = USER_FILTER_FIELD[table] || "usuario_id";
        const { data } = await supabase.from(table).select("*").eq("empresa_id", empresaId).eq(filter, user.id).order("created_at", { ascending: false }).limit(50);
        return (data || []).map((row) => ({ id: `${table}-${row.id}`, table, type: labels[table], title: titleFor(table, row), status: row.estado || row.datos?.estado || (row.leida === false ? "pendiente" : "registrado"), date: row.created_at || row.fecha_inicio || row.fecha, detail: row.detalles || row.descripcion || row.cuerpo || row.motivo || "" }));
      }));
      if (active) { setEvents(results.flat().sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())); setLoading(false); }
    };
    setLoading(true); load();
    return () => { active = false; };
  }, [empresaId, user?.id]);
  const metrics = useMemo(() => ({ total: events.length, pending: events.filter((event) => ["pendiente", "abierto", "en_progreso"].includes(event.status)).length }), [events]);
  const tiposDisponibles = useMemo(() => Array.from(new Set(events.map((event) => event.type))), [events]);
  const eventosFiltrados = useMemo(() => typeFilter === "todos" ? events : events.filter((event) => event.type === typeFilter), [events, typeFilter]);
  return <div className="flex flex-col gap-6">
    <div><h2 className="text-2xl font-bold text-navy-700 dark:text-white">Historial completo</h2><p className="mt-1 text-sm text-gray-500 dark:text-white/60">Actividad real de tareas, asistencia, bienestar, solicitudes, nómina, tickets y auditoría.</p></div>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3"><Stat label="Eventos" value={metrics.total} /><Stat label="Pendientes" value={metrics.pending} /><Stat label="Última actualización" value={events[0]?.date ? new Date(events[0].date).toLocaleDateString("es-SV") : "—"} /></div>
    {tiposDisponibles.length > 1 ? <div className="flex flex-wrap gap-2"><button onClick={() => setTypeFilter("todos")} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${typeFilter === "todos" ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-white/70"}`}>Todos</button>{tiposDisponibles.map((tipo) => <button key={tipo} onClick={() => setTypeFilter(tipo)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${typeFilter === tipo ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-white/70"}`}>{tipo}</button>)}</div> : null}
    <NexxusCard extra="p-5">{loading ? <p className="text-sm text-gray-500 dark:text-white/60">Cargando historial…</p> : eventosFiltrados.length === 0 ? <p className="py-10 text-center text-sm text-gray-500 dark:text-white/60">Todavía no hay actividad registrada.</p> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-gray-100 dark:border-white/10"><th className="px-3 py-3 text-xs uppercase text-gray-500">Tipo</th><th className="px-3 py-3 text-xs uppercase text-gray-500">Actividad</th><th className="px-3 py-3 text-xs uppercase text-gray-500">Estado</th><th className="px-3 py-3 text-xs uppercase text-gray-500">Fecha</th></tr></thead><tbody>{eventosFiltrados.map((event) => <tr className="border-b border-gray-50 dark:border-white/5" key={event.id}><td className="px-3 py-3 text-sm font-bold text-brand-500">{event.type}</td><td className="px-3 py-3 text-sm text-navy-700 dark:text-white"><p>{event.title}</p>{event.detail ? <p className="mt-0.5 text-xs text-gray-500 dark:text-white/50">{event.detail}</p> : null}</td><td className="px-3 py-3 text-sm capitalize text-gray-500 dark:text-white/60">{String(event.status || "").replace(/_/g, " ")}</td><td className="px-3 py-3 text-sm text-gray-500 dark:text-white/60">{event.date ? new Date(event.date).toLocaleString("es-SV") : "—"}</td></tr>)}</tbody></table></div>}</NexxusCard>
  </div>;
}
function Stat({ label, value }) { return <NexxusCard extra="p-4"><p className="text-xs font-bold uppercase text-gray-500 dark:text-white/50">{label}</p><p className="mt-2 text-xl font-bold text-navy-700 dark:text-white">{value}</p></NexxusCard>; }
