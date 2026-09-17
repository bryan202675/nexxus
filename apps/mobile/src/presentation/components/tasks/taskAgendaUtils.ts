import { Task } from 'domain/entities/Task';

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const calendarDaysForMonth = (anchor: Date): Date[] => {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(year, month, index + 1);
    date.setHours(0, 0, 0, 0);
    return date;
  });
};

export const calendarDays = (anchor: Date, totalDays: number = 14) => {
  return calendarDaysForMonth(anchor);
};

export const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const isSameDay = (left: Date, right: Date) => dateKey(left) === dateKey(right);

export const taskMatchesDay = (task: Task, day: Date) => {
  if (!task.fecha_limite) return true;
  const dueDate = new Date(task.fecha_limite);
  return !Number.isNaN(dueDate.getTime()) && isSameDay(dueDate, day);
};

export const formatMonth = (date: Date) => {
  const monthName = MONTH_NAMES[date.getMonth()];
  return `${monthName} ${date.getFullYear()}`;
};

export const formatDayName = (date: Date) => {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return dayNames[date.getDay()];
};

export const formatTimelineTime = (task: Task) => {
  if (!task.fecha_limite || !task.fecha_limite.includes('T')) {
    return { hour: '10:00', period: 'AM' };
  }
  const date = new Date(task.fecha_limite);
  if (Number.isNaN(date.getTime())) {
    return { hour: '10:00', period: 'AM' };
  }

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const hourStr = `${hours}:${String(minutes).padStart(2, '0')}`;

  return { hour: hourStr, period };
};

export const formatCardTime = (task: Task) => {
  if (!task.fecha_limite) return '10:00 – 10:30 AM';
  const date = new Date(task.fecha_limite);
  if (Number.isNaN(date.getTime())) return '10:00 – 10:30 AM';

  if (!task.fecha_limite.includes('T')) {
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()].slice(0, 3).toLowerCase();
    return `Vence ${day} ${month}`;
  }

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const startTimeStr = `${hours}:${String(minutes).padStart(2, '0')} ${period}`;

  if (task.tiempoEstimado && task.tiempoEstimado > 0) {
    const endDate = new Date(date.getTime() + task.tiempoEstimado * 60 * 1000);
    let endHours = endDate.getHours();
    const endMinutes = endDate.getMinutes();
    const endPeriod = endHours >= 12 ? 'PM' : 'AM';
    endHours = endHours % 12 || 12;
    const endTimeStr = `${endHours}:${String(endMinutes).padStart(2, '0')} ${endPeriod}`;
    return `${startTimeStr} – ${endTimeStr}`;
  }

  return startTimeStr;
};

export const formatAssigneeName = (task: Task): { name: string; role: string } => {
  let name = (task.asignado_a || '').trim();

  // Si es un UUID o un ID largo de sistema
  if (!name || /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(name) || name.length > 25) {
    name = task.depto || 'Mi tarea';
  }

  const role = task.proyecto || task.depto || 'General';
  return { name, role };
};

export const taskTone = (task: Task, index: number) => {
  if (task.estado === 'completada') return '#F1F1EF';

  if (task.prioridad === 'Urgente' || task.prioridad === 'Alta') {
    return '#F8A8C6';
  }
  if (task.prioridad === 'Media') {
    return '#FFD9A5';
  }

  return '#F4F4F6';
};
