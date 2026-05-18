import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithCustomToken
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { IAuthRepository } from '@/domain/repositories/IAuthRepository';
import { User } from '@/domain/entities/User';
import { AuthError } from '@/domain/errors/AuthError';

export class FirebaseAuthRepository implements IAuthRepository {
  async login(correo: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, correo, password);
      const user = await this.getById(userCredential.user.uid);
      if (!user) throw AuthError.userNotFound();
      return user;
    } catch (error: any) {
      throw AuthError.fromFirebase(error.code);
    }
  }

  async loginEmpresarial(codigoEmpresa: string, usuario: string, password: string): Promise<User> {
    try {
      // 1. Buscar al usuario por codigoEmpresa y usuarioInterno
      const q = query(
        collection(db, 'usuarios'),
        where('codigoEmpresa', '==', codigoEmpresa.toUpperCase()),
        where('usuarioInterno', '==', usuario.toLowerCase())
      );

      const snapshot = await getDocs(q);
      
      // Filtrar en cliente para admitir usuarios con campo 'eliminado' indefinido
      const docValido = snapshot.docs.find(doc => doc.data().eliminado !== true);
      
      if (!docValido) {
        throw new AuthError('auth/user-not-found', 'Usuario o código de empresa incorrectos.');
      }

      const userData = docValido.data() as User;
      const userId = docValido.id;

      // 2. Validar password (En un sistema real esto se haría vía Cloud Function con hashing)
      if (userData.passwordInterno !== password) {
        throw AuthError.invalidCredentials();
      }

      // 3. Autenticar en Firebase Auth (Simulado o usando un custom token si se requiere persistencia nativa)
      // Para esta fase, si el usuario ya existe en Firestore con esas credenciales, lo damos por válido.
      // Si necesitamos que Firebase Auth lo reconozca como "autenticado" para reglas de seguridad:
      // OPCIÓN A: Usar el correo del usuario para hacer un login silencioso.
      if (userData.correo) {
        try {
          // Intentamos login con su correo y el mismo password (asumiendo que están sincronizados o es una cuenta de staff)
          await signInWithEmailAndPassword(auth, userData.correo, password);
        } catch (e) {
          console.warn('Login empresarial: No se pudo sincronizar con Firebase Auth, usando sesión basada en Firestore.', e);
        }
      }

      return { ...userData, id: userId };
    } catch (error: any) {
      if (error instanceof AuthError) throw error;
      throw AuthError.fromFirebase(error.code);
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  async getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        unsubscribe();
        if (fbUser) {
          const user = await this.getById(fbUser.uid);
          resolve(user);
        } else {
          resolve(null);
        }
      });
    });
  }

  async register(correo: string, password: string, nombre: string, rol: User['rol']): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, correo, password);
      const uid = userCredential.user.uid;
      
      await updateProfile(userCredential.user, { displayName: nombre });

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

      await setDoc(doc(db, 'usuarios', uid), newUser);
      return newUser;
    } catch (error: any) {
      throw AuthError.fromFirebase(error.code);
    }
  }

  private async getById(id: string): Promise<User | null> {
    const docRef = doc(db, 'usuarios', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as User;
    }
    return null;
  }
}
