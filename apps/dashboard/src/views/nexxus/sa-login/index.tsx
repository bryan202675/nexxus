import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import InputField from "components/fields/InputField";
import { supabase } from "supabaseClient/supabaseConfig";
import { useAuth } from "context/AuthContext";
import { routeUrl } from "utils/routePath";
import { traducirErrorAuth } from "services/registro";

export default function SaLogin() {
  const navigate = useNavigate();
  const { user, loading: authLoading, rol, esSuperAdmin, esAdminEmpresa, esWorkspaceUser } = useAuth();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const evaluarNavegacion = useCallback(() => {
    if (!user) return;
    if (esSuperAdmin) {
      navigate(routeUrl("/admin", "nexxus-superadmin"), { replace: true });
      return;
    }
    if (esAdminEmpresa) {
      navigate(routeUrl("/admin", "empresa-resumen"), { replace: true });
      return;
    }
    if (esWorkspaceUser) {
      navigate(["jefe", "jefe_sector"].includes(rol) ? routeUrl("/admin", "jefe-resumen") : routeUrl("/admin", "empleado-resumen"), { replace: true });
      return;
    }
    if (!rol) {
      // Si el usuario inicio sesion con Google pero no ha completado el registro de empresa
      navigate("/auth/registro", { replace: true });
      return;
    }
    supabase.auth.signOut();
    setError("Esta cuenta no tiene permisos para acceder al workspace.");
  }, [user, rol, esSuperAdmin, esAdminEmpresa, esWorkspaceUser, navigate]);

  useEffect(() => {
    if (!authLoading && user) {
      evaluarNavegacion();
    }
  }, [user, authLoading, evaluarNavegacion]);

  const entrarConCorreo = async (event) => {
    event.preventDefault();
    if (cargando) return;
    if (!correo || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    setCargando(true);
    setError("");
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: correo.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;
    } catch (err) {
      setError(traducirErrorAuth(err));
    } finally {
      setCargando(false);
    }
  };

  const entrarConGoogle = async () => {
    setCargando(true);
    setError("");
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // El dashboard vive bajo /workspace (ver basename en index.tsx y
          // services/nexxusLinks.ts) -- sin el prefijo, al volver de Google
          // React Router no encuentra ninguna ruta y la pantalla queda en blanco.
          redirectTo: `${window.location.origin}/auth/sa-login`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(traducirErrorAuth(err));
      setCargando(false);
    }
  };

  return (
    <div className="mt-16 mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
      <form onSubmit={entrarConCorreo} className="mt-[10vh] w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-[420px]">
        <div className="mb-6 flex justify-center lg:justify-start">
          <img src="/isoNexxusBlack.png" alt="Nexxus Logo" className="h-16 w-auto object-contain dark:hidden" />
          <img src="/isoNexxus.png" alt="Nexxus Logo" className="hidden h-16 w-auto object-contain dark:block" />
        </div>
        <h4 className="mb-2.5 text-4xl font-bold text-navy-700 dark:text-white">
          Nexxus Workspace
        </h4>
        <p className="mb-9 ml-1 text-base text-gray-600 dark:text-white/70">
          Inicia sesión con tu cuenta de Nexxus para entrar a tu panel.
        </p>
        <button
          type="button"
          onClick={entrarConGoogle}
          disabled={cargando}
          className="mb-6 flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-lightPrimary hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 dark:bg-navy-800"
        >
          <div className="rounded-full text-xl">
            <FcGoogle />
          </div>
          <h5 className="text-sm font-medium text-navy-700 dark:text-white">
            Continuar con Google
          </h5>
        </button>
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px w-full bg-gray-200 dark:bg-navy-700" />
          <p className="text-base text-gray-600 dark:text-white"> o </p>
          <div className="h-px w-full bg-gray-200 dark:bg-navy-700" />
        </div>

        <InputField
          variant="auth"
          extra="mb-3"
          label="Correo*"
          placeholder="admin@nexxus.com"
          id="sa-login-email"
          type="email"
          autoComplete="username"
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
        />
        <InputField
          variant="auth"
          extra="mb-3"
          label="Contraseña*"
          placeholder="Tu contraseña"
          id="sa-login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
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
          {cargando ? "Entrando..." : "Entrar"}
        </button>

        <p className="mt-4 text-sm text-gray-600 dark:text-white/70">
          <Link to="/auth/recuperar-contrasena" className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

        <p className="mt-2 text-sm text-gray-600 dark:text-white/70">
          ¿No tienes cuenta?{" "}
          <Link to="/auth/registro" className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400">
            Regístrate
          </Link>
        </p>

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="h-px w-full bg-gray-200 dark:bg-navy-700" />
          <Link
            to="/auth/empleado-login"
            className="flex h-[50px] w-full items-center justify-center rounded-xl border border-gray-200 bg-transparent text-sm font-medium text-navy-700 transition duration-200 hover:bg-gray-100 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
          >
            Ingresar como empleado
          </Link>
        </div>
      </form>
    </div>
  );
}
