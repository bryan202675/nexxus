import { FormEvent, useEffect, useState } from "react";
import NexxusCard from "views/nexxus/components/NexxusCard";
import { supabase } from "supabaseClient/supabaseConfig";

export default function TicketDetailPanel({ ticket, user, perfil, empresaId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const load = async () => { const { data } = await supabase.from("ticket_mensajes").select("*").eq("ticket_id", ticket.id).order("created_at", { ascending: true }).limit(200); setMessages(data || []); };
  // load lee el hilo actual y solo debe repetirse cuando cambia el ticket seleccionado.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [ticket.id]);
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || !user?.id) return;
    const { error: sendError } = await supabase.from("ticket_mensajes").insert({ ticket_id: ticket.id, empresa_id: empresaId, ticket_creado_por: ticket.creado_por, autor_id: user.id, autor_nombre: perfil?.nombre || "Usuario", texto: draft.trim() });
    if (sendError) setError("No se pudo enviar el mensaje."); else { setDraft(""); load(); }
  };
  return <NexxusCard extra="border-brand-500/30 p-5"><div className="mb-4 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase text-brand-500">Hilo de soporte</p><h3 className="mt-1 text-xl font-bold text-navy-700 dark:text-white">{ticket.titulo}</h3><p className="mt-1 text-sm text-gray-500 dark:text-white/60">{ticket.descripcion}</p></div><button onClick={onClose} className="text-sm text-gray-500">Cerrar</button></div><div className="mb-4 max-h-60 space-y-2 overflow-y-auto">{messages.length === 0 ? <p className="text-sm text-gray-500 dark:text-white/60">Aún no hay mensajes en el ticket.</p> : messages.map((message) => <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.04]" key={message.id}><p className="text-xs font-bold text-brand-500">{message.autor_nombre || "Usuario"}</p><p className="mt-1 text-sm text-navy-700 dark:text-white">{message.texto}</p></div>)}</div><form onSubmit={send} className="flex gap-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escribe una respuesta…" className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /><button className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white">Enviar</button></form>{error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}</NexxusCard>;
}
