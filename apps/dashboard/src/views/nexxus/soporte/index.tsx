import { useEffect, useMemo, useState } from "react";
import {
  MdLock,
  MdBusiness,
  MdPerson,
  MdPersonOutline,
  MdSend,
  MdMailOutline,
  MdPhone,
  MdVpnKey,
  MdLanguage,
  MdPhoneAndroid,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import RecordsTable from "views/nexxus/components/RecordsTable";
import {
  subscribeSupportSessions,
  loadMoreCompanies,
  subscribeSupportTickets,
  subscribeTicketThread,
  responderTicket,
  subscribePublicSupportRequests,
  responderSoportePublico,
  startSupportSession,
} from "services/superAdminRepository";
import { formatoFechaHora, etiquetaRol } from "services/saFormat";

const COLUMNAS_SESIONES = [
  { Header: "Empresa", accessor: "empresaNombre" },
  { Header: "Usuario objetivo", accessor: "targetEmail" },
  { Header: "Rol", accessor: "targetRole" },
  { Header: "Iniciada por", accessor: "actorName" },
  { Header: "Estado", accessor: "estadoTexto" },
  { Header: "Creada", accessor: "creada" },
  { Header: "Expira", accessor: "expira" },
];

const PRIORIDAD_CLASSES = {
  baja: "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400",
  media: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
  alta: "bg-orange-50 text-orange-600 dark:bg-orange-400/10 dark:text-orange-400",
  urgente: "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-400",
};

const ESTADO_TICKET_CLASSES = {
  abierto: "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
  en_progreso: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
  resuelto: "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400",
  cerrado: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300",
};

const ESTADO_PUBLICO_CLASSES = {
  pendiente: "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
  en_revision: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
  contactado: "bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400",
  resuelto: "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400",
};

const ESTADOS_TICKET = [
  { value: "abierto", label: "Abierto" },
  { value: "en_progreso", label: "En progreso" },
  { value: "resuelto", label: "Resuelto" },
  { value: "cerrado", label: "Cerrado" },
];

const ESTADOS_PUBLICO = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_revision", label: "En revisión" },
  { value: "contactado", label: "Contactado" },
  { value: "resuelto", label: "Resuelto" },
];

