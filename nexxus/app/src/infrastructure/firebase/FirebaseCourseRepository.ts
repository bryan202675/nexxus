/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseCourseRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { collection, query, where, getDocs, doc, getDoc } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db, functions } from './firebaseConfig';
// Importa { Course, ICourseRepository }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Course, ICourseRepository, TrainingProgress } from '@/domain/entities/Course';


/**
 * Implementa FirebaseCourseRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseCourseRepository implements ICourseRepository {
  // getAll agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getAll(empresaId: string): Promise<Course[]> {
    let customCourses: Course[] = [];
    try {
      const q = query(collection(db, 'cursos'), where('empresaId', '==', empresaId), limit(120));
      const snapshot = await getDocs(q);
      customCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    } catch {
      customCourses = [];
    }

    return customCourses;
  }

  // getById agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getById(id: string): Promise<Course | null> {


    try {
      const d = await getDoc(doc(db, 'cursos', id));
      return d.exists() ? ({ id: d.id, ...d.data() } as Course) : null;
    } catch {
      return null;
    }
  }

  async getProgressForUser(empresaId: string, empleadoId: string): Promise<TrainingProgress[]> {
    const q = query(
      collection(db, 'capacitacion_avances'),
      where('empresaId', '==', empresaId),
      where('empleadoId', '==', empleadoId),
      limit(200)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as TrainingProgress));
  }

  async completeModule(cursoId: string, moduloIndex: number): Promise<TrainingProgress> {
    const completeTrainingModule = httpsCallable(functions, 'completeTrainingModule');
    const response = await completeTrainingModule({ cursoId, moduloIndex });
    return response.data as TrainingProgress;
  }
}
