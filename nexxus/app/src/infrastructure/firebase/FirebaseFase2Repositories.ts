/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseFase2Repositories.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { collection, addDoc, query, where, orderBy, getDocs, Timestamp, onSnapshot } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp, onSnapshot } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';
// Importa { InternalRequest, NuevaSolicitudInterna }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { InternalRequest, NuevaSolicitudInterna } from '@/domain/entities/InternalRequest';
// Importa { IInternalRequestRepository, IChatContextualRepository, ContextualMessage }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IInternalRequestRepository, IChatContextualRepository, ContextualMessage } from '@/domain/repositories/IFase2Repositories';

/**
 * Implementa FirebaseInternalRequestRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseInternalRequestRepository implements IInternalRequestRepository {
  // create agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async create(userId: string, data: NuevaSolicitudInterna): Promise<InternalRequest> {
    // Calcula docData; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const docData: any = {
      ...data,
      userId,
      estado: 'pendiente',
      timestamp: new Date().toISOString(),
      flujo_aprobacion: [
        { paso: 1, asignado_a_rol: 'jefe' }
      ]
    };
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = await addDoc(collection(db, 'solicitudes_internas'), docData);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { id: docRef.id, ...docData } as InternalRequest;
  }

  // getByUser agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getByUser(userId: string): Promise<InternalRequest[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(
      collection(db, 'solicitudes_internas'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snapshot = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InternalRequest));
  }
}

/**
 * Implementa FirebaseChatContextualRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseChatContextualRepository implements IChatContextualRepository {
  // sendMessage agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async sendMessage(data: Omit<ContextualMessage, 'id' | 'timestamp'>): Promise<ContextualMessage> {
    // Calcula docData; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const docData = {
      ...data,
      timestamp: new Date().toISOString(),
    };
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = await addDoc(collection(db, 'chat_contextual'), docData);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { id: docRef.id, ...docData } as ContextualMessage;
  }

  // getMessagesByContext agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getMessagesByContext(origenRefId: string): Promise<ContextualMessage[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(
      collection(db, 'chat_contextual'),
      where('origenRefId', '==', origenRefId),
      orderBy('timestamp', 'asc')
    );
    // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snapshot = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContextualMessage));
  }

  // subscribeToContext agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  subscribeToContext(origenRefId: string, callback: (msgs: ContextualMessage[]) => void): () => void {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(
      collection(db, 'chat_contextual'),
      where('origenRefId', '==', origenRefId),
      orderBy('timestamp', 'asc')
    );
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return onSnapshot(q, (snapshot) => {
      // Calcula msgs; transforma la lista original en datos listos para renderizar o guardar.
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContextualMessage));
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      callback(msgs);
    });
  }
}
