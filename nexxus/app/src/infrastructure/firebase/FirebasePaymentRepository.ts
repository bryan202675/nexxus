import {
  collection, query, where, getDocs, doc,
  writeBatch, updateDoc, setDoc, onSnapshot,
  addDoc, deleteDoc, orderBy, limit,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { Payment } from '@/domain/entities/Payment';

export class FirebasePaymentRepository implements IPaymentRepository {
  private col = 'payments';

  async getPaymentsByUser(userId: string, empresaId?: string): Promise<Payment[]> {
    const constraints: any[] = [where('usuario_id', '==', userId)];
    if (empresaId) constraints.push(where('empresaId', '==', empresaId));
    const q = query(collection(db, this.col), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
  }

  async getAllPayments(empresaId: string): Promise<Payment[]> {
    const q = query(collection(db, this.col), where('empresaId', '==', empresaId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
  }

  async getPaymentsByPeriod(empresaId: string, periodo: string): Promise<Payment[]> {
    const q = query(
      collection(db, this.col),
      where('empresaId', '==', empresaId),
      where('periodo', '==', periodo),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
  }

  async getAllPaymentHistory(empresaId: string): Promise<Payment[]> {
    const q = query(
      collection(db, this.col),
      where('empresaId', '==', empresaId),
      orderBy('createdAt', 'desc'),
      limit(500),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
  }

  async createPayment(payment: Omit<Payment, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, this.col), {
      ...payment,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  }

  async generatePayments(payments: Omit<Payment, 'id'>[]): Promise<void> {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    payments.forEach(p => {
      const ref = doc(collection(db, this.col));
      batch.set(ref, { ...p, createdAt: now });
    });
    await batch.commit();
  }

  async updatePayment(paymentId: string, data: Partial<Payment>): Promise<void> {
    await updateDoc(doc(db, this.col, paymentId), data as any);
  }

  async updatePaymentStatus(paymentId: string, estado: 'Pagado' | 'Procesando' | 'Pendiente'): Promise<void> {
    await updateDoc(doc(db, this.col, paymentId), { estado });
  }

  async deletePayment(paymentId: string): Promise<void> {
    await deleteDoc(doc(db, this.col, paymentId));
  }

  subscribeByPeriod(empresaId: string, periodo: string, callback: (payments: Payment[]) => void): () => void {
    const q = query(
      collection(db, this.col),
      where('empresaId', '==', empresaId),
      where('periodo', '==', periodo),
    );
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
    });
  }

  subscribeAll(empresaId: string, callback: (payments: Payment[]) => void): () => void {
    const q = query(collection(db, this.col), where('empresaId', '==', empresaId));
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
    });
  }
}
