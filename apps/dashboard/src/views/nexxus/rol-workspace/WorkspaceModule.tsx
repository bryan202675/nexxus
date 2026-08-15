import { FormEvent, useEffect, useMemo, useState } from "react";
import { MdOutlineListAlt, MdOutlineToday, MdOutlineCheckCircleOutline } from "react-icons/md";
import NexxusCard from "views/nexxus/components/NexxusCard";
import NexxusWidget from "views/nexxus/components/NexxusWidget";
import TrendChart from "views/nexxus/components/TrendChart";
import DistributionChart from "views/nexxus/components/DistributionChart";
import { useAuth } from "context/AuthContext";
import { supabase } from "supabaseClient/supabaseConfig";
import { formatValue, MODULES, readField } from "./workspaceData";
import TaskDetailPanel from "./TaskDetailPanel";
import TicketDetailPanel from "./TicketDetailPanel";
import ObjectiveDetailPanel from "./ObjectiveDetailPanel";

const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const ENUM_LIKE_FIELDS = new Set(["estado", "tipo", "prioridad", "categoria", "metodo", "rol", "departamento"]);

function useModuleInsights(rows: any[]) {
  return useMemo(() => {
    const total = rows.length;
    const estadoCounts: Record<string, number> = {};
    rows.forEach((row) => {
      const estado = readField(row, "estado");
      if (estado) {
        const key = String(estado);
        estadoCounts[key] = (estadoCounts[key] || 0) + 1;
      }
    });
    const estadoEntries = Object.entries(estadoCounts).sort((a, b) => b[1] - a[1]);
    const topEstados = estadoEntries.slice(0, 3);
    const otrosCount = estadoEntries.slice(3).reduce((sum, [, count]) => sum + count, 0);
    const distribution = otrosCount > 0 ? [...topEstados, ["otros", otrosCount]] : topEstados;

    const days: Array<{ key: string; label: string }> = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({ key: date.toISOString().slice(0, 10), label: DIAS_CORTOS[date.getDay()] });
    }
    const porDia = days.map(({ key }) => rows.filter((row) => String(row.created_at || "").slice(0, 10) === key).length);
    const estaSemana = porDia.reduce((sum, value) => sum + value, 0);

    return {
      total,
      topEstados,
      distributionLabels: distribution.map(([label]) => String(label).replace(/_/g, " ")),
      distributionSeries: distribution.map(([, count]) => count),
      trendCategories: days.map((d) => d.label),
      trendSeries: porDia,
      estaSemana,
    };
  }, [rows]);
}

function ModuleInsights({ moduleTitle, insights }: { moduleTitle: string; insights: ReturnType<typeof useModuleInsights> }) {
  if (insights.total === 0) return null;
  const widgets = [
    { icon: MdOutlineListAlt, title: "Total registrado", subtitle: String(insights.total) },
    { icon: MdOutlineToday, title: "Últimos 7 días", subtitle: String(insights.estaSemana) },
    ...insights.topEstados.map(([estado, count]) => ({
      icon: MdOutlineCheckCircleOutline,
      title: String(estado).replace(/_/g, " "),
      subtitle: String(count),
    })),
  ];
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {widgets.map((widget, index) => (
          <NexxusWidget key={widget.title} {...widget} delay={index * 80} />
        ))}
      </div>
      {insights.distributionSeries.length > 1 ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <TrendChart
            title={`Actividad reciente · ${moduleTitle}`}
            total={String(insights.total)}
            change={`${insights.estaSemana} en los últimos 7 días`}
            series={[{ name: "Registros", data: insights.trendSeries, color: "#422AFB" }]}
            categories={insights.trendCategories}
          />
          <DistributionChart title="Distribución por estado" series={insights.distributionSeries} labels={insights.distributionLabels} />
        </div>
      ) : null}
    </div>
  );
}

