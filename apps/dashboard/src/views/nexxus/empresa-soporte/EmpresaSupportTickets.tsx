import { useMemo, useState } from "react";
import { MdForum, MdOpenInNew, MdOutlineSearch, MdOutlineSupportAgent, MdOutlineCheckCircle } from "react-icons/md";
import NexxusCard from "views/nexxus/components/NexxusCard";
import TicketDetailPanel from "views/nexxus/rol-workspace/TicketDetailPanel";
import { STATUS_CLASSES, SUPPORT_PRIORITIES, formatSupportDate } from "./supportData";

type Ticket = {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  prioridad: string;
  estado: string;
  created_at: string;
  creado_por: string;
};

const priorityClass = (priority: string) =>
  SUPPORT_PRIORITIES.find((item) => item.id === priority)?.classes || "border-gray-200 text-gray-500";

export default function EmpresaSupportTickets({
  tickets,
  loading,
  selectedTicket,
  onSelect,
  user,
  perfil,
  empresaId,
}: {
  tickets: Ticket[];
  loading: boolean;
  selectedTicket: Ticket | null;
  onSelect: (ticket: Ticket | null) => void;
  user: { id: string } | null;
  perfil: { nombre?: string } | null;
  empresaId: string;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const ticketsFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return tickets.filter((t) => {
      if (filtroEstado !== "todos" && t.estado !== filtroEstado) return false;
      if (!q) return true;
      return t.titulo.toLowerCase().includes(q) || t.descripcion.toLowerCase().includes(q);
    });
  }, [tickets, busqueda, filtroEstado]);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,1.2fr)]">
      {/* Lista de Solicitudes */}
      <NexxusCard extra="p-6 flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-navy-700 dark:text-white">
              Historial de Solicitudes
            </h3>
            <p className="text-xs font-medium text-gray-500 dark:text-white/60">
              Seguimiento en tiempo real de las respuestas del equipo de Nexxus.
            </p>
          </div>
          <span className="w-fit rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
            {tickets.length} solicitudes
          </span>
        </div>

        {/* Buscador & Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 dark:border-white/5">
          <div className="relative flex-1 min-w-[180px]">
            <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
            <input
              type="text"
              placeholder="Buscar solicitud..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-1.5 pl-8 pr-3 text-xs font-medium text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFiltroEstado("todos")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                filtroEstado === "todos"
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado("abierto")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                filtroEstado === "abierto"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70"
              }`}
            >
              Abiertos
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado("resuelto")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                filtroEstado === "resuelto"
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70"
              }`}
            >
              Resueltos
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 py-4" aria-label="Cargando solicitudes">
            <div className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.04]" />
            <div className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.04]" />
          </div>
        ) : ticketsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MdForum className="h-10 w-10 text-gray-300 dark:text-white/30" />
            <p className="mt-2 text-xs font-bold text-navy-700 dark:text-white">
              {busqueda || filtroEstado !== "todos"
                ? "No se encontraron solicitudes con los filtros aplicados."
                : "Aún no hay solicitudes registradas."}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-white/40">
              Envía tu primera consulta usando el formulario superior.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
            {ticketsFiltrados.map((ticket) => {
              const isSelected = selectedTicket?.id === ticket.id;
              const status = STATUS_CLASSES[ticket.estado] || STATUS_CLASSES.abierto;

              return (
                <button
                  type="button"
                  key={ticket.id}
                  onClick={() => onSelect(ticket)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all active:scale-99 ${
                    isSelected
                      ? "border-brand-500 bg-brand-500/10 shadow-sm dark:bg-brand-400/15"
                      : "border-gray-100 bg-white hover:border-brand-500/40 hover:bg-gray-50/50 dark:border-white/5 dark:bg-charcoal dark:hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 truncate text-xs font-bold text-navy-700 dark:text-white">
                      {ticket.titulo}
                    </span>
                    <MdOpenInNew
                      className={`mt-0.5 shrink-0 transition ${isSelected ? "text-brand-500" : "text-gray-400"}`}
                    />
                  </div>

                  <p className="mt-1 line-clamp-2 text-xs font-normal leading-relaxed text-gray-500 dark:text-white/60">
                    {ticket.descripcion}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] ${status.cls}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      <span>{status.label}</span>
                    </span>

                    <span className={`rounded-full border px-2.5 py-0.5 text-[10.5px] ${priorityClass(ticket.prioridad)}`}>
                      {ticket.prioridad}
                    </span>

                    <span className="ml-auto text-[10.5px] font-medium text-gray-400 dark:text-white/40">
                      {formatSupportDate(ticket.created_at)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </NexxusCard>

      {/* Detalle del Ticket & Conversación */}
      <div>
        {selectedTicket ? (
          <TicketDetailPanel
            ticket={selectedTicket}
            user={user}
            perfil={perfil}
            empresaId={empresaId}
            onClose={() => onSelect(null)}
          />
        ) : (
          <NexxusCard extra="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
              <MdOutlineSupportAgent className="h-7 w-7" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
              Selecciona una solicitud
            </h4>
            <p className="mt-1 text-xs text-gray-400 dark:text-white/50 max-w-xs">
              Haz clic en cualquier ticket del panel izquierdo para consultar el hilo de respuestas en tiempo real con el equipo de Nexxus.
            </p>
          </NexxusCard>
        )}
      </div>
    </div>
  );
}
