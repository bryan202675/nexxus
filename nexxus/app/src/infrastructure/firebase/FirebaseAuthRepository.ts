/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebaseAuthRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
// Importa { doc, getDoc, setDoc } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { doc, getDoc, setDoc } from 'firebase/firestore';
// Importa { auth, db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from './firebaseConfig';
// Importa { IAuthRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAuthRepository } from '@/domain/repositories/IAuthRepository';
// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from '@/domain/entities/User';
// Importa { AuthError }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { AuthError } from '@/domain/errors/AuthError';

/**
 * Implementa FirebaseAuthRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class FirebaseAuthRepository implements IAuthRepository {
  // login agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async login(correo: string, password: string): Promise<User> {
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara userCredential; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const userCredential = await signInWithEmailAndPassword(auth, correo, password);
      // Declara user; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const user = await this.getById(userCredential.user.uid);
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (!user) throw AuthError.userNotFound();
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return user;
    } catch (error: any) {
      // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
      throw AuthError.fromFirebase(error.code);
    }
  }

  // loginEmpresarial agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async loginEmpresarial(codigoEmpresa: string, usuario: string, password: string): Promise<User> {
    try {
      // El servidor valida usuario/código/contraseña contra Firestore (passwordInternoHash) y
      // solo devuelve el correo real de la cuenta -- nunca minamos un custom token aquí porque
      // eso requiere una cuenta de servicio con permiso signBlob que no existe en desarrollo
      // local, y el login nunca terminaba de completarse. Con el correo confirmado por el
      // servidor, cerramos el login con signInWithEmailAndPassword usando la MISMA contraseña
      // que el servidor ya validó como correcta.
      const loginCallable = httpsCallable(functions, 'loginEmpresarial', { timeout: 15000 });
      const result = await loginCallable({
        codigoEmpresa,
        usuario,
        password,
      });
      const data = result.data as { correo?: string };
      if (!data.correo) throw AuthError.invalidCredentials();
      const credential = await signInWithEmailAndPassword(auth, data.correo, password);
      const user = await this.getById(credential.user.uid);
      if (!user) {
        console.error('[FirebaseAuthRepository.loginEmpresarial] signIn ok pero doc usuarios/' + credential.user.uid + ' no existe');
        throw AuthError.userNotFound();
      }
      return user;
    } catch (error: any) {
      if (auth.currentUser) {
        await signOut(auth).catch(() => {});
      }
      if (error instanceof AuthError) throw error;
      const code = String(error?.code || '');
      const message = String(error?.message || '').toLowerCase();
      if (code === 'functions/deadline-exceeded' || code === 'functions/unavailable' || message.includes('exceeded') || message.includes('timeout') || message.includes('network')) {
        throw new AuthError('auth/network-timeout', 'Tiempo de espera agotado al conectar con el servidor. Verifica tu conexión a internet o el estado del backend.');
      }
      const rawMsg = error?.message || error?.details?.message || (typeof error === 'string' ? error : undefined);
      throw AuthError.fromFirebase(error?.code, rawMsg);
    }
  }

  // logout agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async logout(): Promise<void> {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await signOut(auth);
  }

  // getCurrentUser agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getCurrentUser(): Promise<User | null> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return new Promise((resolve) => {
      // Declara unsubscribe; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        unsubscribe();
        // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
        if (fbUser) {
          // Declara user; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const user = await this.getById(fbUser.uid);
          // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
          resolve(user);
        } else {
          // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
          resolve(null);
        }
      });
    });
  }

  // register agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async register(correo: string, password: string, nombre: string, rol: User['rol']): Promise<User> {
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara userCredential; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const userCredential = await createUserWithEmailAndPassword(auth, correo, password);
      // Declara uid; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const uid = userCredential.user.uid;
      
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await updateProfile(userCredential.user, { displayName: nombre });

      // Calcula newUser; normaliza fechas para comparaciones, filtros o etiquetas visibles.
      const newUser: User = {
        id: uid,
        nombre,
        correo,
        rol,
        departamento: 'General',
        racha: 0,
        activo: true,
        createdAt: new Date().toISOString()
      };

      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      await setDoc(doc(db, 'usuarios', uid), newUser);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return newUser;
    } catch (error: any) {
      // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
      throw AuthError.fromFirebase(error.code);
    }
  }

  // getById agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  private async getById(id: string): Promise<User | null> {
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = doc(db, 'usuarios', id);
    // Declara docSnap; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const docSnap = await getDoc(docRef);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (docSnap.exists()) {
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return docSnap.data() as User;
    }
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return null;
  }
}
