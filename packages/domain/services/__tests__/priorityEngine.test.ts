import { describe, it, expect } from 'vitest';
import {
  computeUrgencyFromDate,
  computeSignalScore,
  mapTareasAPrioritySignals,
  mapAusenciasAPrioritySignals,
  mapSolicitudesInternasAPrioritySignals,
  mapNotificacionesAPrioritySignals,
  mapAprobacionesReportAPrioritySignals,
  buildCheckInPendingSignal,
  mapAsistenciaIrregularAPrioritySignal,
  buildPriorityFeed,
} from '../priorityEngine';
import { Task } from '../../entities/Task';
import { Absence } from '../../entities/Absence';
import { RequestReportItem } from '../../entities/RequestReport';
import { Attendance } from '../../entities/Attendance';

const HOY = new Date('2026-08-10T12:00:00Z');
const fechaKey = (offsetDias: number) => {
  const d = new Date(HOY);
  d.setDate(d.getDate() + offsetDias);
  return d.toISOString().slice(0, 10);
};

describe('computeUrgencyFromDate', () => {
  it('sin fecha límite es "normal"', () => {
    expect(computeUrgencyFromDate(undefined, HOY)).toBe('normal');
  });

  it('fecha inválida es "normal" (no revienta)', () => {
    expect(computeUrgencyFromDate('no-es-fecha', HOY)).toBe('normal');
  });

  it('fecha en el pasado es "vencida"', () => {
    expect(computeUrgencyFromDate(fechaKey(-1), HOY)).toBe('vencida');
    expect(computeUrgencyFromDate(fechaKey(-30), HOY)).toBe('vencida');
  });

  it('fecha de hoy es "hoy"', () => {
    expect(computeUrgencyFromDate(fechaKey(0), HOY)).toBe('hoy');
  });

  it('fecha dentro de la ventana de 2 días es "proxima"', () => {
    expect(computeUrgencyFromDate(fechaKey(1), HOY)).toBe('proxima');
    expect(computeUrgencyFromDate(fechaKey(2), HOY)).toBe('proxima');
  });

  it('fecha más allá de la ventana es "normal"', () => {
    expect(computeUrgencyFromDate(fechaKey(3), HOY)).toBe('normal');
    expect(computeUrgencyFromDate(fechaKey(10), HOY)).toBe('normal');
  });
});

describe('computeSignalScore', () => {
  it('ordena estrictamente vencida > hoy > proxima > normal, sin importar la prioridad declarada', () => {
    const vencida = computeSignalScore('vencida', fechaKey(-1), 'baja', HOY);
    const hoy = computeSignalScore('hoy', fechaKey(0), 'urgente', HOY);
    const proxima = computeSignalScore('proxima', fechaKey(1), 'urgente', HOY);
    const normal = computeSignalScore('normal', undefined, 'urgente', HOY);

    expect(vencida).toBeGreaterThan(hoy);
    expect(hoy).toBeGreaterThan(proxima);
    expect(proxima).toBeGreaterThan(normal);
  });

  it('dentro del mismo nivel de urgencia, mayor prioridad declarada = mayor score', () => {
    const urgente = computeSignalScore('hoy', fechaKey(0), 'urgente', HOY);
    const baja = computeSignalScore('hoy', fechaKey(0), 'baja', HOY);

    expect(urgente).toBeGreaterThan(baja);
  });

  it('una tarea vencida hace más tiempo puntúa más que una vencida recién (con tope)', () => {
    const vencidaAyer = computeSignalScore('vencida', fechaKey(-1), undefined, HOY);
    const vencidaHaceUnMes = computeSignalScore('vencida', fechaKey(-45), undefined, HOY);
    const vencidaHaceUnaSemana = computeSignalScore('vencida', fechaKey(-7), undefined, HOY);

    expect(vencidaHaceUnaSemana).toBeGreaterThan(vencidaAyer);
    // El tope de 30 días hace que -45 y una vencida de hace 30+ días puntúen igual, no más.
    expect(vencidaHaceUnMes).toBe(computeSignalScore('vencida', fechaKey(-30), undefined, HOY));
  });
});

