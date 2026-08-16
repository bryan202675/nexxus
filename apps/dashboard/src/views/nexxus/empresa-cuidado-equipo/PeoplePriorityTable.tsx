import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdCheckCircle,
  MdOutlineVisibility,
  MdOutlineBolt,
  MdOutlineMonitorHeart,
  MdOutlineBedtime,
  MdOutlineLayers,
  MdOutlineLocalFireDepartment,
  MdOutlineFavorite,
  MdOutlineArrowForward,
} from "react-icons/md";
import NexxusCard from "views/nexxus/components/NexxusCard";
import Modal from "components/nexxus/Modal";
import { useAuth } from "context/AuthContext";
import { TeamCareAlert } from "context/TeamCareAlertsContext";
import { TeamCheckInSummary, Severity, Stress, Energy } from "services/checkInAnalytics";

const STRESS_BADGE: Record<Stress, string> = {
  bajo: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  moderado: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  alto: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  critico: "bg-red-500/10 text-red-600 dark:text-red-300",
};

const ENERGY_BADGE: Record<Energy, string> = {
  bajo: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-white/50",
  medio: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  alto: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
};

const SEVERITY_DOT: Record<Severity, string> = {
  riesgo: "bg-red-500",
  atencion: "bg-amber-500",
  ok: "",
};

const PRIORIDAD_BADGE: Record<string, { label: string; className: string }> = {
  critica: { label: "Crítica", className: "bg-red-500/10 text-red-600 dark:text-red-300" },
  alta: { label: "Alta", className: "bg-amber-500/10 text-amber-600 dark:text-amber-300" },
  media: { label: "Media", className: "bg-blue-500/10 text-blue-600 dark:text-blue-300" },
  baja: { label: "Baja", className: "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/50" },
};

const ROW_TINT: Record<Severity, string> = {
  riesgo: "bg-red-500/[0.035] hover:bg-red-500/[0.07] dark:bg-red-500/[0.05] dark:hover:bg-red-500/[0.09]",
  atencion: "hover:bg-gray-50/80 dark:hover:bg-white/[0.03]",
  ok: "hover:bg-gray-50/80 dark:hover:bg-white/[0.03]",
};

function fechaRelativa(iso: string) {
  const fecha = new Date(iso);
  const dias = Math.floor((Date.now() - fecha.getTime()) / 86400000);
  const hora = fecha.toLocaleTimeString("es-SV", { hour: "numeric", minute: "2-digit" });
  if (dias <= 0) return `Hoy · ${hora}`;
  if (dias === 1) return `Ayer · ${hora}`;
  return `Hace ${dias} días`;
}

