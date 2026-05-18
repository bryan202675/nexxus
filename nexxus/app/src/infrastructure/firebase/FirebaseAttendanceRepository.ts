import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Attendance, NuevaEntradaAsistencia } from '@/domain/entities/Attendance';
import { IAttendanceRepository } from '@/domain/repositories/IAttendanceRepository';

export class FirebaseAttendanceRepository implements IAttendanceRepository {
  async record(userId: string, data: NuevaEntradaAsistencia): Promise<Attendance> {
    const docData: any = {
      ...data,
      userId,
      timestamp: new Date().toISOString(),
      offline_sync: false, // Default to false when recording live
    };
    
    // Clean undefined fields to prevent Firestore crashes
    Object.keys(docData).forEach(key => {
      if (docData[key] === undefined) {
        delete docData[key];
      }
    });

    const docRef = await addDoc(collection(db, 'asistencias'), docData);
    return { id: docRef.id, ...docData } as Attendance;
  }

  async getByUser(userId: string, count: number = 50): Promise<Attendance[]> {
    const q = query(
      collection(db, 'asistencias'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance));
  }

  async getCurrentShift(userId: string): Promise<Attendance | null> {
    // Busca el evento más reciente para ver si es una 'entrada' sin una 'salida' posterior
    const q = query(
      collection(db, 'asistencias'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const last = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Attendance;
    return last.tipo === 'entrada' || last.tipo === 'fin_pausa' ? last : null;
  }

  async getByCompany(empresaId: string, count: number = 100): Promise<Attendance[]> {
    const q = query(
      collection(db, 'asistencias'),
      where('empresaId', '==', empresaId),
      orderBy('timestamp', 'desc'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance));
  }
}
