/**
 * Documentacion Nexxus - nexxus/generate_backend.js
 * Capa: app.
 * Proposito: Modulo generate_backend. Agrupa logica, tipos o configuracion usados por la app Nexxus.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa fs; usa utilidades de Node necesarias para scripts o configuracion local.
const fs = require('fs');
// Importa path; usa utilidades de Node necesarias para scripts o configuracion local.
const path = require('path');

/**
 * Declaracion baseDir. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const baseDir = '/Users/bryan/Desktop/nexxus1.1/app/src';

/**
 * Declaracion createDir. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const createDir = (dir) => {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// 1. Entities
createDir(`${baseDir}/domain/entities`);
// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
fs.writeFileSync(`${baseDir}/domain/entities/Task.ts`, `
/**
 * Define el contrato de datos Task; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface Task {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  estado: 'pendiente' | 'en_progreso' | 'completada';
  asignado_a: string;
  empresaId: string;
  fecha_creacion: string;
  fecha_limite?: string;
  depto?: string;
  jefe?: string;
}
`);

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
fs.writeFileSync(`${baseDir}/domain/entities/Absence.ts`, `
/**
 * Define el contrato de datos Absence; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface Absence {
  id: string;
  usuario_id: string;
  usuario_nombre: string;
  empresaId: string;
  tipo: 'vacaciones' | 'enfermedad' | 'personal' | 'otro';
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fecha_solicitud: string;
}
`);

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
fs.writeFileSync(`${baseDir}/domain/entities/Payment.ts`, `
/**
 * Define el contrato de datos Payment; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface Payment {
  id: string;
  usuario_id: string;
  empresaId: string;
  monto: number;
  moneda: string;
  periodo: string;
  fecha_pago: string;
  estado: 'pagado' | 'pendiente';
}
`);

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
fs.writeFileSync(`${baseDir}/domain/entities/Appointment.ts`, `
/**
 * Define el contrato de datos Appointment; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface Appointment {
  id: string;
  usuario_id: string;
  usuario_nombre: string;
  empresaId: string;
  especialista: string;
  especialidad: string;
  fecha: string;
  horario: string;
  tipoSesion: 'video' | 'chat' | 'presencial';
  estado: 'programada' | 'completada' | 'cancelada';
  fecha_creacion: string;
}
`);

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
fs.writeFileSync(`${baseDir}/domain/entities/Notification.ts`, `
/**
 * Define el contrato de datos Notification; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface Notification {
  id: string;
  usuario_id: string;
  empresaId: string;
  titulo: string;
  mensaje: string;
  tipo: 'tarea' | 'anuncio' | 'privada' | 'info';
  leida: boolean;
  fecha: string;
}
`);

// 2. Repository Interfaces
createDir(`${baseDir}/domain/repositories`);
// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
fs.writeFileSync(`${baseDir}/domain/repositories/ITaskRepository.ts`, `
// Importa { Task }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { Task } from '../entities/Task';
/**
 * Define el contrato de datos ITaskRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface ITaskRepository {
  getTasksByUser(userId: string): Promise<Task[]>;
  getTasksByCompany(empresaId: string): Promise<Task[]>;
  createTask(task: Omit<Task, 'id' | 'fecha_creacion'>): Promise<void>;
  updateTaskState(taskId: string, estado: Task['estado']): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
}
`);

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
fs.writeFileSync(`${baseDir}/domain/repositories/IAbsenceRepository.ts`, `
// Importa { Absence }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { Absence } from '../entities/Absence';
/**
 * Define el contrato de datos IAbsenceRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IAbsenceRepository {
  getAbsencesByUser(userId: string): Promise<Absence[]>;
  getAbsencesByCompany(empresaId: string): Promise<Absence[]>;
  createAbsence(absence: Omit<Absence, 'id' | 'fecha_solicitud' | 'estado'>): Promise<void>;
  updateAbsenceState(absenceId: string, estado: Absence['estado']): Promise<void>;
}
`);

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
fs.writeFileSync(`${baseDir}/domain/repositories/IPaymentRepository.ts`, `
// Importa { Payment }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { Payment } from '../entities/Payment';
/**
 * Define el contrato de datos IPaymentRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IPaymentRepository {
  getPaymentsByUser(userId: string): Promise<Payment[]>;
}
`);

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
fs.writeFileSync(`${baseDir}/domain/repositories/IAppointmentRepository.ts`, `
// Importa { Appointment }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { Appointment } from '../entities/Appointment';
/**
 * Define el contrato de datos IAppointmentRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IAppointmentRepository {
  getAppointmentsByUser(userId: string): Promise<Appointment[]>;
  createAppointment(appointment: Omit<Appointment, 'id' | 'fecha_creacion' | 'estado'>): Promise<void>;
}
`);

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
fs.writeFileSync(`${baseDir}/domain/repositories/INotificationRepository.ts`, `
// Importa { Notification }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { Notification } from '../entities/Notification';
/**
 * Define el contrato de datos INotificationRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface INotificationRepository {
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
}
`);

// 3. Infrastructure Firebase Implementations
createDir(`${baseDir}/infrastructure/firebase`);
// Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
fs.writeFileSync(`${baseDir}/infrastructure/firebase/FirebaseTaskRepository.ts`, `
// Importa { ITaskRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
// Importa { Task }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Task } from '../../domain/entities/Task';
// Importa { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';

/**
 * Implementa FirebaseTaskRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseTaskRepository implements ITaskRepository {
  async getTasksByUser(userId: string): Promise<Task[]> {
    const q = query(collection(db, 'tareas'), where('asignado_a', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
  }
  async getTasksByCompany(empresaId: string): Promise<Task[]> {
    const q = query(collection(db, 'tareas'), where('empresaId', '==', empresaId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
  }
  async createTask(task: Omit<Task, 'id' | 'fecha_creacion'>): Promise<void> {
    await addDoc(collection(db, 'tareas'), { ...task, fecha_creacion: new Date().toISOString() });
  }
  async updateTaskState(taskId: string, estado: Task['estado']): Promise<void> {
    await updateDoc(doc(db, 'tareas', taskId), { estado });
  }
  async deleteTask(taskId: string): Promise<void> {
    await deleteDoc(doc(db, 'tareas', taskId));
  }
}
`);

// Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
fs.writeFileSync(`${baseDir}/infrastructure/firebase/FirebaseAbsenceRepository.ts`, `
// Importa { IAbsenceRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAbsenceRepository } from '../../domain/repositories/IAbsenceRepository';
// Importa { Absence }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Absence } from '../../domain/entities/Absence';
// Importa { collection, query, where, getDocs, addDoc, updateDoc, doc } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';

/**
 * Implementa FirebaseAbsenceRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseAbsenceRepository implements IAbsenceRepository {
  async getAbsencesByUser(userId: string): Promise<Absence[]> {
    const q = query(collection(db, 'solicitudes_ausencia'), where('usuario_id', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Absence));
  }
  async getAbsencesByCompany(empresaId: string): Promise<Absence[]> {
    const q = query(collection(db, 'solicitudes_ausencia'), where('empresaId', '==', empresaId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Absence));
  }
  async createAbsence(absence: Omit<Absence, 'id' | 'fecha_solicitud' | 'estado'>): Promise<void> {
    await addDoc(collection(db, 'solicitudes_ausencia'), { ...absence, estado: 'pendiente', fecha_solicitud: new Date().toISOString() });
  }
  async updateAbsenceState(absenceId: string, estado: Absence['estado']): Promise<void> {
    await updateDoc(doc(db, 'solicitudes_ausencia', absenceId), { estado });
  }
}
`);

// Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
fs.writeFileSync(`${baseDir}/infrastructure/firebase/FirebasePaymentRepository.ts`, `
// Importa { IPaymentRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
// Importa { Payment }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Payment } from '../../domain/entities/Payment';
// Importa { collection, query, where, getDocs } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, query, where, getDocs } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';

/**
 * Implementa FirebasePaymentRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebasePaymentRepository implements IPaymentRepository {
  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    const q = query(collection(db, 'nominas'), where('usuario_id', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
  }
}
`);

// Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
fs.writeFileSync(`${baseDir}/infrastructure/firebase/FirebaseAppointmentRepository.ts`, `
// Importa { IAppointmentRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
// Importa { Appointment }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Appointment } from '../../domain/entities/Appointment';
// Importa { collection, query, where, getDocs, addDoc } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';

/**
 * Implementa FirebaseAppointmentRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseAppointmentRepository implements IAppointmentRepository {
  async getAppointmentsByUser(userId: string): Promise<Appointment[]> {
    const q = query(collection(db, 'citas'), where('usuario_id', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
  }
  async createAppointment(appointment: Omit<Appointment, 'id' | 'fecha_creacion' | 'estado'>): Promise<void> {
    await addDoc(collection(db, 'citas'), { ...appointment, estado: 'programada', fecha_creacion: new Date().toISOString() });
  }
}
`);

// Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
fs.writeFileSync(`${baseDir}/infrastructure/firebase/FirebaseNotificationRepository.ts`, `
// Importa { INotificationRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
// Importa { Notification }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Notification } from '../../domain/entities/Notification';
// Importa { collection, query, where, getDocs, updateDoc, doc } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';

/**
 * Implementa FirebaseNotificationRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseNotificationRepository implements INotificationRepository {
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    const q = query(collection(db, 'notificaciones'), where('usuario_id', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
  }
  async markAsRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, 'notificaciones', notificationId), { leida: true });
  }
}
`);

// Update container.ts
const containerPath = `${baseDir}/infrastructure/firebase/container.ts`;
/**
 * Declaracion containerCode. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
let containerCode = fs.readFileSync(containerPath, 'utf8');

/**
 * Declaracion importsToAdd. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const importsToAdd = `
// Importa { FirebaseTaskRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseTaskRepository } from './FirebaseTaskRepository';
// Importa { FirebaseAbsenceRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseAbsenceRepository } from './FirebaseAbsenceRepository';
// Importa { FirebasePaymentRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebasePaymentRepository } from './FirebasePaymentRepository';
// Importa { FirebaseAppointmentRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseAppointmentRepository } from './FirebaseAppointmentRepository';
// Importa { FirebaseNotificationRepository }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { FirebaseNotificationRepository } from './FirebaseNotificationRepository';

// Casos de Uso
// Importa { GetTasks }; ejecuta casos de uso que concentran reglas de negocio.
import { GetTasks } from '@/application/use-cases/tasks/GetTasks';
// Importa { CreateTask }; ejecuta casos de uso que concentran reglas de negocio.
import { CreateTask } from '@/application/use-cases/tasks/CreateTask';
// Importa { UpdateTask }; ejecuta casos de uso que concentran reglas de negocio.
import { UpdateTask } from '@/application/use-cases/tasks/UpdateTask';

// Importa { GetAbsences }; ejecuta casos de uso que concentran reglas de negocio.
import { GetAbsences } from '@/application/use-cases/absences/GetAbsences';
// Importa { CreateAbsence }; ejecuta casos de uso que concentran reglas de negocio.
import { CreateAbsence } from '@/application/use-cases/absences/CreateAbsence';

// Importa { GetPayments }; ejecuta casos de uso que concentran reglas de negocio.
import { GetPayments } from '@/application/use-cases/payments/GetPayments';

// Importa { GetAppointments }; ejecuta casos de uso que concentran reglas de negocio.
import { GetAppointments } from '@/application/use-cases/appointments/GetAppointments';
// Importa { CreateAppointment }; ejecuta casos de uso que concentran reglas de negocio.
import { CreateAppointment } from '@/application/use-cases/appointments/CreateAppointment';

// Importa { GetNotifications }; ejecuta casos de uso que concentran reglas de negocio.
import { GetNotifications } from '@/application/use-cases/notifications/GetNotifications';
// Importa { MarkNotificationRead }; ejecuta casos de uso que concentran reglas de negocio.
import { MarkNotificationRead } from '@/application/use-cases/notifications/MarkNotificationRead';
`;

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
containerCode = importsToAdd + containerCode;

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
containerCode = containerCode.replace('const checkInRepository = new FirebaseCheckInRepository();', `
/**
 * Pieza de repositorio checkInRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const checkInRepository = new FirebaseCheckInRepository();
/**
 * Pieza de repositorio taskRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const taskRepository = new FirebaseTaskRepository();
/**
 * Pieza de repositorio absenceRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const absenceRepository = new FirebaseAbsenceRepository();
/**
 * Pieza de repositorio paymentRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const paymentRepository = new FirebasePaymentRepository();
/**
 * Pieza de repositorio appointmentRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const appointmentRepository = new FirebaseAppointmentRepository();
/**
 * Pieza de repositorio notificationRepository. Representa operaciones de lectura/escritura usadas por los casos de negocio.
 */
