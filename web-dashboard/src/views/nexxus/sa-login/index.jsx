import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import InputField from "components/fields/InputField";
import { auth, db } from "firebaseClient/firebaseConfig";

const FB_ERRORS = {
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "Correo o contraseña incorrectos.",
  "auth/wrong-password": "Correo o contraseña incorrectos.",
  "auth/too-many-requests": "Demasiados intentos. Intenta de nuevo más tarde.",
  "auth/popup-closed-by-user": "Ventana de Google cerrada antes de terminar.",
};

const traducirError = (codigo) => FB_ERRORS[codigo] || "No se pudo iniciar sesión. Intenta de nuevo.";

export default function SaLogin() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const continuarSegunRol = async (uid) => {
    const snap = await getDoc(doc(db, "usuarios", uid));
    const rol = snap.exists() ? String(snap.data()?.rol || snap.data()?.role || "").trim().toLowerCase() : "";
    if (rol === "super_admin") {
      navigate("/admin/nexxus-superadmin", { replace: true });
      return;
    }
    if (rol === "admin" || rol === "admin_empresa") {
      navigate("/admin/empresa-resumen", { replace: true });
      return;
    }
    await signOut(auth);
    setError("Esta cuenta no tiene permisos de Super Admin ni de Admin de empresa.");
  };

  const entrarConCorreo = async (event) => {
    event.preventDefault();
    if (!correo || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    setCargando(true);
    setError("");
    try {
      const credencial = await signInWithEmailAndPassword(auth, correo.trim().toLowerCase(), password);
      await continuarSegunRol(credencial.user.uid);
    } catch (err) {
      setError(traducirError(err.code));
    } finally {
      setCargando(false);
    }
  };

  const entrarConGoogle = async () => {
    setCargando(true);
    setError("");
    try {
      const proveedor = new GoogleAuthProvider();
      proveedor.setCustomParameters({ prompt: "select_account" });
      const credencial = await signInWithPopup(auth, proveedor);
      await continuarSegunRol(credencial.user.uid);
    } catch (err) {
      setError(traducirError(err.code));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mt-16 mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
      <form onSubmit={entrarConCorreo} className="mt-[10vh] w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-[420px]">
        <h4 className="mb-2.5 text-4xl font-bold text-navy-700 dark:text-white">
          Nexxus Workspace
        </h4>
        <p className="mb-9 ml-1 text-base text-gray-600">
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
          ¿No tienes cuenta?{" "}
          <Link to="/auth/registro" className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400">
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  );
}
