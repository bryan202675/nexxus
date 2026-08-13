import { useEffect, useMemo, useState } from "react";
import { MdOutlineAttachMoney, MdOutlinePlaylistAddCheck, MdPending, MdPaid } from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import NexxusWidget from "views/nexxus/components/NexxusWidget";
import RecordsTable from "views/nexxus/components/RecordsTable";
import InputField from "components/fields/InputField";
import Modal from "components/nexxus/Modal";
import { useAuth } from "context/AuthContext";
import { supabase } from "supabaseClient/supabaseConfig";
import { subscribeEmpleados, subscribeNominas } from "services/adminRepository";
import { formatoMoneda } from "services/saFormat";
import { calculatePayroll, periodoActualLabel, recalcularAjustes } from "./payrollCalc";

// Adapta una fila de "nominas" (columnas snake_case de Supabase) a los
// nombres que ya usa este componente (empleadoNombre, salarioBruto, etc.)
function mapNominaRow(row) {
  return {
    id: row.id,
    empleadoId: row.usuario_id,
    empleadoNombre: row.empleado_nombre,
    periodo: row.periodo,
    salarioBase: Number(row.salario_bruto) - Number(row.bonos) - Number(row.comisiones),
    bonos: Number(row.bonos),
    comisiones: Number(row.comisiones),
    descuentos: Number(row.otras_deducciones),
    horasExtra: Number(row.horas_extra),
    valorHoraExtra: Number(row.valor_hora_extra),
    descuentoTardanzas: Number(row.descuento_tardanzas),
    descuentoAusencias: Number(row.descuento_ausencias),
    salarioBruto: Number(row.salario_bruto),
    isss: Number(row.isss_empleado),
    afp: Number(row.afp_empleado),
    renta: Number(row.renta),
    totalPagar: Number(row.salario_neto),
    estado: row.estado,
    paymentId: row.legacy_payment_id,
  };
}

const ROLES_SIN_NOMINA = ["admin", "admin_empresa", "super_admin"];

const ESTADO_BADGE = {
  pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400",
  revisado: "bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400",
  pagado: "bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400",
};

