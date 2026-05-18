/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseAbsenceRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */


// Importa { IAbsenceRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAbsenceRepository } from '../../domain/repositories/IAbsenceRepository';
// Importa { Absence }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Absence } from '../../domain/entities/Absence';
// Importa { collection, query, where, getDocs, addDoc, updateDoc, doc } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';

/**
 * Implementa FirebaseAbsenceRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseAbsenceRepository implements IAbsenceRepository {
  // getAbsencesByUser agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getAbsencesByUser(userId: string): Promise<Absence[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(collection(db, 'solicitudes_ausencia'), where('usuario_id', '==', userId));
    // Declara snap; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snap = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Absence));
  }
  // getAbsencesByCompany agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getAbsencesByCompany(empresaId: string): Promise<Absence[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(collection(db, 'solicitudes_ausencia'), where('empresaId', '==', empresaId));
    // Declara snap; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snap = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Absence));
  }
  // createAbsence agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async createAbsence(absence: Omit<Absence, 'id' | 'fecha_solicitud' | 'estado'>): Promise<void> {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await addDoc(collection(db, 'solicitudes_ausencia'), { ...absence, estado: 'pendiente', fecha_solicitud: new Date().toISOString() });
  }
  // updateAbsenceState agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async updateAbsenceState(absenceId: string, estado: Absence['estado']): Promise<void> {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await updateDoc(doc(db, 'solicitudes_ausencia', absenceId), { estado });
  }
}
