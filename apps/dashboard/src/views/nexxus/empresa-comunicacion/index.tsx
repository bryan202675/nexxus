import { useEffect, useMemo, useState } from "react";
import { supabase } from "supabaseClient/supabaseConfig";
import {
  MdOutlineCampaign,
  MdOutlineGroups,
  MdOutlinePriorityHigh,
  MdOutlineSearch,
  MdOutlineAdd,
  MdOutlineVisibility,
  MdOutlineDelete,
  MdOutlineHistory,
  MdOutlineNotificationImportant,
  MdOutlineSend,
  MdOutlineApartment,
  MdOutlineBadge,
  MdOutlinePerson,
  MdOutlineClose,
  MdOutlineContentCopy,
  MdOutlineCheck,
  MdOutlineSwapVert,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import Modal from "components/nexxus/Modal";
import Avatar from "components/nexxus/Avatar";
import { useAuth } from "context/AuthContext";
import {
  subscribeAnnouncements,
  subscribeEmpleados,
  subscribeDepartamentos,
  subscribeSedes,
} from "services/adminRepository";
import { etiquetaRol, formatoFecha, formatoFechaHora, ROLE_OPTIONS } from "services/saFormat";

function mapAnuncioRow(row: any) {
  return {
    id: row.id,
    creadoPorId: row.autor_id,
    creadoPorNombre: row.datos?.creadoPorNombre || "Administrador",
    mensaje: row.contenido || "",
    prioridad: row.datos?.prioridad || "Normal",
    alcance: row.datos?.alcance || "todos",
    departamentoDestino: row.datos?.departamentoDestino || null,
    sedeDestino: row.datos?.sedeDestino || null,
    rolDestino: row.datos?.rolDestino || null,
    destinatarioIds: row.datos?.destinatarioIds || [],
    destinatariosTotal: Number(row.datos?.destinatariosTotal) || 0,
    fecha: row.created_at,
    datosRaw: row,
  };
}

const PRIORIDADES_CONFIG: Record<string, { label: string; cls: string; dot: string; icon: any; barBg: string }> = {
  Normal: {
    label: "Normal",
    cls: "bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-400/20 dark:text-blue-300",
    dot: "bg-blue-500",
    icon: MdOutlineCampaign,
    barBg: "bg-blue-500",
  },
  Alta: {
    label: "Alta Prioridad",
    cls: "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-400/20 dark:text-amber-300",
    dot: "bg-amber-500",
    icon: MdOutlineNotificationImportant,
    barBg: "bg-amber-500",
  },
  Urgente: {
    label: "Urgente",
    cls: "bg-rose-500/10 text-rose-600 font-bold border border-rose-500/20 dark:bg-rose-400/20 dark:text-rose-300",
    dot: "bg-rose-500",
    icon: MdOutlinePriorityHigh,
    barBg: "bg-rose-500",
  },
};

// Alcances que el dashboard sabe CREAR
const ALCANCES = [
  { value: "todos", label: "Toda la Empresa" },
  { value: "departamento", label: "Departamento" },
  { value: "sede", label: "Sede de Trabajo" },
  { value: "rol", label: "Rol Específico" },
  { value: "privado", label: "Colaboradores Seleccionados" },
];

const ALCANCE_LABELS = [...ALCANCES, { value: "cargo", label: "Cargo" }];

function formatAlcance(anuncio: any) {
  if (anuncio.departamentoDestino) return `Depto: ${anuncio.departamentoDestino}`;
  if (anuncio.sedeDestino) return `Sede: ${anuncio.sedeDestino}`;
  if (anuncio.rolDestino) return `Rol: ${etiquetaRol(anuncio.rolDestino)}`;
  const alc = (anuncio.alcance || "").toLowerCase().trim();
  if (alc === "todos" || alc === "empresa" || alc === "all" || alc === "general" || alc === "toda la empresa") {
    return "Toda la Empresa";
  }
  if (alc === "privado") return "Colaboradores Seleccionados";
  if (alc === "departamento") return "Departamento";
  if (alc === "sede") return "Sede de Trabajo";
  if (alc === "rol") return "Rol Específico";
  if (alc === "cargo") return "Cargo";
  return anuncio.alcance || "Toda la Empresa";
}

const PAGE_SIZE = 8;

const FORM_VACIO = {
  mensaje: "",
  prioridad: "Normal",
  alcance: "todos",
  departamentoId: "",
  sedeId: "",
  rol: "",
  empleadoIds: [] as string[],
};

export default function ComunicacionAdmin() {
  const { user, perfil, empresaId } = useAuth();

  const [anuncios, setAnuncios] = useState<any[] | null>(null);
  const [empleadosRaw, setEmpleadosRaw] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("todos");
  const [filtroAlcance, setFiltroAlcance] = useState("todos");
  const [ordenFecha, setOrdenFecha] = useState<"recientes" | "antiguos">("recientes");
  const [pagina, setPagina] = useState(1);

  // Modales
  const [showCrearAnuncio, setShowCrearAnuncio] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [publicando, setPublicando] = useState(false);
  const [crearError, setCrearError] = useState("");
  const [selectedAnuncio, setSelectedAnuncio] = useState<any | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!empresaId) return;
    const onErr = (err: any) => setError(err.message || "No se pudo conectar con Supabase.");
    const unsubs = [
      subscribeAnnouncements(empresaId, (docs) => setAnuncios(docs.map((d) => mapAnuncioRow(d.data()))), onErr),
      subscribeEmpleados(empresaId, (docs) => setEmpleadosRaw(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeDepartamentos(empresaId, (docs) => setDepartamentos(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeSedes(empresaId, (docs) => setSedes(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
    ];
    return () => unsubs.forEach((fn) => fn && fn());
  }, [empresaId]);

  const empleados = useMemo(() => {
    const deptoMap = Object.fromEntries(departamentos.map((d) => [d.id, d.nombre]));
    const sedeMap = Object.fromEntries(sedes.map((s) => [s.id, s.nombre]));
    return empleadosRaw.map((u) => ({
      ...u,
      departamento: deptoMap[u.departamento_id] || "",
      sede: sedeMap[u.sede_id] || "",
      activo: u.estado_activo !== false,
    }));
  }, [empleadosRaw, departamentos, sedes]);

  const empleadosActivos = useMemo(
    () => empleados.filter((u) => u.activo !== false && u.estado_activo !== false),
    [empleados]
  );

  const metricas = useMemo(() => {
    const lista = anuncios || [];
    const hoy = new Date();
    const esteMes = lista.filter((a) => {
      const fecha = new Date(a.fecha);
      return (
        !Number.isNaN(fecha.getTime()) &&
        fecha.getMonth() === hoy.getMonth() &&
        fecha.getFullYear() === hoy.getFullYear()
      );
    }).length;

    const totalesDestinatarios = lista.reduce(
      (sum, a) => sum + (a.destinatariosTotal || a.destinatarioIds?.length || empleadosActivos.length || 0),
      0
    );
    const alcancePromedio = lista.length > 0 ? Math.round(totalesDestinatarios / lista.length) : empleadosActivos.length;
    const urgentes = lista.filter((a) => a.prioridad === "Urgente").length;

    return { esteMes, total: lista.length, alcancePromedio, urgentes };
  }, [anuncios, empleadosActivos]);

  const conteosPrioridad = useMemo(() => {
    const lista = anuncios || [];
    return {
      todos: lista.length,
      Normal: lista.filter((a) => a.prioridad === "Normal").length,
      Alta: lista.filter((a) => a.prioridad === "Alta").length,
      Urgente: lista.filter((a) => a.prioridad === "Urgente").length,
    };
  }, [anuncios]);

  // Filtrado y ordenamiento de más reciente a más viejo
  const anunciosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    const getTimestamp = (val: any) => {
      if (!val) return 0;
      const t = new Date(val).getTime();
      return Number.isNaN(t) ? 0 : t;
    };

    return (anuncios || [])
      .slice()
      .sort((a, b) => {
        const timeA = getTimestamp(a.fecha);
        const timeB = getTimestamp(b.fecha);
        return ordenFecha === "recientes" ? timeB - timeA : timeA - timeB;
      })
      .filter((a) => {
        if (filtroPrioridad !== "todos" && a.prioridad !== filtroPrioridad) return false;
        if (filtroAlcance !== "todos") {
          const alcNorm = (a.alcance || "").toLowerCase();
          if (filtroAlcance === "todos" || filtroAlcance === "empresa") {
            if (alcNorm !== "todos" && alcNorm !== "empresa" && alcNorm !== "all") return false;
          } else if (alcNorm !== filtroAlcance) {
            return false;
          }
        }

        if (!q) return true;
        const campos = [a.mensaje, a.creadoPorNombre, a.alcance, a.prioridad, a.departamentoDestino, a.sedeDestino];
        return campos.some((c) => (c || "").toLowerCase().includes(q));
      });
  }, [anuncios, busqueda, filtroPrioridad, filtroAlcance, ordenFecha]);

  const totalPaginas = Math.max(1, Math.ceil(anunciosFiltrados.length / PAGE_SIZE));
  const anunciosPaginados = useMemo(() => {
    const start = (pagina - 1) * PAGE_SIZE;
    return anunciosFiltrados.slice(start, start + PAGE_SIZE);
  }, [anunciosFiltrados, pagina]);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroPrioridad, filtroAlcance, ordenFecha]);

  const toggleEmpleado = (id: string) => {
    setForm((f) => {
      const seleccionados = new Set(f.empleadoIds);
      if (seleccionados.has(id)) seleccionados.delete(id);
      else seleccionados.add(id);
      return { ...f, empleadoIds: [...seleccionados] };
    });
  };

  const resolverDestinatarios = () => {
    if (form.alcance === "todos") return empleadosActivos;
    if (form.alcance === "departamento") {
      const dep = departamentos.find((d) => d.id === form.departamentoId);
      const nombreDep = (dep?.nombre || "").trim().toLowerCase();
      if (!nombreDep) return [];
      return empleadosActivos.filter((u) => (u.departamento || "").trim().toLowerCase() === nombreDep);
    }
    if (form.alcance === "sede") {
      const sede = sedes.find((s) => s.id === form.sedeId);
      const nombreSede = (sede?.nombre || "").trim().toLowerCase();
      if (!nombreSede) return [];
      return empleadosActivos.filter((u) => (u.sede || "").trim().toLowerCase() === nombreSede);
    }
    if (form.alcance === "rol") {
      if (!form.rol) return [];
      return empleadosActivos.filter((u) => u.rol === form.rol);
    }
    if (form.alcance === "privado") {
      return empleadosActivos.filter((u) => form.empleadoIds.includes(u.id));
    }
    return [];
  };

  const handlePublicar = async (e: any) => {
    e.preventDefault();
    if (!empresaId || !user) return;
    if (!form.mensaje.trim()) {
      setCrearError("Escribe el contenido del anuncio.");
      return;
    }

    const destinatarios = resolverDestinatarios();
    if (destinatarios.length === 0) {
      setCrearError("No hay destinatarios encontrados para el alcance seleccionado.");
      return;
    }

    setPublicando(true);
    setCrearError("");
    try {
      const dep = departamentos.find((d) => d.id === form.departamentoId);
      const sede = sedes.find((s) => s.id === form.sedeId);

      const { error: insertError } = await supabase.from("anuncios").insert({
        empresa_id: empresaId,
        autor_id: user.id,
        titulo: form.alcance,
        contenido: form.mensaje.trim(),
        datos: {
          creadoPorNombre: perfil?.nombre || user.email || "Admin",
          prioridad: form.prioridad,
          alcance: form.alcance,
          departamentoDestino: dep?.nombre || null,
          sedeDestino: sede?.nombre || null,
          rolDestino: form.alcance === "rol" ? form.rol : null,
          destinatarioIds: destinatarios.map((d) => d.id),
          destinatariosTotal: destinatarios.length,
        },
      });
      if (insertError) throw insertError;

      // Generar notificaciones en segundo plano
      try {
        await supabase.from("notificaciones").insert(
          destinatarios.map((dest) => ({
            empresa_id: empresaId,
            usuario_id: dest.id,
            tipo: "anuncio",
            titulo: form.prioridad === "Urgente" ? "⚠️ Anuncio Urgente" : "Nuevo anuncio corporativo",
            cuerpo: form.mensaje.trim().slice(0, 150),
          }))
        );
      } catch {
        // Notificación auxiliar
      }

      await supabase.from("audit_logs").insert({
        empresa_id: empresaId,
        actor_id: user.id,
        accion: "Publicó un anuncio",
        modulo: "Comunicación",
        detalles: `Anuncio enviado a ${destinatarios.length} colaborador(es) (${form.alcance})`,
      });

      setForm(FORM_VACIO);
      setShowCrearAnuncio(false);
    } catch (err: any) {
      setCrearError(err.message || "No se pudo publicar el anuncio.");
    } finally {
      setPublicando(false);
    }
  };

  const handleEliminarAnuncio = async (anuncio: any) => {
    if (!window.confirm("¿Eliminar este comunicado del historial corporativo?")) return;
    setBusyId(anuncio.id);
    setError("");
    try {
      const { error: delError } = await supabase.from("anuncios").delete().eq("id", anuncio.id);
      if (delError) throw delError;
      if (selectedAnuncio?.id === anuncio.id) setSelectedAnuncio(null);
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar el comunicado.");
    } finally {
      setBusyId("");
    }
  };

  const handleCopiarMensaje = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const cargando = anuncios === null;

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
    <div className="flex flex-col gap-5 pb-6">
      {/* Banner de error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Header & Acciones Rápidas */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-navy-700 dark:text-white">
              Comunicación & Difusión Corporativa
            </h2>
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
              {metricas.total} comunicados emitidos
            </span>
          </div>
          <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-white/60">
            Emisión de comunicados oficiales, avisos prioritarios y novedades para la organización.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCrearError("");
            setForm(FORM_VACIO);
            setShowCrearAnuncio(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-95 dark:bg-brand-400"
        >
          <MdOutlineAdd className="h-4 w-4" />
          <span>Nuevo Anuncio</span>
        </button>
      </div>

      {/* Grid Asimétrico: Hero Card (7 cols) + Right Stack (5 cols) */}
      {(() => {
        const total = Math.max(metricas.total, 1);
        const hayAnuncios = metricas.total > 0;
        const normalPct = Math.round((conteosPrioridad.Normal / total) * 100);
        const altaPct = Math.round((conteosPrioridad.Alta / total) * 100);
        const urgentePct = Math.round((conteosPrioridad.Urgente / total) * 100);

        return (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Hero Card Principal (7 cols) */}
            <div className="lg:col-span-7">
              <NexxusCard extra="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-navy-700 dark:text-white">
                        Emisión & Circulares Corporativas
                      </span>
                      <span className="ml-2 text-xs font-medium text-gray-400 dark:text-white/40">
                        · Difusión de Información
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        metricas.urgentes > 0
                          ? "bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300"
                          : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                      }`}
                    >
                      {metricas.urgentes > 0 ? `${metricas.urgentes} urgentes activos` : "Canal al día"}
                    </span>
                  </div>

                  {/* Número Principal */}
                  <div className="mt-4">
                    {metricas.esteMes > 0 ? (
                      <div>
                        <p className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-navy-700 dark:text-white truncate">
                          {metricas.esteMes}
                        </p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <span>Comunicados emitidos este mes</span>
                          <span className="font-normal text-gray-400 dark:text-white/40">
                            · {metricas.alcancePromedio} colaboradores alcanzados en promedio
                          </span>
                        </p>
                      </div>
                    ) : (
                      <div className="py-2">
                        <p className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                          Sin comunicados este mes
                        </p>
                        <p className="mt-1 text-xs font-medium text-gray-400 dark:text-white/50">
                          Puedes emitir avisos oficiales y circulares a toda la organización o departamentos específicos.
                        </p>
                      </div>
                    )}

                    <p className="mt-2 text-xs font-medium text-gray-500 dark:text-white/60">
                      {conteosPrioridad.Normal} informativos · {conteosPrioridad.Alta} de alta prioridad · {conteosPrioridad.Urgente} urgentes
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  {/* Barra de Distribución Proporcional */}
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                    {hayAnuncios ? (
                      <>
                        <div
                          style={{ width: `${Math.max(normalPct, 5)}%` }}
                          className="h-full bg-blue-500 transition-all duration-500"
                          title={`Normal: ${conteosPrioridad.Normal}`}
                        />
                        <div
                          style={{ width: `${altaPct}%` }}
                          className="h-full bg-amber-500 transition-all duration-500"
                          title={`Alta Prioridad: ${conteosPrioridad.Alta}`}
                        />
                        <div
                          style={{ width: `${urgentePct}%` }}
                          className="h-full bg-rose-500 transition-all duration-500"
                          title={`Urgentes: ${conteosPrioridad.Urgente}`}
                        />
                      </>
                    ) : (
                      <div className="h-full w-full bg-gray-200/50 dark:bg-white/5" />
                    )}
                  </div>

                  {/* Leyenda con Métricas */}
                  {hayAnuncios ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            {conteosPrioridad.Normal}
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Normal ({normalPct}%)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            {conteosPrioridad.Alta}
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Alta Prioridad ({altaPct}%)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            {conteosPrioridad.Urgente}
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Urgente ({urgentePct}%)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            ~{metricas.alcancePromedio}
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Alcance Promedio
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] font-medium text-gray-400 dark:text-white/40">
                      Sin comunicados emitidos en el sistema
                    </p>
                  )}
                </div>
              </NexxusCard>
            </div>

            {/* Right Stack of 3 Cards (5 cols) - Alineadas a la izquierda */}
            <div className="flex flex-col gap-4 lg:col-span-5">
              {/* Card 1: Alcance Promedio */}
              <NexxusCard extra="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-white/50">
                    Alcance Promedio
                  </span>
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
                    Audiencia activa
                  </span>
                </div>
                <div className="mt-3">
                  {metricas.alcancePromedio > 0 ? (
                    <p className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
                      {metricas.alcancePromedio} <span className="text-xs font-medium text-gray-400">colaboradores</span>
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-gray-400 dark:text-white/50">
                      Sin alcance promedio registrado
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-white/40">
                    Promedio de destinatarios notificados en cada emisión.
                  </p>
                </div>
              </NexxusCard>

              {/* Card 2: Anuncios Urgentes */}
              <NexxusCard extra="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-white/50">
                    Alertas Críticas & Urgentes
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      metricas.urgentes > 0
                        ? "bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300"
                        : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                    }`}
                  >
                    {metricas.urgentes > 0 ? "Atención activa" : "Sin alertas"}
                  </span>
                </div>
                <div className="mt-3">
                  {metricas.urgentes > 0 ? (
                    <p className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                      {metricas.urgentes} <span className="text-xs font-medium text-gray-400">alertas críticas</span>
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      Sin comunicados urgentes activos
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-white/40">
                    Avisos de máxima prioridad que requieren lectura inmediata.
                  </p>
                </div>
              </NexxusCard>

              {/* Card 3: Total Histórico */}
              <NexxusCard extra="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-white/50">
                    Total Histórico
                  </span>
                  <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-bold text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                    Registro corporativo
                  </span>
                </div>
                <div className="mt-3">
                  {metricas.total > 0 ? (
                    <p className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
                      {metricas.total} <span className="text-xs font-medium text-gray-400">circulares</span>
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-gray-400 dark:text-white/50">
                      Sin comunicados en el registro
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-white/40">
                    Acervo completo de anuncios corporativos emitidos.
                  </p>
                </div>
              </NexxusCard>
            </div>
          </div>
        );
      })()}

      {/* Card principal con Historial y Filtros */}
      <NexxusCard extra="p-5 sm:p-6 flex flex-col gap-5" delay={100}>
        {/* Barra de Filtros Segmentada y Búsqueda */}
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
          {/* Segmented Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-gray-100/80 p-1 dark:bg-charcoal">
            <button
              type="button"
              onClick={() => setFiltroPrioridad("todos")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filtroPrioridad === "todos"
                  ? "bg-navy-700 text-white shadow-sm dark:bg-white dark:text-navy-700"
                  : "text-gray-600 hover:text-navy-700 hover:bg-white/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
              }`}
            >
              <span>Todos</span>
              <span
                className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                  filtroPrioridad === "todos"
                    ? "bg-white/20 text-white dark:bg-navy-700/20 dark:text-navy-700"
                    : "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70"
                }`}
              >
                {conteosPrioridad.todos}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroPrioridad("Normal")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filtroPrioridad === "Normal"
                  ? "bg-navy-700 text-white shadow-sm dark:bg-white dark:text-navy-700"
                  : "text-gray-600 hover:text-navy-700 hover:bg-white/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
              }`}
            >
              <span>Normal</span>
              <span
                className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                  filtroPrioridad === "Normal"
                    ? "bg-white/20 text-white dark:bg-navy-700/20 dark:text-navy-700"
                    : "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70"
                }`}
              >
                {conteosPrioridad.Normal}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroPrioridad("Alta")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filtroPrioridad === "Alta"
                  ? "bg-navy-700 text-white shadow-sm dark:bg-white dark:text-navy-700"
                  : "text-gray-600 hover:text-navy-700 hover:bg-white/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
              }`}
            >
              <span>Alta Prioridad</span>
              {conteosPrioridad.Alta > 0 && (
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                    filtroPrioridad === "Alta"
                      ? "bg-white/20 text-white dark:bg-navy-700/20 dark:text-navy-700"
                      : "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70"
                  }`}
                >
                  {conteosPrioridad.Alta}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFiltroPrioridad("Urgente")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filtroPrioridad === "Urgente"
                  ? "bg-navy-700 text-white shadow-sm dark:bg-white dark:text-navy-700"
                  : "text-gray-600 hover:text-navy-700 hover:bg-white/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
              }`}
            >
              <span>Urgente</span>
              {conteosPrioridad.Urgente > 0 && (
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                    filtroPrioridad === "Urgente"
                      ? "bg-white/20 text-white dark:bg-navy-700/20 dark:text-navy-700"
                      : "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70"
                  }`}
                >
                  {conteosPrioridad.Urgente}
                </span>
              )}
            </button>
          </div>

          {/* Buscador, Alcance & Orden */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <MdOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/40" />
              <input
                type="text"
                placeholder="Buscar por mensaje, autor..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-9 pr-8 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  title="Limpiar búsqueda"
                >
                  <MdOutlineClose className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              value={filtroAlcance}
              onChange={(e) => setFiltroAlcance(e.target.value)}
              className="h-10 rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
            >
              <option value="todos">Todos los alcances</option>
              {ALCANCE_LABELS.map((alc) => (
                <option key={alc.value} value={alc.value}>
                  {alc.label}
                </option>
              ))}
            </select>

            <select
              value={ordenFecha}
              onChange={(e) => setOrdenFecha(e.target.value as "recientes" | "antiguos")}
              className="h-10 rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
              title="Criterio de ordenamiento"
            >
              <option value="recientes">Más recientes primero</option>
              <option value="antiguos">Más antiguos primero</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        {cargando ? (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
            <p className="text-xs font-medium text-gray-500 dark:text-white/60">
              Cargando comunicados...
            </p>
          </div>
        ) : anunciosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-14 text-center dark:border-white/10">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/40">
              <MdOutlineCampaign className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
              No se encontraron comunicados
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-white/50 max-w-sm">
              {busqueda || filtroPrioridad !== "todos" || filtroAlcance !== "todos"
                ? "Prueba a cambiar los filtros o el término de búsqueda para ver más resultados."
                : "Publica tu primer comunicado corporativo haciendo clic en el botón 'Nuevo Anuncio'."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/5">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 dark:border-white/10 dark:bg-white/[0.02]">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Mensaje / Comunicado
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Alcance
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Prioridad
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Destinatarios
                  </th>
                  <th
                    onClick={() => setOrdenFecha((prev) => (prev === "recientes" ? "antiguos" : "recientes"))}
                    className="cursor-pointer select-none px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 transition hover:text-navy-700 dark:text-white/40 dark:hover:text-white"
                    title="Alternar orden por fecha"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Fecha de Emisión</span>
                      <span className="inline-flex items-center rounded bg-gray-200/80 px-1 py-0.5 text-[9px] font-bold text-gray-600 dark:bg-white/10 dark:text-white/70">
                        {ordenFecha === "recientes" ? "Recientes ↓" : "Antiguos ↑"}
                      </span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {anunciosPaginados.map((anuncio) => {
                  const prioInfo = PRIORIDADES_CONFIG[anuncio.prioridad] || PRIORIDADES_CONFIG.Normal;
                  const Icon = prioInfo.icon;
                  const isBusy = busyId === anuncio.id;
                  const alcanceTexto = formatAlcance(anuncio);
                  const countDest =
                    anuncio.destinatariosTotal || anuncio.destinatarioIds?.length || empleadosActivos.length;

                  return (
                    <tr
                      key={anuncio.id}
                      onClick={() => setSelectedAnuncio(anuncio)}
                      className="group cursor-pointer transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                    >
                      {/* Mensaje */}
                      <td className="min-w-[280px] max-w-md px-4 py-3.5">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                              anuncio.prioridad === "Urgente"
                                ? "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
                                : anuncio.prioridad === "Alta"
                                ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                                : "bg-brand-500/10 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300"
                            }`}
                          >
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-xs font-bold text-navy-700 group-hover:text-brand-600 transition dark:text-white dark:group-hover:text-brand-300">
                              {anuncio.mensaje}
                            </p>
                            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-white/50">
                              Por <span className="font-semibold text-gray-600 dark:text-white/70">{anuncio.creadoPorNombre}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Alcance */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-white/80">
                          {alcanceTexto}
                        </span>
                      </td>

                      {/* Prioridad */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${prioInfo.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${prioInfo.dot}`} />
                          {prioInfo.label}
                        </span>
                      </td>

                      {/* Destinatarios */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold text-gray-600 dark:text-white/70">
                        <div className="flex items-center gap-1.5">
                          <MdOutlineGroups className="h-4 w-4 text-gray-400" />
                          <span>
                            {countDest} {countDest === 1 ? "colaborador" : "colaboradores"}
                          </span>
                        </div>
                      </td>

                      {/* Fecha */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-gray-500 dark:text-white/60">
                        {formatoFechaHora(anuncio.fecha)}
                      </td>

                      {/* Acciones */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedAnuncio(anuncio)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-700 shadow-sm transition hover:bg-gray-50 hover:border-gray-300 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
                          >
                            <MdOutlineVisibility className="h-3.5 w-3.5" />
                            <span>Ver</span>
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleEliminarAnuncio(anuncio)}
                            className="inline-flex items-center rounded-lg p-1.5 text-xs font-semibold text-gray-400 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-40 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                            title="Eliminar comunicado"
                          >
                            <MdOutlineDelete className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginador */}
        {anunciosFiltrados.length > PAGE_SIZE && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row dark:border-white/10">
            <p className="text-xs font-medium text-gray-500 dark:text-white/60">
              Página {pagina} de {totalPaginas} · {anunciosFiltrados.length} comunicados en total
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:bg-charcoal dark:text-white"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:bg-charcoal dark:text-white"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </NexxusCard>

      {/* Modal: Publicar Nuevo Comunicado */}
      <Modal
        isOpen={showCrearAnuncio}
        onClose={() => setShowCrearAnuncio(false)}
        title="Publicar Nuevo Comunicado"
        width="max-w-lg"
      >
        <div className="py-2">
          <form onSubmit={handlePublicar} className="flex flex-col gap-4">
            <div>
              <label
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50"
                htmlFor="anuncio-mensaje"
              >
                Contenido del Comunicado *
              </label>
              <textarea
                id="anuncio-mensaje"
                rows={4}
                placeholder="Escribe el mensaje o circular oficial para la organización..."
                value={form.mensaje}
                onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-xs font-medium text-navy-700 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-400 dark:focus:bg-[#1B254B] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50"
                  htmlFor="anuncio-prioridad"
                >
                  Nivel de Prioridad
                </label>
                <select
                  id="anuncio-prioridad"
                  value={form.prioridad}
                  onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
                >
                  <option value="Normal">Normal</option>
                  <option value="Alta">Alta Prioridad</option>
                  <option value="Urgente">Urgente / Crítico</option>
                </select>
              </div>

              <div>
                <label
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50"
                  htmlFor="anuncio-alcance"
                >
                  Alcance / Audiencia
                </label>
                <select
                  id="anuncio-alcance"
                  value={form.alcance}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      alcance: e.target.value,
                      departamentoId: "",
                      sedeId: "",
                      rol: "",
                      empleadoIds: [],
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
                >
                  {ALCANCES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Condicionales por Alcance */}
            {form.alcance === "departamento" && (
              <div>
                <label
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50"
                  htmlFor="anuncio-depto"
                >
                  Seleccionar Departamento
                </label>
                <select
                  id="anuncio-depto"
                  value={form.departamentoId}
                  onChange={(e) => setForm((f) => ({ ...f, departamentoId: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
                >
                  <option value="">Selecciona un departamento...</option>
                  {departamentos.map((dep) => (
                    <option key={dep.id} value={dep.id}>
                      {dep.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.alcance === "sede" && (
              <div>
                <label
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50"
                  htmlFor="anuncio-sede"
                >
                  Seleccionar Sede de Trabajo
                </label>
                <select
                  id="anuncio-sede"
                  value={form.sedeId}
                  onChange={(e) => setForm((f) => ({ ...f, sedeId: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
                >
                  <option value="">Selecciona una sede...</option>
                  {sedes.map((sede) => (
                    <option key={sede.id} value={sede.id}>
                      {sede.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.alcance === "rol" && (
              <div>
                <label
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50"
                  htmlFor="anuncio-rol"
                >
                  Seleccionar Rol Destinatario
                </label>
                <select
                  id="anuncio-rol"
                  value={form.rol}
                  onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
                >
                  <option value="">Selecciona un rol...</option>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {etiquetaRol(r.value)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.alcance === "privado" && (
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">
                  Colaboradores Destinatarios ({form.empleadoIds.length} seleccionados)
                </p>
                <div className="max-h-40 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50/50 p-2.5 dark:border-white/10 dark:bg-charcoal">
                  {empleadosActivos.length === 0 ? (
                    <p className="p-2 text-xs text-gray-400">No hay colaboradores activos disponibles.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {empleadosActivos.map((emp) => (
                        <label
                          key={emp.id}
                          className="flex items-center gap-2 rounded-xl p-2 transition hover:bg-white cursor-pointer dark:hover:bg-white/5"
                        >
                          <input
                            type="checkbox"
                            checked={form.empleadoIds.includes(emp.id)}
                            onChange={() => toggleEmpleado(emp.id)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-400"
                          />
                          <Avatar name={emp.nombre} size={7} />
                          <span className="truncate text-xs font-semibold text-navy-700 dark:text-white">
                            {emp.nombre}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {crearError && <p className="text-xs font-bold text-rose-500">{crearError}</p>}

            <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-3.5 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowCrearAnuncio(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-100 active:scale-95 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={publicando}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 disabled:opacity-50 active:scale-95"
              >
                <MdOutlineSend className="h-3.5 w-3.5" />
                <span>{publicando ? "Publicando..." : "Publicar Anuncio"}</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Detalle del Comunicado */}
      <Modal
        isOpen={!!selectedAnuncio}
        onClose={() => setSelectedAnuncio(null)}
        title="Detalle del Comunicado"
        width="max-w-md"
      >
        {selectedAnuncio ? (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center justify-between rounded-2xl bg-brand-500/[0.06] p-4 dark:bg-brand-500/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/20">
                  <MdOutlineCampaign className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-navy-700 dark:text-white">
                    {selectedAnuncio.creadoPorNombre}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/60">
                    {formatoFechaHora(selectedAnuncio.fecha)}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  (PRIORIDADES_CONFIG[selectedAnuncio.prioridad] || PRIORIDADES_CONFIG.Normal).cls
                }`}
              >
                {(PRIORIDADES_CONFIG[selectedAnuncio.prioridad] || PRIORIDADES_CONFIG.Normal).label}
              </span>
            </div>

            {/* Mensaje Completo */}
            <div className="relative rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-white/5 dark:bg-charcoal">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                  Mensaje Oficial
                </p>
                <button
                  type="button"
                  onClick={() => handleCopiarMensaje(selectedAnuncio.mensaje)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  {copiado ? (
                    <>
                      <MdOutlineCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copiado</span>
                    </>
                  ) : (
                    <>
                      <MdOutlineContentCopy className="h-3 w-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs leading-relaxed text-navy-700 dark:text-white/90 font-medium whitespace-pre-wrap">
                {selectedAnuncio.mensaje}
              </p>
            </div>

            {/* Metadatos de Alcance y Destinatarios */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 dark:border-white/5 dark:bg-charcoal">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                  Alcance
                </p>
                <p className="mt-1 text-xs font-bold text-navy-700 dark:text-white">
                  {formatAlcance(selectedAnuncio)}
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 dark:border-white/5 dark:bg-charcoal">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                  Audiencia
                </p>
                <p className="mt-1 text-xs font-bold text-navy-700 dark:text-white">
                  {selectedAnuncio.destinatariosTotal ||
                    selectedAnuncio.destinatarioIds?.length ||
                    empleadosActivos.length}{" "}
                  destinatarios
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSelectedAnuncio(null)}
                className="rounded-xl bg-gray-100 px-5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 transition active:scale-95 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