describe('mapTareasAPrioritySignals', () => {
  const tareaBase: Task = {
    id: 't1',
    titulo: 'Revisar nómina',
    descripcion: 'Cerrar el período',
    prioridad: 'Alta',
    estado: 'pendiente',
    progreso: 0,
    asignado_a: 'u1',
    empresaId: 'e1',
    fecha_creacion: fechaKey(-5),
  };

  it('excluye tareas completadas', () => {
    const signals = mapTareasAPrioritySignals([{ ...tareaBase, estado: 'completada' }], HOY);
    expect(signals).toHaveLength(0);
  });

  it('mapea una tarea vencida con category "tarea" y ruta a CentroTareas', () => {
    const [signal] = mapTareasAPrioritySignals([{ ...tareaBase, fecha_limite: fechaKey(-2) }], HOY);

    expect(signal.category).toBe('tarea');
    expect(signal.urgency).toBe('vencida');
    expect(signal.route).toBe('CentroTareas');
    expect(signal.routeParams).toEqual({ tareaId: 't1' });
  });
});

describe('mapAusenciasAPrioritySignals', () => {
  const ausenciaBase: Absence = {
    id: 'a1',
    usuario_id: 'u1',
    usuario_nombre: 'Ana Pérez',
    empresaId: 'e1',
    asunto: 'Vacaciones familiares',
    tipo: 'vacaciones',
    fecha_inicio: fechaKey(0),
    fecha_fin: fechaKey(5),
    motivo: 'Viaje',
    prioridad: 'media',
    estado: 'pendiente',
    fecha_solicitud: fechaKey(-3),
  };

  it('solo incluye ausencias en estado pendiente', () => {
    expect(mapAusenciasAPrioritySignals([{ ...ausenciaBase, estado: 'aprobada' }], HOY)).toHaveLength(0);
    expect(mapAusenciasAPrioritySignals([{ ...ausenciaBase, estado: 'pendiente' }], HOY)).toHaveLength(1);
  });

  it('category "aprobacion", incluye nombre del solicitante en el detalle', () => {
    const [signal] = mapAusenciasAPrioritySignals([ausenciaBase], HOY);
    expect(signal.category).toBe('aprobacion');
    expect(signal.detail).toContain('Ana Pérez');
  });
});

describe('mapSolicitudesInternasAPrioritySignals', () => {
  it('incluye solicitudes pendientes y revisadas, excluye aprobadas/rechazadas', () => {
    const base = {
      id: 's1',
      userId: 'u1',
      empresaId: 'e1',
      tipo: 'permiso' as const,
      titulo: 'Permiso médico',
      descripcion: 'Cita el viernes',
      prioridad: 'media' as const,
      flujo_aprobacion: [],
      timestamp: fechaKey(-1),
    };

    expect(mapSolicitudesInternasAPrioritySignals([{ ...base, estado: 'pendiente' }], HOY)).toHaveLength(1);
    expect(mapSolicitudesInternasAPrioritySignals([{ ...base, estado: 'revisado' }], HOY)).toHaveLength(1);
    expect(mapSolicitudesInternasAPrioritySignals([{ ...base, estado: 'aprobado' }], HOY)).toHaveLength(0);
    expect(mapSolicitudesInternasAPrioritySignals([{ ...base, estado: 'rechazado' }], HOY)).toHaveLength(0);
  });
});

describe('mapNotificacionesAPrioritySignals', () => {
  it('solo incluye notificaciones no leídas', () => {
    const base = {
      id: 'n1',
      usuario_id: 'u1',
      empresaId: 'e1',
      titulo: 'Nueva tarea asignada',
      mensaje: 'Se te asignó una tarea',
      tipo: 'tarea' as const,
      fecha: fechaKey(0),
    };

    expect(mapNotificacionesAPrioritySignals([{ ...base, leida: true }], HOY)).toHaveLength(0);
    expect(mapNotificacionesAPrioritySignals([{ ...base, leida: false }], HOY)).toHaveLength(1);
  });
});

