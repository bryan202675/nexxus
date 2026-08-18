import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdCheckCircle,
  MdOutlineVisibility,
  MdOutlineBolt,
  MdOutlineMonitorHeart,
  MdOutlineBedtime,
  MdOutlineLayers,
  MdOutlineLocalFireDepartment,
  MdOutlineSearch,
  MdOutlineMood,
  MdOutlineWarningAmber,
  MdOutlineSupportAgent,
  MdOutlineLabel,
  MdOutlineChatBubbleOutline,
} from "react-icons/md";
import NexxusCard from "views/nexxus/components/NexxusCard";
import Modal from "components/nexxus/Modal";
import Avatar from "components/nexxus/Avatar";
import { useAuth } from "context/AuthContext";
import { TeamCareAlert } from "context/TeamCareAlertsContext";
import { TeamCheckInSummary, Stress, Energy, getGuide } from "services/checkInAnalytics";

const STRESS_BADGE: Record<Stress, string> = {
  bajo: "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-500/25 dark:text-emerald-300 font-bold",
  moderado: "bg-blue-500/15 text-blue-700 border border-blue-500/30 dark:bg-blue-500/25 dark:text-blue-300 font-bold",
  alto: "bg-amber-500/15 text-amber-800 border border-amber-500/30 dark:bg-amber-500/25 dark:text-amber-300 font-bold",
  critico: "bg-red-500 text-white font-black shadow-sm shadow-red-500/30 dark:bg-red-500 dark:text-white",
};

const ENERGY_BADGE: Record<Energy, string> = {
  bajo: "bg-rose-500/15 text-rose-700 border border-rose-500/30 dark:bg-rose-500/25 dark:text-rose-200 font-bold",
  medio: "bg-blue-500/15 text-blue-700 border border-blue-500/30 dark:bg-blue-500/25 dark:text-blue-200 font-semibold",
  alto: "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-500/25 dark:text-emerald-300 font-bold",
};

