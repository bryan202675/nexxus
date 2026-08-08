import { useEffect, useMemo, useState } from "react";
import {
  MdOutlinePeople,
  MdOutlineCheckCircle,
  MdOutlineCancel,
  MdOutlineSupervisorAccount,
  MdOutlineBadge,
} from "react-icons/md";
import NexxusCard from "views/nexxus/components/NexxusCard";
import NexxusWidget from "views/nexxus/components/NexxusWidget";
import DataTable from "views/nexxus/components/DataTable";
import Modal from "components/nexxus/Modal";
import Avatar from "components/nexxus/Avatar";
import InputField from "components/fields/InputField";
import CodigoEmpresaDisplay from "components/nexxus/CodigoEmpresaDisplay";

import { useAuth } from "context/AuthContext";
import { useEmpresaPlan, limiteAlcanzado } from "services/planEnforcement";
import { supabase } from "supabaseClient/supabaseConfig";
import { subscribeEmpleados, subscribeSedes, subscribeCargos, subscribeDepartamentos } from "services/adminRepository";
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

const mapEmpleado = (docSnap: any, lookups: any = {}) => {
  const data = docSnap.data() || {};
  const { cargos = {}, departamentos = {}, sedes = {} } = lookups;
  return {
    id: docSnap.id,
    nombre: textValue(data.nombre, "Sin nombre"),
    correo: textValue(data.correo),
    usuario: textValue(data.usuario_interno),
    rol: normalizeRol(data.rol),
    cargoId: textValue(data.cargo_id),
    cargo: cargos[data.cargo_id] || "",
    telefono: textValue(data.telefono),
    departamentoId: textValue(data.departamento_id),
    departamento: departamentos[data.departamento_id] || "",
    sede: sedes[data.sede_id] || "",
    sedeId: textValue(data.sede_id),
    salarioBase: typeof data.salario_base === "number" ? data.salario_base : Number(data.salario_base) || 0,
    empresaId: textValue(data.empresa_id),
    activo: data.estado_activo !== false,
    eliminado: data.eliminado === true,
    ultimoCheckIn: data.ultimo_check_in || null,
    createdAt: data.created_at || null,
    foto: textValue(data.foto_perfil),
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

// supabase-js lanza err.message = "Edge Function returned a non-2xx status code" para
// CUALQUIER error de una Edge Function, sin importar la causa real -- el motivo real que
// devolvio la funcion (ej. "correo ya registrado") viaja en err.context, que es la Response
// HTTP cruda y hay que leerla aparte. Sin esto, cualquier error de una Edge Function se ve
// igual en pantalla y no dice nada util.
async function mensajeErrorEdgeFunction(err, fallback) {
  try {
    if (err?.context && typeof err.context.json === "function") {
      const body = await err.context.clone().json();
      if (body?.error) return body.error;
      if (body?.message) return body.message;
    }
  } catch {
    // El cuerpo no era JSON u otro fallo al leerlo; se usa el mensaje generico de abajo.
  }
  return err?.message || fallback;
}

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

const EMPTY_CREATE_FORM = { nombre: "", correo: "", usuario: "", contrasena: "", rol: "empleado", cargo: "", departamento: "", sede: "" };

export default function GestionPlantilla() {
  const { empresaId, user } = useAuth();
  const { plan, planLimits, codigoEmpresa } = useEmpresaPlan();

  const [empleadosDocs, setEmpleadosDocs] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
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
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [creatingEmpleado, setCreatingEmpleado] = useState(false);
  const [createError, setCreateError] = useState("");

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    tipoAsignacion: "todos", // todos, empleados, departamentos, cargos, sedes
    seleccionados: [],
    titulo: "",
    descripcion: "",
    urgencia: "media",
    fechaLimite: "",
  });
  const [assigningTask, setAssigningTask] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [taskSuccess, setTaskSuccess] = useState("");

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

  useEffect(() => {
    if (!empresaId) return;
    const unsubscribe = subscribeDepartamentos(empresaId, (docs) => setDepartamentos(docs.map(mapListaSimple)), () => setDepartamentos([]));
    return () => unsubscribe();
  }, [empresaId]);

  const lookups = useMemo(() => ({
    cargos: Object.fromEntries(cargos.map((c) => [c.id, c.nombre])),
    departamentos: Object.fromEntries(departamentos.map((d) => [d.id, d.nombre])),
    sedes: Object.fromEntries(sedes.map((s) => [s.id, s.nombre])),
  }), [cargos, departamentos, sedes]);

  const empleados = useMemo(
    () => empleadosDocs.map((docSnap) => mapEmpleado(docSnap, lookups)).filter((e) => !e.eliminado),
    [empleadosDocs, lookups]
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
      usuario: selectedEmpleado.usuario || "",
      telefono: selectedEmpleado.telefono || "",
      cargo: selectedEmpleado.cargo || "",
      departamento: selectedEmpleado.departamento || "",
      sede: selectedEmpleado.sede || "",
      salarioBase: selectedEmpleado.salarioBase || 0,
    });
    setRolSeleccionado(selectedEmpleado.rol || "empleado");
    setNuevaContrasena("");
    setActionMsg("");
  }, [selectedEmpleado]);

  const departamentosDistintos = useMemo(
    () =>
      [...new Set([...departamentos.map((d) => d.nombre), ...empleados.map((e) => e.departamento)].filter(Boolean))].sort(),
    [departamentos, empleados]
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
      const cargoId = cargos.find((c) => c.nombre === editForm.cargo)?.id || null;
      const departamentoId = departamentos.find((d) => d.nombre === editForm.departamento)?.id || null;
      const sedeId = sedes.find((s) => s.nombre === editForm.sede)?.id || null;
      const { error } = await supabase
        .from("usuarios")
        .update({
          nombre: editForm.nombre,
          correo: editForm.correo,
          telefono: editForm.telefono,
          cargo_id: cargoId,
          departamento_id: departamentoId,
          sede_id: sedeId,
          salario_base: Number(editForm.salarioBase) || 0,
        })
        .eq("id", selectedEmpleado.id);
      if (error) throw error;
      setActionMsg("Cambios guardados.");
    } catch (err) {
      setActionMsg(err.message || "No se pudieron guardar los cambios.");
    } finally {
      setBusyAction("");
    }
  };

  // Cambia la contraseña del empleado sin pedirle al admin la contraseña anterior. El SDK de
  // cliente de Supabase Auth no puede cambiar la contraseña de OTRO usuario sin conocer la
  // anterior -- por diseño, para que nadie pueda secuestrar cuentas ajenas -- así que esto
  // requiere sí o sí una Edge Function con privilegios de service_role (reset-employee-password),
  // que sincroniza en un solo paso la contraseña real de Supabase Auth y el hash interno que usa
  // el login de la app móvil (loginEmpresarial).
  const handleCambiarContrasena = async () => {
    if (!selectedEmpleado) return;
    if (nuevaContrasena.trim().length < 6) {
      setActionMsg("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setBusyAction("password");
    setActionMsg("");
    try {
      const { error } = await supabase.functions.invoke("reset-employee-password", {
        body: { empleadoId: selectedEmpleado.id, newPassword: nuevaContrasena },
      });
      if (error) throw error;
      setNuevaContrasena("");
      setActionMsg("Contraseña actualizada.");
    } catch (err) {
      setActionMsg(await mensajeErrorEdgeFunction(err, "No se pudo cambiar la contraseña."));
    } finally {
      setBusyAction("");
    }
  };

  const handleCambiarRol = async () => {
    if (!selectedEmpleado || !rolSeleccionado) return;
    setBusyAction("rol");
    setActionMsg("");
    try {
      const { error } = await supabase.functions.invoke("update-employee-role", {
        body: { empleadoId: selectedEmpleado.id, rol: rolSeleccionado },
      });
      if (error) throw error;
      setActionMsg("Rol actualizado.");
      setSelectedEmpleado((prev) => (prev ? { ...prev, rol: rolSeleccionado } : prev));
    } catch (err) {
      setActionMsg(await mensajeErrorEdgeFunction(err, "No se pudo cambiar el rol."));
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
      const { error } = await supabase.from("usuarios").update({ estado_activo: nuevoEstado }).eq("id", selectedEmpleado.id);
      if (error) throw error;
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
      // Borrado directo (no via Edge Function sa-delete-user: esa requiere
      // super_admin). La policy RLS de usuarios ya permite a un
      // admin_empresa borrar empleados de su propia empresa.
      const { error } = await supabase.from("usuarios").delete().eq("id", selectedEmpleado.id);
      if (error) throw error;
      setSelectedEmpleado(null);
    } catch (err) {
      setActionMsg(err.message || "No se pudo eliminar el empleado.");
    } finally {
      setBusyAction("");
    }
  };

  const limiteEmpleadosAlcanzado = limiteAlcanzado(empleadosDocs.length, planLimits.employees);

  const handleCrearEmpleado = async (event) => {
    event.preventDefault();
    setCreateError("");
    if (!empresaId) return;
    if (limiteEmpleadosAlcanzado) {
      setCreateError(`Tu plan ${plan} permite hasta ${planLimits.employees} empleados. Actualiza de plan para agregar más.`);
      return;
    }
    if (!createForm.nombre.trim() || !createForm.correo.trim() || createForm.contrasena.length < 6) {
      setCreateError("Nombre, correo y una contraseña de al menos 6 caracteres son obligatorios.");
      return;
    }
    setCreatingEmpleado(true);
    try {
      // Alta via Edge Function (crear-usuario-empresa, Fase 2): crea la cuenta
      // de Auth y la fila de usuarios con el hash de password interno en un
      // solo paso server-side (bcrypt via service_role) -- reemplaza el
      // truco de "app secundaria" + hash en el cliente.
      const { data, error } = await supabase.functions.invoke("crear-usuario-empresa", {
        body: {
          nombre: createForm.nombre.trim(),
          correo: createForm.correo.trim().toLowerCase(),
          contrasena: createForm.contrasena,
          rol: createForm.rol,
          usuarioInterno: createForm.usuario.trim(),
        },
      });
      if (error) throw error;
      const uid = data?.uid;
      if (uid) {
        const cargoId = cargos.find((c) => c.nombre === createForm.cargo)?.id || null;
        const departamentoId = departamentos.find((d) => d.nombre === createForm.departamento)?.id || null;
        const sedeId = sedes.find((s) => s.nombre === createForm.sede)?.id || null;
        if (cargoId || departamentoId || sedeId) {
          await supabase.from("usuarios").update({ cargo_id: cargoId, departamento_id: departamentoId, sede_id: sedeId }).eq("id", uid);
        }
      }

      setCreateForm(EMPTY_CREATE_FORM);
      setShowCreatePanel(false);
    } catch (err) {
      setCreateError(await mensajeErrorEdgeFunction(err, "No se pudo crear el empleado."));
    } finally {
      setCreatingEmpleado(false);
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    setTaskError("");
    setTaskSuccess("");
    if (!taskForm.titulo.trim() || !taskForm.descripcion.trim()) {
      setTaskError("El título y la descripción son obligatorios.");
      return;
    }
    
    if (taskForm.tipoAsignacion !== "todos" && taskForm.seleccionados.length === 0) {
      setTaskError("Debes seleccionar al menos una opción para asignar.");
      return;
    }

    setAssigningTask(true);
    
    try {
      const dbEmpleados = empleados;
      let targetEmpleados = [];
      
      switch (taskForm.tipoAsignacion) {
        case "todos":
          targetEmpleados = dbEmpleados;
          break;
        case "empleados":
          targetEmpleados = dbEmpleados.filter(e => taskForm.seleccionados.includes(e.id));
          break;
        case "departamentos":
          targetEmpleados = dbEmpleados.filter(e => e.departamento && taskForm.seleccionados.includes(e.departamento));
          break;
        case "cargos":
          targetEmpleados = dbEmpleados.filter(e => e.cargo && taskForm.seleccionados.includes(e.cargo));
          break;
        case "sedes":
          targetEmpleados = dbEmpleados.filter(e => e.sede && taskForm.seleccionados.includes(e.sede));
          break;
        default:
          break;
      }
      
      if (targetEmpleados.length === 0) {
        throw new Error("No se encontraron empleados que coincidan con la selección.");
      }
      
      // Nombres de columna de la tabla "tareas" (Supabase, Fase 0):
      // empresa_id, asignado_a, titulo, descripcion, prioridad, estado,
      // fecha_limite, creado_por -- coincide con lo que
      // SupabaseTaskRepository.ts (app movil) usa para consultar.
      const prioridadPorUrgencia = { baja: "Baja", media: "Media", alta: "Alta", urgente: "Urgente" };
      const filas = targetEmpleados.map((emp) => ({
        empresa_id: empresaId,
        asignado_a: emp.id,
        creado_por: user?.id || null,
        titulo: taskForm.titulo.trim(),
        descripcion: taskForm.descripcion.trim(),
        prioridad: prioridadPorUrgencia[taskForm.urgencia] || "Media",
        fecha_limite: taskForm.fechaLimite || null,
        estado: "pendiente",
        datos: { progreso: 0, jefe: user?.nombre || user?.correo || "Administrador", depto: emp.departamento || "" },
      }));

      const { error: insertError } = await supabase.from("tareas").insert(filas);
      if (insertError) throw insertError;
      
      setTaskSuccess(`Se han asignado ${targetEmpleados.length} tareas correctamente.`);
      setTimeout(() => {
        setShowTaskModal(false);
        setTaskForm({ tipoAsignacion: "todos", seleccionados: [], titulo: "", descripcion: "", urgencia: "media", fechaLimite: "" });
        setTaskSuccess("");
      }, 2000);
      
    } catch (err) {
      setTaskError(err.message || "Ocurrió un error al asignar las tareas.");
    } finally {
      setAssigningTask(false);
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

      <div className="mb-6 flex flex-col justify-between gap-4 rounded-xl border border-brand-100 bg-brand-50 p-4 md:flex-row md:items-center dark:border-white/10 dark:bg-navy-900">
        <div>
          <h4 className="text-lg font-bold text-navy-700 dark:text-white">
            Código de Empresa:{" "}
            <span className="ml-2 rounded-lg bg-brand-500 px-3 py-1 text-white tracking-widest">
              <CodigoEmpresaDisplay code={codigoEmpresa} />
            </span>
          </h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
            Comparte este código con tus empleados. Lo necesitarán para registrarse o iniciar sesión en la aplicación móvil.
          </p>
        </div>
      </div>

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
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-4 xl:grid-cols-7">
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
            <select id="filtro-estado" className={selectClasses} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              {ESTADO_FILTRO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col items-stretch gap-2">
            <button
              type="button"
              disabled={limiteEmpleadosAlcanzado}
              onClick={() => setShowCreatePanel((prev) => !prev)}
              title={limiteEmpleadosAlcanzado ? `Límite de ${planLimits.employees} empleados alcanzado en el plan ${plan}.` : undefined}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:bg-brand-400 dark:disabled:bg-white/10 dark:disabled:text-white/40"
            >
              Crear empleado
            </button>
            {limiteEmpleadosAlcanzado ? (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Límite de {planLimits.employees} empleados alcanzado.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col items-stretch gap-2">
            <button
              type="button"
              onClick={() => setShowTaskModal(true)}
              className="flex h-12 w-full items-center justify-center rounded-xl border border-brand-500 text-brand-500 text-sm font-bold transition hover:bg-brand-50 dark:border-brand-400 dark:text-brand-400 dark:hover:bg-white/5"
            >
              Asignar Tarea
            </button>
          </div>
        </div>
      </NexxusCard>

      <Modal isOpen={showCreatePanel} onClose={() => setShowCreatePanel(false)} title="Crear empleado">
        <div className="p-2">
          <form onSubmit={handleCrearEmpleado}>
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
                label="Usuario"
                id="crear-usuario"
                placeholder="usuario123"
                value={createForm.usuario}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, usuario: e.target.value }))}
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
        </div>
      </Modal>

      <div className="mt-8">
        {loading ? (
          <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando empleados...</p>
        ) : (
          <DataTable title="Plantilla de la empresa" columnsData={columnsData} tableData={tableData} readOnly delay={150} />
        )}
      </div>

      <Modal isOpen={!!selectedEmpleado} onClose={() => setSelectedEmpleado(null)} title={selectedEmpleado?.nombre || "Editar empleado"}>
        {selectedEmpleado ? (
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
                label="Correo (Login)"
                id="editar-correo"
                value={editForm.correo}
                onChange={(e) => setEditForm((f) => ({ ...f, correo: e.target.value }))}
              />
              <InputField
                label="Usuario"
                id="editar-usuario"
                value={editForm.usuario}
                onChange={(e) => setEditForm((f) => ({ ...f, usuario: e.target.value }))}
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

          <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
            <InputField
              label="Nueva contraseña"
              id="editar-nueva-contrasena"
              type="text"
              placeholder="Mínimo 6 caracteres"
              value={nuevaContrasena}
              onChange={(e) => setNuevaContrasena(e.target.value)}
            />
            <ActionButton busy={busyAction === "password"} onClick={handleCambiarContrasena} className="bg-orange-500">
              Cambiar contraseña
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
        </div>
        ) : null}
      </Modal>

      {/* MODAL PARA ASIGNACION DE TAREAS MASIVAS */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Asignación de Tareas">
        <div className="p-2">
          {taskSuccess ? (
            <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-700 dark:bg-green-400/10 dark:text-green-400">
              {taskSuccess}
            </div>
          ) : (
            <form onSubmit={handleAssignTask}>
              {taskError && (
                <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
                  {taskError}
                </p>
              )}
              
              <div className="mb-4">
                <label className="mb-2 block text-sm font-bold text-navy-700 dark:text-white">Destinatarios</label>
                <select
                  className={selectClasses}
                  value={taskForm.tipoAsignacion}
                  onChange={(e) => setTaskForm({ ...taskForm, tipoAsignacion: e.target.value, seleccionados: [] })}
                >
                  <option value="todos">Toda la empresa ({empleados.length} empleados)</option>
                  <option value="departamentos">Por Departamento</option>
                  <option value="cargos">Por Cargo</option>
                  <option value="sedes">Por Sede</option>
                  <option value="empleados">Empleados Específicos</option>
                </select>
              </div>

              {taskForm.tipoAsignacion !== "todos" && (
                <div className="mb-4 max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/50 p-3 dark:border-white/10 dark:bg-navy-900">
                  {taskForm.tipoAsignacion === "departamentos" && departamentosDistintos.map(d => (
                    <label key={d} className="mb-2 flex items-center gap-2 text-sm text-navy-700 dark:text-white">
                      <input
                        type="checkbox"
                        checked={taskForm.seleccionados.includes(d)}
                        onChange={(e) => {
                          const newSel = e.target.checked 
                            ? [...taskForm.seleccionados, d] 
                            : taskForm.seleccionados.filter(s => s !== d);
                          setTaskForm({...taskForm, seleccionados: newSel});
                        }}
                        className="rounded border-gray-300 dark:border-white/10 dark:bg-charcoal"
                      />
                      {d}
                    </label>
                  ))}
                  {taskForm.tipoAsignacion === "cargos" && cargosDistintos.map(c => (
                    <label key={c} className="mb-2 flex items-center gap-2 text-sm text-navy-700 dark:text-white">
                      <input
                        type="checkbox"
                        checked={taskForm.seleccionados.includes(c)}
                        onChange={(e) => {
                          const newSel = e.target.checked 
                            ? [...taskForm.seleccionados, c] 
                            : taskForm.seleccionados.filter(s => s !== c);
                          setTaskForm({...taskForm, seleccionados: newSel});
                        }}
                        className="rounded border-gray-300 dark:border-white/10 dark:bg-charcoal"
                      />
                      {c}
                    </label>
                  ))}
                  {taskForm.tipoAsignacion === "sedes" && sedesDistintas.map(s => (
                    <label key={s} className="mb-2 flex items-center gap-2 text-sm text-navy-700 dark:text-white">
                      <input
                        type="checkbox"
                        checked={taskForm.seleccionados.includes(s)}
                        onChange={(e) => {
                          const newSel = e.target.checked 
                            ? [...taskForm.seleccionados, s] 
                            : taskForm.seleccionados.filter(sel => sel !== s);
                          setTaskForm({...taskForm, seleccionados: newSel});
                        }}
                        className="rounded border-gray-300 dark:border-white/10 dark:bg-charcoal"
                      />
                      {s}
                    </label>
                  ))}
                  {taskForm.tipoAsignacion === "empleados" && empleados.map(e => (
                    <label key={e.id} className="mb-2 flex items-center gap-2 text-sm text-navy-700 dark:text-white">
                      <input
                        type="checkbox"
                        checked={taskForm.seleccionados.includes(e.id)}
                        onChange={(ev) => {
                          const newSel = ev.target.checked 
                            ? [...taskForm.seleccionados, e.id] 
                            : taskForm.seleccionados.filter(s => s !== e.id);
                          setTaskForm({...taskForm, seleccionados: newSel});
                        }}
                        className="rounded border-gray-300 dark:border-white/10 dark:bg-charcoal"
                      />
                      {e.nombre} ({e.rol}) {!e.activo && "(Inactivo)"}
                    </label>
                  ))}
                </div>
              )}

              <InputField
                label="Título de la tarea"
                id="tarea-titulo"
                placeholder="Ej. Revisión mensual"
                value={taskForm.titulo}
                onChange={(e) => setTaskForm({ ...taskForm, titulo: e.target.value })}
              />

              <div className="mb-4">
                <label className="mb-2 block text-sm font-bold text-navy-700 dark:text-white">Descripción</label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:border-white/10 dark:bg-charcoal dark:text-white"
                  rows={3}
                  placeholder="Detalles de lo que se debe hacer..."
                  value={taskForm.descripcion}
                  onChange={(e) => setTaskForm({ ...taskForm, descripcion: e.target.value })}
                ></textarea>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-navy-700 dark:text-white">Urgencia</label>
                  <select
                    className={selectClasses}
                    value={taskForm.urgencia}
                    onChange={(e) => setTaskForm({ ...taskForm, urgencia: e.target.value })}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-navy-700 dark:text-white">Fecha límite (Opcional)</label>
                  <input
                    type="date"
                    className="flex h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:border-white/10 dark:bg-charcoal dark:text-white"
                    value={taskForm.fechaLimite}
                    onChange={(e) => setTaskForm({ ...taskForm, fechaLimite: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-navy-700 transition hover:bg-gray-100 dark:text-white dark:hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={assigningTask}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
                >
                  {assigningTask ? "Asignando..." : "Asignar Tareas"}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}
