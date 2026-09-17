import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputField from "components/fields/InputField";
import { supabase } from "supabaseClient/supabaseConfig";

type Step = "solicitar" | "verificar" | "nueva-contrasena";

function mensajeErrorCodigo(error: unknown): string {
  const mensaje = error instanceof Error ? error.message.toLowerCase() : "";
  if (mensaje.includes("token has expired") || mensaje.includes("token is invalid")) {
    return "El código no es válido o venció. Solicita uno nuevo e inténtalo otra vez.";
  }
  return "No se pudo verificar el código. Solicita uno nuevo e inténtalo otra vez.";
}

export default function RecuperarContrasena() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [correoVerificacion, setCorreoVerificacion] = useState("");
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [paso, setPaso] = useState<Step>("solicitar");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const solicitarCodigo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(correo.trim())) return setError("Ingresa un correo válido.");
    setCargando(true); setError("");
    try {
      const correoNormalizado = correo.trim().toLowerCase();
      const { data, error: invokeError } = await supabase.functions.invoke("solicitar-recuperacion-password", { body: { correo: correoNormalizado } });
      if (invokeError) throw invokeError;
      if (!data?.enviado || typeof data.correoVerificacion !== "string") {
        throw new Error("No se pudo enviar el código.");
      }
      const correoAuth = typeof data === "object" && data !== null && "correoVerificacion" in data && typeof data.correoVerificacion === "string"
        ? data.correoVerificacion
        : correoNormalizado;
      setCorreo(correoNormalizado);
      setCorreoVerificacion(correoAuth);
      setPaso("verificar");
    } catch (err) {
      setError("No se pudo enviar el código. Intenta de nuevo más tarde.");
    } finally { setCargando(false); }
  };

  const verificarCodigo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(codigo)) return setError("Ingresa los seis dígitos del código.");
    setCargando(true); setError("");
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({ email: correoVerificacion, token: codigo, type: "recovery" });
      if (verifyError) throw verifyError;
      setPaso("nueva-contrasena");
    } catch (err) {
      setError(mensajeErrorCodigo(err));
    } finally { setCargando(false); }
  };

  const guardarContrasena = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8) return setError("Usa al menos 8 caracteres.");
    if (password !== confirmar) return setError("Las contraseñas ingresadas son distintas.");
    setCargando(true); setError("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      const { error: syncError } = await supabase.functions.invoke("sincronizar-password-interno", { body: { password } });
      if (syncError) throw syncError;
      await supabase.auth.signOut();
      navigate("/auth/sa-login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar tu contraseña. Intenta de nuevo.");
    } finally { setCargando(false); }
  };

  const title = paso === "solicitar" ? "Recuperar contraseña" : paso === "verificar" ? "Confirma el código" : "Nueva contraseña";
  const subtitle = paso === "solicitar" ? "Te enviaremos un código de seis dígitos si la cuenta existe." : paso === "verificar" ? `Escribe el código enviado a ${correo}.` : "Elige una contraseña nueva para tu cuenta.";
  const submit = paso === "solicitar" ? solicitarCodigo : paso === "verificar" ? verificarCodigo : guardarContrasena;
  const buttonText = paso === "solicitar" ? "Enviar código" : paso === "verificar" ? "Verificar código" : "Guardar contraseña";

  return <div className="mt-16 mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
    <form onSubmit={submit} className="mt-[10vh] w-full max-w-full md:pl-4 lg:pl-0 xl:max-w-[420px]">
      <h4 className="mb-2.5 text-4xl font-bold text-navy-700 dark:text-white">{title}</h4>
      <p className="mb-9 ml-1 text-base text-gray-600 dark:text-white/70">{subtitle}</p>
      {paso === "solicitar" ? <InputField variant="auth" extra="mb-3" label="Correo*" placeholder="admin@nexxus.com" id="recuperar-correo" type="email" autoComplete="username" value={correo} onChange={(event) => setCorreo(event.target.value)} /> : null}
      {paso === "verificar" ? <input autoComplete="one-time-code" className="mb-3 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-center text-xl font-bold tracking-[0.45em] outline-none focus:border-brand-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" inputMode="numeric" maxLength={6} onChange={(event) => setCodigo(event.target.value.replace(/\D/g, ""))} placeholder="000000" value={codigo} /> : null}
      {paso === "nueva-contrasena" ? <><InputField variant="auth" extra="mb-3" label="Contraseña nueva*" placeholder="Mínimo 8 caracteres" id="restablecer-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /><InputField variant="auth" extra="mb-3" label="Confirmar contraseña*" placeholder="Repite tu contraseña" id="restablecer-confirmar" type="password" autoComplete="new-password" value={confirmar} onChange={(event) => setConfirmar(event.target.value)} /></> : null}
      {error ? <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">{error}</p> : null}
      <button type="submit" disabled={cargando} className="linear mt-2 w-full rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-400 dark:text-white">{cargando ? "Procesando..." : buttonText}</button>
      {paso === "verificar" ? <button className="mt-4 w-full text-sm font-medium text-brand-500" onClick={() => { setPaso("solicitar"); setCodigo(""); setError(""); }} type="button">Usar otro correo</button> : null}
      <p className="mt-4 text-sm text-gray-600 dark:text-white/70"><Link to="/auth/sa-login" className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400">Volver a iniciar sesión</Link></p>
    </form>
  </div>;
}
