/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseUserRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { doc, getDoc, updateDoc, collection, getDocs, onSnapshot, query, where } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { doc, getDoc, updateDoc, collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';
// Importa { IUserRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IUserRepository } from '@/domain/repositories/IUserRepository';
// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from '@/domain/entities/User';

/**
 * Implementa FirebaseUserRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseUserRepository implements IUserRepository {
  // getById agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getById(id: string): Promise<User | null> {
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = doc(db, 'usuarios', id);
    // Declara docSnap; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const docSnap = await getDoc(docRef);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (docSnap.exists()) {
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return null;
  }

  // update agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async update(id: string, data: Partial<User>): Promise<void> {
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = doc(db, 'usuarios', id);
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await updateDoc(docRef, data);
  }

  // getAll agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getAll(empresaId = ''): Promise<User[]> {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId) return [];
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.getAllByCompany(empresaId);
  }

  // getAllByCompany agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getAllByCompany(empresaId: string): Promise<User[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(collection(db, 'usuarios'), where('empresaId', '==', empresaId));
    // Declara querySnapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const querySnapshot = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }

  // setActive agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async setActive(id: string, activo: boolean): Promise<void> {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await this.update(id, { activo });
  }

  // subscribeToAll agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  subscribeToAll(empresaId: string, callback: (users: User[]) => void): () => void {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      callback([]);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return () => {};
    }
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(collection(db, 'usuarios'), where('empresaId', '==', empresaId));
    // Calcula unsubscribe; transforma la lista original en datos listos para renderizar o guardar.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Calcula users; transforma la lista original en datos listos para renderizar o guardar.
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      callback(users);
    });
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return unsubscribe;
  }
}
