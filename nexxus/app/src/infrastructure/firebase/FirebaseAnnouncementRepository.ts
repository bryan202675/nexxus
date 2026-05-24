/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseAnnouncementRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { collection, query, where, getDocs, doc, setDoc, deleteDoc, orderBy, onSnapshot } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, orderBy, onSnapshot } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';
// Importa { IAnnouncementRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAnnouncementRepository } from '@/domain/repositories/IAnnouncementRepository';
// Importa { Announcement }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Announcement } from '@/domain/entities/Announcement';

/**
 * Implementa FirebaseAnnouncementRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseAnnouncementRepository implements IAnnouncementRepository {
  private collectionName = 'announcements';

  // getAnnouncements agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getAnnouncements(empresaId: string): Promise<Announcement[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(
      collection(db, this.collectionName),
      where('empresaId', '==', empresaId),
      orderBy('fecha', 'desc')
    );
    // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snapshot = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
  }

  // createAnnouncement agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'fecha'>): Promise<string> {
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = doc(collection(db, this.collectionName));
    // Calcula fullAnnouncement; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const fullAnnouncement = Object.fromEntries(Object.entries({
      ...announcement,
      fecha: new Date().toISOString()
    }).filter(([, value]) => value !== undefined));
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    await setDoc(docRef, fullAnnouncement);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return docRef.id;
  }

  // deleteAnnouncement agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async deleteAnnouncement(id: string): Promise<void> {
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = doc(db, this.collectionName, id);
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await deleteDoc(docRef);
  }

  // subscribeToAll agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  subscribeToAll(empresaId: string, callback: (announcements: Announcement[]) => void): () => void {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(
      collection(db, this.collectionName),
      where('empresaId', '==', empresaId),
      orderBy('fecha', 'desc')
    );
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return onSnapshot(q, (snapshot) => {
      // Calcula announcements; transforma la lista original en datos listos para renderizar o guardar.
      const announcements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      callback(announcements);
    });
  }
}
