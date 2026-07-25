/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseAnnouncementRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { collection, query, where, getDocs, doc, setDoc, deleteDoc, orderBy, onSnapshot } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, orderBy, onSnapshot, limit as firestoreLimit, writeBatch } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';
// Importa { IAnnouncementRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import {
  CommunicationCatalogItem,
  CommunicationDirectory,
  CommunicationDirectoryUser,
  CommunicationNotificationSummary,
  IAnnouncementRepository,
  PublishAnnouncementInput,
} from '@/domain/repositories/IAnnouncementRepository';
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
      orderBy('fecha', 'desc'),
      firestoreLimit(100)
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
      orderBy('fecha', 'desc'),
      firestoreLimit(100)
    );
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return onSnapshot(q, (snapshot) => {
      // Calcula announcements; transforma la lista original en datos listos para renderizar o guardar.
      const announcements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      callback(announcements);
    });
  }

  subscribeCommunicationDirectory(
    empresaId: string,
    callback: (directory: CommunicationDirectory) => void,
    onError?: () => void
  ): () => void {
    const directory: CommunicationDirectory = {
      usuarios: [],
      sedes: [],
      departamentos: [],
      cargos: [],
      roles: [],
      notificaciones: [],
    };
    const emit = () => callback({ ...directory });
    const subscribe = <T>(collectionName: string, key: keyof CommunicationDirectory, count = 300) => onSnapshot(
      query(collection(db, collectionName), where('empresaId', '==', empresaId), firestoreLimit(count)),
      (snapshot) => {
        directory[key] = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as CommunicationDirectory[typeof key];
        emit();
      },
      () => onError?.()
    );
    const unsubUsuarios = subscribe<CommunicationDirectoryUser>('usuarios', 'usuarios', 500);
    const unsubSedes = subscribe<CommunicationCatalogItem>('sedes', 'sedes', 250);
    const unsubDepartamentos = subscribe<CommunicationCatalogItem>('departments', 'departamentos', 250);
    const unsubCargos = subscribe<CommunicationCatalogItem>('cargos', 'cargos', 350);
    const unsubRoles = subscribe<CommunicationCatalogItem>('roles_personalizados', 'roles', 250);
    const unsubNotificaciones = subscribe<CommunicationNotificationSummary>('notificaciones', 'notificaciones', 500);
    return () => {
      unsubUsuarios();
      unsubSedes();
      unsubDepartamentos();
      unsubCargos();
      unsubRoles();
      unsubNotificaciones();
    };
  }

  async publishAnnouncement(input: PublishAnnouncementInput): Promise<string> {
    const announcementId = await this.createAnnouncement(input.announcement);
    const fecha = new Date().toISOString();
    const recipients = input.recipients.filter((recipient) => recipient.id);
    for (let i = 0; i < recipients.length; i += 420) {
      const batch = writeBatch(db);
      recipients.slice(i, i + 420).forEach((recipient) => {
        batch.set(doc(collection(db, 'notificaciones')), {
          empresaId: input.announcement.empresaId,
          usuario_id: recipient.id,
          titulo: input.announcement.alcance === 'privado' ? 'Anuncio privado' : 'Nuevo anuncio',
          mensaje: input.announcement.mensaje,
          tipo: input.announcement.alcance === 'privado' ? 'privada' : 'anuncio',
          leida: false,
          fecha,
          anuncioId: announcementId,
          alcance: input.announcement.alcance,
          canalDestino: input.announcement.canalDestino,
        });
      });
      await batch.commit();
    }
    const auditRef = doc(collection(db, 'audit_logs'));
    await setDoc(auditRef, {
      empresaId: input.announcement.empresaId,
      usuarioId: input.actor.id,
      usuarioNombre: input.actor.nombre,
      rol: input.actor.rol,
      accion: 'Publicación de Anuncio',
      modulo: 'Mensajería',
      detalles: `${input.announcement.canalDestino || input.announcement.departamentoDestino} · ${input.announcement.alcance || 'todos'} · ${recipients.length} receptores · ${input.announcement.prioridad}`,
      estado: input.announcement.prioridad === 'Urgente' || input.announcement.prioridad === 'Alta' ? 'Warning' : 'Success',
      ipAddress: 'Cliente Web',
      timestamp: fecha,
    });
    return announcementId;
  }
}
