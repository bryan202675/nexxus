/**
 * Fase A (modulo empleado): calculo real de dias de vacaciones disponibles -- Codigo de Trabajo de
 * El Salvador, Art. 177: 15 dias habiles por cada ano de servicio. No se guarda como columna
 * (evita que el numero se desincronice solo); se calcula en cada lectura a partir de fecha_ingreso
 * y las solicitudes de vacaciones ya aprobadas.
 *
 * Con menos de un ano de antiguedad: derecho proporcional a los dias trabajados del primer ano.
 * Con un ano o mas: 15 dias completos por cada periodo de aniversario, menos lo ya tomado en el
 * periodo de aniversario en curso.
 */
import { Absence } from '../entities/Absence';

const DIAS_VACACIONES_ANUALES = 15;
const MS_POR_DIA = 86400000;

function contarDiasTomados(solicitudes: Pick<Absence, 'tipo' | 'estado' | 'fecha_inicio' | 'fecha_fin'>[], desde: Date, hasta: Date): number {
  return solicitudes
    .filter((s) => s.tipo === 'vacaciones' && s.estado === 'aprobada')
    .reduce((total, s) => {
      const inicio = new Date(s.fecha_inicio);
      const fin = new Date(s.fecha_fin);
      if (fin < desde || inicio > hasta) return total;
      const dias = Math.floor((fin.getTime() - inicio.getTime()) / MS_POR_DIA) + 1;
      return total + Math.max(0, dias);
    }, 0);
}

export function calcularDiasVacacionesDisponibles(
  fechaIngresoIso: string | null | undefined,
  solicitudes: Pick<Absence, 'tipo' | 'estado' | 'fecha_inicio' | 'fecha_fin'>[],
  ahora: Date = new Date(),
): number {
  if (!fechaIngresoIso) return 0;
  const fechaIngreso = new Date(fechaIngresoIso);
  if (Number.isNaN(fechaIngreso.getTime())) return 0;

  const diasAntiguedad = Math.floor((ahora.getTime() - fechaIngreso.getTime()) / MS_POR_DIA);
  if (diasAntiguedad < 0) return 0;

  if (diasAntiguedad < 365) {
    const derecho = Math.floor((DIAS_VACACIONES_ANUALES * diasAntiguedad) / 365);
    const tomados = contarDiasTomados(solicitudes, fechaIngreso, ahora);
    return Math.max(0, derecho - tomados);
  }

  const aniosCompletos = Math.floor(diasAntiguedad / 365);
  const inicioPeriodo = new Date(fechaIngreso);
  inicioPeriodo.setFullYear(inicioPeriodo.getFullYear() + aniosCompletos);

  const tomados = contarDiasTomados(solicitudes, inicioPeriodo, ahora);
  return Math.max(0, DIAS_VACACIONES_ANUALES - tomados);
}
