import React, { useEffect, useState, useMemo } from "react";
import {
  MdOutlinePerson,
  MdOutlineEmail,
  MdOutlineShield,
  MdOutlineVpnKey,
  MdOutlineLock,
  MdOutlineVisibility,
  MdOutlineVisibilityOff,
  MdOutlineCheckCircle,
  MdOutlineErrorOutline,
  MdOutlineContentCopy,
  MdOutlineCheck,
  MdOutlinePalette,
  MdOutlineRefresh,
  MdOutlineExitToApp,
  MdOutlineOpenInNew,
  MdOutlineTune,
  MdOutlineAdminPanelSettings,
  MdOutlineFingerprint,
  MdOutlineCloudDone,
  MdOutlineInfo,
  MdOutlineSpeed,
  MdOutlineCode,
} from "react-icons/md";
import { RiSunFill, RiMoonFill } from "react-icons/ri";

import { supabase } from "supabaseClient/supabaseConfig";
import { useAuth } from "context/AuthContext";
import { useTheme } from "context/ThemeContext";
import { LANDING_URL } from "services/nexxusLinks";
import NexxusCard from "views/nexxus/components/NexxusCard";
import Avatar from "components/nexxus/Avatar";

// Formateador de nombres de clave para plataforma_config
function formatoClave(clave: string) {
  const texto = String(clave || "").replace(/_/g, " ").trim();
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "Sin clave";
}

function esObjetoSimple(valor: any) {
  return (
    valor &&
    typeof valor === "object" &&
    !Array.isArray(valor) &&
    Object.values(valor).every((v) => v === null || ["string", "number", "boolean"].includes(typeof v))
  );
}