const Badge = ({ classes, children }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${classes || "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300"}`}>
    {children}
  </span>
);

function coincide(texto, termino) {
  return String(texto || "").toLowerCase().includes(termino);
}

export default function Soporte() {
  // --- Sesiones de impersonación (funcionalidad ya existente) ---
  const [sesiones, setSesiones] = useState([]);
  const [cargandoSesiones, setCargandoSesiones] = useState(true);
  const [error, setError] = useState("");

  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("");
  const [iniciandoSesion, setIniciandoSesion] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeSupportSessions(
      (rows) => { if (active) { setSesiones(rows); setCargandoSesiones(false); } },
      (err) => { if (active) { setError(err.message || "No se pudo conectar."); setCargandoSesiones(false); } }
    );
    return () => { active = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    let active = true;
    loadMoreCompanies({}, 500, null).then((resultado) => {
      if (active) setEmpresas(resultado.items);
    });
    return () => { active = false; };
  }, []);

  const empresasPorId = useMemo(() => {
    const map = new Map();
    empresas.forEach((empresa) => map.set(empresa.id, empresa.nombre));
    return map;
  }, [empresas]);

  const filasSesiones = useMemo(
    () =>
      sesiones.map((sesion) => ({
        empresaNombre: empresasPorId.get(sesion.empresaId) || sesion.empresaId || "—",
        targetEmail: sesion.targetEmail || "—",
        targetRole: sesion.targetRole || "—",
        actorName: sesion.actorName || "—",
        estadoTexto: sesion.status || "—",
        creada: formatoFechaHora(sesion.createdAt),
        expira: formatoFechaHora(sesion.expiresAt),
      })),
    [sesiones, empresasPorId]
  );

  const iniciarSesionSoporte = async () => {
    if (!empresaSeleccionada) return;
    try {
      setIniciandoSesion(true);
      await startSupportSession(empresaSeleccionada);
    } catch (err: any) {
      setError(err.message || "No se pudo iniciar la sesión de soporte.");
    } finally {
      setIniciandoSesion(false);
    }
  };

  // --- Bandeja de soporte: empresa / usuario / sin registrar ---
  const [tickets, setTickets] = useState([]);
  const [solicitudesPublicas, setSolicitudesPublicas] = useState([]);
  const [pestana, setPestana] = useState<"empresa" | "usuario" | "publico">("empresa");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [hilo, setHilo] = useState([]);
  const [respuesta, setRespuesta] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [incluirLinkRecuperacion, setIncluirLinkRecuperacion] = useState(false);
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);
  const [avisoRespuesta, setAvisoRespuesta] = useState("");

  useEffect(() => {
    const unsub = subscribeSupportTickets(setTickets, (err) => setError(err.message || "No se pudieron cargar los tickets."));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribePublicSupportRequests(setSolicitudesPublicas, (err) => setError(err.message || "No se pudieron cargar las solicitudes públicas."));
    return unsub;
  }, []);

  useEffect(() => {
    setSeleccionId(null);
    setRespuesta("");
    setNuevoEstado("");
    setIncluirLinkRecuperacion(false);
    setAvisoRespuesta("");
  }, [pestana]);

  const ticketsEmpresa = useMemo(() => tickets.filter((t) => t.tipo === "empresa"), [tickets]);
  const ticketsUsuario = useMemo(() => tickets.filter((t) => t.tipo === "usuario"), [tickets]);

  const listaActual = pestana === "empresa" ? ticketsEmpresa : pestana === "usuario" ? ticketsUsuario : solicitudesPublicas;

  const listaFiltrada = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return listaActual.filter((item: any) => {
      if (filtroEstado !== "todos" && item.estado !== filtroEstado) return false;
      if (!termino) return true;
      if (pestana === "publico") {
        return coincide(item.nombre, termino) || coincide(item.correo, termino) || coincide(item.asunto, termino) || coincide(item.ticketCodigo, termino);
      }
      return coincide(item.creadoPorNombre, termino) || coincide(item.empresaNombre, termino) || coincide(item.titulo, termino);
    });
  }, [listaActual, filtroEstado, busqueda, pestana]);

  const seleccionado: any = useMemo(
    () => listaActual.find((item: any) => item.id === seleccionId) || null,
    [listaActual, seleccionId]
  );

  useEffect(() => {
    if (pestana === "publico" || !seleccionId) {
      setHilo([]);
      return;
    }
    const unsub = subscribeTicketThread(seleccionId, setHilo, () => {});
    return unsub;
  }, [seleccionId, pestana]);

  const seleccionar = (id: string) => {
    setSeleccionId(id);
    setRespuesta("");
    setNuevoEstado("");
    setIncluirLinkRecuperacion(false);
    setAvisoRespuesta("");
  };

  const enviarRespuesta = async () => {
    if (!seleccionado || !respuesta.trim()) return;
    try {
      setEnviandoRespuesta(true);
      setAvisoRespuesta("");
      if (pestana === "publico") {
        const resultado = await responderSoportePublico({
          id: seleccionado.id,
          respuesta: respuesta.trim(),
          nuevoEstado: nuevoEstado || undefined,
          incluirLinkRecuperacion,
          redirectTo: `${window.location.origin}/auth/registro`,
        });
        setAvisoRespuesta(resultado?.correoEnviado ? "Correo enviado correctamente." : "Se guardó la respuesta, pero el correo no pudo enviarse.");
      } else {
        await responderTicket(seleccionado.id, respuesta.trim(), nuevoEstado || null);
        setAvisoRespuesta("Respuesta enviada al hilo del ticket.");
      }
      setRespuesta("");
      setNuevoEstado("");
      setIncluirLinkRecuperacion(false);
    } catch (err: any) {
      setAvisoRespuesta(err.message || "No se pudo enviar la respuesta.");
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {/* --- Bandeja de soporte --- */}
      <NexxusCard extra="mb-5 w-full p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-lg font-bold text-navy-700 dark:text-white">Bandeja de Soporte</div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, correo, empresa o asunto..."
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal-light dark:text-white"
            />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal-light dark:text-white"
            >
              <option value="todos">Todos los estados</option>
              {(pestana === "publico" ? ESTADOS_PUBLICO : ESTADOS_TICKET).map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4 flex gap-2 border-b border-gray-100 dark:border-white/10">
          {[
            { id: "empresa", label: "Soporte de Empresa", icono: <MdBusiness className="h-4 w-4" />, count: ticketsEmpresa.length },
            { id: "usuario", label: "Soporte de Usuario", icono: <MdPerson className="h-4 w-4" />, count: ticketsUsuario.length },
            { id: "publico", label: "Sin Registrarse", icono: <MdPersonOutline className="h-4 w-4" />, count: solicitudesPublicas.length },
          ].map((tab: any) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPestana(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-bold transition ${
                pestana === tab.id
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {tab.icono}
              {tab.label}
              <span className="rounded-full bg-lightPrimary px-2 py-0.5 text-xs text-brand-500 dark:bg-charcoal-light dark:text-white">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Lista */}
          <div className="max-h-[560px] w-full overflow-y-auto lg:w-2/5">
            {listaFiltrada.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">Sin resultados en esta bandeja.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {listaFiltrada.map((item: any) => {
                  const esPublico = pestana === "publico";
                  const titulo = esPublico ? item.asunto : item.titulo;
                  const subtitulo = esPublico ? item.nombre : `${item.creadoPorNombre} · ${item.empresaNombre}`;
                  const estadoClasses = esPublico ? ESTADO_PUBLICO_CLASSES[item.estado] : ESTADO_TICKET_CLASSES[item.estado];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => seleccionar(item.id)}
                      className={`flex flex-col gap-1.5 rounded-xl border px-4 py-3 text-left transition ${
                        seleccionId === item.id
                          ? "border-brand-500 bg-lightPrimary/60 dark:bg-charcoal-light"
                          : "border-gray-100 hover:border-gray-200 dark:border-white/10 dark:hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-navy-700 dark:text-white">{titulo || "(sin título)"}</span>
                        <Badge classes={PRIORIDAD_CLASSES[item.prioridad]}>{item.prioridad}</Badge>
                      </div>
                      <span className="truncate text-xs text-gray-500 dark:text-gray-400">{subtitulo}</span>
                      <div className="flex items-center justify-between gap-2">
                        <Badge classes={estadoClasses}>{item.estado?.replace("_", " ")}</Badge>
                        <span className="text-xs text-gray-400">{formatoFechaHora(item.createdAt)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detalle */}
          <div className="w-full lg:w-3/5">
            {!seleccionado ? (
              <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-400 dark:border-white/10">
                Selecciona un caso de la lista para ver el detalle completo.
              </div>
            ) : (
              <div className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 dark:border-white/10">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-base font-bold text-navy-700 dark:text-white">
                      {pestana === "publico" ? seleccionado.asunto : seleccionado.titulo}
                    </div>
                    {pestana === "publico" ? (
                      <div className="text-xs font-semibold text-gray-400">{seleccionado.ticketCodigo}</div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge classes={PRIORIDAD_CLASSES[seleccionado.prioridad]}>{seleccionado.prioridad}</Badge>
                    <Badge classes={pestana === "publico" ? ESTADO_PUBLICO_CLASSES[seleccionado.estado] : ESTADO_TICKET_CLASSES[seleccionado.estado]}>
                      {seleccionado.estado?.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                {/* Info del solicitante */}
                <div className="grid grid-cols-1 gap-3 rounded-lg bg-lightPrimary/40 p-3 text-sm dark:bg-charcoal-light sm:grid-cols-2">
                  {pestana === "publico" ? (
                    <>
                      <div className="flex items-center gap-2 text-navy-700 dark:text-white"><MdPersonOutline className="h-4 w-4 text-gray-400" /> {seleccionado.nombre}</div>
                      <div className="flex items-center gap-2 text-navy-700 dark:text-white"><MdMailOutline className="h-4 w-4 text-gray-400" /> {seleccionado.correo}</div>
                      {seleccionado.telefono ? (
                        <div className="flex items-center gap-2 text-navy-700 dark:text-white"><MdPhone className="h-4 w-4 text-gray-400" /> {seleccionado.telefono}</div>
                      ) : null}
                      {seleccionado.empresa ? (
                        <div className="flex items-center gap-2 text-navy-700 dark:text-white"><MdBusiness className="h-4 w-4 text-gray-400" /> {seleccionado.empresa}</div>
                      ) : null}
                      <div className="flex items-center gap-2 text-navy-700 dark:text-white">
                        {seleccionado.origen === "landing" ? <MdLanguage className="h-4 w-4 text-gray-400" /> : <MdPhoneAndroid className="h-4 w-4 text-gray-400" />}
                        Origen: {seleccionado.origen === "landing" ? "Landing" : "App"}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">Categoría: {seleccionado.categoria}</div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-navy-700 dark:text-white"><MdPersonOutline className="h-4 w-4 text-gray-400" /> {seleccionado.creadoPorNombre} ({etiquetaRol(seleccionado.creadoPorRol)})</div>
                      {seleccionado.creadoPorCorreo ? (
                        <div className="flex items-center gap-2 text-navy-700 dark:text-white"><MdMailOutline className="h-4 w-4 text-gray-400" /> {seleccionado.creadoPorCorreo}</div>
                      ) : null}
                      {seleccionado.creadoPorTelefono ? (
                        <div className="flex items-center gap-2 text-navy-700 dark:text-white"><MdPhone className="h-4 w-4 text-gray-400" /> {seleccionado.creadoPorTelefono}</div>
                      ) : null}
                      <div className="flex items-center gap-2 text-navy-700 dark:text-white"><MdBusiness className="h-4 w-4 text-gray-400" /> {seleccionado.empresaNombre}</div>
                      <div className="text-gray-500 dark:text-gray-400">Categoría: {seleccionado.categoria}</div>
                    </>
                  )}
                  <div className="text-gray-500 dark:text-gray-400">Creado: {formatoFechaHora(seleccionado.createdAt)}</div>
                  <div className="text-gray-500 dark:text-gray-400">Actualizado: {formatoFechaHora(seleccionado.updatedAt)}</div>
                </div>

                {/* Descripción original */}
                <div className="rounded-lg border border-gray-100 p-3 text-sm text-navy-700 dark:border-white/10 dark:text-white">
                  {pestana === "publico" ? seleccionado.mensaje : seleccionado.descripcion || "Sin descripción."}
                </div>

                {/* Respuesta previa (público) o hilo (empresa/usuario) */}
                {pestana === "publico" ? (
                  seleccionado.respuestaSoporte ? (
                    <div className="rounded-lg bg-violet-50 p-3 text-sm text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
                      <div className="mb-1 text-xs font-bold uppercase tracking-wide">Última respuesta enviada</div>
                      {seleccionado.respuestaSoporte}
                    </div>
                  ) : null
                ) : (
                  <div className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-lg border border-gray-100 p-3 dark:border-white/10">
                    {hilo.length === 0 ? (
                      <p className="text-xs text-gray-400">Sin mensajes en el hilo todavía.</p>
                    ) : (
                      hilo.map((msg: any) => (
                        <div key={msg.id} className="rounded-lg bg-lightPrimary/40 px-3 py-2 text-sm dark:bg-charcoal-light">
                          <div className="mb-0.5 flex items-center justify-between gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
                            <span>{msg.autorNombre}</span>
                            <span>{formatoFechaHora(msg.createdAt)}</span>
                          </div>
                          <div className="text-navy-700 dark:text-white">{msg.texto}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Formulario de respuesta */}
                <div className="flex flex-col gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
                  <textarea
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    rows={3}
                    placeholder={pestana === "publico" ? "Escribe la respuesta que se enviará por correo..." : "Escribe una respuesta para el hilo del ticket..."}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal-light dark:text-white"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={nuevoEstado}
                        onChange={(e) => setNuevoEstado(e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal-light dark:text-white"
                      >
                        <option value="">Mantener estado actual</option>
                        {(pestana === "publico" ? ESTADOS_PUBLICO : ESTADOS_TICKET).map((op) => (
                          <option key={op.value} value={op.value}>Cambiar a: {op.label}</option>
                        ))}
                      </select>
                      {pestana === "publico" ? (
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                          <input
                            type="checkbox"
                            checked={incluirLinkRecuperacion}
                            onChange={(e) => setIncluirLinkRecuperacion(e.target.checked)}
                          />
                          <MdVpnKey className="h-4 w-4" /> Incluir enlace de recuperación de contraseña
                        </label>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={enviarRespuesta}
                      disabled={enviandoRespuesta || !respuesta.trim()}
                      className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
                    >
                      <MdSend className="h-4 w-4" />
                      {enviandoRespuesta ? "Enviando..." : pestana === "publico" ? "Responder por correo" : "Enviar al hilo"}
                    </button>
                  </div>
                  {avisoRespuesta ? <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{avisoRespuesta}</p> : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </NexxusCard>

      {/* --- Sesiones de impersonación (funcionalidad ya existente) --- */}
      <NexxusCard extra="mb-5 w-full p-4">
        <div className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Nueva sesión de soporte
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <select
            value={empresaSeleccionada}
            onChange={(e) => setEmpresaSeleccionada(e.target.value)}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal-light dark:text-white"
          >
            <option value="">Selecciona una empresa</option>
            {empresas.map((empresa: any) => (
              <option key={empresa.id} value={empresa.id}>{empresa.nombre}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={iniciarSesionSoporte}
            disabled={!empresaSeleccionada || iniciandoSesion}
            className="flex items-center justify-center gap-2 rounded-lg bg-navy-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-navy-800 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            <MdLock className="h-4 w-4" />
            {iniciandoSesion ? "Iniciando..." : "Iniciar sesión de soporte"}
          </button>
        </div>
      </NexxusCard>

      <NexxusCard extra="w-full p-4">
        <RecordsTable title="Sesiones de soporte activas" columnsData={COLUMNAS_SESIONES} tableData={cargandoSesiones ? [] : filasSesiones} />
      </NexxusCard>
    </div>
  );
}
