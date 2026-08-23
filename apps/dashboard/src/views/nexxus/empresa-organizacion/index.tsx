import { useEffect, useMemo, useState } from "react";
import { supabase } from "supabaseClient/supabaseConfig";
import {
  MdOutlineAccountTree,
  MdOutlinePeople,
  MdOutlineSupervisorAccount,
  MdOutlineCorporateFare,
  MdOutlineLocationOn,
  MdOutlineBadge,
  MdOutlineSecurity,
  MdOutlineAdd,
  MdOutlineSearch,
  MdOutlineEdit,
  MdOutlineDelete,
  MdOutlineCheckCircle,
  MdOutlineWarningAmber,
  MdOutlineTrendingUp,
  MdCheck,
  MdOutlineClose,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import InputField from "components/fields/InputField";
import Modal from "components/nexxus/Modal";
import Avatar from "components/nexxus/Avatar";
import { useAuth } from "context/AuthContext";
import { useEmpresaPlan, tieneFeature, limiteAlcanzado } from "services/planEnforcement";
import {
  subscribeDepartamentos,
  subscribeSedes,
  subscribeCargos,
  subscribeRolesPersonalizados,
  subscribeEmpleados,
  subscribeTareas,
} from "services/adminRepository";
import { etiquetaRol } from "services/saFormat";

const selectClasses =
  "mt-1 flex h-10 w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400";
const selectLabelClasses = "text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50";

const ESTADO_BADGE = {
  sinJefe: { label: "Sin Jefe", cls: "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-400/20 dark:text-amber-300" },
  sobrecarga: { label: "Sobrecarga", cls: "bg-red-500/10 text-red-600 border border-red-500/20 dark:bg-red-400/20 dark:text-red-300" },
  estable: { label: "Estable", cls: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-400/20 dark:text-emerald-300" },
};

function EstadoBadge({ estado }: { estado: string }) {
  const info = (ESTADO_BADGE as any)[estado] || ESTADO_BADGE.estable;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${info.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${estado === "sinJefe" ? "bg-amber-500" : estado === "sobrecarga" ? "bg-red-500" : "bg-emerald-500"}`} />
      {info.label}
    </span>
  );
}

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

async function logAudit({ empresaId, usuarioId, accion, detalles }: any) {
  try {
    await supabase.from("audit_logs").insert({
      empresa_id: empresaId,
      actor_id: usuarioId || null,
      accion,
      modulo: "Estructura",
      detalles,
    });
  } catch {
    // Audit extra
  }
}

export default function EstructuraOrganizativa() {
  const { user, perfil, empresaId } = useAuth();
  const { plan, planFeatures, planLimits } = useEmpresaPlan();
  const tieneJefaturas = tieneFeature(planFeatures, "leaders");
  const actor = useMemo(
    () => ({ id: user?.id || "", nombre: perfil?.nombre || user?.email || "Admin" }),
    [user, perfil]
  );

  const [departamentos, setDepartamentos] = useState<any[] | null>(null);
  const [sedes, setSedes] = useState<any[] | null>(null);
  const [cargos, setCargos] = useState<any[] | null>(null);
  const [roles, setRoles] = useState<any[] | null>(null);
  const [empleadosRaw, setEmpleadosRaw] = useState<any[] | null>(null);
  const [tareas, setTareas] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [busquedaDepto, setBusquedaDepto] = useState("");

  useEffect(() => {
    if (!empresaId) return undefined;
    const onErr = (err: any) => setError(err.message || "No se pudo conectar con Supabase.");
    const mapDocs = (setter: any) => (docs: any[]) => setter(docs.map((d) => ({ id: d.id, ...d.data() })));
    const unsubs = [
      subscribeDepartamentos(empresaId, mapDocs(setDepartamentos), onErr),
      subscribeSedes(empresaId, mapDocs(setSedes), onErr),
      subscribeCargos(empresaId, mapDocs(setCargos), onErr),
      subscribeRolesPersonalizados(empresaId, mapDocs(setRoles), onErr),
      subscribeEmpleados(empresaId, mapDocs(setEmpleadosRaw), onErr),
      subscribeTareas(empresaId, mapDocs(setTareas), onErr),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [empresaId]);

  const empleados = useMemo(() => {
    if (!empleadosRaw) return null;
    const cargoMap = Object.fromEntries((cargos || []).map((c) => [c.id, c.nombre]));
    const deptoMap = Object.fromEntries((departamentos || []).map((d) => [d.id, d.nombre]));
    const sedeMap = Object.fromEntries((sedes || []).map((s) => [s.id, s.nombre]));
    return empleadosRaw.map((u) => ({
      ...u,
      cargo: cargoMap[u.cargo_id] || u.cargo || "",
      departamento: deptoMap[u.departamento_id] || u.departamento || "",
      sede: sedeMap[u.sede_id] || u.sede || "Sede Principal",
      activo: u.estado_activo !== false && u.activo !== false,
      eliminado: u.eliminado === true,
    })).filter((e) => !e.eliminado);
  }, [empleadosRaw, cargos, departamentos, sedes]);

  // Departamentos enriquecidos con métricas reales y resolución de jefes
  const departamentosEnriquecidos = useMemo(() => {
    if (!departamentos || !empleados) return [];
    const sedeMap = Object.fromEntries((sedes || []).map((s) => [s.id, s.nombre]));

    return departamentos.map((dep) => {
      const nombreDep = (dep.nombre || "").trim().toLowerCase();
      const usuariosDepto = empleados.filter(
        (u) => (u.departamento || "").trim().toLowerCase() === nombreDep && nombreDep !== ""
      );
      const activos = usuariosDepto.filter((u) => u.activo !== false);
      const jefes = usuariosDepto.filter((u) => u.rol === "jefe" || u.rol === "admin_empresa");
      
      const tareasDepto = (tareas || []).filter((t) => {
        const tDep = (t.datos?.depto || "").trim().toLowerCase();
        return tDep === nombreDep && nombreDep !== "";
      });
      const pendientes = tareasDepto.filter((t) => t.estado === "pendiente").length;
      const completadas = tareasDepto.filter((t) => t.estado === "completada" || t.estado === "done").length;
      const totalTareas = tareasDepto.length;
      const productividad = totalTareas > 0 ? Math.round((completadas / totalTareas) * 100) : 100;
      const plazas = Math.max(usuariosDepto.length, 1);
      const cobertura = plazas > 0 ? Math.round((activos.length / plazas) * 100) : 0;

      // Resolver Jefe
      let jefeNombre = dep.jefe_nombre || "";
      let jefeFoto = "";
      let jefeId = dep.jefe_id || "";

      if (!jefeNombre && jefes.length > 0) {
        jefeNombre = jefes[0].nombre;
        jefeFoto = jefes[0].foto_perfil || jefes[0].foto || "";
        jefeId = jefes[0].id;
      } else if (jefeId) {
        const jFound = empleados.find((e) => e.id === jefeId);
        if (jFound) {
          jefeNombre = jFound.nombre;
          jefeFoto = jFound.foto_perfil || jFound.foto || "";
        }
      }

      let estado = "estable";
      if (!jefeNombre && !jefeId) estado = "sinJefe";
      else if (cobertura > 100) estado = "sobrecarga";

      const sedeNombre = dep.sede_nombre || sedeMap[dep.sede_id] || (usuariosDepto[0]?.sede || "Sede Principal");

      return {
        ...dep,
        jefeId,
        jefeNombre: jefeNombre || "Sin asignar",
        jefeFoto,
        sedeNombre,
        usuariosDepto,
        activosCount: activos.length,
        jefesCount: jefes.length,
        tareasDepto,
        pendientes,
        completadas,
        productividad,
        plazas,
        cobertura,
        estado,
        sectores: dep.sectores || [],
      };
    });
  }, [departamentos, empleados, tareas, sedes]);

  const kpis = useMemo(() => {
    const totalEmpleados = (empleados || []).length;
    const totalDepartamentos = (departamentos || []).length;
    const totalSedes = (sedes || []).length;
    const totalCargos = (cargos || []).length;
    const totalJefes = (empleados || []).filter((e) => e.rol === "jefe").length;
    const sinJefe = departamentosEnriquecidos.filter((d) => d.estado === "sinJefe").length;
    const productividadGlobal = departamentosEnriquecidos.length
      ? Math.round(
          departamentosEnriquecidos.reduce((s, d) => s + d.productividad, 0) /
            departamentosEnriquecidos.length
        )
      : 0;

    return {
      totalEmpleados,
      totalDepartamentos,
      totalSedes,
      totalCargos,
      totalJefes,
      sinJefe,
      productividadGlobal,
    };
  }, [empleados, departamentos, sedes, cargos, departamentosEnriquecidos]);

  const deptoNombrePorId = useMemo(
    () => Object.fromEntries((departamentos || []).map((d) => [d.id, d.nombre])),
    [departamentos]
  );

  const opcionesDepartamentos = useMemo(
    () => [
      { value: "", label: "Sin departamento" },
      ...(departamentos || []).map((d) => ({ value: d.id, label: d.nombre })),
    ],
    [departamentos]
  );

  const jefesDisponibles = useMemo(
    () => (empleados || []).filter((u) => u.rol === "jefe" || u.rol === "admin_empresa" || u.rol === "admin"),
    [empleados]
  );

  // --- Departamentos: crear ---
  const [showCreateDept, setShowCreateDept] = useState(false);
  const [createDeptForm, setCreateDeptForm] = useState({ nombre: "", sedeId: "", jefeId: "" });
  const [creatingDept, setCreatingDept] = useState(false);
  const [createDeptError, setCreateDeptError] = useState("");

  const limiteDepartamentosAlcanzado = limiteAlcanzado((departamentos || []).length, planLimits.departments);

  const handleCrearDepartamento = async (e: any) => {
    e.preventDefault();
    if (limiteDepartamentosAlcanzado) {
      setCreateDeptError(`Tu plan ${plan} permite hasta ${planLimits.departments} departamentos. Actualiza de plan para agregar más.`);
      return;
    }
    if (!createDeptForm.nombre.trim()) {
      setCreateDeptError("El nombre es obligatorio.");
      return;
    }
    setCreatingDept(true);
    setCreateDeptError("");
    try {
      // "departamentos" no tiene columnas sede_nombre/jefe_nombre (solo sede_id/jefe_id, FKs
      // reales) -- mandarlas hacía fallar el insert completo con "column not found". Los nombres
      // se resuelven por lookup al leer (ver departamentosEnriquecidos más abajo), igual que el
      // resto del módulo; jefeObj/sedeObj ya no hacen falta aquí.
      const { error: insertError } = await supabase.from("departamentos").insert({
        empresa_id: empresaId,
        nombre: createDeptForm.nombre.trim(),
        sede_id: createDeptForm.sedeId || null,
        jefe_id: createDeptForm.jefeId || null,
      });
      if (insertError) throw insertError;
      await logAudit({
        empresaId,
        usuarioId: actor.id,
        accion: "Crear departamento",
        detalles: createDeptForm.nombre.trim(),
      });
      setCreateDeptForm({ nombre: "", sedeId: "", jefeId: "" });
      setShowCreateDept(false);
    } catch (err: any) {
      setCreateDeptError(err.message || "No se pudo crear el departamento.");
    } finally {
      setCreatingDept(false);
    }
  };

  // --- Departamentos: detalle / editar / eliminar ---
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [deptEditMode, setDeptEditMode] = useState(false);
  const [deptEditForm, setDeptEditForm] = useState({ nombre: "", sedeId: "", jefeId: "" });
  const [savingDept, setSavingDept] = useState(false);
  const [saveDeptError, setSaveDeptError] = useState("");
  const [deptBusy, setDeptBusy] = useState(false);
  const [deptActionError, setDeptActionError] = useState("");

  const selectedDept = useMemo(
    () => departamentosEnriquecidos.find((d) => d.id === selectedDeptId) || null,
    [departamentosEnriquecidos, selectedDeptId]
  );

  useEffect(() => {
    if (selectedDept) {
      setDeptEditForm({
        nombre: selectedDept.nombre || "",
        sedeId: selectedDept.sedeId || "",
        jefeId: selectedDept.jefeId || "",
      });
      setDeptEditMode(false);
      setDeptActionError("");
    }
  }, [selectedDept]);

  const handleGuardarDepartamento = async (e: any) => {
    e.preventDefault();
    if (!selectedDept) return;
    setSavingDept(true);
    setSaveDeptError("");
    try {
      // Mismo motivo que en handleCrearDepartamento: sede_nombre/jefe_nombre no son columnas reales.
      const { error: updateError } = await supabase
        .from("departamentos")
        .update({
          nombre: deptEditForm.nombre.trim(),
          sede_id: deptEditForm.sedeId || null,
          jefe_id: deptEditForm.jefeId || null,
        })
        .eq("id", selectedDept.id);
      if (updateError) throw updateError;
      await logAudit({
        empresaId,
        usuarioId: actor.id,
        accion: "Editar departamento",
        detalles: deptEditForm.nombre.trim(),
      });
      setDeptEditMode(false);
    } catch (err: any) {
      setSaveDeptError(err.message || "No se pudo guardar el departamento.");
    } finally {
      setSavingDept(false);
    }
  };

  const handleEliminarDepartamento = async () => {
    if (!selectedDept) return;
    if (!window.confirm(`¿Eliminar el departamento "${selectedDept.nombre}"? Esta acción no se puede deshacer.`))
      return;
    setDeptBusy(true);
    setDeptActionError("");
    try {
      const { error: deleteError } = await supabase.from("departamentos").delete().eq("id", selectedDept.id);
      if (deleteError) throw deleteError;
      await logAudit({
        empresaId,
        usuarioId: actor.id,
        accion: "Eliminar departamento",
        detalles: selectedDept.nombre,
      });
      setSelectedDeptId(null);
    } catch (err: any) {
      setDeptActionError(err.message || "No se pudo eliminar el departamento.");
    } finally {
      setDeptBusy(false);
    }
  };

  const departamentosFiltrados = useMemo(() => {
    const q = busquedaDepto.toLowerCase().trim();
    if (!q) return departamentosEnriquecidos;
    return departamentosEnriquecidos.filter(
      (d) =>
        d.nombre.toLowerCase().includes(q) ||
        d.sedeNombre.toLowerCase().includes(q) ||
        d.jefeNombre.toLowerCase().includes(q)
    );
  }, [departamentosEnriquecidos, busquedaDepto]);

  const cargando = departamentos === null || sedes === null || cargos === null || roles === null || empleados === null;

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

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
            Estructura Organizacional
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-white/60">
            Organigrama corporativo, gestión de departamentos, sedes operativas y jerarquías de liderazgo.
          </p>
        </div>

        <button
          type="button"
          disabled={limiteDepartamentosAlcanzado}
          onClick={() => setShowCreateDept(true)}
          className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
        >
          <MdOutlineAdd className="h-4 w-4" />
          <span>Crear Departamento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Departamentos
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                {kpis.totalDepartamentos}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
              <MdOutlineAccountTree className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Límite del plan: {planLimits.departments}</span>
            <span className="font-bold text-brand-500">Plan {plan}</span>
          </div>
        </NexxusCard>

        {/* Total Empleados */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Total Plantilla
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                {kpis.totalEmpleados}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
              <MdOutlinePeople className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              100% distribuidos
            </span>
            <span>{kpis.totalCargos} cargos</span>
          </div>
        </NexxusCard>

        {/* Líderes & Jefaturas */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Liderazgo & Jefes
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                {kpis.totalJefes}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
              <MdOutlineSupervisorAccount className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>{kpis.sinJefe > 0 ? `${kpis.sinJefe} sin jefe asignado` : "Cobertura completa"}</span>
            <span className={kpis.sinJefe > 0 ? "font-bold text-amber-600" : "font-bold text-emerald-600"}>
              {kpis.sinJefe > 0 ? "Atención" : "Óptimo"}
            </span>
          </div>
        </NexxusCard>

        {/* Sedes & Ubicaciones */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Sedes de Trabajo
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                {kpis.totalSedes}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
              <MdOutlineCorporateFare className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Puntos de operación</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">Activas</span>
          </div>
        </NexxusCard>
      </div>

      <NexxusCard extra="p-6 flex flex-col gap-5" delay={100}>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h4 className="text-xl font-bold tracking-tight text-navy-700 dark:text-white">
              Departamentos y Liderazgo
            </h4>
            <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-white/60">
              Mostrando {departamentosFiltrados.length} áreas registradas y niveles de cobertura.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <MdOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/40" />
              <input
                type="text"
                placeholder="Buscar departamento o jefe..."
                value={busquedaDepto}
                onChange={(e) => setBusquedaDepto(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
              />
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="text-sm font-medium text-gray-500 dark:text-white/60">
              Cargando departamentos...
            </p>
          </div>
        ) : departamentosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-white/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/40">
              <MdOutlineAccountTree className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
              No se encontraron departamentos
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-white/50">
              {busquedaDepto ? "Prueba con otro término de búsqueda." : "Crea tu primer departamento para estructurar tu empresa."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/5">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 dark:border-white/10 dark:bg-white/[0.02]">
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Departamento
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Sede
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Líder / Jefe
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Colaboradores
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Cobertura
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Estado
                  </th>
                  <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {departamentosFiltrados.map((dep) => (
                  <tr
                    key={dep.id}
                    className="cursor-pointer transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                    onClick={() => setSelectedDeptId(dep.id)}
                  >
                    {/* Departamento */}
                    <td className="min-w-[180px] px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
                          <MdOutlineAccountTree className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy-700 dark:text-white">
                            {dep.nombre}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-white/40">
                            {dep.activosCount} asignados
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Sede */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-gray-600 dark:text-white/70">
                      {dep.sedeNombre || "Sede Principal"}
                    </td>

                    {/* Jefe */}
                    <td className="min-w-[180px] px-4 py-3.5">
                      {dep.jefeNombre !== "Sin asignar" ? (
                        <div className="flex items-center gap-2.5">
                          <Avatar src={dep.jefeFoto} name={dep.jefeNombre} size={7} />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-navy-700 dark:text-white">
                              {dep.jefeNombre}
                            </p>
                            <p className="truncate text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                              Líder de Área
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          Sin asignar
                        </span>
                      )}
                    </td>

                    {/* Headcount */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-navy-700 dark:text-white">
                          {dep.activosCount} / {dep.plazas}
                        </span>
                      </div>
                    </td>

                    {/* Cobertura */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                          <div
                            className={`h-full rounded-full ${
                              dep.cobertura >= 100 ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(dep.cobertura, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-600 dark:text-white/70">
                          {dep.cobertura}%
                        </span>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <EstadoBadge estado={dep.estado} />
                    </td>

                    {/* Acciones */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedDeptId(dep.id)}
                        className="inline-flex items-center gap-1 rounded-xl bg-lightPrimary px-3 py-1.5 text-xs font-bold text-brand-500 shadow-sm transition hover:bg-brand-500/10 active:scale-95 dark:bg-white/5 dark:text-brand-300 dark:hover:bg-white/10"
                      >
                        <MdOutlineEdit className="h-3.5 w-3.5" />
                        <span>Gestionar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NexxusCard>

      <Modal
        isOpen={showCreateDept}
        onClose={() => setShowCreateDept(false)}
        title="Crear Nuevo Departamento"
        width="max-w-xl"
      >
        <div className="py-2">
          <form onSubmit={handleCrearDepartamento} className="flex flex-col gap-4">
            <div>
              <label className={selectLabelClasses} htmlFor="crear-depto-nombre">
                Nombre del Departamento *
              </label>
              <input
                id="crear-depto-nombre"
                type="text"
                placeholder="Ej. Recursos Humanos, Innovación..."
                value={createDeptForm.nombre}
                onChange={(e) => setCreateDeptForm((f) => ({ ...f, nombre: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="crear-depto-sede" className={selectLabelClasses}>
                  Sede de Operación
                </label>
                <select
                  id="crear-depto-sede"
                  value={createDeptForm.sedeId}
                  onChange={(e) => setCreateDeptForm((f) => ({ ...f, sedeId: e.target.value }))}
                  className={selectClasses}
                >
                  <option value="">Sin sede específica</option>
                  {(sedes || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="crear-depto-jefe" className={selectLabelClasses}>
                  Líder / Jefe de Área
                </label>
                <select
                  id="crear-depto-jefe"
                  value={createDeptForm.jefeId}
                  onChange={(e) => setCreateDeptForm((f) => ({ ...f, jefeId: e.target.value }))}
                  className={selectClasses}
                  disabled={!tieneJefaturas}
                  title={!tieneJefaturas ? "Las jefaturas están disponibles desde el plan Business." : undefined}
                >
                  <option value="">Sin asignar</option>
                  {tieneJefaturas
                    ? jefesDisponibles.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.nombre} ({etiquetaRol(j.rol)})
                        </option>
                      ))
                    : null}
                </select>
                {!tieneJefaturas ? (
                  <p className="mt-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    Disponible desde el plan Business.
                  </p>
                ) : null}
              </div>
            </div>

            {createDeptError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <MdOutlineWarningAmber className="h-4 w-4 shrink-0 text-red-500" />
                <span>{createDeptError}</span>
              </div>
            )}

            <div className="mt-3 flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowCreateDept(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100 dark:text-white dark:hover:bg-white/10"
              >
                Cancelar
              </button>
              <ActionButton
                type="submit"
                busy={creatingDept}
                className="bg-brand-500 shadow-md shadow-brand-500/20 hover:bg-brand-600 dark:bg-brand-400"
              >
                <MdOutlineAdd className="h-4 w-4" />
                <span>Crear Departamento</span>
              </ActionButton>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedDept}
        onClose={() => setSelectedDeptId(null)}
        title={selectedDept?.nombre || "Detalle del Departamento"}
        width="max-w-2xl"
      >
        {selectedDept ? (
          <div className="flex flex-col gap-5 py-2">
            {/* Header del departamento */}
            <div className="flex items-center justify-between rounded-2xl bg-brand-500/[0.06] p-4 dark:bg-brand-500/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/20">
                  <MdOutlineAccountTree className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-navy-700 dark:text-white">
                    {selectedDept.nombre}
                  </p>
                  <p className="truncate text-xs font-medium text-gray-500 dark:text-white/60">
                    Sede: {selectedDept.sedeNombre || "Sede Principal"} · Líder: {selectedDept.jefeNombre || "Sin asignar"}
                  </p>
                </div>
              </div>

              <EstadoBadge estado={selectedDept.estado} />
            </div>

            {/* Grid Bento de Métricas */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-white/5 dark:bg-charcoal">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                  Colaboradores
                </p>
                <p className="mt-1 text-base font-black text-navy-700 dark:text-white">
                  {selectedDept.activosCount} / {selectedDept.plazas}
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-white/5 dark:bg-charcoal">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                  Cobertura
                </p>
                <p className="mt-1 text-base font-black text-navy-700 dark:text-white">
                  {selectedDept.cobertura}%
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-white/5 dark:bg-charcoal">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                  Tareas Depto
                </p>
                <p className="mt-1 text-base font-black text-navy-700 dark:text-white">
                  {selectedDept.pendientes} pend.
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-white/5 dark:bg-charcoal">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                  Productividad
                </p>
                <p className="mt-1 text-base font-black text-navy-700 dark:text-white">
                  {selectedDept.productividad}%
                </p>
              </div>
            </div>

            {/* Formulario de Edición o Acciones */}
            {deptEditMode ? (
              <form onSubmit={handleGuardarDepartamento} className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 dark:border-white/10">
                <p className="text-xs font-bold text-navy-700 dark:text-white">Editar Departamento</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className={selectLabelClasses} htmlFor="edit-depto-nombre">Nombre</label>
                    <input
                      id="edit-depto-nombre"
                      type="text"
                      value={deptEditForm.nombre}
                      onChange={(e) => setDeptEditForm((f) => ({ ...f, nombre: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white py-2 px-3 text-xs font-semibold text-navy-700 outline-none dark:border-white/10 dark:bg-charcoal dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-depto-sede" className={selectLabelClasses}>Sede</label>
                    <select
                      id="edit-depto-sede"
                      value={deptEditForm.sedeId}
                      onChange={(e) => setDeptEditForm((f) => ({ ...f, sedeId: e.target.value }))}
                      className={selectClasses}
                    >
                      <option value="">Sin sede</option>
                      {(sedes || []).map((s) => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit-depto-jefe" className={selectLabelClasses}>Jefe</label>
                    <select
                      id="edit-depto-jefe"
                      value={deptEditForm.jefeId}
                      onChange={(e) => setDeptEditForm((f) => ({ ...f, jefeId: e.target.value }))}
                      className={selectClasses}
                    >
                      <option value="">Sin asignar</option>
                      {jefesDisponibles.map((j) => (
                        <option key={j.id} value={j.id}>{j.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {saveDeptError && (
                  <p className="text-xs font-bold text-red-500">{saveDeptError}</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeptEditMode(false)}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-gray-600 dark:text-white/70"
                  >
                    Cancelar
                  </button>
                  <ActionButton type="submit" busy={savingDept} className="bg-brand-500">
                    Guardar Cambios
                  </ActionButton>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDeptEditMode(true)}
                    className="inline-flex items-center gap-1 rounded-xl bg-lightPrimary px-4 py-2 text-xs font-bold text-brand-500 transition hover:bg-brand-500/10 dark:bg-white/5 dark:text-brand-300"
                  >
                    <MdOutlineEdit className="h-4 w-4" />
                    <span>Editar</span>
                  </button>
                  <ActionButton
                    busy={deptBusy}
                    onClick={handleEliminarDepartamento}
                    className="bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                  >
                    <MdOutlineDelete className="h-4 w-4" />
                    <span>Eliminar</span>
                  </ActionButton>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDeptId(null)}
                  className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Sedes */}
        <CatalogCard
          title="Sedes de Trabajo"
          icon={MdOutlineLocationOn}
          coleccion="sedes"
          empresaId={empresaId}
          actor={actor}
          items={sedes || []}
          limite={planLimits.branches}
          fields={[
            { key: "nombre", label: "Nombre de Sede *" },
            { key: "direccion", label: "Dirección / Ubicación" },
          ]}
          buildRow={(item: any) => ({
            id: item.id,
            nombreLabel: item.nombre || "Sede Principal",
            direccionLabel: item.direccion || "—",
            empleadosLabel: (empleados || []).filter((u) => u.sede_id === item.id || u.sede === item.nombre).length,
          })}
          emptyMessage="Aún no hay sedes registradas."
        />

        {/* Cargos */}
        <CatalogCard
          title="Cargos y Puestos"
          icon={MdOutlineBadge}
          coleccion="cargos"
          nombreColumn="titulo"
          empresaId={empresaId}
          actor={actor}
          items={cargos || []}
          fields={[
            { key: "titulo", label: "Título del Cargo *" },
            { key: "departamento_id", label: "Departamento", type: "select", options: opcionesDepartamentos },
          ]}
          buildRow={(item: any) => ({
            id: item.id,
            nombreLabel: item.titulo || item.nombre || "—",
            departamentoLabel: deptoNombrePorId[item.departamento_id] || "General",
            empleadosLabel: (empleados || []).filter((u) => u.cargo_id === item.id || u.cargo === item.titulo || u.cargo === item.nombre).length,
          })}
          emptyMessage="Aún no hay cargos registrados."
        />

        <CatalogCard
          title="Roles Personalizados"
          icon={MdOutlineSecurity}
          coleccion="roles_personalizados"
          empresaId={empresaId}
          actor={actor}
          items={roles || []}
          fields={[
            { key: "nombre", label: "Nombre del Rol *" },
            { key: "descripcion", label: "Descripción y Permisos" },
          ]}
          buildRow={(item: any) => ({
            id: item.id,
            nombreLabel: item.nombre || "—",
            descripcionLabel: item.descripcion || "—",
            empleadosLabel: (empleados || []).filter((u) => u.rol === item.nombre).length,
          })}
          emptyMessage="Aún no hay roles personalizados."
        />
      </div>
    </div>
  );
}

// Componente Tarjeta de Catálogo Profesional (Sedes, Cargos, Roles)
function CatalogCard({
  title,
  icon: Icon,
  coleccion,
  nombreColumn = "nombre",
  empresaId,
  actor,
  items,
  fields,
  buildRow,
  emptyMessage,
  limite = null,
}: any) {
  const limiteAlcanzadoAqui = typeof limite === "number" && items.length >= limite;
  const emptyForm = () => Object.fromEntries(fields.map((f: any) => [f.key, ""]));

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const selected = useMemo(() => items.find((it: any) => it.id === selectedId) || null, [items, selectedId]);

  useEffect(() => {
    if (selected) {
      const form: any = {};
      fields.forEach((f: any) => {
        const value = selected[f.key];
        form[f.key] = value || "";
      });
      setEditForm(form);
      setEditMode(false);
      setActionError("");
    }
  }, [selected]);

  const toPayload = (form: any) => {
    const payload: any = {};
    fields.forEach((f: any) => {
      if (f.type === "select") {
        payload[f.key] = form[f.key] || null;
      } else {
        payload[f.key] = form[f.key].trim();
      }
    });
    return payload;
  };

  const handleCrear = async (e: any) => {
    e.preventDefault();
    if (limiteAlcanzadoAqui) {
      setCreateError(`Tu plan permite hasta ${limite} ${title.toLowerCase()}.`);
      return;
    }
    if (!createForm[nombreColumn]?.trim()) {
      setCreateError("El nombre es obligatorio.");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const { error: insertError } = await supabase.from(coleccion).insert({
        empresa_id: empresaId,
        ...toPayload(createForm),
      });
      if (insertError) throw insertError;
      await logAudit({
        empresaId,
        usuarioId: actor.id,
        accion: `Crear ${title.toLowerCase()}`,
        detalles: createForm[nombreColumn].trim(),
      });
      setCreateForm(emptyForm());
      setShowCreate(false);
    } catch (err: any) {
      setCreateError(err.message || `No se pudo crear el registro.`);
    } finally {
      setCreating(false);
    }
  };

  const handleGuardar = async (e: any) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setSaveError("");
    try {
      const { error: updateError } = await supabase.from(coleccion).update(toPayload(editForm)).eq("id", selected.id);
      if (updateError) throw updateError;
      await logAudit({
        empresaId,
        usuarioId: actor.id,
        accion: `Editar ${title.toLowerCase()}`,
        detalles: editForm[nombreColumn] || "",
      });
      setEditMode(false);
    } catch (err: any) {
      setSaveError(err.message || "No se pudo guardar el registro.");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!selected) return;
    if (!window.confirm(`¿Eliminar "${selected[nombreColumn]}"? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    setActionError("");
    try {
      const { error: deleteError } = await supabase.from(coleccion).delete().eq("id", selected.id);
      if (deleteError) throw deleteError;
      await logAudit({
        empresaId,
        usuarioId: actor.id,
        accion: `Eliminar ${title.toLowerCase()}`,
        detalles: selected[nombreColumn],
      });
      setSelectedId(null);
    } catch (err: any) {
      setActionError(err.message || "No se pudo eliminar el registro.");
    } finally {
      setBusy(false);
    }
  };

  const filas = items.map(buildRow);

  return (
    <NexxusCard extra="p-5 flex flex-col justify-between" delay={150}>
      <div>
        {/* Cabecera de la Tarjeta */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy-700 dark:text-white">{title}</h3>
              <p className="text-[11px] font-medium text-gray-400 dark:text-white/40">{filas.length} registrados</p>
            </div>
          </div>

          <button
            type="button"
            disabled={limiteAlcanzadoAqui}
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1 rounded-xl bg-lightPrimary px-3 py-1.5 text-xs font-bold text-brand-500 shadow-sm transition hover:bg-brand-500/10 active:scale-95 disabled:opacity-40 dark:bg-white/5 dark:text-brand-300 dark:hover:bg-white/10"
          >
            <MdOutlineAdd className="h-3.5 w-3.5" />
            <span>Nuevo</span>
          </button>
        </div>

        {/* Lista de Elementos */}
        <div className="mt-3 divide-y divide-gray-100 dark:divide-white/5 max-h-72 overflow-y-auto">
          {filas.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 dark:text-white/40">{emptyMessage}</div>
          ) : (
            filas.map((r: any) => (
              <button
                type="button"
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className="flex w-full cursor-pointer items-center justify-between rounded-xl px-1.5 py-2.5 text-left transition hover:bg-gray-50/80 dark:hover:bg-white/[0.03]"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="truncate text-xs font-bold text-navy-700 dark:text-white">{r.nombreLabel}</p>
                  <p className="truncate text-[10.5px] text-gray-400 dark:text-white/50">
                    {r.direccionLabel || r.departamentoLabel || r.descripcionLabel || "—"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-white/10 dark:text-white/60">
                  {r.empleadosLabel} emp.
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Modal Crear */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title={`Nuevo registro: ${title}`}
        width="max-w-md"
      >
        <div className="py-2">
          <form onSubmit={handleCrear} className="flex flex-col gap-3.5">
            {fields.map((f: any) =>
              f.type === "select" ? (
                <div key={f.key}>
                  <label className={selectLabelClasses}>{f.label}</label>
                  <select
                    value={createForm[f.key]}
                    onChange={(e) => setCreateForm((form: any) => ({ ...form, [f.key]: e.target.value }))}
                    className={selectClasses}
                  >
                    {(f.options || []).map((opt: any) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div key={f.key}>
                  <label className={selectLabelClasses}>{f.label}</label>
                  <input
                    type="text"
                    value={createForm[f.key]}
                    onChange={(e) => setCreateForm((form: any) => ({ ...form, [f.key]: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                  />
                </div>
              )
            )}

            {createError && <p className="text-xs font-bold text-red-500">{createError}</p>}

            <div className="mt-2 flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-gray-700 dark:text-white"
              >
                Cancelar
              </button>
              <ActionButton type="submit" busy={creating} className="bg-brand-500">
                Guardar
              </ActionButton>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal Detalle / Editar */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected?.[nombreColumn] || "Detalle"}
        width="max-w-md"
      >
        {selected ? (
          <div className="py-2">
            {!editMode ? (
              <div className="flex flex-col gap-3">
                <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-white/[0.03]">
                  <p className="text-xs font-bold uppercase text-gray-400 dark:text-white/40">Nombre</p>
                  <p className="text-sm font-black text-navy-700 dark:text-white">{selected[nombreColumn]}</p>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      className="inline-flex items-center gap-1 rounded-xl bg-lightPrimary px-3 py-1.5 text-xs font-bold text-brand-500 dark:bg-white/5 dark:text-brand-300"
                    >
                      <MdOutlineEdit className="h-3.5 w-3.5" />
                      <span>Editar</span>
                    </button>
                    <ActionButton busy={busy} onClick={handleEliminar} className="bg-rose-500 hover:bg-rose-600">
                      <MdOutlineDelete className="h-3.5 w-3.5" />
                      <span>Eliminar</span>
                    </ActionButton>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="rounded-xl bg-gray-100 px-4 py-1.5 text-xs font-bold text-gray-700 dark:bg-white/10 dark:text-white"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGuardar} className="flex flex-col gap-3">
                {fields.map((f: any) =>
                  f.type === "select" ? (
                    <div key={f.key}>
                      <label className={selectLabelClasses}>{f.label}</label>
                      <select
                        value={editForm[f.key]}
                        onChange={(e) => setEditForm((form: any) => ({ ...form, [f.key]: e.target.value }))}
                        className={selectClasses}
                      >
                        {(f.options || []).map((opt: any) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div key={f.key}>
                      <label className={selectLabelClasses}>{f.label}</label>
                      <input
                        type="text"
                        value={editForm[f.key]}
                        onChange={(e) => setEditForm((form: any) => ({ ...form, [f.key]: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-gray-200 bg-white py-2 px-3 text-xs font-semibold text-navy-700 outline-none dark:border-white/10 dark:bg-charcoal dark:text-white"
                      />
                    </div>
                  )
                )}

                {saveError && <p className="text-xs font-bold text-red-500">{saveError}</p>}

                <div className="flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="rounded-xl px-4 py-1.5 text-xs font-bold text-gray-600 dark:text-white/70"
                  >
                    Cancelar
                  </button>
                  <ActionButton type="submit" busy={saving} className="bg-brand-500">
                    Guardar
                  </ActionButton>
                </div>
              </form>
            )}
          </div>
        ) : null}
      </Modal>
    </NexxusCard>
  );
}
