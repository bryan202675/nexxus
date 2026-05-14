import { collection, addDoc, query, where, orderBy, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { InboxItem } from '@/domain/entities/Inbox';
import { IInboxRepository } from '@/domain/repositories/IInboxRepository';

export class FirebaseInboxRepository implements IInboxRepository {
  async getByUser(userId: string): Promise<InboxItem[]> {
    const q = query(
      collection(db, 'inbox_unificado'),
      where('userId', '==', userId),
      where('estado', '==', 'pendiente'),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InboxItem));
  }

  async resolveItem(itemId: string): Promise<void> {
    await updateDoc(doc(db, 'inbox_unificado', itemId), { estado: 'resuelto' });
  }

  async addItem(item: Omit<InboxItem, 'id' | 'timestamp'>): Promise<InboxItem> {
    const docData = {
      ...item,
      timestamp: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'inbox_unificado'), docData);
    return { id: docRef.id, ...docData } as InboxItem;
  }

  subscribeToInbox(userId: string, callback: (items: InboxItem[]) => void): () => void {
    const q = query(
      collection(db, 'inbox_unificado'),
      where('userId', '==', userId),
      where('estado', '==', 'pendiente'),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InboxItem));
      callback(items);
    });
  }
}
