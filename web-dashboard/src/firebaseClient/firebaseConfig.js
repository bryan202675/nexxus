import { initializeApp, getApps } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Mismo proyecto que nexxus/app (nexxus/app/src/infrastructure/firebase/firebaseConfig.ts).
// En produccion este dashboard se sirve en /workspace del mismo origen que esa app (Firebase
// Hosting, ver nexxus/firebase.json), asi que comparte su sesion de Firebase Auth via la misma
// IndexedDB de origen sin nada extra. En dev (puertos distintos) cada uno tiene su propia sesion.
export const firebaseConfig = {
  apiKey: "AIzaSyB_Rsiou6gunOkUKSYWAW9LjPg6ILnRHXA",
  authDomain: "nexxus-hr.firebaseapp.com",
  projectId: "nexxus-hr",
  messagingSenderId: "436536765438",
  appId: "1:436536765438:web:ce5b0422dad64cc1936eaf",
  measurementId: "G-1MV86Y70VQ",
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});

// App secundaria: crear una cuenta de Firebase Auth con el SDK de cliente autentica
// automaticamente como esa cuenta nueva en la app donde se llama. Usamos una app de Firebase
// aparte solo para ese createUser, para no tirar la sesion del super admin en `app`.
let secondaryApp = null;
export function getSecondaryApp() {
  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, "nexxus-secondary");
  }
  return secondaryApp;
}
