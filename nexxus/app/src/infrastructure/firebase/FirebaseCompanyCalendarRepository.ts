import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { CompanyCalendarCatalogItem, CompanyCalendarEvent, CompanyCalendarSnapshot } from '@/domain/entities/CompanyCalendar';
import { ICompanyCalendarRepository, SaveCompanyCalendarEventInput } from '@/domain/repositories/ICompanyCalendarRepository';
import { db } from './firebaseConfig';

export class FirebaseCompanyCalendarRepository implements ICompanyCalendarRepository {
  subscribeCompanyCalendar(
    empresaId: string,
    callback: (snapshot: CompanyCalendarSnapshot) => void,
    onError?: () => void
  ): () => void {
    const state: CompanyCalendarSnapshot = { eventos: [], usuarios: [], departamentos: [], sedes: [] };
    const emit = () => callback({ ...state });
    const unsubEventos = onSnapshot(
      query(collection(db, 'calendario_empresarial'), where('empresaId', '==', empresaId), orderBy('inicio', 'asc'), limit(500)),
      (snapshot) => {
        state.eventos = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as CompanyCalendarEvent));
        emit();
      },
      () => onError?.()
    );
    const subscribeCatalog = (collectionName: string, key: 'usuarios' | 'departamentos' | 'sedes', count = 300) => onSnapshot(
      query(collection(db, collectionName), where('empresaId', '==', empresaId), limit(count)),
      (snapshot) => {
        state[key] = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as CompanyCalendarCatalogItem));
        emit();
      },
      () => onError?.()
    );
    const unsubUsuarios = subscribeCatalog('usuarios', 'usuarios', 500);
    const unsubDepartamentos = subscribeCatalog('departments', 'departamentos', 300);
    const unsubSedes = subscribeCatalog('sedes', 'sedes', 250);
    return () => {
      unsubEventos();
      unsubUsuarios();
      unsubDepartamentos();
      unsubSedes();
    };
  }

  async saveEvent(input: SaveCompanyCalendarEventInput): Promise<string> {
    const { id, ...payload } = input;
    const cleanPayload = Object.fromEntries(Object.entries({
      ...payload,
      actualizadoEn: serverTimestamp(),
    }).filter(([, value]) => value !== undefined));
    if (id) {
      await updateDoc(doc(db, 'calendario_empresarial', id), cleanPayload);
      return id;
    }
    const ref = doc(collection(db, 'calendario_empresarial'));
    await setDoc(ref, {
      ...cleanPayload,
      creadoEn: serverTimestamp(),
    });
    return ref.id;
  }

  async deleteEvent(eventId: string): Promise<void> {
    await deleteDoc(doc(db, 'calendario_empresarial', eventId));
  }
}