function TeamAvatar({ nombre, severidad, size = 9 }: { nombre: string; severidad: Severity; size?: 9 | 11 }) {
  const iniciales = nombre.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";
  const dimension = size === 11 ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs";
  return (
    <div className="relative shrink-0">
      <div className={`flex items-center justify-center rounded-full bg-brand-500/10 font-bold text-brand-600 dark:bg-white/10 dark:text-white ${dimension}`}>
        {iniciales}
      </div>
      {severidad !== "ok" ? (
        <span
          className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-charcoal ${SEVERITY_DOT[severidad]}`}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}

function WorkloadMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`h-1.5 w-3.5 rounded-full ${n <= value ? "bg-brand-500 dark:bg-brand-400" : "bg-gray-200 dark:bg-white/10"}`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-gray-500 dark:text-white/40">{value}/5</span>
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
  const alerta = detalle ? alertsByUser.get(detalle.usuarioId) || null : null;

  return (
    <NexxusCard extra="w-full px-6 pb-6 pt-5" delay={delay}>
      <header className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-bold tracking-tight text-navy-700 dark:text-white">Atención inmediata</h4>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-white/50">Personas con peores resultados en su check-in más reciente.</p>
        </div>
      </header>

      {summaries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center dark:border-white/10">
          <p className="text-sm font-medium text-gray-500 dark:text-white/60">
            Todavía no hay check-ins registrados por el equipo.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/5">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 dark:border-white/10 dark:bg-white/[0.02]">
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">Empleado</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">Último check-in</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">Estrés</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">Carga</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">Energía</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">Racha</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {summaries.slice(0, 15).map((s) => {
                const alertaFila = alertsByUser.get(s.usuarioId);
                return (
                  <tr
                    key={s.usuarioId}
                    className={`transition-colors duration-150 ${ROW_TINT[s.severity]}`}
                  >
                    <td className="min-w-[200px] px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <TeamAvatar nombre={s.nombre} severidad={s.severity} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-navy-700 dark:text-white">{s.nombre}</p>
                          <p className="truncate text-xs text-gray-400 dark:text-white/40">{s.departamento || "General"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-gray-500 dark:text-white/50">{fechaRelativa(s.checkIn.created_at)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STRESS_BADGE[s.normalized.stress]}`}>
                        {s.normalized.stress}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <WorkloadMeter value={s.normalized.workload} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${ENERGY_BADGE[s.normalized.energy]}`}>
                        {s.normalized.energy}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600 dark:bg-white/5 dark:text-white/60">
                        <MdOutlineLocalFireDepartment className="h-3.5 w-3.5 text-amber-500" /> {s.streak}d
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDetalle(s)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-1.5 text-xs font-bold text-navy-700 transition hover:border-gray-300 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                          aria-label="Ver detalle"
                          title="Ver detalle"
                        >
                          <MdOutlineVisibility className="h-4 w-4 text-gray-500 dark:text-white/60" /> Detalle
                        </button>
                        {alertaFila && !alertaFila.resuelta ? (
                          <button
                            type="button"
                            onClick={() => onResolve(alertaFila.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm transition hover:border-emerald-500/50 hover:bg-emerald-100 active:scale-95 dark:border-emerald-400/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                            aria-label="Resolver alerta"
                            title="Marcar alerta como resuelta"
                          >
                            <MdCheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Resolver
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

      <Modal isOpen={!!detalle} onClose={() => setDetalle(null)} title="Detalle de bienestar" width="max-w-xl">
        {detalle ? <PersonDetailBody summary={detalle} alert={alerta} onResolve={onResolve} onClose={() => setDetalle(null)} /> : null}
      </Modal>
    </NexxusCard>
  );
}

const VITALS: Array<{ key: keyof TeamCheckInSummary["normalized"]; label: string; icon: any }> = [
  { key: "energy", label: "Energía", icon: MdOutlineBolt },
  { key: "stress", label: "Estrés", icon: MdOutlineMonitorHeart },
  { key: "sleep", label: "Sueño", icon: MdOutlineBedtime },
  { key: "workload", label: "Carga", icon: MdOutlineLayers },
];

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
  const navigate = useNavigate();
  const { rol } = useAuth();
  const { normalized: n } = summary;
  const pulseTone =
    summary.severity === "riesgo" ? "text-red-500" : summary.severity === "atencion" ? "text-amber-500" : "text-emerald-500";
  const cuidadoPath = ["jefe", "jefe_sector"].includes(rol) ? "/admin/jefe-cuidado-equipo" : "/admin/empresa-cuidado-equipo";

  return (
    <div className="flex flex-col gap-5 py-1">
      {/* Header del empleado */}
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-white/[0.03]">
        <div className="flex items-center gap-3 min-w-0">
          <TeamAvatar nombre={summary.nombre} severidad={summary.severity} size={11} />
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-navy-700 dark:text-white">{summary.nombre}</p>
            <p className="truncate text-xs text-gray-500 dark:text-white/50">
              {summary.departamento || "General"} · {fechaRelativa(summary.checkIn.created_at)}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-2xl font-black leading-none ${pulseTone}`}>{summary.pulse}%</p>
          <p className="mt-1 text-[10.5px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">{summary.pulseState}</p>
        </div>
      </div>

      {/* Alerta si aplica */}
      {alert ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-4 dark:border-red-500/25 dark:bg-red-500/[0.08]">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <MdOutlineFavorite className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-navy-700 dark:text-white">{alert.titulo}</p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${(PRIORIDAD_BADGE[alert.prioridad] || PRIORIDAD_BADGE.media).className}`}>
                  {(PRIORIDAD_BADGE[alert.prioridad] || PRIORIDAD_BADGE.media).label}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-white/70">{alert.cuerpo}</p>
              {alert.resuelta ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                  <MdCheckCircle className="h-3.5 w-3.5" /> Ya marcada como resuelta.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => onResolve(alert.id)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  <MdCheckCircle className="h-4 w-4" /> Marcar como resuelta
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Grid de 5 Métricas Bento */}
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Métricas del Check-in</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {VITALS.map(({ key, label, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 dark:border-white/10 dark:bg-white/[0.02]">
              <Icon className="h-4 w-4 text-brand-500 dark:text-brand-400" />
              <p className="mt-2 text-sm font-bold capitalize text-navy-700 dark:text-white">
                {key === "sleep" || key === "workload" ? `${n[key]}/5` : String(n[key])}
              </p>
              <p className="text-[11px] font-medium text-gray-500 dark:text-white/40">{label}</p>
            </div>
          ))}
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 dark:border-white/10 dark:bg-white/[0.02]">
            <MdOutlineLocalFireDepartment className="h-4 w-4 text-amber-500" />
            <p className="mt-2 text-sm font-bold text-navy-700 dark:text-white">{summary.streak}d</p>
            <p className="text-[11px] font-medium text-gray-500 dark:text-white/40">Racha</p>
          </div>
        </div>
      </div>

      {/* Tags si existen */}
      {n.tags.length ? (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Factores señalados</p>
          <div className="flex flex-wrap gap-2">
            {n.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-brand-500/20 bg-brand-500/[0.04] px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-300">
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Nota opcional */}
      {n.note ? (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Nota del empleado</p>
          <p className="rounded-xl bg-gray-50 p-3.5 text-xs leading-relaxed text-gray-600 dark:bg-white/[0.04] dark:text-white/70">
            "{n.note}"
          </p>
        </div>
      ) : null}

      {/* Botones de acción del modal */}
      <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-white/10">
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate(cuidadoPath);
          }}
          className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline dark:text-brand-300"
        >
          Ver estadísticas completas <MdOutlineArrowForward className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
