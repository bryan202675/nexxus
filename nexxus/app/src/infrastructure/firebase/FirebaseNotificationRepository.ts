/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseNotificationRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */


// Importa { INotificationRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
// Importa { Notification }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Notification } from '../../domain/entities/Notification';
// Importa { collection, query, where, getDocs, updateDoc, doc, onSnapshot } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, orderBy, limit as firestoreLimit } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';

/**
 * Implementa FirebaseNotificationRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseNotificationRepository implements INotificationRepository {
  private buildUserQuery(userId: string, empresaId?: string, count = 60) {
    const constraints = [
      where('usuario_id', '==', userId),
      orderBy('fecha', 'desc'),
      firestoreLimit(count),
    ];
    if (empresaId) {
      constraints.unshift(where('empresaId', '==', empresaId));
    }
    return query(collection(db, 'notificaciones'), ...constraints);
  }

  // getNotificationsByUser agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getNotificationsByUser(userId: string, empresaId?: string, count = 60): Promise<Notification[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = this.buildUserQuery(userId, empresaId, count);
    // Declara snap; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snap = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
  }

  subscribeNotificationsByUser(userId: string, empresaId: string | undefined, callback: (notifications: Notification[]) => void, count = 60): () => void {
    const q = this.buildUserQuery(userId, empresaId, count);
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Notification));
      callback(notifications);
    }, (error) => {
      console.warn('FirebaseNotificationRepository: subscribe error', error);
    });
  }

  // markAsRead agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async markAsRead(notificationId: string): Promise<void> {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await updateDoc(doc(db, 'notificaciones', notificationId), { leida: true, fechaLectura: new Date().toISOString() });
  }
}
