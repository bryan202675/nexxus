
import { IAbsenceRepository } from '../../domain/repositories/IAbsenceRepository';
import { Absence } from '../../domain/entities/Absence';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export class FirebaseAbsenceRepository implements IAbsenceRepository {
  async getAbsencesByUser(userId: string): Promise<Absence[]> {
    const q = query(collection(db, 'solicitudes_ausencia'), where('usuario_id', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Absence));
  }
  async getAbsencesByCompany(empresaId: string): Promise<Absence[]> {
    const q = query(collection(db, 'solicitudes_ausencia'), where('empresaId', '==', empresaId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Absence));
  }
  async createAbsence(absence: Omit<Absence, 'id' | 'fecha_solicitud' | 'estado'>): Promise<void> {
    await addDoc(collection(db, 'solicitudes_ausencia'), { ...absence, estado: 'pendiente', fecha_solicitud: new Date().toISOString() });
  }
  async updateAbsenceState(absenceId: string, estado: Absence['estado']): Promise<void> {
    await updateDoc(doc(db, 'solicitudes_ausencia', absenceId), { estado });
  }
}
