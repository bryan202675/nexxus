import { collection, query, where, getDocs, doc, writeBatch, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { Payment } from '@/domain/entities/Payment';

export class FirebasePaymentRepository implements IPaymentRepository {
  private collectionName = 'payments';

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    const q = query(collection(db, this.collectionName), where('usuario_id', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
  }

  async getAllPayments(empresaId: string): Promise<Payment[]> {
    const q = query(collection(db, this.collectionName), where('empresaId', '==', empresaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
  }

  async getPaymentsByPeriod(empresaId: string, periodo: string): Promise<Payment[]> {
    const q = query(
      collection(db, this.collectionName), 
      where('empresaId', '==', empresaId),
      where('periodo', '==', periodo)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
  }

  async generatePayments(payments: Omit<Payment, 'id'>[]): Promise<void> {
    const batch = writeBatch(db);
    payments.forEach(payment => {
      const docRef = doc(collection(db, this.collectionName));
      batch.set(docRef, payment);
    });
    await batch.commit();
  }

  async updatePaymentStatus(paymentId: string, estado: 'Pagado' | 'Procesando' | 'Pendiente'): Promise<void> {
    const docRef = doc(db, this.collectionName, paymentId);
    await updateDoc(docRef, { estado });
  }

  subscribeByPeriod(empresaId: string, periodo: string, callback: (payments: Payment[]) => void): () => void {
    const q = query(
      collection(db, this.collectionName), 
      where('empresaId', '==', empresaId),
      where('periodo', '==', periodo)
    );
    return onSnapshot(q, (snapshot) => {
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      callback(payments);
    });
  }
}
