import { useEffect, useMemo, useState } from "react";
import { MdSearch, MdPendingActions, MdFactCheck, MdPriorityHigh } from "react-icons/md";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";

import NexxusCard from "views/nexxus/components/NexxusCard";
import NexxusWidget from "views/nexxus/components/NexxusWidget";
import RecordsTable from "views/nexxus/components/RecordsTable";
import InputField from "components/fields/InputField";
import Modal from "components/nexxus/Modal";
import { useAuth } from "context/AuthContext";
import { useEmpresaPlan, tieneFeature } from "services/planEnforcement";
import {
  db,
  subscribeSolicitudesAusencia,
  subscribeSolicitudesInternas,
  subscribeReportes,
  subscribeEmpleados,
} from "services/adminRepository";
import { formatoFecha } from "services/saFormat";

// Puerto del modelo unificado RequestReportItem de
// nexxus/app/src/domain/entities/RequestReport.ts + la normalizacion de
// nexxus/app/src/infrastructure/firebase/FirebaseRequestReportRepository.ts, para que esta
// pantalla lea exactamente los mismos campos legacy que ya usa la app movil (nada inventado).

const textValue = (value, fallback = "") =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;

const PRIORIDADES = ["baja", "media", "alta", "urgente"];
const priorityValue = (value) => {
  const p = textValue(value, "media");
  return PRIORIDADES.includes(p) ? p : "media";
};

const ESTADOS = ["pendiente", "aprobada", "rechazada", "resuelto", "registrado"];
const normalizeEstado = (estado) => {
  const value = textValue(estado, "pendiente");
  if (value === "aprobado") return "aprobada";
  if (value === "rechazado") return "rechazada";
  return ESTADOS.includes(value) ? value : "pendiente";
};

const normalizeAusencia = (id, data) => ({
  id,
  source: "solicitud_ausencia",
  sourceCollection: "solicitudes_ausencia",
  empresaId: textValue(data.empresaId, textValue(data.empresa_id)),
  empleadoId: textValue(data.usuario_id),
  empleadoNombre: textValue(data.usuario_nombre, "Empleado"),
  tipo: textValue(data.tipo, "ausencia"),
  titulo: textValue(data.asunto, textValue(data.tipo, "Solicitud de ausencia")),
  descripcion: textValue(data.motivo, textValue(data.descripcion_detallada, "Sin detalle")),
  estado: normalizeEstado(data.estado),
  prioridad: priorityValue(data.prioridad),
  fechaCreacion: textValue(data.fecha_solicitud, new Date().toISOString()),
});

const normalizeInterna = (id, data) => ({
  id,
  source: "solicitud_interna",
  sourceCollection: "solicitudes_internas",
  empresaId: textValue(data.empresaId, textValue(data.empresa_id)),
  empleadoId: textValue(data.userId),
  empleadoNombre: textValue(data.usuarioNombre, textValue(data.empleadoNombre, "Empleado")),
  tipo: textValue(data.tipo, "solicitud"),
  titulo: textValue(data.titulo, textValue(data.tipo, "Solicitud interna")),
  descripcion: textValue(data.descripcion, "Sin detalle"),
  estado: normalizeEstado(data.estado),
  prioridad: priorityValue(data.prioridad),
  fechaCreacion: textValue(data.timestamp, textValue(data.fechaCreacion, new Date().toISOString())),
});

const normalizeReporte = (id, data) => ({
  id,
  source: "reporte",
  sourceCollection: "reportes",
  empresaId: textValue(data.empresaId, textValue(data.empresa_id)),
  empleadoId: textValue(data.empleadoId),
  empleadoNombre: textValue(data.empleadoNombre, "Empleado"),
  tipo: textValue(data.tipo, "reporte"),
  titulo: textValue(data.titulo, `Reporte ${textValue(data.tipo, "")}`.trim()),
  descripcion: textValue(data.detalle, textValue(data.descripcion, "Sin detalle")),
  estado: normalizeEstado(data.estado || "registrado"),
  prioridad: priorityValue(data.gravedad || data.prioridad),
  fechaCreacion: textValue(data.fecha, textValue(data.fechaCreacion, new Date().toISOString())),
});