const PRIORIDAD_BADGE: Record<string, { label: string; className: string }> = {
  critica: { label: "Crítica", className: "bg-red-500 text-white font-black shadow-sm shadow-red-500/30" },
  alta: { label: "Alta", className: "bg-amber-500 text-white font-bold" },
  media: { label: "Media", className: "bg-blue-500 text-white font-semibold" },
  baja: { label: "Baja", className: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/70" },
};

function getSeverityColor(summary: TeamCheckInSummary) {
  const esCritico = summary.normalized.stress === "critico";

  if (esCritico) {
    return {
      isCritico: true,
      isAlto: false,
      dot: "bg-red-500 shadow-md shadow-red-500/60 ring-2 ring-white dark:ring-charcoal animate-pulse",
      badge: "bg-red-500 text-white font-black shadow-sm shadow-red-500/30",
      text: "text-red-600 dark:text-red-400 font-black",
      rowClass:
        "border-l-4 border-l-red-500 bg-red-500/[0.04] hover:bg-red-500/[0.08] dark:bg-red-950/30 dark:hover:bg-red-950/50 transition-colors",
      headerGradient:
        "bg-gradient-to-r from-red-500/15 via-red-500/5 to-transparent border border-red-500/30 dark:from-red-950/60 dark:via-red-900/30 dark:to-transparent",
      pulsePill: "bg-red-500/15 text-red-600 border border-red-500/30 dark:bg-red-500/25 dark:text-red-300",
    };
  }

  const esAlto =
    summary.normalized.stress === "alto" ||
    summary.severity === "atencion" ||
    summary.severity === "riesgo" ||
    summary.pulse < 75;

  if (esAlto) {
    return {
      isCritico: false,
      isAlto: true,
      dot: "bg-amber-500 shadow-sm shadow-amber-500/50 ring-2 ring-white dark:ring-charcoal",
      badge: "bg-amber-500 text-white font-bold",
      text: "text-amber-600 dark:text-amber-400 font-bold",
      rowClass:
        "border-l-4 border-l-amber-500 bg-amber-500/[0.03] hover:bg-amber-500/[0.06] dark:bg-amber-950/20 dark:hover:bg-amber-950/40 transition-colors",
      headerGradient:
        "bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/20 dark:from-amber-950/50 dark:via-amber-900/20 dark:to-transparent",
      pulsePill: "bg-amber-500/15 text-amber-600 border border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300",
    };
  }

  return {
    isCritico: false,
    isAlto: false,
    dot: "bg-emerald-500 shadow-sm shadow-emerald-500/50 ring-2 ring-white dark:ring-charcoal",
    badge: "bg-emerald-500 text-white font-bold",
    text: "text-emerald-600 dark:text-emerald-400 font-bold",
    rowClass:
      "border-l-4 border-l-transparent hover:bg-gray-50/80 dark:hover:bg-white/[0.03] transition-colors",
    headerGradient:
      "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 dark:from-emerald-950/40 dark:via-emerald-900/10 dark:to-transparent",
    pulsePill: "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300",
  };
}

function fechaRelativa(iso: string) {
  if (!iso) return "Sin registro";
  const fecha = new Date(iso);
  const dias = Math.floor((Date.now() - fecha.getTime()) / 86400000);
  const hora = fecha.toLocaleTimeString("es-SV", { hour: "numeric", minute: "2-digit" });
  if (dias <= 0) return `Hoy · ${hora}`;
  if (dias === 1) return `Ayer · ${hora}`;
  return `Hace ${dias} días`;
}

function WorkloadMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`h-2 w-3.5 rounded-full transition-colors ${
              n <= value
                ? value >= 5
                  ? "bg-red-500 shadow-sm shadow-red-500/40"
                  : value >= 4
                  ? "bg-amber-500 shadow-sm shadow-amber-500/30"
                  : "bg-brand-500 dark:bg-brand-400"
                : "bg-gray-200 dark:bg-white/20"
            }`}
          />
        ))}
      </div>
      <span
        className={`text-xs font-extrabold ${
          value >= 5
            ? "text-red-600 dark:text-red-400"
            : value >= 4
            ? "text-amber-600 dark:text-amber-400"
            : "text-gray-600 dark:text-white/80"
        }`}
      >
        {value}/5
      </span>
    </div>
  );
}

