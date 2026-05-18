/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseCheckInRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';
// Importa { ICheckInRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { ICheckInRepository } from '@/domain/repositories/ICheckInRepository';
// Importa { CheckIn, NuevaEntradaCheckIn }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { CheckIn, NuevaEntradaCheckIn } from '@/domain/entities/CheckIn';

/**
 * Implementa FirebaseCheckInRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseCheckInRepository implements ICheckInRepository {
  // save agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async save(userId: string, data: NuevaEntradaCheckIn): Promise<CheckIn> {
    // Calcula docData; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const docData = {
      ...data,
      userId,
      empresaId: data.empresaId || '',
      empresa_id: data.empresaId || '',
      fecha: new Date().toISOString(),
      timestamp: Timestamp.now()
    };
    
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = await addDoc(collection(db, 'checkins'), docData);
    
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return {
      id: docRef.id,
      ...docData
    } as CheckIn;
  }

  // getByUser agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getByUser(userId: string, limitCount = 30): Promise<CheckIn[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(
      collection(db, 'checkins'),
      where('userId', '==', userId),
      limit(limitCount)
    );
    
    // Declara querySnapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const querySnapshot = await getDocs(q);
    // Calcula results; transforma la lista original en datos listos para renderizar o guardar.
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CheckIn));

    // Ordenar en memoria para evitar requerir un índice compuesto en Firestore
    return results.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }
}
