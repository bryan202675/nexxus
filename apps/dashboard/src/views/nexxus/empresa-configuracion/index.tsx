import { useEffect, useState } from "react";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import {
  MdOutlinePerson,
  MdOutlineSecurity,
  MdOutlineAccessTime,
  MdOutlineWorkspacePremium,
  MdOutlineCheckCircle,
  MdOutlinePalette,
  MdOutlineExitToApp,
  MdOutlineOpenInNew,
  MdOutlineCheck,
  MdOutlineStorage,
  MdEmail,
  MdPhone,
} from "react-icons/md";
import { supabase } from "supabaseClient/supabaseConfig";
import { subscribeConfiguracionEmpresa } from "services/adminRepository";
import { useAuth } from "context/AuthContext";
import { useTheme } from "context/ThemeContext";
import { useEmpresaPlan, FEATURE_LABELS } from "services/planEnforcement";
import { LANDING_URL } from "services/nexxusLinks";
import NexxusCard from "views/nexxus/components/NexxusCard";
import Avatar from "components/nexxus/Avatar";

const DEFAULT_ASISTENCIA = {
  horaEntrada: "08:00",
  horaSalida: "17:00",
  toleranciaMinutos: 10,
  horasEsperadas: 8,
};

export default function ConfiguracionAdmin() {
  const { user, perfil, empresaId, empresaNombre, signOut } = useAuth();
  const { dark, toggleDark } = useTheme();
  const { plan, planFeatures, planLimits, subscriptionStatus: estadoPlan } = useEmpresaPlan();

  const usaPassword =
    !user?.app_metadata?.providers?.includes("google") || user?.app_metadata?.providers?.includes("email");
  const nombreActual = perfil?.nombre || user?.user_metadata?.displayName || "Administrador";
  const foto = perfil?.foto_perfil || "";

  const [nombre, setNombre] = useState(nombreActual);
  const [nombreMsg, setNombreMsg] = useState("");
  const [guardandoNombre, setGuardandoNombre] = useState(false);

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  const [asistencia, setAsistencia] = useState(DEFAULT_ASISTENCIA);
  const [cargandoAsistencia, setCargandoAsistencia] = useState(true);
  const [errorAsistencia, setErrorAsistencia] = useState("");
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false);
  const [asistenciaMsg, setAsistenciaMsg] = useState("");

  useEffect(() => {
    if (!empresaId) return undefined;
    setCargandoAsistencia(true);
    setErrorAsistencia("");
    const unsub = subscribeConfiguracionEmpresa(
      empresaId,
      (snap) => {
        const data = snap.data ? snap.data() : undefined;
        setAsistencia({ ...DEFAULT_ASISTENCIA, ...(data?.configuracion?.asistencia || {}) });
        setCargandoAsistencia(false);
      },
      (err) => {
        setErrorAsistencia(err.message || "No se pudo cargar el horario de asistencia.");
        setCargandoAsistencia(false);
      }
    );
    return () => unsub();
  }, [empresaId]);

  const guardarNombre = async (event: any) => {
    event.preventDefault();
    const limpio = nombre.trim();
    if (limpio.length < 3) {
      setNombreMsg("El nombre debe tener al menos 3 caracteres.");
      return;
    }
    setGuardandoNombre(true);
    setNombreMsg("");
    try {
      const { error } = await supabase.from("usuarios").update({ nombre: limpio }).eq("id", user?.id);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { displayName: limpio } });
      setNombreMsg("Nombre actualizado correctamente.");
    } catch (err: any) {
      setNombreMsg(err.message || "No se pudo actualizar el nombre.");
    } finally {
      setGuardandoNombre(false);
    }
  };

  const cambiarPassword = async (event: any) => {
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
      if (usaPassword && user?.email) {
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: passwordActual,
        });
        if (reauthError) throw reauthError;
      }
      const { error } = await supabase.auth.updateUser({ password: passwordNueva });
      if (error) throw error;
      setPasswordMsg("Contraseña actualizada con éxito.");
      setPasswordActual("");
      setPasswordNueva("");
    } catch (err: any) {
      setPasswordError(err.message || "No se pudo cambiar la contraseña.");
    } finally {
      setGuardandoPassword(false);
    }
  };

  const guardarAsistencia = async (event: any) => {
    event.preventDefault();
    if (!empresaId) return;
    setGuardandoAsistencia(true);
    setAsistenciaMsg("");
    setErrorAsistencia("");
    try {
      const { data: current } = await supabase
        .from("configuraciones_empresa")
        .select("configuracion")
        .eq("empresa_id", empresaId)
        .maybeSingle();

      const { error } = await supabase.from("configuraciones_empresa").upsert({
        empresa_id: empresaId,
        configuracion: {
          ...(current?.configuracion || {}),
          asistencia: {
            horaEntrada: asistencia.horaEntrada,
            horaSalida: asistencia.horaSalida,
            toleranciaMinutos: Number(asistencia.toleranciaMinutos),
            horasEsperadas: Number(asistencia.horasEsperadas),
          },
          updatedBy: user?.id,
        },
      });
      if (error) throw error;
      setAsistenciaMsg("Parámetros de asistencia guardados.");
    } catch (err: any) {
      setErrorAsistencia(err.message || "No se pudo guardar el horario.");
    } finally {
      setGuardandoAsistencia(false);
    }
  };

  const cerrarSesion = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
    window.location.assign(LANDING_URL);
  };

  if (!empresaId) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white p-6 shadow-3xl shadow-shadow-500 dark:bg-charcoal dark:border dark:border-charcoal-border">
        <p className="text-base font-semibold text-gray-600 dark:text-white/70">
          Tu cuenta no tiene una empresa asociada.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
          Configuración & Preferencias Corporativas
        </h2>
        <p className="text-sm font-medium text-gray-500 dark:text-white/60">
          Gestión del perfil del administrador, parámetros de asistencia, suscripción y apariencia de {empresaNombre || "la empresa"}.
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Plan Activo */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Plan Contratado
              </p>
              <h3 className="mt-2 text-2xl font-extrabold text-brand-500 dark:text-brand-300">
                {plan}
              </h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
              <MdOutlineWorkspacePremium className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Estado de suscripción</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {estadoPlan || "Activo"}
            </span>
          </div>
        </NexxusCard>

        {/* Almacenamiento en Nube */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Almacenamiento Cloud
              </p>
              <h3 className="mt-2 text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                {planLimits.storageGb || 500} GB
              </h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
              <MdOutlineStorage className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Cuota de documentos</span>
            <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
              Espacio seguro
            </span>
          </div>
        </NexxusCard>

        {/* Horario de Jornada */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Jornada Laboral
              </p>
              <h3 className="mt-2 text-2xl font-extrabold text-navy-700 dark:text-white">
                {asistencia.horaEntrada} - {asistencia.horaSalida}
              </h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
              <MdOutlineAccessTime className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Horas base por día</span>
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
              {asistencia.horasEsperadas} hrs / jornada
            </span>
          </div>
        </NexxusCard>

        {/* Margen de Tolerancia */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Tolerancia de Entrada
              </p>
              <h3 className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                {asistencia.toleranciaMinutos} min
              </h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300">
              <MdOutlineCheckCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Margen antes de retardo</span>
            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:bg-amber-400/20 dark:text-amber-300">
              Configurado
            </span>
          </div>
        </NexxusCard>
      </div>

      {/* Grid Principal: 2 Columnas */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Columna Izquierda: Perfil & Capacidades */}
        <div className="flex flex-col gap-6">
          {/* Perfil & Cuenta del Administrador */}
          <NexxusCard extra="p-6 flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center gap-4 border-b border-gray-100 pb-4 dark:border-white/10">
                <Avatar src={foto} name={nombreActual} size={14} />
                <div className="min-w-0">
                  <h4 className="truncate text-base font-bold text-navy-700 dark:text-white">
                    {nombreActual}
                  </h4>
                  <p className="truncate text-xs font-medium text-gray-500 dark:text-white/60">
                    {user?.email}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10.5px] font-bold text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
                      Administrador
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                      {empresaNombre}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formulario de Edición de Nombre */}
              <form onSubmit={guardarNombre} className="mt-4 flex flex-col gap-2">
                <label
                  className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/50"
                  htmlFor="config-nombre-adm"
                >
                  Nombre Completo
                </label>
                <div className="flex gap-2">
                  <input
                    id="config-nombre-adm"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="h-10 flex-1 rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                  />
                  <button
                    type="submit"
                    disabled={guardandoNombre}
                    className="h-10 rounded-xl bg-brand-500 px-5 text-xs font-bold text-white shadow-sm shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95 disabled:opacity-50 dark:bg-brand-400 dark:hover:bg-brand-500"
                  >
                    {guardandoNombre ? "Guardando..." : "Guardar"}
                  </button>
                </div>
                {nombreMsg && (
                  <p className="mt-1 text-xs font-bold text-brand-500 dark:text-brand-300">{nombreMsg}</p>
                )}
              </form>
            </div>

            {/* Datos de contacto de la cuenta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-gray-100 pt-3.5 text-xs text-gray-500 dark:border-white/10 dark:text-white/60">
              <div className="flex items-center gap-2 truncate rounded-lg bg-gray-50/70 px-2.5 py-1.5 dark:bg-white/[0.02]">
                <MdEmail className="h-4 w-4 text-brand-500 shrink-0" />
                <span className="truncate">{user?.email || "Sin correo"}</span>
              </div>
              <div className="flex items-center gap-2 truncate rounded-lg bg-gray-50/70 px-2.5 py-1.5 dark:bg-white/[0.02]">
                <MdPhone className="h-4 w-4 text-brand-500 shrink-0" />
                <span className="truncate">{perfil?.telefono || "+503 Corporativo"}</span>
              </div>
            </div>
          </NexxusCard>

          {/* Plan & Capacidades Corporativas */}
          <NexxusCard extra="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
                  <MdOutlineWorkspacePremium className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-navy-700 dark:text-white">Plan {plan}</h4>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Suscripción corporativa activa
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                Enterprise
              </span>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                Capacidades & Límites
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-navy-700 dark:text-white/80">
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-white/5 dark:bg-white/[0.02]">
                  <span className="block text-[10px] uppercase font-semibold text-gray-400 dark:text-white/40">Empleados</span>
                  <strong className="text-sm text-navy-700 dark:text-white">{planLimits.employees ?? "Ilimitado"}</strong>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-white/5 dark:bg-white/[0.02]">
                  <span className="block text-[10px] uppercase font-semibold text-gray-400 dark:text-white/40">Departamentos</span>
                  <strong className="text-sm text-navy-700 dark:text-white">{planLimits.departments ?? "Ilimitado"}</strong>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-white/5 dark:bg-white/[0.02]">
                  <span className="block text-[10px] uppercase font-semibold text-gray-400 dark:text-white/40">Sedes</span>
                  <strong className="text-sm text-navy-700 dark:text-white">{planLimits.branches ?? "Ilimitado"}</strong>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-white/5 dark:bg-white/[0.02]">
                  <span className="block text-[10px] uppercase font-semibold text-gray-400 dark:text-white/40">Consultas IA</span>
                  <strong className="text-sm text-navy-700 dark:text-white">{planLimits.aiRequestsMonthly ?? "15,000"}/mes</strong>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                Módulos Habilitados
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                  <span
                    key={key}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
                      planFeatures[key]
                        ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                        : "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/30"
                    }`}
                  >
                    <MdOutlineCheck className="h-3 w-3" />
                    <span>{label}</span>
                  </span>
                ))}
              </div>
            </div>
          </NexxusCard>
        </div>

        {/* Columna Derecha: Asistencia & Seguridad */}
        <div className="flex flex-col gap-6">
          {/* Horario de Asistencia de la Empresa */}
          <NexxusCard extra="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3 dark:border-white/10">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                <MdOutlineAccessTime className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-navy-700 dark:text-white">
                  Horario de Asistencia de la Empresa
                </h4>
                <p className="text-xs text-gray-500 dark:text-white/50">
                  Reglas de puntualidad y cálculo de jornadas para los colaboradores.
                </p>
              </div>
            </div>

            {cargandoAsistencia ? (
              <div className="flex h-28 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
            ) : (
              <form onSubmit={guardarAsistencia} className="flex flex-col gap-4 pt-1">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/50" htmlFor="hora-entrada">
                      Hora de Entrada
                    </label>
                    <input
                      id="hora-entrada"
                      type="time"
                      value={asistencia.horaEntrada}
                      onChange={(e) => setAsistencia((prev) => ({ ...prev, horaEntrada: e.target.value }))}
                      className="mt-1 flex h-10 w-full items-center rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/50" htmlFor="hora-salida">
                      Hora de Salida
                    </label>
                    <input
                      id="hora-salida"
                      type="time"
                      value={asistencia.horaSalida}
                      onChange={(e) => setAsistencia((prev) => ({ ...prev, horaSalida: e.target.value }))}
                      className="mt-1 flex h-10 w-full items-center rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/50" htmlFor="tolerancia-min">
                      Tolerancia (minutos)
                    </label>
                    <input
                      id="tolerancia-min"
                      type="number"
                      min="0"
                      value={asistencia.toleranciaMinutos}
                      onChange={(e) =>
                        setAsistencia((prev) => ({ ...prev, toleranciaMinutos: Number(e.target.value) }))
                      }
                      className="mt-1 flex h-10 w-full items-center rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/50" htmlFor="horas-esperadas">
                      Horas Esperadas
                    </label>
                    <input
                      id="horas-esperadas"
                      type="number"
                      min="0"
                      value={asistencia.horasEsperadas}
                      onChange={(e) =>
                        setAsistencia((prev) => ({ ...prev, horasEsperadas: Number(e.target.value) }))
                      }
                      className="mt-1 flex h-10 w-full items-center rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                    />
                  </div>
                </div>

                {errorAsistencia && <p className="text-xs font-bold text-red-500">{errorAsistencia}</p>}
                {asistenciaMsg && (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{asistenciaMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={guardandoAsistencia}
                  className="h-10 w-fit rounded-xl bg-brand-500 px-5 text-xs font-bold text-white shadow-sm shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95 disabled:opacity-50 dark:bg-brand-400 dark:hover:bg-brand-500"
                >
                  {guardandoAsistencia ? "Guardando..." : "Guardar Horario"}
                </button>
              </form>
            )}
          </NexxusCard>

          {/* Seguridad, Tema Visual & Sesión */}
          <NexxusCard extra="p-6 flex flex-col gap-5">
            {/* Sección Contraseña */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                  <MdOutlineSecurity className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-navy-700 dark:text-white">
                    {usaPassword ? "Cambiar Contraseña" : "Crear Contraseña"}
                  </h4>
                </div>
              </div>

              <form onSubmit={cambiarPassword} className="flex flex-col gap-2.5">
                {usaPassword ? (
                  <div>
                    <input
                      type="password"
                      autoComplete="current-password"
                      placeholder="Contraseña actual"
                      value={passwordActual}
                      onChange={(e) => setPasswordActual(e.target.value)}
                      className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500 dark:text-white/50">
                    Tu cuenta inició sesión con Google. Puedes asignar una contraseña directa.
                  </p>
                )}

                <div className="flex gap-2">
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Nueva contraseña (mín. 8 caracteres)"
                    value={passwordNueva}
                    onChange={(e) => setPasswordNueva(e.target.value)}
                    className="h-10 flex-1 rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                  />
                  <button
                    type="submit"
                    disabled={guardandoPassword}
                    className="h-10 rounded-xl bg-brand-500 px-4 text-xs font-bold text-white shadow-sm shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95 disabled:opacity-50 dark:bg-brand-400 dark:hover:bg-brand-500"
                  >
                    {guardandoPassword ? "..." : "Actualizar"}
                  </button>
                </div>

                {passwordError && <p className="text-xs font-bold text-red-500">{passwordError}</p>}
                {passwordMsg && (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{passwordMsg}</p>
                )}
              </form>
            </div>

            {/* Sección Tema Visual */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3.5 dark:border-white/10">
              <div className="flex items-center gap-2">
                <MdOutlinePalette className="h-4.5 w-4.5 text-gray-400" />
                <span className="text-xs font-bold text-navy-700 dark:text-white">Tema de Interfaz</span>
              </div>
              <button
                type="button"
                onClick={toggleDark}
                className="flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/70 px-3 text-xs font-bold text-navy-700 transition hover:bg-gray-100 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/10"
              >
                {dark ? <RiSunFill className="h-4 w-4 text-amber-500" /> : <RiMoonFill className="h-4 w-4 text-indigo-500" />}
                <span>Modo {dark ? "Oscuro" : "Claro"}</span>
              </button>
            </div>

            {/* Acciones de Sesión */}
            <div className="flex flex-col gap-2 border-t border-gray-100 pt-3.5 dark:border-white/10">
              <button
                type="button"
                onClick={() => window.location.assign(LANDING_URL)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-navy-700 shadow-2xs transition hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
              >
                <MdOutlineOpenInNew className="h-4 w-4 text-gray-500" />
                <span>Volver a la Página Principal</span>
              </button>

              <button
                type="button"
                onClick={cerrarSesion}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-500 text-xs font-bold text-white shadow-sm shadow-red-500/25 transition hover:bg-red-600 active:scale-95"
              >
                <MdOutlineExitToApp className="h-4 w-4" />
                <span>Cerrar Sesión y Salir a la Landing</span>
              </button>
            </div>
          </NexxusCard>
        </div>
      </div>
    </div>
  );
}
