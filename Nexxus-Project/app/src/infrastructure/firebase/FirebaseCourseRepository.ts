import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Course, ICourseRepository } from '@/domain/entities/Course';

export class FirebaseCourseRepository implements ICourseRepository {
  async getAll(empresaId: string): Promise<Course[]> {
    const q = query(collection(db, 'cursos'), where('empresaId', '==', empresaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
  }

  async getById(id: string): Promise<Course | null> {
    const d = await getDoc(doc(db, 'cursos', id));
    return d.exists() ? ({ id: d.id, ...d.data() } as Course) : null;
  }
}
