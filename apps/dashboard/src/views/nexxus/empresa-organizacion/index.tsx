import { useEffect, useMemo, useState } from "react";
import { supabase } from "supabaseClient/supabaseConfig";
import {
  MdOutlineAccountTree,
  MdOutlinePeople,
  MdOutlineWarningAmber,
  MdOutlineTrendingUp,
  MdOutlineApartment,
  MdAdd,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import NexxusWidget from "views/nexxus/components/NexxusWidget";
import DataTable from "views/nexxus/components/DataTable";
import InputField from "components/fields/InputField";
import Modal from "components/nexxus/Modal";
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
import { columnsDepartamentos, columnsSedes, columnsCargos, columnsRoles } from "./columns";

const selectClasses =
  "mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:!border-white/10 dark:text-white dark:bg-charcoal";
const selectLabelClasses = "ml-3 text-sm font-bold text-navy-700 dark:text-white";

const ESTADO_BADGE = {
  sinJefe: { label: "Sin jefe", cls: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400" },
  sobrecarga: { label: "Sobrecarga", cls: "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-400" },
  estable: { label: "Estable", cls: "bg-green-50 text-green-600 dark:bg-green-400/10 dark:text-green-400" },
};

function EstadoBadge({ estado }) {
  const info = ESTADO_BADGE[estado] || ESTADO_BADGE.estable;
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-bold ${info.cls}`}>{info.label}</span>
  );
}

const ActionButton = ({ children, className = "", busy, ...rest }) => (
  <button
    type="button"
    disabled={busy}
    className={`rounded-xl px-4 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...rest}
  >
    {busy ? "..." : children}
  </button>
);

async function logAudit({ empresaId, usuarioId, accion, detalles }) {
  try {
    await supabase.from("audit_logs").insert({
      empresa_id: empresaId,
      actor_id: usuarioId || null,
      accion,
      modulo: "Estructura",
      detalles,
    });
  } catch {
    // El log de auditoría es un extra; nunca debe romper la operación principal.
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

  const [departamentos, setDepartamentos] = useState(null);
  const [sedes, setSedes] = useState(null);
  const [cargos, setCargos] = useState(null);
  const [roles, setRoles] = useState(null);
  const [empleadosRaw, setEmpleadosRaw] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!empresaId) return undefined;
    const onErr = (err) => setError(err.message || "No se pudo conectar con Supabase.");
    const mapDocs = (setter) => (docs) => setter(docs.map((d) => ({ id: d.id, ...d.data() })));
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

  // Las filas de "usuarios" en Supabase solo traen *_id (cargo_id, departamento_id,
  // sede_id) -- a diferencia de Firestore, no hay nombre denormalizado. Se resuelve
  // aqui una sola vez contra los catalogos ya cargados.
  const empleados = useMemo(() => {
    if (!empleadosRaw) return null;
    const cargoMap = Object.fromEntries((cargos || []).map((c) => [c.id, c.nombre]));
    const deptoMap = Object.fromEntries((departamentos || []).map((d) => [d.id, d.nombre]));
    const sedeMap = Object.fromEntries((sedes || []).map((s) => [s.id, s.nombre]));
    return empleadosRaw.map((u) => ({
      ...u,
      cargo: cargoMap[u.cargo_id] || "",
      departamento: deptoMap[u.departamento_id] || "",
      sede: sedeMap[u.sede_id] || "",
      activo: u.estado_activo !== false,
    }));
  }, [empleadosRaw, cargos, departamentos, sedes]);

  // --- Enriquecimiento de departamentos con métricas calculadas en cliente ---
  const departamentosEnriquecidos = useMemo(() => {
    if (!departamentos || !empleados) return [];
    return departamentos.map((dep) => {
      const nombreDep = (dep.nombre || "").trim().toLowerCase();
      const usuariosDepto = empleados.filter(
        (u) => (u.departamento || "").trim().toLowerCase() === nombreDep && nombreDep !== ""
      );
      const activos = usuariosDepto.filter((u) => u.activo !== false);
      const jefes = usuariosDepto.filter((u) => u.rol === "jefe");
      const tareasDepto = (tareas || []).filter((t) => {
        const tDep = (t.datos?.depto || "").trim().toLowerCase();
        return tDep === nombreDep && nombreDep !== "";
      });
      const pendientes = tareasDepto.filter((t) => t.estado === "pendiente").length;
      const completadas = tareasDepto.filter((t) => t.estado === "completada").length;
      const totalTareas = tareasDepto.length;
      const productividad = totalTareas > 0 ? Math.round((completadas / totalTareas) * 100) : 0;
      const plazas = Math.max(usuariosDepto.length, 1);
      const cobertura = plazas > 0 ? Math.round((activos.length / plazas) * 100) : 0;

      let estado = "estable";
      if (!dep.jefe_id) estado = "sinJefe";
      else if (cobertura > 100) estado = "sobrecarga";

      return {
        ...dep,
        jefeId: dep.jefe_id || "",
        jefeNombre: dep.jefe_nombre || "",
        sedeNombre: dep.sede_nombre || "",
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
        sectores: [],
      };
    });
  }, [departamentos, empleados, tareas]);

  const kpis = useMemo(() => {
    const totalEmpleados = (empleados || []).length;
    const totalSectores = (departamentos || []).reduce((s, d) => s + (d.sectores?.length || 0), 0);
    const sinJefe = departamentosEnriquecidos.filter((d) => d.estado === "sinJefe").length;
    const productividadGlobal = departamentosEnriquecidos.length
      ? Math.round(
          departamentosEnriquecidos.reduce((s, d) => s + d.productividad, 0) /
            departamentosEnriquecidos.length
        )
      : 0;
    return {
      totalEmpleados,
      totalDepartamentos: (departamentos || []).length,
      totalSectores,
      sinJefe,
      productividadGlobal,
    };
  }, [empleados, departamentos, departamentosEnriquecidos]);

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

  const handleCrearDepartamento = async (e) => {
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
    } catch (err) {
      setCreateDeptError(err.message || "No se pudo crear el departamento.");
    } finally {
      setCreatingDept(false);
    }
  };

  // --- Departamentos: detalle / editar / eliminar ---
  const [selectedDeptId, setSelectedDeptId] = useState(null);
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

  const handleGuardarDepartamento = async (e) => {
    e.preventDefault();
    if (!selectedDept) return;
    setSavingDept(true);
    setSaveDeptError("");
    try {
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
    } catch (err) {
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
    } catch (err) {
      setDeptActionError(err.message || "No se pudo eliminar el departamento.");
    } finally {
      setDeptBusy(false);
    }
  };

  const filasDepartamentos = useMemo(
    () =>
      departamentosEnriquecidos.map((dep) => ({
        id: dep.id,
        nombreLabel: dep.nombre,
        sedeLabel: dep.sedeNombre || "—",
        jefeLabel: dep.jefeNombre || "Sin asignar",
        headcountLabel: `${dep.activosCount}/${dep.plazas}`,
        coberturaLabel: `${dep.cobertura}%`,
        estadoLabel: <EstadoBadge estado={dep.estado} />,
      })),
    [departamentosEnriquecidos]
  );

  const widgets = [
    { icon: MdOutlinePeople, title: "Total empleados", subtitle: String(kpis.totalEmpleados) },
    { icon: MdOutlineAccountTree, title: "Departamentos", subtitle: String(kpis.totalDepartamentos) },
    { icon: MdOutlineApartment, title: "Sectores", subtitle: String(kpis.totalSectores) },
    { icon: MdOutlineWarningAmber, title: "Sin jefe asignado", subtitle: String(kpis.sinJefe) },
    { icon: MdOutlineTrendingUp, title: "Productividad global", subtitle: `${kpis.productividadGlobal}%` },
  ];

  const cargando = departamentos === null || sedes === null || cargos === null || roles === null || empleados === null;

  if (!empresaId) {
    return (
      <p className="text-sm font-medium text-gray-600 dark:text-white/70">
        Tu cuenta no tiene una empresa asociada.
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

      {cargando ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando estructura de la empresa...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {widgets.map((w, i) => (
              <NexxusWidget key={w.title} {...w} delay={i * 100} />
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-navy-700 dark:text-white">Departamentos</h2>
            <button
              type="button"
              disabled={limiteDepartamentosAlcanzado}
              onClick={() => setShowCreateDept((v) => !v)}
              title={limiteDepartamentosAlcanzado ? `Límite de ${planLimits.departments} departamentos alcanzado en el plan ${plan}.` : undefined}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-brand-400"
            >
              <MdAdd className="h-5 w-5" /> Crear departamento
            </button>
          </div>
          {limiteDepartamentosAlcanzado ? (
            <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
              Límite de {planLimits.departments} departamentos del plan {plan} alcanzado.
            </p>
          ) : null}

          <Modal isOpen={showCreateDept} onClose={() => setShowCreateDept(false)} title="Crear departamento">
            <div className="p-2">
              <form onSubmit={handleCrearDepartamento}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <InputField
                    label="Nombre"
                    id="crear-depto-nombre"
                    value={createDeptForm.nombre}
                    onChange={(e) => setCreateDeptForm((f) => ({ ...f, nombre: e.target.value }))}
                  />
                  <div>
                    <label htmlFor="crear-depto-sede" className={selectLabelClasses}>Sede</label>
                    <select
                      id="crear-depto-sede"
                      value={createDeptForm.sedeId}
                      onChange={(e) => setCreateDeptForm((f) => ({ ...f, sedeId: e.target.value }))}
                      className={selectClasses}
                    >
                      <option value="">Sin sede</option>
                      {(sedes || []).map((s) => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="crear-depto-jefe" className={selectLabelClasses}>Jefe</label>
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
                            <option key={j.id} value={j.id}>{j.nombre}</option>
                          ))
                        : null}
                    </select>
                    {!tieneJefaturas ? (
                      <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                        Disponible desde el plan Business.
                      </p>
                    ) : null}
                  </div>
                </div>
                {createDeptError ? (
                  <p className="mt-3 text-sm font-medium text-red-500 dark:text-red-400">{createDeptError}</p>
                ) : null}
                <div className="mt-4 flex gap-3">
                  <ActionButton type="submit" busy={creatingDept} className="bg-brand-500 hover:bg-brand-600 dark:bg-brand-400">
                    Crear
                  </ActionButton>
                  <button
                    type="button"
                    onClick={() => setShowCreateDept(false)}
                    className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600 dark:bg-white/5 dark:text-white/70"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </Modal>

          <div className="mt-4">
            {filasDepartamentos.length === 0 ? (
              <NexxusCard extra="p-4">
                <p className="text-sm font-medium text-gray-600 dark:text-white/70">
                  Aún no hay departamentos creados.
                </p>
              </NexxusCard>
            ) : (
              <DataTable
                title="Departamentos"
                columnsData={columnsDepartamentos}
                tableData={filasDepartamentos}
                readOnly
                onRowClick={(row) => setSelectedDeptId(row.id)}
                delay={100}
              />
            )}
          </div>

          <Modal isOpen={!!selectedDept} onClose={() => setSelectedDeptId(null)} title={selectedDept?.nombre || ""}>
            {selectedDept ? (
            <div className="p-2">
              <p className="text-sm text-gray-600 dark:text-white/70">
                Sede: {selectedDept.sedeNombre || "—"} · Jefe: {selectedDept.jefeNombre || "Sin asignar"}
              </p>              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-white/50">Plazas</p>
                  <p className="mt-1 text-sm font-medium text-navy-700 dark:text-white">{selectedDept.plazas}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-white/50">Activos</p>
                  <p className="mt-1 text-sm font-medium text-navy-700 dark:text-white">{selectedDept.activosCount}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-white/50">Jefes</p>
                  <p className="mt-1 text-sm font-medium text-navy-700 dark:text-white">{selectedDept.jefesCount}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-white/50">Cobertura</p>
                  <p className="mt-1 text-sm font-medium text-navy-700 dark:text-white">{selectedDept.cobertura}%</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-white/50">Tareas pendientes</p>
                  <p className="mt-1 text-sm font-medium text-navy-700 dark:text-white">{selectedDept.pendientes}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-white/50">Productividad</p>
                  <p className="mt-1 text-sm font-medium text-navy-700 dark:text-white">{selectedDept.productividad}%</p>
                </div>
              </div>

              {selectedDept.sectores?.length > 0 ? (
                <div className="mt-6">
                  <p className="mb-2 text-sm font-bold text-navy-700 dark:text-white">Sectores</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDept.sectores.map((sec) => (
                      <span
                        key={sec.id || sec.nombre}
                        className="rounded-full bg-lightPrimary px-3 py-1 text-xs font-medium text-navy-700 dark:bg-charcoal-light dark:text-white"
                      >
                        {sec.nombre}
                        {sec.responsableNombre ? ` · ${sec.responsableNombre}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-6">
                {!deptEditMode ? (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setDeptEditMode(true)}
                      className="rounded-xl bg-lightPrimary px-4 py-2 text-sm font-bold text-brand-500 dark:bg-charcoal-light dark:text-white"
                    >
                      Editar departamento
                    </button>
                    <ActionButton
                      busy={deptBusy}
                      onClick={handleEliminarDepartamento}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Eliminar
                    </ActionButton>
                  </div>
                ) : (
                  <form
                    onSubmit={handleGuardarDepartamento}
                    className="rounded-xl border border-gray-200 p-4 dark:border-white/10"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <InputField
                        variant="auth"
                        label="Nombre"
                        id="edit-depto-nombre"
                        value={deptEditForm.nombre}
                        onChange={(e) => setDeptEditForm((f) => ({ ...f, nombre: e.target.value }))}
                      />
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
                    {saveDeptError ? (
                      <p className="mt-3 text-sm font-medium text-red-500 dark:text-red-400">{saveDeptError}</p>
                    ) : null}
                    <div className="mt-4 flex gap-3">
                      <ActionButton
                        type="submit"
                        busy={savingDept}
                        className="bg-brand-500 hover:bg-brand-600 dark:bg-brand-400"
                      >
                        Guardar
                      </ActionButton>
                      <button
                        type="button"
                        onClick={() => setDeptEditMode(false)}
                        className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600 dark:bg-white/5 dark:text-white/70"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
                {deptActionError ? (
                  <p className="mt-3 text-sm font-medium text-red-500 dark:text-red-400">{deptActionError}</p>
                ) : null}
              </div>
            </div>
            ) : null}
          </Modal>

          <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-3">
            <CatalogSection
              title="Sedes"
              coleccion="sedes"
              empresaId={empresaId}
              actor={actor}
              items={sedes || []}
              limite={planLimits.branches}
              columns={columnsSedes}
              fields={[
                { key: "nombre", label: "Nombre" },
                { key: "direccion", label: "Dirección" },
              ]}
              buildRow={(item) => ({
                id: item.id,
                nombreLabel: item.nombre || "—",
                direccionLabel: item.direccion || "—",
                empleadosLabel: String((empleados || []).filter((u) => u.sede === item.nombre).length),
              })}
              emptyMessage="Aún no hay sedes registradas."
            />
            <CatalogSection
              title="Cargos"
              coleccion="cargos"
              nombreColumn="titulo"
              empresaId={empresaId}
              actor={actor}
              items={cargos || []}
              columns={columnsCargos}
              fields={[{ key: "titulo", label: "Nombre" }]}
              buildRow={(item) => ({
                id: item.id,
                nombreLabel: item.titulo || item.nombre || "—",
                departamentoLabel: "—",
                empleadosLabel: String((empleados || []).filter((u) => u.cargo === (item.titulo || item.nombre)).length),
              })}
              emptyMessage="Aún no hay cargos registrados."
            />
            <CatalogSection
              title="Roles personalizados"
              coleccion="roles_personalizados"
              empresaId={empresaId}
              actor={actor}
              items={roles || []}
              columns={columnsRoles}
              fields={[
                { key: "nombre", label: "Nombre" },
                { key: "descripcion", label: "Descripción" },
              ]}
              buildRow={(item) => ({
                id: item.id,
                nombreLabel: item.nombre || "—",
                descripcionLabel: item.descripcion || "—",
                permisosLabel: Array.isArray(item.permisos) ? item.permisos.join(", ") : "—",
              })}
              emptyMessage="Aún no hay roles personalizados."
            />
          </div>
        </>
      )}
    </div>
  );
}

// Sección genérica de catálogo simple (sedes / cargos / roles personalizados): listado +
// crear/editar/eliminar. Estos documentos son ligeramente estructurados (id, empresaId, nombre
// + campos variables), así que el formulario solo cubre los campos que definimos como relevantes
// para esta pantalla, sin tocar el resto de propiedades del documento al guardar.
function CatalogSection({ title, coleccion, nombreColumn = "nombre", empresaId, actor, items, columns, fields, buildRow, emptyMessage, limite = null }: any) {
  const limiteAlcanzadoAqui = typeof limite === "number" && items.length >= limite;
  const emptyForm = () => Object.fromEntries(fields.map((f) => [f.key, ""]));

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm());
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const selected = useMemo(() => items.find((it) => it.id === selectedId) || null, [items, selectedId]);

  useEffect(() => {
    if (selected) {
      const form = {};
      fields.forEach((f) => {
        const value = selected[f.key];
        form[f.key] = f.isList && Array.isArray(value) ? value.join(", ") : value || "";
      });
      setEditForm(form);
      setEditMode(false);
      setActionError("");
    }
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const toPayload = (form) => {
    const payload = {};
    fields.forEach((f) => {
      if (f.isList) {
        payload[f.key] = form[f.key]
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
      } else {
        payload[f.key] = form[f.key].trim();
      }
    });
    return payload;
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (limiteAlcanzadoAqui) {
      setCreateError(`Tu plan permite hasta ${limite} ${title.toLowerCase()}. Actualiza de plan para agregar más.`);
      return;
    }
    if (!createForm[nombreColumn]?.trim()) {
      setCreateError("El nombre es obligatorio.");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const { error: insertError } = await supabase.from(coleccion).insert({ empresa_id: empresaId, ...toPayload(createForm) });
      if (insertError) throw insertError;
      await logAudit({
        empresaId,
        usuarioId: actor.id,
        accion: `Crear ${title.toLowerCase()}`,
        detalles: createForm[nombreColumn].trim(),
      });
      setCreateForm(emptyForm());
      setShowCreate(false);
    } catch (err) {
      setCreateError(err.message || `No se pudo crear el registro de ${title.toLowerCase()}.`);
    } finally {
      setCreating(false);
    }
  };

  const handleGuardar = async (e) => {
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
        detalles: editForm.nombre.trim(),
      });
      setEditMode(false);
    } catch (err) {
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
    } catch (err) {
      setActionError(err.message || "No se pudo eliminar el registro.");
    } finally {
      setBusy(false);
    }
  };

  const filas = items.map(buildRow);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-navy-700 dark:text-white">{title}</h3>
        <button
          type="button"
          disabled={limiteAlcanzadoAqui}
          onClick={() => setShowCreate((v) => !v)}
          title={limiteAlcanzadoAqui ? `Límite de ${limite} ${title.toLowerCase()} alcanzado en tu plan.` : undefined}
          className="flex items-center gap-1 rounded-xl bg-lightPrimary px-3 py-2 text-xs font-bold text-brand-500 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-charcoal-light dark:text-white"
        >
          <MdAdd className="h-4 w-4" /> Nuevo
        </button>
      </div>
      {limiteAlcanzadoAqui ? (
        <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
          Límite de {limite} {title.toLowerCase()} de tu plan alcanzado.
        </p>
      ) : null}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={`Nuevo registro de ${title.toLowerCase()}`}>
        <div className="p-2">
          <form onSubmit={handleCrear}>
            <div className="flex flex-col gap-3">
              {fields.map((f) => (
                <InputField
                  key={f.key}
                  label={f.label}
                  id={`crear-${coleccion}-${f.key}`}
                  value={createForm[f.key]}
                  onChange={(e) => setCreateForm((form) => ({ ...form, [f.key]: e.target.value }))}
                />
              ))}
            </div>
            {createError ? (
              <p className="mt-3 text-sm font-medium text-red-500 dark:text-red-400">{createError}</p>
            ) : null}
            <div className="mt-3 flex gap-2">
              <ActionButton type="submit" busy={creating} className="bg-brand-500 hover:bg-brand-600 dark:bg-brand-400">
                Crear
              </ActionButton>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600 dark:bg-white/5 dark:text-white/70"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <div className="mt-3">
        {filas.length === 0 ? (
          <NexxusCard extra="p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-white/70">{emptyMessage}</p>
          </NexxusCard>
        ) : (
          <DataTable
            title={title}
            columnsData={columns}
            tableData={filas}
            readOnly
            onRowClick={(row) => setSelectedId(row.id)}
          />
        )}
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelectedId(null)} title={selected?.[nombreColumn] || "Detalles"}>
        {selected ? (
        <div className="p-2">
          {!editMode ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="rounded-xl bg-lightPrimary px-4 py-2 text-sm font-bold text-brand-500 dark:bg-charcoal-light dark:text-white"
              >
                Editar
              </button>
              <ActionButton busy={busy} onClick={handleEliminar} className="bg-red-600 hover:bg-red-700">
                Eliminar
              </ActionButton>
            </div>
          ) : (
            <form onSubmit={handleGuardar} className="mt-3 rounded-xl border border-gray-200 p-3 dark:border-white/10">
              <div className="flex flex-col gap-3">
                {fields.map((f) => (
                  <InputField
                    key={f.key}
                    variant="auth"
                    label={f.label}
                    id={`edit-${coleccion}-${f.key}`}
                    value={editForm[f.key]}
                    onChange={(e) => setEditForm((form) => ({ ...form, [f.key]: e.target.value }))}
                  />
                ))}
              </div>
              {saveError ? (
                <p className="mt-3 text-sm font-medium text-red-500 dark:text-red-400">{saveError}</p>
              ) : null}
              <div className="mt-3 flex gap-2">
                <ActionButton type="submit" busy={saving} className="bg-brand-500 hover:bg-brand-600 dark:bg-brand-400">
                  Guardar
                </ActionButton>
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
          {actionError ? (
            <p className="mt-3 text-sm font-medium text-red-500 dark:text-red-400">{actionError}</p>
          ) : null}
        </div>
        ) : null}
      </Modal>
    </div>
  );
}
