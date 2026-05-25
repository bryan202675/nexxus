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
  updateProfile,
  signInWithCustomToken
} from 'firebase/auth';
// Importa { doc, getDoc, setDoc, collection, query, where, getDocs } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
// Importa { auth, db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { auth, db } from './firebaseConfig';
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
      console.log(`[loginEmpresarial] Iniciando para empresa: ${codigoEmpresa}, usuario: ${usuario}`);
      // 1. Buscar al usuario por codigoEmpresa y usuarioInterno
      const q = query(
        collection(db, 'usuarios'),
        where('codigoEmpresa', '==', codigoEmpresa.toUpperCase()),
        where('usuarioInterno', '==', usuario.toLowerCase())
      );

      const snapshot = await getDocs(q);
      console.log(`[loginEmpresarial] Documentos encontrados en Firestore: ${snapshot.size}`);
      
      // Filtrar en cliente para admitir usuarios con campo 'eliminado' indefinido
      const docValido = snapshot.docs.find(doc => doc.data().eliminado !== true);
      
      if (!docValido) {
        console.warn('[loginEmpresarial] Usuario no encontrado o marcado como eliminado.');
        throw new AuthError('auth/user-not-found', 'Usuario o código de empresa incorrectos.');
      }

      const userData = docValido.data() as User;
      const userId = docValido.id;
      console.log(`[loginEmpresarial] Usuario encontrado: ${userData.nombre}, ID: ${userId}, correo: ${userData.correo}`);

      // 2. Validar password (En un sistema real esto se haría vía Cloud Function con hashing)
      if (userData.passwordInterno !== password) {
        console.warn('[loginEmpresarial] Validación de contraseña interna fallida.');
        throw AuthError.invalidCredentials();
      }

      // 3. Autenticar en Firebase Auth
      let finalUserId = userId;
      if (userData.correo) {
        try {
          console.log(`[loginEmpresarial] Intentando iniciar sesión silenciosa en Firebase Auth con correo: ${userData.correo}`);
          const userCred = await signInWithEmailAndPassword(auth, userData.correo, password);
          console.log(`[loginEmpresarial] Sesión sincronizada con Firebase Auth. UID: ${userCred.user.uid}`);
          
          // Si el UID autenticado no coincide con el ID de Firestore, migramos/duplicamos el perfil
          if (userCred.user.uid !== userId) {
            console.warn(`[loginEmpresarial] UID mismatch! Firestore ID: ${userId}, Firebase Auth UID: ${userCred.user.uid}`);
            const authUserDocRef = doc(db, 'usuarios', userCred.user.uid);
            const authUserDoc = await getDoc(authUserDocRef);
            if (!authUserDoc.exists()) {
              await setDoc(authUserDocRef, {
                ...userData,
                id: userCred.user.uid,
              });
              console.log(`[loginEmpresarial] Perfil copiado al UID de Auth: ${userCred.user.uid}`);
            }
            finalUserId = userCred.user.uid;
          }
        } catch (e: any) {
          console.warn(`[loginEmpresarial] Error al iniciar sesión silenciosa: ${e.code || e.message}`);
          if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
            console.log(`[loginEmpresarial] El usuario no existe en Firebase Auth, intentando crearlo...`);
            try {
              const userCred = await createUserWithEmailAndPassword(auth, userData.correo, password);
              const newUid = userCred.user.uid;
              await setDoc(doc(db, 'usuarios', newUid), {
                ...userData,
                id: newUid,
              });
              console.log(`[loginEmpresarial] Creado exitosamente en Firebase Auth y copiado a Firestore con UID: ${newUid}`);
              finalUserId = newUid;
            } catch (signUpError: any) {
              console.error('[loginEmpresarial] Error crítico al crear usuario en Firebase Auth:', signUpError);
            }
          } else {
            console.warn('[loginEmpresarial] Error de Firebase Auth no recuperable, usando sesión basada en Firestore.', e);
          }
        }
      }

      console.log(`[loginEmpresarial] Flujo finalizado con éxito. Retornando usuario ID: ${finalUserId}`);
      return { ...userData, id: finalUserId };
    } catch (error: any) {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (error instanceof AuthError) throw error;
      // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
      throw AuthError.fromFirebase(error.code);
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
