import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
