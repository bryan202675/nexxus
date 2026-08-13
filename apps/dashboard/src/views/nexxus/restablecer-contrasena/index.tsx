import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "components/fields/InputField";
import { supabase } from "supabaseClient/supabaseConfig";

export default function RestablecerContrasena() {
  const navigate = useNavigate();
  const [sesionLista, setSesionLista] = useState(false);
  const [sesionValida, setSesionValida] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    const { data: subscripcion } = supabase.auth.onAuthStateChange((evento) => {
      if (!activo) return;
      if (evento === "PASSWORD_RECOVERY") {
        setSesionValida(true);
        setSesionLista(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      if (data?.session) setSesionValida(true);
      setSesionLista(true);
    });
    return () => {
      activo = false;
      subscripcion?.subscription?.unsubscribe();
    };
  }, []);

  const guardarNuevaContrasena = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      setError("Usa al menos 8 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas ingresadas son distintas.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      const { error: syncError } = await supabase.functions.invoke("sincronizar-password-interno", {
        body: { password },
      });
      if (syncError) throw syncError;

      setListo(true);
    } catch (err) {
      setError(err?.message || "No se pudo actualizar tu contraseña. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mt-16 mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
      <div className="mt-[10vh] w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-[420px]">
        <h4 className="mb-2.5 text-4xl font-bold text-navy-700 dark:text-white">Nueva contraseña</h4>

        {!sesionLista ? (
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        ) : !sesionValida ? (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
            Este enlace no es válido o ya venció. Pide uno nuevo desde "¿Olvidaste tu contraseña?".
          </p>
        ) : listo ? (
          <>
            <p className="mb-6 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-600 dark:bg-green-400/10 dark:text-green-400">
              Tu contraseña se actualizó. Ya puedes iniciar sesión con la nueva.
            </p>
            <button
              type="button"
              onClick={() => navigate("/auth/sa-login")}
              className="linear w-full rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200"
            >
              Ir a iniciar sesión
            </button>
          </>
        ) : (
          <form onSubmit={guardarNuevaContrasena}>
            <InputField
              variant="auth"
              extra="mb-3"
              label="Contraseña nueva*"
              placeholder="Mínimo 8 caracteres"
              id="restablecer-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <InputField
              variant="auth"
              extra="mb-3"
              label="Confirmar contraseña*"
              placeholder="Repite la contraseña"
              id="restablecer-confirmar"
              type="password"
              autoComplete="new-password"
              value={confirmar}
              onChange={(event) => setConfirmar(event.target.value)}
            />

            {error ? (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={guardando}
              className="linear mt-2 w-full rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200"
            >
              {guardando ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
