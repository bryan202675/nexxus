import { useEffect, useMemo, useState } from "react";
import { MdOutlineCheckCircle, MdOutlineGroups, MdOutlinePendingActions, MdOutlineRequestPage, MdOutlineTrackChanges } from "react-icons/md";
import NexxusCard from "views/nexxus/components/NexxusCard";
import NexxusWidget from "views/nexxus/components/NexxusWidget";
import TrendChart from "views/nexxus/components/TrendChart";
import DistributionChart from "views/nexxus/components/DistributionChart";
import { useAuth } from "context/AuthContext";
import { supabase } from "supabaseClient/supabaseConfig";
import WorkspaceModule from "./WorkspaceModule";

const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const ESTADO_LABELS = { pendiente: "Pendientes", en_progreso: "En progreso", completada: "Completadas" };

export { default as WorkspaceModule } from "./WorkspaceModule";

function useSummaryRows(table, filter) {
  const { empresaId, user } = useAuth();
  const [state, setState] = useState({ loading: true, rows: [] });
  useEffect(() => {
    let active = true;
    if (!empresaId || !user?.id) { setState({ loading: false, rows: [] }); return undefined; }
    const load = async () => {
      let query: any = supabase.from(table).select("*").eq("empresa_id", empresaId).limit(100);
      if (filter) query = query.eq(filter, user.id);
      const { data } = await query;
      if (active) setState({ loading: false, rows: data || [] });
    };
    load();
    const channel = supabase.channel(`workspace:summary:${table}:${user.id}`).on("postgres_changes", { event: "*", schema: "public", table, filter: `empresa_id=eq.${empresaId}` }, load).subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [empresaId, filter, table, user?.id]);
  return state;
}

export function RoleDashboard({ leader = false }) {
  const { perfil } = useAuth();
  const tasks = useSummaryRows("tareas", "asignado_a");
  const requests = useSummaryRows("solicitudes_ausencia", "usuario_id");
  const objectives = useSummaryRows("objetivos", "usuario_id");
  const metrics = useMemo(() => ({ pending: tasks.rows.filter((row) => row.estado !== "completada").length, completed: tasks.rows.filter((row) => row.estado === "completada").length, requests: requests.rows.filter((row) => row.estado === "pendiente").length, objectives: objectives.rows.filter((row) => row.estado === "activo").length }), [objectives.rows, requests.rows, tasks.rows]);
  const name = perfil?.nombre?.split(" ")[0] || "Usuario";
  const widgets = leader ? [{ icon: MdOutlineGroups, title: "Equipo", subtitle: "Gestiona desde Equipo" }, { icon: MdOutlinePendingActions, title: "Mis tareas", subtitle: String(metrics.pending) }, { icon: MdOutlineRequestPage, title: "Aprobaciones", subtitle: String(metrics.requests) }, { icon: MdOutlineCheckCircle, title: "Completadas", subtitle: String(metrics.completed) }] : [{ icon: MdOutlinePendingActions, title: "Pendientes", subtitle: String(metrics.pending) }, { icon: MdOutlineCheckCircle, title: "Completadas", subtitle: String(metrics.completed) }, { icon: MdOutlineRequestPage, title: "Solicitudes", subtitle: String(metrics.requests) }, { icon: MdOutlineTrackChanges, title: "Objetivos activos", subtitle: String(metrics.objectives) }];

  const tendencia = useMemo(() => {
    const dias = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dias.push({ key: date.toISOString().slice(0, 10), label: DIAS_CORTOS[date.getDay()] });
    }
    const creadas = dias.map(({ key }) => tasks.rows.filter((row) => String(row.created_at || "").slice(0, 10) === key).length);
    const completadas = dias.map(({ key }) => tasks.rows.filter((row) => row.estado === "completada" && String(row.updated_at || row.created_at || "").slice(0, 10) === key).length);
    return { categorias: dias.map((d) => d.label), creadas, completadas };
  }, [tasks.rows]);

  const distribucion = useMemo(() => {
    const counts = { pendiente: 0, en_progreso: 0, completada: 0 };
    tasks.rows.forEach((row) => { if (row.estado in counts) counts[row.estado] += 1; });
    return { labels: Object.keys(counts).map((key) => ESTADO_LABELS[key] || key), series: Object.values(counts) };
  }, [tasks.rows]);

  return <div className="flex flex-col gap-7">
    <div><p className="text-sm font-bold uppercase tracking-wide text-brand-500 dark:text-brand-300">{leader ? "Panel de jefe" : "Mi espacio"}</p><h2 className="mt-1 text-3xl font-bold text-navy-700 dark:text-white">Hola, {name}</h2><p className="mt-2 text-sm text-gray-500 dark:text-white/60">Gestiona tus procesos, registros y acciones desde un solo lugar.</p></div>
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">{widgets.map((widget, index) => <NexxusWidget key={widget.title} {...widget} delay={index * 80} />)}</div>
    {tasks.rows.length > 0 ? <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <TrendChart title="Tareas creadas (7 días)" total={String(tasks.rows.length)} change={`${metrics.completed} completadas en total`} series={[{ name: "Creadas", data: tendencia.creadas, color: "#422AFB" }, { name: "Completadas", data: tendencia.completadas, color: "#6AD2FF" }]} categories={tendencia.categorias} delay={100} />
      <DistributionChart title="Estado de mis tareas" series={distribucion.series} labels={distribucion.labels} delay={150} />
    </div> : null}
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2"><NexxusCard extra="p-5"><h3 className="mb-4 font-bold text-navy-700 dark:text-white">Tareas recientes</h3><Preview rows={tasks.rows} empty="No tienes tareas asignadas." /></NexxusCard><NexxusCard extra="p-5"><h3 className="mb-4 font-bold text-navy-700 dark:text-white">Solicitudes recientes</h3><Preview rows={requests.rows} empty="No tienes solicitudes pendientes." /></NexxusCard></div>
    {leader ? <WorkspaceModule moduleKey="equipo" scope="team" /> : null}
  </div>;
}

function Preview({ rows, empty }) { if (!rows.length) return <p className="text-sm text-gray-500 dark:text-white/60">{empty}</p>; return <div className="flex flex-col gap-3">{rows.slice(0, 5).map((row) => <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-3 dark:bg-white/[0.04]" key={row.id}><p className="truncate text-sm font-bold text-navy-700 dark:text-white">{row.titulo || row.tipo || "Elemento"}</p><span className="rounded-full bg-brand-500/10 px-2 py-1 text-xs font-bold capitalize text-brand-500">{String(row.estado || "activo").replace(/_/g, " ")}</span></div>)}</div>; }
