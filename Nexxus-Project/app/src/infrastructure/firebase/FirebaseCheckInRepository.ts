import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { ICheckInRepository } from '@/domain/repositories/ICheckInRepository';
import { CheckIn, NuevaEntradaCheckIn } from '@/domain/entities/CheckIn';

export class FirebaseCheckInRepository implements ICheckInRepository {
  async save(userId: string, data: NuevaEntradaCheckIn): Promise<CheckIn> {
    const docData = {
      ...data,
      userId,
      empresa_id: data.empresaId || '',
      fecha: new Date().toISOString(),
      timestamp: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'checkins'), docData);
    
    return {
      id: docRef.id,
      ...docData
    } as CheckIn;
  }

  async getByUser(userId: string, limitCount = 30): Promise<CheckIn[]> {
    const q = query(
      collection(db, 'checkins'),
      where('userId', '==', userId),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CheckIn));

    // Ordenar en memoria para evitar requerir un índice compuesto en Firestore
    return results.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }
}