export default function Configuracion() {
  const { user, perfil, signOut } = useAuth();
  const { dark, toggleDark } = useTheme();

  const usaPassword = (user?.app_metadata?.provider || "email") === "email";
  const nombreActual =
    perfil?.nombre || user?.user_metadata?.full_name || user?.user_metadata?.displayName || "Super Admin Nexxus";
  const emailActual = user?.email || "nexxusadmin@nexxus.com";
  const foto = perfil?.foto_perfil || user?.user_metadata?.avatar_url || "";

  // Estado del formulario de Nombre
  const [nombre, setNombre] = useState(nombreActual);
  const [nombreMsg, setNombreMsg] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);
  const [guardandoNombre, setGuardandoNombre] = useState(false);

  // Estado del formulario de Contraseña
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [mostrarPasswordActual, setMostrarPasswordActual] = useState(false);
  const [mostrarPasswordNueva, setMostrarPasswordNueva] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  // Copiado de UUID
  const [copiadoId, setCopiadoId] = useState(false);

  // Configuración de la plataforma
  const [plataformaConfig, setPlataformaConfig] = useState<any[] | null>(null);
  const [cargandoPlataforma, setCargandoPlataforma] = useState(false);

  // Modal de confirmación de cierre de sesión
  const [modalLogout, setModalLogout] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  // Sincronizar nombre cuando cargue el perfil
  useEffect(() => {
    if (nombreActual && !nombre) {
      setNombre(nombreActual);
    }
  }, [nombreActual]);

  const cargarPlataformaConfig = async () => {
    setCargandoPlataforma(true);
    try {
      const { data, error } = await supabase.from("plataforma_config").select("*");
      if (!error && data?.length) {
        setPlataformaConfig(data);
      }
    } catch (e) {
      console.error("Error al cargar plataforma_config:", e);
    } finally {
      setCargandoPlataforma(false);
    }
  };

  useEffect(() => {
    cargarPlataformaConfig();
  }, []);

  const copiarUUID = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiadoId(true);
      setTimeout(() => setCopiadoId(false), 2000);
    }
  };

  // Cálculo de fuerza de la nueva contraseña
  const passwordStrength = useMemo(() => {
    if (!passwordNueva) return 0;
    let score = 0;
    if (passwordNueva.length >= 8) score += 30;
    if (passwordNueva.length >= 12) score += 20;
    if (/[A-Z]/.test(passwordNueva)) score += 20;
    if (/[0-9]/.test(passwordNueva)) score += 15;
    if (/[^A-Za-z0-9]/.test(passwordNueva)) score += 15;
    return Math.min(score, 100);
  }, [passwordNueva]);

  const guardarNombre = async (event: React.FormEvent) => {
    event.preventDefault();
    const limpio = nombre.trim();
    if (limpio.length < 3) {
      setNombreMsg({ tipo: "error", texto: "El nombre debe tener al menos 3 caracteres." });
      return;
    }
    setGuardandoNombre(true);
    setNombreMsg(null);
    try {
      if (user?.id) {
        const { error } = await supabase.from("usuarios").update({ nombre: limpio }).eq("id", user.id);
        if (error) throw error;
      }
      await supabase.auth.updateUser({ data: { full_name: limpio, displayName: limpio } });
      setNombreMsg({ tipo: "success", texto: "Nombre de administrador actualizado correctamente." });
    } catch (err: any) {
      setNombreMsg({ tipo: "error", texto: err.message || "No se pudo actualizar el nombre." });
    } finally {
      setGuardandoNombre(false);
    }
  };

  const cambiarPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordMsg(null);

    if (passwordNueva.length < 8) {
      setPasswordMsg({ tipo: "error", texto: "La nueva contraseña debe tener al menos 8 caracteres." });
      return;
    }
    if (usaPassword && !passwordActual) {
      setPasswordMsg({ tipo: "error", texto: "Ingresa tu contraseña actual para confirmar el cambio." });
      return;
    }

    setGuardandoPassword(true);
    try {
      if (usaPassword && user?.email) {
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: passwordActual,
        });
        if (reauthError) throw new Error("La contraseña actual no es correcta.");
      }
      const { error } = await supabase.auth.updateUser({ password: passwordNueva });
      if (error) throw error;

      setPasswordMsg({ tipo: "success", texto: "Contraseña actualizada exitosamente con cifrado seguro." });
      setPasswordActual("");
      setPasswordNueva("");
    } catch (err: any) {
      setPasswordMsg({ tipo: "error", texto: err.message || "No se pudo cambiar la contraseña." });
    } finally {
      setGuardandoPassword(false);
    }
  };

  const ejecutarCierreSesion = async () => {
    setCerrandoSesion(true);
    try {
      await signOut();
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
    window.location.assign(LANDING_URL);
  };

  return (
    <div className="space-y-6 pb-12 pt-2">
      {/* Encabezado Principal Limpio */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-800 dark:text-white sm:text-3xl">
          Configuración & Perfil Root
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
          Gestión de identidad administrativa, parámetros de plataforma, preferencias de interfaz y seguridad de sesión.
        </p>
      </div>

      {/* Grid Asimétrico Principal (7 + 5 Columnas) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ========================================================================= */}
        {/* COLUMNA IZQUIERDA (7 Columnas): Perfil, Seguridad y Parámetros           */}
        {/* ========================================================================= */}
        <div className="space-y-6 lg:col-span-7">
          {/* Card 1: Identidad y Perfil del Administrador */}
          <NexxusCard extra="p-6">
            <div className="mb-5 flex items-center justify-between border-b border-border/40 pb-4 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                  <MdOutlinePerson className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-navy-800 dark:text-white">Tu Cuenta de Administrador</h2>
                  <p className="text-xs text-gray-400 dark:text-white/50">Identidad maestra y credencial de acceso principal</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                <MdOutlineShield className="h-3.5 w-3.5" />
                Root Admin
              </span>
            </div>

            {/* Hero del Usuario */}
            <div className="mb-6 flex flex-col items-start gap-4 rounded-2xl border border-border/50 bg-gray-50/70 p-4.5 sm:flex-row sm:items-center sm:gap-5 dark:!border-charcoal-border dark:!bg-charcoal-light/50">
              <div className="relative">
                <Avatar src={foto} name={nombreActual} size={14} className="ring-4 ring-purple-500/20" />
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                  <MdOutlineCheck className="h-3 w-3" />
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-navy-800 dark:text-white">{nombreActual}</h3>
                  <span className="inline-flex items-center rounded-md bg-navy-800/10 px-2 py-0.5 text-[10px] font-medium text-navy-800 dark:bg-white/10 dark:text-white">
                    Super Admin
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-white/60">{emailActual}</p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-gray-400 dark:text-white/40">
                  <span className="flex items-center gap-1">
                    <MdOutlineEmail className="h-3.5 w-3.5" />
                    {usaPassword ? "Autenticación por Contraseña" : "OAuth Google Workspace"}
                  </span>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={copiarUUID}
                    className="group flex items-center gap-1 font-mono text-[11px] text-gray-500 transition-colors hover:text-brand-500 dark:text-white/60 dark:hover:text-brand-400"
                    title="Copiar UUID de usuario"
                  >
                    <span className="truncate max-w-[120px]">{user?.id ? `${user.id.slice(0, 10)}...` : "ID no disp."}</span>
                    {copiadoId ? (
                      <MdOutlineCheck className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <MdOutlineContentCopy className="h-3.5 w-3.5 text-gray-400 group-hover:text-brand-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Formulario de Nombre */}
            <form onSubmit={guardarNombre} className="space-y-4">
              <div>
                <label htmlFor="config-nombre" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/50">
                  Nombre Completo / Firma Administrativa
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-white/40">
                    <MdOutlinePerson className="h-5 w-5" />
                  </div>
                  <input
                    id="config-nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Super Admin Nexxus"
                    className="w-full rounded-xl border border-border/80 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-navy-800 placeholder-gray-400 shadow-xs transition-colors focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:!border-charcoal-border dark:!bg-charcoal-light dark:!text-white dark:placeholder-white/30"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-gray-400 dark:text-white/40">
                  Este nombre se mostrará en los registros de auditoría forense y en los expedientes de soporte.
                </p>
              </div>

              {nombreMsg && (
                <div
                  className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                    nombreMsg.tipo === "success"
                      ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                      : "border border-red-500/20 bg-red-500/10 text-red-600 dark:bg-red-400/20 dark:text-red-300"
                  }`}
                >
                  {nombreMsg.tipo === "success" ? (
                    <MdOutlineCheckCircle className="h-4 w-4 shrink-0" />
                  ) : (
                    <MdOutlineErrorOutline className="h-4 w-4 shrink-0" />
                  )}
                  <span>{nombreMsg.texto}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={guardandoNombre || nombre.trim() === nombreActual}
                  className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-all duration-200 hover:bg-brand-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-400 dark:hover:bg-brand-300 dark:text-navy-900"
                >
                  {guardandoNombre ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-navy-900" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <MdOutlineCheck className="h-4 w-4" />
                      Guardar Nombre
                    </>
                  )}
                </button>
              </div>
            </form>
          </NexxusCard>

          {/* Card 2: Seguridad & Contraseña */}
          <NexxusCard extra="p-6">
            <div className="mb-5 flex items-center justify-between border-b border-border/40 pb-4 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
                  <MdOutlineVpnKey className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-navy-800 dark:text-white">Seguridad & Contraseña</h2>
                  <p className="text-xs text-gray-400 dark:text-white/50">Cifrado de credenciales de acceso y llaves maestras</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
                <MdOutlineLock className="h-3.5 w-3.5" />
                Bcrypt / SHA-256
              </span>
            </div>

            {usaPassword ? (
              <form onSubmit={cambiarPassword} className="space-y-4">
                {/* Contraseña Actual */}
                <div>
                  <label htmlFor="config-password-actual" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/50">
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-white/40">
                      <MdOutlineLock className="h-5 w-5" />
                    </div>
                    <input
                      id="config-password-actual"
                      type={mostrarPasswordActual ? "text" : "password"}
                      autoComplete="current-password"
                      value={passwordActual}
                      onChange={(e) => setPasswordActual(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-border/80 bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-navy-800 placeholder-gray-400 shadow-xs transition-colors focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:!border-charcoal-border dark:!bg-charcoal-light dark:!text-white dark:placeholder-white/30"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPasswordActual(!mostrarPasswordActual)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70"
                    >
                      {mostrarPasswordActual ? (
                        <MdOutlineVisibilityOff className="h-5 w-5" />
                      ) : (
                        <MdOutlineVisibility className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Nueva Contraseña */}
                <div>
                  <label htmlFor="config-password-nueva" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/50">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-white/40">
                      <MdOutlineVpnKey className="h-5 w-5" />
                    </div>
                    <input
                      id="config-password-nueva"
                      type={mostrarPasswordNueva ? "text" : "password"}
                      autoComplete="new-password"
                      value={passwordNueva}
                      onChange={(e) => setPasswordNueva(e.target.value)}
                      placeholder="Mínimo 8 caracteres seguros"
                      className="w-full rounded-xl border border-border/80 bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-navy-800 placeholder-gray-400 shadow-xs transition-colors focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:!border-charcoal-border dark:!bg-charcoal-light dark:!text-white dark:placeholder-white/30"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPasswordNueva(!mostrarPasswordNueva)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70"
                    >
                      {mostrarPasswordNueva ? (
                        <MdOutlineVisibilityOff className="h-5 w-5" />
                      ) : (
                        <MdOutlineVisibility className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* Barra de Fuerza de Contraseña */}
                  {passwordNueva && (
                    <div className="mt-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400 dark:text-white/40">Fortaleza de seguridad:</span>
                        <span
                          className={`font-semibold ${
                            passwordStrength < 40
                              ? "text-red-500"
                              : passwordStrength < 75
                              ? "text-amber-500"
                              : "text-emerald-500"
                          }`}
                        >
                          {passwordStrength < 40
                            ? "Débil"
                            : passwordStrength < 75
                            ? "Aceptable"
                            : "Excelente"}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordStrength < 40
                              ? "bg-red-500"
                              : passwordStrength < 75
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {passwordMsg && (
                  <div
                    className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                      passwordMsg.tipo === "success"
                        ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                        : "border border-red-500/20 bg-red-500/10 text-red-600 dark:bg-red-400/20 dark:text-red-300"
                    }`}
                  >
                    {passwordMsg.tipo === "success" ? (
                      <MdOutlineCheckCircle className="h-4 w-4 shrink-0" />
                    ) : (
                      <MdOutlineErrorOutline className="h-4 w-4 shrink-0" />
                    )}
                    <span>{passwordMsg.texto}</span>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={guardandoPassword || !passwordNueva || (usaPassword && !passwordActual)}
                    className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-all duration-200 hover:bg-brand-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-400 dark:hover:bg-brand-300 dark:text-navy-900"
                  >
                    {guardandoPassword ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-navy-900" />
                        Cifrando y actualizando...
                      </>
                    ) : (
                      <>
                        <MdOutlineLock className="h-4 w-4" />
                        Actualizar Contraseña
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 dark:!border-charcoal-border dark:!bg-charcoal-light/60">
                <div className="flex items-start gap-3">
                  <MdOutlineInfo className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-navy-800 dark:text-white">Cuenta Federada con Google OAuth</p>
                    <p className="text-gray-500 dark:text-white/60">
                      Tu inicio de sesión está gestionado mediante el proveedor externo de Google. Para configurar una contraseña directa, se requerirá verificación en dos pasos.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </NexxusCard>

          {/* Card 3: Configuración Global de la Plataforma (plataforma_config) */}
          <NexxusCard extra="p-6">
            <div className="mb-5 flex items-center justify-between border-b border-border/40 pb-4 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300">
                  <MdOutlineTune className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-navy-800 dark:text-white">Variables Globales de Plataforma</h2>
                  <p className="text-xs text-gray-400 dark:text-white/50">Parámetros operativos de la tabla plataforma_config</p>
                </div>
              </div>
              <button
                type="button"
                onClick={cargarPlataformaConfig}
                disabled={cargandoPlataforma}
                className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-white/50 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-100 disabled:opacity-50 dark:!border-charcoal-border dark:!bg-charcoal-light dark:!text-white/80 dark:hover:!bg-white/10"
              >
                <MdOutlineRefresh className={`h-4 w-4 ${cargandoPlataforma ? "animate-spin" : ""}`} />
                {cargandoPlataforma ? "Sincronizando..." : "Sincronizar"}
              </button>
            </div>

            {plataformaConfig && plataformaConfig.length > 0 ? (
              <div className="space-y-3">
                {plataformaConfig.map((doc: any, index: number) => (
                  <div
                    key={doc.clave || index}
                    className="rounded-xl border border-border/60 bg-gray-50/50 p-4 transition-colors dark:!border-charcoal-border dark:!bg-charcoal-light/40"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MdOutlineCode className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-navy-800 dark:text-white">
                          {formatoClave(doc.clave)}
                        </span>
                      </div>
                      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {doc.clave}
                      </span>
                    </div>

                    {esObjetoSimple(doc.valor) ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1">
                        {Object.entries(doc.valor).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between rounded-lg border border-border/40 bg-white px-3 py-2 text-xs dark:!border-charcoal-border dark:!bg-charcoal-light dark:text-white">
                            <span className="text-gray-400 dark:text-white/40">{formatoClave(k)}:</span>
                            <span className="font-mono font-medium text-navy-800 dark:text-white">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <details className="group">
                        <summary className="cursor-pointer select-none text-xs font-semibold text-brand-500 hover:text-brand-600 dark:text-brand-400">
                          Explorar contenido del esquema JSON ({typeof doc.valor})
                        </summary>
                        <pre className="mt-2.5 max-h-44 overflow-auto rounded-xl border border-border/60 bg-navy-900 p-3.5 font-mono text-xs text-emerald-400 shadow-inner dark:!border-charcoal-border dark:!bg-black/80">
                          {JSON.stringify(doc.valor, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 text-center dark:!border-charcoal-border">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/40">
                  <MdOutlineTune className="h-6 w-6" />
                </div>
                <h4 className="mt-3 text-sm font-bold text-navy-800 dark:text-white">Valores Estándar del Sistema</h4>
                <p className="mt-1 max-w-sm text-xs text-gray-400 dark:text-white/50">
                  La plataforma opera actualmente con los parámetros predeterminados de configuración global de Nexxus.
                </p>
              </div>
            )}
          </NexxusCard>
        </div>

        {/* ========================================================================= */}
        {/* COLUMNA DERECHA (5 Columnas): Apariencia, Telemetría y Gestión de Sesión */}
        {/* ========================================================================= */}
        <div className="space-y-6 lg:col-span-5">
          {/* Card 4: Apariencia del Sistema */}
          <NexxusCard extra="p-6">
            <div className="mb-5 flex items-center justify-between border-b border-border/40 pb-4 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-300">
                  <MdOutlinePalette className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-navy-800 dark:text-white">Apariencia</h2>
                  <p className="text-xs text-gray-400 dark:text-white/50">Tema visual de la consola administrativa</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-300">
                {dark ? "Oscuro" : "Claro"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Opción Modo Claro */}
              <button
                type="button"
                onClick={() => {
                  if (dark) toggleDark();
                }}
                className={`group relative flex flex-col items-center justify-center gap-2.5 rounded-2xl border p-4 text-center transition-all duration-200 ${
                  !dark
                    ? "border-brand-500 bg-brand-500/5 ring-2 ring-brand-500/20 shadow-xs"
                    : "border-border/60 bg-gray-50/50 hover:bg-gray-100/80 dark:!border-charcoal-border dark:!bg-charcoal-light dark:hover:!bg-white/[0.05]"
                }`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${
                    !dark
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-white/70"
                  }`}
                >
                  <RiSunFill className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-navy-800 dark:text-white">Modo Claro</p>
                  <p className="text-[10px] text-gray-400 dark:text-white/40">Fondo blanco contrastado</p>
                </div>
                {!dark && (
                  <div className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white">
                    <MdOutlineCheck className="h-3 w-3" />
                  </div>
                )}
              </button>

              {/* Opción Modo Oscuro */}
              <button
                type="button"
                onClick={() => {
                  if (!dark) toggleDark();
                }}
                className={`group relative flex flex-col items-center justify-center gap-2.5 rounded-2xl border p-4 text-center transition-all duration-200 ${
                  dark
                    ? "border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20 shadow-xs dark:!bg-purple-500/15"
                    : "border-border/60 bg-gray-50/50 hover:bg-gray-100/80 dark:!border-charcoal-border dark:!bg-charcoal-light dark:hover:!bg-white/[0.05]"
                }`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${
                    dark
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-white/70"
                  }`}
                >
                  <RiMoonFill className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-navy-800 dark:text-white">Modo Oscuro</p>
                  <p className="text-[10px] text-gray-400 dark:text-white/40">Charcoal profundo UI</p>
                </div>
                {dark && (
                  <div className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-white">
                    <MdOutlineCheck className="h-3 w-3" />
                  </div>
                )}
              </button>
            </div>
          </NexxusCard>

          {/* Card 5: Telemetría de Sesión y Diagnóstico */}
          <NexxusCard extra="p-6">
            <div className="mb-5 flex items-center justify-between border-b border-border/40 pb-4 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-400/20 dark:text-teal-300">
                  <MdOutlineFingerprint className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-navy-800 dark:text-white">Diagnóstico de Sesión</h2>
                  <p className="text-xs text-gray-400 dark:text-white/50">Telemetría forense de la sesión activa</p>
                </div>
              </div>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" title="Sesión Segura" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-border/40 bg-gray-50/50 p-3 dark:!border-charcoal-border dark:!bg-charcoal-light/50">
                <div className="flex items-center gap-2 text-gray-500 dark:text-white/60">
                  <MdOutlineAdminPanelSettings className="h-4 w-4 text-purple-500" />
                  <span>Rol Autorizado</span>
                </div>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">super_admin</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/40 bg-gray-50/50 p-3 dark:!border-charcoal-border dark:!bg-charcoal-light/50">
                <div className="flex items-center gap-2 text-gray-500 dark:text-white/60">
                  <MdOutlineShield className="h-4 w-4 text-blue-500" />
                  <span>Proveedor de Auth</span>
                </div>
                <span className="font-mono font-medium text-navy-800 dark:text-white">Supabase GoTrue (JWT)</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/40 bg-gray-50/50 p-3 dark:!border-charcoal-border dark:!bg-charcoal-light/50">
                <div className="flex items-center gap-2 text-gray-500 dark:text-white/60">
                  <MdOutlineSpeed className="h-4 w-4 text-emerald-500" />
                  <span>Protocolo de Red</span>
                </div>
                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">TLS 1.3 / HTTPS</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/40 bg-gray-50/50 p-3 dark:!border-charcoal-border dark:!bg-charcoal-light/50">
                <div className="flex items-center gap-2 text-gray-500 dark:text-white/60">
                  <MdOutlineCloudDone className="h-4 w-4 text-cyan-500" />
                  <span>Infraestructura</span>
                </div>
                <span className="font-mono font-medium text-navy-800 dark:text-white">Supabase Edge Network</span>
              </div>
            </div>
          </NexxusCard>

          {/* Card 6: Gestión de Sesión & Salida */}
          <NexxusCard extra="p-6">
            <div className="mb-5 flex items-center justify-between border-b border-border/40 pb-4 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:bg-red-400/20 dark:text-red-300">
                  <MdOutlineExitToApp className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-navy-800 dark:text-white">Gestión de Sesión</h2>
                  <p className="text-xs text-gray-400 dark:text-white/50">Navegación exterior y cierre seguro</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-400/20 dark:text-red-300">
                Zona de Salida
              </span>
            </div>

            <div className="space-y-3">
              {/* Volver a la Landing */}
              <button
                type="button"
                onClick={() => window.location.assign(LANDING_URL)}
                className="flex w-full items-center justify-between rounded-xl border border-border/80 bg-white px-4 py-3 text-sm font-semibold text-navy-800 shadow-xs transition-colors hover:bg-gray-50 hover:border-gray-300 dark:!border-charcoal-border dark:!bg-charcoal-light dark:!text-white dark:hover:!bg-white/5"
              >
                <div className="flex items-center gap-2.5">
                  <MdOutlineOpenInNew className="h-4 w-4 text-gray-400 dark:text-white/40" />
                  <span>Volver a la Landing Page</span>
                </div>
                <span className="text-[11px] font-normal text-gray-400 dark:text-white/40">nexxus.com</span>
              </button>

              {/* Botón de Cerrar Sesión */}
              <button
                type="button"
                onClick={() => setModalLogout(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-xs transition-all duration-200 hover:bg-red-600 active:scale-[0.98] dark:bg-red-600 dark:hover:bg-red-500"
              >
                <MdOutlineExitToApp className="h-5 w-5" />
                <span>Cerrar Sesión SuperAdmin</span>
              </button>
            </div>
          </NexxusCard>
        </div>
      </div>

      {/* Modal de Confirmación de Cierre de Sesión */}
      {modalLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-border/80 bg-white p-6 shadow-2xl dark:!border-charcoal-border dark:!bg-charcoal">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
                <MdOutlineExitToApp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-800 dark:text-white">¿Cerrar Sesión de SuperAdmin?</h3>
                <p className="text-xs text-gray-400 dark:text-white/50">Confirmación de seguridad requerida</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-600 dark:text-white/70">
              Se invalidará el token de autenticación actual y se te redirigirá a la página de inicio de Nexxus.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalLogout(false)}
                disabled={cerrandoSesion}
                className="rounded-xl border border-border/80 px-4 py-2.5 text-sm font-semibold text-navy-800 transition-colors hover:bg-gray-100 dark:!border-charcoal-border dark:!text-white dark:hover:!bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutarCierreSesion}
                disabled={cerrandoSesion}
                className="flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {cerrandoSesion ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Cerrando sesión...
                  </>
                ) : (
                  <>
                    <MdOutlineExitToApp className="h-4 w-4" />
                    Sí, cerrar sesión
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
