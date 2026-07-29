// Motor de cálculo de nómina para El Salvador. Puerto exacto de payrollPolicy.ts de la app
// original -- las cargas tributarias (ISSS/AFP/Renta) se dejan tal cual, sin "mejorar" ni
// redondear de forma distinta a la fuente.

// Tabla de tramos del Impuesto Sobre la Renta (ISR) mensual de El Salvador.
export function calcularRentaMensual(baseImponible) {
  if (baseImponible <= 472.0) return 0;
  if (baseImponible <= 895.24) return (baseImponible - 472.0) * 0.1 + 17.67;
  if (baseImponible <= 2038.1) return (baseImponible - 895.24) * 0.2 + 60.0;
  return (baseImponible - 2038.1) * 0.3 + 288.57;
}

// Calcula un registro de nómina completo a partir del salario base y las novedades del período
// (bonos, comisiones, descuentos manuales, minutos de tardanza, días de ausencia, horas extra).
export function calculatePayroll({
  salarioBase,
  bonos = 0,
  comisiones = 0,
  descuentos = 0,
  minutosTarde = 0,
  diasAusencia = 0,
  horasExtra = 0,
  valorHoraExtra,
}) {
  const valorHora = valorHoraExtra || salarioBase / 160;
  const descuentoTardanzas = (salarioBase / 160 / 60) * minutosTarde;
  const descuentoAusencias = (salarioBase / 30) * diasAusencia;
  const extra = horasExtra * valorHora * 1.5;
  const salarioBruto = salarioBase + bonos + comisiones + extra;
  const isss = Math.min(salarioBruto * 0.03, 30);
  const afp = salarioBruto * 0.0725;
  const renta = calcularRentaMensual(salarioBruto - isss - afp);
  const totalPagar =
    salarioBruto - isss - afp - renta - descuentos - descuentoTardanzas - descuentoAusencias;
  return {
    descuentoTardanzas,
    descuentoAusencias,
    salarioBruto,
    isss,
    afp,
    renta,
    totalPagar,
    horasExtra,
    valorHoraExtra: valorHora,
  };
}

// Recalcula un registro ya existente cuando el admin ajusta bonos/comisiones/descuentos desde el
// panel de edición -- conserva los descuentos por tardanzas/ausencias y las horas extra ya
// calculadas al generar la nómina (no vuelve a leer asistencias).
export function recalcularAjustes({
  salarioBase,
  bonos,
  comisiones,
  descuentos,
  horasExtra,
  valorHoraExtra,
  descuentoTardanzas,
  descuentoAusencias,
}) {
  const extra = horasExtra * valorHoraExtra * 1.5;
  const salarioBruto = salarioBase + bonos + comisiones + extra;
  const isss = Math.min(salarioBruto * 0.03, 30);
  const afp = salarioBruto * 0.0725;
  const renta = calcularRentaMensual(salarioBruto - isss - afp);
  const totalPagar =
    salarioBruto - isss - afp - renta - descuentos - descuentoTardanzas - descuentoAusencias;
  return { salarioBruto, isss, afp, renta, totalPagar };
}

// Formato exacto usado por subscribeNominas/generación: "Julio de 2026".
export function periodoActualLabel() {
  const raw = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
