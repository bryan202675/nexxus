/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseCourseRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { collection, query, where, getDocs, doc, getDoc } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';
// Importa { Course, ICourseRepository }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Course, ICourseRepository } from '@/domain/entities/Course';

/**
 * Implementa FirebaseCourseRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseCourseRepository implements ICourseRepository {
  // getAll agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getAll(empresaId: string): Promise<Course[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(collection(db, 'cursos'), where('empresaId', '==', empresaId));
    // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snapshot = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
  }

  // getById agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getById(id: string): Promise<Course | null> {
    // Prepara d; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const d = await getDoc(doc(db, 'cursos', id));
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return d.exists() ? ({ id: d.id, ...d.data() } as Course) : null;
  }
}
