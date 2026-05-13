import { collection, addDoc, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Feedback, IFeedbackRepository } from '@/domain/entities/Feedback';

export class FirebaseFeedbackRepository implements IFeedbackRepository {
  async save(data: Omit<Feedback, 'id' | 'estado' | 'fecha'>): Promise<Feedback> {
    const docData = {
      ...data,
      estado: 'pendiente',
      fecha: new Date().toISOString(),
      timestamp: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'feedbacks'), docData);
    return { id: docRef.id, ...docData } as Feedback;
  }

  async getByUser(userId: string): Promise<Feedback[]> {
    const q = query(
      collection(db, 'feedbacks'),
      where('userId', '==', userId),
      orderBy('fecha', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
  }
}
