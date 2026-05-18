/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseAuditLogRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { collection, query, where, getDocs, doc, setDoc, orderBy, limit as firestoreLimit, onSnapshot } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, query, where, getDocs, doc, setDoc, orderBy, limit as firestoreLimit, onSnapshot } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';
// Importa { IAuditLogRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAuditLogRepository } from '@/domain/repositories/IAuditLogRepository';
// Importa { AuditLog }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { AuditLog } from '@/domain/entities/AuditLog';

/**
 * Implementa FirebaseAuditLogRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseAuditLogRepository implements IAuditLogRepository {
  private collectionName = 'audit_logs';

  // getLogs agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getLogs(empresaId: string, limitCount = 50): Promise<AuditLog[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(
      collection(db, this.collectionName),
      where('empresaId', '==', empresaId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limitCount)
    );
    // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snapshot = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
  }

  // logAction agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async logAction(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = doc(collection(db, this.collectionName));
    // Calcula fullLog; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const fullLog = {
      ...log,
      timestamp: new Date().toISOString()
    };
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    await setDoc(docRef, fullLog);
  }

  // subscribeLogs agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  subscribeLogs(empresaId: string, limitCount = 50, callback: (logs: AuditLog[]) => void): () => void {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(
      collection(db, this.collectionName),
      where('empresaId', '==', empresaId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limitCount)
    );
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return onSnapshot(q, (snapshot) => {
      // Calcula logs; transforma la lista original en datos listos para renderizar o guardar.
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      callback(logs);
    });
  }
}
