import { collection, addDoc, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { FocusSession, IFocusSessionRepository } from '@/domain/entities/FocusSession';

export class FirebaseFocusSessionRepository implements IFocusSessionRepository {
  async save(data: Omit<FocusSession, 'id'>): Promise<FocusSession> {
    const docRef = await addDoc(collection(db, 'focus_sessions'), {
      ...data,
      timestamp: Timestamp.now(),
    });
    return { id: docRef.id, ...data };
  }

  async getByUser(userId: string): Promise<FocusSession[]> {
    const q = query(
      collection(db, 'focus_sessions'),
      where('userId', '==', userId),
      orderBy('fecha', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FocusSession));
  }
}
