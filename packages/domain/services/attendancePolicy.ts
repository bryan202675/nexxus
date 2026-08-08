import { Attendance, AttendanceDailySummary, AttendanceSchedule } from '../entities/Attendance';

export const DEFAULT_ATTENDANCE_SCHEDULE: AttendanceSchedule = {
  horaEntrada: '08:00',
  horaSalida: '17:00',
  toleranciaMinutos: 10,
  horasEsperadas: 8,
};

const minutesFromTime = (value: string) => {
  const [hours, minutes] = value.split(':').map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
};

const minutesFromDate = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.getHours() * 60 + date.getMinutes();
};

export const dateKeyOf = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
};

export const calculateAttendanceFlags = (type: Attendance['tipo'], timestamp: string | Date, schedule: AttendanceSchedule, lastEntry?: Attendance) => {
  const eventMinutes = minutesFromDate(timestamp);
  const startMinutes = minutesFromTime(schedule.horaEntrada);
  const endMinutes = minutesFromTime(schedule.horaSalida);
  const lateMinutes = Math.max(0, eventMinutes - startMinutes - schedule.toleranciaMinutos);
  const earlyMinutes = Math.max(0, endMinutes - eventMinutes);
  const workedHours = type === 'salida' && lastEntry
    ? Math.max(0, (new Date(timestamp).getTime() - new Date(lastEntry.timestamp).getTime()) / 3600000)
    : 0;

  return {
    fechaJornada: dateKeyOf(timestamp),
    tarde: type === 'entrada' ? lateMinutes > 0 : false,
    minutosTarde: type === 'entrada' ? lateMinutes : 0,
    salidaAnticipada: type === 'salida' ? earlyMinutes > 0 : false,
    minutosSalidaAnticipada: type === 'salida' ? earlyMinutes : 0,
    horasTrabajadas: type === 'salida' ? Number(workedHours.toFixed(2)) : 0,
    horas_extra_calculadas: type === 'salida' ? Number(Math.max(0, workedHours - schedule.horasEsperadas).toFixed(2)) : 0,
  };
};

export const summarizeAttendanceDay = (events: Attendance[], schedule: AttendanceSchedule): AttendanceDailySummary[] => {
  const grouped = new Map<string, Attendance[]>();
  events.forEach((event) => {
    const key = `${event.userId}:${event.fechaJornada || dateKeyOf(event.timestamp)}`;
    grouped.set(key, [...(grouped.get(key) || []), event]);
  });

  return Array.from(grouped.values()).map((dayEvents) => {
    const sorted = [...dayEvents].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    const entrada = sorted.find((event) => event.tipo === 'entrada');
    const salidas = sorted.filter((event) => event.tipo === 'salida');
    const salida = salidas[salidas.length - 1];
    const workedHours = salida?.horasTrabajadas || (entrada && salida ? Math.max(0, (Date.parse(salida.timestamp) - Date.parse(entrada.timestamp)) / 3600000) : 0);
    const flags = entrada ? calculateAttendanceFlags('entrada', entrada.timestamp, schedule) : null;
    const salidaFlags = salida ? calculateAttendanceFlags('salida', salida.timestamp, schedule, entrada) : null;

    return {
      userId: sorted[0].userId,
      empresaId: sorted[0].empresaId,
      fecha: sorted[0].fechaJornada || dateKeyOf(sorted[0].timestamp),
      entrada: entrada?.timestamp,
      salida: salida?.timestamp,
      horasTrabajadas: Number(workedHours.toFixed(2)),
      horasExtra: Number(Math.max(0, workedHours - schedule.horasEsperadas).toFixed(2)),
      tarde: flags?.tarde || sorted.some((event) => event.tarde),
      minutosTarde: flags?.minutosTarde || sorted.reduce((total, event) => total + (event.minutosTarde || 0), 0),
      salidaAnticipada: salidaFlags?.salidaAnticipada || sorted.some((event) => event.salidaAnticipada),
      minutosSalidaAnticipada: salidaFlags?.minutosSalidaAnticipada || sorted.reduce((total, event) => total + (event.minutosSalidaAnticipada || 0), 0),
    };
  });
};