const SOURCE_OPTIONS = [
  { value: "", label: "Todos los tipos" },
  { value: "solicitud_ausencia", label: "Ausencias" },
  { value: "solicitud_interna", label: "Internas" },
  { value: "reporte", label: "Reportes disciplinarios" },
];

const ESTADO_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "pendiente", label: "Pendiente" },
  { value: "aprobada", label: "Aprobada" },
  { value: "rechazada", label: "Rechazada" },
  { value: "resuelto", label: "Resuelto" },
  { value: "registrado", label: "Registrado" },
];

const TIPO_REPORTE_OPTIONS = [
  { value: "disciplinario", label: "Disciplinario" },
  { value: "llegada_tarde", label: "Llegada tarde" },
  { value: "ausencia", label: "Ausencia" },
  { value: "desempeno", label: "Desempeño" },
  { value: "incidencia", label: "Incidencia" },
];

const ESTADO_BADGE = {
  pendiente: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
  aprobada: "bg-green-50 text-green-600 dark:bg-green-400/10 dark:text-green-400",
  rechazada: "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-400",
  resuelto: "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
  registrado: "bg-purple-50 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400",
};

const PRIORIDAD_BADGE = {
  baja: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70",
  media: "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
  alta: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
  urgente: "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-400",
};

const truncate = (str, n) => {
  const value = textValue(str, "—");
  return value.length > n ? `${value.slice(0, n)}…` : value;
};

