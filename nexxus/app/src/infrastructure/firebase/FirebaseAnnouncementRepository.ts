import { collection, query, where, getDocs, doc, setDoc, deleteDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { IAnnouncementRepository } from '@/domain/repositories/IAnnouncementRepository';
import { Announcement } from '@/domain/entities/Announcement';

export class FirebaseAnnouncementRepository implements IAnnouncementRepository {
  private collectionName = 'announcements';

  async getAnnouncements(empresaId: string): Promise<Announcement[]> {
    const q = query(
      collection(db, this.collectionName),
      where('empresaId', '==', empresaId),
      orderBy('fecha', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
  }

  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'fecha'>): Promise<string> {
    const docRef = doc(collection(db, this.collectionName));
    const fullAnnouncement = {
      ...announcement,
      fecha: new Date().toISOString()
    };
    await setDoc(docRef, fullAnnouncement);
    return docRef.id;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  subscribeToAll(empresaId: string, callback: (announcements: Announcement[]) => void): () => void {
    const q = query(
      collection(db, this.collectionName),
      where('empresaId', '==', empresaId),
      orderBy('fecha', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const announcements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      callback(announcements);
    });
  }
}
