import { FormEvent, useEffect, useState } from "react";
import NexxusCard from "views/nexxus/components/NexxusCard";
import { supabase } from "supabaseClient/supabaseConfig";

export default function TaskDetailPanel({ task, user, perfil, empresaId, onClose }) {
  const [comments, setComments] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [comment, setComment] = useState("");
  const [subtask, setSubtask] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => {
    const [{ data: commentRows }, { data: subtaskRows }] = await Promise.all([
      supabase.from("tarea_comentarios").select("*").eq("tarea_id", task.id).order("created_at", { ascending: true }).limit(100),
      supabase.from("tarea_subtareas").select("*").eq("tarea_id", task.id).order("orden", { ascending: true }).limit(100),
    ]);
    setComments(commentRows || []); setSubtasks(subtaskRows || []);
  };
  // load lee dos colecciones relacionadas y solo debe repetirse cuando cambia la tarea.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [task.id]);
  const addComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!comment.trim() || !user?.id) return;
    const { error } = await supabase.from("tarea_comentarios").insert({ tarea_id: task.id, empresa_id: empresaId, tarea_asignado_a: task.asignado_a, autor_id: user.id, autor_nombre: perfil?.nombre || "Usuario", texto: comment.trim() });
    if (error) setMessage("No se pudo agregar el comentario."); else { setComment(""); setMessage("Comentario agregado."); await load(); }
  };
  const addSubtask = async (event: FormEvent) => {
    event.preventDefault();
    if (!subtask.trim() || !user?.id) return;
    const { error } = await supabase.from("tarea_subtareas").insert({ tarea_id: task.id, empresa_id: empresaId, tarea_asignado_a: task.asignado_a, titulo: subtask.trim(), creado_por: user.id, orden: subtasks.length });
    if (error) setMessage("No se pudo agregar la subtarea."); else { setSubtask(""); setMessage("Subtarea agregada."); await load(); }
  };
  const toggleSubtask = async (item) => { const { error } = await supabase.from("tarea_subtareas").update({ completada: !item.completada }).eq("id", item.id); if (error) setMessage("No se pudo actualizar la subtarea."); else load(); };
  return <NexxusCard extra="border-brand-500/30 p-5"><div className="mb-4 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase text-brand-500">Detalle de tarea</p><h3 className="mt-1 text-xl font-bold text-navy-700 dark:text-white">{task.titulo}</h3><p className="mt-1 text-sm text-gray-500 dark:text-white/60">{task.descripcion || "Sin descripción"}</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold capitalize text-brand-600 dark:text-brand-300">{String(task.estado || "pendiente").replace(/_/g, " ")}</span>{task.prioridad ? <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold capitalize text-amber-600 dark:text-amber-300">Prioridad: {task.prioridad}</span> : null}{task.fecha_limite ? <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 dark:bg-white/[0.06] dark:text-white/70">Límite: {new Date(task.fecha_limite).toLocaleDateString("es-SV")}</span> : null}</div></div><button onClick={onClose} className="text-sm text-gray-500">Cerrar</button></div><div className="grid gap-5 lg:grid-cols-2"><div><h4 className="mb-3 font-bold text-navy-700 dark:text-white">Subtareas</h4><div className="mb-3 flex flex-col gap-2">{subtasks.map((item) => <button onClick={() => toggleSubtask(item)} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-left text-sm dark:bg-white/[0.04]" key={item.id}><span className={`h-4 w-4 rounded border ${item.completada ? "border-emerald-500 bg-emerald-500" : "border-gray-300 dark:border-white/30"}`} /> <span className={item.completada ? "line-through opacity-60" : ""}>{item.titulo}</span></button>)}</div><form onSubmit={addSubtask} className="flex gap-2"><input value={subtask} onChange={(event) => setSubtask(event.target.value)} placeholder="Nueva subtarea" className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /><button className="rounded-lg bg-brand-500 px-3 text-xs font-bold text-white">Agregar</button></form></div><div><h4 className="mb-3 font-bold text-navy-700 dark:text-white">Comentarios</h4><div className="mb-3 max-h-44 space-y-2 overflow-y-auto">{comments.length === 0 ? <p className="text-sm text-gray-500 dark:text-white/60">Aún no hay comentarios.</p> : comments.map((item) => <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.04]" key={item.id}><p className="text-xs font-bold text-brand-500">{item.autor_nombre || "Usuario"}</p><p className="mt-1 text-sm text-navy-700 dark:text-white">{item.texto}</p></div>)}</div><form onSubmit={addComment} className="flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Escribe un comentario" className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /><button className="rounded-lg bg-brand-500 px-3 text-xs font-bold text-white">Enviar</button></form></div></div>{message ? <p className="mt-4 text-sm font-semibold text-brand-500">{message}</p> : null}</NexxusCard>;
}
