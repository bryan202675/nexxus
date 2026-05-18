/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/firebaseConfig.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { initializeApp, getApps } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { initializeApp, getApps } from 'firebase/app';
// Importa { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
// Importa { getStorage } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { getStorage } from 'firebase/storage';
// Importa { getFunctions } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { getFunctions } from 'firebase/functions';
// Importa { getAnalytics, isSupported } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { getAnalytics, isSupported } from 'firebase/analytics';
// Importa { Platform } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Platform } from 'react-native';

/**
 * Configuracion firebaseConfig. Reune valores que otras piezas consumen para evitar duplicacion y cambios dispersos.
 */
const firebaseConfig = {
  apiKey: "AIzaSyBY3RaBUUAhERMJAs3arAKSJqwnAVvGegk",
  authDomain: "nexxus-5f119.firebaseapp.com",
  projectId: "nexxus-5f119",
  storageBucket: "nexxus-5f119.firebasestorage.app",
  messagingSenderId: "509899126401",
  appId: "1:509899126401:web:115f7be9cc9cbbd22c3f80",
  measurementId: "G-GPY2S51MK6"
};

/**
 * Declaracion app. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * Declaracion auth. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
let auth: any;

// Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
if (Platform.OS === 'web') {
  // Importa { getAuth, browserLocalPersistence, setPersistence } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
  const { getAuth, browserLocalPersistence, setPersistence } = require('firebase/auth');
  // Declara authInstance; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const authInstance = getAuth(app);
  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  setPersistence(authInstance, browserLocalPersistence).catch(() => {});
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  auth = authInstance;
} else {
  // Importa { initializeAuth, getReactNativePersistence } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
  const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
  // Importa AsyncStorage desde @react-native-async-storage/async-storage; agrega una dependencia externa necesaria para este modulo.
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export { auth };
/**
 * Declaracion db. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const db = getFirestore(app);
/**
 * Declaracion storage. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const storage = getStorage(app);
/**
 * Declaracion functions. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const functions = getFunctions(app);
/**
 * Declaracion messaging. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const messaging = Platform.OS === 'web'
  ? (() => {
      // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
      try {
        // Importa { getMessaging, isSupported: isMessagingSupported } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
        const { getMessaging, isSupported: isMessagingSupported } = require('firebase/messaging');
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return isMessagingSupported().then((yes: boolean) => yes ? getMessaging(app) : null);
      } catch {
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return Promise.resolve(null);
      }
    })()
  : Promise.resolve(null);
/**
 * Declaracion analytics. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

export default app;
