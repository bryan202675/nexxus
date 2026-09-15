import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "supabaseClient/supabaseConfig";

export default function ConfirmarCorreo({ correo }: { correo: string }) {
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const confirmar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(codigo)) {
      setError("Ingresa los seis dígitos del código.");
      return;
    }
    setCargando(true);
    setError("");
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({ email: correo, token: codigo, type: "signup" });
      if (verifyError) throw verifyError;
    } catch (err) {
      setError(err instanceof Error ? err.message : "El código no es válido o venció.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <section className="my-16 w-full max-w-md" aria-labelledby="confirmar-correo-title">
      <h1 id="confirmar-correo-title" className="mb-4 text-3xl font-bold text-navy-700 dark:text-white">
        Confirma tu correo
      </h1>
      <p role="status" className="mb-6 text-gray-600 dark:text-white/70">
        Enviamos un código de seis dígitos a {correo}. Escríbelo para confirmar que este correo te pertenece.
      </p>
      <form onSubmit={confirmar}>
        <label className="mb-2 block text-sm font-medium text-navy-700 dark:text-white" htmlFor="confirmar-codigo">Código de verificación</label>
        <input
          autoComplete="one-time-code"
          className="mb-3 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-center text-xl font-bold tracking-[0.45em] outline-none focus:border-brand-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
          id="confirmar-codigo"
          inputMode="numeric"
          maxLength={6}
          onChange={(event) => setCodigo(event.target.value.replace(/\D/g, ""))}
          value={codigo}
        />
        {error ? <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">{error}</p> : null}
        <button disabled={cargando} className="w-full rounded-xl bg-brand-500 px-6 py-3 font-medium text-white hover:bg-brand-600 disabled:opacity-60">
          {cargando ? "Verificando..." : "Confirmar correo"}
        </button>
      </form>
      <Link to="/auth/sa-login" className="mt-4 inline-flex text-sm font-medium text-brand-500 hover:text-brand-600">
        Volver a iniciar sesión
      </Link>
    </section>
  );
}
