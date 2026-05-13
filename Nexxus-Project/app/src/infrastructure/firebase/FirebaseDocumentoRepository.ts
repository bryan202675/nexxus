import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Documento, IDocumentoRepository } from '@/domain/entities/Documento';

export class FirebaseDocumentoRepository implements IDocumentoRepository {
  async getByUser(userId: string): Promise<Documento[]> {
    const q = query(
      collection(db, 'documentos'),
      where('userId', '==', userId),
      orderBy('fechaSubida', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Documento));
  }

  async markAsRead(documentoId: string): Promise<void> {
    const docRef = doc(db, 'documentos', documentoId);
    await updateDoc(docRef, { leido: true });
  }
}