const notificationRepository = new FirebaseNotificationRepository();
`);

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
containerCode = containerCode.replace('admin: {', `
  tasks: {
    getTasks: new GetTasks(taskRepository),
    createTask: new CreateTask(taskRepository),
    updateTask: new UpdateTask(taskRepository),
  },
  absences: {
    getAbsences: new GetAbsences(absenceRepository),
    createAbsence: new CreateAbsence(absenceRepository),
  },
  payments: {
    getPayments: new GetPayments(paymentRepository),
  },
  appointments: {
    getAppointments: new GetAppointments(appointmentRepository),
    createAppointment: new CreateAppointment(appointmentRepository),
  },
  notifications: {
    getNotifications: new GetNotifications(notificationRepository),
    markAsRead: new MarkNotificationRead(notificationRepository),
  },
  admin: {`);

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
fs.writeFileSync(containerPath, containerCode);

// 4. Create Use Cases
createDir(`${baseDir}/application/use-cases/tasks`);
// Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
fs.writeFileSync(`${baseDir}/application/use-cases/tasks/GetTasks.ts`, `
// Importa { ITaskRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { ITaskRepository } from '@/domain/repositories/ITaskRepository';
/**
 * Implementa GetTasks; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class GetTasks { constructor(private repo: ITaskRepository) {} execute(userId: string) { return this.repo.getTasksByUser(userId); } }
`);
// Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
fs.writeFileSync(`${baseDir}/application/use-cases/tasks/CreateTask.ts`, `
// Importa { ITaskRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { ITaskRepository } from '@/domain/repositories/ITaskRepository';
/**
 * Implementa CreateTask; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class CreateTask { constructor(private repo: ITaskRepository) {} execute(task: any) { return this.repo.createTask(task); } }
`);
// Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
fs.writeFileSync(`${baseDir}/application/use-cases/tasks/UpdateTask.ts`, `
// Importa { ITaskRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { ITaskRepository } from '@/domain/repositories/ITaskRepository';
/**
 * Implementa UpdateTask; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class UpdateTask { constructor(private repo: ITaskRepository) {} execute(taskId: string, estado: any) { return this.repo.updateTaskState(taskId, estado); } }
`);

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
createDir(`${baseDir}/application/use-cases/absences`);
// Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
fs.writeFileSync(`${baseDir}/application/use-cases/absences/GetAbsences.ts`, `
// Importa { IAbsenceRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAbsenceRepository } from '@/domain/repositories/IAbsenceRepository';
/**
 * Implementa GetAbsences; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class GetAbsences { constructor(private repo: IAbsenceRepository) {} execute(userId: string) { return this.repo.getAbsencesByUser(userId); } }
`);
// Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
fs.writeFileSync(`${baseDir}/application/use-cases/absences/CreateAbsence.ts`, `
// Importa { IAbsenceRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAbsenceRepository } from '@/domain/repositories/IAbsenceRepository';
/**
 * Implementa CreateAbsence; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class CreateAbsence { constructor(private repo: IAbsenceRepository) {} execute(absence: any) { return this.repo.createAbsence(absence); } }
`);

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
createDir(`${baseDir}/application/use-cases/payments`);
// Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
fs.writeFileSync(`${baseDir}/application/use-cases/payments/GetPayments.ts`, `
// Importa { IPaymentRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
/**
 * Implementa GetPayments; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class GetPayments { constructor(private repo: IPaymentRepository) {} execute(userId: string) { return this.repo.getPaymentsByUser(userId); } }
`);

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
createDir(`${baseDir}/application/use-cases/appointments`);
// Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
fs.writeFileSync(`${baseDir}/application/use-cases/appointments/GetAppointments.ts`, `
// Importa { IAppointmentRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
/**
 * Implementa GetAppointments; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class GetAppointments { constructor(private repo: IAppointmentRepository) {} execute(userId: string) { return this.repo.getAppointmentsByUser(userId); } }
`);
// Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
fs.writeFileSync(`${baseDir}/application/use-cases/appointments/CreateAppointment.ts`, `
// Importa { IAppointmentRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
/**
 * Implementa CreateAppointment; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class CreateAppointment { constructor(private repo: IAppointmentRepository) {} execute(appointment: any) { return this.repo.createAppointment(appointment); } }
`);

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
createDir(`${baseDir}/application/use-cases/notifications`);
// Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
fs.writeFileSync(`${baseDir}/application/use-cases/notifications/GetNotifications.ts`, `
// Importa { INotificationRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
/**
 * Implementa GetNotifications; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class GetNotifications { constructor(private repo: INotificationRepository) {} execute(userId: string) { return this.repo.getNotificationsByUser(userId); } }
`);
// Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
fs.writeFileSync(`${baseDir}/application/use-cases/notifications/MarkNotificationRead.ts`, `
// Importa { INotificationRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
/**
 * Implementa MarkNotificationRead; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class MarkNotificationRead { constructor(private repo: INotificationRepository) {} execute(notificationId: string) { return this.repo.markAsRead(notificationId); } }
`);

// Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
console.log('Firebase backend infrastructure generated!');
