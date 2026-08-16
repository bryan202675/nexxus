import { useNavigate } from "react-router-dom";
import { MdOutlineFavorite, MdCheckCircle, MdOutlineArrowForward } from "react-icons/md";
import Modal from "components/nexxus/Modal";
import { useAuth } from "context/AuthContext";
import { useTeamCareAlerts, TeamCareAlert } from "context/TeamCareAlertsContext";

const PRIORIDAD_ESTILO: Record<string, { label: string; className: string }> = {
  critica: { label: "Crítica", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
  alta: { label: "Alta", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  media: { label: "Media", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  baja: { label: "Baja", className: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
};

function formatoFechaHora(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-SV", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function AlertDetailModal({ alert, onClose }: { alert: TeamCareAlert | null; onClose: () => void }) {
  const navigate = useNavigate();
  const { rol } = useAuth();
  const { markAsResolved } = useTeamCareAlerts();

  if (!alert) return null;
  const prioridad = PRIORIDAD_ESTILO[alert.prioridad] || PRIORIDAD_ESTILO.media;
  const motivo = typeof alert.datos?.motivo === "string" ? alert.datos.motivo : "";
  const cuidadoPath = ["jefe", "jefe_sector"].includes(rol) ? "/admin/jefe-cuidado-equipo" : "/admin/empresa-cuidado-equipo";

  return (
    <Modal isOpen={!!alert} onClose={onClose} title="Alerta de bienestar" width="max-w-lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <MdOutlineFavorite className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-navy-700 dark:text-white">{alert.titulo}</p>
            <p className="text-xs text-gray-500 dark:text-white/50">{formatoFechaHora(alert.created_at)}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${prioridad.className}`}>
            {prioridad.label}
          </span>
        </div>

        <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-700 dark:bg-white/[0.04] dark:text-white/80">
          {alert.cuerpo}
        </p>

        {motivo ? (
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-500 dark:text-white/50">
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-brand-600 dark:text-brand-300">Motivo: {motivo}</span>
          </div>
        ) : null}

        {alert.resuelta ? (
          <p className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
            <MdCheckCircle className="h-4 w-4" /> Esta alerta ya fue marcada como resuelta.
          </p>
        ) : null}

        <div className="mt-1 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(cuidadoPath);
            }}
            className="flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline dark:text-brand-300"
          >
            Ir a Cuidado del Equipo <MdOutlineArrowForward className="h-4 w-4" />
          </button>
          {!alert.resuelta ? (
            <button
              type="button"
              onClick={async () => {
                await markAsResolved(alert.id);
                onClose();
              }}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Marcar como resuelta
            </button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
