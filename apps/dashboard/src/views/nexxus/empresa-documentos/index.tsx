import { useEffect, useMemo, useState } from "react";
import { supabase } from "supabaseClient/supabaseConfig";
import {
  MdOutlineDescription,
  MdOutlineStorage,
  MdOutlineMarkEmailUnread,
  MdOutlineCalendarMonth,
  MdOutlineSearch,
  MdOutlineCloudUpload,
  MdOutlinePictureAsPdf,
  MdOutlineTableChart,
  MdOutlineImage,
  MdOutlineFolder,
  MdOutlineDelete,
  MdOutlineOpenInNew,
  MdOutlineCheck,
  MdOutlineAdd,
  MdOutlineVisibility,
  MdOutlineClose,
  MdOutlineCheckCircle,
  MdOutlineInsertDriveFile,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import Modal from "components/nexxus/Modal";
import Avatar from "components/nexxus/Avatar";
import { useAuth } from "context/AuthContext";
import { subscribeDocumentos, subscribeEmpleados, subscribeDepartamentos } from "services/adminRepository";
import { formatoFecha, formatoFechaHora } from "services/saFormat";

function mapDocumentoRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    titulo: row.titulo || row.nombre || "Documento",
    tipo: row.categoria || "general",
    size: Number(row.tamano_bytes) || Number(row.size) || 0,
    fechaSubida: row.created_at,
    leido: Boolean(row.leido),
    createdBy: row.usuario_id || row.created_by,
    url: row.url || row.datos?.url || "",
    departamentoId: row.departamento_id || row.datos?.departamentoId || "",
    descripcion: row.descripcion || row.datos?.descripcion || "",
    datosRaw: row,
  };
}

const TIPO_CONFIG: Record<string, { label: string; badge: string; icon: any; color: string; barBg: string }> = {
  nomina: {
    label: "Nómina & Recibos",
    badge: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-400/20 dark:text-emerald-300",
    icon: MdOutlineTableChart,
    color: "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-400/20 dark:text-emerald-300",
    barBg: "bg-emerald-500",
  },
  contrato: {
    label: "Contratos & Legal",
    badge: "bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-400/20 dark:text-blue-300",
    icon: MdOutlineDescription,
    color: "text-blue-500 bg-blue-500/10 dark:bg-blue-400/20 dark:text-blue-300",
    barBg: "bg-blue-500",
  },
  rrhh: {
    label: "Políticas & RRHH",
    badge: "bg-purple-500/10 text-purple-600 border border-purple-500/20 dark:bg-purple-400/20 dark:text-purple-300",
    icon: MdOutlineFolder,
    color: "text-purple-500 bg-purple-500/10 dark:bg-purple-400/20 dark:text-purple-300",
    barBg: "bg-purple-500",
  },
  certificado: {
    label: "Certificados",
    badge: "bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 dark:bg-cyan-400/20 dark:text-cyan-300",
    icon: MdOutlinePictureAsPdf,
    color: "text-cyan-500 bg-cyan-500/10 dark:bg-cyan-400/20 dark:text-cyan-300",
    barBg: "bg-cyan-500",
  },
  evaluacion: {
    label: "Evaluaciones",
    badge: "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-400/20 dark:text-amber-300",
    icon: MdOutlineDescription,
    color: "text-amber-500 bg-amber-500/10 dark:bg-amber-400/20 dark:text-amber-300",
    barBg: "bg-amber-500",
  },
  general: {
    label: "General / Varios",
    badge: "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-white/10 dark:text-white/70 dark:border-white/10",
    icon: MdOutlineFolder,
    color: "text-gray-500 bg-gray-100 dark:bg-white/10 dark:text-white/60",
    barBg: "bg-gray-400",
  },
};

