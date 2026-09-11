import { useEffect, useMemo, useState } from "react";
import {
  MdOutlineSupportAgent,
  MdOutlineConfirmationNumber,
  MdOutlinePendingActions,
  MdOutlineCheckCircle,
  MdOutlinePriorityHigh,
} from "react-icons/md";
import { useAuth } from "context/AuthContext";
import { supabase } from "supabaseClient/supabaseConfig";
import NexxusCard from "views/nexxus/components/NexxusCard";
import EmpresaSupportForm from "./EmpresaSupportForm";
import EmpresaSupportTickets from "./EmpresaSupportTickets";
import { SUPPORT_CATEGORIES, SupportCategory, SupportPriority } from "./supportData";

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

export default function EmpresaSoporte() {
  const { empresaId, empresaNombre, user, perfil } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!empresaId) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    const load = async () => {
      try {
        const { data, error: loadError } = await supabase
          .from("tickets")
          .select("*")
          .eq("empresa_id", empresaId)
          .eq("canal", "plataforma")
          .order("created_at", { ascending: false })
          .limit(100);
        if (loadError) throw loadError;
        if (active) {
          setTickets(data || []);
          setError("");
        }
      } catch {
        if (active) setError("No se pudieron cargar las solicitudes de soporte. Intenta recargar la página.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();

    const channel = supabase
      .channel(`empresa-soporte:${empresaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets", filter: `empresa_id=eq.${empresaId}` }, () => {
        void load();
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" && active) {
          setError("No se pudo actualizar el estado de soporte en tiempo real.");
        }
      });
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [empresaId]);

  const contact = useMemo(
    () => ({
      nombre: perfil?.nombre || "Administrador",
      correo: perfil?.correo || user?.email || "",
      telefono: perfil?.telefono || "",
      empresa: empresaNombre || "Empresa",
    }),
    [empresaNombre, perfil?.correo, perfil?.nombre, perfil?.telefono, user?.email]
  );

  const kpis = useMemo(() => {
    const total = tickets.length;
    const abiertos = tickets.filter((t) => t.estado === "abierto" || t.estado === "en_progreso").length;
    const resueltos = tickets.filter((t) => t.estado === "resuelto" || t.estado === "cerrado").length;
    const urgentes = tickets.filter((t) => t.prioridad === "urgente" || t.prioridad === "alta").length;

    return { total, abiertos, resueltos, urgentes };
  }, [tickets]);

  const submit = async ({
    categoria,
    prioridad,
    asunto,
    descripcion,
  }: {
    categoria: SupportCategory;
    prioridad: SupportPriority;
    asunto: string;
    descripcion: string;
  }): Promise<boolean> => {
    if (!empresaId || !user?.id) {
      setError("No fue posible identificar tu empresa. Vuelve a iniciar sesión e inténtalo nuevamente.");
      return false;
    }
    const category = SUPPORT_CATEGORIES.find((item) => item.id === categoria);
    if (!category) return false;
    try {
      setSubmitting(true);
      setError("");
      setNotice("");
      const { data, error: insertError } = await supabase
        .from("tickets")
        .insert({
          empresa_id: empresaId,
          creado_por: user.id,
          creado_por_nombre: contact.nombre,
          titulo: `[${category.label}] ${asunto}`,
          descripcion,
          categoria: category.ticketCategory,
          prioridad,
          estado: "abierto",
          canal: "plataforma",
        })
        .select("*")
        .single();
      if (insertError) throw insertError;
      setNotice(`Solicitud enviada con éxito. Referencia: #${String(data.id).slice(0, 8).toUpperCase()}.`);
      setSelectedTicket(data);
      return true;
    } catch {
      setError("No se pudo enviar la solicitud. Verifica la conexión e inténtalo de nuevo.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  if (!empresaId) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white p-6 shadow-3xl shadow-shadow-500 dark:bg-charcoal dark:border dark:border-charcoal-border">
        <p className="text-base font-semibold text-gray-600 dark:text-white/70">
          Tu cuenta no tiene una empresa asociada.
        </p>
      </div>
    );
  }

  const total = Math.max(kpis.total, 1);
  const hayTickets = kpis.total > 0;
  const abiertosPct = Math.round((kpis.abiertos / total) * 100);
  const resueltosPct = Math.round((kpis.resueltos / total) * 100);
  const urgentesPct = Math.round((kpis.urgentes / total) * 100);

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
            <MdOutlineSupportAgent className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-navy-700 dark:text-white">
                Soporte & Asistencia Nexxus
              </h2>
              <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
                {tickets.length} solicitudes
              </span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-white/60">
              Canal directo entre {empresaNombre || "tu empresa"} y el equipo de soporte técnico e ingeniería.
            </p>
          </div>
        </div>
      </div>

      {/* Banners */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl bg-emerald-50 p-4 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          {notice}
        </div>
      )}

      {/* Grid Asimétrico: Hero Card (7 cols) + Right Stack (5 cols) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Hero Card Principal (7 cols) */}
        <div className="lg:col-span-7">
          <NexxusCard extra="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-navy-700 dark:text-white">
                    Mesa de Soporte & Solicitudes
                  </span>
                  <span className="ml-2 text-xs font-medium text-gray-400 dark:text-white/40">
                    · Gestión de Incidencias
                  </span>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    kpis.abiertos > 0
                      ? "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300"
                      : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                  }`}
                >
                  {kpis.abiertos > 0 ? `${kpis.abiertos} en atención` : "Mesa al día"}
                </span>
              </div>

              {/* Número Principal */}
              <div className="mt-4">
                {kpis.abiertos > 0 ? (
                  <div>
                    <p className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-navy-700 dark:text-white truncate">
                      {kpis.abiertos}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <span>{abiertosPct}% de solicitudes en curso</span>
                      <span className="font-normal text-gray-400 dark:text-white/40">
                        · Siendo atendidas por el equipo de ingeniería
                      </span>
                    </p>
                  </div>
                ) : hayTickets ? (
                  <div className="py-2">
                    <p className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                      Mesa de soporte al día
                    </p>
                    <p className="mt-1 text-xs font-medium text-gray-400 dark:text-white/50">
                      Todos los tickets registrados han sido resueltos satisfactoriamente.
                    </p>
                  </div>
                ) : (
                  <div className="py-2">
                    <p className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                      Sin solicitudes de soporte activas
                    </p>
                    <p className="mt-1 text-xs font-medium text-gray-400 dark:text-white/50">
                      No hay incidencias reportadas en tu empresa actualmente.
                    </p>
                  </div>
                )}

                <p className="mt-2 text-xs font-medium text-gray-500 dark:text-white/60">
                  {kpis.total} {kpis.total === 1 ? "solicitud registrada" : "solicitudes registradas"} · {kpis.resueltos} resueltas · {kpis.urgentes} de alta prioridad
                </p>
              </div>
            </div>

            <div className="mt-6">
              {/* Barra de Distribución Proporcional */}
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                {hayTickets ? (
                  <>
                    <div
                      style={{ width: `${Math.max(abiertosPct, kpis.abiertos > 0 ? 5 : 0)}%` }}
                      className="h-full bg-amber-500 transition-all duration-500"
                      title={`En atención: ${kpis.abiertos}`}
                    />
                    <div
                      style={{ width: `${Math.max(resueltosPct, kpis.resueltos > 0 ? 5 : 0)}%` }}
                      className="h-full bg-emerald-500 transition-all duration-500"
                      title={`Resueltos: ${kpis.resueltos}`}
                    />
                    <div
                      style={{ width: `${Math.max(urgentesPct, kpis.urgentes > 0 ? 5 : 0)}%` }}
                      className="h-full bg-rose-500 transition-all duration-500"
                      title={`Urgentes: ${kpis.urgentes}`}
                    />
                  </>
                ) : (
                  <div className="h-full w-full bg-gray-200/50 dark:bg-white/5" />
                )}
              </div>

              {/* Leyenda con Métricas */}
              {hayTickets ? (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                        {kpis.abiertos}
                      </p>
                      <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                        En Atención ({abiertosPct}%)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                        {kpis.resueltos}
                      </p>
                      <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                        Resueltos ({resueltosPct}%)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                        {kpis.urgentes}
                      </p>
                      <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                        Urgentes ({urgentesPct}%)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-[11px] font-medium text-gray-400 dark:text-white/40">
                  Sin tickets registrados en el historial
                </p>
              )}
            </div>
          </NexxusCard>
        </div>

        {/* Right Stack of 3 Cards (5 cols) - Alineadas a la izquierda */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          {/* Card 1: Tickets en Atención */}
          <NexxusCard extra="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-white/50">
                Tickets en Atención
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  kpis.abiertos > 0
                    ? "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300"
                    : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                }`}
              >
                {kpis.abiertos > 0 ? "En proceso" : "Al día"}
              </span>
            </div>
            <div className="mt-2 text-left">
              {kpis.abiertos > 0 ? (
                <>
                  <p className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {kpis.abiertos}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
                    En curso / revisión por especialistas
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base sm:text-lg font-bold tracking-tight text-navy-700 dark:text-white">
                    Sin tickets en atención
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400 dark:text-white/40">
                    Todas las consultas están al día
                  </p>
                </>
              )}
            </div>
          </NexxusCard>

          {/* Card 2: Casos Resueltos */}
          <NexxusCard extra="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-white/50">
                Casos Resueltos
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                Solucionados
              </span>
            </div>
            <div className="mt-2 text-left">
              {kpis.resueltos > 0 ? (
                <>
                  <p className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {kpis.resueltos}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
                    Solucionados con éxito por ingeniería
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base sm:text-lg font-bold tracking-tight text-navy-700 dark:text-white">
                    Sin casos resueltos aún
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400 dark:text-white/40">
                    Las solicitudes completadas figurarán aquí
                  </p>
                </>
              )}
            </div>
          </NexxusCard>

          {/* Card 3: Alta Prioridad / Urgentes */}
          <NexxusCard extra="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-white/50">
                Alta Prioridad / Urgentes
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  kpis.urgentes > 0
                    ? "bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300"
                    : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                }`}
              >
                {kpis.urgentes > 0 ? "Requiere acción" : "Sin urgencias"}
              </span>
            </div>
            <div className="mt-2 text-left">
              {kpis.urgentes > 0 ? (
                <>
                  <p className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {kpis.urgentes}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
                    Casos que requieren atención prioritaria
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base sm:text-lg font-bold tracking-tight text-navy-700 dark:text-white">
                    Sin incidencias críticas
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400 dark:text-white/40">
                    Operaciones y soporte sin bloqueos
                  </p>
                </>
              )}
            </div>
          </NexxusCard>
        </div>
      </div>

      {/* Formulario de Nueva Solicitud */}
      <EmpresaSupportForm contact={contact} submitting={submitting} onSubmit={submit} />

      {/* Historial & Detalle de Tickets */}
      <EmpresaSupportTickets
        tickets={tickets}
        loading={loading}
        selectedTicket={selectedTicket}
        onSelect={setSelectedTicket}
        user={user}
        perfil={perfil}
        empresaId={empresaId}
      />
    </div>
  );
}
