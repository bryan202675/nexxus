import { useEffect, useMemo, useState } from "react";
import {
  MdOutlineBusiness,
  MdCheckCircle,
  MdOutlineWarningAmber,
  MdOutlineAttachMoney,
  MdAdd,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import NexxusWidget from "views/nexxus/components/NexxusWidget";
import DataTable from "views/nexxus/components/DataTable";
import Avatar from "components/nexxus/Avatar";
import InputField from "components/fields/InputField";
import Modal from "components/nexxus/Modal";
import CodigoEmpresaDisplay from "components/nexxus/CodigoEmpresaDisplay";
import { useAuth } from "context/AuthContext";
import {
  getPlatformStats,
  subscribeCompanies,
  loadMoreCompanies,
  subscribeCompanyDetail,
  updateCompanyProfile,
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
import { columnsEmpresas, columnsUsuariosEmpresa, columnsPagosEmpresa } from "./columns";

const LIMITE = 20;
const BLAZE_TOOLTIP = "Requiere plan Blaze (Cloud Functions)";

const ESTADO_OPTIONS = [
  { value: "todas", label: "Todas" },
  { value: "activas", label: "Activas" },
  { value: "suspendidas", label: "Suspendidas" },
  { value: "expiradas", label: "Expiradas" },
  { value: "baneadas", label: "Baneadas" },
];

function InfoField({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-white/50">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-navy-700 dark:text-white">{value}</p>
    </div>
  );
}

function BlazeButton({ label }) {
  return (
    <div className="group relative">
      <button
        type="button"
        disabled
        title={BLAZE_TOOLTIP}
        className="cursor-not-allowed rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-400 dark:bg-white/5 dark:text-white/30"
      >
        {label}
      </button>
      <span className="pointer-events-none absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded-lg bg-navy-700 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-charcoal-light">
        {BLAZE_TOOLTIP}
      </span>
    </div>
  );
}

export default function Empresas() {
  const { user, perfil } = useAuth();
  const actor = useMemo(
    () => ({
      id: user?.uid || "",
      nombre: perfil?.nombre || user?.email || "Super Admin",
      rol: "super_admin",
    }),
    [user, perfil]
  );

  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState("");

  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [filtroPlan, setFiltroPlan] = useState("");

  const [companies, setCompanies] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hayMas, setHayMas] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [companiesError, setCompaniesError] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState({ empresa: null, usuarios: [], pagos: [] });
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: "", giro: "", tamanoEquipo: "", codigo: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");

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

  // --- KPIs ---
  useEffect(() => {
    let active = true;
    getPlatformStats()
      .then((value) => active && setStats(value))
      .catch((err) => active && setStatsError(err.message || "No se pudieron cargar las estadísticas."));
    return () => {
      active = false;
    };
  }, []);

  // --- Filtros -> listado en vivo ---
  const filtros = useMemo(() => {
    const f = {};
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
        setCompaniesError(err.message || "No se pudo conectar con Firestore.");
        setLoadingCompanies(false);
      }
    );
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, filtroPlan]);

  // --- Detalle de la empresa seleccionada ---
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
      setEditMode(false);
    }
  }, [detail.empresa]);

  const planesDisponibles = useMemo(() => {
    const set = new Set();
    companies.forEach((empresa) => {
      if (empresa.plan) set.add(empresa.plan);
    });
    return [...set].sort();
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
    } catch (err) {
      setCompaniesError(err.message || "No se pudieron cargar más empresas.");
    } finally {
      setLoadingMore(false);
    }
  };

  const filasEmpresas = useMemo(
    () =>
      companies.map((empresa) => ({
        id: empresa.id,
        logo: <Avatar src={empresa.logoUrl} name={empresa.nombre} size={8} />,
        nombre: empresa.nombre,
        plan: empresa.plan,
        estadoLabel: etiquetaEstadoEmpresa(empresa.estado),
        fechaLabel: formatoFecha(empresa.fechaCreacion),
      })),
    [companies]
  );

  const handleRowClick = (row) => {
    setSelectedId(row.id);
    setSaveError("");
    setActionError("");
  };

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    if (!detail.empresa) return;
    setSaving(true);
    setSaveError("");
    try {
      await updateCompanyProfile(detail.empresa.id, editForm);
      setEditMode(false);
    } catch (err) {
      setSaveError(err.message || "No se pudo guardar el perfil de la empresa.");
    } finally {
      setSaving(false);
    }
  };

  const handleAccion = async (action, confirmMsg) => {
    if (!detail.empresa) return;
    if (!window.confirm(confirmMsg)) return;
    setActionBusy(true);
    setActionError("");
    try {
      await applyCompanyAction(detail.empresa.id, action, actor);
    } catch (err) {
      setActionError(err.message || "No se pudo aplicar la acción.");
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
      await setCompanyBan(detail.empresa.id, !detail.empresa.baneada, actor);
    } catch (err) {
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
      await deleteCompany(detail.empresa.id, escrito, actor);
      setSelectedId(null);
    } catch (err) {
      setActionError(err.message || "No se pudo eliminar la empresa.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleCrearEmpresa = async (event) => {
    event.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      await createCompany(createForm, actor);
      setCreateForm({
        nombreEmpresa: "", nombreAdmin: "", correoAdmin: "", contrasenaAdmin: "",
        giroActividad: "", tamanoEquipo: "", plan: "Starter",
      });
      setShowCreatePanel(false);
    } catch (err) {
      setCreateError(err.message || "No se pudo crear la empresa.");
    } finally {
      setCreating(false);
    }
  };

  const usuariosFilas = useMemo(
    () =>
      detail.usuarios.map((usuario) => ({
        nombre: usuario.nombre,
        correo: usuario.correo,
        rolLabel: etiquetaRol(usuario.rol),
        estadoLabel: etiquetaEstadoUsuario(usuario),
      })),
    [detail.usuarios]
  );

  const pagosFilas = useMemo(
    () =>
      detail.pagos.map((pago) => ({
        plan: pago.plan,
        montoLabel: formatoMoneda(pago.amount),
        status: pago.status,
        fechaLabel: formatoFecha(pago.createdAt),
      })),
    [detail.pagos]
  );

  const widgets = stats
    ? [
        { icon: MdOutlineBusiness, title: "Empresas totales", subtitle: String(stats.empresasTotal) },
        { icon: MdCheckCircle, title: "Activas", subtitle: String(stats.empresasActivas) },
        {
          icon: MdOutlineWarningAmber,
          title: "Suspendidas",
          subtitle: String(stats.empresasSuspendidas + stats.empresasExpiradas),
        },
        {
          icon: MdOutlineAttachMoney,
          title: "Ingreso mensual promedio",
          subtitle: formatoMoneda(
            stats.empresasActivas > 0 ? stats.ingresos30d / stats.empresasActivas : 0
          ),
        },
      ]
    : [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setShowCreatePanel((prev) => !prev)}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 dark:bg-brand-400"
        >
          <MdAdd className="h-5 w-5" /> Crear empresa
        </button>
      </div>

      <Modal isOpen={showCreatePanel} onClose={() => setShowCreatePanel(false)} title="Crear empresa">
        <div className="p-2">
          <form onSubmit={handleCrearEmpresa}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="Nombre de la empresa"
                id="crear-empresa-nombre"
                value={createForm.nombreEmpresa}
                onChange={(e) => setCreateForm((f) => ({ ...f, nombreEmpresa: e.target.value }))}
              />
              <InputField
                label="Nombre del propietario"
                id="crear-empresa-admin-nombre"
                value={createForm.nombreAdmin}
                onChange={(e) => setCreateForm((f) => ({ ...f, nombreAdmin: e.target.value }))}
              />
              <InputField
                label="Correo del propietario"
                id="crear-empresa-admin-correo"
                type="email"
                value={createForm.correoAdmin}
                onChange={(e) => setCreateForm((f) => ({ ...f, correoAdmin: e.target.value }))}
              />
              <InputField
                label="Contraseña inicial"
                id="crear-empresa-admin-password"
                type="password"
                value={createForm.contrasenaAdmin}
                onChange={(e) => setCreateForm((f) => ({ ...f, contrasenaAdmin: e.target.value }))}
              />
              <InputField
                label="Giro"
                id="crear-empresa-giro"
                value={createForm.giroActividad}
                onChange={(e) => setCreateForm((f) => ({ ...f, giroActividad: e.target.value }))}
              />
              <InputField
                label="Tamaño de equipo"
                id="crear-empresa-tamano"
                value={createForm.tamanoEquipo}
                onChange={(e) => setCreateForm((f) => ({ ...f, tamanoEquipo: e.target.value }))}
              />
            </div>
            {createError ? (
              <p className="mt-3 text-sm font-medium text-red-500 dark:text-red-400">{createError}</p>
            ) : null}
            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {creating ? "Creando..." : "Crear empresa"}
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

      {statsError ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {statsError}
        </p>
      ) : null}

      {!stats ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando estadísticas...</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {widgets.map((w, i) => (
            <NexxusWidget key={w.title} {...w} delay={i * 100} />
          ))}
        </div>
      )}

      <NexxusCard extra="mt-5 w-full p-4" delay={100}>
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <p className="ml-1 text-sm font-bold text-navy-700 dark:text-white">Estado</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ESTADO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFiltroEstado(opt.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    filtroEstado === opt.value
                      ? "bg-brand-500 text-white"
                      : "bg-lightPrimary text-gray-600 dark:bg-charcoal-light dark:text-white/70"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="filtro-plan"
              className="ml-1 text-sm font-bold text-navy-700 dark:text-white"
            >
              Plan
            </label>
            <select
              id="filtro-plan"
              value={filtroPlan}
              onChange={(e) => setFiltroPlan(e.target.value)}
              className="mt-2 flex h-11 w-48 items-center rounded-xl border border-gray-200 bg-white/0 p-2 text-sm text-navy-700 outline-none dark:!border-white/10 dark:bg-navy-900 dark:text-white"
            >
              <option value="">Todos los planes</option>
              {planesDisponibles.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </div>
        </div>
      </NexxusCard>

      {companiesError ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {companiesError}
        </p>
      ) : null}

      <div className="mt-5">
        {loadingCompanies && companies.length === 0 ? (
          <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando empresas...</p>
        ) : companies.length === 0 ? (
          <p className="text-sm font-medium text-gray-600 dark:text-white/70">
            No hay empresas para estos filtros.
          </p>
        ) : (
          <>
            <DataTable
              title="Empresas"
              columnsData={columnsEmpresas}
              tableData={filasEmpresas}
              readOnly
              onRowClick={handleRowClick}
              delay={100}
            />
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={handleCargarMas}
                disabled={!hayMas || loadingMore}
                className="rounded-xl bg-lightPrimary px-5 py-2 text-sm font-bold text-brand-500 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-charcoal-light dark:text-white"
              >
                {loadingMore ? "Cargando..." : hayMas ? "Cargar más" : "No hay más empresas"}
              </button>
            </div>
          </>
        )}
      </div>

      <Modal isOpen={!!selectedId} onClose={() => setSelectedId(null)} title="Detalle de la empresa">
        <div className="p-2">
          {detailError ? (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
              {detailError}
            </p>
          ) : null}

          {detailLoading && !detail.empresa ? (
            <p className="mt-4 text-sm font-medium text-gray-600 dark:text-white/70">
              Cargando detalle...
            </p>
          ) : !detail.empresa ? (
            !detailError && (
              <p className="mt-4 text-sm font-medium text-gray-600 dark:text-white/70">
                Esta empresa ya no existe.
              </p>
            )
          ) : (
            <>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <Avatar src={detail.empresa?.logoUrl} name={detail.empresa?.nombre} size={24} />
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
                    {detail.empresa?.nombre || "Cargando..."}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-white/70">
                    Código: <CodigoEmpresaDisplay code={detail.empresa?.codigo || "—"} />
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoField label="Giro" value={detail.empresa.giro || "—"} />
                <InfoField label="Tamaño de equipo" value={detail.empresa.tamanoEquipo || "—"} />
                <InfoField label="Plan" value={detail.empresa.plan} />
                <InfoField label="Estado" value={etiquetaEstadoEmpresa(detail.empresa.estado)} />
                <InfoField label="Facturación" value={detail.empresa.planBilling || "—"} />
                <InfoField label="Vence" value={formatoFecha(detail.empresa.planExpiresAt)} />
                <InfoField label="Propietario" value={detail.empresa.adminNombre || "—"} />
                <InfoField label="Correo del propietario" value={detail.empresa.adminCorreo || "—"} />
                <InfoField label="Usuarios" value={String(detail.usuarios.length)} />
              </div>

              <div className="mt-6">
                {!editMode ? (
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="rounded-xl bg-lightPrimary px-4 py-2 text-sm font-bold text-brand-500 dark:bg-charcoal-light dark:text-white"
                  >
                    Editar perfil
                  </button>
                ) : (
                  <form
                    onSubmit={handleGuardarPerfil}
                    className="rounded-xl border border-gray-200 p-4 dark:border-white/10"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <InputField
                        variant="auth"
                        label="Nombre"
                        id="edit-nombre"
                        value={editForm.nombre}
                        onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
                      />
                      <InputField
                        variant="auth"
                        label="Giro"
                        id="edit-giro"
                        value={editForm.giro}
                        onChange={(e) => setEditForm((f) => ({ ...f, giro: e.target.value }))}
                      />
                      <InputField
                        variant="auth"
                        label="Tamaño de equipo"
                        id="edit-tamano"
                        value={editForm.tamanoEquipo}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, tamanoEquipo: e.target.value }))
                        }
                      />
                      <InputField
                        variant="auth"
                        label="Código"
                        id="edit-codigo"
                        value={editForm.codigo}
                        onChange={(e) => setEditForm((f) => ({ ...f, codigo: e.target.value }))}
                      />
                    </div>
                    {saveError ? (
                      <p className="mt-3 text-sm font-medium text-red-500 dark:text-red-400">
                        {saveError}
                      </p>
                    ) : null}
                    <div className="mt-4 flex gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {saving ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600 dark:bg-white/5 dark:text-white/70"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="mt-6">
                <p className="mb-2 text-sm font-bold text-navy-700 dark:text-white">
                  Acciones de suscripción
                </p>
                {actionError ? (
                  <p className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
                    {actionError}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() =>
                      handleAccion(
                        "reactivar_business",
                        `¿Reactivar el plan Business de "${detail.empresa.nombre}"?`
                      )
                    }
                    className="rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Reactivar (Business)
                  </button>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() =>
                      handleAccion("suspender", `¿Suspender a "${detail.empresa.nombre}"?`)
                    }
                    className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Suspender
                  </button>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() =>
                      handleAccion(
                        "expirar",
                        `¿Marcar como expirada la suscripción de "${detail.empresa.nombre}"?`
                      )
                    }
                    className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Expirar
                  </button>

                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={handleBanear}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {detail.empresa.baneada ? "Desbanear empresa" : "Banear empresa"}
                  </button>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={handleEliminar}
                    className="rounded-xl bg-red-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Eliminar empresa
                  </button>
                  <BlazeButton label="Iniciar sesión de soporte" />
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
                {usuariosFilas.length > 0 ? (
                  <DataTable
                    title="Usuarios"
                    columnsData={columnsUsuariosEmpresa}
                    tableData={usuariosFilas}
                    readOnly
                    delay={100}
                  />
                ) : (
                  <div className="rounded-[20px] bg-white p-4 shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none">
                    <h4 className="mb-2 text-lg font-bold text-navy-700 dark:text-white">Usuarios</h4>
                    <p className="text-sm font-medium text-gray-600 dark:text-white/70">
                      Esta empresa no tiene usuarios registrados.
                    </p>
                  </div>
                )}
                {pagosFilas.length > 0 ? (
                  <DataTable
                    title="Pagos recientes"
                    columnsData={columnsPagosEmpresa}
                    tableData={pagosFilas}
                    readOnly
                    delay={150}
                  />
                ) : (
                  <div className="rounded-[20px] bg-white p-4 shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none">
                    <h4 className="mb-2 text-lg font-bold text-navy-700 dark:text-white">Pagos recientes</h4>
                    <p className="text-sm font-medium text-gray-600 dark:text-white/70">
                      No hay pagos registrados para esta empresa.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
