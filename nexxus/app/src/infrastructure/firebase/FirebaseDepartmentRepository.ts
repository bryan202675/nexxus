import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { IDepartmentRepository } from '@/domain/repositories/IDepartmentRepository';
import { Department } from '@/domain/entities/Department';

export class FirebaseDepartmentRepository implements IDepartmentRepository {
  private collectionName = 'departments';

  async getDepartments(empresaId: string): Promise<Department[]> {
    const q = query(collection(db, this.collectionName), where('empresaId', '==', empresaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
  }

  async getDepartmentById(id: string): Promise<Department | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Department;
  }

  async createDepartment(department: Omit<Department, 'id'>): Promise<string> {
    const docRef = doc(collection(db, this.collectionName));
    await setDoc(docRef, department);
    return docRef.id;
  }

  async updateDepartment(id: string, department: Partial<Department>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, department);
  }

  async deleteDepartment(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  subscribeToAll(empresaId: string, callback: (departments: Department[]) => void): () => void {
    const q = query(collection(db, this.collectionName), where('empresaId', '==', empresaId));
    return onSnapshot(q, (snapshot) => {
      const depts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
      callback(depts);
    });
  }
}
