import { useEffect, useMemo, useState } from "react";
import {
  MdOutlinePeople,
  MdOutlineBusinessCenter,
  MdOutlineSupervisorAccount,
  MdOutlineBadge,
  MdStar,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import NexxusWidget from "views/nexxus/components/NexxusWidget";
import DataTable from "views/nexxus/components/DataTable";
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
import { etiquetaRol, etiquetaEstadoUsuario, formatoFecha, ROLE_OPTIONS } from "services/saFormat";
<<<<<<< HEAD
import { useAuth } from "context/AuthContext";
=======
>>>>>>> origin/main

const LIMITE = 25;

const ESTADO_OPTIONS = [
  { value: "activos", label: "Activos" },
  { value: "inactivos", label: "Inactivos" },
  { value: "baneados", label: "Baneados" },
  { value: "eliminados", label: "Eliminados" },
];

const ESTADO_BADGE_CLASSES = {
  Activo: "bg-green-50 text-green-600 dark:bg-green-400/10 dark:text-green-400",
  Inactivo: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60",
  Baneado: "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-400",
  Eliminado: "bg-red-50 text-red-700 dark:bg-red-400/20 dark:text-red-300",
};

const selectClasses =
  "mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:!border-white/10 dark:text-white dark:bg-charcoal";

const selectLabelClasses = "ml-3 text-sm font-bold text-navy-700 dark:text-white";

const ActionButton = ({ children, className = "", busy, ...rest }) => (
  <button
    type="button"
    disabled={busy}
    className={`rounded-lg px-3 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...rest}
  >
    {busy ? "..." : children}
  </button>
);

export default function Usuarios() {
<<<<<<< HEAD
  const { user: usuarioActual } = useAuth();
=======
>>>>>>> origin/main
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState("");

  const [companies, setCompanies] = useState([]);

  const [empresaFiltro, setEmpresaFiltro] = useState("");
  const [rolFiltro, setRolFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("activos");

  const [baseItems, setBaseItems] = useState([]);
  const [extraItems, setExtraItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hayMas, setHayMas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [busyAction, setBusyAction] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [createForm, setCreateForm] = useState({ nombre: "", correo: "", contrasena: "", rol: "empleado", empresaId: "" });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    if (!selectedUser) {
      setEditForm(null);
      return;
    }
    setEditForm({
      nombre: selectedUser.nombre || "",
      correo: selectedUser.correo || "",
      telefono: selectedUser.telefono || "",
      cargo: selectedUser.cargo || "",
      departamento: selectedUser.departamento || "",
      sede: selectedUser.sede || "",
<<<<<<< HEAD
      rol: selectedUser.rol || "empleado",
=======
>>>>>>> origin/main
    });
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
        setError(err.message || "No se pudo conectar con Firestore.");
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

  // Los docs de usuarios/{uid} guardan empresaId (referencia), no un empresaNombre
  // denormalizado — sin este mapa, la columna "Empresa" salía vacía para prácticamente todos los
  // usuarios reales en la vista sin filtrar. companies ya se carga para el selector de filtro.
  const nombreEmpresaPorId = useMemo(() => {
    const map = new Map();
    companies.forEach((empresa) => map.set(empresa.id, empresa.nombre));
    return map;
  }, [companies]);

  const handleCargarMas = async () => {
    if (filtros.empresaId || !hayMas || !cursor) return;
    setLoadingMore(true);
    try {
      const res = await loadMoreUsers(filtros, LIMITE, cursor);
      setExtraItems((prev) => [...prev, ...res.items]);
      setCursor(res.cursor);
      setHayMas(res.hayMas);
    } catch (err) {
      setError(err.message || "No se pudieron cargar más usuarios.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleGuardarUsuario = async () => {
    if (!selectedUser || !editForm) return;
<<<<<<< HEAD
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
      setSelectedUser((prev) => (prev ? { ...prev, rol } : prev));
=======
    setBusyAction("guardar");
    setActionMsg("");
    try {
      await updateUser(selectedUser.id, editForm);
>>>>>>> origin/main
      setActionMsg("Cambios guardados.");
    } catch (err) {
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
      setActionMsg(selectedUser.baneado ? "Usuario desbaneado." : "Usuario baneado.");
      setSelectedUser((prev) => (prev ? { ...prev, baneado: !prev.baneado, activo: prev.baneado } : prev));
    } catch (err) {
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
      setActionMsg(`Correo de restablecimiento enviado a ${selectedUser.correo}.`);
    } catch (err) {
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
    } catch (err) {
      setActionMsg(err.message || "No se pudo eliminar el usuario.");
    } finally {
      setBusyAction("");
    }
  };

  const handleCrearUsuario = async (event) => {
    event.preventDefault();
    setCreatingUser(true);
    setError("");
    try {
      await createUser(createForm);
      setCreateForm({ nombre: "", correo: "", contrasena: "", rol: "empleado", empresaId: "" });
      setShowCreatePanel(false);
    } catch (err) {
      setError(err.message || "No se pudo crear el usuario.");
    } finally {
      setCreatingUser(false);
    }
  };

  const widgets = stats
    ? [
        { icon: MdOutlinePeople, title: "Usuarios totales", subtitle: String(stats.usuariosTotal) },
        { icon: MdOutlineBusinessCenter, title: "Propietarios", subtitle: String(stats.porRol?.admin_empresa ?? 0) },
        { icon: MdOutlineSupervisorAccount, title: "Jefes", subtitle: String(stats.porRol?.jefe ?? 0) },
        { icon: MdOutlineBadge, title: "Empleados", subtitle: String(stats.porRol?.empleado ?? 0) },
      ]
    : [];

  const columnsData = [
    { Header: "USUARIO", accessor: "usuario" },
    { Header: "CORREO", accessor: "correo" },
    { Header: "ROL", accessor: "rol" },
    { Header: "EMPRESA", accessor: "empresa" },
    { Header: "ESTADO", accessor: "estado" },
    { Header: "REGISTRO", accessor: "registro" },
    { Header: "ACCIONES", accessor: "acciones" },
  ];

  const tableData = useMemo(
    () =>
      usuarios.map((usuario) => ({
        id: usuario.id,
        usuario: (
          <div className="flex items-center gap-3">
            <Avatar src={usuario.fotoPerfil} name={usuario.nombre} size={9} />
            <div className="flex items-center gap-1">
              <span>{usuario.nombre}</span>
              {usuario.esPropietario ? (
                <MdStar className="h-4 w-4 text-amber-400" title="Propietario de la empresa" />
              ) : null}
            </div>
          </div>
        ),
        correo: usuario.correo || "—",
        rol: etiquetaRol(usuario.rol),
        empresa: usuario.empresaNombre || nombreEmpresaPorId.get(usuario.empresaId) || "—",
        estado: (
          <span
            className={`rounded-full px-2 py-1 text-xs font-bold ${
              ESTADO_BADGE_CLASSES[etiquetaEstadoUsuario(usuario)] || ESTADO_BADGE_CLASSES.Inactivo
            }`}
          >
            {etiquetaEstadoUsuario(usuario)}
          </span>
        ),
        registro: formatoFecha(usuario.fechaCreacion),
        acciones: (
          <button
            type="button"
            onClick={() => setSelectedUser(usuario)}
            className="rounded-lg bg-lightPrimary px-3 py-1.5 text-sm font-bold text-brand-500 transition hover:bg-brand-500/10 dark:bg-charcoal-light dark:text-white"
          >
            Ver
          </button>
        ),
      })),
    [usuarios, nombreEmpresaPorId]
  );

  return (
    <div>
      {statsError ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {statsError}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {!stats ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando estadísticas...</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {widgets.map((w, i) => (
            <NexxusWidget key={w.title} {...w} delay={i * 100} />
          ))}
        </div>
      )}

      <NexxusCard extra="mt-5 w-full p-4" delay={100}>
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
          <div>
            <label className={selectLabelClasses} htmlFor="filtro-empresa">
              Empresa
            </label>
            <select
              id="filtro-empresa"
              className={selectClasses}
              value={empresaFiltro}
              onChange={(e) => setEmpresaFiltro(e.target.value)}
            >
              <option value="">Todas</option>
              {companies.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={selectLabelClasses} htmlFor="filtro-rol">
              Rol
            </label>
            <select
              id="filtro-rol"
              className={selectClasses}
              value={rolFiltro}
              onChange={(e) => setRolFiltro(e.target.value)}
            >
              <option value="">Todos</option>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={selectLabelClasses} htmlFor="filtro-estado">
              Estado
            </label>
            <select
              id="filtro-estado"
              className={selectClasses}
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
            >
              {ESTADO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreatePanel((prev) => !prev)}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white transition hover:bg-brand-600 dark:bg-brand-400"
            >
              Crear usuario
            </button>
          </div>
        </div>
      </NexxusCard>

      <Modal isOpen={showCreatePanel} onClose={() => setShowCreatePanel(false)} title="Crear usuario">
        <div className="p-2">
          <form onSubmit={handleCrearUsuario}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="Nombre"
                id="crear-nombre"
                placeholder="Nombre completo"
                value={createForm.nombre}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, nombre: e.target.value }))}
              />
              <InputField
                label="Correo"
                id="crear-correo"
                type="email"
                placeholder="correo@empresa.com"
                value={createForm.correo}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, correo: e.target.value }))}
              />
              <InputField
                label="Contraseña inicial"
                id="crear-contrasena"
                type="password"
                placeholder="Mín. 8 caracteres"
                value={createForm.contrasena}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, contrasena: e.target.value }))}
              />
              <div>
                <label className={selectLabelClasses} htmlFor="crear-rol">
                  Rol
                </label>
                <select
                  id="crear-rol"
                  className={selectClasses}
                  value={createForm.rol}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, rol: e.target.value }))}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={selectLabelClasses} htmlFor="crear-empresa">
                  Empresa
                </label>
                <select
                  id="crear-empresa"
                  className={selectClasses}
                  value={createForm.empresaId}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, empresaId: e.target.value }))}
                >
                  <option value="">Selecciona una empresa</option>
                  {companies.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                disabled={creatingUser}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {creatingUser ? "Creando..." : "Crear usuario"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreatePanel(false)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600 dark:bg-white/5 dark:text-white/70"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <div className="mt-5">
        {loading ? (
          <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando usuarios...</p>
        ) : (
          <DataTable title="Usuarios de la plataforma" columnsData={columnsData} tableData={tableData} readOnly delay={150} />
        )}
      </div>

      <div className="mt-3">
        {filtros.empresaId ? (
          <p className="text-sm font-medium text-gray-600 dark:text-white/70">
            Todos los usuarios de esta empresa ya están cargados.
          </p>
        ) : hayMas ? (
          <button
            type="button"
            onClick={handleCargarMas}
            disabled={loadingMore}
            className="rounded-xl bg-lightPrimary px-4 py-2 text-sm font-bold text-brand-500 transition hover:bg-brand-500/10 disabled:opacity-50 dark:bg-charcoal-light dark:text-white"
          >
            {loadingMore ? "Cargando..." : "Cargar más"}
          </button>
        ) : (
          <p className="text-sm font-medium text-gray-600 dark:text-white/70">No hay más usuarios para mostrar.</p>
        )}
      </div>

      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={
          <div className="flex items-center gap-2">
            {selectedUser?.nombre}
            {selectedUser?.esPropietario ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                <MdStar className="h-3.5 w-3.5" /> Propietario
              </span>
            ) : null}
          </div>
        }
      >
        {selectedUser ? (
        <div className="p-2">
          {editForm ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="Nombre"
                id="editar-nombre"
                value={editForm.nombre}
                onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
              />
              <InputField
                label="Correo"
                id="editar-correo"
                value={editForm.correo}
                onChange={(e) => setEditForm((f) => ({ ...f, correo: e.target.value }))}
              />
              <InputField
                label="Teléfono"
                id="editar-telefono"
                value={editForm.telefono}
                onChange={(e) => setEditForm((f) => ({ ...f, telefono: e.target.value }))}
              />
              <InputField
                label="Cargo"
                id="editar-cargo"
                value={editForm.cargo}
                onChange={(e) => setEditForm((f) => ({ ...f, cargo: e.target.value }))}
              />
              <InputField
                label="Departamento"
                id="editar-departamento"
                value={editForm.departamento}
                onChange={(e) => setEditForm((f) => ({ ...f, departamento: e.target.value }))}
              />
              <InputField
                label="Sede"
                id="editar-sede"
                value={editForm.sede}
                onChange={(e) => setEditForm((f) => ({ ...f, sede: e.target.value }))}
              />
<<<<<<< HEAD
              <div>
                <label className={selectLabelClasses} htmlFor="editar-rol">
                  Rol
                </label>
                <select
                  id="editar-rol"
                  className={`${selectClasses} disabled:cursor-not-allowed disabled:opacity-50`}
                  value={editForm.rol}
                  disabled={selectedUser.id === usuarioActual?.id}
                  onChange={(e) => setEditForm((f) => ({ ...f, rol: e.target.value }))}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {selectedUser.id === usuarioActual?.id ? (
                  <p className="mt-1 text-xs font-medium text-gray-500 dark:text-white/50">
                    No puedes cambiar tu propio rol.
                  </p>
                ) : editForm.rol === "jefe" || editForm.rol === "empleado" ? (
                  <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                    Los roles Jefe y Empleado no tienen acceso a este panel (usan la app móvil).
                  </p>
                ) : null}
              </div>
=======
>>>>>>> origin/main
            </div>
          ) : null}

          {actionMsg ? (
            <p className="mt-3 text-sm font-medium text-gray-600 dark:text-white/70">{actionMsg}</p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <ActionButton
              busy={busyAction === "guardar"}
              onClick={handleGuardarUsuario}
              className="bg-brand-500 dark:bg-brand-400"
            >
              Guardar cambios
            </ActionButton>
            <ActionButton busy={busyAction === "banear"} onClick={handleBanear} className="bg-orange-500">
              {selectedUser?.baneado ? "Desbanear" : "Banear"}
            </ActionButton>
            <ActionButton busy={busyAction === "reset"} onClick={handleResetPassword} className="bg-gray-500">
              Enviar correo de restablecimiento
            </ActionButton>
            <ActionButton busy={busyAction === "eliminar"} onClick={handleEliminar} className="bg-red-500">
              Eliminar
            </ActionButton>
          </div>
        </div>
        ) : null}
      </Modal>
    </div>
  );
}
