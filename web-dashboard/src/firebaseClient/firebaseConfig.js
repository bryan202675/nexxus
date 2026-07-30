import { initializeApp, getApps } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

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
export const functions = getFunctions(app);

// Solo en dev: conecta al emulador de Cloud Functions (nexxus/backend) para operaciones que
// necesitan Admin SDK real (p.ej. resetear la contraseña de OTRO usuario -- el SDK de cliente no
// puede hacer eso sin conocer la contraseña anterior, por diseño de Firebase Auth). En produccion
// no hay Cloud Functions desplegadas (ver ARRANQUE.md), asi que estas llamadas solo funcionan
// mientras se desarrolla localmente con `npm run dev` desde la raiz del repo.
if (process.env.NODE_ENV === "development") {
  connectFunctionsEmulator(functions, "localhost", 5001);
}

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
