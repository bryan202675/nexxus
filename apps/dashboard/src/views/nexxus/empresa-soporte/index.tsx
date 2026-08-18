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

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
          <MdOutlineSupportAgent className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
            Soporte & Asistencia Nexxus
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-white/60">
            Canal directo entre {empresaNombre || "tu empresa"} y el equipo de soporte técnico e ingeniería.
          </p>
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Total Solicitudes
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                {kpis.total}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
              <MdOutlineConfirmationNumber className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Historial de tickets</span>
            <span className="font-bold text-brand-500">Registrados</span>
          </div>
        </NexxusCard>

        {/* Tickets Abiertos */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Tickets en Atención
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                {kpis.abiertos}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300">
              <MdOutlinePendingActions className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>En curso / revisión</span>
            <span className={kpis.abiertos > 0 ? "font-bold text-amber-600" : "font-bold text-emerald-600"}>
              {kpis.abiertos > 0 ? "En proceso" : "Al día"}
            </span>
          </div>
        </NexxusCard>

        {/* Tickets Resueltos */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Casos Resueltos
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {kpis.resueltos}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
              <MdOutlineCheckCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Solucionados con éxito</span>
            <span className="font-bold text-emerald-600">Completados</span>
          </div>
        </NexxusCard>

        {/* Alta Prioridad */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Alta Prioridad / Urgentes
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                {kpis.urgentes}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300">
              <MdOutlinePriorityHigh className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Prioridad crítica</span>
            <span className={kpis.urgentes > 0 ? "font-bold text-rose-600" : "font-bold text-gray-400"}>
              {kpis.urgentes > 0 ? "Requiere acción" : "Sin urgencias"}
            </span>
          </div>
        </NexxusCard>
      </div>

      <EmpresaSupportForm contact={contact} submitting={submitting} onSubmit={submit} />

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
