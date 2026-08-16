import { FormEvent, useCallback, useEffect, useState } from "react";
import NexxusCard from "views/nexxus/components/NexxusCard";
import { supabase } from "supabaseClient/supabaseConfig";

type Ticket = { id: string; titulo: string; descripcion: string; creado_por: string };
type User = { id: string } | null;
type Perfil = { nombre?: string } | null;
type TicketMessage = { id: string; autor_nombre?: string; texto: string };

type Props = { ticket: Ticket; user: User; perfil: Perfil; empresaId: string; onClose: () => void };

export default function TicketDetailPanel({ ticket, user, perfil, empresaId, onClose }: Props) {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data, error: loadError } = await supabase
        .from("ticket_mensajes")
        .select("id, autor_nombre, texto, created_at")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true })
        .limit(200);
      if (loadError) throw loadError;
      setMessages(data || []);
      setError("");
    } catch {
      setError("No se pudo actualizar el hilo. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [ticket.id]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void load();
    const channel = supabase
      .channel(`ticket-thread:${ticket.id}:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ticket_mensajes", filter: `ticket_id=eq.${ticket.id}` }, () => {
        if (active) void load();
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && active) void load();
        if ((status === "CHANNEL_ERROR" || status === "TIMED_OUT") && active) {
          setError("La actualización en tiempo real se reconectará automáticamente.");
        }
      });
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [load, ticket.id]);

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim() || !user?.id) return;
    try {
      const { error: sendError } = await supabase.from("ticket_mensajes").insert({ ticket_id: ticket.id, empresa_id: empresaId, ticket_creado_por: ticket.creado_por, autor_id: user.id, autor_nombre: perfil?.nombre || "Usuario", texto: draft.trim() });
      if (sendError) throw sendError;
      setDraft("");
      void load();
    } catch {
      setError("No se pudo enviar el mensaje. Inténtalo nuevamente.");
    }
  };
  return <NexxusCard extra="border-brand-500/30 p-5"><div className="mb-4 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase text-brand-500">Hilo de soporte</p><h3 className="mt-1 text-xl font-bold text-navy-700 dark:text-white">{ticket.titulo}</h3><p className="mt-1 text-sm text-gray-500 dark:text-white/60">{ticket.descripcion}</p></div><button onClick={onClose} className="text-sm text-gray-500">Cerrar</button></div><div className="mb-4 max-h-60 space-y-2 overflow-y-auto" aria-live="polite">{loading ? <div className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.06]" /> : messages.length === 0 ? <p className="text-sm text-gray-500 dark:text-white/60">Aún no hay mensajes en el ticket.</p> : messages.map((message) => <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.04]" key={message.id}><p className="text-xs font-bold text-brand-500">{message.autor_nombre || "Usuario"}</p><p className="mt-1 text-sm text-navy-700 dark:text-white">{message.texto}</p></div>)}</div><form onSubmit={send} className="flex gap-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escribe una respuesta…" className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /><button className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white">Enviar</button></form>{error ? <p role="alert" className="mt-3 text-sm text-red-500">{error}</p> : null}</NexxusCard>;
}
