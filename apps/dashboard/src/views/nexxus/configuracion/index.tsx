import { useEffect, useState } from "react";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import { supabase } from "supabaseClient/supabaseConfig";
import { useAuth } from "context/AuthContext";
import { useTheme } from "context/ThemeContext";
import { LANDING_URL } from "services/nexxusLinks";
import NexxusCard from "views/nexxus/components/NexxusCard";
import InputField from "components/fields/InputField";
import Avatar from "components/nexxus/Avatar";

export default function Configuracion() {
  const { user, perfil, signOut } = useAuth();
  const { dark, toggleDark } = useTheme();

  const usaPassword = (user?.app_metadata?.provider || "email") === "email";
  const nombreActual = perfil?.nombre || user?.user_metadata?.full_name || "";
  const foto = perfil?.foto_perfil || user?.user_metadata?.avatar_url || "";

  const [nombre, setNombre] = useState(nombreActual);
  const [nombreMsg, setNombreMsg] = useState("");
  const [guardandoNombre, setGuardandoNombre] = useState(false);

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  const [plataformaConfig, setPlataformaConfig] = useState(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("plataforma_config")
      .select("*")
      .then(({ data, error }) => {
        if (!active || error || !data?.length) return;
        setPlataformaConfig(data);
      });
    return () => {
      active = false;
    };
  }, []);

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
      await supabase.auth.updateUser({ data: { full_name: limpio } });
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
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: passwordActual,
        });
        if (reauthError) throw new Error("La contraseña actual no es correcta.");
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

  const cerrarSesion = async () => {
    await signOut();
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

          {plataformaConfig ? (
            <NexxusCard extra="p-6" delay={150}>
              <h4 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">Configuración de Nexxus</h4>
              <div className="flex flex-col gap-3">
                {plataformaConfig.map((doc) => (
                  <div key={doc.id} className="rounded-xl border border-gray-200 p-3 dark:!border-charcoal-border">
                    <p className="mb-1 text-xs font-bold uppercase text-gray-500 dark:text-white/50">{doc.id}</p>
                    <pre className="whitespace-pre-wrap break-words text-xs text-navy-700 dark:text-white/80">
                      {JSON.stringify(
                        Object.fromEntries(Object.entries(doc).filter(([key]) => key !== "id")),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                ))}
              </div>
            </NexxusCard>
          ) : null}

          <NexxusCard extra="p-6" delay={200}>
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
