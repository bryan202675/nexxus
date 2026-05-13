
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { Notification } from '../../domain/entities/Notification';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export class FirebaseNotificationRepository implements INotificationRepository {
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    const q = query(collection(db, 'notificaciones'), where('usuario_id', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
  }
  async markAsRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, 'notificaciones', notificationId), { leida: true });
  }
}
