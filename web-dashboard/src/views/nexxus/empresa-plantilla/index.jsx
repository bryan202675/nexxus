import { useEffect, useMemo, useState } from "react";
import {
  MdOutlinePeople,
  MdOutlineCheckCircle,
  MdOutlineCancel,
  MdOutlineSupervisorAccount,
  MdOutlineBadge,
} from "react-icons/md";
import { doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";

import NexxusCard from "views/nexxus/components/NexxusCard";
import NexxusWidget from "views/nexxus/components/NexxusWidget";
import DataTable from "views/nexxus/components/DataTable";
import Avatar from "components/nexxus/Avatar";
import InputField from "components/fields/InputField";

import { useAuth } from "context/AuthContext";
import { getSecondaryApp } from "firebaseClient/firebaseConfig";
import { db, subscribeEmpleados, subscribeSedes, subscribeCargos } from "services/adminRepository";
import { etiquetaRol, ROLE_OPTIONS } from "services/saFormat";

// Alias de rol identicos a los usados en superAdminRepository.js / la app movil, para que un
// documento viejo con "admin"/"jefe_sector"/"psicologo" se muestre y filtre igual que su
// equivalente canonico.
const ROLE_ALIASES = {
  super_admin: ["super_admin"],
  admin_empresa: ["admin_empresa", "admin"],
  jefe: ["jefe", "jefe_sector"],
  empleado: ["empleado", "psicologo"],
};
const normalizeRol = (rol) => {
  const value = String(rol || "").trim().toLowerCase();
  for (const [canonico, alias] of Object.entries(ROLE_ALIASES)) {
    if (alias.includes(value)) return canonico;
  }
  return value || "empleado";
};

const textValue = (value, fallback = "") =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;

const mapEmpleado = (docSnap) => {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    nombre: textValue(data.nombre, "Sin nombre"),
    correo: textValue(data.correo, textValue(data.email)),
    usuarioInterno: textValue(data.usuarioInterno),
    rol: normalizeRol(data.rol),
    rolOperativo: textValue(data.rolOperativo),
    cargoId: textValue(data.cargoId),
    cargo: textValue(data.cargo),
    telefono: textValue(data.telefono),
    departamentoId: textValue(data.departamentoId),
    departamento: textValue(data.departamento),
    sede: textValue(data.sede),
    sedeId: textValue(data.sedeId),
    jefeId: textValue(data.jefeId),
    jefeNombre: textValue(data.jefeNombre),
    salarioBase: typeof data.salarioBase === "number" ? data.salarioBase : Number(data.salarioBase) || 0,
    empresaId: textValue(data.empresaId),
    activo: data.activo !== false && data.estado_activo !== false,
    eliminado: data.eliminado === true,
    ultimoCheckIn: data.ultimoCheckIn || null,
    createdAt: data.createdAt || data.fecha_creacion || null,
    foto: textValue(data.foto_perfil, textValue(data.fotoPerfil, textValue(data.photoURL))),
  };
};

const mapListaSimple = (docSnap) => {
  const data = docSnap.data() || {};
  return { id: docSnap.id, nombre: textValue(data.nombre, docSnap.id) };
};

const ESTADO_BADGE_CLASSES = {
  Activo: "bg-green-50 text-green-600 dark:bg-green-400/10 dark:text-green-400",
  Inactivo: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60",
};

const ESTADO_FILTRO_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "inactivos", label: "Inactivos" },
];

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

const CAMPO_VACIO = "__vacio__";

