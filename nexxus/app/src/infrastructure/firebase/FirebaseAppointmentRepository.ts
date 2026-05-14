
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { Appointment } from '../../domain/entities/Appointment';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export class FirebaseAppointmentRepository implements IAppointmentRepository {
  async getAppointmentsByUser(userId: string): Promise<Appointment[]> {
    const q = query(collection(db, 'citas'), where('usuario_id', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
  }
  async createAppointment(appointment: Omit<Appointment, 'id' | 'fecha_creacion' | 'estado'>): Promise<void> {
    await addDoc(collection(db, 'citas'), { ...appointment, estado: 'programada', fecha_creacion: new Date().toISOString() });
  }
}