export default function PeoplePriorityTable({
  summaries,
  alertsByUser,
  onResolve,
  delay = 0,
}: {
  summaries: TeamCheckInSummary[];
  alertsByUser: Map<string, TeamCareAlert>;
  onResolve: (alertId: string) => Promise<void>;
  delay?: number;
}) {
  const [detalle, setDetalle] = useState<TeamCheckInSummary | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState<string>("");

  const alerta = detalle ? alertsByUser.get(detalle.usuarioId) || null : null;

  const filtrados = useMemo(() => {
    return summaries.filter((s) => {
      const cumpleBusqueda =
        !busqueda ||
        s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.departamento.toLowerCase().includes(busqueda.toLowerCase());
      if (!cumpleBusqueda) return false;

      if (filtroEstado === "critico") return s.normalized.stress === "critico";
      if (filtroEstado === "alto") return s.normalized.stress === "alto";
      if (filtroEstado === "ok") return s.normalized.stress !== "critico" && s.normalized.stress !== "alto";
      if (filtroEstado === "alerta") {
        const a = alertsByUser.get(s.usuarioId);
        return Boolean(a && !a.resuelta);
      }
      return true;
    });
  }, [summaries, busqueda, filtroEstado, alertsByUser]);

  const conteos = useMemo(() => {
    return {
      todos: summaries.length,
      critico: summaries.filter((s) => s.normalized.stress === "critico").length,
      alto: summaries.filter((s) => s.normalized.stress === "alto").length,
      ok: summaries.filter((s) => s.normalized.stress !== "critico" && s.normalized.stress !== "alto").length,
      alerta: summaries.filter((s) => {
        const a = alertsByUser.get(s.usuarioId);
        return Boolean(a && !a.resuelta);
      }).length,
    };
  }, [summaries, alertsByUser]);

  return (
    <NexxusCard extra="w-full p-6 flex flex-col gap-5" delay={delay}>
      {/* Cabecera con Buscador y Filtros */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h4 className="text-xl font-bold tracking-tight text-navy-700 dark:text-white">
              Atención Inmediata y Estado del Equipo
            </h4>
            {conteos.critico > 0 && (
              <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-black text-white shadow-sm shadow-red-500/40 animate-pulse">
                {conteos.critico} en estado crítico
              </span>
            )}
            {conteos.alto > 0 && (
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                {conteos.alto} nivel alto
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-white/60">
            Los colaboradores en estado crítico se destacan en rojo, mientras que el nivel alto se clasifica en ámbar preventivo.
          </p>
        </div>

        {/* Buscador rápido */}
        <div className="relative w-full sm:w-72">
          <MdOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-gray-400 dark:text-white/50" />
          <input
            type="text"
            placeholder="Buscar por nombre o área..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-10 pr-3.5 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
          />
        </div>
      </div>

      {/* Tabs de Filtrado Rápido */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3 dark:border-white/10">
        {[
          { id: "todos", label: "Todos", count: conteos.todos },
          { id: "critico", label: "Crítico", count: conteos.critico },
          { id: "alto", label: "Nivel Alto", count: conteos.alto },
          { id: "ok", label: "Estables", count: conteos.ok },
          { id: "alerta", label: "Alertas Activas", count: conteos.alerta },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFiltroEstado(tab.id)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
              filtroEstado === tab.id
                ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200/80 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-black ${
                filtroEstado === tab.id
                  ? "bg-white/20 text-white"
                  : tab.id === "critico" && tab.count > 0
                  ? "bg-red-500 text-white"
                  : tab.id === "alto" && tab.count > 0
                  ? "bg-amber-500 text-white"
                  : "bg-black/10 dark:bg-white/10 text-gray-700 dark:text-white/90"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tabla */}
      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-14 text-center dark:border-white/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/40">
            <MdOutlineMood className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
            No se encontraron registros
          </p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-white/50">
            {busqueda
              ? "Prueba con otro término de búsqueda o limpia el filtro."
              : "No hay colaboradores en esta categoría de bienestar."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm dark:border-white/10">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 dark:border-white/10 dark:bg-white/[0.04]">
                <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/70">
                  Empleado & Departamento
                </th>
                <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/70">
                  Último Check-In
                </th>
                <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/70">
                  Nivel de Estrés
                </th>
                <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/70">
                  Carga Laboral
                </th>
                <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/70">
                  Energía
                </th>
                <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/70">
                  Pulso
                </th>
                <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/70">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filtrados.map((s) => {
                const alertaFila = alertsByUser.get(s.usuarioId);
                const tieneAlertaActiva = alertaFila && !alertaFila.resuelta;
                const colors = getSeverityColor(s);

                return (
                  <tr
                    key={s.usuarioId}
                    className={`cursor-pointer ${colors.rowClass}`}
                    onClick={() => setDetalle(s)}
                  >
                    {/* Empleado & Departamento */}
                    <td className="min-w-[220px] px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <Avatar name={s.nombre} size={9} />
                          <span
                            className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full ${colors.dot}`}
                            aria-hidden="true"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold text-navy-700 dark:text-white">
                              {s.nombre}
                            </p>
                            {colors.isCritico ? (
                              <span className="rounded-md bg-red-500 px-1.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider">
                                Crítico
                              </span>
                            ) : colors.isAlto && s.normalized.stress === "alto" ? (
                              <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                                Nivel Alto
                              </span>
                            ) : null}
                            {tieneAlertaActiva && !colors.isCritico && (
                              <span className="flex h-2 w-2 rounded-full bg-amber-500" title="Alerta sin resolver" />
                            )}
                          </div>
                          <p className="truncate text-xs text-gray-500 dark:text-white/70">
                            {s.departamento || "General"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Último Check-in */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-gray-600 dark:text-white/80">
                      {fechaRelativa(s.checkIn.created_at)}
                    </td>

                    {/* Estrés */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                          STRESS_BADGE[s.normalized.stress]
                        }`}
                      >
                        {s.normalized.stress}
                      </span>
                    </td>

                    {/* Carga */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <WorkloadMeter value={s.normalized.workload} />
                    </td>

                    {/* Energía */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                          ENERGY_BADGE[s.normalized.energy]
                        }`}
                      >
                        {s.normalized.energy}
                      </span>
                    </td>

                    {/* Pulso y Racha */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black ${colors.text}`}>
                          {s.pulse}%
                        </span>
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10.5px] font-bold text-gray-700 dark:bg-white/10 dark:text-white/90">
                          <MdOutlineLocalFireDepartment className="h-3 w-3 text-amber-500" />
                          {s.streak}d
                        </span>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDetalle(s)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-navy-700 shadow-sm transition hover:bg-gray-50 active:scale-95 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                        >
                          <MdOutlineVisibility className="h-4 w-4 text-gray-500 dark:text-white/80" />
                          <span>Detalle</span>
                        </button>
                        {tieneAlertaActiva ? (
                          <button
                            type="button"
                            onClick={() => onResolve(alertaFila.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-500/20 active:scale-95 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-300"
                            title="Marcar alerta como resuelta"
                          >
                            <MdCheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Resolver</span>
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detalle Integral de Bienestar */}
      <Modal
        isOpen={!!detalle}
        onClose={() => setDetalle(null)}
        title="Detalle Integral de Bienestar"
        width="max-w-2xl"
      >
        {detalle ? (
          <PersonDetailBody
            summary={detalle}
            alert={alerta}
            onResolve={onResolve}
            onClose={() => setDetalle(null)}
          />
        ) : null}
      </Modal>
    </NexxusCard>
  );
}

function PersonDetailBody({
  summary,
  alert,
  onResolve,
  onClose,
}: {
  summary: TeamCheckInSummary;
  alert: TeamCareAlert | null;
  onResolve: (alertId: string) => Promise<void>;
  onClose: () => void;
}) {
  const { normalized: n } = summary;
  const colors = getSeverityColor(summary);
  const guideText = getGuide(n.stress, n.workload);

  return (
    <div className="flex flex-col gap-5 py-1">
      {/* 1. Header Banner Profesional del Empleado */}
      <div className={`flex items-center justify-between gap-4 rounded-2xl p-4.5 ${colors.headerGradient}`}>
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <Avatar name={summary.nombre} size={12} />
            <span
              className={`absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full ${colors.dot}`}
              title={colors.isCritico ? "Estado Crítico" : colors.isAlto ? "Nivel Alto" : "Estado Estable"}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-lg font-black text-navy-700 dark:text-white">
                {summary.nombre}
              </p>
              {colors.isCritico ? (
                <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-black text-white shadow-sm shadow-red-500/40">
                  ESTADO CRÍTICO
                </span>
              ) : colors.isAlto && n.stress === "alto" ? (
                <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  NIVEL ALTO
                </span>
              ) : null}
            </div>
            <p className="truncate text-xs font-medium text-gray-500 dark:text-white/70">
              {summary.departamento || "General"} · {fechaRelativa(summary.checkIn.created_at)}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={`inline-flex flex-col items-end rounded-2xl px-3.5 py-1.5 ${colors.pulsePill}`}>
            <p className="text-2xl font-black leading-none">{summary.pulse}%</p>
            <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wider">
              {summary.pulseState}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Alerta de bienestar destacada */}
      {alert ? (
        <div
          className={`rounded-2xl p-4.5 shadow-sm ${
            alert.prioridad === "critica" || colors.isCritico
              ? "border border-red-500/30 bg-red-500/[0.06] dark:border-red-500/35 dark:bg-red-950/30"
              : "border border-amber-500/30 bg-amber-500/[0.06] dark:border-amber-500/35 dark:bg-amber-950/30"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${
                alert.prioridad === "critica" || colors.isCritico
                  ? "bg-red-500 shadow-red-500/30"
                  : "bg-amber-500 shadow-amber-500/30"
              }`}
            >
              <MdOutlineWarningAmber className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black text-navy-700 dark:text-white">{alert.titulo}</p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
                    (PRIORIDAD_BADGE[alert.prioridad] || PRIORIDAD_BADGE.media).className
                  }`}
                >
                  {(PRIORIDAD_BADGE[alert.prioridad] || PRIORIDAD_BADGE.media).label}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-700 dark:text-white/80">
                {alert.cuerpo}
              </p>
              {alert.resuelta ? (
                <p className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                  <MdCheckCircle className="h-4 w-4" /> Alerta marcada como resuelta por la administración.
                </p>
              ) : (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => onResolve(alert.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                  >
                    <MdCheckCircle className="h-4 w-4" /> Marcar como resuelta
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* 3. Grid de Indicadores Clave - Etiquetas Formales y Alto Contraste */}
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/60">
          Indicadores Clave del Check-in
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {/* Energía */}
          <div className="flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-gray-50/60 p-3.5 transition hover:shadow-sm dark:border-white/10 dark:bg-charcoal">
            <div className="flex items-center justify-between">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-300">
                <MdOutlineBolt className="h-4.5 w-4.5" />
              </div>
              <span className="rounded-md bg-gray-200/60 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-gray-600 dark:bg-white/10 dark:text-white/70">
                Nivel
              </span>
            </div>
            <div className="mt-2.5">
              <p className="text-sm font-black capitalize text-navy-700 dark:text-white">
                {n.energy}
              </p>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-white/60">Energía</p>
            </div>
          </div>

          {/* Estrés */}
          <div
            className={`flex flex-col justify-between rounded-2xl p-3.5 transition hover:shadow-sm border ${
              n.stress === "critico"
                ? "border-red-500/40 bg-red-500/10 dark:bg-red-950/30"
                : n.stress === "alto"
                ? "border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/30"
                : "border-gray-200/80 bg-gray-50/60 dark:border-white/10 dark:bg-charcoal"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  n.stress === "critico"
                    ? "bg-red-500/15 text-red-600 dark:text-red-400"
                    : n.stress === "alto"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300"
                }`}
              >
                <MdOutlineMonitorHeart className="h-4.5 w-4.5" />
              </div>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${
                  n.stress === "critico"
                    ? "bg-red-500/20 text-red-600 dark:text-red-300"
                    : n.stress === "alto"
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                    : "bg-gray-200/60 text-gray-600 dark:bg-white/10 dark:text-white/70"
                }`}
              >
                {n.stress === "critico" ? "Crítico" : n.stress === "alto" ? "Alto" : "Estado"}
              </span>
            </div>
            <div className="mt-2.5">
              <p
                className={`text-sm font-black capitalize ${
                  n.stress === "critico"
                    ? "text-red-600 dark:text-red-400"
                    : n.stress === "alto"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-navy-700 dark:text-white"
                }`}
              >
                {n.stress}
              </p>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-white/60">Estrés</p>
            </div>
          </div>

          {/* Sueño / Descanso */}
          <div className="flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-gray-50/60 p-3.5 transition hover:shadow-sm dark:border-white/10 dark:bg-charcoal">
            <div className="flex items-center justify-between">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-300">
                <MdOutlineBedtime className="h-4.5 w-4.5" />
              </div>
              <span className="rounded-md bg-gray-200/60 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-gray-600 dark:bg-white/10 dark:text-white/70">
                Escala
              </span>
            </div>
            <div className="mt-2.5">
              <p className="text-sm font-black text-navy-700 dark:text-white">
                {n.sleep} / 5
              </p>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-white/60">Descanso</p>
            </div>
          </div>

          {/* Carga */}
          <div
            className={`flex flex-col justify-between rounded-2xl p-3.5 transition hover:shadow-sm border ${
              n.workload >= 5
                ? "border-red-500/40 bg-red-500/10 dark:bg-red-950/30"
                : n.workload >= 4
                ? "border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/30"
                : "border-gray-200/80 bg-gray-50/60 dark:border-white/10 dark:bg-charcoal"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  n.workload >= 5
                    ? "bg-red-500/15 text-red-600 dark:text-red-400"
                    : n.workload >= 4
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300"
                }`}
              >
                <MdOutlineLayers className="h-4.5 w-4.5" />
              </div>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${
                  n.workload >= 5
                    ? "bg-red-500/20 text-red-600 dark:text-red-300"
                    : n.workload >= 4
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                    : "bg-gray-200/60 text-gray-600 dark:bg-white/10 dark:text-white/70"
                }`}
              >
                Volumen
              </span>
            </div>
            <div className="mt-2.5">
              <p
                className={`text-sm font-black ${
                  n.workload >= 5
                    ? "text-red-600 dark:text-red-400"
                    : n.workload >= 4
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-navy-700 dark:text-white"
                }`}
              >
                {n.workload} / 5
              </p>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-white/60">Carga</p>
            </div>
          </div>

          {/* Racha */}
          <div className="flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-gray-50/60 p-3.5 transition hover:shadow-sm dark:border-white/10 dark:bg-charcoal">
            <div className="flex items-center justify-between">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:bg-orange-400/20 dark:text-orange-300">
                <MdOutlineLocalFireDepartment className="h-4.5 w-4.5" />
              </div>
              <span className="rounded-md bg-gray-200/60 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-gray-600 dark:bg-white/10 dark:text-white/70">
                Hábito
              </span>
            </div>
            <div className="mt-2.5">
              <p className="text-sm font-black text-navy-700 dark:text-white">{summary.streak}d</p>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-white/60">Racha</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recomendación de Gestión y Acompañamiento - Estilo Formal & Ejecutivo */}
      <div className="flex items-start gap-3.5 rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-charcoal">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-200/70 text-navy-700 dark:bg-white/10 dark:text-white">
          <MdOutlineSupportAgent className="h-5 w-5" />
        </div>
        <div className="text-xs leading-relaxed min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/60">
            Recomendación de Gestión y Acompañamiento
          </p>
          <p className="mt-1 text-xs font-semibold text-navy-700 dark:text-white/90">
            {guideText}
          </p>
        </div>
      </div>

      {/* 5. Factores señalados por el colaborador - Etiquetas Formales & Nítidas */}
      {n.tags.length ? (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/60">
            Factores Señalados por el Colaborador
          </p>
          <div className="flex flex-wrap gap-2">
            {n.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-navy-700 shadow-xs dark:border-white/15 dark:bg-charcoal dark:text-white"
              >
                <MdOutlineLabel className="h-3.5 w-3.5 text-brand-500 dark:text-brand-300" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* 6. Nota del colaborador */}
      {n.note ? (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/60">
            Mensaje / Nota del Colaborador
          </p>
          <div className="flex items-start gap-2.5 rounded-2xl border border-gray-200/80 bg-gray-50 p-4 dark:border-white/10 dark:bg-charcoal">
            <MdOutlineChatBubbleOutline className="h-5 w-5 shrink-0 text-gray-400 dark:text-white/50 mt-0.5" />
            <p className="text-xs italic font-medium leading-relaxed text-navy-700 dark:text-white/90">
              "{n.note}"
            </p>
          </div>
        </div>
      ) : null}

      {/* 7. Botones de acción del modal */}
      <div className="mt-2 flex items-center justify-end border-t border-gray-100 pt-4 dark:border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-gray-100 px-5 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200 active:scale-95 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
