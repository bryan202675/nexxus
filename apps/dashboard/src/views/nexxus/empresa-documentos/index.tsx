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

const TIPO_CONFIG: Record<string, { label: string; badge: string; icon: any }> = {
  nomina: {
    label: "Nómina & Recibos",
    badge: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-400/20 dark:text-emerald-300",
    icon: MdOutlineTableChart,
  },
  contrato: {
    label: "Contratos & Legal",
    badge: "bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-400/20 dark:text-blue-300",
    icon: MdOutlineDescription,
  },
  rrhh: {
    label: "Políticas & RRHH",
    badge: "bg-purple-500/10 text-purple-600 border border-purple-500/20 dark:bg-purple-400/20 dark:text-purple-300",
    icon: MdOutlineFolder,
  },
  certificado: {
    label: "Certificados",
    badge: "bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 dark:bg-cyan-400/20 dark:text-cyan-300",
    icon: MdOutlinePictureAsPdf,
  },
  evaluacion: {
    label: "Evaluaciones",
    badge: "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-400/20 dark:text-amber-300",
    icon: MdOutlineDescription,
  },
  general: {
    label: "General / Varios",
    badge: "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-white/10 dark:text-white/70 dark:border-white/10",
    icon: MdOutlineFolder,
  },
};

function getTipoStyle(tipoRaw: string) {
  const key = (tipoRaw || "").trim().toLowerCase();
  if (TIPO_CONFIG[key]) return TIPO_CONFIG[key];
  if (key.includes("nom")) return TIPO_CONFIG.nomina;
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

    const ahora = new Date();
    const esteMes = lista.filter((d) => {
      const fecha = new Date(d.fechaSubida);
      if (Number.isNaN(fecha.getTime())) return false;
      return fecha.getFullYear() === ahora.getFullYear() && fecha.getMonth() === ahora.getMonth();
    }).length;

    return { totalBytes, uploadCount, sinLeer, esteMes };
  }, [documentos]);

  // Filtrado de documentos
  const documentosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return (documentos || []).filter((doc) => {
      if (filtroTipo !== "todos") {
        const t = (doc.tipo || "").toLowerCase();
        if (!t.includes(filtroTipo)) return false;
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
      const fileSize = selectedFile ? selectedFile.size : 1024 * 150; // fallback simulado 150KB

      // Si seleccionó un archivo físico, intentar subirlo al bucket de Supabase Storage
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${empresaId}/${Date.now()}_${selectedFile.name}`;
        try {
          // El bucket real se llama "documents" (inglés) -- con "documentos" (como estaba antes)
          // el upload fallaba siempre en silencio (bucket inexistente), así que ningún archivo
          // subido desde esta pantalla llegaba de verdad a Supabase Storage.
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from("documents")
            .upload(fileName, selectedFile, { upsert: true });

          // El bucket es privado a propósito (documentos de RRHH: nómina, contratos,
          // evaluaciones) -- getPublicUrl() nunca sirve un objeto de un bucket privado, la URL
          // que devolvía jamás funcionaba. Con un bucket privado hay que generar una URL firmada;
          // como el resto del código (dashboard y mobile) espera una sola URL ya lista guardada
          // en datos.url, se firma con una vigencia muy larga (10 años) en vez de regenerarla en
          // cada lectura -- la protección real la dan las políticas RLS de storage.objects
          // (aisladas por empresa_id vía misma_empresa()), no que la URL sea "secreta".
          if (!uploadErr && uploadData) {
            const DIEZ_ANIOS_EN_SEGUNDOS = 10 * 365 * 24 * 60 * 60;
            const { data: firmada, error: firmaErr } = await supabase.storage
              .from("documents")
              .createSignedUrl(fileName, DIEZ_ANIOS_EN_SEGUNDOS);
            if (!firmaErr && firmada) fileUrl = firmada.signedUrl;
          }
        } catch {
          // Si el bucket no está creado aún, continuamos guardando el registro
        }
      }

      // "documentos" no tiene columna "url" -- la ubicación real vive en storage_path (NOT NULL)
      // + se espeja en datos.url, igual que SupabaseDocumentoRepository.ts del lado mobile. Sin
      // storage_path el insert siempre fallaba (columna inexistente + NOT NULL sin valor): subir
      // un documento desde el dashboard nunca funcionaba.
      const payload = {
        empresa_id: empresaId,
        usuario_id: user?.id,
        titulo: uploadForm.titulo.trim(),
        categoria: uploadForm.categoria,
        departamento_id: uploadForm.departamentoId || null,
        tamano_bytes: fileSize,
        storage_path: fileUrl || "",
        leido: false,
        datos: {
          url: fileUrl || null,
          descripcion: uploadForm.descripcion.trim() || null,
          nombreArchivo: selectedFile ? selectedFile.name : `${uploadForm.titulo.trim()}.pdf`,
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

      // Compartir un documento desde el dashboard nunca avisaba a nadie (mobile sí manda inbox +
      // push al subir uno). El dashboard no tiene un selector de "para quién" -- solo un
      // departamento opcional -- así que se notifica a ese departamento cuando se elige uno; sin
      // departamento (documento de toda la empresa) no se dispara un push masivo a todos.
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
            // Best-effort: el documento ya quedó subido, una notificación fallida no debe romper el flujo.
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
    <div className="flex flex-col gap-6 pb-6">
      {/* Banner de error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
            Gestión Documental & Archivo
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-white/60">
            Repositorio corporativo de políticas, contratos, constancias y comunicados de la empresa.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95 dark:bg-brand-400"
        >
          <MdOutlineCloudUpload className="h-4 w-4" />
          <span>Subir Documento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Total Documentos
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                {stats.uploadCount}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
              <MdOutlineDescription className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Archivos indexados</span>
            <span className="font-bold text-brand-500">100% activo</span>
          </div>
        </NexxusCard>

        {/* Espacio Usado */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Espacio en la Nube
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                {formatBytes(stats.totalBytes)}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
              <MdOutlineStorage className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Almacenamiento seguro</span>
            <span className="font-bold text-blue-600">Ilimitado</span>
          </div>
        </NexxusCard>

        {/* Sin Leer */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Documentos sin Leer
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                {stats.sinLeer}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300">
              <MdOutlineMarkEmailUnread className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Pendientes de apertura</span>
            <span className={stats.sinLeer > 0 ? "font-bold text-amber-600" : "font-bold text-emerald-600"}>
              {stats.sinLeer > 0 ? "Por revisar" : "Al día"}
            </span>
          </div>
        </NexxusCard>

        {/* Documentos Este Mes */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Publicados este Mes
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {stats.esteMes}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
              <MdOutlineCalendarMonth className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Nuevas incorporaciones</span>
            <span className="font-bold text-emerald-600">Este período</span>
          </div>
        </NexxusCard>
      </div>

      <NexxusCard extra="p-6 flex flex-col gap-5" delay={100}>
        {/* Barra superior de filtrado */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h4 className="text-xl font-bold tracking-tight text-navy-700 dark:text-white">
              Repositorio de Documentos
            </h4>
            <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-white/60">
              Mostrando {documentosFiltrados.length} archivos disponibles en la organización.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <MdOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/40" />
              <input
                type="text"
                placeholder="Buscar por título, categoría o depto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
              />
            </div>
          </div>
        </div>

        {/* Pestañas de Filtro Rápido */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltroTipo("todos")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filtroTipo === "todos"
                  ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70"
              }`}
            >
              Todos ({documentos?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo("rrhh")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filtroTipo === "rrhh"
                  ? "bg-purple-500 text-white shadow-sm shadow-purple-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70"
              }`}
            >
              Políticas & RRHH
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo("contrato")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filtroTipo === "contrato"
                  ? "bg-blue-500 text-white shadow-sm shadow-blue-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70"
              }`}
            >
              Contratos & Legal
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo("nomina")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filtroTipo === "nomina"
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70"
              }`}
            >
              Nómina & Recibos
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo("certificado")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filtroTipo === "certificado"
                  ? "bg-cyan-500 text-white shadow-sm shadow-cyan-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70"
              }`}
            >
              Certificados
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filtroLectura}
              onChange={(e) => setFiltroLectura(e.target.value)}
              className="h-8 rounded-xl border border-gray-200 bg-gray-50/50 px-2.5 text-xs font-semibold text-navy-700 outline-none dark:border-white/10 dark:bg-charcoal dark:text-white"
            >
              <option value="todos">Todos los estados</option>
              <option value="sinLeer">Sin leer</option>
              <option value="leidos">Leídos</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        {cargando ? (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="text-sm font-medium text-gray-500 dark:text-white/60">
              Cargando documentos...
            </p>
          </div>
        ) : documentosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-white/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/40">
              <MdOutlineDescription className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
              No hay documentos para mostrar
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-white/50">
              {busqueda || filtroTipo !== "todos"
                ? "Prueba a cambiar los filtros o el término de búsqueda."
                : "Sube tu primer documento corporativo con el botón 'Subir Documento'."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/5">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 dark:border-white/10 dark:bg-white/[0.02]">
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Documento
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Categoría
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Tamaño
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Alcance / Destino
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Fecha Subida
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
                {documentosPaginados.map((doc) => {
                  const tipoStyle = getTipoStyle(doc.tipo);
                  const TipoIcon = tipoStyle.icon;
                  const deptoNombre = deptosPorId.get(doc.departamentoId) || "Toda la Empresa";
                  const isBusy = busyId === doc.id;

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className="cursor-pointer transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                    >
                      {/* Documento */}
                      <td className="min-w-[220px] px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
                            <TipoIcon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-navy-700 dark:text-white">
                              {doc.titulo}
                            </p>
                            {doc.descripcion && (
                              <p className="truncate text-[10.5px] text-gray-400 dark:text-white/50 max-w-xs">
                                {doc.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tipoStyle.badge}`}>
                          {tipoStyle.label}
                        </span>
                      </td>

                      {/* Tamaño */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs font-mono font-semibold text-gray-600 dark:text-white/70">
                        {formatBytes(doc.size)}
                      </td>

                      {/* Alcance */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700 dark:bg-white/10 dark:text-white/70">
                          {deptoNombre}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-gray-500 dark:text-white/60">
                        {formatoFecha(doc.fechaSubida)}
                      </td>

                      {/* Estado / Leído */}
                      <td className="whitespace-nowrap px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleLeido(doc)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
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
                              className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-100 active:scale-95 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-300"
                            >
                              <MdOutlineOpenInNew className="h-3.5 w-3.5" />
                              <span>Abrir</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedDoc(doc)}
                              className="inline-flex items-center gap-1 rounded-xl bg-lightPrimary px-2.5 py-1.5 text-xs font-bold text-brand-500 transition hover:bg-brand-500/10 dark:bg-white/5 dark:text-brand-300"
                            >
                              <MdOutlineVisibility className="h-3.5 w-3.5" />
                              <span>Detalle</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleEliminar(doc)}
                            className="inline-flex items-center rounded-xl p-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
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
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-navy-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:bg-charcoal dark:text-white"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-navy-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:bg-charcoal dark:text-white"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </NexxusCard>

      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Publicar Documento Corporativo"
        width="max-w-lg"
      >
        <div className="py-2">
          <form onSubmit={handleSubirDocumento} className="flex flex-col gap-3.5">
            {/* Selector de Archivo */}
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-5 text-center transition hover:border-brand-500 dark:border-white/10 dark:bg-charcoal">
              <MdOutlineCloudUpload className="h-8 w-8 text-brand-500 mb-2" />
              <p className="text-xs font-bold text-navy-700 dark:text-white">
                {selectedFile ? selectedFile.name : "Selecciona un archivo PDF, DOCX, XLSX..."}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-white/40 mt-0.5">
                {selectedFile ? `${formatBytes(selectedFile.size)}` : "Haz clic para examinar desde tu equipo"}
              </p>
              <label className="mt-3 cursor-pointer rounded-xl bg-lightPrimary px-4 py-1.5 text-xs font-bold text-brand-500 shadow-sm transition hover:bg-brand-500/10 dark:bg-white/5 dark:text-brand-300">
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
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="doc-titulo">
                Título del Documento *
              </label>
              <input
                id="doc-titulo"
                type="text"
                placeholder="Ej. Política de Seguridad de la Información 2026"
                value={uploadForm.titulo}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, titulo: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="doc-categoria">
                  Categoría
                </label>
                <select
                  id="doc-categoria"
                  value={uploadForm.categoria}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, categoria: e.target.value }))}
                  className="mt-1 flex h-9.5 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
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
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="doc-depto">
                  Alcance / Departamento
                </label>
                <select
                  id="doc-depto"
                  value={uploadForm.departamentoId}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, departamentoId: e.target.value }))}
                  className="mt-1 flex h-9.5 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
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
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="doc-descripcion">
                Descripción o Notas (opcional)
              </label>
              <textarea
                id="doc-descripcion"
                rows={2}
                placeholder="Breve resumen de vigencia o aplicación..."
                value={uploadForm.descripcion}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
              />
            </div>

            {uploadError && <p className="text-xs font-bold text-red-500">{uploadError}</p>}

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-gray-700 dark:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={subiendo}
                className="rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 disabled:opacity-50"
              >
                {subiendo ? "Subiendo..." : "Publicar Documento"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

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
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
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
                    className="inline-flex items-center gap-1 rounded-xl bg-brand-500 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600"
                  >
                    <MdOutlineOpenInNew className="h-3.5 w-3.5" />
                    <span>Abrir</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="rounded-xl bg-gray-100 px-4 py-1.5 text-xs font-bold text-gray-700 dark:bg-white/10 dark:text-white"
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
