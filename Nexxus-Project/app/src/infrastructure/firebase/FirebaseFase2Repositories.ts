import { collection, addDoc, query, where, orderBy, getDocs, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { InternalRequest, NuevaSolicitudInterna } from '@/domain/entities/InternalRequest';
import { IInternalRequestRepository, IChatContextualRepository, ContextualMessage } from '@/domain/repositories/IFase2Repositories';

export class FirebaseInternalRequestRepository implements IInternalRequestRepository {
  async create(userId: string, data: NuevaSolicitudInterna): Promise<InternalRequest> {
    const docData: any = {
      ...data,
      userId,
      estado: 'pendiente',
      timestamp: new Date().toISOString(),
      flujo_aprobacion: [
        { paso: 1, asignado_a_rol: 'jefe' }
      ]
    };
    const docRef = await addDoc(collection(db, 'solicitudes_internas'), docData);
    return { id: docRef.id, ...docData } as InternalRequest;
  }

  async getByUser(userId: string): Promise<InternalRequest[]> {
    const q = query(
      collection(db, 'solicitudes_internas'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InternalRequest));
  }
}

export class FirebaseChatContextualRepository implements IChatContextualRepository {
  async sendMessage(data: Omit<ContextualMessage, 'id' | 'timestamp'>): Promise<ContextualMessage> {
    const docData = {
      ...data,
      timestamp: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'chat_contextual'), docData);
    return { id: docRef.id, ...docData } as ContextualMessage;
  }

  async getMessagesByContext(origenRefId: string): Promise<ContextualMessage[]> {
    const q = query(
      collection(db, 'chat_contextual'),
      where('origenRefId', '==', origenRefId),
      orderBy('timestamp', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContextualMessage));
  }

  subscribeToContext(origenRefId: string, callback: (msgs: ContextualMessage[]) => void): () => void {
    const q = query(
      collection(db, 'chat_contextual'),
      where('origenRefId', '==', origenRefId),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContextualMessage));
      callback(msgs);
    });
  }
}
