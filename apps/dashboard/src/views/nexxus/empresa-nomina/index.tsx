import { useEffect, useMemo, useState } from "react";
import {
  MdOutlineAttachMoney,
  MdOutlinePlaylistAddCheck,
  MdPending,
  MdPaid,
  MdOutlineSearch,
  MdOutlineEdit,
  MdOutlineCheckCircle,
  MdOutlineReceiptLong,
  MdOutlineAccountBalanceWallet,
  MdOutlinePendingActions,
  MdOutlineTrendingUp,
  MdOutlineCalculate,
  MdOutlineClose,
  MdOutlineArrowForward,
  MdOutlineFileDownload,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import Modal from "components/nexxus/Modal";
import Avatar from "components/nexxus/Avatar";
import { useAuth } from "context/AuthContext";
import { supabase } from "supabaseClient/supabaseConfig";
import {
  subscribeEmpleados,
  subscribeNominas,
  subscribeCargos,
  subscribeDepartamentos,
} from "services/adminRepository";
import { calculatePayroll, periodoActualLabel, recalcularAjustes } from "./payrollCalc";

const formatMoney = (val: number | string | null | undefined) =>
  `$${(Number(val) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function mapNominaRow(row: any) {
  const salarioBruto = Number(row.salario_bruto) || 0;
  const bonos = Number(row.bonos) || 0;
  const comisiones = Number(row.comisiones) || 0;
  const horasExtra = Number(row.horas_extra) || 0;
  const valorHoraExtra = Number(row.valor_hora_extra) || 0;
  const extraTotal = horasExtra * valorHoraExtra * 1.5;

  let salarioBase = Number(row.salario_base);
  if (isNaN(salarioBase) || salarioBase <= 0) {
    salarioBase = Math.max(0, salarioBruto - bonos - comisiones - extraTotal);
  }

  return {
    id: row.id,
    empleadoId: row.usuario_id,
    empleadoNombre: row.empleado_nombre || "Colaborador",
    periodo: row.periodo,
    salarioBase,
    bonos,
    comisiones,
    descuentos: Number(row.otras_deducciones) || 0,
    horasExtra,
    valorHoraExtra,
    descuentoTardanzas: Number(row.descuento_tardanzas) || 0,
    descuentoAusencias: Number(row.descuento_ausencias) || 0,
    salarioBruto,
    isss: Number(row.isss_empleado) || 0,
    afp: Number(row.afp_empleado) || 0,
    renta: Number(row.renta) || 0,
    totalPagar: Number(row.salario_neto) || 0,
    estado: row.estado || "pendiente",
    paymentId: row.legacy_payment_id,
    creadoPorNombre: row.creado_por_nombre || "Sistema",
    fechaAprobacion: row.fecha_aprobacion,
    aprobadoPorNombre: row.aprobado_por_nombre,
  };
}

const ROLES_SIN_NOMINA = ["admin", "admin_empresa", "super_admin"];

const ESTADO_BADGE: Record<string, { label: string; cls: string; dot: string }> = {
  pendiente: {
    label: "Pendiente",
    cls: "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-400/20 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  revisado: {
    label: "Revisado",
    cls: "bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-400/20 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  pagado: {
    label: "Pagado",
    cls: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-400/20 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
};

function EstadoBadge({ estado }: { estado: string }) {
  const info = ESTADO_BADGE[estado] || ESTADO_BADGE.pendiente;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${info.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${info.dot}`} />
      {info.label}
    </span>
  );
}

const PAGE_SIZE = 10;

