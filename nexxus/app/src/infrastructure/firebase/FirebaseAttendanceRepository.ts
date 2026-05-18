/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseAttendanceRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';
// Importa { Attendance, NuevaEntradaAsistencia }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Attendance, NuevaEntradaAsistencia } from '@/domain/entities/Attendance';
// Importa { IAttendanceRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAttendanceRepository } from '@/domain/repositories/IAttendanceRepository';

/**
 * Implementa FirebaseAttendanceRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseAttendanceRepository implements IAttendanceRepository {
  // record agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async record(userId: string, data: NuevaEntradaAsistencia): Promise<Attendance> {
    // Calcula docData; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const docData: any = {
      ...data,
      userId,
      timestamp: new Date().toISOString(),
      offline_sync: false, // Default to false when recording live
    };
    
    // Clean undefined fields to prevent Firestore crashes
    Object.keys(docData).forEach(key => {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (docData[key] === undefined) {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        delete docData[key];
      }
    });

    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = await addDoc(collection(db, 'asistencias'), docData);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { id: docRef.id, ...docData } as Attendance;
  }

  // getByUser agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getByUser(userId: string, count: number = 50): Promise<Attendance[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(
      collection(db, 'asistencias'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(count)
    );
    // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snapshot = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance));
  }

  // getCurrentShift agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getCurrentShift(userId: string): Promise<Attendance | null> {
    // Busca el evento más reciente para ver si es una 'entrada' sin una 'salida' posterior
    const q = query(
      collection(db, 'asistencias'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snapshot = await getDocs(q);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (snapshot.empty) return null;
    // Declara last; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const last = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Attendance;
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return last.tipo === 'entrada' || last.tipo === 'fin_pausa' ? last : null;
  }

  // getByCompany agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getByCompany(empresaId: string, count: number = 100): Promise<Attendance[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(
      collection(db, 'asistencias'),
      where('empresaId', '==', empresaId),
      orderBy('timestamp', 'desc'),
      limit(count)
    );
    // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snapshot = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance));
  }
}
