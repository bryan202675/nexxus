/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseFeedbackRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { collection, addDoc, query, where, getDocs, Timestamp, orderBy } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';
// Importa { Feedback, IFeedbackRepository }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Feedback, IFeedbackRepository } from '@/domain/entities/Feedback';

/**
 * Implementa FirebaseFeedbackRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseFeedbackRepository implements IFeedbackRepository {
  // save agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async save(data: Omit<Feedback, 'id' | 'estado' | 'fecha'>): Promise<Feedback> {
    // Calcula docData; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const docData = {
      ...data,
      estado: 'pendiente',
      fecha: new Date().toISOString(),
      timestamp: Timestamp.now(),
    };
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = await addDoc(collection(db, 'feedbacks'), docData);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { id: docRef.id, ...docData } as Feedback;
  }

  // getByUser agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getByUser(userId: string): Promise<Feedback[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(
      collection(db, 'feedbacks'),
      where('userId', '==', userId),
      orderBy('fecha', 'desc')
    );
    // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snapshot = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
  }
}