export default function GestionNomina() {
  const { user, perfil, empresaId } = useAuth();
  const periodoActual = useMemo(() => periodoActualLabel(), []);

  const [empleados, setEmpleados] = useState<any[]>([]);
  const [empleadosCargando, setEmpleadosCargando] = useState(true);
  const [empleadosError, setEmpleadosError] = useState("");

  const [cargos, setCargos] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);

  const [nominas, setNominas] = useState<any[]>([]);
  const [nominasCargando, setNominasCargando] = useState(true);
  const [nominasError, setNominasError] = useState("");

  const [generando, setGenerando] = useState(false);
  const [generarError, setGenerarError] = useState("");

  const [busyId, setBusyId] = useState("");
  const [accionError, setAccionError] = useState("");
  const [aprobandoTodos, setAprobandoTodos] = useState(false);

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [pagina, setPagina] = useState(1);

  // Modales
  const [editando, setEditando] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ bonos: "0", comisiones: "0", descuentos: "0" });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [edicionError, setEdicionError] = useState("");

  const [boletaNomina, setBoletaNomina] = useState<any | null>(null);

  useEffect(() => {
    if (!empresaId) return undefined;
    const unsubs = [
      subscribeEmpleados(
        empresaId,
        (docs) => {
          setEmpleados(
            docs.map((d) => {
              const row = d.data();
              return {
                id: d.id,
                ...row,
                activo: row.estado_activo !== false,
                salarioBase: Number(row.salario_base) || 0,
              };
            })
          );
          setEmpleadosCargando(false);
        },
        (err: any) => {
          setEmpleadosError(err.message || "No se pudieron cargar los empleados.");
          setEmpleadosCargando(false);
        }
      ),
      subscribeNominas(
        empresaId,
        periodoActual,
        (docs) => {
          setNominas(docs.map((d) => mapNominaRow(d.data())));
          setNominasCargando(false);
        },
        (err: any) => {
          setNominasError(err.message || "No se pudieron cargar las nóminas.");
          setNominasCargando(false);
        }
      ),
      subscribeCargos(empresaId, (docs) => setCargos(docs.map((d) => ({ id: d.id, ...d.data() }))), () => {}),
      subscribeDepartamentos(empresaId, (docs) => setDepartamentos(docs.map((d) => ({ id: d.id, ...d.data() }))), () => {}),
    ];
    return () => unsubs.forEach((fn) => fn && fn());
  }, [empresaId, periodoActual]);

  const empleadosPorId = useMemo(() => {
    const map = new Map<string, any>();
    const cargoMap = Object.fromEntries(cargos.map((c) => [c.id, c.nombre || c.titulo]));
    const deptoMap = Object.fromEntries(departamentos.map((d) => [d.id, d.nombre]));

    empleados.forEach((e) => {
      map.set(e.id, {
        ...e,
        cargoLabel: cargoMap[e.cargo_id] || e.cargo || "Especialista",
        departamentoLabel: deptoMap[e.departamento_id] || e.departamento || "General",
      });
    });
    return map;
  }, [empleados, cargos, departamentos]);

  const empleadosNomina = useMemo(
    () =>
      empleados.filter((e) => {
        if (e.eliminado) return false;
        if (e.activo === false) return false;
        const rol = String(e.rol || e.role || "").trim().toLowerCase();
        return !ROLES_SIN_NOMINA.includes(rol);
      }),
    [empleados]
  );

  const kpis = useMemo(() => {
    const totalBruto = nominas.reduce((sum, n) => sum + (n.salarioBruto || 0), 0);
    const totalNeto = nominas.reduce((sum, n) => sum + (n.totalPagar || 0), 0);
    const pendientes = nominas.filter((n) => n.estado === "pendiente").length;
    const pagados = nominas.filter((n) => n.estado === "pagado").length;
    const revisados = nominas.filter((n) => n.estado === "revisado").length;
    return { totalBruto, totalNeto, pendientes, pagados, revisados };
  }, [nominas]);

  // Filtrado y búsqueda
  const nominasFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return nominas.filter((n) => {
      const matchEstado = filtroEstado === "todos" || n.estado === filtroEstado;
      if (!matchEstado) return false;
      if (!q) return true;

      const emp = empleadosPorId.get(n.empleadoId);
      const campos = [
        n.empleadoNombre,
        emp?.cargoLabel,
        emp?.departamentoLabel,
        emp?.usuario_interno,
      ];
      return campos.some((c) => (c || "").toLowerCase().includes(q));
    });
  }, [nominas, busqueda, filtroEstado, empleadosPorId]);

  const totalPaginas = Math.max(1, Math.ceil(nominasFiltradas.length / PAGE_SIZE));
  const nominasPaginadas = useMemo(() => {
    const start = (pagina - 1) * PAGE_SIZE;
    return nominasFiltradas.slice(start, start + PAGE_SIZE);
  }, [nominasFiltradas, pagina]);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroEstado]);

  const handleGenerarNomina = async () => {
    if (!empresaId || !user) return;
    const faltantes = empleadosNomina.filter((emp) => !nominas.some((n) => n.empleadoId === emp.id));
    if (faltantes.length === 0) {
      window.alert("Todos los colaboradores activos ya tienen nómina generada para este período.");
      return;
    }
    if (
      !window.confirm(
        `Se generará la nómina de ${faltantes.length} colaborador(es) para el período "${periodoActual}". ¿Continuar?`
      )
    ) {
      return;
    }

    setGenerando(true);
    setGenerarError("");
    try {
      const { data: asistencias, error: asistError } = await supabase
        .from("asistencias")
        .select("usuario_id, horas_extra, minutos_tarde")
        .eq("empresa_id", empresaId)
        .limit(1000);
      if (asistError) throw asistError;

      const acumulado = new Map<string, { horasExtra: number; minutosTarde: number }>();
      (asistencias || []).forEach((row) => {
        if (!row.usuario_id) return;
        const actual = acumulado.get(row.usuario_id) || { horasExtra: 0, minutosTarde: 0 };
        actual.horasExtra += Number(row.horas_extra || 0);
        actual.minutosTarde += Number(row.minutos_tarde || 0);
        acumulado.set(row.usuario_id, actual);
      });

      const creadoPorNombre = perfil?.nombre || user.email || "Administrador";

      const filasNominas: any[] = [];
      const filasPayments: any[] = [];
      for (const empleado of faltantes) {
        const acumEmpleado = acumulado.get(empleado.id) || { horasExtra: 0, minutosTarde: 0 };
        const salarioBase = Number(empleado.salarioBase || 0);
        const calculo = calculatePayroll({
          salarioBase,
          bonos: 0,
          comisiones: 0,
          descuentos: 0,
          minutosTarde: acumEmpleado.minutosTarde,
          diasAusencia: 0,
          horasExtra: acumEmpleado.horasExtra,
        });
        const empleadoNombre = empleado.nombre || empleado.correo || "Sin nombre";

        filasNominas.push({
          empresa_id: empresaId,
          usuario_id: empleado.id,
          empleado_nombre: empleadoNombre,
          periodo: periodoActual,
          periodo_anio: new Date().getFullYear(),
          periodo_mes: new Date().getMonth() + 1,
          bonos: 0,
          comisiones: 0,
          otras_deducciones: 0,
          horas_extra: calculo.horasExtra,
          valor_hora_extra: calculo.valorHoraExtra,
          descuento_tardanzas: calculo.descuentoTardanzas,
          descuento_ausencias: calculo.descuentoAusencias,
          salario_bruto: calculo.salarioBruto,
          isss_empleado: calculo.isss,
          afp_empleado: calculo.afp,
          renta: calculo.renta,
          salario_neto: calculo.totalPagar,
          estado: "pendiente",
          creado_por: user.id,
          creado_por_nombre: creadoPorNombre,
        });
        filasPayments.push({
          empresa_id: empresaId,
          usuario_id: empleado.id,
          monto: calculo.totalPagar,
          moneda: "USD",
          estado: "pendiente",
          datos: {
            periodo: periodoActual,
            salario_bruto: calculo.salarioBruto,
            isss: calculo.isss,
            afp: calculo.afp,
            renta: calculo.renta,
            salario_neto: calculo.totalPagar,
          },
        });
      }

      const { error: insertError } = await supabase.from("nominas").insert(filasNominas);
      if (insertError) throw insertError;

      await supabase.from("payments").insert(filasPayments).then(({ error }) => {
        if (error) console.warn("No se pudo espejar en payments", error);
      });
    } catch (err: any) {
      setGenerarError(err.message || "No se pudo generar la nómina.");
    } finally {
      setGenerando(false);
    }
  };

  const ESTADO_PAYMENT: Record<string, string> = { pendiente: "pendiente", revisado: "procesando", pagado: "confirmado" };

  const handleCambiarEstado = async (nomina: any, estado: string) => {
    if (!user) return;
    setBusyId(nomina.id);
    setAccionError("");
    try {
      const { error } = await supabase
        .from("nominas")
        .update({
          estado,
          aprobado_por: user.id,
          aprobado_por_nombre: perfil?.nombre || user.email || "Administrador",
          fecha_aprobacion: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", nomina.id);
      if (error) throw error;

      await supabase
        .from("payments")
        .update({ estado: ESTADO_PAYMENT[estado] || "pendiente" })
        .eq("usuario_id", nomina.empleadoId)
        .eq("empresa_id", empresaId)
        .contains("datos", { periodo: nomina.periodo || periodoActual });

      if (estado === "pagado" && nomina.empleadoId) {
        await supabase.from("notificaciones").insert({
          usuario_id: nomina.empleadoId,
          empresa_id: empresaId,
          titulo: "Pago de nómina realizado",
          cuerpo: `Se confirmó el pago de tu nómina del período ${nomina.periodo || periodoActual} por ${formatMoney(nomina.totalPagar || 0)}.`,
          tipo: "info",
        });
      }
    } catch (err: any) {
      setAccionError(err.message || "No se pudo actualizar el estado.");
    } finally {
      setBusyId("");
    }
  };

  const handleAprobarTodos = async () => {
    const pendientes = nominas.filter((n) => n.estado === "pendiente");
    if (pendientes.length === 0) return;
    if (!window.confirm(`¿Marcar como revisadas ${pendientes.length} nómina(s) pendiente(s)?`)) return;
    setAprobandoTodos(true);
    setAccionError("");
    try {
      const { error } = await supabase
        .from("nominas")
        .update({
          estado: "revisado",
          aprobado_por: user.id,
          aprobado_por_nombre: perfil?.nombre || user.email || "Administrador",
          fecha_aprobacion: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in("id", pendientes.map((n) => n.id));
      if (error) throw error;
    } catch (err: any) {
      setAccionError(err.message || "No se pudieron aprobar las nóminas.");
    } finally {
      setAprobandoTodos(false);
    }
  };

  const handleAbrirEdicion = (nomina: any) => {
    setEditando(nomina);
    setEditForm({
      bonos: String(nomina.bonos || 0),
      comisiones: String(nomina.comisiones || 0),
      descuentos: String(nomina.descuentos || 0),
    });
    setEdicionError("");
  };

  // Cálculo en vivo del modal de ajustes
  const calculoEnVivo = useMemo(() => {
    if (!editando) return null;
    const bonos = Number(editForm.bonos) || 0;
    const comisiones = Number(editForm.comisiones) || 0;
    const descuentos = Number(editForm.descuentos) || 0;
    return recalcularAjustes({
      salarioBase: editando.salarioBase || 0,
      bonos,
      comisiones,
      descuentos,
      horasExtra: editando.horasExtra || 0,
      valorHoraExtra: editando.valorHoraExtra || 0,
      descuentoTardanzas: editando.descuentoTardanzas || 0,
      descuentoAusencias: editando.descuentoAusencias || 0,
    });
  }, [editando, editForm]);

  const handleGuardarEdicion = async (e: any) => {
    e.preventDefault();
    if (!editando || !calculoEnVivo) return;
    setGuardandoEdicion(true);
    setEdicionError("");
    try {
      const bonos = Number(editForm.bonos) || 0;
      const comisiones = Number(editForm.comisiones) || 0;
      const descuentos = Number(editForm.descuentos) || 0;

      const { error } = await supabase
        .from("nominas")
        .update({
          bonos,
          comisiones,
          otras_deducciones: descuentos,
          salario_bruto: calculoEnVivo.salarioBruto,
          isss_empleado: calculoEnVivo.isss,
          afp_empleado: calculoEnVivo.afp,
          renta: calculoEnVivo.renta,
          salario_neto: calculoEnVivo.totalPagar,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editando.id);
      if (error) throw error;
      setEditando(null);
    } catch (err: any) {
      setEdicionError(err.message || "No se pudo guardar el ajuste.");
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const cargando = empleadosCargando || nominasCargando;
  const pendientesCount = nominas.filter((n) => n.estado === "pendiente").length;

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Mensajes de error */}
      {empleadosError || nominasError || generarError || accionError ? (
        <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {empleadosError || nominasError || generarError || accionError}
        </div>
      ) : null}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
              Gestión de Nómina & Planillas
            </h2>
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-black text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
              {periodoActual}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-white/60">
            Cálculo salarial con retenciones legales (ISSS, AFP, Renta), horas extras y dispersión.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {pendientesCount > 0 && (
            <button
              type="button"
              disabled={aprobandoTodos}
              onClick={handleAprobarTodos}
              className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-600 disabled:opacity-50 active:scale-95"
            >
              <MdOutlinePlaylistAddCheck className="h-4 w-4" />
              <span>{aprobandoTodos ? "Aprobando..." : `Revisar Todos (${pendientesCount})`}</span>
            </button>
          )}

          <button
            type="button"
            disabled={generando || empleadosCargando}
            onClick={handleGenerarNomina}
            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 dark:bg-brand-400"
          >
            <MdOutlineCalculate className="h-4 w-4" />
            <span>{generando ? "Generando Planilla..." : "Generar Nómina del Período"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Bruto */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Total Bruto del Período
              </p>
              <h3 className="mt-2 text-2xl font-black text-navy-700 dark:text-white">
                {formatMoney(kpis.totalBruto)}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
              <MdOutlineAttachMoney className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Costo laboral base</span>
            <span className="font-bold text-brand-500">{nominas.length} planillas</span>
          </div>
        </NexxusCard>

        {/* Total Neto */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Total Neto a Pagar
              </p>
              <h3 className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatMoney(kpis.totalNeto)}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
              <MdOutlineAccountBalanceWallet className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Líquido a desembolsar</span>
            <span className="font-bold text-emerald-600">Planilla neta</span>
          </div>
        </NexxusCard>

        {/* Pendientes de Aprobar */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Pendientes de Revisión
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                {kpis.pendientes}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300">
              <MdOutlinePendingActions className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>{kpis.revisados} revisados listos</span>
            <span className={kpis.pendientes > 0 ? "font-bold text-amber-600" : "font-bold text-emerald-600"}>
              {kpis.pendientes > 0 ? "Por revisar" : "Al día"}
            </span>
          </div>
        </NexxusCard>

        {/* Pagados */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Pagados & Dispersados
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                {kpis.pagados}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
              <MdOutlineCheckCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>
              {nominas.length > 0 ? `${Math.round((kpis.pagados / nominas.length) * 100)}% dispersado` : "0%"}
            </span>
            <span className="font-bold text-purple-600 dark:text-purple-400">Confirmados</span>
          </div>
        </NexxusCard>
      </div>

      <NexxusCard extra="p-6 flex flex-col gap-5" delay={100}>
        {/* Barra superior de filtrado */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h4 className="text-xl font-bold tracking-tight text-navy-700 dark:text-white">
              Nómina – {periodoActual}
            </h4>
            <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-white/60">
              Mostrando {nominasFiltradas.length} colaboradores en la nómina activa.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <MdOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/40" />
              <input
                type="text"
                placeholder="Buscar por colaborador, cargo o depto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
              />
            </div>
          </div>
        </div>

        {/* Pestañas de Estado Rápido */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3 dark:border-white/10">
          <button
            type="button"
            onClick={() => setFiltroEstado("todos")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              filtroEstado === "todos"
                ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200/80 dark:bg-white/5 dark:text-white/70"
            }`}
          >
            Todos ({nominas.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado("pendiente")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              filtroEstado === "pendiente"
                ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200/80 dark:bg-white/5 dark:text-white/70"
            }`}
          >
            <span>Pendientes</span>
            <span
              className={`rounded-md px-1.5 py-0.2 text-[10px] ${
                filtroEstado === "pendiente" ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/10 text-gray-500 dark:text-white/60"
              }`}
            >
              {kpis.pendientes}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado("revisado")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              filtroEstado === "revisado"
                ? "bg-blue-500 text-white shadow-sm shadow-blue-500/20"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200/80 dark:bg-white/5 dark:text-white/70"
            }`}
          >
            <span>Revisados</span>
            <span
              className={`rounded-md px-1.5 py-0.2 text-[10px] ${
                filtroEstado === "revisado" ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/10 text-gray-500 dark:text-white/60"
              }`}
            >
              {kpis.revisados}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado("pagado")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              filtroEstado === "pagado"
                ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200/80 dark:bg-white/5 dark:text-white/70"
            }`}
          >
            <span>Pagados</span>
            <span
              className={`rounded-md px-1.5 py-0.2 text-[10px] ${
                filtroEstado === "pagado" ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/10 text-gray-500 dark:text-white/60"
              }`}
            >
              {kpis.pagados}
            </span>
          </button>
        </div>

        {/* Tabla */}
        {cargando ? (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="text-sm font-medium text-gray-500 dark:text-white/60">
              Cargando nómina...
            </p>
          </div>
        ) : nominasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-white/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/40">
              <MdOutlineAttachMoney className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
              No hay nóminas para mostrar
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-white/50">
              {nominas.length === 0
                ? `Haz clic en "Generar Nómina del Período" para calcular las planillas de ${periodoActual}.`
                : "No se encontraron registros con los filtros aplicados."}
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
                    Salario Base
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Salario Bruto
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Retenciones (ISSS / AFP / Renta)
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Total Neto
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
                {nominasPaginadas.map((n) => {
                  const emp = empleadosPorId.get(n.empleadoId);
                  const totalDeducciones = n.isss + n.afp + n.renta + n.descuentos + n.descuentoTardanzas + n.descuentoAusencias;
                  const busy = busyId === n.id;

                  return (
                    <tr
                      key={n.id}
                      className="cursor-pointer transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                      onClick={() => setBoletaNomina(n)}
                    >
                      {/* Colaborador */}
                      <td className="min-w-[200px] px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar src={emp?.foto_perfil || emp?.foto} name={n.empleadoNombre} size={8} />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-navy-700 dark:text-white">
                              {n.empleadoNombre}
                            </p>
                            <p className="truncate text-[10.5px] text-gray-400 dark:text-white/50">
                              {emp?.cargoLabel || "Colaborador"} · {emp?.departamentoLabel || "General"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Salario Base */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold text-gray-600 dark:text-white/70">
                        {formatMoney(n.salarioBase)}
                      </td>

                      {/* Salario Bruto */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs font-bold text-navy-700 dark:text-white">
                        {formatMoney(n.salarioBruto)}
                      </td>

                      {/* Retenciones */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex flex-col text-[11px]">
                          <span className="font-semibold text-rose-500">
                            -{formatMoney(totalDeducciones)}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-white/40">
                            ISSS {formatMoney(n.isss)} · AFP {formatMoney(n.afp)} · Renta {formatMoney(n.renta)}
                          </span>
                        </div>
                      </td>

                      {/* Total Neto */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {formatMoney(n.totalPagar)}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <EstadoBadge estado={n.estado} />
                      </td>

                      {/* Acciones */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleAbrirEdicion(n)}
                            className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-2.5 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                          >
                            <MdOutlineEdit className="h-3.5 w-3.5" />
                            <span>Ajustar</span>
                          </button>

                          {n.estado === "pendiente" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleCambiarEstado(n, "revisado")}
                              className="inline-flex items-center gap-1 rounded-xl bg-blue-500 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-600 disabled:opacity-50"
                            >
                              <span>Revisar</span>
                            </button>
                          )}

                          {n.estado !== "pagado" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleCambiarEstado(n, "pagado")}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <MdPaid className="h-3.5 w-3.5" />
                              <span>Pagar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setBoletaNomina(n)}
                            className="inline-flex items-center gap-1 rounded-xl bg-lightPrimary px-2.5 py-1.5 text-xs font-bold text-brand-500 transition hover:bg-brand-500/10 dark:bg-white/5 dark:text-brand-300"
                            title="Ver boleta de pago"
                          >
                            <MdOutlineReceiptLong className="h-3.5 w-3.5" />
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
        {nominasFiltradas.length > PAGE_SIZE && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row dark:border-white/10">
            <p className="text-xs font-medium text-gray-500 dark:text-white/60">
              Página {pagina} de {totalPaginas} · {nominasFiltradas.length} nóminas en total
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
        isOpen={!!editando}
        onClose={() => setEditando(null)}
        title={`Ajustes de Nómina: ${editando?.empleadoNombre || ""}`}
        width="max-w-xl"
      >
        {editando ? (
          <div className="flex flex-col gap-4 py-2">
            {/* Banner de colaborador */}
            <div className="flex items-center justify-between rounded-2xl bg-brand-500/[0.06] p-4 dark:bg-brand-500/10">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={editando.empleadoNombre} size={9} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-navy-700 dark:text-white">
                    {editando.empleadoNombre}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/60">
                    Salario Base: <span className="font-bold text-navy-700 dark:text-white">{formatMoney(editando.salarioBase)}</span>
                  </p>
                </div>
              </div>
              <EstadoBadge estado={editando.estado} />
            </div>

            {/* Formulario de Inputs */}
            <form onSubmit={handleGuardarEdicion} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="edit-bonos">
                    Bonos ($)
                  </label>
                  <input
                    id="edit-bonos"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.bonos}
                    onChange={(e) => setEditForm((f) => ({ ...f, bonos: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="edit-comisiones">
                    Comisiones ($)
                  </label>
                  <input
                    id="edit-comisiones"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.comisiones}
                    onChange={(e) => setEditForm((f) => ({ ...f, comisiones: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="edit-descuentos">
                    Otros Desc. ($)
                  </label>
                  <input
                    id="edit-descuentos"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.descuentos}
                    onChange={(e) => setEditForm((f) => ({ ...f, descuentos: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                  />
                </div>
              </div>

              {/* Recálculo en tiempo real */}
              {calculoEnVivo && (
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-white/5 dark:bg-charcoal">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-2">
                    Proyección de Recálculo en Tiempo Real
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                    <div>
                      <p className="text-gray-400 dark:text-white/40 text-[10.5px]">Salario Bruto</p>
                      <p className="font-bold text-navy-700 dark:text-white">{formatMoney(calculoEnVivo.salarioBruto)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 dark:text-white/40 text-[10.5px]">ISSS + AFP</p>
                      <p className="font-bold text-rose-500">-{formatMoney(calculoEnVivo.isss + calculoEnVivo.afp)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 dark:text-white/40 text-[10.5px]">Imp. Renta (ISR)</p>
                      <p className="font-bold text-rose-500">-{formatMoney(calculoEnVivo.renta)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 dark:text-white/40 text-[10.5px]">Líquido / Neto</p>
                      <p className="font-black text-emerald-600 dark:text-emerald-400">{formatMoney(calculoEnVivo.totalPagar)}</p>
                    </div>
                  </div>
                </div>
              )}

              {edicionError && (
                <p className="text-xs font-bold text-red-500">{edicionError}</p>
              )}

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setEditando(null)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-gray-700 dark:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 disabled:opacity-50"
                >
                  {guardandoEdicion ? "Guardando..." : "Guardar y Recalcular"}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={!!boletaNomina}
        onClose={() => setBoletaNomina(null)}
        title="Boleta de Pago Oficial"
        width="max-w-xl"
      >
        {boletaNomina ? (
          <div className="flex flex-col gap-4 py-2">
            {/* Header del recibo */}
            <div className="flex items-center justify-between rounded-2xl bg-brand-500 p-5 text-white shadow-md shadow-brand-500/20">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Boleta de Nómina</p>
                <h3 className="text-xl font-black">{boletaNomina.empleadoNombre}</h3>
                <p className="text-xs text-white/80 mt-0.5">Período: {boletaNomina.periodo}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Neto a Recibir</p>
                <p className="text-2xl font-black">{formatMoney(boletaNomina.totalPagar)}</p>
              </div>
            </div>

            {/* Desglose de Haberes & Deducciones */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Haberes / Ingresos */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-white/5 dark:bg-charcoal">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-3">
                  Ingresos & Haberes
                </p>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-white/70">Salario Base</span>
                    <span className="font-bold text-navy-700 dark:text-white">{formatMoney(boletaNomina.salarioBase)}</span>
                  </div>
                  {boletaNomina.bonos > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-white/70">Bonificaciones</span>
                      <span className="font-bold text-emerald-600">+{formatMoney(boletaNomina.bonos)}</span>
                    </div>
                  )}
                  {boletaNomina.comisiones > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-white/70">Comisiones</span>
                      <span className="font-bold text-emerald-600">+{formatMoney(boletaNomina.comisiones)}</span>
                    </div>
                  )}
                  {boletaNomina.horasExtra > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-white/70">Horas Extra ({boletaNomina.horasExtra}h)</span>
                      <span className="font-bold text-emerald-600">+{formatMoney(boletaNomina.horasExtra * boletaNomina.valorHoraExtra * 1.5)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-navy-700 dark:border-white/10 dark:text-white">
                    <span>Total Bruto</span>
                    <span>{formatMoney(boletaNomina.salarioBruto)}</span>
                  </div>
                </div>
              </div>

              {/* Retenciones / Deducciones */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-white/5 dark:bg-charcoal">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-3">
                  Retenciones de Ley
                </p>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-white/70">ISSS (3.00%)</span>
                    <span className="font-bold text-rose-500">-{formatMoney(boletaNomina.isss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-white/70">AFP (7.25%)</span>
                    <span className="font-bold text-rose-500">-{formatMoney(boletaNomina.afp)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-white/70">Impuesto Renta (ISR)</span>
                    <span className="font-bold text-rose-500">-{formatMoney(boletaNomina.renta)}</span>
                  </div>
                  {boletaNomina.descuentos > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-white/70">Otras Deducciones</span>
                      <span className="font-bold text-rose-500">-{formatMoney(boletaNomina.descuentos)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-navy-700 dark:border-white/10 dark:text-white">
                    <span>Total Retenido</span>
                    <span className="text-rose-500">-{formatMoney(boletaNomina.isss + boletaNomina.afp + boletaNomina.renta + boletaNomina.descuentos)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadatos de auditoría */}
            <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-white/40 px-1">
              <span>Estado: <span className="font-bold capitalize text-navy-700 dark:text-white">{boletaNomina.estado}</span></span>
              {boletaNomina.aprobadoPorNombre && (
                <span>Aprobado por: {boletaNomina.aprobadoPorNombre}</span>
              )}
            </div>

            {/* Botón Cerrar */}
            <div className="flex justify-end border-t border-gray-100 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => setBoletaNomina(null)}
                className="rounded-xl bg-gray-100 px-5 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-white"
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