const Badge = ({ tone, children }) => (
  <span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${tone}`}>{children}</span>
);

const COLUMNAS = [
  { Header: "Empleado", accessor: "empleado" },
  { Header: "Tipo", accessor: "tipo" },
  { Header: "Título / Descripción", accessor: "tituloDescripcion" },
  { Header: "Prioridad", accessor: "prioridad" },
  { Header: "Estado", accessor: "estado" },
  { Header: "Fecha", accessor: "fecha" },
  { Header: "Acciones", accessor: "acciones" },
];

const INITIAL_FORM = { empleadoId: "", tipo: "disciplinario", titulo: "", descripcion: "", prioridad: "media" };

export default function CentroReportesSolicitudes() {
  const { user, perfil, rol, empresaId } = useAuth();
  const { planFeatures } = useEmpresaPlan();
  const tieneReportes = tieneFeature(planFeatures, "reports");

  const [ausencias, setAusencias] = useState(null);
  const [internas, setInternas] = useState(null);
  const [reportes, setReportes] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [sourceFiltro, setSourceFiltro] = useState("");

  const [accionando, setAccionando] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [creando, setCreando] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!empresaId) return undefined;
    const onErr = (err) => setError(err.message || "No se pudo conectar con Firestore.");
    const unsubs = [
      subscribeSolicitudesAusencia(empresaId, (docs) => setAusencias(docs.map((d) => normalizeAusencia(d.id, d.data()))), onErr),
      subscribeSolicitudesInternas(empresaId, (docs) => setInternas(docs.map((d) => normalizeInterna(d.id, d.data()))), onErr),
      subscribeReportes(empresaId, (docs) => setReportes(docs.map((d) => normalizeReporte(d.id, d.data()))), onErr),
      subscribeEmpleados(empresaId, (docs) => setEmpleados(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [empresaId]);

  const cargando = ausencias === null || internas === null || reportes === null;

  const items = useMemo(() => {
    if (cargando) return [];
    // "reports" (reportes disciplinarios) es funcionalidad de plan Business+; en Starter la
    // bandeja solo muestra solicitudes (que sí están incluidas en todos los planes).
    const reportesVisibles = tieneReportes ? reportes : [];
    return [...ausencias, ...internas, ...reportesVisibles].sort(
      (a, b) => Date.parse(b.fechaCreacion) - Date.parse(a.fechaCreacion)
    );
  }, [ausencias, internas, reportes, cargando, tieneReportes]);

  const metricas = useMemo(
    () => ({
      pendientes: items.filter((i) => i.estado === "pendiente").length,
      reportes: items.filter((i) => i.source === "reporte").length,
      urgentes: items.filter((i) => i.prioridad === "urgente").length,
    }),
    [items]
  );

  const nombreActor = textValue(perfil?.nombre, textValue(user?.email, "Administrador"));

  const handleResolve = async (item, nuevoEstado) => {
    const notas = window.prompt(
      `Notas de resolución (opcional) al ${nuevoEstado === "aprobada" ? "aprobar" : "rechazar"} "${item.titulo}":`,
      ""
    );
    if (notas === null) return;

    setAccionando(item.id);
    setError("");
    try {
      const sourceState =
        item.sourceCollection === "solicitudes_internas"
          ? nuevoEstado === "aprobada"
            ? "aprobado"
            : "rechazado"
          : nuevoEstado;
      const resueltoEn = new Date().toISOString();

      await updateDoc(doc(db, item.sourceCollection, item.id), {
        estado: sourceState,
        aprobadorId: user.uid,
        aprobadorNombre: nombreActor,
        resuelto_por: user.uid,
        resuelto_por_nombre: nombreActor,
        fecha_resolucion: resueltoEn,
        fechaResolucion: resueltoEn,
        confirmadoPorId: user.uid,
        confirmadoPorNombre: nombreActor,
        confirmadoAt: resueltoEn,
        comentario_resolucion: notas.trim() || `Resuelto desde Solicitudes por ${nombreActor}`,
      });

      await addDoc(collection(db, "audit_logs"), {
        empresaId,
        empresa_id: empresaId,
        usuarioId: user.uid,
        usuario_id: user.uid,
        usuarioNombre: nombreActor,
        rol,
        accion: `Resolución de ${item.source}`,
        modulo: "Solicitudes",
        detalles: `${item.titulo} · ${nuevoEstado}`,
        estado: nuevoEstado === "rechazada" ? "Warning" : "Success",
        targetId: item.id,
        timestamp: resueltoEn,
      });
    } catch (err) {
      setError(err.message || "No se pudo resolver la solicitud.");
    } finally {
      setAccionando(null);
    }
  };

  const filaVisibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return items
      .filter((item) => (estadoFiltro ? item.estado === estadoFiltro : true))
      .filter((item) => (sourceFiltro ? item.source === sourceFiltro : true))
      .filter((item) => {
        if (!texto) return true;
        const campos = [item.empleadoNombre, item.titulo, item.descripcion, item.tipo];
        return campos.some((campo) => (campo || "").toLowerCase().includes(texto));
      })
      .map((item) => ({
        empleado: item.empleadoNombre,
        tipo: item.tipo,
        tituloDescripcion: (
          <span className="flex flex-col">
            <span className="text-sm font-bold text-navy-700 dark:text-white">{item.titulo}</span>
            <span className="text-xs font-medium text-gray-500 dark:text-white/50">
              {truncate(item.descripcion, 60)}
            </span>
          </span>
        ),
        prioridad: <Badge tone={PRIORIDAD_BADGE[item.prioridad]}>{item.prioridad}</Badge>,
        estado: <Badge tone={ESTADO_BADGE[item.estado]}>{item.estado}</Badge>,
        fecha: formatoFecha(item.fechaCreacion),
        acciones:
          item.estado === "pendiente" && item.source !== "reporte" ? (
            <span className="flex gap-2">
              <button
                type="button"
                disabled={accionando === item.id}
                onClick={() => handleResolve(item, "aprobada")}
                className="whitespace-nowrap rounded-lg bg-green-50 px-2 py-1 text-xs font-bold text-green-600 transition duration-250 hover:bg-green-100 disabled:opacity-40 dark:bg-green-400/10 dark:text-green-400"
              >
                Aprobar
              </button>
              <button
                type="button"
                disabled={accionando === item.id}
                onClick={() => handleResolve(item, "rechazada")}
                className="whitespace-nowrap rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-600 transition duration-250 hover:bg-red-100 disabled:opacity-40 dark:bg-red-400/10 dark:text-red-400"
              >
                Rechazar
              </button>
            </span>
          ) : (
            <span className="text-xs text-gray-400 dark:text-white/30">—</span>
          ),
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, busqueda, estadoFiltro, sourceFiltro, accionando]);

  const handleCrearReporte = async (event) => {
    event.preventDefault();
    setError("");
    if (!tieneReportes) {
      setError("Los reportes disciplinarios están disponibles desde el plan Business.");
      return;
    }
    const empleado = empleados.find((emp) => emp.id === form.empleadoId);
    if (!empleado || !form.descripcion.trim()) {
      setError("Selecciona un empleado y describe el reporte antes de guardarlo.");
      return;
    }

    setCreando(true);
    try {
      const fecha = new Date().toISOString();
      const empleadoNombre = textValue(empleado.nombre, textValue(empleado.nombreCompleto, "Empleado"));
      const titulo = form.titulo.trim() || `Reporte ${form.tipo.replace(/_/g, " ")}`;

      const docRef = await addDoc(collection(db, "reportes"), {
        empresaId,
        empresa_id: empresaId,
        empleadoId: empleado.id,
        empleadoNombre,
        tipo: form.tipo,
        titulo,
        descripcion: form.descripcion.trim(),
        detalle: form.descripcion.trim(),
        gravedad: form.prioridad,
        prioridad: form.prioridad,
        estado: "registrado",
        adjuntos: [],
        fecha,
        fechaCreacion: fecha,
        creadoPor: user.uid,
        creadorNombre: nombreActor,
      });

      await addDoc(collection(db, "audit_logs"), {
        empresaId,
        empresa_id: empresaId,
        usuarioId: user.uid,
        usuario_id: user.uid,
        usuarioNombre: nombreActor,
        rol,
        accion: "Creación de reporte",
        modulo: "Solicitudes",
        detalles: `${empleadoNombre} · ${form.tipo}`,
        estado: form.prioridad === "urgente" ? "Warning" : "Success",
        targetId: docRef.id,
        timestamp: fecha,
      });

      setForm(INITIAL_FORM);
      setShowModal(false);
    } catch (err) {
      setError(err.message || "No se pudo crear el reporte.");
    } finally {
      setCreando(false);
    }
  };

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
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando solicitudes...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <NexxusWidget icon={MdPendingActions} title="Pendientes" subtitle={String(metricas.pendientes)} delay={0} />
            <NexxusWidget icon={MdFactCheck} title="Reportes disciplinarios" subtitle={String(metricas.reportes)} delay={100} />
            <NexxusWidget icon={MdPriorityHigh} title="Urgentes" subtitle={String(metricas.urgentes)} delay={200} />
          </div>

          <NexxusCard extra="mt-8 mb-5 w-full p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <MdSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400 dark:text-white/40" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar por empleado, título, descripción o tipo..."
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white/0 pl-10 pr-3 text-sm text-navy-700 outline-none dark:!border-charcoal-border dark:text-white dark:placeholder:text-white/40"
                />
              </div>
              <select
                value={sourceFiltro}
                onChange={(event) => setSourceFiltro(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white/0 px-3 text-sm text-navy-700 outline-none dark:!border-charcoal-border dark:bg-charcoal dark:text-white md:w-56"
              >
                {SOURCE_OPTIONS.map((opcion) => (
                  <option key={opcion.value} value={opcion.value} className="dark:bg-charcoal">
                    {opcion.label}
                  </option>
                ))}
              </select>
              <select
                value={estadoFiltro}
                onChange={(event) => setEstadoFiltro(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white/0 px-3 text-sm text-navy-700 outline-none dark:!border-charcoal-border dark:bg-charcoal dark:text-white md:w-56"
              >
                {ESTADO_OPTIONS.map((opcion) => (
                  <option key={opcion.value} value={opcion.value} className="dark:bg-charcoal">
                    {opcion.label}
                  </option>
                ))}
              </select>
              {tieneReportes ? (
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="flex h-11 items-center justify-center rounded-xl bg-brand-500 px-6 text-sm font-medium text-white transition duration-250 hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300 md:ml-auto"
                >
                  Crear reporte
                </button>
              ) : (
                <span
                  title="Los reportes disciplinarios están disponibles desde el plan Business."
                  className="flex h-11 items-center justify-center rounded-xl bg-gray-100 px-6 text-sm font-medium text-gray-400 dark:bg-white/5 dark:text-white/30 md:ml-auto"
                >
                  Crear reporte (plan Business+)
                </span>
              )}
            </div>
          </NexxusCard>

          <div className="w-full">
            <RecordsTable
              title="Bandeja unificada de solicitudes y reportes"
              columnsData={COLUMNAS}
              tableData={filaVisibles}
              delay={100}
            />
          </div>

          <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Crear reporte disciplinario">
            <div className="p-2">
              <form onSubmit={handleCrearReporte} className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="empleadoId"
                    className="ml-3 text-sm font-bold text-navy-700 dark:text-white"
                  >
                    Empleado
                  </label>
                  <select
                    id="empleadoId"
                    value={form.empleadoId}
                    onChange={(event) => setForm((prev) => ({ ...prev, empleadoId: event.target.value }))}
                    className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white/0 px-3 text-sm text-navy-700 outline-none dark:!border-white/10 dark:bg-charcoal dark:text-white"
                  >
                    <option value="" className="dark:bg-charcoal">Selecciona un empleado</option>
                    {empleados.map((emp) => (
                      <option key={emp.id} value={emp.id} className="dark:bg-charcoal">
                        {textValue(emp.nombre, textValue(emp.nombreCompleto, emp.id))}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="tipoReporte" className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                    Tipo
                  </label>
                  <select
                    id="tipoReporte"
                    value={form.tipo}
                    onChange={(event) => setForm((prev) => ({ ...prev, tipo: event.target.value }))}
                    className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white/0 px-3 text-sm text-navy-700 outline-none dark:!border-white/10 dark:bg-charcoal dark:text-white"
                  >
                    {TIPO_REPORTE_OPTIONS.map((opcion) => (
                      <option key={opcion.value} value={opcion.value} className="dark:bg-charcoal">
                        {opcion.label}
                      </option>
                    ))}
                  </select>
                </div>

                <InputField
                  id="tituloReporte"
                  label="Título (opcional)"
                  placeholder="Ej. Retraso reiterado"
                  value={form.titulo}
                  onChange={(event) => setForm((prev) => ({ ...prev, titulo: event.target.value }))}
                />

                <div>
                  <label htmlFor="descripcionReporte" className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                    Descripción
                  </label>
                  <textarea
                    id="descripcionReporte"
                    rows={4}
                    value={form.descripcion}
                    onChange={(event) => setForm((prev) => ({ ...prev, descripcion: event.target.value }))}
                    placeholder="Detalle del reporte disciplinario..."
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white/0 p-3 text-sm text-navy-700 outline-none dark:!border-white/10 dark:bg-charcoal dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="prioridadReporte" className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                    Prioridad
                  </label>
                  <select
                    id="prioridadReporte"
                    value={form.prioridad}
                    onChange={(event) => setForm((prev) => ({ ...prev, prioridad: event.target.value }))}
                    className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white/0 px-3 text-sm text-navy-700 outline-none dark:!border-white/10 dark:bg-charcoal dark:text-white"
                  >
                    {PRIORIDADES.map((valor) => (
                      <option key={valor} value={valor} className="dark:bg-charcoal capitalize">
                        {valor}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={creando}
                  className="rounded-xl bg-brand-500 px-6 py-2 text-sm font-medium text-white transition duration-250 hover:bg-brand-600 disabled:opacity-40 dark:bg-brand-400 dark:hover:bg-brand-300"
                >
                  {creando ? "Guardando..." : "Registrar reporte"}
                </button>
              </form>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
