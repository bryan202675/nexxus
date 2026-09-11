import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MdArrowBack,
  MdCheck,
  MdClose,
  MdOutlineBusiness,
  MdOutlineCalendarMonth,
  MdOutlinePeople,
  MdOutlineWorkspacePremium,
  MdOutlineStorage,
  MdOutlineSmartToy,
  MdCreditCard,
} from "react-icons/md";
import { RiMoonFill, RiSunFill } from "react-icons/ri";

import { useAuth } from "context/AuthContext";
import { useTheme } from "context/ThemeContext";
import { routeUrl } from "utils/routePath";
import { FEATURE_LABELS } from "services/planEnforcement";
import {
  confirmPlanUpgrade,
  loadPlanPreferences,
  requestPlanChange,
  resolveFutureRenewalDate,
  PlanPreferencesData,
  PlanPreference,
} from "services/planPreferences";
import NexxusCard from "views/nexxus/components/NexxusCard";

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("es-SV", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value))
    : "No definida";

const limitLabel = (value: number | null | undefined) => (value == null ? "Ilimitado" : value.toLocaleString("es-SV"));

function PlanCard({
  plan,
  current,
  pending,
  onSelect,
  disabled,
}: {
  plan: PlanPreference;
  current: boolean;
  pending: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  const isEnterprise = plan.name.toLowerCase() === "enterprise";
  const isBusiness = plan.name.toLowerCase() === "business";

  return (
    <NexxusCard
      extra={`relative flex flex-col justify-between p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        current
          ? "border-2 border-brand-500 shadow-md shadow-brand-500/10 dark:border-brand-400"
          : isEnterprise
          ? "border-brand-500/30 dark:border-brand-400/20"
          : ""
      }`}
    >
      {/* Badges de Estado */}
      {current && (
        <span className="absolute right-5 top-5 rounded-full bg-brand-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm shadow-brand-500/20 dark:bg-brand-400">
          Plan actual
        </span>
      )}
      {pending && (
        <span className="absolute right-5 top-5 rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-600 dark:bg-amber-400/20 dark:text-amber-300">
          Próximo plan
        </span>
      )}

      <div>
        {/* Icono & Título */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
              isEnterprise
                ? "bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300"
                : isBusiness
                ? "bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300"
                : "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300"
            }`}
          >
            <MdOutlineWorkspacePremium className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy-700 dark:text-white">{plan.name}</h3>
            <p className="text-xs font-medium text-gray-400 dark:text-white/50">
              {isEnterprise
                ? "Para organizaciones en expansión"
                : isBusiness
                ? "Para empresas medianas y equipos"
                : "Para startups y microempresas"}
            </p>
          </div>
        </div>

        {/* Precio */}
        <div className="mt-5 flex items-baseline gap-1">
          <span className="text-4xl font-black tracking-tight text-navy-700 dark:text-white">${plan.price}</span>
          <span className="text-xs font-semibold text-gray-400 dark:text-white/50">/ mes</span>
        </div>

        {/* Límites y Capacidades */}
        <div className="mt-6 space-y-2.5 border-t border-gray-100 pt-5 text-xs font-medium text-navy-700 dark:border-white/10 dark:text-white/80">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 dark:text-white/50">Colaboradores</span>
            <strong className="font-bold text-navy-700 dark:text-white">{limitLabel(plan.limits.employees)}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 dark:text-white/50">Departamentos</span>
            <strong className="font-bold text-navy-700 dark:text-white">{limitLabel(plan.limits.departments)}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 dark:text-white/50">Sedes & Sucursales</span>
            <strong className="font-bold text-navy-700 dark:text-white">{limitLabel(plan.limits.branches)}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 dark:text-white/50">Almacenamiento</span>
            <strong className="font-bold text-navy-700 dark:text-white">{plan.limits.storageGb || 5} GB</strong>
          </div>
        </div>

        {/* Lista de Módulos */}
        <div className="mt-6 space-y-2 border-t border-gray-100 pt-4 dark:border-white/10">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
            Módulos incluidos
          </p>
          <div className="grid grid-cols-1 gap-1.5 pt-1">
            {Object.entries(FEATURE_LABELS).map(([key, label]) => {
              const active = Boolean(plan.features[key]);
              return (
                <div
                  key={key}
                  className={`flex items-center gap-2 text-xs ${
                    active ? "font-semibold text-navy-700 dark:text-white" : "text-gray-300 dark:text-white/20"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                      active
                        ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                        : "bg-gray-100 text-gray-300 dark:bg-white/5 dark:text-white/20"
                    }`}
                  >
                    {active ? <MdCheck className="h-3 w-3" /> : <MdClose className="h-2.5 w-2.5" />}
                  </span>
                  <span className="truncate">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Botón de Acción */}
      <button
        type="button"
        disabled={current || pending || disabled}
        onClick={onSelect}
        className={`mt-8 flex h-11 w-full items-center justify-center rounded-xl text-xs font-bold transition active:scale-95 ${
          current
            ? "cursor-default border border-brand-500/30 bg-brand-500/10 text-brand-600 dark:border-brand-400/30 dark:bg-brand-400/20 dark:text-brand-300"
            : pending
            ? "cursor-default border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/20 dark:text-amber-300"
            : "bg-brand-500 text-white shadow-md shadow-brand-500/20 hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-500"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {current ? "Plan actual en curso" : pending ? "Cambio programado" : "Elegir este plan"}
      </button>
    </NexxusCard>
  );
}

export default function PlanPreferencias() {
  const { user, empresaId, empresaNombre, esAdminEmpresa } = useAuth();
  const { dark, toggleDark } = useTheme();
  const [data, setData] = useState<PlanPreferencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [upgradePlan, setUpgradePlan] = useState<PlanPreference | null>(null);
  const [card, setCard] = useState("");

  const load = () => {
    if (!empresaId) return;
    setLoading(true);
    loadPlanPreferences(empresaId)
      .then(setData)
      .catch((value: Error) => setError(value.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, [empresaId]);

  const company = data?.company;
  const pendingPlan = data?.subscription.pendingPlan;
  const renewalDate = resolveFutureRenewalDate(data?.subscription.periodEndsAt);
  const backUrl = routeUrl("/admin", "empresa-configuracion");
  const currentPlanId = data?.subscription.currentPlan.id;
  const plans = useMemo(() => data?.plans || [], [data]);

  const choosePlan = async (plan: PlanPreference) => {
    if (data && plan.price > data.subscription.currentPlan.price) {
      setUpgradePlan(plan);
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const result = await requestPlanChange(plan.id);
      setSuccess(`Tu cambio a ${result.planName} quedó programado para la próxima mensualidad.`);
      load();
    } catch (value) {
      setError(value instanceof Error ? value.message : "No se pudo programar el cambio de plan.");
    } finally {
      setSaving(false);
    }
  };

  const submitUpgrade = async (event: FormEvent) => {
    event.preventDefault();
    if (!upgradePlan || !/^\d{12,19}$/.test(card.replace(/\D/g, ""))) {
      setError("Ingresa una tarjeta de prueba válida de 12 a 19 dígitos.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await confirmPlanUpgrade(upgradePlan.id, card);
      setUpgradePlan(null);
      setCard("");
      setSuccess(
        `Upgrade confirmado. ${result.planName} ya está activo y la próxima mensualidad será el ${formatDate(
          result.effectiveAt
        )}.`
      );
      load();
    } catch (value) {
      setError(value instanceof Error ? value.message : "No se pudo confirmar el upgrade.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-sm font-semibold text-gray-600 dark:bg-charcoal dark:text-white/70">
        Necesitas iniciar sesión para ver tus preferencias de plan.
      </div>
    );
  }

  if (!esAdminEmpresa) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-sm font-semibold text-gray-600 dark:bg-charcoal dark:text-white/70">
        Solo el administrador de la empresa puede gestionar el plan.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-lightPrimary px-4 py-6 text-navy-700 dark:bg-charcoal-dark dark:text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        {/* Top Navbar */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white/90 p-3.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-charcoal/90">
          <Link
            to={backUrl}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-600 transition-all hover:bg-gray-100 hover:text-navy-700 active:scale-95 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <MdArrowBack className="h-4 w-4" />
            <span>Volver a Configuración</span>
          </Link>

          <div className="flex items-center gap-2.5">
            {/* Selector Modo Claro / Modo Oscuro Elegante */}
            <button
              type="button"
              onClick={toggleDark}
              className="flex h-9 items-center gap-2 rounded-xl border border-gray-200/80 bg-gray-50/80 px-3.5 text-xs font-semibold text-navy-700 transition-all hover:bg-gray-100 active:scale-95 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
              title={dark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            >
              {dark ? (
                <>
                  <RiSunFill className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-medium text-white/90">Modo Claro</span>
                </>
              ) : (
                <>
                  <RiMoonFill className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-medium text-gray-700">Modo Oscuro</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Título de Sección */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-500 dark:text-brand-400">
              Preferencias de Plan & Suscripción
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
            Elige el plan que mejor acompaña a {empresaNombre || String(company?.nombre || "tu empresa")}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-white/60">
            Consulta tu suscripción, compara capacidades y programa un cambio sin interrumpir tu período actual.
          </p>
        </div>

        {/* Banners */}
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
          >
            {success}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 animate-pulse">
            <div className="h-56 rounded-3xl bg-gray-200 dark:bg-white/5 lg:col-span-7" />
            <div className="h-56 rounded-3xl bg-gray-200 dark:bg-white/5 lg:col-span-5" />
          </div>
        ) : data ? (
          <>
            {/* Grid Asimétrico: Hero Card (7 cols) + Right Stack (5 cols) */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              {/* Hero Card Principal (7 cols) */}
              <div className="lg:col-span-7">
                <NexxusCard extra="p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-navy-700 dark:text-white">
                          Suscripción Actual
                        </span>
                        <span className="ml-2 text-xs font-medium text-gray-400 dark:text-white/40">
                          · {data.subscription.currentPlan.name}
                        </span>
                      </div>
                    </div>

                    {/* Métrica Principal */}
                    <div className="mt-4">
                      <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-brand-500 dark:text-brand-300">
                        Plan {data.subscription.currentPlan.name}
                      </p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <span>Próxima mensualidad: {formatDate(renewalDate)}</span>
                        <span className="font-normal text-gray-400 dark:text-white/40">
                          · Renovación automática garantizada
                        </span>
                      </p>
                      <p className="mt-2 text-xs font-medium text-gray-500 dark:text-white/60">
                        {empresaNombre || String(company?.nombre || "Empresa")} · Código de organización:{" "}
                        {String(company?.codigo || "EMPRESA")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    {/* Barra de Distribución Proporcional */}
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                      <div style={{ width: "40%" }} className="h-full bg-brand-500 transition-all duration-500" title="Empleados" />
                      <div style={{ width: "35%" }} className="h-full bg-emerald-500 transition-all duration-500" title="Departamentos" />
                      <div style={{ width: "25%" }} className="h-full bg-purple-500 transition-all duration-500" title="Sedes" />
                    </div>

                    {/* Leyenda */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            {data.counts.employees} Activos
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Colaboradores
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            {data.counts.departments} Áreas
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Departamentos
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-purple-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            {data.counts.branches} Sedes
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Sucursales
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </NexxusCard>
              </div>

              {/* Right Stack of 3 Cards (5 cols) - Alineadas a la izquierda */}
              <div className="flex flex-col gap-4 lg:col-span-5">
                {/* Card 1: Uso de Plantilla */}
                <NexxusCard extra="p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-white/50">
                      Uso de Plantilla
                    </span>
                    <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-bold text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
                      {limitLabel(data.subscription.currentPlan.limits.employees)} límite
                    </span>
                  </div>
                  <div className="mt-2 text-left">
                    <p className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                      {data.counts.employees} colaboradores
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
                      Usuarios registrados en la plataforma
                    </p>
                  </div>
                </NexxusCard>

                {/* Card 2: Departamentos & Sedes */}
                <NexxusCard extra="p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-white/50">
                      Estructura Corporativa
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                      Estructura activa
                    </span>
                  </div>
                  <div className="mt-2 text-left">
                    <p className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                      {data.counts.departments} deptos · {data.counts.branches} sedes
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
                      Centros de costos y sucursales operativas
                    </p>
                  </div>
                </NexxusCard>

                {/* Card 3: Almacenamiento & Nexxus IA */}
                <NexxusCard extra="p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-white/50">
                      Capacidad Cloud & IA
                    </span>
                    <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-bold text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                      Alta velocidad
                    </span>
                  </div>
                  <div className="mt-2 text-left">
                    <p className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                      {data.subscription.currentPlan.limits.storageGb || 500} GB Cloud
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
                      {limitLabel(data.subscription.currentPlan.limits.aiRequestsMonthly)} consultas IA/mes
                    </p>
                  </div>
                </NexxusCard>
              </div>
            </div>

            {/* Aviso de Cambio Programado */}
            {pendingPlan && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                <strong className="font-bold">Cambio programado:</strong> tu plan cambiará de{" "}
                {data.subscription.currentPlan.name} a {pendingPlan.name} el {formatDate(renewalDate)}. Hasta entonces
                mantienes todas tus capacidades actuales sin interrupciones.
              </div>
            )}

            {/* Sección de Comparación de Planes */}
            <section className="flex flex-col gap-4 pt-2">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-navy-700 dark:text-white">
                    Catálogo de Planes Corporativos
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-white/50">
                    Los downgrades se aplican al cerrar tu período actual. Los upgrades se activan al instante.
                  </p>
                </div>
                {saving && (
                  <span className="text-xs font-bold text-brand-500 animate-pulse">Guardando cambio…</span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    current={plan.id === currentPlanId}
                    pending={plan.id === pendingPlan?.id}
                    onSelect={() => choosePlan(plan)}
                    disabled={saving}
                  />
                ))}
              </div>
            </section>
          </>
        ) : null}

        {/* Footer */}
        <footer className="py-6 text-center text-xs text-gray-400 dark:text-white/40">
          ©{new Date().getFullYear()} Nexxus · Plataforma Integral de Gestión y Recursos Humanos
        </footer>
      </div>

      {/* Modal de Upgrade Inmediato */}
      {upgradePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 p-4 backdrop-blur-sm dark:bg-black/80">
          <form
            onSubmit={submitUpgrade}
            className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-charcoal"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4 dark:border-white/10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-500 dark:text-brand-400">
                  Upgrade Inmediato
                </p>
                <h3 className="mt-1 text-2xl font-black text-navy-700 dark:text-white">
                  Activar {upgradePlan.name}
                </h3>
                <p className="mt-1 text-xs text-gray-400 dark:text-white/50">
                  Pago simulado de ${upgradePlan.price}/mes. Tus nuevas capacidades se desbloquearán de inmediato.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUpgradePlan(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition hover:bg-gray-200 hover:text-navy-700 dark:bg-white/5 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Cerrar modal"
              >
                <MdClose className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="upgrade-card">
                  Tarjeta de Prueba (Simulación)
                </label>
                <div className="relative mt-1">
                  <MdCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="upgrade-card"
                    value={card}
                    onChange={(event) => setCard(event.target.value.replace(/\D/g, "").slice(0, 19))}
                    inputMode="numeric"
                    placeholder="4242 4242 4242 4242"
                    className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/60 pl-9 pr-3 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal-dark dark:text-white dark:focus:border-brand-400"
                  />
                </div>
                <p className="mt-1 text-[10.5px] text-gray-400 dark:text-white/40">
                  No se almacena la tarjeta; solo se valida la simulación de confirmación.
                </p>
              </div>

              <label className="mt-2 flex items-start gap-2 text-xs font-medium text-gray-600 dark:text-white/70">
                <input required type="checkbox" className="mt-0.5 accent-brand-500" />
                <span>Confirmo el upgrade y la renovación mensual automática a partir de hoy.</span>
              </label>

              <button
                disabled={saving}
                type="submit"
                className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-brand-500 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95 disabled:opacity-50 dark:bg-brand-400"
              >
                {saving ? "Confirmando upgrade…" : `Confirmar pago de $${upgradePlan.price}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
