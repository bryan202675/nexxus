/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebasePauseRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { collection, addDoc, query, where, getDocs, Timestamp } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';
// Importa { IPauseRepository, Pause }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IPauseRepository, Pause } from '@/domain/repositories/IPauseRepository';

/**
 * Implementa FirebasePauseRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebasePauseRepository implements IPauseRepository {
  // save agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async save(userId: string, data: Omit<Pause, 'id' | 'userId'>): Promise<void> {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await addDoc(collection(db, 'pausas'), {
      ...data,
      userId,
      timestamp: Timestamp.now()
    });
  }

  // getByUser agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getByUser(userId: string): Promise<Pause[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(collection(db, 'pausas'), where('userId', '==', userId));
    // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snapshot = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pause));
  }
}
