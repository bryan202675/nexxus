import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import {
  MdOutlineInventory2,
  MdOutlineAssignmentInd,
  MdOutlineCheckCircle,
  MdOutlineReportProblem,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import NexxusWidget from "views/nexxus/components/NexxusWidget";
import DataTable from "views/nexxus/components/DataTable";
import Modal from "components/nexxus/Modal";

import { useAuth } from "context/AuthContext";
import { db, subscribeInventario, subscribeIncidencias, subscribeEmpleados } from "services/adminRepository";

const inputClasses =
  "h-11 w-full rounded-xl border border-gray-200 bg-white/0 px-3 text-sm text-navy-700 outline-none dark:!border-charcoal-border dark:bg-charcoal dark:text-white";

const ESTADO_ACTIVO_BADGE = {
  disponible: "bg-green-50 text-green-600 dark:bg-green-400/10 dark:text-green-400",
  asignado: "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
  mantenimiento: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
  retirado: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60",
};

const ESTADO_INCIDENCIA_BADGE = {
  abierta: "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-400",
  en_revision: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
  resuelta: "bg-green-50 text-green-600 dark:bg-green-400/10 dark:text-green-400",
};

const PRIORIDAD_BADGE = {
  baja: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60",
  media: "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
  alta: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
  urgente: "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-400",
};

function Badge({ value, map, fallbackLabel }) {
  const cls = map[value] || "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60";
  return <span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${cls}`}>{value || fallbackLabel || "—"}</span>;
}

function formatoFechaCorta(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-SV", { year: "numeric", month: "short", day: "2-digit" });
}

export default function GestionInventario() {
  const { user, perfil, empresaId } = useAuth();
  const actorNombre = perfil?.nombre || user?.email || "Admin";

  const [activos, setActivos] = useState(null);
  const [incidencias, setIncidencias] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [error, setError] = useState("");

  const [busyId, setBusyId] = useState("");
  const [seleccionAsignacion, setSeleccionAsignacion] = useState({});

  const [formActivo, setFormActivo] = useState({ nombre: "", categoria: "", codigo: "", serie: "", ubicacion: "", notas: "" });
  const [creando, setCreando] = useState(false);
  const [crearError, setCrearError] = useState("");
  const [showCrearActivo, setShowCrearActivo] = useState(false);

  const [formIncidencia, setFormIncidencia] = useState({ activoId: "", descripcion: "", prioridad: "media" });
  const [reportando, setReportando] = useState(false);
  const [reportarError, setReportarError] = useState("");
  const [showReportarIncidencia, setShowReportarIncidencia] = useState(false);

  useEffect(() => {
    if (!empresaId) return undefined;
    const onErr = (err) => setError(err.message || "No se pudo conectar con Firestore.");
    const unsubs = [
      subscribeInventario(empresaId, (docs) => setActivos(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeIncidencias(empresaId, (docs) => setIncidencias(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeEmpleados(empresaId, (docs) => setEmpleados(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [empresaId]);

  const empleadosPorId = useMemo(() => {
    const map = new Map();
    empleados.forEach((e) => map.set(e.id, e));
    return map;
  }, [empleados]);

  const kpis = useMemo(() => {
    const lista = activos || [];
    return {
      total: lista.length,
      asignados: lista.filter((a) => a.estado === "asignado").length,
      disponibles: lista.filter((a) => a.estado === "disponible").length,
      incidenciasAbiertas: (incidencias || []).filter((i) => i.estado === "abierta").length,
    };
  }, [activos, incidencias]);

  async function registrarMovimiento(activoId, tipo) {
    try {
      await addDoc(collection(db, "inventario_movimientos"), {
        empresaId,
        activoId,
        tipo,
        fecha: new Date().toISOString(),
        usuarioId: user?.uid || "",
      });
    } catch {
      // El movimiento es un registro auxiliar; no debe bloquear la operación principal.
    }
  }

  async function handleCrearActivo(event) {
    event.preventDefault();
    if (!formActivo.nombre.trim() || !formActivo.categoria.trim() || !formActivo.codigo.trim()) {
      setCrearError("Nombre, categoría y código son obligatorios.");
      return;
    }
    setCreando(true);
    setCrearError("");
    try {
      const now = new Date().toISOString();
      const ref = await addDoc(collection(db, "inventario_activos"), {
        empresaId,
        nombre: formActivo.nombre.trim(),
        categoria: formActivo.categoria.trim(),
        codigo: formActivo.codigo.trim(),
        serie: formActivo.serie.trim() || null,
        ubicacion: formActivo.ubicacion.trim() || null,
        notas: formActivo.notas.trim() || null,
        estado: "disponible",
        asignadoA: null,
        asignadoNombre: null,
        fechaCreacion: now,
        fechaActualizacion: now,
      });
      await registrarMovimiento(ref.id, "alta");
      setFormActivo({ nombre: "", categoria: "", codigo: "", serie: "", ubicacion: "", notas: "" });
      setShowCrearActivo(false);
    } catch (err) {
      setCrearError(err.message || "No se pudo registrar el activo.");
    } finally {
      setCreando(false);
    }
  }

  async function handleAsignar(activo) {
    const empleadoId = seleccionAsignacion[activo.id];
    if (!empleadoId) return;
    const empleado = empleadosPorId.get(empleadoId);
    setBusyId(activo.id);
    setError("");
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, "inventario_activos", activo.id), {
        estado: "asignado",
        asignadoA: empleadoId,
        asignadoNombre: empleado?.nombre || empleadoId,
        fechaActualizacion: now,
      });
      await registrarMovimiento(activo.id, "asignacion");
    } catch (err) {
      setError(err.message || "No se pudo asignar el activo.");
    } finally {
      setBusyId("");
    }
  }

  async function handleDevolver(activo) {
    setBusyId(activo.id);
    setError("");
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, "inventario_activos", activo.id), {
        estado: "disponible",
        asignadoA: null,
        asignadoNombre: null,
        fechaActualizacion: now,
      });
      await registrarMovimiento(activo.id, "devolucion");
    } catch (err) {
      setError(err.message || "No se pudo procesar la devolución.");
    } finally {
      setBusyId("");
    }
  }

  async function handleReportarIncidencia(event) {
    event.preventDefault();
    if (!formIncidencia.activoId || !formIncidencia.descripcion.trim()) {
      setReportarError("Selecciona un activo y describe la incidencia.");
      return;
    }
    const activo = (activos || []).find((a) => a.id === formIncidencia.activoId);
    setReportando(true);
    setReportarError("");
    try {
      await addDoc(collection(db, "incidencias"), {
        empresaId,
        activoId: formIncidencia.activoId,
        activoNombre: activo?.nombre || "",
        reportadoPor: user?.uid || "",
        reportadoNombre: actorNombre,
        descripcion: formIncidencia.descripcion.trim(),
        prioridad: formIncidencia.prioridad,
        estado: "abierta",
        fechaCreacion: new Date().toISOString(),
      });
      setFormIncidencia({ activoId: "", descripcion: "", prioridad: "media" });
      setShowReportarIncidencia(false);
    } catch (err) {
      setReportarError(err.message || "No se pudo reportar la incidencia.");
    } finally {
      setReportando(false);
    }
  }

  async function handleResolverIncidencia(incidencia) {
    setBusyId(incidencia.id);
    setError("");
    try {
      await updateDoc(doc(db, "incidencias", incidencia.id), {
        estado: "resuelta",
        fechaResolucion: new Date().toISOString(),
      });
      await registrarMovimiento(incidencia.activoId, "incidencia_resuelta");
    } catch (err) {
      setError(err.message || "No se pudo resolver la incidencia.");
    } finally {
      setBusyId("");
    }
  }

  const columnasActivos = [
    { Header: "Nombre", accessor: "nombre" },
    { Header: "Categoría", accessor: "categoria" },
    { Header: "Código", accessor: "codigo" },
    { Header: "Estado", accessor: "estadoBadge" },
    { Header: "Asignado a", accessor: "asignado" },
    { Header: "Acciones", accessor: "acciones" },
  ];

  const filasActivos = useMemo(
    () =>
      (activos || []).map((activo) => {
        const busy = busyId === activo.id;
        return {
          id: activo.id,
          nombre: activo.nombre || "—",
          categoria: activo.categoria || "—",
          codigo: activo.codigo || "—",
          estadoBadge: <Badge value={activo.estado} map={ESTADO_ACTIVO_BADGE} />,
          asignado: activo.asignadoNombre || "—",
          acciones: (
            <div className="flex flex-wrap items-center gap-2">
              {activo.estado === "disponible" ? (
                <>
                  <select
                    value={seleccionAsignacion[activo.id] || ""}
                    onChange={(event) =>
                      setSeleccionAsignacion((prev) => ({ ...prev, [activo.id]: event.target.value }))
                    }
                    disabled={busy}
                    className="h-9 rounded-lg border border-gray-200 bg-white/0 px-2 text-xs text-navy-700 outline-none dark:!border-charcoal-border dark:bg-charcoal dark:text-white"
                  >
                    <option value="" className="dark:bg-charcoal">Empleado...</option>
                    {empleados.map((emp) => (
                      <option key={emp.id} value={emp.id} className="dark:bg-charcoal">
                        {emp.nombre || emp.id}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busy || !seleccionAsignacion[activo.id]}
                    onClick={() => handleAsignar(activo)}
                    className="rounded-lg bg-brand-500 px-3 py-1 text-xs font-bold text-white disabled:opacity-40 dark:bg-brand-400"
                  >
                    {busy ? "..." : "Asignar"}
                  </button>
                </>
              ) : null}
              {activo.estado === "asignado" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDevolver(activo)}
                  className="rounded-lg bg-blue-500 px-3 py-1 text-xs font-bold text-white disabled:opacity-40"
                >
                  {busy ? "..." : "Devolver"}
                </button>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={() => setFormIncidencia((prev) => ({ ...prev, activoId: activo.id }))}
                className="rounded-lg bg-lightPrimary px-3 py-1 text-xs font-bold text-brand-500 disabled:opacity-40 dark:bg-charcoal-light dark:text-white"
              >
                Reportar incidencia
              </button>
            </div>
          ),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activos, busyId, seleccionAsignacion, empleados]
  );

  const columnasIncidencias = [
    { Header: "Activo", accessor: "activo" },
    { Header: "Descripción", accessor: "descripcion" },
    { Header: "Prioridad", accessor: "prioridadBadge" },
    { Header: "Estado", accessor: "estadoBadge" },
    { Header: "Reportada", accessor: "fecha" },
    { Header: "Acciones", accessor: "acciones" },
  ];

  const filasIncidencias = useMemo(
    () =>
      (incidencias || []).map((incidencia) => {
        const busy = busyId === incidencia.id;
        return {
          id: incidencia.id,
          activo: incidencia.activoNombre || "—",
          descripcion: incidencia.descripcion || "—",
          prioridadBadge: <Badge value={incidencia.prioridad} map={PRIORIDAD_BADGE} />,
          estadoBadge: <Badge value={incidencia.estado} map={ESTADO_INCIDENCIA_BADGE} />,
          fecha: formatoFechaCorta(incidencia.fechaCreacion),
          acciones:
            incidencia.estado !== "resuelta" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => handleResolverIncidencia(incidencia)}
                className="rounded-lg bg-green-600 px-3 py-1 text-xs font-bold text-white disabled:opacity-40"
              >
                {busy ? "..." : "Resolver"}
              </button>
            ) : (
              <span className="text-xs text-gray-400 dark:text-white/40">—</span>
            ),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [incidencias, busyId]
  );

  const widgets = [
    { icon: MdOutlineInventory2, title: "Total activos", subtitle: String(kpis.total) },
    { icon: MdOutlineAssignmentInd, title: "Asignados", subtitle: String(kpis.asignados) },
    { icon: MdOutlineCheckCircle, title: "Disponibles", subtitle: String(kpis.disponibles) },
    { icon: MdOutlineReportProblem, title: "Incidencias abiertas", subtitle: String(kpis.incidenciasAbiertas) },
  ];

  if (!empresaId) {
    return (
      <p className="text-sm font-medium text-gray-600 dark:text-white/70">
        Tu cuenta no tiene una empresa asociada.
      </p>
    );
  }

  const cargando = activos === null || incidencias === null;

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {cargando ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando inventario...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {widgets.map((w, i) => (
              <NexxusWidget key={w.title} {...w} delay={i * 100} />
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <h4 className="text-lg font-bold text-navy-700 dark:text-white">Activos</h4>
            <button
              type="button"
              onClick={() => setShowCrearActivo(true)}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 dark:bg-brand-400"
            >
              Registrar activo
            </button>
          </div>

          <Modal isOpen={showCrearActivo} onClose={() => setShowCrearActivo(false)} title="Registrar activo">
            <div className="p-2">
              {crearError ? (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
                  {crearError}
                </p>
              ) : null}
              <form onSubmit={handleCrearActivo} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={formActivo.nombre}
                  onChange={(e) => setFormActivo((prev) => ({ ...prev, nombre: e.target.value }))}
                  className={inputClasses}
                />
                <input
                  type="text"
                  placeholder="Categoría"
                  value={formActivo.categoria}
                  onChange={(e) => setFormActivo((prev) => ({ ...prev, categoria: e.target.value }))}
                  className={inputClasses}
                />
                <input
                  type="text"
                  placeholder="Código"
                  value={formActivo.codigo}
                  onChange={(e) => setFormActivo((prev) => ({ ...prev, codigo: e.target.value }))}
                  className={inputClasses}
                />
                <input
                  type="text"
                  placeholder="Serie (opcional)"
                  value={formActivo.serie}
                  onChange={(e) => setFormActivo((prev) => ({ ...prev, serie: e.target.value }))}
                  className={inputClasses}
                />
                <input
                  type="text"
                  placeholder="Ubicación (opcional)"
                  value={formActivo.ubicacion}
                  onChange={(e) => setFormActivo((prev) => ({ ...prev, ubicacion: e.target.value }))}
                  className={inputClasses}
                />
                <div className="flex gap-2 md:col-span-2">
                  <button
                    type="submit"
                    disabled={creando}
                    className="h-11 flex-1 rounded-xl bg-brand-500 px-4 text-sm font-bold text-white transition disabled:opacity-40 dark:bg-brand-400"
                  >
                    {creando ? "Guardando..." : "Registrar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCrearActivo(false)}
                    className="h-11 flex-1 rounded-xl bg-gray-100 px-4 text-sm font-bold text-gray-600 transition dark:bg-white/5 dark:text-white/70"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </Modal>

          <div className="mt-4">
            <DataTable columnsData={columnasActivos} tableData={filasActivos} delay={100} />
          </div>

          <div className="mt-8 flex items-center justify-between">
            <h4 className="text-lg font-bold text-navy-700 dark:text-white">Incidencias</h4>
            <button
              type="button"
              onClick={() => setShowReportarIncidencia(true)}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600 dark:bg-red-400"
            >
              Reportar incidencia
            </button>
          </div>

          <Modal isOpen={showReportarIncidencia} onClose={() => setShowReportarIncidencia(false)} title="Reportar incidencia">
            <div className="p-2">
              {reportarError ? (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
                  {reportarError}
                </p>
              ) : null}
              <form onSubmit={handleReportarIncidencia} className="flex flex-col gap-3">
                <select
                  value={formIncidencia.activoId}
                  onChange={(e) => setFormIncidencia((prev) => ({ ...prev, activoId: e.target.value }))}
                  className={inputClasses}
                >
                  <option value="" className="dark:bg-charcoal">Selecciona un activo...</option>
                  {(activos || []).map((a) => (
                    <option key={a.id} value={a.id} className="dark:bg-charcoal">
                      {a.nombre} ({a.codigo})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Descripción"
                  value={formIncidencia.descripcion}
                  onChange={(e) => setFormIncidencia((prev) => ({ ...prev, descripcion: e.target.value }))}
                  className={inputClasses}
                />
                <select
                  value={formIncidencia.prioridad}
                  onChange={(e) => setFormIncidencia((prev) => ({ ...prev, prioridad: e.target.value }))}
                  className={inputClasses}
                >
                  <option value="baja" className="dark:bg-charcoal">Baja</option>
                  <option value="media" className="dark:bg-charcoal">Media</option>
                  <option value="alta" className="dark:bg-charcoal">Alta</option>
                  <option value="urgente" className="dark:bg-charcoal">Urgente</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={reportando}
                    className="h-11 flex-1 rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition disabled:opacity-40 dark:bg-red-400"
                  >
                    {reportando ? "Enviando..." : "Reportar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReportarIncidencia(false)}
                    className="h-11 flex-1 rounded-xl bg-gray-100 px-4 text-sm font-bold text-gray-600 transition dark:bg-white/5 dark:text-white/70"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </Modal>

          <div className="mt-8">
            {filasIncidencias.length === 0 ? (
              <NexxusCard extra="w-full p-6">
                <p className="text-sm font-medium text-gray-600 dark:text-white/70">
                  No hay incidencias registradas.
                </p>
              </NexxusCard>
            ) : (
              <DataTable title="Incidencias" columnsData={columnasIncidencias} tableData={filasIncidencias} delay={150} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
