import { useEffect, useState } from "react";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import { supabase } from "supabaseClient/supabaseConfig";
import { subscribeConfiguracionEmpresa } from "services/adminRepository";
import { useAuth } from "context/AuthContext";
import { useTheme } from "context/ThemeContext";
import { useEmpresaPlan, FEATURE_LABELS } from "services/planEnforcement";
import { LANDING_URL } from "services/nexxusLinks";
import NexxusCard from "views/nexxus/components/NexxusCard";
import InputField from "components/fields/InputField";
import Avatar from "components/nexxus/Avatar";

const DEFAULT_ASISTENCIA = {
  horaEntrada: "08:00",
  horaSalida: "17:00",
  toleranciaMinutos: 10,
  horasEsperadas: 8,
};

export default function ConfiguracionAdmin() {
  const { user, perfil, empresaId, signOut } = useAuth();
  const { dark, toggleDark } = useTheme();
  const { plan, planFeatures, planLimits, subscriptionStatus: estadoPlan } = useEmpresaPlan();

  const usaPassword = !user?.app_metadata?.providers?.includes("google") || user?.app_metadata?.providers?.includes("email");
  const nombreActual = perfil?.nombre || user?.user_metadata?.displayName || "";
  const foto = perfil?.foto_perfil || "";

  const [nombre, setNombre] = useState(nombreActual);
  const [nombreMsg, setNombreMsg] = useState("");
  const [guardandoNombre, setGuardandoNombre] = useState(false);

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  const [asistencia, setAsistencia] = useState(DEFAULT_ASISTENCIA);
  const [cargandoAsistencia, setCargandoAsistencia] = useState(true);
  const [errorAsistencia, setErrorAsistencia] = useState("");
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false);
  const [asistenciaMsg, setAsistenciaMsg] = useState("");

  useEffect(() => {
    if (!empresaId) return undefined;
    setCargandoAsistencia(true);
    setErrorAsistencia("");
    const unsub = subscribeConfiguracionEmpresa(
      empresaId,
      (snap) => {
        const data = snap.data ? snap.data() : undefined;
        setAsistencia({ ...DEFAULT_ASISTENCIA, ...(data?.configuracion?.asistencia || {}) });
        setCargandoAsistencia(false);
      },
      (err) => {
        setErrorAsistencia(err.message || "No se pudo cargar el horario de asistencia.");
        setCargandoAsistencia(false);
      }
    );
    return () => unsub();
  }, [empresaId]);

  const guardarNombre = async (event) => {
    event.preventDefault();
    const limpio = nombre.trim();
    if (limpio.length < 3) {
      setNombreMsg("El nombre debe tener al menos 3 caracteres.");
      return;
    }
    setGuardandoNombre(true);
    setNombreMsg("");
    try {
      const { error } = await supabase.from("usuarios").update({ nombre: limpio }).eq("id", user.id);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { displayName: limpio } });
      setNombreMsg("Nombre actualizado.");
    } catch (err) {
      setNombreMsg(err.message || "No se pudo actualizar el nombre.");
    } finally {
      setGuardandoNombre(false);
    }
  };

  const cambiarPassword = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMsg("");
    if (passwordNueva.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (usaPassword && !passwordActual) {
      setPasswordError("Ingresa tu contraseña actual para confirmar el cambio.");
      return;
    }
    setGuardandoPassword(true);
    try {
      if (usaPassword) {
        // Confirma la contraseña actual re-autenticando antes de cambiarla
        // (Supabase no exige esto para updateUser, pero se mantiene el mismo
        // chequeo explícito que tenía la versión Firebase).
        const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password: passwordActual });
        if (reauthError) throw reauthError;
      }
      const { error } = await supabase.auth.updateUser({ password: passwordNueva });
      if (error) throw error;
      setPasswordMsg("Contraseña actualizada.");
      setPasswordActual("");
      setPasswordNueva("");
    } catch (err) {
      setPasswordError(err.message || "No se pudo cambiar la contraseña.");
    } finally {
      setGuardandoPassword(false);
    }
  };

  const guardarAsistencia = async (event) => {
    event.preventDefault();
    if (!empresaId) return;
    setGuardandoAsistencia(true);
    setAsistenciaMsg("");
    setErrorAsistencia("");
    try {
      const { data: current } = await supabase.from("configuraciones_empresa").select("configuracion").eq("empresa_id", empresaId).maybeSingle();
      const { error } = await supabase.from("configuraciones_empresa").upsert({
        empresa_id: empresaId,
        configuracion: {
          ...(current?.configuracion || {}),
          asistencia: {
            horaEntrada: asistencia.horaEntrada,
            horaSalida: asistencia.horaSalida,
            toleranciaMinutos: Number(asistencia.toleranciaMinutos),
            horasEsperadas: Number(asistencia.horasEsperadas),
          },
          updatedBy: user.id,
        },
      });
      if (error) throw error;
      setAsistenciaMsg("Horario actualizado.");
    } catch (err) {
      setErrorAsistencia(err.message || "No se pudo guardar el horario.");
    } finally {
      setGuardandoAsistencia(false);
    }
  };

  const cerrarSesion = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
    window.location.assign(LANDING_URL);
  };


  return (
    <div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <NexxusCard extra="p-6" delay={0}>
          <h4 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">Tu cuenta</h4>
          <div className="mb-5 flex items-center gap-3">
            <Avatar src={foto} name={nombreActual} size={14} />
            <div>
              <p className="text-sm font-bold text-navy-700 dark:text-white">{nombreActual}</p>
              <p className="text-xs text-gray-500 dark:text-white/60">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={guardarNombre} className="mb-6">
            <InputField
              label="Nombre"
              id="config-nombre"
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
            />
            {nombreMsg ? (
              <p className="mt-2 text-xs font-medium text-gray-600 dark:text-white/70">{nombreMsg}</p>
            ) : null}
            <button
              type="submit"
              disabled={guardandoNombre}
              className="mt-3 rounded-xl bg-brand-500 px-5 py-2 text-sm font-medium text-white transition duration-250 hover:bg-brand-600 disabled:opacity-50 dark:bg-brand-400 dark:hover:bg-brand-300"
            >
              {guardandoNombre ? "Guardando..." : "Guardar nombre"}
            </button>
          </form>

          <form onSubmit={cambiarPassword}>
            <h5 className="mb-2 text-sm font-bold text-navy-700 dark:text-white">
              {usaPassword ? "Cambiar contraseña" : "Crear contraseña"}
            </h5>
            {usaPassword ? (
              <InputField
                variant="auth"
                extra="mb-3"
                label="Contraseña actual"
                id="config-password-actual"
                type="password"
                autoComplete="current-password"
                value={passwordActual}
                onChange={(event) => setPasswordActual(event.target.value)}
              />
            ) : (
              <p className="mb-3 text-xs text-gray-500 dark:text-white/60">
                Tu cuenta usa Google. Para crear una contraseña se te pedirá confirmar con Google primero.
              </p>
            )}
            <InputField
              variant="auth"
              extra="mb-3"
              label="Contraseña nueva"
              id="config-password-nueva"
              type="password"
              autoComplete="new-password"
              value={passwordNueva}
              onChange={(event) => setPasswordNueva(event.target.value)}
            />
            {passwordError ? (
              <p className="mb-2 text-xs font-medium text-red-500 dark:text-red-400">{passwordError}</p>
            ) : null}
            {passwordMsg ? (
              <p className="mb-2 text-xs font-medium text-gray-600 dark:text-white/70">{passwordMsg}</p>
            ) : null}
            <button
              type="submit"
              disabled={guardandoPassword}
              className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-medium text-white transition duration-250 hover:bg-brand-600 disabled:opacity-50 dark:bg-brand-400 dark:hover:bg-brand-300"
            >
              {guardandoPassword ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        </NexxusCard>

        <div className="flex flex-col gap-5">
          <NexxusCard extra="p-6" delay={100}>
            <h4 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">Apariencia</h4>
            <button
              type="button"
              onClick={toggleDark}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-navy-700 transition-colors duration-250 hover:bg-gray-50 dark:!border-charcoal-border dark:text-white dark:hover:bg-charcoal-light"
            >
              <span>Modo {dark ? "oscuro" : "claro"}</span>
              {dark ? <RiSunFill className="h-5 w-5" /> : <RiMoonFill className="h-5 w-5" />}
            </button>
          </NexxusCard>

          <NexxusCard extra="p-6" delay={150}>
            <h4 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">Horario de asistencia</h4>
            {cargandoAsistencia ? (
              <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando horario...</p>
            ) : (
              <form onSubmit={guardarAsistencia}>
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="config-hora-entrada"
                      className="mb-1 block text-xs font-bold text-navy-700 dark:text-white"
                    >
                      Hora de entrada
                    </label>
                    <input
                      id="config-hora-entrada"
                      type="time"
                      value={asistencia.horaEntrada}
                      onChange={(event) =>
                        setAsistencia((prev) => ({ ...prev, horaEntrada: event.target.value }))
                      }
                      className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm text-navy-700 outline-none dark:!border-charcoal-border dark:text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="config-hora-salida"
                      className="mb-1 block text-xs font-bold text-navy-700 dark:text-white"
                    >
                      Hora de salida
                    </label>
                    <input
                      id="config-hora-salida"
                      type="time"
                      value={asistencia.horaSalida}
                      onChange={(event) =>
                        setAsistencia((prev) => ({ ...prev, horaSalida: event.target.value }))
                      }
                      className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm text-navy-700 outline-none dark:!border-charcoal-border dark:text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="config-tolerancia"
                      className="mb-1 block text-xs font-bold text-navy-700 dark:text-white"
                    >
                      Tolerancia (min)
                    </label>
                    <input
                      id="config-tolerancia"
                      type="number"
                      min="0"
                      value={asistencia.toleranciaMinutos}
                      onChange={(event) =>
                        setAsistencia((prev) => ({ ...prev, toleranciaMinutos: Number(event.target.value) }))
                      }
                      className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm text-navy-700 outline-none dark:!border-charcoal-border dark:text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="config-horas-esperadas"
                      className="mb-1 block text-xs font-bold text-navy-700 dark:text-white"
                    >
                      Horas esperadas
                    </label>
                    <input
                      id="config-horas-esperadas"
                      type="number"
                      min="0"
                      value={asistencia.horasEsperadas}
                      onChange={(event) =>
                        setAsistencia((prev) => ({ ...prev, horasEsperadas: Number(event.target.value) }))
                      }
                      className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm text-navy-700 outline-none dark:!border-charcoal-border dark:text-white"
                    />
                  </div>
                </div>
                {errorAsistencia ? (
                  <p className="mb-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
                    {errorAsistencia}
                  </p>
                ) : null}
                {asistenciaMsg ? (
                  <p className="mb-2 text-xs font-medium text-gray-600 dark:text-white/70">{asistenciaMsg}</p>
                ) : null}
                <button
                  type="submit"
                  disabled={guardandoAsistencia}
                  className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-medium text-white transition duration-250 hover:bg-brand-600 disabled:opacity-50 dark:bg-brand-400 dark:hover:bg-brand-300"
                >
                  {guardandoAsistencia ? "Guardando..." : "Guardar horario"}
                </button>
              </form>
            )}
          </NexxusCard>

          <NexxusCard extra="p-6" delay={200}>
            <h4 className="mb-1 text-lg font-bold text-navy-700 dark:text-white">Plan: {plan}</h4>
            <p className="mb-4 text-xs font-medium text-gray-500 dark:text-white/50">Estado: {estadoPlan}</p>

            <p className="mb-2 text-xs font-bold uppercase text-gray-500 dark:text-white/40">Límites</p>
            <ul className="mb-4 grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-navy-700 dark:text-white/80">
              <li>Empleados: {planLimits.employees ?? "Ilimitado"}</li>
              <li>Departamentos: {planLimits.departments ?? "Ilimitado"}</li>
              <li>Sedes: {planLimits.branches ?? "Ilimitado"}</li>
              <li>Almacenamiento: {planLimits.storageGb} GB</li>
              <li>Consultas IA/mes: {planLimits.aiRequestsMonthly}</li>
            </ul>

            <p className="mb-2 text-xs font-bold uppercase text-gray-500 dark:text-white/40">Funciones incluidas</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                <span
                  key={key}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    planFeatures[key]
                      ? "bg-green-50 text-green-600 dark:bg-green-400/10 dark:text-green-400"
                      : "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/30"
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          </NexxusCard>

          <NexxusCard extra="p-6" delay={250}>
            <h4 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">Sesión</h4>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => window.location.assign(LANDING_URL)}
                className="w-full rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-navy-700 transition duration-250 hover:bg-gray-50 dark:!border-charcoal-border dark:text-white dark:hover:bg-charcoal-light"
              >
                Volver a la landing
              </button>
              <button
                type="button"
                onClick={cerrarSesion}
                className="w-full rounded-xl bg-red-500 px-5 py-2 text-sm font-medium text-white transition duration-250 hover:bg-red-600"
              >
                Cerrar sesión y salir a la landing
              </button>
            </div>
          </NexxusCard>
        </div>
      </div>
    </div>
  );
}
