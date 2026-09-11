import { useMemo, useState } from "react";
import {
  MdCheckCircle,
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
  MdOutlineVisibility,
} from "react-icons/md";
import NexxusCard from "views/nexxus/components/NexxusCard";
import Modal from "components/nexxus/Modal";
import Avatar from "components/nexxus/Avatar";
import { TeamCareAlert } from "context/TeamCareAlertsContext";
import { TeamCheckInSummary, Stress, Energy, STRESS_LABELS, ENERGY_LABELS } from "services/checkInAnalytics";

const STRESS_BADGE: Record<Stress, string> = {
  bajo: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold",
  moderado: "bg-blue-500/10 text-blue-700 border border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 font-bold",
  alto: "bg-amber-500/10 text-amber-800 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 font-bold",
  critico: "bg-rose-500 text-white font-black shadow-xs shadow-rose-500/30",
};

const ENERGY_BADGE: Record<Energy, string> = {
  bajo: "bg-rose-500/10 text-rose-700 border border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-300 font-bold",
  medio: "bg-blue-500/10 text-blue-700 border border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 font-bold",
  alto: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold",
};

const PRIORIDAD_BADGE: Record<string, { label: string; className: string }> = {
  critica: { label: "Crítica", className: "bg-rose-500 text-white font-black shadow-xs shadow-rose-500/30" },
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
      dot: "bg-rose-500 ring-2 ring-white dark:ring-charcoal animate-pulse",
      badge: "bg-rose-500 text-white font-black shadow-xs shadow-rose-500/30",
      text: "text-rose-600 dark:text-rose-400 font-black",
      rowClass:
        "border-l-4 border-l-rose-500 bg-rose-500/[0.03] hover:bg-rose-500/[0.07] dark:bg-rose-950/20 dark:hover:bg-rose-950/35 transition-colors",
      pulsePill: "bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-300",
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
      dot: "bg-amber-500 ring-2 ring-white dark:ring-charcoal",
      badge: "bg-amber-500 text-white font-bold",
      text: "text-amber-600 dark:text-amber-400 font-bold",
      rowClass:
        "border-l-4 border-l-amber-500 bg-amber-500/[0.02] hover:bg-amber-500/[0.06] dark:bg-amber-950/15 dark:hover:bg-amber-950/30 transition-colors",
      pulsePill: "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300",
    };
  }

  return {
    isCritico: false,
    isAlto: false,
    dot: "bg-emerald-500 ring-2 ring-white dark:ring-charcoal",
    badge: "bg-emerald-500 text-white font-bold",
    text: "text-emerald-600 dark:text-emerald-400 font-bold",
    rowClass:
      "border-l-4 border-l-transparent hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors",
    pulsePill: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300",
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

function cleanAlertDescription(alert: TeamCareAlert, summary: TeamCheckInSummary): string {
  const rel = fechaRelativa(summary.checkIn.created_at).toLowerCase();
  const fechaTexto = rel.startsWith("hoy") ? "de hoy" : `(${rel})`;
  const motivo = typeof alert.datos?.motivo === "string" ? alert.datos.motivo : "";

  if (motivo) {
    return `Se registró ${motivo} en el check-in ${fechaTexto}. Requiere acompañamiento y seguimiento preventivo.`;
  }
  if (summary.normalized.stress === "critico") {
    return `Se detectó nivel de estrés crítico en el check-in ${fechaTexto}. Requiere atención y acompañamiento de liderazgo.`;
  }
  if (summary.normalized.workload >= 5) {
    return `Se identificó sobrecarga laboral máxima (5/5) en el check-in ${fechaTexto}. Se sugiere evaluar redistribución de tareas.`;
  }
  return `Se detectaron factores de atención en el check-in ${fechaTexto}. Requiere seguimiento del área.`;
}

function MetricBar({
  value,
  max,
  color = "brand",
}: {
  value: number;
  max: number;
  color?: "rose" | "amber" | "emerald" | "brand" | "slate";
}) {
  const activeColor = {
    rose: "bg-rose-500 dark:bg-rose-400",
    amber: "bg-amber-500 dark:bg-amber-400",
    emerald: "bg-emerald-500 dark:bg-emerald-400",
    brand: "bg-brand-500 dark:bg-brand-400",
    slate: "bg-slate-700 dark:bg-slate-300",
  }[color];

  return (
    <div className="flex items-center gap-1 mt-2.5">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-200 ${
            i < value ? activeColor : "bg-gray-200/80 dark:bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

function getManagerGuidance(stress: Stress, workload: number): string {
  if (stress === "critico" || workload >= 5) {
    return "El colaborador presenta un umbral crítico de fatiga y sobrecarga. Se recomienda coordinar un espacio 1:1 de escucha activa, revisar entregables inmediatos y redistribuir tareas críticas para evitar agotamiento.";
  }
  if (stress === "alto" || workload >= 4) {
    return "Nivel de exigencia y tensión por encima de lo habitual. Monitorear fechas límite de proyectos y validar si requiere apoyo o balance de asignaciones.";
  }
  return "El colaborador mantiene un balance saludable entre carga y energía. Mantener canales abiertos de retroalimentación y reconocer el desempeño sostenible.";
}

function WorkloadMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`h-1.5 w-3 rounded-full transition-colors ${
              n <= value
                ? value >= 5
                  ? "bg-rose-500"
                  : value >= 4
                  ? "bg-amber-500"
                  : "bg-brand-500 dark:bg-brand-400"
                : "bg-gray-200 dark:bg-white/10"
            }`}
          />
        ))}
      </div>
      <span
        className={`text-xs font-bold ${
          value >= 5
            ? "text-rose-600 dark:text-rose-400"
            : value >= 4
            ? "text-amber-600 dark:text-amber-400"
            : "text-gray-600 dark:text-white/70"
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
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-navy-700 dark:text-white">
            Atención Inmediata y Estado del Equipo
          </h3>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-white/50">
            Seguimiento de bienestar, factores de tensión y alertas preventivas del equipo.
          </p>
        </div>

        {/* Buscador rápido */}
        <div className="relative w-full sm:w-72">
          <MdOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-gray-400 dark:text-white/40" />
          <input
            type="text"
            placeholder="Buscar por colaborador o área..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-xl border border-gray-200/80 bg-gray-50/50 py-2 pl-10 pr-3.5 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
          />
        </div>
      </div>

      {/* Tabs de Filtrado Rápido */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3 dark:border-white/10">
        {[
          { id: "todos", label: "Todos", count: conteos.todos, badgeColor: "" },
          { id: "critico", label: "Crítico", count: conteos.critico, badgeColor: "bg-rose-500 text-white" },
          { id: "alto", label: "Nivel Alto", count: conteos.alto, badgeColor: "bg-amber-500 text-white" },
          { id: "ok", label: "Estables", count: conteos.ok, badgeColor: "" },
          { id: "alerta", label: "Alertas Activas", count: conteos.alerta, badgeColor: "" },
        ].map((tab) => {
          const isActive = filtroEstado === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroEstado(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                isActive
                  ? "bg-brand-500 text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200/80 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : tab.badgeColor && tab.count > 0
                    ? tab.badgeColor
                    : "bg-black/5 dark:bg-white/10 text-gray-600 dark:text-white/80"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tabla Continua */}
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
        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/10">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 dark:border-white/10 dark:bg-white/[0.02]">
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                  Colaborador
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                  Último Check-In
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                  Nivel de Estrés
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                  Carga Laboral
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                  Energía
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                  Pulso
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
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
                              <span className="rounded-md bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider">
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
                          <p className="truncate text-xs text-gray-400 dark:text-white/50">
                            {s.departamento || "General"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Último Check-in */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-gray-500 dark:text-white/70">
                      {fechaRelativa(s.checkIn.created_at)}
                    </td>

                    {/* Estrés */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                          STRESS_BADGE[s.normalized.stress]
                        }`}
                      >
                        {STRESS_LABELS[s.normalized.stress] || s.normalized.stress}
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
                        {ENERGY_LABELS[s.normalized.energy] || s.normalized.energy}
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
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white px-3 py-1.5 text-xs font-bold text-navy-700 shadow-2xs transition hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                        >
                          <MdOutlineVisibility className="h-4 w-4 text-gray-400 dark:text-white/60" />
                          <span>Detalle</span>
                        </button>
                        {tieneAlertaActiva ? (
                          <button
                            type="button"
                            onClick={() => onResolve(alertaFila.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-2xs transition hover:bg-emerald-500/20 active:scale-95 dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-300"
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
  const [resolviendo, setResolviendo] = useState(false);

  const handleResolve = async () => {
    if (!alert || resolviendo) return;
    setResolviendo(true);
    try {
      await onResolve(alert.id);
    } finally {
      setResolviendo(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-1 text-left">
      {/* 1. Header de Identidad y Estado General */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gray-50/70 p-4 border border-gray-200/70 dark:bg-white/[0.02] dark:border-white/10">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <Avatar name={summary.nombre} size={12} />
            <span
              className={`absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-charcoal ${colors.dot}`}
              title={colors.isCritico ? "Estado Crítico" : colors.isAlto ? "Nivel Alto" : "Estado Estable"}
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold text-navy-700 dark:text-white">
                {summary.nombre}
              </h3>
              {colors.isCritico ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Estado Crítico
                </span>
              ) : colors.isAlto ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  Atención Requerida
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  Estable
                </span>
              )}
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/50">
              <span>{summary.departamento || "General"}</span>
              <span>·</span>
              <span>Último check-in: {fechaRelativa(summary.checkIn.created_at)}</span>
            </p>
          </div>
        </div>

        {/* Pulse Widget */}
        <div className="flex items-center self-start sm:self-auto shrink-0">
          <div
            className={`flex items-center gap-3 rounded-xl border px-3.5 py-2 ${
              colors.isCritico
                ? "border-rose-500/25 bg-rose-500/[0.05] text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300"
                : colors.isAlto
                ? "border-amber-500/25 bg-amber-500/[0.05] text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-300"
                : "border-emerald-500/25 bg-emerald-500/[0.05] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-300"
            }`}
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-semibold text-gray-400 dark:text-white/50 uppercase tracking-wider">
                Índice Pulso
              </span>
              <span className="text-lg font-black tracking-tight leading-tight">
                {summary.pulse}%
              </span>
            </div>
            <div className="h-6 w-px bg-current opacity-20" />
            <span className="text-xs font-bold whitespace-nowrap">
              {summary.pulseState}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Alerta Activa de Bienestar */}
      {alert && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 rounded-2xl border p-4 transition-all ${
            alert.prioridad === "critica" || colors.isCritico
              ? "border-rose-500/30 bg-rose-500/[0.04] dark:border-rose-500/30 dark:bg-rose-950/25"
              : "border-amber-500/30 bg-amber-500/[0.04] dark:border-amber-500/30 dark:bg-amber-950/25"
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                alert.prioridad === "critica" || colors.isCritico
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              }`}
            >
              <MdOutlineWarningAmber className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-navy-800 dark:text-white">
                  {alert.prioridad === "critica" || colors.isCritico
                    ? "Atención Prioritaria de Bienestar"
                    : "Alerta Preventiva de Bienestar"}
                </p>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    (PRIORIDAD_BADGE[alert.prioridad] || PRIORIDAD_BADGE.media).className
                  }`}
                >
                  {(PRIORIDAD_BADGE[alert.prioridad] || PRIORIDAD_BADGE.media).label}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-600 dark:text-white/70 leading-relaxed">
                {cleanAlertDescription(alert, summary)}
              </p>
            </div>
          </div>
          <div className="shrink-0 self-end sm:self-center">
            {alert.resuelta ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <MdCheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Alerta resuelta</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResolve}
                disabled={resolviendo}
                className="inline-flex items-center gap-1.5 rounded-xl bg-navy-700 hover:bg-navy-800 text-white dark:bg-white dark:text-navy-900 dark:hover:bg-gray-100 px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                <MdCheckCircle className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
                <span>{resolviendo ? "Guardando..." : "Marcar como resuelta"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Métricas del Check-in */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400 dark:text-white/50 uppercase tracking-wider">
            Métricas del Check-in
          </p>
          <span className="text-[11px] text-gray-400 dark:text-white/40">
            Escala normalizada
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {/* Energía */}
          <div className="flex flex-col justify-between rounded-2xl border border-gray-200/70 bg-gray-50/50 p-3.5 dark:border-white/10 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-white/60">Energía</span>
              <MdOutlineBolt className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-2">
              <p className="text-sm font-bold text-navy-800 dark:text-white">
                {ENERGY_LABELS[n.energy]}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-white/50">
                {n.energy === "bajo" ? "Reserva baja" : n.energy === "alto" ? "Energía alta" : "Moderada"}
              </p>
              <MetricBar
                value={n.energy === "alto" ? 3 : n.energy === "medio" ? 2 : 1}
                max={3}
                color={n.energy === "bajo" ? "rose" : n.energy === "alto" ? "emerald" : "brand"}
              />
            </div>
          </div>

          {/* Estrés */}
          <div
            className={`flex flex-col justify-between rounded-2xl border p-3.5 transition ${
              n.stress === "critico"
                ? "border-rose-500/30 bg-rose-500/[0.04] dark:border-rose-500/40 dark:bg-rose-950/20"
                : n.stress === "alto"
                ? "border-amber-500/30 bg-amber-500/[0.04] dark:border-amber-500/40 dark:bg-amber-950/20"
                : "border-gray-200/70 bg-gray-50/50 dark:border-white/10 dark:bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold ${
                  n.stress === "critico"
                    ? "text-rose-600 dark:text-rose-400"
                    : n.stress === "alto"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-gray-500 dark:text-white/60"
                }`}
              >
                Estrés
              </span>
              <MdOutlineMonitorHeart
                className={`h-4 w-4 ${
                  n.stress === "critico"
                    ? "text-rose-500"
                    : n.stress === "alto"
                    ? "text-amber-500"
                    : "text-gray-400"
                }`}
              />
            </div>
            <div className="mt-2">
              <p
                className={`text-sm font-bold ${
                  n.stress === "critico"
                    ? "text-rose-600 dark:text-rose-400"
                    : n.stress === "alto"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-navy-800 dark:text-white"
                }`}
              >
                {STRESS_LABELS[n.stress]}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-white/50">
                {n.stress === "critico" ? "Riesgo crítico" : n.stress === "alto" ? "Tensión alta" : "Nivel normal"}
              </p>
              <MetricBar
                value={n.stress === "critico" ? 4 : n.stress === "alto" ? 3 : n.stress === "moderado" ? 2 : 1}
                max={4}
                color={n.stress === "critico" ? "rose" : n.stress === "alto" ? "amber" : "emerald"}
              />
            </div>
          </div>

          {/* Descanso */}
          <div className="flex flex-col justify-between rounded-2xl border border-gray-200/70 bg-gray-50/50 p-3.5 dark:border-white/10 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-white/60">Descanso</span>
              <MdOutlineBedtime className="h-4 w-4 text-cyan-500" />
            </div>
            <div className="mt-2">
              <p className="text-sm font-bold text-navy-800 dark:text-white">
                {n.sleep} / 5
              </p>
              <p className="text-[11px] text-gray-400 dark:text-white/50">
                {n.sleep <= 2 ? "Insuficiente" : n.sleep === 3 ? "Regular" : "Reparador"}
              </p>
              <MetricBar
                value={n.sleep}
                max={5}
                color={n.sleep <= 2 ? "rose" : n.sleep === 3 ? "amber" : "emerald"}
              />
            </div>
          </div>

          {/* Carga */}
          <div
            className={`flex flex-col justify-between rounded-2xl border p-3.5 transition ${
              n.workload >= 5
                ? "border-rose-500/30 bg-rose-500/[0.04] dark:border-rose-500/40 dark:bg-rose-950/20"
                : n.workload >= 4
                ? "border-amber-500/30 bg-amber-500/[0.04] dark:border-amber-500/40 dark:bg-amber-950/20"
                : "border-gray-200/70 bg-gray-50/50 dark:border-white/10 dark:bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold ${
                  n.workload >= 5
                    ? "text-rose-600 dark:text-rose-400"
                    : n.workload >= 4
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-gray-500 dark:text-white/60"
                }`}
              >
                Carga
              </span>
              <MdOutlineLayers
                className={`h-4 w-4 ${
                  n.workload >= 5
                    ? "text-rose-500"
                    : n.workload >= 4
                    ? "text-amber-500"
                    : "text-gray-400"
                }`}
              />
            </div>
            <div className="mt-2">
              <p
                className={`text-sm font-bold ${
                  n.workload >= 5
                    ? "text-rose-600 dark:text-rose-400"
                    : n.workload >= 4
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-navy-800 dark:text-white"
                }`}
              >
                {n.workload} / 5
              </p>
              <p className="text-[11px] text-gray-400 dark:text-white/50">
                {n.workload >= 5 ? "Sobrecarga" : n.workload >= 4 ? "Exigencia alta" : "Balanceada"}
              </p>
              <MetricBar
                value={n.workload}
                max={5}
                color={n.workload >= 5 ? "rose" : n.workload >= 4 ? "amber" : "brand"}
              />
            </div>
          </div>

          {/* Hábito / Racha */}
          <div className="flex flex-col justify-between rounded-2xl border border-gray-200/70 bg-gray-50/50 p-3.5 dark:border-white/10 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-white/60">Hábito</span>
              <MdOutlineLocalFireDepartment className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2">
              <p className="text-sm font-bold text-navy-800 dark:text-white">
                {summary.streak} {summary.streak === 1 ? "día" : "días"}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-white/50">
                Racha activa
              </p>
              <MetricBar
                value={1}
                max={1}
                color="amber"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recomendación para Gestión y Liderazgo */}
      <div className="flex items-start gap-3 rounded-2xl border border-gray-200/80 bg-gray-50/60 p-4 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
          <MdOutlineSupportAgent className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-navy-800 dark:text-white">
            Recomendación de Acompañamiento para Líderes
          </p>
          <p className="mt-1 text-xs text-gray-600 dark:text-white/75 leading-relaxed">
            {getManagerGuidance(n.stress, n.workload)}
          </p>
        </div>
      </div>

      {/* 5. Factores adicionales señalados */}
      {n.tags.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-gray-400 dark:text-white/50 uppercase tracking-wider">
            Factores señalados en el registro
          </p>
          <div className="flex flex-wrap gap-1.5">
            {n.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200/80 bg-gray-50/80 px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-white/80"
              >
                <MdOutlineLabel className="h-3 w-3 text-brand-500" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 6. Nota del Colaborador (si existe) */}
      {n.note ? (
        <div className="rounded-2xl border border-gray-200/70 bg-white p-3.5 dark:border-white/10 dark:bg-charcoal">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-white/70">
            <MdOutlineChatBubbleOutline className="h-3.5 w-3.5 text-brand-500" />
            <span>Mensaje del Colaborador</span>
          </div>
          <p className="border-l-2 border-brand-500/60 pl-3 text-xs italic text-gray-700 dark:text-white/90">
            "{n.note}"
          </p>
        </div>
      ) : null}

      {/* 7. Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-white/10">
        <span className="text-xs text-gray-400 dark:text-white/40">
          Nexxus Bienestar · Cuidado del Equipo
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-navy-700 shadow-2xs hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 transition-all"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