describe('mapAprobacionesReportAPrioritySignals', () => {
  const itemBase: RequestReportItem = {
    id: 'r1',
    source: 'solicitud_ausencia',
    sourceCollection: 'solicitudes_ausencia',
    empresaId: 'e1',
    empleadoId: 'u1',
    empleadoNombre: 'Ana Pérez',
    tipo: 'vacaciones',
    titulo: 'Vacaciones familiares',
    descripcion: 'Viaje',
    estado: 'pendiente',
    prioridad: 'alta',
    fechaCreacion: fechaKey(-3),
    fechaInicio: fechaKey(-1),
    adjuntos: [],
  };

  it('solo incluye items en estado pendiente', () => {
    expect(mapAprobacionesReportAPrioritySignals([{ ...itemBase, estado: 'aprobada' }], HOY)).toHaveLength(0);
    expect(mapAprobacionesReportAPrioritySignals([{ ...itemBase, estado: 'pendiente' }], HOY)).toHaveLength(1);
  });

  it('usa fechaInicio si existe, si no cae a fechaCreacion', () => {
    const [conInicio] = mapAprobacionesReportAPrioritySignals([itemBase], HOY);
    expect(conInicio.dueDate).toBe(fechaKey(-1));
    expect(conInicio.urgency).toBe('vencida');

    const { fechaInicio, ...sinInicio } = itemBase;
    const [conCreacion] = mapAprobacionesReportAPrioritySignals([sinInicio as RequestReportItem], HOY);
    expect(conCreacion.dueDate).toBe(fechaKey(-3));
  });

  it('enruta solicitud_ausencia a SolicitudesAusencia y el resto a SolicitudesInternas', () => {
    const [ausencia] = mapAprobacionesReportAPrioritySignals([itemBase], HOY);
    expect(ausencia.route).toBe('SolicitudesAusencia');

    const [interna] = mapAprobacionesReportAPrioritySignals([{ ...itemBase, source: 'solicitud_interna' }], HOY);
    expect(interna.route).toBe('SolicitudesInternas');
  });
});

describe('buildCheckInPendingSignal', () => {
  it('devuelve null si el último check-in ya fue hoy', () => {
    expect(buildCheckInPendingSignal({ fecha: fechaKey(0) }, HOY)).toBeNull();
  });

  it('devuelve una señal si el último check-in fue ayer', () => {
    const signal = buildCheckInPendingSignal({ fecha: fechaKey(-1) }, HOY);
    expect(signal).not.toBeNull();
    expect(signal?.category).toBe('asistencia');
    expect(signal?.route).toBe('CheckInDiario');
  });

  it('devuelve una señal si nunca hubo check-in (null/undefined)', () => {
    expect(buildCheckInPendingSignal(null, HOY)).not.toBeNull();
    expect(buildCheckInPendingSignal(undefined, HOY)).not.toBeNull();
  });
});

describe('mapAsistenciaIrregularAPrioritySignal', () => {
  const asistenciaBase: Attendance = {
    id: 'as1',
    userId: 'u1',
    empresaId: 'e1',
    tipo: 'entrada',
    timestamp: fechaKey(0),
    estado_aprobacion: 'pendiente',
    offline_sync: false,
  };

  it('devuelve null si la asistencia no es tarde ni salida anticipada', () => {
    expect(mapAsistenciaIrregularAPrioritySignal(asistenciaBase, 'Ana', HOY)).toBeNull();
  });

  it('devuelve una señal con los minutos de tardanza en el detalle', () => {
    const signal = mapAsistenciaIrregularAPrioritySignal({ ...asistenciaBase, tarde: true, minutosTarde: 15 }, 'Ana', HOY);
    expect(signal?.detail).toContain('15');
    expect(signal?.title).toContain('Ana');
  });
});

describe('buildPriorityFeed', () => {
  it('mezcla varias fuentes y ordena por score descendente', () => {
    const tarea = mapTareasAPrioritySignals(
      [{ id: 't1', titulo: 'Vencida', descripcion: '', prioridad: 'Baja', estado: 'pendiente', progreso: 0, asignado_a: 'u1', empresaId: 'e1', fecha_creacion: fechaKey(-5), fecha_limite: fechaKey(-3) }],
      HOY
    );
    const notificacion = mapNotificacionesAPrioritySignals(
      [{ id: 'n1', usuario_id: 'u1', empresaId: 'e1', titulo: 'Info', mensaje: 'msg', tipo: 'info', leida: false, fecha: fechaKey(0) }],
      HOY
    );

    const feed = buildPriorityFeed([tarea, notificacion]);

    expect(feed[0].category).toBe('tarea'); // la vencida debe quedar primera
    expect(feed).toHaveLength(2);
  });

  it('trunca al límite indicado', () => {
    const muchasTareas = Array.from({ length: 20 }, (_, i) => ({
      id: `t${i}`,
      titulo: `Tarea ${i}`,
      descripcion: '',
      prioridad: 'Media' as const,
      estado: 'pendiente' as const,
      progreso: 0,
      asignado_a: 'u1',
      empresaId: 'e1',
      fecha_creacion: fechaKey(-1),
    }));

    const feed = buildPriorityFeed([mapTareasAPrioritySignals(muchasTareas, HOY)], 5);
    expect(feed).toHaveLength(5);
  });
});
