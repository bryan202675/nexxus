import { doc, getDoc, updateDoc, collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { User } from '@/domain/entities/User';

export class FirebaseUserRepository implements IUserRepository {
  async getById(id: string): Promise<User | null> {
    const docRef = doc(db, 'usuarios', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  }

  async update(id: string, data: Partial<User>): Promise<void> {
    const docRef = doc(db, 'usuarios', id);
    await updateDoc(docRef, data);
  }

  async getAll(empresaId = ''): Promise<User[]> {
    if (!empresaId) return [];
    return this.getAllByCompany(empresaId);
  }

  async getAllByCompany(empresaId: string): Promise<User[]> {
    const q = query(collection(db, 'usuarios'), where('empresaId', '==', empresaId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }

  async setActive(id: string, activo: boolean): Promise<void> {
    await this.update(id, { activo });
  }

  subscribeToAll(empresaId: string, callback: (users: User[]) => void): () => void {
    if (!empresaId) {
      callback([]);
      return () => {};
    }
    const q = query(collection(db, 'usuarios'), where('empresaId', '==', empresaId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      callback(users);
    });
    return unsubscribe;
  }
}
