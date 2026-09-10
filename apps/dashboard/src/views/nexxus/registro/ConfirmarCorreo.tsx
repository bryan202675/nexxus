import { Link } from "react-router-dom";

export default function ConfirmarCorreo() {
  return (
    <section className="my-16 w-full max-w-md" aria-labelledby="confirmar-correo-title">
      <h1 id="confirmar-correo-title" className="mb-4 text-3xl font-bold text-navy-700 dark:text-white">
        Confirma tu correo
      </h1>
      <p role="status" className="mb-6 text-gray-600 dark:text-white/70">
        Revisa tu bandeja de entrada y la carpeta de spam. Abre el enlace de confirmación
        para continuar con tu empresa. Si ya confirmaste tu correo, inicia sesión con tu cuenta.
      </p>
      <Link to="/auth/sa-login" className="inline-flex rounded-xl bg-brand-500 px-6 py-3 font-medium text-white hover:bg-brand-600">
        Iniciar sesión
      </Link>
    </section>
  );
}