function useWorkspaceRows(moduleKey: string, scope: "self" | "company" | "team" = "self") {
  const { empresaId, user } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", rows: [] });
  useEffect(() => {
    const module = MODULES[moduleKey];
    if (!module || !empresaId || !user?.id) { setState({ loading: false, error: "", rows: [] }); return undefined; }
    let active = true;
    const load = async () => {
      let query: any = supabase.from(module.table).select(module.select || "*").eq("empresa_id", empresaId).limit(200);
      if (scope === "self" && module.filter) query = query.eq(module.filter, user.id);
      if (scope === "team") {
        // "usuarios" no tiene columna jefe_id -- la jefatura se define por departamento
        // (departamentos.jefe_id), así que el equipo de un jefe son los usuarios cuyo
        // departamento_id apunta a un departamento que él lidera.
        const { data: departamentos } = await supabase.from("departamentos").select("id").eq("empresa_id", empresaId).eq("jefe_id", user.id).limit(50);
        const departamentoIds = (departamentos || []).map((departamento) => departamento.id);
        if (module.table === "usuarios") {
          if (departamentoIds.length) query = query.in("departamento_id", departamentoIds).neq("id", user.id);
          else { if (active) setState({ loading: false, error: "", rows: [] }); return; }
        } else {
          const { data: members } = departamentoIds.length ? await supabase.from("usuarios").select("id").eq("empresa_id", empresaId).in("departamento_id", departamentoIds).limit(100) : { data: [] };
          const ids = (members || []).map((member) => member.id);
          if (ids.length) query = query.in(module.filter || "usuario_id", ids);
          else { if (active) setState({ loading: false, error: "", rows: [] }); return; }
        }
      }
      const { data, error } = await query.order(module.order || "created_at", { ascending: false });
      if (active) setState(error ? { loading: false, error: "No se pudo cargar este apartado.", rows: [] } : { loading: false, error: "", rows: data || [] });
    };
    setState({ loading: true, error: "", rows: [] });
    load();
    const channel = supabase.channel(`workspace:${module.table}:${moduleKey}:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: module.table, filter: `empresa_id=eq.${empresaId}` }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [empresaId, moduleKey, scope, user?.id]);
  return state;
}

function Field({ field, value, onChange }) {
  const common = { value: value || "", onChange: (event) => onChange(event.target.value), required: field.required, className: "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" };
  return <label className="text-sm font-semibold text-navy-700 dark:text-white/80"><span>{field.label}</span>{field.type === "textarea" ? <textarea {...common} rows={3} /> : field.type === "select" ? <select {...common}><option value="">Selecciona…</option>{field.options.map((option) => { const optionValue = typeof option === "string" ? option : option.value; const optionLabel = typeof option === "string" ? option : option.label; return <option value={optionValue} key={optionValue}>{optionLabel}</option>; })}</select> : <input {...common} type={field.type || "text"} />}</label>;
}

export default function WorkspaceModule({ moduleKey, scope = "self" }) {
  const module: any = MODULES[moduleKey];
  const { user, perfil, empresaId, rol } = useAuth();
  const { loading, error, rows } = useWorkspaceRows(moduleKey, scope as any);
  const insights = useModuleInsights(rows);
  const [form, setForm] = useState({});
  const [openForm, setOpenForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedObjective, setSelectedObjective] = useState(null);
  const Icon = module.icon;
  const canManage = ["jefe", "jefe_sector"].includes(rol);
  const canWrite = module.form.length > 0 && ["empleado", "psicologo", "jefe", "jefe_sector"].includes(rol) && ((scope === "self" && ["checkins", "solicitudes", "internas", "objetivos", "citas", "feedback", "tickets"].includes(moduleKey)) || (canManage && moduleKey === "tareas"));
  const title = scope === "team" ? `${module.title} del equipo` : module.title;
  const visibleRows = useMemo(() => rows, [rows]);
  const formFields = useMemo(() => moduleKey === "tareas" && scope === "team" ? [...module.form, { key: "asignado_a", label: "Asignar a", type: "select", options: teamMembers.map((member) => ({ value: member.id, label: member.nombre || member.correo })) }] : module.form, [module.form, moduleKey, scope, teamMembers]);

  useEffect(() => {
    if (scope !== "team" || !empresaId || !user?.id) { setTeamMembers([]); return undefined; }
    let active = true;
    const load = async () => {
      const { data: departamentos } = await supabase.from("departamentos").select("id").eq("empresa_id", empresaId).eq("jefe_id", user.id).limit(50);
      const departamentoIds = (departamentos || []).map((departamento) => departamento.id);
      if (!departamentoIds.length) { if (active) setTeamMembers([]); return; }
      const { data } = await supabase.from("usuarios").select("id, nombre, correo").eq("empresa_id", empresaId).in("departamento_id", departamentoIds).limit(100);
      if (active) setTeamMembers(data || []);
    };
    load();
    return () => { active = false; };
  }, [empresaId, scope, user?.id]);

  const createRow = async (event: FormEvent) => {
    event.preventDefault();
    if (!empresaId || !user?.id) return;
    setSaving(true); setMessage("");
    try {
      const values: any = { ...form };
      let row: any = { ...values, empresa_id: empresaId };
      if (moduleKey === "tareas") row = { ...row, asignado_a: values.asignado_a || user.id, creado_por: user.id, estado: "pendiente" };
      if (moduleKey === "solicitudes") row = { ...row, usuario_id: user.id };
      if (moduleKey === "internas") row = { empresa_id: empresaId, usuario_id: user.id, tipo: values.tipo, detalle: values.detalle, datos: { titulo: values.titulo || values.tipo, prioridad: values.prioridad || "media" } };
      if (moduleKey === "checkins") row = { empresa_id: empresaId, usuario_id: user.id, datos: { estado_animo: values.estado_animo, nota: values.nota } };
      if (moduleKey === "objetivos") row = { ...row, usuario_id: user.id, creado_por: user.id, estado: "activo", descripcion: values.descripcion || "" };
      if (moduleKey === "citas") row = { empresa_id: empresaId, usuario_id: user.id, especialista: values.especialista, fecha: values.fecha, estado: "pendiente", datos: { especialidad: values.especialidad || "", horario: values.horario || "" } };
      if (moduleKey === "feedback") row = { ...row, usuario_id: user.id, datos: { estado: "pendiente" } };
      if (moduleKey === "tickets") row = { ...row, creado_por: user.id, creado_por_nombre: perfil?.nombre || "Usuario", estado: "abierto" };
      if (moduleKey === "anuncios") row = { ...row, autor_id: user.id };
      const { error: insertError } = await supabase.from(module.table).insert(row);
      if (insertError) throw insertError;
      setForm({}); setOpenForm(false); setMessage("Guardado correctamente.");
    } catch { setMessage("No se pudo guardar. Revisa los datos e inténtalo de nuevo."); }
    finally { setSaving(false); }
  };

  const updateRow = async (row, patch) => {
    setMessage("");
    try {
      let payload = patch;
      if (moduleKey === "bandeja") payload = { contenido: { ...(row.contenido || {}), ...patch } };
      const { error: updateError } = await supabase.from(module.table).update(payload).eq("id", row.id);
      if (updateError) throw updateError;
      if (moduleKey === "solicitudes" && patch.estado && row.usuario_id && empresaId) {
        await supabase.from("notificaciones").insert({ empresa_id: empresaId, usuario_id: row.usuario_id, titulo: "Solicitud actualizada", cuerpo: `Tu solicitud fue ${patch.estado}.`, leida: false });
      }
      setMessage("Actualizado correctamente.");
    } catch { setMessage("No se pudo actualizar este elemento."); }
  };

  const removeRow = async (row) => {
    if (!window.confirm("¿Quieres eliminar este elemento?")) return;
    try {
      const { error: deleteError } = await supabase.from(module.table).delete().eq("id", row.id);
      if (deleteError) throw deleteError;
      setMessage("Eliminado correctamente.");
    } catch { setMessage("No se pudo eliminar este elemento."); }
  };

  const actionFor = (row) => {
    if (moduleKey === "tareas") return <span className="flex flex-wrap gap-2"><button onClick={() => setSelectedTask(row)} className="rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-500">Detalle</button><button onClick={() => { const title = window.prompt("Título de la tarea", row.titulo); if (title?.trim()) updateRow(row, { titulo: title.trim() }); }} className="rounded-lg bg-slate-500/10 px-3 py-1.5 text-xs font-bold text-slate-600">Editar</button><button onClick={() => updateRow(row, { estado: row.estado === "completada" ? "pendiente" : "completada" })} className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-300">{row.estado === "completada" ? "Reabrir" : "Completar"}</button>{canManage ? <button onClick={() => updateRow(row, { estado: "en_progreso" })} className="rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-500">En progreso</button> : null}</span>;
    if (moduleKey === "solicitudes" && canManage && row.estado === "pendiente") return <span className="flex gap-2"><button onClick={() => updateRow(row, { estado: "aprobada", resolved_at: new Date().toISOString() })} className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600">Aprobar</button><button onClick={() => updateRow(row, { estado: "rechazada", resolved_at: new Date().toISOString() })} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500">Rechazar</button></span>;
    if (moduleKey === "solicitudes" && row.estado === "pendiente" && scope === "self") return <span className="flex gap-2"><button onClick={() => { const motivo = window.prompt("Motivo", row.motivo || ""); if (motivo !== null) updateRow(row, { motivo }); }} className="rounded-lg bg-slate-500/10 px-3 py-1.5 text-xs font-bold text-slate-600">Editar</button><button onClick={() => removeRow(row)} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500">Cancelar</button></span>;
    if (moduleKey === "notificaciones" && !row.leida) return <button onClick={() => updateRow(row, { leida: true, fecha_lectura: new Date().toISOString() })} className="rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-500">Marcar leída</button>;
    if (moduleKey === "documentos" && !row.leido) return <button onClick={() => updateRow(row, { leido: true })} className="rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-500">Marcar leído</button>;
    if (moduleKey === "aprendizaje") return <button onClick={async () => { const { error: progressError } = await supabase.functions.invoke("complete-training-module", { body: { cursoId: row.id, moduloIndex: 0 } }); setMessage(progressError ? "No se pudo registrar el avance." : "Módulo completado."); }} className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600">Completar módulo</button>;
    if (moduleKey === "bandeja" && row.contenido?.estado !== "resuelto") return <button onClick={() => updateRow(row, { estado: "resuelto" })} className="rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-500">Resolver</button>;
    if (moduleKey === "objetivos" && row.estado === "activo") return <span className="flex flex-wrap gap-2"><button onClick={() => setSelectedObjective(row)} className="rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-500">Resultados</button><button onClick={() => { const title = window.prompt("Título del objetivo", row.titulo); if (title?.trim()) updateRow(row, { titulo: title.trim() }); }} className="rounded-lg bg-slate-500/10 px-3 py-1.5 text-xs font-bold text-slate-600">Editar</button><button onClick={() => updateRow(row, { estado: "completado" })} className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600">Completar</button></span>;
    if (moduleKey === "activos") return <button onClick={async () => { const { error: reportError } = await supabase.from("incidencias").insert({ empresa_id: empresaId, reportado_por: user?.id, titulo: `Incidencia: ${row.nombre}`, estado: "abierta", datos: { activoId: row.id, activoNombre: row.nombre, reportadoNombre: perfil?.nombre || "", prioridad: "media" } }); setMessage(reportError ? "No se pudo reportar la incidencia." : "Incidencia reportada correctamente."); }} className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600">Reportar incidencia</button>;
    if (moduleKey === "tickets" && row.estado !== "cerrado" && row.estado !== "resuelto") return <span className="flex gap-2"><button onClick={() => setSelectedTicket(row)} className="rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-500">Abrir hilo</button><button onClick={() => updateRow(row, { estado: canManage ? "en_progreso" : "cerrado" })} className="rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-500">{canManage ? "Tomar ticket" : "Cerrar ticket"}</button></span>;
    if (moduleKey === "tickets") return <button onClick={() => setSelectedTicket(row)} className="rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-500">Abrir hilo</button>;
    if ((moduleKey === "solicitudes" || moduleKey === "objetivos") && (row.estado === "pendiente" || row.estado === "activo") && (scope === "self" || canManage)) return <button onClick={() => removeRow(row)} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500">Eliminar</button>;
    return null;
  };

  if (!module) return null;
  return <div className="flex flex-col gap-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="rounded-xl bg-brand-500/10 p-3 text-brand-500 dark:bg-brand-400/15 dark:text-brand-300"><Icon className="h-6 w-6" /></span><div><h2 className="text-2xl font-bold text-navy-700 dark:text-white">{title}</h2><p className="text-sm text-gray-500 dark:text-white/60">Módulo conectado a las operaciones reales de tu espacio laboral.</p></div></div>{canWrite ? <button onClick={() => setOpenForm(true)} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition active:scale-[.97]">Nuevo elemento</button> : null}</div>
    {!loading && !error ? <ModuleInsights moduleTitle={title} insights={insights} /> : null}
    {openForm ?<NexxusCard extra="p-5"><form onSubmit={createRow} className="grid gap-4 md:grid-cols-2"><div className="md:col-span-2 flex items-center justify-between"><h3 className="font-bold text-navy-700 dark:text-white">Crear en {module.title}</h3><button type="button" onClick={() => setOpenForm(false)} className="text-sm text-gray-500">Cancelar</button></div>{formFields.map((field) => <Field key={field.key} field={field} value={form[field.key]} onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))} />)}<button disabled={saving} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 md:col-span-2">{saving ? "Guardando…" : "Guardar"}</button></form></NexxusCard> : null}
    {message ? <p className="rounded-xl bg-brand-500/10 px-4 py-3 text-sm font-semibold text-brand-600 dark:text-brand-300">{message}</p> : null}
    <NexxusCard extra="p-5">{loading ? <p className="text-sm text-gray-500 dark:text-white/60">Cargando información…</p> : error ? <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</p> : visibleRows.length === 0 ? <div className="py-10 text-center"><Icon className="mx-auto mb-3 h-9 w-9 text-gray-300 dark:text-white/30" /><p className="font-bold text-navy-700 dark:text-white">No hay elementos todavía</p><p className="mt-1 text-sm text-gray-500 dark:text-white/60">Cuando haya información disponible aparecerá aquí.</p></div> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-gray-100 dark:border-white/10">{module.columns.map((field) => <th className="px-3 py-3 text-xs font-bold uppercase text-gray-500 dark:text-white/50" key={field}>{field.replace(/_/g, " ")}</th>)}<th className="px-3 py-3 text-xs font-bold uppercase text-gray-500 dark:text-white/50">Acciones</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.id} className="border-b border-gray-50 last:border-0 dark:border-white/5">{module.columns.map((field) => <td key={field} className={`max-w-[320px] px-3 py-4 text-sm font-medium text-navy-700 dark:text-white ${ENUM_LIKE_FIELDS.has(field) ? "capitalize" : ""}`}>{formatValue(readField(row, field))}</td>)}<td className="px-3 py-4">{actionFor(row)}</td></tr>)}</tbody></table></div>}</NexxusCard>
    {selectedTask ? <TaskDetailPanel task={selectedTask} user={user} perfil={perfil} empresaId={empresaId} onClose={() => setSelectedTask(null)} /> : null}
    {selectedTicket ? <TicketDetailPanel ticket={selectedTicket} user={user} perfil={perfil} empresaId={empresaId} onClose={() => setSelectedTicket(null)} /> : null}
    {selectedObjective ? <ObjectiveDetailPanel objective={selectedObjective} onClose={() => setSelectedObjective(null)} /> : null}
    {moduleKey === "asistencia" ? <AttendanceActions empresaId={empresaId} userId={user?.id} /> : null}
  </div>;
}

function AttendanceActions({ empresaId, userId }) {
  const [saving, setSaving] = useState(false);
  const registrar = async (tipo) => { setSaving(true); try { const now = new Date(); const { error } = await supabase.from("asistencias").insert({ empresa_id: empresaId, usuario_id: userId, tipo, fecha_jornada: now.toISOString().slice(0, 10), metodo_registro: "workspace_web" }); if (error) throw error; } finally { setSaving(false); } };
  return <NexxusCard extra="p-5"><h3 className="mb-3 font-bold text-navy-700 dark:text-white">Registrar jornada</h3><div className="flex flex-wrap gap-3"><button disabled={saving} onClick={() => registrar("entrada")} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Registrar entrada</button><button disabled={saving} onClick={() => registrar("salida")} className="rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Registrar salida</button></div></NexxusCard>;
}
