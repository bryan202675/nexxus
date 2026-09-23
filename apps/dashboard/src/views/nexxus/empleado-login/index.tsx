import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import InputField from "components/fields/InputField";
import { supabase } from "supabaseClient/supabaseConfig";
import { useAuth } from "context/AuthContext";
import { routeUrl } from "utils/routePath";
import { traducirErrorAuth } from "services/registro";

export default function EmpleadoLogin() {
  const navigate = useNavigate();
  const { user, loading: authLoading, rol, esSuperAdmin, esAdminEmpresa, esWorkspaceUser } = useAuth();
  
  const [codigoEmpresa, setCodigoEmpresa] = useState("");
  const [usuario, setUsuario] = useState("");
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

  const entrarComoEmpleado = async (event) => {
    event.preventDefault();
    if (cargando) return;
    if (!codigoEmpresa || !usuario || !password) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setCargando(true);
    setError("");

    try {
      // 1. Obtener el correo con login_empresarial
      const { data, error: rpcError } = await supabase.rpc("login_empresarial", {
        p_codigo_empresa: codigoEmpresa.trim(),
        p_usuario: usuario.trim(),
        p_password: password
      });

      if (rpcError) throw rpcError;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      const correo = data?.correo;
      if (!correo) {
        throw new Error("No se pudo obtener el correo asociado a este usuario.");
      }

      // 2. Iniciar sesión en auth usando el correo devuelto
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: correo,
        password,
      });

      if (signInError) throw signInError;
      
    } catch (err) {
      setError(traducirErrorAuth(err));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mt-16 mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
      <form onSubmit={entrarComoEmpleado} className="mt-[10vh] w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-[420px]">
        <div className="mb-6 flex justify-center lg:justify-start">
          <img src="/isoNexxusBlack.png" alt="Nexxus Logo" className="h-16 w-auto object-contain dark:hidden" />
          <img src="/isoNexxus.png" alt="Nexxus Logo" className="hidden h-16 w-auto object-contain dark:block" />
        </div>
        <h4 className="mb-2.5 text-4xl font-bold text-navy-700 dark:text-white">
          Acceso Empleados
        </h4>
        <p className="mb-9 ml-1 text-base text-gray-600 dark:text-white/70">
          Ingresa con tu código de empresa y usuario interno.
        </p>

        <InputField
          variant="auth"
          extra="mb-3"
          label="Código de la empresa*"
          placeholder="NEXX-1234"
          id="empleado-codigo"
          type="text"
          value={codigoEmpresa}
          onChange={(event) => setCodigoEmpresa(event.target.value)}
        />
        
        <InputField
          variant="auth"
          extra="mb-3"
          label="Usuario*"
          placeholder="tu.usuario"
          id="empleado-usuario"
          type="text"
          autoComplete="username"
          value={usuario}
          onChange={(event) => setUsuario(event.target.value)}
        />
        
        <InputField
          variant="auth"
          extra="mb-3"
          label="Contraseña*"
          placeholder="Tu contraseña"
          id="empleado-password"
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

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="h-px w-full bg-gray-200 dark:bg-navy-700" />
          <Link
            to="/auth/sa-login"
            className="flex h-[50px] w-full items-center justify-center rounded-xl border border-gray-200 bg-transparent text-sm font-medium text-navy-700 transition duration-200 hover:bg-gray-100 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
          >
            Volver a inicio de sesión
          </Link>
        </div>
      </form>
    </div>
  );
}
