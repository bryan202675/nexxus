import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { MdOutlineAttachMoney, MdOutlinePlaylistAddCheck, MdPending, MdPaid } from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import NexxusWidget from "views/nexxus/components/NexxusWidget";
import RecordsTable from "views/nexxus/components/RecordsTable";
import InputField from "components/fields/InputField";
import { useAuth } from "context/AuthContext";
import { db, subscribeEmpleados, subscribeNominas } from "services/adminRepository";
import { formatoMoneda } from "services/saFormat";
import { calculatePayroll, periodoActualLabel, recalcularAjustes } from "./payrollCalc";

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
        setEmpleados(docs.map((d) => ({ id: d.id, ...d.data() })));
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
        setNominas(docs.map((d) => ({ id: d.id, ...d.data() })));
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
      const asistenciasSnap = await getDocs(
        query(collection(db, "asistencias"), where("empresaId", "==", empresaId), limit(1000))
      );

      const acumulado = new Map();
      asistenciasSnap.docs.forEach((snap) => {
        const data = snap.data();
        const empleadoId = data.userId;
        if (!empleadoId) return;
        const actual = acumulado.get(empleadoId) || { horasExtra: 0, minutosTarde: 0 };
        actual.horasExtra += Number(data.horas_extra_calculadas || 0);
        actual.minutosTarde += Number(data.minutosTarde || 0);
        acumulado.set(empleadoId, actual);
      });

      const creadoPorNombre = perfil?.nombre || user.email || "Administrador";

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

        const registro = {
          empresaId,
          empleadoId: empleado.id,
          empleadoNombre: empleado.nombre || empleado.email || "Sin nombre",
          periodo: periodoActual,
          salarioBase,
          bonos: 0,
          comisiones: 0,
          descuentos: 0,
          horasExtra: calculo.horasExtra,
          valorHoraExtra: calculo.valorHoraExtra,
          descuentoTardanzas: calculo.descuentoTardanzas,
          descuentoAusencias: calculo.descuentoAusencias,
          salarioBruto: calculo.salarioBruto,
          isss: calculo.isss,
          afp: calculo.afp,
          renta: calculo.renta,
          totalPagar: calculo.totalPagar,
          estado: "pendiente",
          creadoPor: user.uid,
          creadoPorNombre,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // eslint-disable-next-line no-await-in-loop
        await addDoc(collection(db, "nominas"), registro);
        try {
          // eslint-disable-next-line no-await-in-loop
          await addDoc(collection(db, "payments"), {
            empresaId,
            empleadoId: empleado.id,
            empleadoNombre: registro.empleadoNombre,
            periodo: periodoActual,
            amount: calculo.totalPagar,
            status: "pendiente",
            tipo: "nomina",
            createdAt: serverTimestamp(),
          });
        } catch {
          // El espejo en payments es opcional; si falla no se bloquea la generación de nómina.
        }
      }
    } catch (err) {
      setGenerarError(err.message || "No se pudo generar la nómina.");
    } finally {
      setGenerando(false);
    }
  };

  const handleCambiarEstado = async (nomina, estado) => {
    if (!user) return;
    setBusyId(nomina.id);
    setAccionError("");
    try {
      await updateDoc(doc(db, "nominas", nomina.id), {
        estado,
        aprobadoPor: user.uid,
        aprobadoPorNombre: perfil?.nombre || user.email || "Administrador",
        fechaAprobacion: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
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
      const batch = writeBatch(db);
      pendientes.forEach((n) => {
        batch.update(doc(db, "nominas", n.id), {
          estado: "revisado",
          aprobadoPor: user.uid,
          aprobadoPorNombre: perfil?.nombre || user.email || "Administrador",
          fechaAprobacion: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
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
      await updateDoc(doc(db, "nominas", editando.id), {
        bonos,
        comisiones,
        descuentos,
        ...recalculo,
        updatedAt: serverTimestamp(),
      });
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

      {editando ? (
        <NexxusCard extra="mt-8 w-full p-6" delay={100}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              Ajustar nómina de {editando.empleadoNombre}
            </h3>
            <button
              type="button"
              onClick={() => setEditando(null)}
              className="text-sm font-medium text-gray-600 hover:text-navy-700 dark:text-white/70 dark:hover:text-white"
            >
              Cerrar ✕
            </button>
          </div>
          <form onSubmit={handleGuardarEdicion} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        </NexxusCard>
      ) : null}

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
