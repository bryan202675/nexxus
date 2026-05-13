const fs = require('fs');
const path = require('path');

const baseDir = '/Users/bryan/Desktop/nexxus1.1/app/src';

const createDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// 1. Entities
createDir(`${baseDir}/domain/entities`);
fs.writeFileSync(`${baseDir}/domain/entities/Task.ts`, `
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

fs.writeFileSync(`${baseDir}/domain/entities/Absence.ts`, `
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

fs.writeFileSync(`${baseDir}/domain/entities/Payment.ts`, `
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

fs.writeFileSync(`${baseDir}/domain/entities/Appointment.ts`, `
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

fs.writeFileSync(`${baseDir}/domain/entities/Notification.ts`, `
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
fs.writeFileSync(`${baseDir}/domain/repositories/ITaskRepository.ts`, `
import { Task } from '../entities/Task';
export interface ITaskRepository {
  getTasksByUser(userId: string): Promise<Task[]>;
  getTasksByCompany(empresaId: string): Promise<Task[]>;
  createTask(task: Omit<Task, 'id' | 'fecha_creacion'>): Promise<void>;
  updateTaskState(taskId: string, estado: Task['estado']): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
}
`);

fs.writeFileSync(`${baseDir}/domain/repositories/IAbsenceRepository.ts`, `
import { Absence } from '../entities/Absence';
export interface IAbsenceRepository {
  getAbsencesByUser(userId: string): Promise<Absence[]>;
  getAbsencesByCompany(empresaId: string): Promise<Absence[]>;
  createAbsence(absence: Omit<Absence, 'id' | 'fecha_solicitud' | 'estado'>): Promise<void>;
  updateAbsenceState(absenceId: string, estado: Absence['estado']): Promise<void>;
}
`);

fs.writeFileSync(`${baseDir}/domain/repositories/IPaymentRepository.ts`, `
import { Payment } from '../entities/Payment';
export interface IPaymentRepository {
  getPaymentsByUser(userId: string): Promise<Payment[]>;
}
`);

fs.writeFileSync(`${baseDir}/domain/repositories/IAppointmentRepository.ts`, `
import { Appointment } from '../entities/Appointment';
export interface IAppointmentRepository {
  getAppointmentsByUser(userId: string): Promise<Appointment[]>;
  createAppointment(appointment: Omit<Appointment, 'id' | 'fecha_creacion' | 'estado'>): Promise<void>;
}
`);

fs.writeFileSync(`${baseDir}/domain/repositories/INotificationRepository.ts`, `
import { Notification } from '../entities/Notification';
export interface INotificationRepository {
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
}
`);

// 3. Infrastructure Firebase Implementations
createDir(`${baseDir}/infrastructure/firebase`);
fs.writeFileSync(`${baseDir}/infrastructure/firebase/FirebaseTaskRepository.ts`, `
import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { Task } from '../../domain/entities/Task';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';

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

fs.writeFileSync(`${baseDir}/infrastructure/firebase/FirebaseAbsenceRepository.ts`, `
import { IAbsenceRepository } from '../../domain/repositories/IAbsenceRepository';
import { Absence } from '../../domain/entities/Absence';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';

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

fs.writeFileSync(`${baseDir}/infrastructure/firebase/FirebasePaymentRepository.ts`, `
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { Payment } from '../../domain/entities/Payment';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

export class FirebasePaymentRepository implements IPaymentRepository {
  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    const q = query(collection(db, 'nominas'), where('usuario_id', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
  }
}
`);

fs.writeFileSync(`${baseDir}/infrastructure/firebase/FirebaseAppointmentRepository.ts`, `
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { Appointment } from '../../domain/entities/Appointment';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

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

fs.writeFileSync(`${baseDir}/infrastructure/firebase/FirebaseNotificationRepository.ts`, `
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { Notification } from '../../domain/entities/Notification';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';

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
let containerCode = fs.readFileSync(containerPath, 'utf8');

const importsToAdd = `
import { FirebaseTaskRepository } from './FirebaseTaskRepository';
import { FirebaseAbsenceRepository } from './FirebaseAbsenceRepository';
import { FirebasePaymentRepository } from './FirebasePaymentRepository';
import { FirebaseAppointmentRepository } from './FirebaseAppointmentRepository';
import { FirebaseNotificationRepository } from './FirebaseNotificationRepository';

// Casos de Uso
import { GetTasks } from '@/application/use-cases/tasks/GetTasks';
import { CreateTask } from '@/application/use-cases/tasks/CreateTask';
import { UpdateTask } from '@/application/use-cases/tasks/UpdateTask';

import { GetAbsences } from '@/application/use-cases/absences/GetAbsences';
import { CreateAbsence } from '@/application/use-cases/absences/CreateAbsence';

import { GetPayments } from '@/application/use-cases/payments/GetPayments';

import { GetAppointments } from '@/application/use-cases/appointments/GetAppointments';
import { CreateAppointment } from '@/application/use-cases/appointments/CreateAppointment';

import { GetNotifications } from '@/application/use-cases/notifications/GetNotifications';
import { MarkNotificationRead } from '@/application/use-cases/notifications/MarkNotificationRead';
`;

containerCode = importsToAdd + containerCode;

containerCode = containerCode.replace('const checkInRepository = new FirebaseCheckInRepository();', `
const checkInRepository = new FirebaseCheckInRepository();
const taskRepository = new FirebaseTaskRepository();
const absenceRepository = new FirebaseAbsenceRepository();
const paymentRepository = new FirebasePaymentRepository();
const appointmentRepository = new FirebaseAppointmentRepository();
const notificationRepository = new FirebaseNotificationRepository();
`);

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

fs.writeFileSync(containerPath, containerCode);

// 4. Create Use Cases
createDir(`${baseDir}/application/use-cases/tasks`);
fs.writeFileSync(`${baseDir}/application/use-cases/tasks/GetTasks.ts`, `
import { ITaskRepository } from '@/domain/repositories/ITaskRepository';
export class GetTasks { constructor(private repo: ITaskRepository) {} execute(userId: string) { return this.repo.getTasksByUser(userId); } }
`);
fs.writeFileSync(`${baseDir}/application/use-cases/tasks/CreateTask.ts`, `
import { ITaskRepository } from '@/domain/repositories/ITaskRepository';
export class CreateTask { constructor(private repo: ITaskRepository) {} execute(task: any) { return this.repo.createTask(task); } }
`);
fs.writeFileSync(`${baseDir}/application/use-cases/tasks/UpdateTask.ts`, `
import { ITaskRepository } from '@/domain/repositories/ITaskRepository';
export class UpdateTask { constructor(private repo: ITaskRepository) {} execute(taskId: string, estado: any) { return this.repo.updateTaskState(taskId, estado); } }
`);

createDir(`${baseDir}/application/use-cases/absences`);
fs.writeFileSync(`${baseDir}/application/use-cases/absences/GetAbsences.ts`, `
import { IAbsenceRepository } from '@/domain/repositories/IAbsenceRepository';
export class GetAbsences { constructor(private repo: IAbsenceRepository) {} execute(userId: string) { return this.repo.getAbsencesByUser(userId); } }
`);
fs.writeFileSync(`${baseDir}/application/use-cases/absences/CreateAbsence.ts`, `
import { IAbsenceRepository } from '@/domain/repositories/IAbsenceRepository';
export class CreateAbsence { constructor(private repo: IAbsenceRepository) {} execute(absence: any) { return this.repo.createAbsence(absence); } }
`);

createDir(`${baseDir}/application/use-cases/payments`);
fs.writeFileSync(`${baseDir}/application/use-cases/payments/GetPayments.ts`, `
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
export class GetPayments { constructor(private repo: IPaymentRepository) {} execute(userId: string) { return this.repo.getPaymentsByUser(userId); } }
`);

createDir(`${baseDir}/application/use-cases/appointments`);
fs.writeFileSync(`${baseDir}/application/use-cases/appointments/GetAppointments.ts`, `
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
export class GetAppointments { constructor(private repo: IAppointmentRepository) {} execute(userId: string) { return this.repo.getAppointmentsByUser(userId); } }
`);
fs.writeFileSync(`${baseDir}/application/use-cases/appointments/CreateAppointment.ts`, `
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
export class CreateAppointment { constructor(private repo: IAppointmentRepository) {} execute(appointment: any) { return this.repo.createAppointment(appointment); } }
`);

createDir(`${baseDir}/application/use-cases/notifications`);
fs.writeFileSync(`${baseDir}/application/use-cases/notifications/GetNotifications.ts`, `
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
export class GetNotifications { constructor(private repo: INotificationRepository) {} execute(userId: string) { return this.repo.getNotificationsByUser(userId); } }
`);
fs.writeFileSync(`${baseDir}/application/use-cases/notifications/MarkNotificationRead.ts`, `
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
export class MarkNotificationRead { constructor(private repo: INotificationRepository) {} execute(notificationId: string) { return this.repo.markAsRead(notificationId); } }
`);

console.log('Firebase backend infrastructure generated!');
