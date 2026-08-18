import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "context/AuthContext";
import { supabase } from "supabaseClient/supabaseConfig";
import { subscribeAlertasBienestar } from "services/adminRepository";
import { playAlertChime } from "services/notificationSound";

export type TeamCareAlert = {
  id: string;
  titulo: string;
  cuerpo: string;
  tipo: string;
  prioridad: "baja" | "media" | "alta" | "critica";
  leida: boolean;
  resuelta: boolean;
  usuario_id: string | null;
  datos: Record<string, unknown>;
  created_at: string;
};

type BrowserAlertsPermission = "default" | "granted" | "denied" | "unsupported";

type TeamCareAlertsValue = {
  alerts: TeamCareAlert[];
  unreadCount: number;
  unresolvedCount: number;
  loading: boolean;
  error: string;
  markAsRead: (id: string) => Promise<void>;
  markAsResolved: (id: string) => Promise<void>;
  notificationPermission: BrowserAlertsPermission;
  enableBrowserAlerts: () => Promise<void>;
};

const EMPTY_VALUE: TeamCareAlertsValue = {
  alerts: [],
  unreadCount: 0,
  unresolvedCount: 0,
  loading: false,
  error: "",
  markAsRead: async () => {},
  markAsResolved: async () => {},
  notificationPermission: "unsupported",
  enableBrowserAlerts: async () => {},
};

function readNotificationPermission(): BrowserAlertsPermission {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

const TeamCareAlertsContext = createContext<TeamCareAlertsValue>(EMPTY_VALUE);

// Mismo criterio que es_jefe() en SQL: admin, admin_empresa, jefe, jefe_sector, super_admin.
const ROLES_CON_ACCESO = ["admin", "admin_empresa", "jefe", "jefe_sector", "super_admin"];

function notifyBrowser(alerta: TeamCareAlert) {
  if (typeof window === "undefined" || typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(alerta.titulo || "Alerta de bienestar", {
      body: alerta.cuerpo || "",
      tag: alerta.id,
    });
  } catch {
    // Silencioso: algunos navegadores/entornos bloquean el constructor Notification.
  }
}

// Unica suscripcion realtime a notificaciones tipo='bienestar', compartida por el
// timbre de la navbar y el badge del sidebar (ambos consumen useTeamCareAlerts()).
// Se monta una sola vez en apps/dashboard/src/layouts/admin/index.tsx.
export function TeamCareAlertsProvider({ children }: { children: React.ReactNode }) {
  const { user, rol, empresaId } = useAuth();
  const calificado = ROLES_CON_ACCESO.includes(rol) && !!empresaId;

  const [alerts, setAlerts] = useState<TeamCareAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<BrowserAlertsPermission>(readNotificationPermission);
  // null = todavia no llego la primera carga; una vez llega, se usa para detectar
  // ids nuevos en cargas posteriores y solo entonces disparar sonido/notificacion.
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!calificado) {
      setAlerts([]);
      setLoading(false);
      seenIds.current = null;
      return undefined;
    }
    setLoading(true);
    seenIds.current = null;
    const unsubscribe = subscribeAlertasBienestar(
      empresaId,
      (docs) => {
        const rows = docs.map((d) => d.data()) as TeamCareAlert[];
        setAlerts(rows);
        setLoading(false);
        setError("");

        const currentIds = new Set(rows.map((r) => r.id));
        if (seenIds.current === null) {
          seenIds.current = currentIds;
          return;
        }
        const nuevos = rows.filter((r) => !seenIds.current!.has(r.id));
        seenIds.current = currentIds;
        if (nuevos.length > 0) {
          playAlertChime();
          nuevos.forEach(notifyBrowser);
        }
      },
      (err) => setError(err?.message || "No se pudieron cargar las alertas de bienestar.")
    );
    return unsubscribe;
  }, [calificado, empresaId]);

  // Los navegadores modernos (Chrome en particular) ignoran/bloquean en silencio un
  // Notification.requestPermission() disparado en un useEffect al montar -- sin gesto
  // real del usuario nunca se muestra el prompt, y por la misma razon un AudioContext
  // creado sin interaccion previa queda "suspended" y el sonido nunca se escucha. Por
  // eso esto se expone como una accion explicita (un click real) en vez de automatica.
  const enableBrowserAlerts = async () => {
    playAlertChime();
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      return;
    }
    if (Notification.permission === "default") {
      const resultado = await Notification.requestPermission().catch(() => Notification.permission);
      setNotificationPermission(resultado as BrowserAlertsPermission);
    } else {
      setNotificationPermission(Notification.permission);
    }
  };

  const markAsRead = async (id: string) => {
    const { error: updateError } = await supabase
      .from("notificaciones")
      .update({ leida: true, fecha_lectura: new Date().toISOString() })
      .eq("id", id);
    if (updateError) setError(updateError?.message || "No se pudo marcar la alerta como leída.");
  };

  const markAsResolved = async (id: string) => {
    const { error: updateError } = await supabase
      .from("notificaciones")
      .update({
        resuelta: true,
        resuelta_por: user?.id || null,
        resuelta_en: new Date().toISOString(),
        leida: true,
        fecha_lectura: new Date().toISOString(),
      })
      .eq("id", id);
    if (updateError) setError(updateError?.message || "No se pudo marcar la alerta como resuelta.");
  };

  const value = useMemo<TeamCareAlertsValue>(
    () => ({
      alerts,
      unreadCount: alerts.filter((a) => !a.leida).length,
      unresolvedCount: alerts.filter((a) => !a.resuelta).length,
      loading,
      error,
      markAsRead,
      markAsResolved,
      notificationPermission,
      enableBrowserAlerts,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alerts, loading, error, notificationPermission]
  );

  if (!calificado) {
    return <TeamCareAlertsContext.Provider value={EMPTY_VALUE}>{children}</TeamCareAlertsContext.Provider>;
  }

  return <TeamCareAlertsContext.Provider value={value}>{children}</TeamCareAlertsContext.Provider>;
}

export function useTeamCareAlerts() {
  return useContext(TeamCareAlertsContext);
}
