import { useEffect, useMemo, useState } from "react";
import {
  MdOutlineBusiness,
  MdCheckCircle,
  MdOutlineWarningAmber,
  MdOutlineAttachMoney,
  MdAdd,
  MdOutlineSearch,
  MdOutlinePeople,
  MdOutlineArrowForward,
  MdOutlineEdit,
  MdOutlineDelete,
  MdOutlineBlock,
  MdOutlineCheck,
  MdOutlineAccessTime,
  MdOutlineCreditCard,
  MdOutlineShield,
  MdOutlineEmail,
  MdOutlinePerson,
  MdOutlineContentCopy,
  MdOutlineReceiptLong,
  MdOutlineClose,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import Avatar from "components/nexxus/Avatar";
import InputField from "components/fields/InputField";
import Modal from "components/nexxus/Modal";
import CodigoEmpresaDisplay from "components/nexxus/CodigoEmpresaDisplay";
import {
  getPlatformStats,
  subscribeCompanies,
  loadMoreCompanies,
  subscribeCompanyDetail,
  updateCompanyProfile,
  getAvailablePlans,
  changeCompanyPlan,
  applyCompanyAction,
  setCompanyBan,
  deleteCompany,
  createCompany,
} from "services/superAdminRepository";
import {
  formatoMoneda,
  formatoFecha,
  etiquetaEstadoEmpresa,
  etiquetaRol,
  etiquetaEstadoUsuario,
} from "services/saFormat";
import { subirLogoEmpresa, validarLogoEmpresa } from "services/companyLogoUpload";

const LIMITE = 20;

const PLAN_NAME_MAP: Record<string, string> = {
  starter: "Starter",
  business: "Business",
  enterprise: "Enterprise",
  "sin plan": "Sin plan",
  "sin_plan": "Sin plan",
};

const PLAN_BADGES: Record<string, { label: string; badge: string; dot: string; barColor: string }> = {
  enterprise: {
    label: "Enterprise",
    badge: "bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300 border border-purple-500/20",
    dot: "bg-purple-500",
    barColor: "bg-purple-500",
  },
  business: {
    label: "Business",
    badge: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300 border border-blue-500/20",
    dot: "bg-blue-500",
    barColor: "bg-blue-500",
  },
  starter: {
    label: "Starter",
    badge: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-500/20",
    dot: "bg-emerald-500",
    barColor: "bg-emerald-500",
  },
  "sin plan": {
    label: "Sin plan",
    badge: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70 border border-gray-200/50 dark:border-white/10",
    dot: "bg-gray-400",
    barColor: "bg-gray-300 dark:bg-white/20",
  },
};

function normalizePlanName(raw: string | null | undefined): string {
  if (!raw) return "Sin plan";
  const str = String(raw).trim();
  const lower = str.toLowerCase();
  if (PLAN_NAME_MAP[lower]) return PLAN_NAME_MAP[lower];
  if (lower.includes("enter")) return "Enterprise";
  if (lower.includes("bus")) return "Business";
  if (lower.includes("start")) return "Starter";
  if (lower.includes("sin")) return "Sin plan";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(str)) return "Enterprise";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getPlanBadge(planName: string) {
  const normalized = normalizePlanName(planName).toLowerCase();
  return (
    PLAN_BADGES[normalized] || {
      label: normalizePlanName(planName),
      badge: "bg-brand-500/10 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300 border border-brand-500/20",
      dot: "bg-brand-500",
      barColor: "bg-brand-500",
    }
  );
}

const ESTADO_OPTIONS = [
  { value: "todas", label: "Todas" },
  { value: "activas", label: "Activas" },
  { value: "baneadas", label: "Baneadas / Suspendidas" },
];

function MetaCard({
  icon: Icon,
  label,
  value,
  sub,
  copyable,
  onCopy,
  copied,
}: {
  icon?: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: string;
  copyable?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100/90 bg-gray-50/60 p-3.5 shadow-2xs transition-all hover:border-gray-200 dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-white/10">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-gray-400 dark:text-white/40">
          {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
          <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </div>
        {copyable && onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            title="Copiar al portapapeles"
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-gray-400 hover:bg-gray-200/60 hover:text-brand-500 dark:hover:bg-white/10 dark:hover:text-brand-300 transition-colors"
          >
            {copied ? (
              <>
                <MdOutlineCheck className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500">Copiado</span>
              </>
            ) : (
              <>
                <MdOutlineContentCopy className="h-3 w-3" />
                <span>Copiar</span>
              </>
            )}
          </button>
        ) : null}
      </div>
      <div className="mt-2 text-xs sm:text-sm font-bold text-navy-700 dark:text-white break-all">
        {value !== undefined && value !== null && value !== "" ? value : "—"}
      </div>
      {sub ? <p className="mt-1 text-[11px] font-medium text-gray-400 dark:text-white/40">{sub}</p> : null}
    </div>
  );
}

export default function Empresas() {
  const [stats, setStats] = useState<any>(null);
  const [statsError, setStatsError] = useState("");

  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [filtroPlan, setFiltroPlan] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [companies, setCompanies] = useState<any[]>([]);
  const [cursor, setCursor] = useState<any>(null);
  const [hayMas, setHayMas] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [companiesError, setCompaniesError] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ empresa: any; usuarios: any[]; pagos: any[] }>({
    empresa: null,
    usuarios: [],
    pagos: [],
  });
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: "", giro: "", tamanoEquipo: "", codigo: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = (email: string) => {
    if (!email) return;
    navigator.clipboard?.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    nombreEmpresa: "",
    nombreAdmin: "",
    correoAdmin: "",
    contrasenaAdmin: "",
    giroActividad: "",
    tamanoEquipo: "",
    plan: "Starter",
  });
  const [createLogo, setCreateLogo] = useState<File | null>(null);
  const [createLogoPreview, setCreateLogoPreview] = useState("");
  const [createLogoError, setCreateLogoError] = useState("");

  // KPIs
  useEffect(() => {
    let active = true;
    getPlatformStats()
      .then((value) => active && setStats(value))
      .catch((err) => active && setStatsError(err.message || "No se pudieron cargar las estadísticas."));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getAvailablePlans()
      .then((items) => active && setPlans(items))
      .catch((err) => active && setActionError(err.message || "No se pudieron cargar los planes."));
    return () => {
      active = false;
    };
  }, []);

  // Filtros -> listado en vivo
  const filtros = useMemo(() => {
    const f: { estado?: string; plan?: string } = {};
    if (filtroEstado !== "todas") f.estado = filtroEstado;
    if (filtroPlan) f.plan = filtroPlan;
    return f;
  }, [filtroEstado, filtroPlan]);

  useEffect(() => {
    setLoadingCompanies(true);
    setCompaniesError("");
    const unsubscribe = subscribeCompanies(
      filtros,
      LIMITE,
      ({ items, cursor: nextCursor, hayMas: masDisponibles }) => {
        setCompanies(items);
        setCursor(nextCursor);
        setHayMas(masDisponibles);
        setLoadingCompanies(false);
      },
      (err) => {
        setCompaniesError(err.message || "No se pudo conectar con el servidor.");
        setLoadingCompanies(false);
      }
    );
    return () => unsubscribe();
  }, [filtroEstado, filtroPlan]);

  // Detalle de la empresa seleccionada
  useEffect(() => {
    if (!selectedId) {
      setDetail({ empresa: null, usuarios: [], pagos: [] });
      return undefined;
    }
    setDetailLoading(true);
    setDetailError("");
    const unsubscribe = subscribeCompanyDetail(
      selectedId,
      (value) => {
        setDetail(value);
        setDetailLoading(false);
      },
      (err) => {
        setDetailError(err.message || "No se pudo cargar el detalle de la empresa.");
        setDetailLoading(false);
      }
    );
    return () => unsubscribe();
  }, [selectedId]);

  useEffect(() => {
    if (detail.empresa) {
      setEditForm({
        nombre: detail.empresa.nombre || "",
        giro: detail.empresa.giro || "",
        tamanoEquipo: detail.empresa.tamanoEquipo || "",
        codigo: detail.empresa.codigo || "",
      });
      const currentPlan = plans.find((plan) => plan.nombre === detail.empresa.plan);
      setSelectedPlanId(currentPlan?.id || "");
      setEditMode(false);
    }
  }, [detail.empresa, plans]);

  const planesDisponibles = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((empresa) => {
      if (empresa.plan) set.add(normalizePlanName(empresa.plan));
    });
    return [...set].sort();
  }, [companies]);

  const empresasFiltradas = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter((emp) => {
      return (
        (emp.nombre || "").toLowerCase().includes(term) ||
        (emp.codigo || "").toLowerCase().includes(term) ||
        (emp.plan || "").toLowerCase().includes(term)
      );
    });
  }, [companies, busqueda]);

  const planDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      Enterprise: 0,
      Business: 0,
      Starter: 0,
      "Sin plan": 0,
    };

    companies.forEach((emp) => {
      const name = normalizePlanName(emp.plan);
      counts[name] = (counts[name] || 0) + 1;
    });

    const total = Object.values(counts).reduce((acc, n) => acc + n, 0) || 1;
    return [
      { name: "Enterprise", count: counts.Enterprise || 0, percent: Math.round(((counts.Enterprise || 0) / total) * 100), style: PLAN_BADGES.enterprise },
      { name: "Business", count: counts.Business || 0, percent: Math.round(((counts.Business || 0) / total) * 100), style: PLAN_BADGES.business },
      { name: "Starter", count: counts.Starter || 0, percent: Math.round(((counts.Starter || 0) / total) * 100), style: PLAN_BADGES.starter },
      { name: "Sin plan", count: counts["Sin plan"] || 0, percent: Math.round(((counts["Sin plan"] || 0) / total) * 100), style: PLAN_BADGES["sin plan"] },
    ].filter((item) => item.count > 0);
  }, [companies]);

  const handleCargarMas = async () => {
    if (!hayMas || loadingMore) return;
    setLoadingMore(true);
    try {
      const { items, cursor: nextCursor, hayMas: masDisponibles } = await loadMoreCompanies(
        filtros,
        LIMITE,
        cursor
      );
      setCompanies((prev) => [...prev, ...items]);
      setCursor(nextCursor);
      setHayMas(masDisponibles);
    } catch (err: any) {
      setCompaniesError(err.message || "No se pudieron cargar más empresas.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleGuardarPerfil = async (e: any) => {
    e.preventDefault();
    if (!detail.empresa) return;
    setSaving(true);
    setSaveError("");
    try {
      await updateCompanyProfile(detail.empresa.id, editForm);
      setEditMode(false);
    } catch (err: any) {
      setSaveError(err.message || "No se pudo guardar el perfil de la empresa.");
    } finally {
      setSaving(false);
    }
  };

  const handleAccion = async (action: string, confirmMsg: string) => {
    if (!detail.empresa) return;
    if (!window.confirm(confirmMsg)) return;
    setActionBusy(true);
    setActionError("");
    try {
      await applyCompanyAction(detail.empresa.id, action);
    } catch (err: any) {
      setActionError(err.message || "No se pudo aplicar la acción.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleCambiarPlan = async () => {
    if (!detail.empresa || !selectedPlanId) return;
    const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);
    if (!selectedPlan || selectedPlan.nombre === detail.empresa.plan) return;
    if (!window.confirm(`¿Cambiar el plan de "${detail.empresa.nombre}" a ${selectedPlan.nombre}?`)) return;
    setActionBusy(true);
    setActionError("");
    try {
      await changeCompanyPlan(detail.empresa.id, selectedPlan.id);
    } catch (err: any) {
      setActionError(err.message || "No se pudo cambiar el plan.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleBanear = async () => {
    if (!detail.empresa) return;
    const verbo = detail.empresa.baneada ? "Desbanear" : "Banear";
    if (!window.confirm(`¿${verbo} "${detail.empresa.nombre}" y todos sus usuarios?`)) return;
    setActionBusy(true);
    setActionError("");
    try {
      await setCompanyBan(detail.empresa.id, !detail.empresa.baneada);
    } catch (err: any) {
      setActionError(err.message || "No se pudo cambiar el baneo.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleEliminar = async () => {
    if (!detail.empresa) return;
    const nombre = detail.empresa.nombre;
    const escrito = window.prompt(
      `Esto elimina "${nombre}" y sus usuarios de forma permanente. Escribe el nombre exacto para confirmar:`
    );
    if (escrito === null) return;
    setActionBusy(true);
    setActionError("");
    try {
      await deleteCompany(detail.empresa.id, escrito);
      setSelectedId(null);
    } catch (err: any) {
      setActionError(err.message || "No se pudo eliminar la empresa.");
    } finally {
      setActionBusy(false);
    }
  };

  const seleccionarLogoCreacion = (archivo?: File | null) => {
    if (!archivo) return;
    const error = validarLogoEmpresa(archivo);
    setCreateLogoError(error || "");
    if (error) return;
    setCreateLogo(archivo);
    setCreateLogoPreview((actual) => {
      if (actual) URL.revokeObjectURL(actual);
      return URL.createObjectURL(archivo);
    });
  };

  const handleCrearEmpresa = async (event: any) => {
    event.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const { empresaId } = await createCompany(createForm);
      if (createLogo && empresaId) {
        const { url, publicId } = await subirLogoEmpresa(createLogo, empresaId);
        await updateCompanyProfile(empresaId, { logoUrl: url, logoPublicId: publicId });
      }
      setCreateForm({
        nombreEmpresa: "",
        nombreAdmin: "",
        correoAdmin: "",
        contrasenaAdmin: "",
        giroActividad: "",
        tamanoEquipo: "",
        plan: "Starter",
      });
      if (createLogoPreview) URL.revokeObjectURL(createLogoPreview);
      setCreateLogo(null);
      setCreateLogoPreview("");
      setCreateLogoError("");
      setShowCreatePanel(false);
    } catch (err: any) {
      setCreateError(err.message || "No se pudo crear la empresa.");
    } finally {
      setCreating(false);
    }
  };

  const ingresoPromedio =
    stats && stats.empresasActivas > 0 ? stats.ingresos30d / stats.empresasActivas : 0;

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Header Superior */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-navy-700 sm:text-3xl dark:text-white">
            Directorio de Empresas
          </h1>
          <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm dark:text-white/60">
            Administración centralizada, estados de suscripción y límites organizacionales.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCreatePanel(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-brand-500/25 transition duration-150 hover:bg-brand-600 active:scale-[0.98]"
          >
            <MdAdd className="h-4 w-4" />
            <span>Crear Empresa</span>
          </button>
        </div>
      </div>

      {/* Banner de errores si surgen */}
      {statsError && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
          <div className="flex items-center gap-2">
            <MdOutlineWarningAmber className="h-5 w-5 shrink-0" />
            <span>{statsError}</span>
          </div>
          <button type="button" onClick={() => setStatsError("")} className="uppercase tracking-wider hover:underline">
            Cerrar
          </button>
        </div>
      )}

      {/* Grid Asimétrico: Hero Card Principal (7 cols) + Right Stack (5 cols) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
        {/* Left Hero Card (7 columnas) */}
        <div className="lg:col-span-7 flex flex-col">
          <NexxusCard extra="p-6 h-full flex flex-col justify-between" delay={50}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-navy-700 dark:text-white">
                  Ecosistema de Organizaciones
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {stats ? `${stats.empresasTotal} Empresas Registradas` : "Cargando..."}
                </span>
              </div>

              {/* Métrica Gigante */}
              <div className="mt-4">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-brand-500 dark:text-brand-300">
                  {stats ? `${stats.empresasTotal} Empresas` : "—"}
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-white/60">
                  <span>Ingreso mensual promedio: {formatoMoneda(ingresoPromedio)}</span>
                  <span className="font-normal text-gray-400 dark:text-white/40">
                    · {stats ? stats.empresasActivas : 0} activas en producción
                  </span>
                </p>
              </div>

              {/* Barra de Distribución Proporcional de Empresas por Plan */}
              <div className="mt-6">
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  {planDistribution.map((item) => (
                    <div
                      key={item.name}
                      title={`${item.name}: ${item.count} empresas (${item.percent}%)`}
                      className={`${item.style.barColor} transition-all duration-500`}
                      style={{ width: `${item.percent}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Leyenda de Métricas por Plan */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
              {planDistribution.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${item.style.dot} shrink-0`} />
                    <p className="text-xs font-semibold text-gray-400 dark:text-white/50">{item.name}</p>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-lg sm:text-xl font-black text-navy-700 dark:text-white">
                      {item.count}
                    </span>
                    <span className="text-[11px] font-medium text-gray-400 dark:text-white/40">
                      ({item.percent}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </NexxusCard>
        </div>

        {/* Right Stack (5 columnas) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <NexxusCard extra="p-5 flex-1 flex flex-col justify-between" delay={100}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Organizaciones Activas</p>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                100% Operatividad
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                {stats ? stats.empresasActivas : "—"}
              </h4>
              <span className="text-xs text-gray-400 dark:text-white/40">
                {stats ? stats.empresasTotal - stats.empresasActivas : 0} suspendidas
              </span>
            </div>
          </NexxusCard>

          <NexxusCard extra="p-5 flex-1 flex flex-col justify-between" delay={130}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Empresas Sancionadas</p>
              <span
                className={`text-xs font-bold ${
                  stats && stats.empresasBaneadas > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {stats && stats.empresasBaneadas > 0 ? `${stats.empresasBaneadas} bloqueadas` : "Sin bloqueos"}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                {stats ? stats.empresasBaneadas : 0}
              </h4>
              <span className="text-xs text-gray-400 dark:text-white/40">
                Cuentas suspendidas
              </span>
            </div>
          </NexxusCard>

          <NexxusCard extra="p-5 flex-1 flex flex-col justify-between" delay={160}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Ingreso Promedio por Empresa</p>
              <span className="text-xs font-bold text-brand-500">Recurrente</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                {formatoMoneda(ingresoPromedio)}
              </h4>
              <span className="text-xs text-gray-400 dark:text-white/40">ARPU de plataforma</span>
            </div>
          </NexxusCard>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <NexxusCard extra="p-4" delay={180}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Segmented Controls por Estado */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-gray-100/80 p-1 dark:bg-white/5">
            {ESTADO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFiltroEstado(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  filtroEstado === opt.value
                    ? "bg-white text-brand-500 shadow-xs font-bold dark:bg-charcoal dark:text-white"
                    : "text-gray-500 hover:text-navy-700 dark:text-white/60 dark:hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Búsqueda y Selector de Plan */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] sm:min-w-[260px]">
              <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border border-gray-200/80 bg-gray-50/60 pl-9 pr-3.5 py-1.5 text-xs text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:border-brand-400"
              />
            </div>

            <select
              id="filtro-plan"
              value={filtroPlan}
              onChange={(e) => setFiltroPlan(e.target.value)}
              className="rounded-xl border border-gray-200/80 bg-gray-50/60 px-3 py-1.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
            >
              <option value="">Todos los planes</option>
              {planesDisponibles.map((plan) => (
                <option key={plan} value={plan}>
                  Plan {plan}
                </option>
              ))}
            </select>
          </div>
        </div>
      </NexxusCard>

      {/* Listado Principal de Empresas */}
      <NexxusCard extra="p-6" delay={200}>
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 dark:border-white/10">
          <div>
            <h3 className="text-base font-bold text-navy-700 dark:text-white">
              Organizaciones Registradas
            </h3>
            <p className="text-xs text-gray-400 dark:text-white/40">
              Mostrando {empresasFiltradas.length} de {companies.length} empresas
            </p>
          </div>
        </div>

        {companiesError ? (
          <div className="my-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
            {companiesError}
          </div>
        ) : null}

        {loadingCompanies && companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
            <p className="mt-3 text-xs font-medium">Cargando directorio de empresas...</p>
          </div>
        ) : empresasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
            <MdOutlineBusiness className="h-10 w-10 text-gray-300 dark:text-white/20" />
            <p className="mt-2 text-sm font-bold text-navy-700 dark:text-white">No se encontraron empresas</p>
            <p className="text-xs text-gray-400 dark:text-white/50">Intenta ajustando los filtros o el término de búsqueda.</p>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            {empresasFiltradas.map((empresa) => {
              const badge = getPlanBadge(empresa.plan);
              const esActiva = empresa.estado === "activa" || empresa.paymentStatus === "active";

              return (
                <div
                  key={empresa.id}
                  onClick={() => setSelectedId(empresa.id)}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-100/80 bg-white/70 p-3.5 shadow-xs cursor-pointer transition-all duration-200 hover:border-gray-200 hover:bg-white hover:shadow-sm dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-white/10 dark:hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar src={empresa.logoUrl} name={empresa.nombre} size={10} />
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-navy-700 dark:text-white group-hover:text-brand-500 transition-colors">
                          {empresa.nombre}
                        </p>
                        <CodigoEmpresaDisplay code={empresa.codigo || empresa.id.slice(0, 8)} />
                      </div>
                      <p className="truncate text-[11px] font-medium text-gray-400 dark:text-white/50">
                        Registrada el {formatoFecha(empresa.fechaCreacion)} · {empresa.usuariosTotal || 0} usuarios
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pl-2">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${badge.badge}`}>
                      {badge.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        esActiva
                          ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                          : "bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${esActiva ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                      {etiquetaEstadoEmpresa(empresa.estado)}
                    </span>
                    <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 group-hover:bg-gray-100 group-hover:text-navy-700 dark:group-hover:bg-white/10 dark:group-hover:text-white transition-all">
                      <MdOutlineArrowForward className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })}

            {hayMas ? (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleCargarMas}
                  disabled={loadingMore}
                  className="rounded-xl border border-gray-200/80 bg-white px-5 py-2 text-xs font-bold text-navy-700 shadow-xs transition hover:bg-gray-50 active:scale-95 disabled:opacity-50 dark:border-white/10 dark:bg-charcoal dark:text-white"
                >
                  {loadingMore ? "Cargando..." : "Cargar más empresas"}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </NexxusCard>

      {/* Modal: Crear Empresa */}
      <Modal
        isOpen={showCreatePanel}
        onClose={() => setShowCreatePanel(false)}
        title="Registrar Nueva Organización"
        width="max-w-3xl"
      >
        <div className="p-1">
          <form onSubmit={handleCrearEmpresa} className="flex flex-col gap-5">
            {/* Logotipo */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
              <label className="text-xs font-bold uppercase tracking-wider text-navy-700 dark:text-white">
                Logotipo Corporativo
              </label>
              <div className="mt-3 flex items-center gap-4">
                <label
                  htmlFor="crear-empresa-logo"
                  className="group relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-white shadow-2xs transition-all hover:border-brand-500 dark:border-white/15 dark:bg-charcoal"
                >
                  {createLogoPreview ? (
                    <img alt="Logo de la empresa" src={createLogoPreview} className="h-full w-full object-cover" />
                  ) : (
                    <span className="px-2 text-center text-[11px] font-bold text-brand-500 group-hover:scale-105 transition-transform">
                      + Subir Logo
                    </span>
                  )}
                </label>
                <div>
                  <p className="text-xs font-bold text-navy-700 dark:text-white">Imagen de marca de la empresa</p>
                  <p className="mt-0.5 text-[11px] text-gray-400 dark:text-white/50">
                    Opcional. Formatos JPG, PNG o WEBP (máx. 3 MB).
                  </p>
                  {createLogoError ? <p className="mt-1 text-xs font-semibold text-red-500">{createLogoError}</p> : null}
                </div>
              </div>
              <input
                id="crear-empresa-logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => seleccionarLogoCreacion(e.target.files?.[0])}
              />
            </div>

            {/* Datos de la Organización */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-700 dark:text-white mb-3">
                Información de la Organización
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputField
                  label="Nombre de la empresa *"
                  id="crear-empresa-nombre"
                  placeholder="Ej. Acme Corporation"
                  value={createForm.nombreEmpresa}
                  onChange={(e) => setCreateForm((f) => ({ ...f, nombreEmpresa: e.target.value }))}
                />
                <InputField
                  label="Giro o Sector"
                  id="crear-empresa-giro"
                  placeholder="Ej. Tecnología, Retail, Salud"
                  value={createForm.giroActividad}
                  onChange={(e) => setCreateForm((f) => ({ ...f, giroActividad: e.target.value }))}
                />
                <InputField
                  label="Tamaño del equipo"
                  id="crear-empresa-tamano"
                  placeholder="Ej. 1 - 10 empleados"
                  value={createForm.tamanoEquipo}
                  onChange={(e) => setCreateForm((f) => ({ ...f, tamanoEquipo: e.target.value }))}
                />
                <div className="flex flex-col">
                  <label htmlFor="crear-empresa-plan" className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                    Plan Inicial
                  </label>
                  <select
                    id="crear-empresa-plan"
                    value={createForm.plan}
                    onChange={(e) => setCreateForm((f) => ({ ...f, plan: e.target.value }))}
                    className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:border-white/10 dark:bg-charcoal dark:text-white"
                  >
                    <option value="Starter">Plan Starter</option>
                    <option value="Business">Plan Business</option>
                    <option value="Enterprise">Plan Enterprise</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Administrador Inicial */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-700 dark:text-white mb-3">
                Administrador Principal
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputField
                  label="Nombre del administrador *"
                  id="crear-empresa-admin-nombre"
                  placeholder="Ej. Juan Pérez"
                  value={createForm.nombreAdmin}
                  onChange={(e) => setCreateForm((f) => ({ ...f, nombreAdmin: e.target.value }))}
                />
                <InputField
                  label="Correo del administrador *"
                  id="crear-empresa-admin-correo"
                  type="email"
                  placeholder="admin@empresa.com"
                  value={createForm.correoAdmin}
                  onChange={(e) => setCreateForm((f) => ({ ...f, correoAdmin: e.target.value }))}
                />
                <div className="md:col-span-2">
                  <InputField
                    label="Contraseña inicial *"
                    id="crear-empresa-admin-password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={createForm.contrasenaAdmin}
                    onChange={(e) => setCreateForm((f) => ({ ...f, contrasenaAdmin: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {createError ? (
              <p className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                {createError}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowCreatePanel(false)}
                className="rounded-xl bg-gray-100 px-4 py-2.5 text-xs font-bold text-gray-600 transition hover:bg-gray-200 dark:bg-white/5 dark:text-white/70"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-brand-500/25 transition hover:bg-brand-600 active:scale-95 disabled:opacity-50"
              >
                {creating ? "Registrando organización..." : "Crear Organización"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Detalle de Empresa */}
      <Modal
        isOpen={!!selectedId}
        onClose={() => setSelectedId(null)}
        title="Detalle de Organización"
        width="max-w-3xl"
      >
        <div className="p-1">
          {detailError ? (
            <div className="mb-4 rounded-xl bg-red-50 p-4 text-xs font-bold text-red-700 dark:bg-red-400/10 dark:text-red-400">
              {detailError}
            </div>
          ) : null}

          {detailLoading && !detail.empresa ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
              <p className="mt-3 text-xs font-medium">Cargando expediente de la empresa...</p>
            </div>
          ) : !detail.empresa ? (
            !detailError && (
              <p className="py-12 text-center text-xs font-medium text-gray-400">Esta empresa ya no existe.</p>
            )
          ) : (
            <div className="flex flex-col gap-5">
              {/* Header Card / Identidad Corporativa */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50/70 p-4.5 dark:border-white/10 dark:bg-white/[0.02]">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar src={detail.empresa?.logoUrl} name={detail.empresa?.nombre} size={14} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg sm:text-xl font-black text-navy-700 dark:text-white">
                        {detail.empresa?.nombre}
                      </h3>
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getPlanBadge(detail.empresa.plan).badge}`}>
                        {getPlanBadge(detail.empresa.plan).label}
                      </span>
                      {(() => {
                        const esBaneada = Boolean(detail.empresa.baneada || detail.empresa.estado === "baneada");
                        const esSuspendida = detail.empresa.estado === "suspendida";

                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              esBaneada
                                ? "bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300"
                                : esSuspendida
                                ? "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300"
                                : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                esBaneada
                                  ? "bg-rose-500"
                                  : esSuspendida
                                  ? "bg-amber-500"
                                  : "bg-emerald-500 animate-pulse"
                              }`}
                            />
                            {esBaneada
                              ? "Baneada / Bloqueada"
                              : esSuspendida
                              ? "Suspendida"
                              : "Activa y Operativa"}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400 dark:text-white/50">
                      <span>Código:</span>
                      <CodigoEmpresaDisplay code={detail.empresa?.codigo || detail.empresa?.id?.slice(0, 8) || "—"} />
                      <span>·</span>
                      <span>Registrada el {formatoFecha(detail.empresa?.fechaCreacion)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditMode(!editMode)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold shadow-2xs transition active:scale-95 ${
                      editMode
                        ? "border-brand-500 bg-brand-50 text-brand-600 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-300"
                        : "border-gray-200/80 bg-white text-navy-700 hover:bg-gray-50 dark:border-white/10 dark:bg-charcoal dark:text-white"
                    }`}
                  >
                    {editMode ? (
                      <>
                        <MdOutlineClose className="h-4 w-4" />
                        <span>Cerrar Edición</span>
                      </>
                    ) : (
                      <>
                        <MdOutlineEdit className="h-4 w-4 text-brand-500" />
                        <span>Editar Perfil</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Formulario de Edición de Perfil (si editMode es true) */}
              {editMode ? (
                <form
                  onSubmit={handleGuardarPerfil}
                  className="rounded-2xl border border-brand-500/20 bg-brand-500/[0.02] p-4.5 dark:border-brand-400/20 dark:bg-brand-400/[0.02]"
                >
                  <div className="flex items-center justify-between border-b border-brand-500/10 pb-3 dark:border-brand-400/10">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300">
                        Editar Información de Organización
                      </h4>
                      <p className="text-[11px] text-gray-400 dark:text-white/40">
                        Actualiza la identidad, código y datos generales de la empresa.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <InputField
                      label="Nombre de la empresa"
                      id="edit-nombre"
                      value={editForm.nombre}
                      onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
                    />
                    <InputField
                      label="Código de empresa"
                      id="edit-codigo"
                      value={editForm.codigo}
                      onChange={(e) => setEditForm((f) => ({ ...f, codigo: e.target.value }))}
                    />
                    <InputField
                      label="Giro o Sector"
                      id="edit-giro"
                      value={editForm.giro}
                      onChange={(e) => setEditForm((f) => ({ ...f, giro: e.target.value }))}
                    />
                    <InputField
                      label="Tamaño del equipo"
                      id="edit-tamano"
                      value={editForm.tamanoEquipo}
                      onChange={(e) => setEditForm((f) => ({ ...f, tamanoEquipo: e.target.value }))}
                    />
                  </div>

                  {saveError ? (
                    <p className="mt-3 rounded-xl bg-red-50 p-2.5 text-xs font-bold text-red-500 dark:bg-red-500/10 dark:text-red-400">
                      {saveError}
                    </p>
                  ) : null}

                  <div className="mt-4 flex items-center justify-end gap-2.5 pt-3 border-t border-brand-500/10 dark:border-brand-400/10">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-white/70"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-brand-500/25 transition hover:bg-brand-600 active:scale-95 disabled:opacity-50"
                    >
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                </form>
              ) : null}

              {/* Grid de Metadatos Clave */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <MetaCard
                  icon={MdOutlineBusiness}
                  label="Giro o Sector"
                  value={detail.empresa?.giro || "No especificado"}
                />
                <MetaCard
                  icon={MdOutlinePeople}
                  label="Tamaño del Equipo"
                  value={detail.empresa?.tamanoEquipo || "No especificado"}
                />
                <MetaCard
                  icon={MdCheckCircle}
                  label="Usuarios Registrados"
                  value={`${detail.usuarios.length} ${detail.usuarios.length === 1 ? "usuario" : "usuarios"}`}
                />
                <MetaCard
                  icon={MdOutlinePerson}
                  label="Administrador Principal"
                  value={detail.empresa?.adminNombre || "Sin asignar"}
                />
                <MetaCard
                  icon={MdOutlineEmail}
                  label="Correo de Contacto"
                  value={detail.empresa?.adminCorreo || "No registrado"}
                  copyable={Boolean(detail.empresa?.adminCorreo)}
                  onCopy={() => handleCopyEmail(detail.empresa?.adminCorreo)}
                  copied={copiedEmail}
                />
                <MetaCard
                  icon={MdOutlineShield}
                  label="Estado Operativo"
                  value={etiquetaEstadoEmpresa(detail.empresa?.estado)}
                />
              </div>

              {/* Gestión de Suscripción & Plan */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4.5 dark:border-white/10 dark:bg-white/[0.02]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/60 pb-3.5 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <MdOutlineCreditCard className="h-4 w-4 text-brand-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-navy-700 dark:text-white">
                      Gestión de Suscripción & Plan
                    </h4>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-white/40">
                    Plan actual: <strong className="text-navy-700 dark:text-white font-bold">{detail.empresa?.plan || "Sin plan"}</strong>
                  </span>
                </div>

                {actionError ? (
                  <p className="mt-3 rounded-xl bg-red-50 p-2.5 text-xs font-bold text-red-500 dark:bg-red-500/10 dark:text-red-400">
                    {actionError}
                  </p>
                ) : null}

                {/* Fila de Cambio de Plan */}
                <div className="mt-3.5 flex flex-wrap items-center gap-3">
                  <div className="relative min-w-[220px]">
                    <select
                      value={selectedPlanId}
                      onChange={(event) => setSelectedPlanId(event.target.value)}
                      disabled={actionBusy || plans.length === 0}
                      className="w-full rounded-xl border border-gray-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                    >
                      <option value="">Selecciona un plan</option>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          Plan {plan.nombre} {plan.precioMensual ? `(${formatoMoneda(plan.precioMensual)}/mes)` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    disabled={actionBusy || !selectedPlanId || plans.find((p) => p.id === selectedPlanId)?.nombre === detail.empresa?.plan}
                    onClick={handleCambiarPlan}
                    className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-2xs shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95 disabled:opacity-40"
                  >
                    {actionBusy ? "Actualizando..." : "Cambiar Plan"}
                  </button>
                </div>

                {/* Zona de Acciones Administrativas */}
                <div className="mt-4 pt-3.5 border-t border-gray-200/60 dark:border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40">
                      Acciones Administrativas de la Cuenta:
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => handleAccion("suspender", `¿Suspender temporalmente a "${detail.empresa?.nombre}"?`)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 transition hover:bg-amber-500/20 active:scale-95 dark:bg-amber-400/10 dark:text-amber-300"
                      >
                        <MdOutlineWarningAmber className="h-3.5 w-3.5" />
                        <span>Suspender Cuenta</span>
                      </button>
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={handleBanear}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-500/20 active:scale-95 dark:bg-rose-400/10 dark:text-rose-300"
                      >
                        <MdOutlineBlock className="h-3.5 w-3.5" />
                        <span>{detail.empresa?.baneada ? "Desbloquear Empresa" : "Bloquear / Banear"}</span>
                      </button>
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={handleEliminar}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-red-700 active:scale-95"
                      >
                        <MdOutlineDelete className="h-3.5 w-3.5" />
                        <span>Eliminar Organización</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colaboradores y Pagos Asociados */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Colaboradores */}
                <div className="rounded-2xl border border-gray-100 bg-white p-4.5 shadow-2xs dark:border-white/5 dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <MdOutlinePeople className="h-4 w-4 text-brand-500" />
                      <h5 className="text-xs font-bold uppercase tracking-wider text-navy-700 dark:text-white">
                        Usuarios de la Empresa
                      </h5>
                    </div>
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-white/10 dark:text-white/70">
                      {detail.usuarios.length}
                    </span>
                  </div>
                  {detail.usuarios.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                      <MdOutlinePeople className="h-8 w-8 text-gray-300 dark:text-white/15" />
                      <p className="mt-2 text-xs font-medium">Sin colaboradores registrados aún.</p>
                      <p className="text-[11px] text-gray-400 dark:text-white/40">Los nuevos miembros aparecerán aquí al registrarse.</p>
                    </div>
                  ) : (
                    <div className="mt-2.5 flex flex-col divide-y divide-gray-100 dark:divide-white/5 max-h-56 overflow-y-auto custom-scrollbar">
                      {detail.usuarios.slice(0, 10).map((u) => (
                        <div key={u.id} className="flex items-center justify-between py-2.5 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar name={u.nombre || u.correo} size={8} />
                            <div className="min-w-0">
                              <p className="truncate font-bold text-navy-700 dark:text-white">{u.nombre || "Usuario sin nombre"}</p>
                              <p className="truncate text-[11px] text-gray-400">{u.correo}</p>
                            </div>
                          </div>
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 shrink-0 dark:bg-white/10 dark:text-white/70">
                            {etiquetaRol(u.rol)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagos */}
                <div className="rounded-2xl border border-gray-100 bg-white p-4.5 shadow-2xs dark:border-white/5 dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <MdOutlineReceiptLong className="h-4 w-4 text-brand-500" />
                      <h5 className="text-xs font-bold uppercase tracking-wider text-navy-700 dark:text-white">
                        Pagos Registrados
                      </h5>
                    </div>
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-white/10 dark:text-white/70">
                      {detail.pagos.length}
                    </span>
                  </div>
                  {detail.pagos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                      <MdOutlineReceiptLong className="h-8 w-8 text-gray-300 dark:text-white/15" />
                      <p className="mt-2 text-xs font-medium">Sin historial de pagos.</p>
                      <p className="text-[11px] text-gray-400 dark:text-white/40">Los cobros y suscripciones se registrarán aquí.</p>
                    </div>
                  ) : (
                    <div className="mt-2.5 flex flex-col divide-y divide-gray-100 dark:divide-white/5 max-h-56 overflow-y-auto custom-scrollbar">
                      {detail.pagos.slice(0, 10).map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-2.5 text-xs">
                          <div>
                            <p className="font-bold text-navy-700 dark:text-white">{formatoMoneda(p.amount)}</p>
                            <p className="text-[11px] text-gray-400">{formatoFecha(p.createdAt)}</p>
                          </div>
                          <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                            {p.status || "Exitoso"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
