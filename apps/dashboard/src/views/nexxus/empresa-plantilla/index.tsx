import { useEffect, useMemo, useState } from "react";
import {
  MdOutlinePeople,
  MdOutlineCheckCircle,
  MdOutlineCancel,
  MdOutlineSupervisorAccount,
  MdOutlineBadge,
  MdOutlineSearch,
  MdOutlinePersonAdd,
  MdOutlineAssignment,
  MdOutlineEdit,
  MdOutlineCorporateFare,
  MdOutlineContentCopy,
  MdCheck,
  MdOutlineDelete,
  MdOutlineClose,
  MdOutlineWarningAmber,
  MdOutlinePerson,
  MdOutlineEmail,
  MdOutlineAlternateEmail,
  MdOutlineLock,
  MdOutlineVisibility,
  MdOutlineVisibilityOff,
  MdOutlineLocationOn,
  MdOutlineRefresh,
} from "react-icons/md";
import NexxusCard from "views/nexxus/components/NexxusCard";
import Modal from "components/nexxus/Modal";
import Avatar from "components/nexxus/Avatar";
import InputField from "components/fields/InputField";
import CodigoEmpresaDisplay from "components/nexxus/CodigoEmpresaDisplay";

import { useAuth } from "context/AuthContext";
import { useEmpresaPlan, limiteAlcanzado } from "services/planEnforcement";
import { supabase } from "supabaseClient/supabaseConfig";
import {
  subscribeEmpleados,
  subscribeSedes,
  subscribeCargos,
  subscribeDepartamentos,
} from "services/adminRepository";
import { etiquetaRol, ROLE_OPTIONS } from "services/saFormat";

const ROLE_ALIASES = {
  super_admin: ["super_admin"],
  admin_empresa: ["admin_empresa", "admin"],
  jefe: ["jefe", "jefe_sector"],
  empleado: ["empleado", "psicologo"],
};

const normalizeRol = (rol: any) => {
  const value = String(rol || "").trim().toLowerCase();
  for (const [canonico, alias] of Object.entries(ROLE_ALIASES)) {
    if (alias.includes(value)) return canonico;
  }
  return value || "empleado";
};

const textValue = (value: any, fallback = "") =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;

const isUuidOrHash = (str: any) => {
  if (!str || typeof str !== "string") return false;
  const s = str.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s) || /^[0-9a-f]{24,}$/i.test(s);
};

const resolverCargo = (data: any, lookups: any, rol: string, depto: string) => {
  const { cargos = {} } = lookups;
  if (data.cargo_id && cargos[data.cargo_id] && !isUuidOrHash(cargos[data.cargo_id])) {
    return cargos[data.cargo_id];
  }
  if (data.cargo && typeof data.cargo === "string" && !isUuidOrHash(data.cargo)) {
    return data.cargo.trim();
  }
  if (data.puesto && typeof data.puesto === "string" && !isUuidOrHash(data.puesto)) {
    return data.puesto.trim();
  }
  if (data.cargo_nombre && typeof data.cargo_nombre === "string" && !isUuidOrHash(data.cargo_nombre)) {
    return data.cargo_nombre.trim();
  }
  // Smart fallback
  if (rol === "jefe") return depto && depto !== "General" ? `Jefe de ${depto}` : "Líder de Área";
  if (rol === "admin_empresa") return "Administrador";
  if (rol === "super_admin") return "Super Administrador";
  if (depto && depto !== "General" && depto !== "—") return `Especialista en ${depto}`;
  return "Colaborador";
};

const resolverDepartamento = (data: any, lookups: any) => {
  const { departamentos = {} } = lookups;
  if (data.departamento_id && departamentos[data.departamento_id]) return departamentos[data.departamento_id];
  if (data.departamento && typeof data.departamento === "string" && !isUuidOrHash(data.departamento)) return data.departamento.trim();
  if (data.area && typeof data.area === "string" && !isUuidOrHash(data.area)) return data.area.trim();
  return "General";
};

const resolverSede = (data: any, lookups: any) => {
  const { sedes = {} } = lookups;
  if (data.sede_id && sedes[data.sede_id]) return sedes[data.sede_id];
  if (data.sede && typeof data.sede === "string" && !isUuidOrHash(data.sede)) return data.sede.trim();
  if (data.sucursal && typeof data.sucursal === "string" && !isUuidOrHash(data.sucursal)) return data.sucursal.trim();
  return "Sede Principal";
};

const mapEmpleado = (docSnap: any, lookups: any = {}) => {
  const data = docSnap.data ? docSnap.data() : docSnap;
  const rol = normalizeRol(data.rol);
  const departamento = resolverDepartamento(data, lookups);
  const cargo = resolverCargo(data, lookups, rol, departamento);
  const sede = resolverSede(data, lookups);

  return {
    id: docSnap.id || data.id,
    nombre: textValue(data.nombre, "Sin nombre"),
    correo: textValue(data.correo || data.email),
    usuario: textValue(data.usuario_interno || data.usuario),
    rol,
    cargoId: textValue(data.cargo_id),
    cargo,
    telefono: textValue(data.telefono),
    departamentoId: textValue(data.departamento_id),
    departamento,
    sede,
    sedeId: textValue(data.sede_id),
    salarioBase: typeof data.salario_base === "number" ? data.salario_base : Number(data.salario_base) || 0,
    empresaId: textValue(data.empresa_id),
    activo: data.estado_activo !== false && data.activo !== false,
    eliminado: data.eliminado === true,
    ultimoCheckIn: data.ultimo_check_in || null,
    createdAt: data.created_at || null,
    foto: textValue(data.foto_perfil || data.foto_url || data.avatar_url),
  };
};

const mapListaSimple = (docSnap: any) => {
  const data = docSnap.data ? docSnap.data() : docSnap;
  return { id: docSnap.id || data.id, nombre: textValue(data.nombre, docSnap.id) };
};

// cargos.titulo, no cargos.nombre -- a diferencia de sedes/departamentos. Sin esto, cada cargo
// caía en el fallback al id (mapListaSimple) y el filtro !isUuidOrHash lo escondía por completo:
// el selector de "Cargo/Puesto" del formulario de empleado quedaba siempre vacío, y al guardar
// cualquier edición de empleado se le borraba el cargo asignado (cargoId siempre resolvía null).
const mapCargoSimple = (docSnap: any) => {
  const data = docSnap.data ? docSnap.data() : docSnap;
  return { id: docSnap.id || data.id, nombre: textValue(data.titulo, docSnap.id) };
};

const ROLE_BADGE: Record<string, string> = {
  super_admin: "bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300 border border-purple-500/20",
  admin_empresa: "bg-brand-500/10 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300 border border-brand-500/20",
  jefe: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300 border border-blue-500/20",
  empleado: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/70 border border-gray-200 dark:border-white/10",
};

