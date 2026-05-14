
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
  async updateTask(taskId: string, data: Partial<Task>): Promise<void> {
    await updateDoc(doc(db, 'tareas', taskId), data);
  }
  async deleteTask(taskId: string): Promise<void> {
    await deleteDoc(doc(db, 'tareas', taskId));
  }
}
