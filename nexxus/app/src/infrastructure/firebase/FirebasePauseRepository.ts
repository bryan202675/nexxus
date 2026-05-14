import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { IPauseRepository, Pause } from '@/domain/repositories/IPauseRepository';

export class FirebasePauseRepository implements IPauseRepository {
  async save(userId: string, data: Omit<Pause, 'id' | 'userId'>): Promise<void> {
    await addDoc(collection(db, 'pausas'), {
      ...data,
      userId,
      timestamp: Timestamp.now()
    });
  }

  async getByUser(userId: string): Promise<Pause[]> {
    const q = query(collection(db, 'pausas'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pause));
  }
}
