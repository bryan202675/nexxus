/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseDocumentoRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { collection, query, where, getDocs, doc, updateDoc, orderBy } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, query, where, getDocs, doc, updateDoc, orderBy, addDoc, deleteDoc, onSnapshot, limit as firestoreLimit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db, functions } from './firebaseConfig';
// Importa { Documento, IDocumentoRepository }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { DocumentStorageStats, Documento, IDocumentoRepository } from '@/domain/entities/Documento';


/**
 * Implementa FirebaseDocumentoRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseDocumentoRepository implements IDocumentoRepository {
  // getByUser agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getByUser(userId: string): Promise<Documento[]> {
    let customDocs: Documento[] = [];
    try {
      const q = query(
        collection(db, 'documentos'),
        where('userId', '==', userId),
        orderBy('fechaSubida', 'desc'),
        firestoreLimit(120)
      );
      const snapshot = await getDocs(q);
      customDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Documento));
    } catch {
      customDocs = [];
    }

    return customDocs;
  }

  // markAsRead agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async markAsRead(documentoId: string): Promise<void> {

    const docRef = doc(db, 'documentos', documentoId);
    await updateDoc(docRef, { leido: true });
  }

  async getByCompany(empresaId: string): Promise<Documento[]> {
    let customDocs: Documento[] = [];
    try {
      const q = query(collection(db, 'documentos'), where('empresaId', '==', empresaId), orderBy('fechaSubida', 'desc'), firestoreLimit(300));
      const snapshot = await getDocs(q);
      customDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Documento));
    } catch {
      customDocs = [];
    }
    return customDocs;
  }

  subscribeByCompany(empresaId: string, callback: (documentos: Documento[]) => void, onError?: () => void): () => void {
    const q = query(collection(db, 'documentos'), where('empresaId', '==', empresaId), orderBy('fechaSubida', 'desc'), firestoreLimit(300));
    return onSnapshot(q, (snapshot) => {
      const customDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Documento));
      callback([...PREDEFINED_DOCUMENTS, ...customDocs]);
    }, () => {
      callback([...PREDEFINED_DOCUMENTS]);
      onError?.();
    });
  }

  async create(documentoData: Omit<Documento, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, 'documentos'), documentoData);
    return ref.id;
  }

  async delete(documentoId: string): Promise<void> {
    await deleteDoc(doc(db, 'documentos', documentoId));
  }

  async deleteWithAsset(documento: Pick<Documento, 'id' | 'publicId'>): Promise<void> {
    if (documento.publicId) {
      const borrar = httpsCallable(functions, 'deleteCloudinaryAsset');
      await borrar({ publicId: documento.publicId }).catch(() => null);
    }
    await this.delete(documento.id);
  }

  async getStorageStats(empresaId: string): Promise<DocumentStorageStats> {
    const getStats = httpsCallable<{ empresaId: string }, DocumentStorageStats>(functions, 'getStorageStatsByCompany');
    const res = await getStats({ empresaId });
    return res.data || { totalBytes: 0, uploadCount: 0, topUsers: [] };
  }
}
