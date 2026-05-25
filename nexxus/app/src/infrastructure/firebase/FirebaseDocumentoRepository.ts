/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseDocumentoRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { collection, query, where, getDocs, doc, updateDoc, orderBy } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, query, where, getDocs, doc, updateDoc, orderBy, addDoc, deleteDoc } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';
// Importa { Documento, IDocumentoRepository }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Documento, IDocumentoRepository } from '@/domain/entities/Documento';

/**
 * Implementa FirebaseDocumentoRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseDocumentoRepository implements IDocumentoRepository {
  // getByUser agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getByUser(userId: string): Promise<Documento[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(
      collection(db, 'documentos'),
      where('userId', '==', userId),
      orderBy('fechaSubida', 'desc')
    );
    // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snapshot = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Documento));
  }

  // markAsRead agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async markAsRead(documentoId: string): Promise<void> {
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = doc(db, 'documentos', documentoId);
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await updateDoc(docRef, { leido: true });
  }

  async getByCompany(empresaId: string): Promise<Documento[]> {
    const q = query(collection(db, 'documentos'), where('empresaId', '==', empresaId), orderBy('fechaSubida', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Documento));
  }

  async create(documentoData: Omit<Documento, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, 'documentos'), documentoData);
    return ref.id;
  }

  async delete(documentoId: string): Promise<void> {
    await deleteDoc(doc(db, 'documentos', documentoId));
  }
}
