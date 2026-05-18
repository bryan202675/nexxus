/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebasePaymentRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

import {
  collection, query, where, getDocs, doc,
  writeBatch, updateDoc, setDoc, onSnapshot,
  addDoc, deleteDoc, orderBy, limit,
} from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from './firebaseConfig';
// Importa { IPaymentRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
// Importa { Payment }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Payment } from '@/domain/entities/Payment';

/**
 * Implementa FirebasePaymentRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebasePaymentRepository implements IPaymentRepository {
  private col = 'payments';

  // getPaymentsByUser agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getPaymentsByUser(userId: string, empresaId?: string): Promise<Payment[]> {
    // Declara constraints; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const constraints: any[] = [where('usuario_id', '==', userId)];
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (empresaId) constraints.push(where('empresaId', '==', empresaId));
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(collection(db, this.col), ...constraints);
    // Declara snap; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snap = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
  }

  // getAllPayments agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getAllPayments(empresaId: string): Promise<Payment[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(collection(db, this.col), where('empresaId', '==', empresaId));
    // Declara snap; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snap = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
  }

  // getPaymentsByPeriod agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getPaymentsByPeriod(empresaId: string, periodo: string): Promise<Payment[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(
      collection(db, this.col),
      where('empresaId', '==', empresaId),
      where('periodo', '==', periodo),
    );
    // Declara snap; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snap = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
  }

  // getAllPaymentHistory agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getAllPaymentHistory(empresaId: string): Promise<Payment[]> {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(
      collection(db, this.col),
      where('empresaId', '==', empresaId),
      orderBy('createdAt', 'desc'),
      limit(500),
    );
    // Declara snap; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snap = await getDocs(q);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
  }

  // createPayment agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async createPayment(payment: Omit<Payment, 'id'>): Promise<string> {
    // Prepara ref; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const ref = await addDoc(collection(db, this.col), {
      ...payment,
      createdAt: new Date().toISOString(),
    });
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return ref.id;
  }

  // generatePayments agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async generatePayments(payments: Omit<Payment, 'id'>[]): Promise<void> {
    // Declara batch; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const batch = writeBatch(db);
    // Calcula now; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const now = new Date().toISOString();
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    payments.forEach(p => {
      // Prepara ref; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
      const ref = doc(collection(db, this.col));
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      batch.set(ref, { ...p, createdAt: now });
    });
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await batch.commit();
  }

  // updatePayment agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async updatePayment(paymentId: string, data: Partial<Payment>): Promise<void> {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await updateDoc(doc(db, this.col, paymentId), data as any);
  }

  // updatePaymentStatus agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async updatePaymentStatus(paymentId: string, estado: 'Pagado' | 'Procesando' | 'Pendiente'): Promise<void> {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await updateDoc(doc(db, this.col, paymentId), { estado });
  }

  // deletePayment agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async deletePayment(paymentId: string): Promise<void> {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await deleteDoc(doc(db, this.col, paymentId));
  }

  // subscribeByPeriod agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  subscribeByPeriod(empresaId: string, periodo: string, callback: (payments: Payment[]) => void): () => void {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(
      collection(db, this.col),
      where('empresaId', '==', empresaId),
      where('periodo', '==', periodo),
    );
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return onSnapshot(q, snap => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
    });
  }

  // subscribeAll agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  subscribeAll(empresaId: string, callback: (payments: Payment[]) => void): () => void {
    // Prepara q; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const q = query(collection(db, this.col), where('empresaId', '==', empresaId));
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return onSnapshot(q, snap => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
    });
  }
}