function getTipoStyle(tipoRaw: string) {
  const key = (tipoRaw || "").trim().toLowerCase();
  if (TIPO_CONFIG[key]) return TIPO_CONFIG[key];
  if (key.includes("nom") || key.includes("recib")) return TIPO_CONFIG.nomina;
  if (key.includes("cont") || key.includes("leg")) return TIPO_CONFIG.contrato;
  if (key.includes("rrh") || key.includes("pol")) return TIPO_CONFIG.rrhh;
  if (key.includes("cert")) return TIPO_CONFIG.certificado;
  if (key.includes("eval")) return TIPO_CONFIG.evaluacion;

  return TIPO_CONFIG.general;
}

function formatBytes(bytes: number | string | null | undefined) {
  const value = Number(bytes) || 0;
  if (value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)));
  const size = value / 1024 ** exponent;
  return `${exponent === 0 ? size : size.toFixed(1)} ${units[exponent]}`;
}

const PAGE_SIZE = 8;

export default function GestionDocumentos() {
  const { user, perfil, empresaId } = useAuth();

  const [documentos, setDocumentos] = useState<any[] | null>(null);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroLectura, setFiltroLectura] = useState("todos");
  const [pagina, setPagina] = useState(1);

  // Modal Subir Documento
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    titulo: "",
    categoria: "rrhh",
    departamentoId: "",
    descripcion: "",
    url: "",
  });
  const [subiendo, setSubiendo] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Modal Detalle Documento
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  useEffect(() => {
    if (!empresaId) return undefined;
    const onErr = (err: any) => {
      setError(err?.message || "No se pudo conectar con Supabase.");
      setDocumentos((prev) => prev ?? []);
      setEmpleados((prev) => prev ?? []);
    };
    const unsubs = [
      subscribeDocumentos(empresaId, (docs) => setDocumentos(docs.map((d) => mapDocumentoRow(d.data())).filter(Boolean)), onErr),
      subscribeEmpleados(empresaId, (docs) => setEmpleados(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeDepartamentos(empresaId, (docs) => setDepartamentos(docs.map((d) => ({ id: d.id, ...d.data() }))), () => {}),
    ];
    return () => unsubs.forEach((fn) => fn && fn());
  }, [empresaId]);

  const empleadosPorId = useMemo(() => {
    const map = new Map<string, any>();
    empleados.forEach((e) => map.set(e.id, e));
    return map;
  }, [empleados]);

  const deptosPorId = useMemo(() => {
    const map = new Map<string, string>();
    departamentos.forEach((d) => map.set(d.id, d.nombre));
    return map;
  }, [departamentos]);

  const stats = useMemo(() => {
    const lista = documentos || [];
    const totalBytes = lista.reduce((sum, d) => sum + (Number(d.size) || 0), 0);
    const uploadCount = lista.length;
    const sinLeer = lista.filter((d) => !d.leido).length;
    const leidos = lista.filter((d) => d.leido).length;

    const ahora = new Date();
    const esteMes = lista.filter((d) => {
      const fecha = new Date(d.fechaSubida);
      if (Number.isNaN(fecha.getTime())) return false;
      return fecha.getFullYear() === ahora.getFullYear() && fecha.getMonth() === ahora.getMonth();
    }).length;

    return { totalBytes, uploadCount, sinLeer, leidos, esteMes };
  }, [documentos]);

  // Conteos por categoría
  const categoryCounts = useMemo(() => {
    const lista = documentos || [];
    let rrhh = 0;
    let contratos = 0;
    let nomina = 0;
    let certificados = 0;
    let otros = 0;

    lista.forEach((d) => {
      const t = (d.tipo || "").toLowerCase();
      if (t.includes("rrh") || t.includes("pol")) rrhh++;
      else if (t.includes("cont") || t.includes("leg")) contratos++;
      else if (t.includes("nom") || t.includes("recib")) nomina++;
      else if (t.includes("cert")) certificados++;
      else otros++;
    });

    return { rrhh, contratos, nomina, certificados, otros };
  }, [documentos]);

  // Filtrado de documentos
  const documentosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return (documentos || []).filter((doc) => {
      if (filtroTipo !== "todos") {
        const t = (doc.tipo || "").toLowerCase();
        if (filtroTipo === "rrhh" && !t.includes("rrh") && !t.includes("pol")) return false;
        if (filtroTipo === "contrato" && !t.includes("cont") && !t.includes("leg")) return false;
        if (filtroTipo === "nomina" && !t.includes("nom") && !t.includes("recib")) return false;
        if (filtroTipo === "certificado" && !t.includes("cert")) return false;
      }
      if (filtroLectura === "leidos" && !doc.leido) return false;
      if (filtroLectura === "sinLeer" && doc.leido) return false;

      if (!q) return true;
      const autor = empleadosPorId.get(doc.createdBy)?.nombre || "";
      const depto = deptosPorId.get(doc.departamentoId) || "";
      const campos = [doc.titulo, doc.tipo, doc.descripcion, autor, depto];
      return campos.some((c) => (c || "").toLowerCase().includes(q));
    });
  }, [documentos, busqueda, filtroTipo, filtroLectura, empleadosPorId, deptosPorId]);

  const totalPaginas = Math.max(1, Math.ceil(documentosFiltrados.length / PAGE_SIZE));
  const documentosPaginados = useMemo(() => {
    const start = (pagina - 1) * PAGE_SIZE;
    return documentosFiltrados.slice(start, start + PAGE_SIZE);
  }, [documentosFiltrados, pagina]);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroTipo, filtroLectura]);

  async function handleToggleLeido(documento: any) {
    setBusyId(documento.id);
    setError("");
    try {
      const { error: updateError } = await supabase
        .from("documentos")
        .update({ leido: !documento.leido })
        .eq("id", documento.id);
      if (updateError) throw updateError;
    } catch (err: any) {
      setError(err.message || "No se pudo actualizar el estado de lectura.");
    } finally {
      setBusyId("");
    }
  }

  async function handleEliminar(documento: any) {
    if (!window.confirm(`¿Eliminar el documento "${documento.titulo}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setBusyId(documento.id);
    setError("");
    try {
      const { error: deleteError } = await supabase.from("documentos").delete().eq("id", documento.id);
      if (deleteError) throw deleteError;
      if (selectedDoc?.id === documento.id) setSelectedDoc(null);
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar el documento.");
    } finally {
      setBusyId("");
    }
  }

  async function handleSubirDocumento(e: any) {
    e.preventDefault();
    if (!uploadForm.titulo.trim()) {
      setUploadError("El título del documento es obligatorio.");
      return;
    }
    setSubiendo(true);
    setUploadError("");

    try {
      let fileUrl = uploadForm.url.trim();
      const fileSize = selectedFile ? selectedFile.size : 1024 * 150; // fallback 150KB

      if (selectedFile) {
        const fileName = `${empresaId}/${Date.now()}_${selectedFile.name}`;
        try {
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from("documents")
            .upload(fileName, selectedFile, { upsert: true });

          if (!uploadErr && uploadData) {
            const DIEZ_ANIOS_EN_SEGUNDOS = 10 * 365 * 24 * 60 * 60;
            const { data: firmada, error: firmaErr } = await supabase.storage
              .from("documents")
              .createSignedUrl(fileName, DIEZ_ANIOS_EN_SEGUNDOS);
            if (!firmaErr && firmada) fileUrl = firmada.signedUrl;
          }
        } catch {
          // Si storage falla, continuamos con el registro
        }
      }

      const payload = {
        empresa_id: empresaId,
        usuario_id: user?.id,
        titulo: uploadForm.titulo.trim(),
        categoria: uploadForm.categoria,
        tamano_bytes: fileSize,
        storage_path: fileUrl || "",
        leido: false,
        datos: {
          url: fileUrl || null,
          descripcion: uploadForm.descripcion.trim() || null,
          nombreArchivo: selectedFile ? selectedFile.name : `${uploadForm.titulo.trim()}.pdf`,
          departamentoId: uploadForm.departamentoId || null,
          subidoPorNombre: perfil?.nombre || user?.email || "Admin",
        },
      };

      const { error: insertErr } = await supabase.from("documentos").insert(payload);
      if (insertErr) throw insertErr;

      await supabase.from("audit_logs").insert({
        empresa_id: empresaId,
        actor_id: user?.id,
        accion: "Subida de documento",
        modulo: "Documentos",
        detalles: uploadForm.titulo.trim(),
      });

      if (uploadForm.departamentoId) {
        const mensaje = `${perfil?.nombre || "Administración"} compartió un documento nuevo con tu departamento.`;
        const tituloDoc = uploadForm.titulo.trim();
        const departamentoIdNotif = uploadForm.departamentoId;
        (async () => {
          try {
            const { data: destinatarios, error: destinatariosError } = await supabase
              .from("usuarios")
              .select("id")
              .eq("empresa_id", empresaId)
              .eq("departamento_id", departamentoIdNotif)
              .eq("eliminado", false);
            if (destinatariosError || !destinatarios?.length) return;
            await supabase.from("inbox_unificado").insert(
              destinatarios.map((destino) => ({
                usuario_id: destino.id,
                empresa_id: empresaId,
                origen: "documento",
                contenido: { origenRefId: "", prioridad: "normal", estado: "pendiente", titulo: tituloDoc, mensaje },
              }))
            );
            await Promise.all(
              destinatarios.map((destino) =>
                supabase.functions.invoke("send-push-notification", {
                  body: { userId: destino.id, titulo: tituloDoc, mensaje },
                }).catch(() => {})
              )
            );
          } catch {
            // Best-effort
          }
        })();
      }

      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadForm({ titulo: "", categoria: "rrhh", departamentoId: "", descripcion: "", url: "" });
    } catch (err: any) {
      setUploadError(err.message || "No se pudo subir el documento.");
    } finally {
      setSubiendo(false);
    }
  }

  const cargando = documentos === null;

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

      {/* Header & Acción Principal */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-navy-700 dark:text-white">
              Gestión Documental & Archivo
            </h2>
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
              {stats.uploadCount} archivos indexados
            </span>
          </div>
          <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-white/60">
            Repositorio corporativo de políticas, contratos, constancias y comunicados de la empresa.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-95 dark:bg-brand-400"
        >
          <MdOutlineCloudUpload className="h-4 w-4" />
          <span>Subir Documento</span>
        </button>
      </div>

      {/* Grid Asimétrico: Hero Card (7 cols) + Right Stack (5 cols) */}
      {(() => {
        const total = Math.max(stats.uploadCount, 1);
        const hayDocumentos = stats.uploadCount > 0;
        const rrhhPct = Math.round((categoryCounts.rrhh / total) * 100);
        const contratosPct = Math.round((categoryCounts.contratos / total) * 100);
        const nominaPct = Math.round((categoryCounts.nomina / total) * 100);
        const certificadosPct = Math.round((categoryCounts.certificados / total) * 100);
        const otrosPct = Math.round((categoryCounts.otros / total) * 100);

        return (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Hero Card Principal (7 cols) */}
            <div className="lg:col-span-7">
              <NexxusCard extra="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-navy-700 dark:text-white">
                        Acervo Documental & Archivo
                      </span>
                      <span className="ml-2 text-xs font-medium text-gray-400 dark:text-white/40">
                        · Repositorio Central
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        stats.sinLeer > 0
                          ? "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300"
                          : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                      }`}
                    >
                      {stats.sinLeer > 0 ? `${stats.sinLeer} por revisar` : "Bandeja al día"}
                    </span>
                  </div>

                  {/* Número Principal */}
                  <div className="mt-4">
                    {stats.uploadCount > 0 ? (
                      <div>
                        <p className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-navy-700 dark:text-white truncate">
                          {stats.uploadCount}
                        </p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
                          <span>{formatBytes(stats.totalBytes)} en almacenamiento seguro</span>
                          <span className="font-normal text-gray-400 dark:text-white/40">
                            · {stats.esteMes} incorporados este mes
                          </span>
                        </p>
                      </div>
                    ) : (
                      <div className="py-2">
                        <p className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                          Sin documentos indexados
                        </p>
                        <p className="mt-1 text-xs font-medium text-gray-400 dark:text-white/50">
                          Comienza publicando políticas, contratos o comunicados institucionales.
                        </p>
                      </div>
                    )}

                    <p className="mt-2 text-xs font-medium text-gray-500 dark:text-white/60">
                      {stats.leidos} documentos verificados · {stats.sinLeer} pendientes de apertura
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  {/* Barra de Distribución Proporcional */}
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                    {hayDocumentos ? (
                      <>
                        <div
                          style={{ width: `${Math.max(rrhhPct, 4)}%` }}
                          className="h-full bg-purple-500 transition-all duration-500"
                          title={`Políticas & RRHH: ${categoryCounts.rrhh}`}
                        />
                        <div
                          style={{ width: `${contratosPct}%` }}
                          className="h-full bg-blue-500 transition-all duration-500"
                          title={`Contratos & Legal: ${categoryCounts.contratos}`}
                        />
                        <div
                          style={{ width: `${nominaPct}%` }}
                          className="h-full bg-emerald-500 transition-all duration-500"
                          title={`Nómina & Recibos: ${categoryCounts.nomina}`}
                        />
                        <div
                          style={{ width: `${certificadosPct}%` }}
                          className="h-full bg-cyan-500 transition-all duration-500"
                          title={`Certificados: ${categoryCounts.certificados}`}
                        />
                        <div
                          style={{ width: `${otrosPct}%` }}
                          className="h-full bg-gray-400 transition-all duration-500"
                          title={`Otros: ${categoryCounts.otros}`}
                        />
                      </>
                    ) : (
                      <div className="h-full w-full bg-gray-200/50 dark:bg-white/5" />
                    )}
                  </div>

                  {/* Leyenda con Métricas */}
                  {hayDocumentos ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-purple-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            {categoryCounts.rrhh}
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Políticas ({rrhhPct}%)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            {categoryCounts.contratos}
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Legal ({contratosPct}%)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            {categoryCounts.nomina}
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Nómina ({nominaPct}%)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            {categoryCounts.certificados}
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Certificados ({certificadosPct}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] font-medium text-gray-400 dark:text-white/40">
                      Sin documentos clasificados en el sistema
                    </p>
                  )}
                </div>
              </NexxusCard>
            </div>

            {/* Right Stack of 3 Cards (5 cols) - Alineadas a la izquierda */}
            <div className="flex flex-col gap-4 lg:col-span-5">
              {/* Card 1: Espacio en la Nube */}
              <NexxusCard extra="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-white/50">
                    Espacio en la Nube
                  </span>
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
                    Almacenamiento Ilimitado
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
                    {formatBytes(stats.totalBytes)}
                  </p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-white/40">
                    Almacenamiento cifrado y respaldado en la nube corporativa.
                  </p>
                </div>
              </NexxusCard>

              {/* Card 2: Documentos sin Leer */}
              <NexxusCard extra="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-white/50">
                    Documentos sin Leer
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      stats.sinLeer > 0
                        ? "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300"
                        : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                    }`}
                  >
                    {stats.sinLeer > 0 ? "Por revisar" : "Al día"}
                  </span>
                </div>
                <div className="mt-3">
                  {stats.sinLeer > 0 ? (
                    <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                      {stats.sinLeer} <span className="text-xs font-medium text-gray-400">pendientes</span>
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      Todos los documentos han sido leídos
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-white/40">
                    Archivos compartidos pendientes de apertura o confirmación.
                  </p>
                </div>
              </NexxusCard>

              {/* Card 3: Publicados Este Mes */}
              <NexxusCard extra="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-white/50">
                    Publicados este Mes
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      stats.esteMes > 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                        : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/40"
                    }`}
                  >
                    {stats.esteMes > 0 ? "Este período" : "Sin publicaciones"}
                  </span>
                </div>
                <div className="mt-3">
                  {stats.esteMes > 0 ? (
                    <p className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
                      {stats.esteMes} <span className="text-xs font-medium text-gray-400">incorporaciones</span>
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-gray-400 dark:text-white/50">
                      Sin nuevas publicaciones este mes
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-white/40">
                    Nuevos archivos añadidos durante el mes actual.
                  </p>
                </div>
              </NexxusCard>
            </div>
          </div>
        );
      })()}

      {/* Tarjeta de Repositorio de Documentos */}
      <NexxusCard extra="p-5 sm:p-6 flex flex-col gap-5" delay={100}>
        {/* Barra superior de filtrado y tabs segmentados */}
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
          {/* Segmented Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-gray-100/80 p-1 dark:bg-charcoal">
            <button
              type="button"
              onClick={() => setFiltroTipo("todos")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filtroTipo === "todos"
                  ? "bg-navy-700 text-white shadow-sm dark:bg-white dark:text-navy-700"
                  : "text-gray-600 hover:text-navy-700 hover:bg-white/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
              }`}
            >
              <span>Todos</span>
              <span
                className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                  filtroTipo === "todos"
                    ? "bg-white/20 text-white dark:bg-navy-700/20 dark:text-navy-700"
                    : "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70"
                }`}
              >
                {stats.uploadCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroTipo("rrhh")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filtroTipo === "rrhh"
                  ? "bg-navy-700 text-white shadow-sm dark:bg-white dark:text-navy-700"
                  : "text-gray-600 hover:text-navy-700 hover:bg-white/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
              }`}
            >
              <span>Políticas & RRHH</span>
              {categoryCounts.rrhh > 0 && (
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                    filtroTipo === "rrhh"
                      ? "bg-white/20 text-white dark:bg-navy-700/20 dark:text-navy-700"
                      : "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70"
                  }`}
                >
                  {categoryCounts.rrhh}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFiltroTipo("contrato")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filtroTipo === "contrato"
                  ? "bg-navy-700 text-white shadow-sm dark:bg-white dark:text-navy-700"
                  : "text-gray-600 hover:text-navy-700 hover:bg-white/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
              }`}
            >
              <span>Contratos & Legal</span>
              {categoryCounts.contratos > 0 && (
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                    filtroTipo === "contrato"
                      ? "bg-white/20 text-white dark:bg-navy-700/20 dark:text-navy-700"
                      : "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70"
                  }`}
                >
                  {categoryCounts.contratos}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFiltroTipo("nomina")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filtroTipo === "nomina"
                  ? "bg-navy-700 text-white shadow-sm dark:bg-white dark:text-navy-700"
                  : "text-gray-600 hover:text-navy-700 hover:bg-white/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
              }`}
            >
              <span>Nómina & Recibos</span>
              {categoryCounts.nomina > 0 && (
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                    filtroTipo === "nomina"
                      ? "bg-white/20 text-white dark:bg-navy-700/20 dark:text-navy-700"
                      : "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70"
                  }`}
                >
                  {categoryCounts.nomina}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFiltroTipo("certificado")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filtroTipo === "certificado"
                  ? "bg-navy-700 text-white shadow-sm dark:bg-white dark:text-navy-700"
                  : "text-gray-600 hover:text-navy-700 hover:bg-white/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
              }`}
            >
              <span>Certificados</span>
              {categoryCounts.certificados > 0 && (
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                    filtroTipo === "certificado"
                      ? "bg-white/20 text-white dark:bg-navy-700/20 dark:text-navy-700"
                      : "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70"
                  }`}
                >
                  {categoryCounts.certificados}
                </span>
              )}
            </button>
          </div>

          {/* Buscador & Selector de Estado */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <MdOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/40" />
              <input
                type="text"
                placeholder="Buscar documento, categoría o depto..."
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
              value={filtroLectura}
              onChange={(e) => setFiltroLectura(e.target.value)}
              className="h-10 rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
            >
              <option value="todos">Todos los estados</option>
              <option value="sinLeer">Sin leer</option>
              <option value="leidos">Leídos</option>
            </select>
          </div>
        </div>

        {/* Tabla de Documentos */}
        {cargando ? (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
            <p className="text-xs font-medium text-gray-500 dark:text-white/60">
              Cargando documentos...
            </p>
          </div>
        ) : documentosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-14 text-center dark:border-white/10">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/40">
              <MdOutlineDescription className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
              No se encontraron documentos
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-white/50 max-w-sm">
              {busqueda || filtroTipo !== "todos" || filtroLectura !== "todos"
                ? "Prueba con otros términos de búsqueda o filtros."
                : "Comienza publicando tu primer documento con el botón 'Subir Documento'."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/5">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 dark:border-white/10 dark:bg-white/[0.02]">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Documento
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Tamaño
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Alcance / Destino
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Fecha Subida
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {documentosPaginados.map((doc) => {
                  const tipoStyle = getTipoStyle(doc.tipo);
                  const TipoIcon = tipoStyle.icon;
                  const deptoNombre = deptosPorId.get(doc.departamentoId) || "Toda la Empresa";
                  const isBusy = busyId === doc.id;

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className="group cursor-pointer transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                    >
                      {/* Documento */}
                      <td className="min-w-[220px] px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tipoStyle.color}`}>
                            <TipoIcon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-navy-700 group-hover:text-brand-600 transition dark:text-white dark:group-hover:text-brand-300">
                              {doc.titulo}
                            </p>
                            {doc.descripcion && (
                              <p className="truncate text-[11px] text-gray-400 dark:text-white/50 max-w-xs">
                                {doc.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${tipoStyle.badge}`}>
                          {tipoStyle.label}
                        </span>
                      </td>

                      {/* Tamaño */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs font-mono font-bold text-navy-700 dark:text-white">
                        {formatBytes(doc.size)}
                      </td>

                      {/* Alcance */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-white/70">
                          {deptoNombre}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-gray-500 dark:text-white/60">
                        {formatoFecha(doc.fechaSubida)}
                      </td>

                      {/* Estado */}
                      <td className="whitespace-nowrap px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleLeido(doc)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                            doc.leido
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-400/20 dark:text-emerald-300"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-400/20 dark:text-amber-300"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${doc.leido ? "bg-emerald-500" : "bg-amber-500"}`} />
                          <span>{doc.leido ? "Leído" : "Sin leer"}</span>
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {doc.url ? (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 active:scale-95 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-300"
                            >
                              <MdOutlineOpenInNew className="h-3.5 w-3.5" />
                              <span>Abrir</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedDoc(doc)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-700 shadow-sm transition hover:bg-gray-50 hover:border-gray-300 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
                            >
                              <MdOutlineVisibility className="h-3.5 w-3.5" />
                              <span>Detalle</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleEliminar(doc)}
                            className="inline-flex items-center rounded-lg p-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                            title="Eliminar documento"
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
        {documentosFiltrados.length > PAGE_SIZE && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row dark:border-white/10">
            <p className="text-xs font-medium text-gray-500 dark:text-white/60">
              Página {pagina} de {totalPaginas} · {documentosFiltrados.length} documentos en total
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

      {/* Modal Subir Documento */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Publicar Documento Corporativo"
        width="max-w-lg"
      >
        <div className="py-2">
          <form onSubmit={handleSubirDocumento} className="flex flex-col gap-4">
            {/* Selector de Archivo */}
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-5 text-center transition hover:border-brand-500 dark:border-white/10 dark:bg-charcoal">
              <MdOutlineCloudUpload className="h-8 w-8 text-brand-500 mb-2" />
              <p className="text-xs font-bold text-navy-700 dark:text-white">
                {selectedFile ? selectedFile.name : "Selecciona un archivo PDF, DOCX, XLSX..."}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-white/40 mt-0.5">
                {selectedFile ? `${formatBytes(selectedFile.size)}` : "Haz clic para examinar desde tu equipo"}
              </p>
              <label className="mt-3 cursor-pointer rounded-xl bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-600 shadow-sm transition hover:bg-brand-500/20 active:scale-95 dark:bg-brand-400/20 dark:text-brand-300">
                <span>Examinar archivo</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setSelectedFile(file);
                      if (!uploadForm.titulo) {
                        setUploadForm((prev) => ({
                          ...prev,
                          titulo: file.name.replace(/\.[^/.]+$/, ""),
                        }));
                      }
                    }
                  }}
                />
              </label>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="doc-titulo">
                Título del Documento *
              </label>
              <input
                id="doc-titulo"
                type="text"
                placeholder="Ej. Política de Seguridad de la Información 2026"
                value={uploadForm.titulo}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, titulo: e.target.value }))}
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="doc-categoria">
                  Categoría
                </label>
                <select
                  id="doc-categoria"
                  value={uploadForm.categoria}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, categoria: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
                >
                  <option value="rrhh">Políticas & RRHH</option>
                  <option value="contrato">Contratos & Legal</option>
                  <option value="nomina">Nómina & Recibos</option>
                  <option value="certificado">Certificados & Constancias</option>
                  <option value="evaluacion">Evaluaciones de Desempeño</option>
                  <option value="general">General / Comunicados</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="doc-depto">
                  Alcance / Departamento
                </label>
                <select
                  id="doc-depto"
                  value={uploadForm.departamentoId}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, departamentoId: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
                >
                  <option value="">Toda la Empresa</option>
                  {departamentos.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="doc-descripcion">
                Descripción o Notas (opcional)
              </label>
              <textarea
                id="doc-descripcion"
                rows={2}
                placeholder="Breve resumen de vigencia o aplicación..."
                value={uploadForm.descripcion}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-xs font-semibold text-navy-700 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
              />
            </div>

            {uploadError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                {uploadError}
              </div>
            )}

            <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-3.5 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-100 active:scale-95 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={subiendo}
                className="rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95 disabled:opacity-50"
              >
                {subiendo ? "Subiendo..." : "Publicar Documento"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal Ficha del Documento */}
      <Modal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title="Ficha del Documento"
        width="max-w-md"
      >
        {selectedDoc ? (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center justify-between rounded-2xl bg-brand-500/[0.06] p-4 dark:bg-brand-500/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/20">
                  <MdOutlineDescription className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-navy-700 dark:text-white">
                    {selectedDoc.titulo}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/60">
                    {formatBytes(selectedDoc.size)} · {formatoFecha(selectedDoc.fechaSubida)}
                  </p>
                </div>
              </div>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${getTipoStyle(selectedDoc.tipo).badge}`}>
                {getTipoStyle(selectedDoc.tipo).label}
              </span>
            </div>

            {selectedDoc.descripcion && (
              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-white/5 dark:bg-charcoal">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1">
                  Descripción
                </p>
                <p className="text-xs text-navy-700 dark:text-white/90 font-medium">
                  {selectedDoc.descripcion}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => handleToggleLeido(selectedDoc)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  selectedDoc.leido
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                    : "bg-amber-50 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300"
                }`}
              >
                {selectedDoc.leido ? "✓ Marcado como leído" : "Marcar como leído"}
              </button>

              <div className="flex items-center gap-2">
                {selectedDoc.url && (
                  <a
                    href={selectedDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl bg-brand-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600"
                  >
                    <MdOutlineOpenInNew className="h-3.5 w-3.5" />
                    <span>Abrir</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="rounded-xl bg-gray-100 px-4 py-1.5 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-white"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
