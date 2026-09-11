import { useEffect, useMemo, useState } from "react";
import {
  MdOutlinePeople,
  MdOutlineBusinessCenter,
  MdOutlineSupervisorAccount,
  MdOutlineBadge,
  MdStar,
  MdOutlineSearch,
  MdOutlinePersonAdd,
  MdOutlineEdit,
  MdOutlineDelete,
  MdOutlineBlock,
  MdOutlineCheck,
  MdOutlineLockReset,
  MdOutlineEmail,
  MdOutlinePhone,
  MdOutlineDomain,
  MdOutlineLocationOn,
  MdOutlineShield,
  MdOutlineContentCopy,
  MdOutlineBusiness,
  MdOutlineClose,
  MdOutlineArrowForward,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import Avatar from "components/nexxus/Avatar";
import InputField from "components/fields/InputField";
import Modal from "components/nexxus/Modal";

import {
  getPlatformStats,
  subscribeUsers,
  loadMoreUsers,
  loadMoreCompanies,
  updateUser,
  setUserBan,
  deleteUser,
  resetPassword,
  createUser,
} from "services/superAdminRepository";
import {
  etiquetaRol,
  etiquetaEstadoUsuario,
  formatoFecha,
  ROLE_OPTIONS,
} from "services/saFormat";
import { useAuth } from "context/AuthContext";

const LIMITE = 25;

const ESTADO_OPTIONS = [
  { value: "activos", label: "Activos" },
  { value: "inactivos", label: "Inactivos" },
  { value: "baneados", label: "Baneados" },
  { value: "eliminados", label: "Eliminados" },
];

function getRoleBadge(rol: string) {
  switch (rol) {
    case "super_admin":
      return {
        label: "Super Admin",
        badge: "bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300 border border-rose-500/20",
        dot: "bg-rose-500",
      };
    case "admin_empresa":
      return {
        label: "Propietario",
        badge: "bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300 border border-purple-500/20",
        dot: "bg-purple-500",
      };
    case "admin":
      return {
        label: "Admin",
        badge: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-300 border border-indigo-500/20",
        dot: "bg-indigo-500",
      };
    case "jefe":
    case "jefe_sector":
      return {
        label: "Jefe",
        badge: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300 border border-blue-500/20",
        dot: "bg-blue-500",
      };
    case "empleado":
    case "psicologo":
      return {
        label: "Empleado",
        badge: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-500/20",
        dot: "bg-emerald-500",
      };
    default:
      return {
        label: rol || "Sin rol",
        badge: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70 border border-gray-200/50 dark:border-white/10",
        dot: "bg-gray-400",
      };
  }
}

function getUserStateBadge(usuario: any) {
  if (usuario.eliminado) {
    return {
      label: "Eliminado",
      badge: "bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300 border border-rose-500/20",
      dot: "bg-rose-500",
    };
  }
  if (usuario.baneado) {
    return {
      label: "Baneado",
      badge: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-500/20",
      dot: "bg-amber-500",
    };
  }
  if (!usuario.activo) {
    return {
      label: "Inactivo",
      badge: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60 border border-gray-200/50 dark:border-white/10",
      dot: "bg-gray-400",
    };
  }
  return {
    label: "Activo",
    badge: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-500/20",
    dot: "bg-emerald-500 animate-pulse",
  };
}

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

export default function Usuarios() {
  const { user: usuarioActual } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [statsError, setStatsError] = useState("");

  const [companies, setCompanies] = useState<any[]>([]);

  const [empresaFiltro, setEmpresaFiltro] = useState("");
  const [rolFiltro, setRolFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("activos");
  const [busqueda, setBusqueda] = useState("");

  const [baseItems, setBaseItems] = useState<any[]>([]);
  const [extraItems, setExtraItems] = useState<any[]>([]);
  const [cursor, setCursor] = useState<any>(null);
  const [hayMas, setHayMas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [busyAction, setBusyAction] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [createForm, setCreateForm] = useState({
    nombre: "",
    correo: "",
    contrasena: "",
    rol: "empleado",
    empresaId: "",
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [createError, setCreateError] = useState("");

  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);

  const handleCopyEmail = (email: string, id: string) => {
    if (!email) return;
    navigator.clipboard?.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

  useEffect(() => {
    if (!selectedUser) {
      setEditForm(null);
      setIsEditing(false);
      return;
    }
    setEditForm({
      nombre: selectedUser.nombre || "",
      correo: selectedUser.correo || "",
      telefono: selectedUser.telefono || "",
      cargo: selectedUser.cargo || "",
      departamento: selectedUser.departamento || "",
      sede: selectedUser.sede || "",
      rol: selectedUser.rol || "empleado",
    });
    setIsEditing(false);
    setActionMsg("");
  }, [selectedUser]);

  const filtros = useMemo(() => {
    const f: { estado: string; empresaId?: string; rol?: string } = { estado: estadoFiltro };
    if (empresaFiltro) f.empresaId = empresaFiltro;
    if (rolFiltro) f.rol = rolFiltro;
    return f;
  }, [empresaFiltro, rolFiltro, estadoFiltro]);

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
    loadMoreCompanies({}, 500, null)
      .then((res) => active && setCompanies(res.items || []))
      .catch(() => active && setCompanies([]));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    setExtraItems([]);
    setSelectedUser(null);
    const unsubscribe = subscribeUsers(
      filtros,
      LIMITE,
      ({ items, cursor: nextCursor, hayMas: nextHayMas }) => {
        setBaseItems(items);
        setCursor(nextCursor);
        setHayMas(nextHayMas);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "No se pudo conectar con el servidor.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.empresaId, filtros.rol, filtros.estado]);

  const usuarios = useMemo(() => {
    const map = new Map();
    [...baseItems, ...extraItems].forEach((u) => map.set(u.id, u));
    return [...map.values()];
  }, [baseItems, extraItems]);

  const nombreEmpresaPorId = useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach((empresa) => map.set(empresa.id, empresa.nombre));
    return map;
  }, [companies]);

  const usuariosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return usuarios;
    return usuarios.filter((u) => {
      const empresa = (u.empresaNombre || nombreEmpresaPorId.get(u.empresaId) || "").toLowerCase();
      const rolStr = (etiquetaRol(u.rol) || "").toLowerCase();
      return (
        (u.nombre || "").toLowerCase().includes(term) ||
        (u.correo || "").toLowerCase().includes(term) ||
        (u.cargo || "").toLowerCase().includes(term) ||
        (u.departamento || "").toLowerCase().includes(term) ||
        rolStr.includes(term) ||
        empresa.includes(term)
      );
    });
  }, [usuarios, busqueda, nombreEmpresaPorId]);

  const roleDistribution = useMemo(() => {
    if (!stats) return [];
    const total = stats.usuariosTotal || 1;
    const adminEmpresa = stats.porRol?.admin_empresa || 0;
    const jefe = stats.porRol?.jefe || 0;
    const empleado = stats.porRol?.empleado || 0;
    const superAdmin = (stats.porRol?.super_admin || 0) + (stats.porRol?.admin || 0);

    return [
      {
        name: "Propietarios",
        count: adminEmpresa,
        percent: Math.round((adminEmpresa / total) * 100),
        dot: "bg-purple-500",
        barColor: "bg-purple-500",
        badge: "bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300 border border-purple-500/20",
      },
      {
        name: "Jefes",
        count: jefe,
        percent: Math.round((jefe / total) * 100),
        dot: "bg-blue-500",
        barColor: "bg-blue-500",
        badge: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300 border border-blue-500/20",
      },
      {
        name: "Empleados",
        count: empleado,
        percent: Math.round((empleado / total) * 100),
        dot: "bg-emerald-500",
        barColor: "bg-emerald-500",
        badge: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-500/20",
      },
      {
        name: "Super Admins",
        count: superAdmin,
        percent: Math.round((superAdmin / total) * 100),
        dot: "bg-amber-500",
        barColor: "bg-amber-500",
        badge: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-500/20",
      },
    ].filter((item) => item.count > 0 || total === 1);
  }, [stats]);

  const handleCargarMas = async () => {
    if (filtros.empresaId || !hayMas || !cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await loadMoreUsers(filtros, LIMITE, cursor);
      setExtraItems((prev) => [...prev, ...res.items]);
      setCursor(res.cursor);
      setHayMas(res.hayMas);
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar más usuarios.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleGuardarUsuario = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUser || !editForm) return;
    const { rol, ...patch } = editForm;
    const esUnoMismo = selectedUser.id === usuarioActual?.id;
    if (esUnoMismo && rol !== selectedUser.rol) {
      setActionMsg("No puedes cambiar tu propio rol. Pídele a otro superadmin que lo haga.");
      return;
    }
    if (rol !== selectedUser.rol && !window.confirm(`¿Cambiar el rol de "${selectedUser.nombre}" a "${etiquetaRol(rol)}"?`)) {
      return;
    }
    setBusyAction("guardar");
    setActionMsg("");
    try {
      await updateUser(selectedUser.id, patch, rol || null);
      setSelectedUser((prev: any) => (prev ? { ...prev, ...patch, rol } : prev));
      setIsEditing(false);
      setActionMsg("Cambios guardados con éxito.");
    } catch (err: any) {
      setActionMsg(err.message || "No se pudieron guardar los cambios.");
    } finally {
      setBusyAction("");
    }
  };

  const handleBanear = async () => {
    if (!selectedUser) return;
    const verbo = selectedUser.baneado ? "desbanear" : "banear";
    if (!window.confirm(`¿${verbo === "banear" ? "Banear" : "Desbanear"} a "${selectedUser.nombre}"?`)) return;
    setBusyAction("banear");
    setActionMsg("");
    try {
      await setUserBan(selectedUser.id, !selectedUser.baneado);
      setActionMsg(selectedUser.baneado ? "Usuario desbaneado correctamente." : "Usuario suspendido / baneado.");
      setSelectedUser((prev: any) => (prev ? { ...prev, baneado: !prev.baneado, activo: prev.baneado } : prev));
    } catch (err: any) {
      setActionMsg(err.message || "No se pudo cambiar el baneo.");
    } finally {
      setBusyAction("");
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    setBusyAction("reset");
    setActionMsg("");
    try {
      await resetPassword(selectedUser.id, "link");
      setActionMsg(`Correo de restablecimiento de contraseña enviado a ${selectedUser.correo}.`);
    } catch (err: any) {
      setActionMsg(err.message || "No se pudo enviar el correo de restablecimiento.");
    } finally {
      setBusyAction("");
    }
  };

  const handleEliminar = async () => {
    if (!selectedUser) return;
    const confirmName = window.prompt(
      `Esto elimina a "${selectedUser.nombre}" de forma permanente. Escribe el nombre exacto para confirmar:`
    );
    if (confirmName === null) return;
    setBusyAction("eliminar");
    setActionMsg("");
    try {
      await deleteUser(selectedUser.id, confirmName);
      setSelectedUser(null);
    } catch (err: any) {
      setActionMsg(err.message || "No se pudo eliminar el usuario.");
    } finally {
      setBusyAction("");
    }
  };

  const handleCrearUsuario = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createForm.nombre || !createForm.correo || !createForm.contrasena) {
      setCreateError("Por favor completa los campos requeridos.");
      return;
    }
    setCreatingUser(true);
    setCreateError("");
    try {
      await createUser(createForm);
      setCreateForm({ nombre: "", correo: "", contrasena: "", rol: "empleado", empresaId: "" });
      setShowCreatePanel(false);
    } catch (err: any) {
      setCreateError(err.message || "No se pudo crear el colaborador.");
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Superior Asymmetric Grid (7 cols + 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Hero Card (7 columnas) */}
        <div className="lg:col-span-7">
          <NexxusCard extra="p-6 h-full flex flex-col justify-between" delay={0}>
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                    Ecosistema de Personal
                  </p>
                  <h2 className="text-xl font-black tracking-tight text-navy-700 dark:text-white">
                    Directorio Global de Usuarios
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
                  <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                  Base Central
                </span>
              </div>

              {/* Métrica Gigante */}
              <div className="mt-4">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-brand-500 dark:text-brand-300">
                  {stats ? `${stats.usuariosTotal} Colaboradores` : "—"}
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-white/60">
                  <span>· {stats?.porRol?.admin_empresa ?? 0} propietarios</span>
                  <span>· {stats?.porRol?.jefe ?? 0} supervisores</span>
                  <span className="font-normal text-gray-400 dark:text-white/40">
                    · {stats?.porRol?.empleado ?? 0} personal operativo
                  </span>
                </p>
              </div>

              {/* Barra de Distribución Proporcional de Usuarios por Rol */}
              <div className="mt-6">
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  {roleDistribution.map((item) => (
                    <div
                      key={item.name}
                      title={`${item.name}: ${item.count} colaboradores (${item.percent}%)`}
                      className={`${item.barColor} transition-all duration-500`}
                      style={{ width: `${item.percent}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Leyenda de Métricas por Rol */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
              {roleDistribution.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${item.dot} shrink-0`} />
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

        {/* Right Stack (5 columnas - 3 Mini Cards) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <NexxusCard extra="p-5 flex-1 flex flex-col justify-between" delay={100}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Propietarios & Admins</p>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                Administración
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                {stats?.porRol?.admin_empresa ?? 0}
              </h4>
              <span className="text-xs text-gray-400 dark:text-white/40">
                Cuentas maestras
              </span>
            </div>
          </NexxusCard>

          <NexxusCard extra="p-5 flex-1 flex flex-col justify-between" delay={130}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Jefes & Supervisores</p>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                Supervisión
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                {stats?.porRol?.jefe ?? 0}
              </h4>
              <span className="text-xs text-gray-400 dark:text-white/40">
                Líderes de equipo
              </span>
            </div>
          </NexxusCard>

          <NexxusCard extra="p-5 flex-1 flex flex-col justify-between" delay={160}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Fuerza Operativa</p>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                App Móvil
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                {stats?.porRol?.empleado ?? 0}
              </h4>
              <span className="text-xs text-gray-400 dark:text-white/40">
                Colaboradores activos
              </span>
            </div>
          </NexxusCard>
        </div>
      </div>

      {/* Barra de Filtros, Búsqueda y Creación */}
      <NexxusCard extra="p-4" delay={180}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Segmented Controls por Estado */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-gray-100/80 p-1 dark:bg-white/5">
            {ESTADO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setEstadoFiltro(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  estadoFiltro === opt.value
                    ? "bg-white text-brand-500 shadow-xs font-bold dark:bg-charcoal dark:text-white"
                    : "text-gray-500 hover:text-navy-700 dark:text-white/60 dark:hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Búsqueda, Selectores de Empresa/Rol y Botón Crear */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Buscador */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, correo, empresa..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border border-gray-200/80 bg-gray-50/60 pl-9 pr-3.5 py-1.5 text-xs text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:border-brand-400"
              />
            </div>

            {/* Selector Empresa */}
            <select
              id="filtro-empresa"
              value={empresaFiltro}
              onChange={(e) => setEmpresaFiltro(e.target.value)}
              className="rounded-xl border border-gray-200/80 bg-gray-50/60 px-3 py-1.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
            >
              <option value="">Todas las empresas</option>
              {companies.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>

            {/* Selector Rol */}
            <select
              id="filtro-rol"
              value={rolFiltro}
              onChange={(e) => setRolFiltro(e.target.value)}
              className="rounded-xl border border-gray-200/80 bg-gray-50/60 px-3 py-1.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
            >
              <option value="">Todos los roles</option>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Botón Crear Usuario */}
            <button
              type="button"
              onClick={() => setShowCreatePanel(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-brand-500/25 transition hover:bg-brand-600 active:scale-95"
            >
              <MdOutlinePersonAdd className="h-4 w-4" />
              <span>Crear usuario</span>
            </button>
          </div>
        </div>
      </NexxusCard>

      {/* Listado Principal de Usuarios */}
      <NexxusCard extra="p-6" delay={200}>
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 dark:border-white/10">
          <div>
            <h3 className="text-base font-bold text-navy-700 dark:text-white">
              Usuarios de la Plataforma
            </h3>
            <p className="text-xs text-gray-400 dark:text-white/40">
              Mostrando {usuariosFiltrados.length} de {usuarios.length} colaboradores cargados
            </p>
          </div>
        </div>

        {error ? (
          <div className="my-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {loading && usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
            <p className="mt-3 text-xs font-medium">Cargando directorio de colaboradores...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
            <MdOutlinePeople className="h-10 w-10 text-gray-300 dark:text-white/20" />
            <p className="mt-2 text-sm font-bold text-navy-700 dark:text-white">No se encontraron usuarios</p>
            <p className="text-xs text-gray-400 dark:text-white/50">Intenta ajustando los filtros o el término de búsqueda.</p>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                  <th className="pb-3 pt-2 pl-2">Colaborador</th>
                  <th className="pb-3 pt-2">Correo Electrónico</th>
                  <th className="pb-3 pt-2">Rol</th>
                  <th className="pb-3 pt-2">Empresa</th>
                  <th className="pb-3 pt-2">Estado</th>
                  <th className="pb-3 pt-2">Registro</th>
                  <th className="pb-3 pt-2 pr-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {usuariosFiltrados.map((usuario) => {
                  const roleInfo = getRoleBadge(usuario.rol);
                  const stateInfo = getUserStateBadge(usuario);
                  const empresaNombre =
                    usuario.empresaNombre || nombreEmpresaPorId.get(usuario.empresaId) || "Sin empresa";

                  return (
                    <tr
                      key={usuario.id}
                      onClick={() => setSelectedUser(usuario)}
                      className="group cursor-pointer transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                    >
                      {/* Avatar y Nombre */}
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-3">
                          <Avatar src={usuario.fotoPerfil} name={usuario.nombre} size={9} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-xs font-bold text-navy-700 group-hover:text-brand-500 transition-colors dark:text-white">
                                {usuario.nombre || "Sin nombre"}
                              </p>
                              {usuario.esPropietario ? (
                                <span title="Propietario de la organización">
                                  <MdStar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                </span>
                              ) : null}
                            </div>
                            {usuario.cargo ? (
                              <p className="truncate text-[11px] text-gray-400 dark:text-white/40">
                                {usuario.cargo}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Correo */}
                      <td className="py-3.5 text-xs text-gray-600 dark:text-white/80 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[220px]">{usuario.correo || "—"}</span>
                          {usuario.correo ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyEmail(usuario.correo, usuario.id);
                              }}
                              className="text-gray-400 hover:text-brand-500 transition-colors"
                              title="Copiar correo"
                            >
                              {copiedEmailId === usuario.id ? (
                                <MdOutlineCheck className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <MdOutlineContentCopy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </button>
                          ) : null}
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="py-3.5">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${roleInfo.badge}`}>
                          {roleInfo.label}
                        </span>
                      </td>

                      {/* Empresa */}
                      <td className="py-3.5 text-xs font-bold text-navy-700 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <MdOutlineBusiness className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{empresaNombre}</span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${stateInfo.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${stateInfo.dot}`} />
                          {stateInfo.label}
                        </span>
                      </td>

                      {/* Fecha de Registro */}
                      <td className="py-3.5 text-xs text-gray-400 dark:text-white/40">
                        {formatoFecha(usuario.fechaCreacion)}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 pr-2 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(usuario);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1 text-xs font-bold text-navy-700 transition hover:bg-brand-500 hover:text-white active:scale-95 dark:bg-white/10 dark:text-white dark:hover:bg-brand-500"
                        >
                          <span>Ver</span>
                          <MdOutlineArrowForward className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Paginación / Cargar Más */}
            <div className="mt-4 flex justify-center border-t border-gray-100 pt-4 dark:border-white/10">
              {filtros.empresaId ? (
                <p className="text-xs font-medium text-gray-400 dark:text-white/40">
                  Todos los usuarios de esta empresa ya están cargados.
                </p>
              ) : hayMas ? (
                <button
                  type="button"
                  onClick={handleCargarMas}
                  disabled={loadingMore}
                  className="rounded-xl border border-gray-200/80 bg-white px-5 py-2 text-xs font-bold text-navy-700 shadow-xs transition hover:bg-gray-50 active:scale-95 disabled:opacity-50 dark:border-white/10 dark:bg-charcoal dark:text-white"
                >
                  {loadingMore ? "Cargando más..." : "Cargar más colaboradores"}
                </button>
              ) : (
                <p className="text-xs font-medium text-gray-400 dark:text-white/40">
                  No hay más colaboradores para mostrar.
                </p>
              )}
            </div>
          </div>
        )}
      </NexxusCard>

      {/* Modal: Crear Usuario */}
      <Modal
        isOpen={showCreatePanel}
        onClose={() => setShowCreatePanel(false)}
        title="Registrar Nuevo Colaborador"
        width="max-w-3xl"
      >
        <div className="p-1">
          <form onSubmit={handleCrearUsuario} className="flex flex-col gap-5">
            {/* Bloque 1: Identidad y Acceso */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-700 dark:text-white mb-3">
                Identidad y Credenciales
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputField
                  label="Nombre Completo *"
                  id="crear-nombre"
                  placeholder="Ej. Juan Carlos Pérez"
                  value={createForm.nombre}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, nombre: e.target.value }))}
                />
                <InputField
                  label="Correo Electrónico *"
                  id="crear-correo"
                  type="email"
                  placeholder="colaborador@empresa.com"
                  value={createForm.correo}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, correo: e.target.value }))}
                />
                <div className="md:col-span-2">
                  <InputField
                    label="Contraseña Inicial *"
                    id="crear-contrasena"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={createForm.contrasena}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, contrasena: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Bloque 2: Organización y Nivel de Acceso */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-700 dark:text-white mb-3">
                Asignación Organizacional & Rol
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="ml-3 text-sm font-bold text-navy-700 dark:text-white" htmlFor="crear-empresa">
                    Empresa Vinculada *
                  </label>
                  <select
                    id="crear-empresa"
                    value={createForm.empresaId}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, empresaId: e.target.value }))}
                    className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:border-white/10 dark:bg-charcoal dark:text-white"
                  >
                    <option value="">Selecciona una empresa</option>
                    {companies.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="ml-3 text-sm font-bold text-navy-700 dark:text-white" htmlFor="crear-rol">
                    Rol Asignado *
                  </label>
                  <select
                    id="crear-rol"
                    value={createForm.rol}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, rol: e.target.value }))}
                    className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:border-white/10 dark:bg-charcoal dark:text-white"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Helper explicativo del rol */}
              <p className="mt-3 text-[11px] text-gray-400 dark:text-white/40">
                {createForm.rol === "super_admin"
                  ? "Acceso total a la administración central de todas las empresas y configuraciones globales."
                  : createForm.rol === "admin_empresa"
                  ? "Propietario de la organización con permisos para gestionar personal, sedes, facturación y reportes."
                  : createForm.rol === "jefe"
                  ? "Supervisor de área o sector con acceso a aprobaciones y asistencias desde la aplicación móvil."
                  : "Personal operativo con acceso al registro de turnos, solicitudes y recibos en la app móvil."}
              </p>
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
                disabled={creatingUser}
                className="rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-brand-500/25 transition hover:bg-brand-600 active:scale-95 disabled:opacity-50"
              >
                {creatingUser ? "Registrando colaborador..." : "Crear Colaborador"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Detalle / Expediente de Usuario */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Expediente de Colaborador"
        width="max-w-3xl"
      >
        {selectedUser ? (
          <div className="p-1 flex flex-col gap-5">
            {/* Header del Expediente */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50/70 p-4.5 dark:border-white/10 dark:bg-white/[0.02]">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar src={selectedUser.fotoPerfil} name={selectedUser.nombre} size={14} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-lg sm:text-xl font-black text-navy-700 dark:text-white">
                      {selectedUser.nombre || "Usuario sin nombre"}
                    </h3>
                    {selectedUser.esPropietario ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                        <MdStar className="h-3.5 w-3.5" /> Propietario
                      </span>
                    ) : null}
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getRoleBadge(selectedUser.rol).badge}`}>
                      {getRoleBadge(selectedUser.rol).label}
                    </span>
                    {(() => {
                      const state = getUserStateBadge(selectedUser);
                      return (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${state.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${state.dot}`} />
                          {state.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="mt-1 text-xs text-gray-400 dark:text-white/50">
                    Empresa:{" "}
                    <strong className="text-navy-700 dark:text-white font-bold">
                      {selectedUser.empresaNombre || nombreEmpresaPorId.get(selectedUser.empresaId) || "Sin empresa"}
                    </strong>{" "}
                    · Registrado el {formatoFecha(selectedUser.fechaCreacion)}
                  </p>
                </div>
              </div>

              <div className="flex sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold shadow-2xs transition active:scale-95 ${
                    isEditing
                      ? "border-brand-500 bg-brand-50 text-brand-600 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-300"
                      : "border-gray-200/80 bg-white text-navy-700 hover:bg-gray-50 dark:border-white/10 dark:bg-charcoal dark:text-white"
                  }`}
                >
                  {isEditing ? (
                    <>
                      <MdOutlineClose className="h-4 w-4" />
                      <span>Cerrar Edición</span>
                    </>
                  ) : (
                    <>
                      <MdOutlineEdit className="h-4 w-4 text-brand-500" />
                      <span>Editar Datos</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Ficha Informativa (si !isEditing) */}
            {!isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <MetaCard
                  icon={MdOutlineEmail}
                  label="Correo Corporativo"
                  value={selectedUser.correo || "No registrado"}
                  copyable={Boolean(selectedUser.correo)}
                  onCopy={() => handleCopyEmail(selectedUser.correo, selectedUser.id)}
                  copied={copiedEmailId === selectedUser.id}
                />
                <MetaCard
                  icon={MdOutlinePhone}
                  label="Teléfono de Contacto"
                  value={selectedUser.telefono || "No registrado"}
                />
                <MetaCard
                  icon={MdOutlineBadge}
                  label="Cargo / Puesto"
                  value={selectedUser.cargo || "No especificado"}
                />
                <MetaCard
                  icon={MdOutlineDomain}
                  label="Departamento"
                  value={selectedUser.departamento || "No especificado"}
                />
                <MetaCard
                  icon={MdOutlineLocationOn}
                  label="Sede / Ubicación"
                  value={selectedUser.sede || "No especificada"}
                />
                <MetaCard
                  icon={MdOutlineBusiness}
                  label="Empresa Vinculada"
                  value={selectedUser.empresaNombre || nombreEmpresaPorId.get(selectedUser.empresaId) || "Sin empresa"}
                />
              </div>
            ) : (
              /* Formulario de Edición (si isEditing) */
              <form
                onSubmit={handleGuardarUsuario}
                className="rounded-2xl border border-brand-500/20 bg-brand-500/[0.02] p-4.5 dark:border-brand-400/20 dark:bg-brand-400/[0.02]"
              >
                <div className="border-b border-brand-500/10 pb-3 dark:border-brand-400/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300">
                    Modificar Información del Colaborador
                  </h4>
                  <p className="text-[11px] text-gray-400 dark:text-white/40">
                    Actualiza los datos personales, cargo o rol en el sistema.
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <InputField
                    label="Nombre Completo"
                    id="editar-nombre"
                    value={editForm?.nombre || ""}
                    onChange={(e) => setEditForm((f: any) => ({ ...f, nombre: e.target.value }))}
                  />
                  <InputField
                    label="Correo Corporativo"
                    id="editar-correo"
                    type="email"
                    value={editForm?.correo || ""}
                    onChange={(e) => setEditForm((f: any) => ({ ...f, correo: e.target.value }))}
                  />
                  <InputField
                    label="Teléfono"
                    id="editar-telefono"
                    value={editForm?.telefono || ""}
                    onChange={(e) => setEditForm((f: any) => ({ ...f, telefono: e.target.value }))}
                  />
                  <InputField
                    label="Cargo / Puesto"
                    id="editar-cargo"
                    value={editForm?.cargo || ""}
                    onChange={(e) => setEditForm((f: any) => ({ ...f, cargo: e.target.value }))}
                  />
                  <InputField
                    label="Departamento"
                    id="editar-departamento"
                    value={editForm?.departamento || ""}
                    onChange={(e) => setEditForm((f: any) => ({ ...f, departamento: e.target.value }))}
                  />
                  <InputField
                    label="Sede / Sucursal"
                    id="editar-sede"
                    value={editForm?.sede || ""}
                    onChange={(e) => setEditForm((f: any) => ({ ...f, sede: e.target.value }))}
                  />
                  <div className="sm:col-span-2">
                    <label className="ml-3 text-sm font-bold text-navy-700 dark:text-white" htmlFor="editar-rol">
                      Rol en la Plataforma
                    </label>
                    <select
                      id="editar-rol"
                      value={editForm?.rol || "empleado"}
                      disabled={selectedUser.id === usuarioActual?.id}
                      onChange={(e) => setEditForm((f: any) => ({ ...f, rol: e.target.value }))}
                      className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-charcoal dark:text-white"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {selectedUser.id === usuarioActual?.id ? (
                      <p className="mt-1 text-xs font-medium text-amber-500">
                        No puedes cambiar tu propio rol. Pídele a otro Super Admin que lo haga.
                      </p>
                    ) : editForm?.rol === "jefe" || editForm?.rol === "empleado" ? (
                      <p className="mt-1 text-xs font-medium text-gray-400 dark:text-white/40">
                        Los roles Jefe y Empleado operan exclusivamente desde la aplicación móvil.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2.5 pt-3 border-t border-brand-500/10 dark:border-brand-400/10">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-white/70"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={busyAction === "guardar"}
                    className="rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-brand-500/25 transition hover:bg-brand-600 active:scale-95 disabled:opacity-50"
                  >
                    {busyAction === "guardar" ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            )}

            {/* Zona de Seguridad & Acciones Administrativas */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4.5 dark:border-white/10 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2 border-b border-gray-200/60 pb-3 dark:border-white/10">
                <MdOutlineShield className="h-4 w-4 text-brand-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-700 dark:text-white">
                  Zona de Seguridad & Cuenta
                </h4>
              </div>

              {actionMsg ? (
                <div className="mt-3 rounded-xl bg-brand-500/10 p-3 text-xs font-bold text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
                  {actionMsg}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40">
                  Acciones sobre las credenciales y el acceso del usuario:
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={busyAction === "reset"}
                    onClick={handleResetPassword}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white px-3 py-1.5 text-xs font-bold text-navy-700 shadow-2xs transition hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white"
                  >
                    <MdOutlineLockReset className="h-3.5 w-3.5 text-gray-500" />
                    <span>{busyAction === "reset" ? "Enviando enlace..." : "Restablecer Contraseña"}</span>
                  </button>
                  <button
                    type="button"
                    disabled={busyAction === "banear"}
                    onClick={handleBanear}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 transition hover:bg-amber-500/20 active:scale-95 dark:bg-amber-400/10 dark:text-amber-300"
                  >
                    <MdOutlineBlock className="h-3.5 w-3.5" />
                    <span>{selectedUser.baneado ? "Desbanear Usuario" : "Suspender / Banear"}</span>
                  </button>
                  <button
                    type="button"
                    disabled={busyAction === "eliminar"}
                    onClick={handleEliminar}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-red-700 active:scale-95"
                  >
                    <MdOutlineDelete className="h-3.5 w-3.5" />
                    <span>Eliminar Usuario</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
