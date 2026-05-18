/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseAppointmentRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */


// Importa { IAppointmentRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
// Importa { Appointment }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Appointment } from '../../domain/entities/Appointment';
// Importa { collection, query, where, getDocs, addDoc } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';

/**
 * Implementa FirebaseAppointmentRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseAppointmentRepository implements IAppointmentRepository {
  // getAppointmentsByUser agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getAppointmentsByUser(userId: string): Promise<Appointment[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(collection(db, 'citas'), where('usuario_id', '==', userId));
    // Declara snap; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snap = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
  }
  // createAppointment agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async createAppointment(appointment: Omit<Appointment, 'id' | 'fecha_creacion' | 'estado'>): Promise<void> {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await addDoc(collection(db, 'citas'), { ...appointment, estado: 'programada', fecha_creacion: new Date().toISOString() });
  }
}
