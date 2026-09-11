import { FormEvent, useCallback, useEffect, useState } from "react";
import { MdOutlineClose, MdSend, MdOutlineForum, MdPerson, MdOutlineSupportAgent } from "react-icons/md";
import NexxusCard from "views/nexxus/components/NexxusCard";
import { supabase } from "supabaseClient/supabaseConfig";

type Ticket = { id: string; titulo: string; descripcion: string; creado_por: string; estado?: string; prioridad?: string };
type User = { id: string } | null;
type Perfil = { nombre?: string } | null;
type TicketMessage = { id: string; autor_id?: string; autor_nombre?: string; texto: string; created_at?: string };

type Props = { ticket: Ticket; user: User; perfil: Perfil; empresaId: string; onClose: () => void };

export default function TicketDetailPanel({ ticket, user, perfil, empresaId, onClose }: Props) {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data, error: loadError } = await supabase
        .from("ticket_mensajes")
        .select("id, autor_id, autor_nombre, texto, created_at")
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
    if (!draft.trim() || !user?.id || sending) return;
    try {
      setSending(true);
      const { error: sendError } = await supabase.from("ticket_mensajes").insert({
        ticket_id: ticket.id,
        empresa_id: empresaId,
        ticket_creado_por: ticket.creado_por,
        autor_id: user.id,
        autor_nombre: perfil?.nombre || "Usuario",
        texto: draft.trim(),
      });
      if (sendError) throw sendError;
      setDraft("");
      void load();
    } catch {
      setError("No se pudo enviar el mensaje. Inténtalo nuevamente.");
    } finally {
      setSending(false);
    }
  };

  const formatMsgTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <NexxusCard extra="p-5 flex flex-col gap-4 border border-brand-500/20">
      {/* Cabecera del Panel */}
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 dark:border-white/5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10.5px] font-bold text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
              Hilo de soporte #{ticket.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <h3 className="mt-1.5 truncate text-base font-bold text-navy-700 dark:text-white">
            {ticket.titulo}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-gray-500 line-clamp-3 dark:text-white/60">
            {ticket.descripcion}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle de ticket"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition hover:bg-gray-200 hover:text-navy-700 dark:bg-white/5 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <MdOutlineClose className="h-4 w-4" />
        </button>
      </div>

      {/* Historial de Mensajes / Chat */}
      <div className="flex flex-col gap-3 min-h-[220px] max-h-[380px] overflow-y-auto pr-1" aria-live="polite">
        {loading ? (
          <div className="space-y-2 py-4">
            <div className="h-14 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.04]" />
            <div className="h-14 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.04]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <MdOutlineForum className="h-8 w-8 text-gray-300 dark:text-white/30" />
            <p className="mt-2 text-xs font-bold text-navy-700 dark:text-white">
              Aún no hay respuestas en esta solicitud
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-white/40">
              El equipo de ingeniería responderá a la brevedad. Escribe un mensaje si deseas añadir detalles.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.autor_id === user?.id;
            const isSupport = !isMe;

            return (
              <div
                key={message.id}
                className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 px-1">
                  {isSupport ? (
                    <MdOutlineSupportAgent className="h-3.5 w-3.5 text-brand-500" />
                  ) : (
                    <MdPerson className="h-3.5 w-3.5 text-gray-400" />
                  )}
                  <span className="text-[11px] font-bold text-navy-700 dark:text-white">
                    {message.autor_nombre || (isMe ? "Tú" : "Soporte Nexxus")}
                  </span>
                  {message.created_at && (
                    <span className="text-[10px] text-gray-400 dark:text-white/40">
                      · {formatMsgTime(message.created_at)}
                    </span>
                  )}
                </div>

                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    isMe
                      ? "bg-brand-500 text-white shadow-sm"
                      : "border border-gray-100 bg-gray-50 text-navy-700 dark:border-white/5 dark:bg-charcoal dark:text-white"
                  }`}
                >
                  {message.texto}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input para responder */}
      <form onSubmit={send} className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Escribe un mensaje o actualización…"
          disabled={sending}
          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-brand-500 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-brand-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-400"
        >
          <MdSend className="h-3.5 w-3.5" />
          <span>{sending ? "..." : "Enviar"}</span>
        </button>
      </form>

      {error && (
        <p role="alert" className="text-xs font-semibold text-red-500">
          {error}
        </p>
      )}
    </NexxusCard>
  );
}