const SelectListaField = ({ label, id, value, onChange, opciones }) => (
  <div>
    <label className={selectLabelClasses} htmlFor={id}>
      {label}
    </label>
    <select
      id={id}
      className={selectClasses}
      value={value || CAMPO_VACIO}
      onChange={(e) => onChange(e.target.value === CAMPO_VACIO ? "" : e.target.value)}
    >
      <option value={CAMPO_VACIO}>Sin asignar</option>
      {opciones.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const EMPTY_CREATE_FORM = { nombre: "", correo: "", contrasena: "", rol: "empleado", cargo: "", departamento: "", sede: "" };

export default function GestionPlantilla() {
  const { empresaId } = useAuth();

  const [empleadosDocs, setEmpleadosDocs] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("");
  const [filtroSede, setFiltroSede] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [rolSeleccionado, setRolSeleccionado] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [creatingEmpleado, setCreatingEmpleado] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!empresaId) return;
    setLoading(true);
    setError("");
    const unsubscribe = subscribeEmpleados(
      empresaId,
      (docs) => {
        setEmpleadosDocs(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "No se pudo conectar con Firestore.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [empresaId]);

  useEffect(() => {
    if (!empresaId) return;
    const unsubscribe = subscribeSedes(empresaId, (docs) => setSedes(docs.map(mapListaSimple)), () => setSedes([]));
    return () => unsubscribe();
  }, [empresaId]);

  useEffect(() => {
    if (!empresaId) return;
    const unsubscribe = subscribeCargos(empresaId, (docs) => setCargos(docs.map(mapListaSimple)), () => setCargos([]));
    return () => unsubscribe();
  }, [empresaId]);

  const empleados = useMemo(
    () => empleadosDocs.map(mapEmpleado).filter((e) => !e.eliminado),
    [empleadosDocs]
  );

  useEffect(() => {
    if (!selectedEmpleado) {
      setEditForm(null);
      setRolSeleccionado("");
      return;
    }
    setEditForm({
      nombre: selectedEmpleado.nombre || "",
      correo: selectedEmpleado.correo || "",
      telefono: selectedEmpleado.telefono || "",
      cargo: selectedEmpleado.cargo || "",
      departamento: selectedEmpleado.departamento || "",
      sede: selectedEmpleado.sede || "",
      salarioBase: selectedEmpleado.salarioBase || 0,
    });
    setRolSeleccionado(selectedEmpleado.rol || "empleado");
    setActionMsg("");
  }, [selectedEmpleado]);

  const departamentosDistintos = useMemo(
    () => [...new Set(empleados.map((e) => e.departamento).filter(Boolean))].sort(),
    [empleados]
  );
  const cargosDistintos = useMemo(
    () => [...new Set([...cargos.map((c) => c.nombre), ...empleados.map((e) => e.cargo)].filter(Boolean))].sort(),
    [cargos, empleados]
  );
  const sedesDistintas = useMemo(
    () => [...new Set([...sedes.map((s) => s.nombre), ...empleados.map((e) => e.sede)].filter(Boolean))].sort(),
    [sedes, empleados]
  );

  const empleadosFiltrados = useMemo(() => {
    return empleados.filter((e) => {
      if (filtroDepartamento && e.departamento !== filtroDepartamento) return false;
      if (filtroCargo && e.cargo !== filtroCargo) return false;
      if (filtroSede && e.sede !== filtroSede) return false;
      if (filtroRol && e.rol !== filtroRol) return false;
      if (filtroEstado === "activos" && !e.activo) return false;
      if (filtroEstado === "inactivos" && e.activo) return false;
      return true;
    });
  }, [empleados, filtroDepartamento, filtroCargo, filtroSede, filtroRol, filtroEstado]);

  const kpis = useMemo(() => {
    const total = empleados.length;
    const activos = empleados.filter((e) => e.activo).length;
    const inactivos = total - activos;
    const jefes = empleados.filter((e) => e.rol === "jefe").length;
    const operativos = empleados.filter((e) => e.rol === "empleado").length;
    return [
      { icon: MdOutlinePeople, title: "Total empleados", subtitle: String(total) },
      { icon: MdOutlineCheckCircle, title: "Activos", subtitle: String(activos) },
      { icon: MdOutlineCancel, title: "Inactivos", subtitle: String(inactivos) },
      { icon: MdOutlineSupervisorAccount, title: "Jefes", subtitle: String(jefes) },
      { icon: MdOutlineBadge, title: "Empleados operativos", subtitle: String(operativos) },
    ];
  }, [empleados]);

  const handleGuardarCambios = async () => {
    if (!selectedEmpleado || !editForm) return;
    setBusyAction("guardar");
    setActionMsg("");
    try {
      await updateDoc(doc(db, "usuarios", selectedEmpleado.id), {
        nombre: editForm.nombre,
        correo: editForm.correo,
        telefono: editForm.telefono,
        cargo: editForm.cargo,
        departamento: editForm.departamento,
        sede: editForm.sede,
        salarioBase: Number(editForm.salarioBase) || 0,
      });
      setActionMsg("Cambios guardados.");
    } catch (err) {
      setActionMsg(err.message || "No se pudieron guardar los cambios.");
    } finally {
      setBusyAction("");
    }
  };

  const handleCambiarRol = async () => {
    if (!selectedEmpleado || !rolSeleccionado) return;
    setBusyAction("rol");
    setActionMsg("");
    try {
      await updateDoc(doc(db, "usuarios", selectedEmpleado.id), { rol: rolSeleccionado });
      setActionMsg("Rol actualizado.");
      setSelectedEmpleado((prev) => (prev ? { ...prev, rol: rolSeleccionado } : prev));
    } catch (err) {
      setActionMsg(err.message || "No se pudo cambiar el rol.");
    } finally {
      setBusyAction("");
    }
  };

  const handleToggleActivo = async () => {
    if (!selectedEmpleado) return;
    const nuevoEstado = !selectedEmpleado.activo;
    setBusyAction("estado");
    setActionMsg("");
    try {
      await updateDoc(doc(db, "usuarios", selectedEmpleado.id), { activo: nuevoEstado, estado_activo: nuevoEstado });
      setActionMsg(nuevoEstado ? "Empleado activado." : "Empleado desactivado.");
      setSelectedEmpleado((prev) => (prev ? { ...prev, activo: nuevoEstado } : prev));
    } catch (err) {
      setActionMsg(err.message || "No se pudo cambiar el estado.");
    } finally {
      setBusyAction("");
    }
  };

  const handleEliminar = async () => {
    if (!selectedEmpleado) return;
    if (!window.confirm(`¿Eliminar a "${selectedEmpleado.nombre}"? Esta acción no se puede deshacer.`)) return;
    setBusyAction("eliminar");
    setActionMsg("");
    try {
      await deleteDoc(doc(db, "usuarios", selectedEmpleado.id));
      setSelectedEmpleado(null);
    } catch (err) {
      setActionMsg(err.message || "No se pudo eliminar el empleado.");
    } finally {
      setBusyAction("");
    }
  };

  const handleCrearEmpleado = async (event) => {
    event.preventDefault();
    setCreateError("");
    if (!empresaId) return;
    if (!createForm.nombre.trim() || !createForm.correo.trim() || createForm.contrasena.length < 6) {
      setCreateError("Nombre, correo y una contraseña de al menos 6 caracteres son obligatorios.");
      return;
    }
    setCreatingEmpleado(true);
    try {
      const secondaryAuth = getAuth(getSecondaryApp());
      const credencial = await createUserWithEmailAndPassword(
        secondaryAuth,
        createForm.correo.trim().toLowerCase(),
        createForm.contrasena
      );
      const uid = credencial.user.uid;
      await signOut(secondaryAuth);

      await setDoc(doc(db, "usuarios", uid), {
        id: uid,
        nombre: createForm.nombre.trim(),
        correo: createForm.correo.trim().toLowerCase(),
        rol: createForm.rol,
        cargo: createForm.cargo,
        departamento: createForm.departamento,
        sede: createForm.sede,
        empresaId,
        activo: true,
        estado_activo: true,
        createdAt: new Date().toISOString(),
      });

      setCreateForm(EMPTY_CREATE_FORM);
      setShowCreatePanel(false);
    } catch (err) {
      setCreateError(err.message || "No se pudo crear el empleado.");
    } finally {
      setCreatingEmpleado(false);
    }
  };

  const columnsData = [
    { Header: "EMPLEADO", accessor: "empleado" },
    { Header: "CORREO", accessor: "correo" },
    { Header: "ROL", accessor: "rol" },
    { Header: "CARGO", accessor: "cargo" },
    { Header: "DEPARTAMENTO", accessor: "departamento" },
    { Header: "SEDE", accessor: "sede" },
    { Header: "ESTADO", accessor: "estado" },
    { Header: "ACCIONES", accessor: "acciones" },
  ];

  const tableData = useMemo(
    () =>
      empleadosFiltrados.map((empleado) => ({
        id: empleado.id,
        empleado: (
          <div className="flex items-center gap-3">
            <Avatar src={empleado.foto} name={empleado.nombre} size={9} />
            <span>{empleado.nombre}</span>
          </div>
        ),
        correo: empleado.correo || "—",
        rol: etiquetaRol(empleado.rol),
        cargo: empleado.cargo || "—",
        departamento: empleado.departamento || "—",
        sede: empleado.sede || "—",
        estado: (
          <span
            className={`rounded-full px-2 py-1 text-xs font-bold ${
              empleado.activo ? ESTADO_BADGE_CLASSES.Activo : ESTADO_BADGE_CLASSES.Inactivo
            }`}
          >
            {empleado.activo ? "Activo" : "Inactivo"}
          </span>
        ),
        acciones: (
          <button
            type="button"
            onClick={() => setSelectedEmpleado(empleado)}
            className="rounded-lg bg-lightPrimary px-3 py-1.5 text-sm font-bold text-brand-500 transition hover:bg-brand-500/10 dark:bg-charcoal-light dark:text-white"
          >
            Ver
          </button>
        ),
      })),
    [empleadosFiltrados]
  );

  if (!empresaId) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
        No se pudo determinar la empresa de este administrador.
      </p>
    );
  }

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando estadísticas...</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
          {kpis.map((w, i) => (
            <NexxusWidget key={w.title} {...w} delay={i * 100} />
          ))}
        </div>
      )}

      <NexxusCard extra="mt-8 w-full p-4" delay={100}>
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div>
            <label className={selectLabelClasses} htmlFor="filtro-departamento">
              Departamento
            </label>
            <select
              id="filtro-departamento"
              className={selectClasses}
              value={filtroDepartamento}
              onChange={(e) => setFiltroDepartamento(e.target.value)}
            >
              <option value="">Todos</option>
              {departamentosDistintos.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={selectLabelClasses} htmlFor="filtro-cargo">
              Cargo
            </label>
            <select id="filtro-cargo" className={selectClasses} value={filtroCargo} onChange={(e) => setFiltroCargo(e.target.value)}>
              <option value="">Todos</option>
              {cargosDistintos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={selectLabelClasses} htmlFor="filtro-sede">
              Sede
            </label>
            <select id="filtro-sede" className={selectClasses} value={filtroSede} onChange={(e) => setFiltroSede(e.target.value)}>
              <option value="">Todas</option>
              {sedesDistintas.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={selectLabelClasses} htmlFor="filtro-rol">
              Rol
            </label>
            <select id="filtro-rol" className={selectClasses} value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
              <option value="">Todos</option>
              {ROLE_OPTIONS.filter((opt) => opt.value !== "super_admin").map((opt) => (
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
            <select id="filtro-estado" className={selectClasses} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              {ESTADO_FILTRO_OPTIONS.map((opt) => (
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
              Crear empleado
            </button>
          </div>
        </div>
      </NexxusCard>

      {showCreatePanel ? (
        <NexxusCard extra="mt-8 w-full p-4" delay={100}>
          <form onSubmit={handleCrearEmpleado}>
            <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">Crear empleado</h2>
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
                placeholder="Mín. 6 caracteres"
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
                  {ROLE_OPTIONS.filter((opt) => opt.value !== "super_admin").map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <SelectListaField
                label="Cargo"
                id="crear-cargo"
                value={createForm.cargo}
                onChange={(v) => setCreateForm((prev) => ({ ...prev, cargo: v }))}
                opciones={cargosDistintos}
              />
              <SelectListaField
                label="Departamento"
                id="crear-departamento"
                value={createForm.departamento}
                onChange={(v) => setCreateForm((prev) => ({ ...prev, departamento: v }))}
                opciones={departamentosDistintos}
              />
              <SelectListaField
                label="Sede"
                id="crear-sede"
                value={createForm.sede}
                onChange={(v) => setCreateForm((prev) => ({ ...prev, sede: v }))}
                opciones={sedesDistintas}
              />
            </div>
            {createError ? (
              <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
                {createError}
              </p>
            ) : null}
            <div className="mt-4">
              <ActionButton type="submit" busy={creatingEmpleado} className="bg-brand-500 dark:bg-brand-400">
                Crear empleado
              </ActionButton>
            </div>
          </form>
        </NexxusCard>
      ) : null}

      <div className="mt-8">
        {loading ? (
          <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando empleados...</p>
        ) : (
          <DataTable title="Plantilla de la empresa" columnsData={columnsData} tableData={tableData} readOnly delay={150} />
        )}
      </div>

      {selectedEmpleado ? (
        <NexxusCard extra="mt-8 w-full p-4" delay={100}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-700 dark:text-white">{selectedEmpleado.nombre}</h2>
            <button
              type="button"
              onClick={() => setSelectedEmpleado(null)}
              className="text-sm font-medium text-gray-600 hover:text-navy-700 dark:text-white/70 dark:hover:text-white"
            >
              Cerrar
            </button>
          </div>

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
                label="Salario base"
                id="editar-salario"
                type="number"
                value={editForm.salarioBase}
                onChange={(e) => setEditForm((f) => ({ ...f, salarioBase: e.target.value }))}
              />
              <SelectListaField
                label="Cargo"
                id="editar-cargo"
                value={editForm.cargo}
                onChange={(v) => setEditForm((f) => ({ ...f, cargo: v }))}
                opciones={cargosDistintos}
              />
              <SelectListaField
                label="Departamento"
                id="editar-departamento"
                value={editForm.departamento}
                onChange={(v) => setEditForm((f) => ({ ...f, departamento: v }))}
                opciones={departamentosDistintos}
              />
              <SelectListaField
                label="Sede"
                id="editar-sede"
                value={editForm.sede}
                onChange={(v) => setEditForm((f) => ({ ...f, sede: v }))}
                opciones={sedesDistintas}
              />
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
            <div>
              <label className={selectLabelClasses} htmlFor="editar-rol">
                Rol
              </label>
              <select
                id="editar-rol"
                className={selectClasses}
                value={rolSeleccionado}
                onChange={(e) => setRolSeleccionado(e.target.value)}
              >
                {ROLE_OPTIONS.filter((opt) => opt.value !== "super_admin").map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <ActionButton busy={busyAction === "rol"} onClick={handleCambiarRol} className="bg-blueSecondary">
              Cambiar rol
            </ActionButton>
          </div>

          {actionMsg ? <p className="mt-3 text-sm font-medium text-gray-600 dark:text-white/70">{actionMsg}</p> : null}

          <div className="mt-3 flex flex-wrap gap-3">
            <ActionButton busy={busyAction === "guardar"} onClick={handleGuardarCambios} className="bg-brand-500 dark:bg-brand-400">
              Guardar cambios
            </ActionButton>
            <ActionButton busy={busyAction === "estado"} onClick={handleToggleActivo} className="bg-orange-500">
              {selectedEmpleado.activo ? "Desactivar" : "Activar"}
            </ActionButton>
            <ActionButton busy={busyAction === "eliminar"} onClick={handleEliminar} className="bg-red-500">
              Eliminar
            </ActionButton>
          </div>
        </NexxusCard>
      ) : null}
    </div>
  );
}