const selectClasses =
  "mt-1 flex h-10 w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400";
const selectLabelClasses = "text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50";

const ActionButton = ({ children, className = "", busy, ...rest }: any) => (
  <button
    type="button"
    disabled={busy}
    className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 ${className}`}
    {...rest}
  >
    {busy ? "Procesando..." : children}
  </button>
);

const CAMPO_VACIO = "__vacio__";

async function mensajeErrorEdgeFunction(err: any, fallback: string) {
  try {
    if (err?.context && typeof err.context.json === "function") {
      const body = await err.context.clone().json();
      if (body?.error) return body.error;
      if (body?.message) return body.message;
    }
  } catch {
    // Ignorar fallback
  }
  return err?.message || fallback;
}

const SelectListaField = ({ label, id, value, onChange, opciones }: any) => (
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
      {opciones.map((opt: string) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const EMPTY_CREATE_FORM = {
  nombre: "",
  correo: "",
  usuario: "",
  contrasena: "",
  rol: "empleado",
  cargo: "",
  departamento: "",
  sede: "",
};

export default function GestionPlantilla() {
  const { empresaId, user } = useAuth();
  const { plan, planLimits, codigoEmpresa } = useEmpresaPlan();

  const [empleadosDocs, setEmpleadosDocs] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroRapido, setFiltroRapido] = useState<"todos" | "activos" | "jefes" | "operativos" | "inactivos">("todos");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("");
  const [filtroSede, setFiltroSede] = useState("");

  const [selectedEmpleado, setSelectedEmpleado] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any | null>(null);
  const [rolSeleccionado, setRolSeleccionado] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  // Estado del Modal Crear Empleado
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [creatingEmpleado, setCreatingEmpleado] = useState(false);
  const [createError, setCreateError] = useState("");

  // Estado del Modal de Tareas
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const [taskForm, setTaskForm] = useState({
    tipoAsignacion: "todos",
    seleccionados: [] as string[],
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
      (err: any) => {
        setError(err.message || "No se pudo conectar con el servidor.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [empresaId]);

  useEffect(() => {
    if (!empresaId) return;
    const unsubscribe = subscribeSedes(
      empresaId,
      (docs) => setSedes(docs.map(mapListaSimple)),
      () => setSedes([])
    );
    return () => unsubscribe();
  }, [empresaId]);

  useEffect(() => {
    if (!empresaId) return;
    const unsubscribe = subscribeCargos(
      empresaId,
      (docs) => setCargos(docs.map(mapCargoSimple)),
      () => setCargos([])
    );
    return () => unsubscribe();
  }, [empresaId]);

  useEffect(() => {
    if (!empresaId) return;
    const unsubscribe = subscribeDepartamentos(
      empresaId,
      (docs) => setDepartamentos(docs.map(mapListaSimple)),
      () => setDepartamentos([])
    );
    return () => unsubscribe();
  }, [empresaId]);

  const lookups = useMemo(
    () => ({
      cargos: Object.fromEntries(cargos.map((c) => [c.id, c.nombre])),
      departamentos: Object.fromEntries(departamentos.map((d) => [d.id, d.nombre])),
      sedes: Object.fromEntries(sedes.map((s) => [s.id, s.nombre])),
    }),
    [cargos, departamentos, sedes]
  );

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
    () =>
      [...new Set([...cargos.map((c) => c.nombre), ...empleados.map((e) => e.cargo)].filter((c) => Boolean(c) && !isUuidOrHash(c)))].sort(),
    [cargos, empleados]
  );
  const sedesDistintas = useMemo(
    () => [...new Set([...sedes.map((s) => s.nombre), ...empleados.map((e) => e.sede)].filter(Boolean))].sort(),
    [sedes, empleados]
  );

  const metricas = useMemo(() => {
    const total = empleados.length;
    const activos = empleados.filter((e) => e.activo).length;
    const inactivos = total - activos;
    const jefes = empleados.filter((e) => e.rol === "jefe").length;
    const operativos = empleados.filter((e) => e.rol === "empleado").length;
    return { total, activos, inactivos, jefes, operativos };
  }, [empleados]);

  const empleadosFiltrados = useMemo(() => {
    return empleados.filter((e) => {
      const q = busqueda.toLowerCase().trim();
      if (
        q &&
        !e.nombre.toLowerCase().includes(q) &&
        !e.correo.toLowerCase().includes(q) &&
        !e.usuario.toLowerCase().includes(q) &&
        !e.cargo.toLowerCase().includes(q) &&
        !e.departamento.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (filtroRapido === "activos" && !e.activo) return false;
      if (filtroRapido === "inactivos" && e.activo) return false;
      if (filtroRapido === "jefes" && e.rol !== "jefe") return false;
      if (filtroRapido === "operativos" && e.rol !== "empleado") return false;

      if (filtroDepartamento && e.departamento !== filtroDepartamento) return false;
      if (filtroCargo && e.cargo !== filtroCargo) return false;
      if (filtroSede && e.sede !== filtroSede) return false;

      return true;
    });
  }, [empleados, busqueda, filtroRapido, filtroDepartamento, filtroCargo, filtroSede]);

  // Lista de destinatarios filtrados dentro del modal de tareas
  const destinatariosFiltrados = useMemo(() => {
    const q = taskSearch.toLowerCase().trim();
    if (taskForm.tipoAsignacion === "empleados") {
      return empleados.filter((e) => {
        if (!q) return true;
        return (
          e.nombre.toLowerCase().includes(q) ||
          e.correo.toLowerCase().includes(q) ||
          e.usuario.toLowerCase().includes(q) ||
          e.departamento.toLowerCase().includes(q) ||
          e.cargo.toLowerCase().includes(q)
        );
      });
    }
    if (taskForm.tipoAsignacion === "departamentos") {
      return departamentosDistintos.filter((d) => !q || d.toLowerCase().includes(q));
    }
    if (taskForm.tipoAsignacion === "cargos") {
      return cargosDistintos.filter((c) => !q || c.toLowerCase().includes(q));
    }
    if (taskForm.tipoAsignacion === "sedes") {
      return sedesDistintas.filter((s) => !q || s.toLowerCase().includes(q));
    }
    return [];
  }, [taskForm.tipoAsignacion, taskSearch, empleados, departamentosDistintos, cargosDistintos, sedesDistintas]);

  // Cantidad calculada de colaboradores destino
  const totalDestinatariosCalculados = useMemo(() => {
    if (taskForm.tipoAsignacion === "todos") return empleados.length;
    if (taskForm.tipoAsignacion === "empleados") return taskForm.seleccionados.length;
    if (taskForm.tipoAsignacion === "departamentos") {
      return empleados.filter((e) => e.departamento && taskForm.seleccionados.includes(e.departamento)).length;
    }
    if (taskForm.tipoAsignacion === "cargos") {
      return empleados.filter((e) => e.cargo && taskForm.seleccionados.includes(e.cargo)).length;
    }
    if (taskForm.tipoAsignacion === "sedes") {
      return empleados.filter((e) => e.sede && taskForm.seleccionados.includes(e.sede)).length;
    }
    return 0;
  }, [taskForm.tipoAsignacion, taskForm.seleccionados, empleados]);

  const handleCopiarCodigo = () => {
    if (codigoEmpresa) {
      navigator.clipboard.writeText(codigoEmpresa);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

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
      setActionMsg("Cambios guardados con éxito.");
    } catch (err: any) {
      setActionMsg(err.message || "No se pudieron guardar los cambios.");
    } finally {
      setBusyAction("");
    }
  };

  const handleCambiarContrasena = async () => {
    if (!selectedEmpleado) return;
    if (nuevaContrasena.trim().length < 8) {
      setActionMsg("La nueva contraseña debe tener al menos 8 caracteres.");
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
      setActionMsg("Contraseña actualizada exitosamente.");
    } catch (err: any) {
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
      setActionMsg("Rol actualizado correctamente.");
      setSelectedEmpleado((prev: any) => (prev ? { ...prev, rol: rolSeleccionado } : prev));
    } catch (err: any) {
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
      const { error } = await supabase
        .from("usuarios")
        .update({ estado_activo: nuevoEstado })
        .eq("id", selectedEmpleado.id);
      if (error) throw error;
      setActionMsg(nuevoEstado ? "Colaborador activado." : "Colaborador desactivado.");
      setSelectedEmpleado((prev: any) => (prev ? { ...prev, activo: nuevoEstado } : prev));
    } catch (err: any) {
      setActionMsg(err.message || "No se pudo cambiar el estado.");
    } finally {
      setBusyAction("");
    }
  };

  const handleEliminar = async () => {
    if (!selectedEmpleado) return;
    if (!window.confirm(`¿Dar de baja a "${selectedEmpleado.nombre}"? Esta acción deshabilitará su acceso.`))
      return;
    setBusyAction("eliminar");
    setActionMsg("");
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ estado_activo: false, eliminado: true })
        .eq("id", selectedEmpleado.id);
      if (error) throw error;
      try {
        await supabase.from("audit_logs").insert({
          empresa_id: empresaId,
          actor_id: user?.id || null,
          accion: "Baja de empleado",
          modulo: "Plantilla",
          detalles: `${selectedEmpleado.nombre || selectedEmpleado.correo} fue dado de baja.`,
        });
      } catch {
        // Extra
      }
      setSelectedEmpleado(null);
    } catch (err: any) {
      setActionMsg(err.message || "No se pudo eliminar el colaborador.");
    } finally {
      setBusyAction("");
    }
  };

  const limiteEmpleadosAlcanzado = limiteAlcanzado(empleadosDocs.length, planLimits.employees);

  const handleGenerarPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm((prev) => ({ ...prev, contrasena: pass }));
  };

  const handleNombreChange = (val: string) => {
    setCreateForm((prev) => {
      const autoUser = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, ".")
        .replace(/\.+/g, ".")
        .replace(/^\.|\.$/g, "");

      // Si el usuario interno estaba vacío o coincidía con la sugerencia previa, actualizarlo
      const shouldUpdateUser = !prev.usuario || prev.usuario === prev.nombre.toLowerCase().replace(/[^a-z0-9]/g, ".");
      return {
        ...prev,
        nombre: val,
        usuario: shouldUpdateUser ? autoUser : prev.usuario,
      };
    });
  };

  const handleCrearEmpleado = async (event: any) => {
    event.preventDefault();
    setCreateError("");
    if (!empresaId) return;
    if (limiteEmpleadosAlcanzado) {
      setCreateError(
        `Tu plan ${plan} permite hasta ${planLimits.employees} colaboradores. Actualiza tu suscripción para continuar agregando.`
      );
      return;
    }
    if (!createForm.nombre.trim() || !createForm.correo.trim() || createForm.contrasena.length < 8) {
      setCreateError("Nombre, correo y una contraseña de mínimo 8 caracteres son obligatorios.");
      return;
    }
    setCreatingEmpleado(true);
    try {
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
        // Siempre corre (antes solo si cargo/depto/sede estaban seteados) -- sin esto fecha_ingreso
        // se quedaba NULL para siempre en cualquier empleado creado desde el dashboard, rompiendo
        // el cálculo de vacaciones (Art. 177) que depende de esa fecha. Mismo default que usa
        // GestionPlantilla.tsx del lado mobile cuando no se captura una fecha explícita.
        await supabase
          .from("usuarios")
          .update({
            cargo_id: cargoId,
            departamento_id: departamentoId,
            sede_id: sedeId,
            fecha_ingreso: new Date().toISOString().slice(0, 10),
          })
          .eq("id", uid);
      }

      setCreateForm(EMPTY_CREATE_FORM);
      setShowCreatePanel(false);
    } catch (err: any) {
      setCreateError(await mensajeErrorEdgeFunction(err, "No se pudo registrar el colaborador."));
    } finally {
      setCreatingEmpleado(false);
    }
  };

  const handleAssignTask = async (e: any) => {
    e.preventDefault();
    setTaskError("");
    setTaskSuccess("");
    if (!taskForm.titulo.trim() || !taskForm.descripcion.trim()) {
      setTaskError("El título y la descripción son obligatorios.");
      return;
    }

    if (taskForm.tipoAsignacion !== "todos" && taskForm.seleccionados.length === 0) {
      setTaskError("Debes seleccionar al menos un destinatario para asignar.");
      return;
    }

    setAssigningTask(true);

    try {
      const dbEmpleados = empleados;
      let targetEmpleados: any[] = [];

      switch (taskForm.tipoAsignacion) {
        case "todos":
          targetEmpleados = dbEmpleados;
          break;
        case "empleados":
          targetEmpleados = dbEmpleados.filter((emp) => taskForm.seleccionados.includes(emp.id));
          break;
        case "departamentos":
          targetEmpleados = dbEmpleados.filter(
            (emp) => emp.departamento && taskForm.seleccionados.includes(emp.departamento)
          );
          break;
        case "cargos":
          targetEmpleados = dbEmpleados.filter((emp) => emp.cargo && taskForm.seleccionados.includes(emp.cargo));
          break;
        case "sedes":
          targetEmpleados = dbEmpleados.filter((emp) => emp.sede && taskForm.seleccionados.includes(emp.sede));
          break;
        default:
          break;
      }

      if (targetEmpleados.length === 0) {
        throw new Error("No se encontraron colaboradores que coincidan con la selección.");
      }

      const prioridadPorUrgencia: Record<string, string> = {
        baja: "Baja",
        media: "Media",
        alta: "Alta",
        urgente: "Urgente",
      };
      const filas = targetEmpleados.map((emp) => ({
        empresa_id: empresaId,
        asignado_a: emp.id,
        creado_por: user?.id || null,
        titulo: taskForm.titulo.trim(),
        descripcion: taskForm.descripcion.trim(),
        prioridad: prioridadPorUrgencia[taskForm.urgencia] || "Media",
        fecha_limite: taskForm.fechaLimite || null,
        estado: "pendiente",
        datos: {
          progreso: 0,
          jefe: user?.nombre || user?.correo || "Administrador",
          depto: emp.departamento || "",
        },
      }));

      const { error: insertError } = await supabase.from("tareas").insert(filas);
      if (insertError) throw insertError;

      setTaskSuccess(`Se asignaron ${targetEmpleados.length} tareas correctamente.`);
      setTimeout(() => {
        setShowTaskModal(false);
        setTaskForm({
          tipoAsignacion: "todos",
          seleccionados: [],
          titulo: "",
          descripcion: "",
          urgencia: "media",
          fechaLimite: "",
        });
        setTaskSearch("");
        setTaskSuccess("");
      }, 1600);
    } catch (err: any) {
      setTaskError(err.message || "Ocurrió un error al asignar las tareas.");
    } finally {
      setAssigningTask(false);
    }
  };

  const handleToggleSeleccionDestinatario = (id: string) => {
    setTaskForm((prev) => {
      const exists = prev.seleccionados.includes(id);
      return {
        ...prev,
        seleccionados: exists ? prev.seleccionados.filter((s) => s !== id) : [...prev.seleccionados, id],
      };
    });
  };

  const handleSelectAllDestinatarios = () => {
    let ids: string[] = [];
    if (taskForm.tipoAsignacion === "empleados") {
      ids = destinatariosFiltrados.map((e: any) => e.id);
    } else if (taskForm.tipoAsignacion === "departamentos") {
      ids = destinatariosFiltrados;
    } else if (taskForm.tipoAsignacion === "cargos") {
      ids = destinatariosFiltrados;
    } else if (taskForm.tipoAsignacion === "sedes") {
      ids = destinatariosFiltrados;
    }
    setTaskForm((prev) => ({
      ...prev,
      seleccionados: [...new Set([...prev.seleccionados, ...ids])],
    }));
  };

  const handleClearAllDestinatarios = () => {
    setTaskForm((prev) => ({ ...prev, seleccionados: [] }));
  };

  if (!empresaId) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white p-6 shadow-3xl shadow-shadow-500 dark:bg-charcoal dark:border dark:border-charcoal-border">
        <p className="text-base font-semibold text-gray-600 dark:text-white/70">
          No se pudo determinar la empresa asociada a este usuario.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Banner de error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Toolbar Superior (sin repetir el título del Navbar) */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs font-medium text-gray-500 dark:text-white/60">
          Directorio organizacional, asignación de cargos, departamentos y control de accesos.
        </p>

        {/* Tarjeta compacta de Código de Registro */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto rounded-xl border border-brand-500/20 bg-brand-500/[0.04] px-3.5 py-1.5 shadow-2xs dark:border-brand-400/20 dark:bg-brand-500/10">
          <MdOutlineCorporateFare className="h-4 w-4 text-brand-500" />
          <span className="text-xs font-medium text-gray-500 dark:text-white/60">Código:</span>
          <span className="font-mono text-xs font-bold text-navy-700 dark:text-white">
            <CodigoEmpresaDisplay code={codigoEmpresa} />
          </span>
          <button
            type="button"
            onClick={handleCopiarCodigo}
            className="flex items-center gap-1 rounded-lg bg-white px-2 py-0.5 text-[11px] font-bold text-brand-600 shadow-2xs transition hover:bg-gray-50 active:scale-95 dark:bg-charcoal dark:text-brand-300"
            title="Copiar código"
          >
            {copiado ? <MdCheck className="h-3 w-3 text-emerald-600" /> : <MdOutlineContentCopy className="h-3 w-3" />}
            <span>{copiado ? "Copiado" : "Copiar"}</span>
          </button>
        </div>
      </div>

      {/* Grid de 4 KPIs Principales */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* KPI 1: Total Colaboradores */}
        <NexxusCard extra="p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-white/60">
              Total Colaboradores
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
              <MdOutlinePeople className="h-5 w-5" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
                {metricas.total}
              </h3>
              <span className="inline-flex items-center rounded-md bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 text-[11px] font-bold text-brand-600 dark:text-brand-300">
                Plan {plan}
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, (metricas.total / (planLimits.employees || 1)) * 100))}%`,
                }}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-white/60">
            Capacidad máxima: {planLimits.employees} plazas
          </p>
        </NexxusCard>

        {/* KPI 2: Activos vs Inactivos */}
        <NexxusCard extra="p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-white/60">
              Colaboradores Activos
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
              <MdOutlineCheckCircle className="h-5 w-5" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
                {metricas.activos}
              </h3>
              <span className="inline-flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                {metricas.total > 0 ? Math.round((metricas.activos / metricas.total) * 100) : 0}% activo
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${metricas.total > 0 ? (metricas.activos / metricas.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-white/60">
            {metricas.inactivos === 0 ? "100% operativos con acceso" : `${metricas.inactivos} inactivos`}
          </p>
        </NexxusCard>

        {/* KPI 3: Líderes & Jefes */}
        <NexxusCard extra="p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-white/60">
              Líderes y Supervisores
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
              <MdOutlineSupervisorAccount className="h-5 w-5" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
                {metricas.jefes}
              </h3>
              <span className="inline-flex items-center rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                {departamentosDistintos.length} áreas
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{
                  width: `${metricas.total > 0 ? Math.min(100, (metricas.jefes / metricas.total) * 100) : 0}%`,
                }}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-white/60">
            Jefes y líderes de departamento
          </p>
        </NexxusCard>

        {/* KPI 4: Equipo Operativo */}
        <NexxusCard extra="p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-white/60">
              Equipo Operativo
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
              <MdOutlineBadge className="h-5 w-5" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
                {metricas.operativos}
              </h3>
              <span className="inline-flex items-center rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                {sedesDistintas.length} sedes
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-purple-500 transition-all duration-500"
                style={{
                  width: `${metricas.total > 0 ? (metricas.operativos / metricas.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-white/60">
            Personal operativo distribuido
          </p>
        </NexxusCard>
      </div>

      <NexxusCard extra="p-6 flex flex-col gap-5" delay={100}>
        {/* Fila Superior: Buscador y Botones de Acción */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h4 className="text-lg font-bold tracking-tight text-navy-700 dark:text-white">
              Directorio de Colaboradores
            </h4>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-white/60">
              Gestión de expedientes, cargos reales y asignación departamental.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Buscador Rápido */}
            <div className="relative w-full sm:w-64">
              <MdOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/40" />
              <input
                type="text"
                placeholder="Buscar colaborador..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setShowTaskModal(true);
                setTaskSearch("");
              }}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-navy-700 shadow-sm transition hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
            >
              <MdOutlineAssignment className="h-4 w-4 text-brand-500" />
              <span>Asignar Tarea</span>
            </button>

            <button
              type="button"
              disabled={limiteEmpleadosAlcanzado}
              onClick={() => setShowCreatePanel(true)}
              className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
            >
              <MdOutlinePersonAdd className="h-4 w-4" />
              <span>Crear Empleado</span>
            </button>
          </div>
        </div>

        {/* Fila de Filtros Rápidos (Pestañas) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "todos", label: "Todos", count: metricas.total },
              { id: "activos", label: "Activos", count: metricas.activos },
              { id: "jefes", label: "Jefes / Líderes", count: metricas.jefes },
              { id: "operativos", label: "Operativos", count: metricas.operativos },
              { id: "inactivos", label: "Inactivos", count: metricas.inactivos },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFiltroRapido(tab.id as any)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
                  filtroRapido === tab.id
                    ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200/80 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] ${
                    filtroRapido === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-black/5 dark:bg-white/10 text-gray-500 dark:text-white/60"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Filtros Dropdowns Compactos */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-8 rounded-xl border border-gray-200 bg-gray-50/50 px-2.5 text-xs font-semibold text-gray-700 outline-none dark:border-white/10 dark:bg-charcoal dark:text-white/80"
              value={filtroDepartamento}
              onChange={(e) => setFiltroDepartamento(e.target.value)}
            >
              <option value="">Departamento: Todos</option>
              {departamentosDistintos.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              className="h-8 rounded-xl border border-gray-200 bg-gray-50/50 px-2.5 text-xs font-semibold text-gray-700 outline-none dark:border-white/10 dark:bg-charcoal dark:text-white/80"
              value={filtroCargo}
              onChange={(e) => setFiltroCargo(e.target.value)}
            >
              <option value="">Cargo: Todos</option>
              {cargosDistintos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              className="h-8 rounded-xl border border-gray-200 bg-gray-50/50 px-2.5 text-xs font-semibold text-gray-700 outline-none dark:border-white/10 dark:bg-charcoal dark:text-white/80"
              value={filtroSede}
              onChange={(e) => setFiltroSede(e.target.value)}
            >
              <option value="">Sede: Todas</option>
              {sedesDistintas.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="text-sm font-medium text-gray-500 dark:text-white/60">
              Sincronizando plantilla de colaboradores...
            </p>
          </div>
        ) : empleadosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-white/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/40">
              <MdOutlinePeople className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
              No se encontraron colaboradores
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-white/50">
              Prueba a cambiar los filtros o el término de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/5">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 dark:border-white/10 dark:bg-white/[0.02]">
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Colaborador
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Correo Electrónico
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Rol
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Cargo
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Departamento
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Sede
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Estado
                  </th>
                  <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {empleadosFiltrados.map((e) => (
                  <tr
                    key={e.id}
                    className="cursor-pointer transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                    onClick={() => setSelectedEmpleado(e)}
                  >
                    {/* Colaborador */}
                    <td className="min-w-[200px] px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar src={e.foto} name={e.nombre} size={9} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-navy-700 dark:text-white">
                            {e.nombre}
                          </p>
                          <p className="truncate text-xs text-gray-400 dark:text-white/40">
                            @{e.usuario || "sin_usuario"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Correo */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-gray-500 dark:text-white/60">
                      {e.correo || "—"}
                    </td>

                    {/* Rol */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          ROLE_BADGE[e.rol] || ROLE_BADGE.empleado
                        }`}
                      >
                        {etiquetaRol(e.rol)}
                      </span>
                    </td>

                    {/* Cargo Real */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-bold text-navy-700 dark:text-white">
                      {e.cargo}
                    </td>

                    {/* Departamento */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-gray-600 dark:text-white/70">
                      {e.departamento}
                    </td>

                    {/* Sede */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-gray-500 dark:text-white/50">
                      {e.sede}
                    </td>

                    {/* Estado */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          e.activo
                            ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                            : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/50"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            e.activo ? "bg-emerald-500" : "bg-gray-400"
                          }`}
                        />
                        {e.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-right" onClick={(ev) => ev.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedEmpleado(e)}
                        className="inline-flex items-center gap-1 rounded-xl bg-lightPrimary px-3 py-1.5 text-xs font-bold text-brand-500 shadow-sm transition hover:bg-brand-500/10 active:scale-95 dark:bg-white/5 dark:text-brand-300 dark:hover:bg-white/10"
                      >
                        <MdOutlineEdit className="h-3.5 w-3.5" />
                        <span>Ficha</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NexxusCard>

      {/* Modal Ficha del Colaborador */}
      <Modal
        isOpen={!!selectedEmpleado}
        onClose={() => setSelectedEmpleado(null)}
        title="Ficha del Colaborador"
        width="max-w-3xl"
      >
        {selectedEmpleado && editForm ? (
          <div className="flex flex-col gap-5 py-1 text-left">
            {/* Header del colaborador */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gray-50/70 p-4 border border-gray-200/70 dark:bg-white/[0.02] dark:border-white/10">
              <div className="flex items-center gap-3.5 min-w-0">
                <Avatar src={selectedEmpleado.foto} name={selectedEmpleado.nombre} size={12} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-base font-bold text-navy-700 dark:text-white">
                      {selectedEmpleado.nombre}
                    </p>
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-[10.5px] font-bold ${
                        ROLE_BADGE[selectedEmpleado.rol] || ROLE_BADGE.empleado
                      }`}
                    >
                      {etiquetaRol(selectedEmpleado.rol)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-gray-500 dark:text-white/60 mt-0.5">
                    @{selectedEmpleado.usuario || "sin_usuario"} · {selectedEmpleado.correo || "Sin correo"}
                  </p>
                </div>
              </div>

              <div className="shrink-0 self-start sm:self-auto">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    selectedEmpleado.activo
                      ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:bg-emerald-400/20 dark:text-emerald-300"
                      : "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-white/10 dark:text-white/60"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      selectedEmpleado.activo ? "bg-emerald-500" : "bg-gray-400"
                    }`}
                  />
                  {selectedEmpleado.activo ? "Cuenta Activa" : "Cuenta Pausada"}
                </span>
              </div>
            </div>

            {/* Mensaje de acción */}
            {actionMsg && (
              <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 p-3 text-xs font-semibold text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
                {actionMsg}
              </div>
            )}

            {/* Bloque 1: Datos Personales y Laborales */}
            <div>
              <p className="mb-2.5 text-xs font-bold text-gray-500 dark:text-white/60">
                Información Laboral y de Perfil
              </p>
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-white/80" htmlFor="editar-nombre">
                    Nombre Completo
                  </label>
                  <input
                    id="editar-nombre"
                    type="text"
                    value={editForm.nombre}
                    onChange={(e) => setEditForm((f: any) => ({ ...f, nombre: e.target.value }))}
                    className="mt-1.5 flex h-10 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-white/80" htmlFor="editar-correo">
                    Correo Electrónico (Login)
                  </label>
                  <input
                    id="editar-correo"
                    type="email"
                    value={editForm.correo}
                    onChange={(e) => setEditForm((f: any) => ({ ...f, correo: e.target.value }))}
                    className="mt-1.5 flex h-10 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-white/80" htmlFor="editar-usuario">
                    Usuario Interno
                  </label>
                  <input
                    id="editar-usuario"
                    type="text"
                    value={editForm.usuario}
                    onChange={(e) => setEditForm((f: any) => ({ ...f, usuario: e.target.value }))}
                    className="mt-1.5 flex h-10 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-white/80" htmlFor="editar-telefono">
                    Teléfono
                  </label>
                  <input
                    id="editar-telefono"
                    type="tel"
                    placeholder="Sin teléfono registrado"
                    value={editForm.telefono}
                    onChange={(e) => setEditForm((f: any) => ({ ...f, telefono: e.target.value }))}
                    className="mt-1.5 flex h-10 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-white/80" htmlFor="editar-cargo">
                    Cargo / Puesto
                  </label>
                  <select
                    id="editar-cargo"
                    className="mt-1.5 flex h-10 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                    value={editForm.cargo || CAMPO_VACIO}
                    onChange={(e) => setEditForm((f: any) => ({ ...f, cargo: e.target.value === CAMPO_VACIO ? "" : e.target.value }))}
                  >
                    <option value={CAMPO_VACIO}>Sin asignar</option>
                    {cargosDistintos.map((opt: string) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-white/80" htmlFor="editar-departamento">
                    Departamento
                  </label>
                  <select
                    id="editar-departamento"
                    className="mt-1.5 flex h-10 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                    value={editForm.departamento || CAMPO_VACIO}
                    onChange={(e) => setEditForm((f: any) => ({ ...f, departamento: e.target.value === CAMPO_VACIO ? "" : e.target.value }))}
                  >
                    <option value={CAMPO_VACIO}>Sin asignar</option>
                    {departamentosDistintos.map((opt: string) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-white/80" htmlFor="editar-sede">
                    Sede Asignada
                  </label>
                  <select
                    id="editar-sede"
                    className="mt-1.5 flex h-10 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                    value={editForm.sede || CAMPO_VACIO}
                    onChange={(e) => setEditForm((f: any) => ({ ...f, sede: e.target.value === CAMPO_VACIO ? "" : e.target.value }))}
                  >
                    <option value={CAMPO_VACIO}>Sin asignar</option>
                    {sedesDistintas.map((opt: string) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-white/80" htmlFor="editar-salario">
                    Salario Base ($)
                  </label>
                  <input
                    id="editar-salario"
                    type="number"
                    value={editForm.salarioBase}
                    onChange={(e) => setEditForm((f: any) => ({ ...f, salarioBase: e.target.value }))}
                    className="mt-1.5 flex h-10 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                  />
                </div>
              </div>
            </div>

            {/* Bloque 2: Credenciales & Seguridad */}
            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
              <p className="mb-3 text-xs font-bold text-navy-700 dark:text-white">
                Seguridad y Permisos de Acceso
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Cambiar Rol */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-white/80" htmlFor="editar-rol">
                    Rol Jerárquico en la Plataforma
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <select
                      id="editar-rol"
                      className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                      value={rolSeleccionado}
                      onChange={(e) => setRolSeleccionado(e.target.value)}
                    >
                      {ROLE_OPTIONS.filter((opt) => opt.value !== "super_admin").map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={busyAction === "rol" || rolSeleccionado === selectedEmpleado.rol}
                      onClick={handleCambiarRol}
                      className="shrink-0 rounded-xl bg-navy-700 hover:bg-navy-800 text-white dark:bg-white dark:text-navy-900 px-3.5 h-10 text-xs font-semibold shadow-xs transition active:scale-95 disabled:opacity-40"
                    >
                      {busyAction === "rol" ? "..." : "Actualizar"}
                    </button>
                  </div>
                </div>

                {/* Resetear Contraseña */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-white/80" htmlFor="editar-nueva-contrasena">
                    Restablecer Contraseña
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      id="editar-nueva-contrasena"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={nuevaContrasena}
                      onChange={(e) => setNuevaContrasena(e.target.value)}
                      className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                    />
                    <button
                      type="button"
                      disabled={busyAction === "password" || nuevaContrasena.trim().length < 8}
                      onClick={handleCambiarContrasena}
                      className="shrink-0 rounded-xl bg-navy-700 hover:bg-navy-800 text-white dark:bg-white dark:text-navy-900 px-3.5 h-10 text-xs font-semibold shadow-xs transition active:scale-95 disabled:opacity-40"
                    >
                      {busyAction === "password" ? "..." : "Guardar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque 3: Footer de Acciones */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busyAction === "estado"}
                  onClick={handleToggleActivo}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition active:scale-95 disabled:opacity-50 ${
                    selectedEmpleado.activo
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/20 dark:text-amber-300 hover:bg-amber-500/20"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-300 hover:bg-emerald-500/20"
                  }`}
                >
                  <span>{selectedEmpleado.activo ? "Pausar Acceso" : "Reactivar Acceso"}</span>
                </button>

                <button
                  type="button"
                  disabled={busyAction === "eliminar"}
                  onClick={handleEliminar}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/20 active:scale-95 disabled:opacity-50 dark:border-rose-400/30 dark:bg-rose-500/20 dark:text-rose-300"
                >
                  <MdOutlineDelete className="h-4 w-4" />
                  <span>Dar de Baja</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEmpleado(null)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-navy-700 shadow-2xs hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 transition-all"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  disabled={busyAction === "guardar"}
                  onClick={handleGuardarCambios}
                  className="inline-flex items-center justify-center rounded-xl bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  {busyAction === "guardar" ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={showCreatePanel}
        onClose={() => setShowCreatePanel(false)}
        title="Registrar Nuevo Colaborador"
        width="max-w-2xl"
      >
        <div className="py-2">
          <form onSubmit={handleCrearEmpleado} className="flex flex-col gap-5">
            {/* Banner Informativo y Capacidad del Plan */}
            <div className="flex items-center justify-between rounded-2xl bg-brand-500/[0.05] p-3.5 border border-brand-500/15 dark:bg-brand-500/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm shadow-brand-500/20">
                  <MdOutlinePersonAdd className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-navy-700 dark:text-white">
                    Alta Institucional en {plan}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-white/60">
                    Crea las credenciales de acceso para la aplicación web y móvil.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10.5px] font-extrabold text-brand-600 shadow-sm dark:bg-charcoal dark:text-brand-300">
                {metricas.total} / {planLimits.employees} cupos
              </span>
            </div>

            {/* SECCIÓN 1: Credenciales & Identidad */}
            <div>
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                1. Datos de Identidad & Acceso
              </p>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {/* Nombre Completo */}
                <div>
                  <label className={selectLabelClasses} htmlFor="crear-nombre">
                    Nombre Completo *
                  </label>
                  <div className="relative mt-1">
                    <MdOutlinePerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/40" />
                    <input
                      id="crear-nombre"
                      type="text"
                      placeholder="Ej. Ana Morales"
                      value={createForm.nombre}
                      onChange={(e) => handleNombreChange(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                    />
                  </div>
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label className={selectLabelClasses} htmlFor="crear-correo">
                    Correo Electrónico (Login) *
                  </label>
                  <div className="relative mt-1">
                    <MdOutlineEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/40" />
                    <input
                      id="crear-correo"
                      type="email"
                      placeholder="ana@empresa.com"
                      value={createForm.correo}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, correo: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                    />
                  </div>
                </div>

                <div>
                  <label className={selectLabelClasses} htmlFor="crear-usuario">
                    Usuario Interno
                  </label>
                  <div className="relative mt-1">
                    <MdOutlineAlternateEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/40" />
                    <input
                      id="crear-usuario"
                      type="text"
                      placeholder="ana.morales"
                      value={createForm.usuario}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, usuario: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                    />
                  </div>
                </div>

                {/* Contraseña con Generador y Toggle */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className={selectLabelClasses} htmlFor="crear-contrasena">
                      Contraseña Inicial *
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerarPassword}
                      className="flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                      <MdOutlineRefresh className="h-3.5 w-3.5" />
                      <span>Generar</span>
                    </button>
                  </div>
                  <div className="relative mt-1">
                    <MdOutlineLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/40" />
                    <input
                      id="crear-contrasena"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={createForm.contrasena}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, contrasena: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-10 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <MdOutlineVisibilityOff className="h-4 w-4" />
                      ) : (
                        <MdOutlineVisibility className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: Asignación Organizacional */}
            <div className="border-t border-gray-100 pt-4 dark:border-white/10">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                2. Asignación Organizacional & Puesto
              </p>

              {/* Selector de Rol en Pills */}
              <div className="mb-3.5">
                <label className={selectLabelClasses}>Rol Jerárquico Asignado</label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {[
                    { id: "empleado", label: "Empleado", desc: "Acceso operativo estándar" },
                    { id: "jefe", label: "Jefe de Sector", desc: "Líder con gestión de equipo" },
                    { id: "admin_empresa", label: "Administrador", desc: "Control administrativo" },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setCreateForm((prev) => ({ ...prev, rol: r.id }))}
                      className={`flex flex-col items-start rounded-xl p-2.5 text-left transition-all active:scale-95 ${
                        createForm.rol === r.id
                          ? "border border-brand-500 bg-brand-500/[0.08] shadow-sm shadow-brand-500/10 dark:border-brand-400 dark:bg-brand-500/20"
                          : "border border-gray-200 bg-gray-50/50 hover:bg-gray-100/70 dark:border-white/10 dark:bg-charcoal dark:hover:bg-white/5"
                      }`}
                    >
                      <span
                        className={`text-xs font-bold ${
                          createForm.rol === r.id
                            ? "text-brand-600 dark:text-brand-300"
                            : "text-navy-700 dark:text-white"
                        }`}
                      >
                        {r.label}
                      </span>
                      <span className="mt-0.5 text-[10px] text-gray-400 dark:text-white/50 leading-tight">
                        {r.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                {/* Cargo */}
                <div>
                  <label className={selectLabelClasses} htmlFor="crear-cargo">
                    Cargo / Puesto
                  </label>
                  <div className="relative mt-1">
                    <select
                      id="crear-cargo"
                      className={selectClasses}
                      value={createForm.cargo || CAMPO_VACIO}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          cargo: e.target.value === CAMPO_VACIO ? "" : e.target.value,
                        }))
                      }
                    >
                      <option value={CAMPO_VACIO}>Sin asignar</option>
                      {cargosDistintos.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Departamento */}
                <div>
                  <label className={selectLabelClasses} htmlFor="crear-departamento">
                    Departamento / Área
                  </label>
                  <div className="relative mt-1">
                    <select
                      id="crear-departamento"
                      className={selectClasses}
                      value={createForm.departamento || CAMPO_VACIO}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          departamento: e.target.value === CAMPO_VACIO ? "" : e.target.value,
                        }))
                      }
                    >
                      <option value={CAMPO_VACIO}>Sin asignar</option>
                      {departamentosDistintos.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sede */}
                <div>
                  <label className={selectLabelClasses} htmlFor="crear-sede">
                    Sede Asignada
                  </label>
                  <div className="relative mt-1">
                    <select
                      id="crear-sede"
                      className={selectClasses}
                      value={createForm.sede || CAMPO_VACIO}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          sede: e.target.value === CAMPO_VACIO ? "" : e.target.value,
                        }))
                      }
                    >
                      <option value={CAMPO_VACIO}>Sin asignar</option>
                      {sedesDistintas.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Error si ocurre */}
            {createError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <MdOutlineWarningAmber className="h-4 w-4 shrink-0 text-red-500" />
                <span>{createError}</span>
              </div>
            )}

            {/* Botones del Formulario */}
            <div className="mt-2 flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowCreatePanel(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100 dark:text-white dark:hover:bg-white/10"
              >
                Cancelar
              </button>
              <ActionButton
                type="submit"
                busy={creatingEmpleado}
                className="bg-brand-500 shadow-md shadow-brand-500/20 hover:bg-brand-600 dark:bg-brand-400"
              >
                <MdOutlinePersonAdd className="h-4 w-4" />
                <span>Registrar Colaborador</span>
              </ActionButton>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Asignación Masiva de Tareas"
        width="max-w-2xl"
      >
        <div className="py-2">
          {taskSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-md shadow-emerald-500/20">
                <MdOutlineCheckCircle className="h-8 w-8" />
              </div>
              <p className="mt-4 text-base font-extrabold text-navy-700 dark:text-white">{taskSuccess}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-white/60">
                Las tareas fueron asignadas y notificadas al equipo.
              </p>
            </div>
          ) : (
            <form onSubmit={handleAssignTask} className="flex flex-col gap-4">
              {taskError && (
                <div className="rounded-xl bg-red-50 p-3.5 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400 flex items-center gap-2">
                  <MdOutlineWarningAmber className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{taskError}</span>
                </div>
              )}

              {/* 1. Selector de Tipo de Destinatarios */}
              <div>
                <div className="flex items-center justify-between">
                  <label className={selectLabelClasses}>Destinatarios de la Tarea</label>
                  <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">
                    {totalDestinatariosCalculados} destinatarios calculados
                  </span>
                </div>
                <select
                  className={selectClasses}
                  value={taskForm.tipoAsignacion}
                  onChange={(e) => {
                    setTaskForm({ ...taskForm, tipoAsignacion: e.target.value, seleccionados: [] });
                    setTaskSearch("");
                  }}
                >
                  <option value="todos">Toda la empresa ({empleados.length} colaboradores)</option>
                  <option value="empleados">Colaboradores Específicos (Selección individual)</option>
                  <option value="departamentos">Por Departamento / Área</option>
                  <option value="cargos">Por Cargo / Puesto</option>
                  <option value="sedes">Por Sede de Trabajo</option>
                </select>
              </div>

              {/* 2. Caja de Selección Interactiva con Buscador */}
              {taskForm.tipoAsignacion !== "todos" && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3 dark:border-white/10 dark:bg-charcoal">
                  {/* Barra de Búsqueda y Botones de Selección Rápida */}
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1">
                      <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/40" />
                      <input
                        type="text"
                        placeholder={`Buscar ${
                          taskForm.tipoAsignacion === "empleados"
                            ? "colaborador, correo o cargo..."
                            : taskForm.tipoAsignacion === "departamentos"
                            ? "departamento..."
                            : taskForm.tipoAsignacion === "cargos"
                            ? "cargo..."
                            : "sede..."
                        }`}
                        value={taskSearch}
                        onChange={(e) => setTaskSearch(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white py-1.5 pl-8 pr-7 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white dark:focus:border-brand-400"
                      />
                      {taskSearch && (
                        <button
                          type="button"
                          onClick={() => setTaskSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                        >
                          <MdOutlineClose className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleSelectAllDestinatarios}
                        className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-navy-700 shadow-sm transition hover:bg-gray-100 active:scale-95 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                      >
                        Marcar todos
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllDestinatarios}
                        className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-gray-500 shadow-sm transition hover:bg-gray-100 active:scale-95 dark:bg-white/10 dark:text-white/60 dark:hover:bg-white/20"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>

                  {/* Lista de Selección con Checkboxes Modernos */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {destinatariosFiltrados.length === 0 ? (
                      <div className="py-6 text-center text-xs text-gray-400 dark:text-white/40">
                        No se encontraron opciones para "{taskSearch}"
                      </div>
                    ) : (
                      destinatariosFiltrados.map((item: any) => {
                        const id = typeof item === "string" ? item : item.id;
                        const isSelected = taskForm.seleccionados.includes(id);

                        return (
                          <button
                            type="button"
                            key={id}
                            onClick={() => handleToggleSeleccionDestinatario(id)}
                            className={`flex w-full cursor-pointer items-center justify-between rounded-xl p-2 text-left transition-all ${
                              isSelected
                                ? "border border-brand-500/40 bg-brand-500/[0.08] dark:border-brand-400/40 dark:bg-brand-500/15"
                                : "border border-gray-100 bg-white hover:bg-gray-50 dark:border-white/5 dark:bg-charcoal-card dark:hover:bg-white/[0.03]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Checkbox personalizado */}
                              <div
                                className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition ${
                                  isSelected
                                    ? "border-brand-500 bg-brand-500 text-white"
                                    : "border-gray-300 bg-white dark:border-white/20 dark:bg-charcoal"
                                }`}
                              >
                                {isSelected && <MdCheck className="h-3.5 w-3.5 font-black" />}
                              </div>

                              {/* Datos del elemento */}
                              {taskForm.tipoAsignacion === "empleados" ? (
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar src={item.foto} name={item.nombre} size={7} />
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-bold text-navy-700 dark:text-white">
                                      {item.nombre}
                                    </p>
                                    <p className="truncate text-[10.5px] text-gray-400 dark:text-white/40">
                                      {item.cargo} · {item.departamento}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p className="truncate text-xs font-bold text-navy-700 dark:text-white">
                                  {id}
                                </p>
                              )}
                            </div>

                            {/* Detalle secundario */}
                            {taskForm.tipoAsignacion === "empleados" && (
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  ROLE_BADGE[item.rol] || ROLE_BADGE.empleado
                                }`}
                              >
                                {etiquetaRol(item.rol)}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* 3. Título de la Tarea */}
              <InputField
                label="Título de la Tarea *"
                id="tarea-titulo"
                placeholder="Ej. Revisión mensual de indicadores clave"
                value={taskForm.titulo}
                onChange={(e) => setTaskForm({ ...taskForm, titulo: e.target.value })}
              />

              {/* 4. Descripción y Alcance */}
              <div>
                <label className={selectLabelClasses}>Descripción y Alcance *</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                  rows={3}
                  placeholder="Detalles, objetivos e instrucciones específicas para los asignados..."
                  value={taskForm.descripcion}
                  onChange={(e) => setTaskForm({ ...taskForm, descripcion: e.target.value })}
                />
              </div>

              {/* 5. Nivel de Urgencia y Fecha Límite */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={selectLabelClasses}>Nivel de Prioridad</label>
                  <div className="mt-1 grid grid-cols-4 gap-1.5">
                    {[
                      { id: "baja", label: "Baja", activeClass: "bg-emerald-500 text-white shadow-emerald-500/30" },
                      { id: "media", label: "Media", activeClass: "bg-blue-500 text-white shadow-blue-500/30" },
                      { id: "alta", label: "Alta", activeClass: "bg-amber-500 text-white shadow-amber-500/30" },
                      { id: "urgente", label: "Urgente", activeClass: "bg-red-500 text-white shadow-red-500/30" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setTaskForm({ ...taskForm, urgencia: p.id })}
                        className={`rounded-xl py-2 text-center text-xs font-bold transition-all active:scale-95 ${
                          taskForm.urgencia === p.id
                            ? `${p.activeClass} shadow-sm`
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200/80 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={selectLabelClasses}>Fecha Límite (Opcional)</label>
                  <div className="relative mt-1">
                    <input
                      type="date"
                      className={selectClasses}
                      value={taskForm.fechaLimite}
                      onChange={(e) => setTaskForm({ ...taskForm, fechaLimite: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* 6. Botones de Acción */}
              <div className="mt-3 flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100 dark:text-white dark:hover:bg-white/10"
                >
                  Cancelar
                </button>
                <ActionButton
                  type="submit"
                  busy={assigningTask}
                  className="bg-brand-500 shadow-md shadow-brand-500/20 hover:bg-brand-600 dark:bg-brand-400"
                >
                  <MdOutlineAssignment className="h-4 w-4" />
                  <span>
                    {taskForm.tipoAsignacion === "todos"
                      ? `Asignar a Toda la Empresa (${empleados.length})`
                      : `Asignar (${totalDestinatariosCalculados} colaboradores)`}
                  </span>
                </ActionButton>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}