function EstadoBadge({ estado }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
        ESTADO_BADGE[estado] || "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70"
      }`}
    >
      {estado || "—"}
    </span>
  );
}

function AccionesFila({ nomina, busyId, onCambiarEstado, onEditar }) {
  const busy = busyId === nomina.id;
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => onEditar(nomina)}
        className="rounded-lg bg-lightPrimary px-3 py-1 text-xs font-bold text-brand-500 disabled:opacity-50 dark:bg-charcoal-light dark:text-white"
      >
        Ajustar
      </button>
      {nomina.estado !== "revisado" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onCambiarEstado(nomina, "revisado")}
          className="rounded-lg bg-blue-500 px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
        >
          Revisar
        </button>
      ) : null}
      {nomina.estado !== "pagado" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onCambiarEstado(nomina, "pagado")}
          className="rounded-lg bg-green-600 px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
        >
          Marcar pagado
        </button>
      ) : null}
    </div>
  );
}

export default function GestionNomina() {
  const { user, perfil, empresaId } = useAuth();
  const periodoActual = useMemo(() => periodoActualLabel(), []);

  const [empleados, setEmpleados] = useState([]);
  const [empleadosCargando, setEmpleadosCargando] = useState(true);
  const [empleadosError, setEmpleadosError] = useState("");

  const [nominas, setNominas] = useState([]);
  const [nominasCargando, setNominasCargando] = useState(true);
  const [nominasError, setNominasError] = useState("");

  const [generando, setGenerando] = useState(false);
  const [generarError, setGenerarError] = useState("");

  const [busyId, setBusyId] = useState("");
  const [accionError, setAccionError] = useState("");

  const [aprobandoTodos, setAprobandoTodos] = useState(false);

  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({ bonos: "0", comisiones: "0", descuentos: "0" });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [edicionError, setEdicionError] = useState("");

  useEffect(() => {
    if (!empresaId) return undefined;
    setEmpleadosCargando(true);
    setEmpleadosError("");
    const unsubscribe = subscribeEmpleados(
      empresaId,
      (docs) => {
        setEmpleados(docs.map((d) => {
          const row = d.data();
          return { id: d.id, ...row, activo: row.estado_activo !== false, salarioBase: Number(row.salario_base) || 0 };
        }));
        setEmpleadosCargando(false);
      },
      (err) => {
        setEmpleadosError(err.message || "No se pudieron cargar los empleados.");
        setEmpleadosCargando(false);
      }
    );
    return () => unsubscribe();
  }, [empresaId]);

  useEffect(() => {
    if (!empresaId) return undefined;
    setNominasCargando(true);
    setNominasError("");
    const unsubscribe = subscribeNominas(
      empresaId,
      periodoActual,
      (docs) => {
        setNominas(docs.map((d) => mapNominaRow(d.data())));
        setNominasCargando(false);
      },
      (err) => {
        setNominasError(err.message || "No se pudieron cargar las nóminas.");
        setNominasCargando(false);
      }
    );
    return () => unsubscribe();
  }, [empresaId, periodoActual]);

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
    return { totalBruto, totalNeto, pendientes, pagados };
  }, [nominas]);

  const handleGenerarNomina = async () => {
    if (!empresaId || !user) return;
    const faltantes = empleadosNomina.filter(
      (emp) => !nominas.some((n) => n.empleadoId === emp.id)
    );
    if (faltantes.length === 0) {
      window.alert("Todos los empleados activos ya tienen nómina generada para este período.");
      return;
    }
    if (
      !window.confirm(
        `Se generará la nómina de ${faltantes.length} empleado(s) para el período "${periodoActual}". ¿Continuar?`
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

      const acumulado = new Map();
      (asistencias || []).forEach((row) => {
        if (!row.usuario_id) return;
        const actual = acumulado.get(row.usuario_id) || { horasExtra: 0, minutosTarde: 0 };
        actual.horasExtra += Number(row.horas_extra || 0);
        actual.minutosTarde += Number(row.minutos_tarde || 0);
        acumulado.set(row.usuario_id, actual);
      });

      const creadoPorNombre = perfil?.nombre || user.email || "Administrador";

      const filasNominas = [];
      const filasPayments = [];
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
          datos: { periodo: periodoActual, salario_bruto: calculo.salarioBruto, isss: calculo.isss, afp: calculo.afp, renta: calculo.renta, salario_neto: calculo.totalPagar },
        });
      }

      const { error: insertError } = await supabase.from("nominas").insert(filasNominas);
      if (insertError) throw insertError;
      // El espejo en payments es opcional (lo lee MiSalario.tsx en la app movil);
      // si falla no se bloquea la generación de nómina.
      await supabase.from("payments").insert(filasPayments).then(({ error }) => {
        if (error) console.warn("No se pudo espejar en payments", error);
      });
    } catch (err) {
      setGenerarError(err.message || "No se pudo generar la nómina.");
    } finally {
      setGenerando(false);
    }
  };

  const ESTADO_PAYMENT = { pendiente: "pendiente", revisado: "procesando", pagado: "confirmado" };

  const handleCambiarEstado = async (nomina, estado) => {
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

      // Espejo en "payments" (lo único que lee la app del empleado): sin esto se
      // quedaba congelado en "pendiente" aunque el admin marcara la nómina pagada.
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
          cuerpo: `Se confirmó el pago de tu nómina del período ${nomina.periodo || periodoActual} por ${formatoMoneda(nomina.totalPagar || 0)}.`,
          tipo: "info",
        });
      }
    } catch (err) {
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
    } catch (err) {
      setAccionError(err.message || "No se pudieron aprobar las nóminas.");
    } finally {
      setAprobandoTodos(false);
    }
  };

  const handleAbrirEdicion = (nomina) => {
    setEditando(nomina);
    setEditForm({
      bonos: String(nomina.bonos || 0),
      comisiones: String(nomina.comisiones || 0),
      descuentos: String(nomina.descuentos || 0),
    });
    setEdicionError("");
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!editando) return;
    setGuardandoEdicion(true);
    setEdicionError("");
    try {
      const bonos = Number(editForm.bonos) || 0;
      const comisiones = Number(editForm.comisiones) || 0;
      const descuentos = Number(editForm.descuentos) || 0;
      const recalculo = recalcularAjustes({
        salarioBase: editando.salarioBase,
        bonos,
        comisiones,
        descuentos,
        horasExtra: editando.horasExtra || 0,
        valorHoraExtra: editando.valorHoraExtra || 0,
        descuentoTardanzas: editando.descuentoTardanzas || 0,
        descuentoAusencias: editando.descuentoAusencias || 0,
      });
      const { error } = await supabase
        .from("nominas")
        .update({
          bonos,
          comisiones,
          otras_deducciones: descuentos,
          salario_bruto: recalculo.salarioBruto,
          isss_empleado: recalculo.isss,
          afp_empleado: recalculo.afp,
          renta: recalculo.renta,
          salario_neto: recalculo.totalPagar,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editando.id);
      if (error) throw error;
      setEditando(null);
    } catch (err) {
      setEdicionError(err.message || "No se pudo guardar el ajuste.");
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const columnsNomina = [
    { Header: "Empleado", accessor: "empleado" },
    { Header: "Salario base", accessor: "salarioBaseLabel" },
    { Header: "Bruto", accessor: "brutoLabel" },
    { Header: "ISSS", accessor: "issLabel" },
    { Header: "AFP", accessor: "afpLabel" },
    { Header: "Renta", accessor: "rentaLabel" },
    { Header: "Total a pagar", accessor: "totalLabel" },
    { Header: "Estado", accessor: "estadoBadge" },
    { Header: "Acciones", accessor: "acciones" },
  ];

  const filasNomina = useMemo(
    () =>
      nominas.map((n) => ({
        empleado: n.empleadoNombre,
        salarioBaseLabel: formatoMoneda(n.salarioBase),
        brutoLabel: formatoMoneda(n.salarioBruto),
        issLabel: formatoMoneda(n.isss),
        afpLabel: formatoMoneda(n.afp),
        rentaLabel: formatoMoneda(n.renta),
        totalLabel: formatoMoneda(n.totalPagar),
        estadoBadge: <EstadoBadge estado={n.estado} />,
        acciones: (
          <AccionesFila
            nomina={n}
            busyId={busyId}
            onCambiarEstado={handleCambiarEstado}
            onEditar={handleAbrirEdicion}
          />
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nominas, busyId]
  );

  const widgets = [
    { icon: MdOutlineAttachMoney, title: "Total bruto del período", subtitle: formatoMoneda(kpis.totalBruto) },
    { icon: MdOutlineAttachMoney, title: "Total neto a pagar", subtitle: formatoMoneda(kpis.totalNeto) },
    { icon: MdPending, title: "Pendientes de aprobar", subtitle: String(kpis.pendientes) },
    { icon: MdPaid, title: "Pagados", subtitle: String(kpis.pagados) },
  ];

  const cargando = empleadosCargando || nominasCargando;
  const pendientesCount = nominas.filter((n) => n.estado === "pendiente").length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">
          Período actual: <span className="font-bold text-navy-700 dark:text-white">{periodoActual}</span>
        </p>
        <div className="flex flex-wrap gap-3">
          {pendientesCount > 0 ? (
            <button
              type="button"
              disabled={aprobandoTodos}
              onClick={handleAprobarTodos}
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              <MdOutlinePlaylistAddCheck className="h-5 w-5" />
              {aprobandoTodos ? "Aprobando..." : `Aprobar todos (${pendientesCount})`}
            </button>
          ) : null}
          <button
            type="button"
            disabled={generando || empleadosCargando}
            onClick={handleGenerarNomina}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50 dark:bg-brand-400"
          >
            {generando ? "Generando..." : "Generar nómina del período"}
          </button>
        </div>
      </div>

      {empleadosError ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {empleadosError}
        </p>
      ) : null}
      {nominasError ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {nominasError}
        </p>
      ) : null}
      {generarError ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {generarError}
        </p>
      ) : null}
      {accionError ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {accionError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {widgets.map((w, i) => (
          <NexxusWidget key={w.title} {...w} delay={i * 100} />
        ))}
      </div>

      <Modal isOpen={!!editando} onClose={() => setEditando(null)} title={`Ajustar nómina de ${editando?.empleadoNombre || ""}`}>
        {editando ? (
        <div className="p-2">
          <form onSubmit={handleGuardarEdicion} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InputField
              variant="auth"
              label="Bonos"
              id="edit-bonos"
              type="number"
              step="0.01"
              value={editForm.bonos}
              onChange={(e) => setEditForm((f) => ({ ...f, bonos: e.target.value }))}
            />
            <InputField
              variant="auth"
              label="Comisiones"
              id="edit-comisiones"
              type="number"
              step="0.01"
              value={editForm.comisiones}
              onChange={(e) => setEditForm((f) => ({ ...f, comisiones: e.target.value }))}
            />
            <InputField
              variant="auth"
              label="Descuentos"
              id="edit-descuentos"
              type="number"
              step="0.01"
              value={editForm.descuentos}
              onChange={(e) => setEditForm((f) => ({ ...f, descuentos: e.target.value }))}
            />
            {edicionError ? (
              <p className="sm:col-span-3 text-sm font-medium text-red-500 dark:text-red-400">
                {edicionError}
              </p>
            ) : null}
            <div className="sm:col-span-3 flex gap-3">
              <button
                type="submit"
                disabled={guardandoEdicion}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {guardandoEdicion ? "Guardando..." : "Guardar y recalcular"}
              </button>
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600 dark:bg-white/5 dark:text-white/70"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
        ) : null}
      </Modal>

      <div className="mt-8">
        {cargando ? (
          <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando nómina...</p>
        ) : nominas.length === 0 ? (
          <NexxusCard extra="p-6" delay={150}>
            <p className="text-sm font-medium text-gray-600 dark:text-white/70">
              Todavía no hay nómina generada para el período "{periodoActual}". Usa el botón
              "Generar nómina del período" para crearla a partir de los empleados activos.
            </p>
          </NexxusCard>
        ) : (
          <RecordsTable
            title={`Nómina - ${periodoActual}`}
            columnsData={columnsNomina}
            tableData={filasNomina}
            delay={150}
          />
        )}
      </div>
    </div>
  );
}
