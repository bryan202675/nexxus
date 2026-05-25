/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseTaskRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */


// Importa { ITaskRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
// Importa { Task }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Task } from '../../domain/entities/Task';
// Importa { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';

/**
 * Implementa FirebaseTaskRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseTaskRepository implements ITaskRepository {
  // getTasksByUser agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getTasksByUser(userId: string): Promise<Task[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(collection(db, 'tareas'), where('asignado_a', '==', userId));
    // Declara snap; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snap = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
  }

  // subscribeTasksByUser agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  subscribeTasksByUser(userId: string, callback: (tasks: Task[]) => void): () => void {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(collection(db, 'tareas'), where('asignado_a', '==', userId));
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return onSnapshot(q, (snap) => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    }, (error) => {
      console.warn('FirebaseTaskRepository: subscribe error', error);
    });
  }
  // getTasksByCompany agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getTasksByCompany(empresaId: string): Promise<Task[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(collection(db, 'tareas'), where('empresaId', '==', empresaId));
    // Declara snap; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snap = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
  }
  // createTask agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async createTask(task: Omit<Task, 'id' | 'fecha_creacion'>): Promise<void> {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await addDoc(collection(db, 'tareas'), { ...task, fecha_creacion: new Date().toISOString() });
  }
  // updateTaskState agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async updateTaskState(taskId: string, estado: Task['estado']): Promise<void> {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await updateDoc(doc(db, 'tareas', taskId), { estado });
  }
  // updateTask agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async updateTask(taskId: string, data: Partial<Task>): Promise<void> {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await updateDoc(doc(db, 'tareas', taskId), data);
  }
  // deleteTask agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async deleteTask(taskId: string): Promise<void> {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await deleteDoc(doc(db, 'tareas', taskId));
  }
}
