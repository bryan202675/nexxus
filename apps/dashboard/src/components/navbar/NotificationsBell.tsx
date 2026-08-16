import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdOutlineNotificationsActive, MdOutlineVolumeUp, MdClose } from "react-icons/md";
import Dropdown from "components/dropdown";
import { useAuth } from "context/AuthContext";
import { useTeamCareAlerts, TeamCareAlert } from "context/TeamCareAlertsContext";
import AlertDetailModal from "./AlertDetailModal";

const PRIORIDAD_DOT: Record<string, string> = {
  critica: "bg-red-500",
  alta: "bg-orange-500",
  media: "bg-blue-500",
  baja: "bg-gray-400",
};

function tiempoRelativo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutos = Math.round(diffMs / 60000);
  if (minutos < 1) return "ahora";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return `hace ${dias} d`;
}

// Timbre de alertas de bienestar en la navbar. Reutiliza el mismo componente
// Dropdown que ya usa el menu del avatar de perfil (components/navbar/index.tsx).
export default function NotificationsBell() {
  const navigate = useNavigate();
  const { rol } = useAuth();
  const { alerts, unreadCount, markAsRead, notificationPermission, enableBrowserAlerts } = useTeamCareAlerts();
  const [detalle, setDetalle] = useState<TeamCareAlert | null>(null);
  const [bannerDescartado, setBannerDescartado] = useState(false);

  const cuidadoPath = ["jefe", "jefe_sector"].includes(rol) ? "/admin/jefe-cuidado-equipo" : "/admin/empresa-cuidado-equipo";
  const recientes = alerts.slice(0, 8);
  const mostrarBannerActivar = notificationPermission === "default" && !bannerDescartado;

  const abrirDetalle = (alerta: TeamCareAlert) => {
    if (!alerta.leida) void markAsRead(alerta.id);
    setDetalle(alerta);
  };

  return (
    <>
      <Dropdown
        button={
          <span className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 dark:text-white dark:hover:bg-navy-700">
            <MdOutlineNotificationsActive className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </span>
        }
        children={
          <div className="flex w-80 flex-col rounded-[20px] bg-white shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
            <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-white/10">
              <p className="text-sm font-bold text-navy-700 dark:text-white">Alertas de bienestar</p>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-500">{unreadCount} sin leer</span>
              ) : null}
            </div>
            {mostrarBannerActivar ? (
              <div className="flex items-start gap-2.5 border-b border-gray-100 bg-brand-500/5 px-4 py-3 dark:border-white/10 dark:bg-brand-400/10">
                <MdOutlineVolumeUp className="mt-0.5 h-4 w-4 shrink-0 text-brand-500 dark:text-brand-300" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-navy-700 dark:text-white">Activa el sonido y las notificaciones del navegador</p>
                  <p className="mt-0.5 text-[11px] text-gray-500 dark:text-white/50">Así te enteras al instante aunque no tengas esta pestaña abierta.</p>
                  <button
                    type="button"
                    onClick={() => void enableBrowserAlerts()}
                    className="mt-2 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-600"
                  >
                    Activar
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setBannerDescartado(true)}
                  className="shrink-0 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10"
                  aria-label="Descartar"
                >
                  <MdClose className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
            <div className="max-h-96 overflow-y-auto">
              {recientes.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 dark:text-white/50">Sin alertas activas. Todo tranquilo en el equipo.</p>
              ) : (
                recientes.map((alerta) => (
                  <button
                    type="button"
                    key={alerta.id}
                    onClick={() => abrirDetalle(alerta)}
                    className="flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5"
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PRIORIDAD_DOT[alerta.prioridad] || PRIORIDAD_DOT.media}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={`truncate text-sm ${alerta.leida ? "font-medium text-gray-600 dark:text-white/70" : "font-bold text-navy-700 dark:text-white"}`}>
                          {alerta.titulo}
                        </span>
                        {alerta.resuelta ? (
                          <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                            Resuelta
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-white/50">{alerta.cuerpo}</span>
                      <span className="mt-1 block text-[11px] text-gray-400 dark:text-white/40">{tiempoRelativo(alerta.created_at)}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate(cuidadoPath)}
              className="border-t border-gray-100 p-3 text-center text-xs font-bold text-brand-600 hover:underline dark:border-white/10 dark:text-brand-300"
            >
              Ver todo en Cuidado del Equipo
            </button>
          </div>
        }
        classNames={"py-2 top-11 right-0 w-80"}
      />
      <AlertDetailModal alert={detalle} onClose={() => setDetalle(null)} />
    </>
  );
}
