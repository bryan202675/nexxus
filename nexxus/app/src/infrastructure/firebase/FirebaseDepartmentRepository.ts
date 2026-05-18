/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseDepartmentRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc, onSnapshot } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc, onSnapshot } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';
// Importa { IDepartmentRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IDepartmentRepository } from '@/domain/repositories/IDepartmentRepository';
// Importa { Department }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Department } from '@/domain/entities/Department';

/**
 * Implementa FirebaseDepartmentRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseDepartmentRepository implements IDepartmentRepository {
  private collectionName = 'departments';

  // getDepartments agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getDepartments(empresaId: string): Promise<Department[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(collection(db, this.collectionName), where('empresaId', '==', empresaId));
    // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snapshot = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
  }

  // getDepartmentById agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getDepartmentById(id: string): Promise<Department | null> {
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = doc(db, this.collectionName, id);
    // Declara docSnap; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const docSnap = await getDoc(docRef);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!docSnap.exists()) return null;
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { id: docSnap.id, ...docSnap.data() } as Department;
  }

  // createDepartment agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async createDepartment(department: Omit<Department, 'id'>): Promise<string> {
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = doc(collection(db, this.collectionName));
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    await setDoc(docRef, department);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return docRef.id;
  }

  // updateDepartment agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async updateDepartment(id: string, department: Partial<Department>): Promise<void> {
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = doc(db, this.collectionName, id);
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await updateDoc(docRef, department);
  }

  // deleteDepartment agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async deleteDepartment(id: string): Promise<void> {
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = doc(db, this.collectionName, id);
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await deleteDoc(docRef);
  }

  // subscribeToAll agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  subscribeToAll(empresaId: string, callback: (departments: Department[]) => void): () => void {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(collection(db, this.collectionName), where('empresaId', '==', empresaId));
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return onSnapshot(q, (snapshot) => {
      // Calcula depts; transforma la lista original en datos listos para renderizar o guardar.
      const depts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      callback(depts);
    });
  }
}
