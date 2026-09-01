import { useState } from "react";
import { Link } from "react-router-dom";
import InputField from "components/fields/InputField";
import { supabase } from "supabaseClient/supabaseConfig";

export default function RecuperarContrasena() {
  const [correo, setCorreo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  const enviarSolicitud = async (event) => {
    event.preventDefault();
    if (!correo.trim()) {
      setError("Ingresa tu correo.");
      return;
    }
    setCargando(true);
    setError("");
    try {
      const { error: invokeError } = await supabase.functions.invoke("solicitar-recuperacion-password", {
        body: {
          correo: correo.trim().toLowerCase(),
          redirectTo: `${window.location.origin}/auth/restablecer-contrasena`,
        },
      });
      if (invokeError) throw invokeError;
      setEnviado(true);
    } catch (err) {
      setError(err?.message || "No se pudo procesar la solicitud. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mt-16 mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
      <form onSubmit={enviarSolicitud} className="mt-[10vh] w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-[420px]">
        <h4 className="mb-2.5 text-4xl font-bold text-navy-700 dark:text-white">Recuperar contraseña</h4>
        <p className="mb-9 ml-1 text-base text-gray-600 dark:text-white/70">
          Ingresa tu correo. Si tu cuenta existe, te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {enviado ? (
          <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-600 dark:bg-green-400/10 dark:text-green-400">
            Si tu cuenta existe, en unos minutos te llegará un enlace para restablecer tu contraseña. Revisa también spam.
          </p>
        ) : (
          <>
            <InputField
              variant="auth"
              extra="mb-3"
              label="Correo*"
              placeholder="admin@nexxus.com"
              id="recuperar-correo"
              type="email"
              autoComplete="username"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
            />

            {error ? (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={cargando}
              className="linear mt-2 w-full rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200"
            >
              {cargando ? "Enviando..." : "Enviar enlace"}
            </button>
          </>
        )}

        <p className="mt-4 text-sm text-gray-600 dark:text-white/70">
          <Link to="/auth/sa-login" className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400">
            Volver a iniciar sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
