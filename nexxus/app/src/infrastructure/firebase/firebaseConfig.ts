import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyBY3RaBUUAhERMJAs3arAKSJqwnAVvGegk",
  authDomain: "nexxus-5f119.firebaseapp.com",
  projectId: "nexxus-5f119",
  storageBucket: "nexxus-5f119.firebasestorage.app",
  messagingSenderId: "509899126401",
  appId: "1:509899126401:web:115f7be9cc9cbbd22c3f80",
  measurementId: "G-GPY2S51MK6"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let auth: any;

if (Platform.OS === 'web') {
  const { getAuth, browserLocalPersistence, setPersistence } = require('firebase/auth');
  const authInstance = getAuth(app);
  setPersistence(authInstance, browserLocalPersistence).catch(() => {});
  auth = authInstance;
} else {
  const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const messaging = Platform.OS === 'web'
  ? (() => {
      try {
        const { getMessaging, isSupported: isMessagingSupported } = require('firebase/messaging');
        return isMessagingSupported().then((yes: boolean) => yes ? getMessaging(app) : null);
      } catch {
        return Promise.resolve(null);
      }
    })()
  : Promise.resolve(null);
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

export default app;
