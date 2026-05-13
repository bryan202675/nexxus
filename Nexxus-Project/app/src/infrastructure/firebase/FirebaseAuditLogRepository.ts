import { collection, query, where, getDocs, doc, setDoc, orderBy, limit as firestoreLimit, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { IAuditLogRepository } from '@/domain/repositories/IAuditLogRepository';
import { AuditLog } from '@/domain/entities/AuditLog';

export class FirebaseAuditLogRepository implements IAuditLogRepository {
  private collectionName = 'audit_logs';

  async getLogs(empresaId: string, limitCount = 50): Promise<AuditLog[]> {
    const q = query(
      collection(db, this.collectionName),
      where('empresaId', '==', empresaId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
  }

  async logAction(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const docRef = doc(collection(db, this.collectionName));
    const fullLog = {
      ...log,
      timestamp: new Date().toISOString()
    };
    await setDoc(docRef, fullLog);
  }

  subscribeLogs(empresaId: string, limitCount = 50, callback: (logs: AuditLog[]) => void): () => void {
    const q = query(
      collection(db, this.collectionName),
      where('empresaId', '==', empresaId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limitCount)
    );
    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
      callback(logs);
    });
  }
}
