/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseInboxRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { collection, addDoc, query, where, orderBy, getDocs, doc, updateDoc, onSnapshot } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, addDoc, query, where, orderBy, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';
// Importa { InboxItem }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { InboxItem } from '@/domain/entities/Inbox';
// Importa { IInboxRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IInboxRepository } from '@/domain/repositories/IInboxRepository';

/**
 * Implementa FirebaseInboxRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseInboxRepository implements IInboxRepository {
  // getByUser agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getByUser(userId: string): Promise<InboxItem[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(
      collection(db, 'inbox_unificado'),
      where('userId', '==', userId),
      where('estado', '==', 'pendiente'),
      orderBy('timestamp', 'desc')
    );
    // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snapshot = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InboxItem));
  }

  // resolveItem agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async resolveItem(itemId: string): Promise<void> {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await updateDoc(doc(db, 'inbox_unificado', itemId), { estado: 'resuelto' });
  }

  // addItem agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async addItem(item: Omit<InboxItem, 'id' | 'timestamp'>): Promise<InboxItem> {
    // Calcula docData; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const docData = {
      ...item,
      timestamp: new Date().toISOString(),
    };
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = await addDoc(collection(db, 'inbox_unificado'), docData);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { id: docRef.id, ...docData } as InboxItem;
  }

  // subscribeToInbox agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  subscribeToInbox(userId: string, callback: (items: InboxItem[]) => void): () => void {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(
      collection(db, 'inbox_unificado'),
      where('userId', '==', userId),
      where('estado', '==', 'pendiente'),
      orderBy('timestamp', 'desc')
    );
    
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return onSnapshot(q, (snapshot) => {
      // Calcula items; transforma la lista original en datos listos para renderizar o guardar.
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InboxItem));
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      callback(items);
    });
  }
}
