import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  inMemoryPersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAPv_oeczlvXMvY_77UgHDuMtYXm6L07XQ",
  authDomain: "h-couple.firebaseapp.com",
  databaseURL: "https://h-couple-default-rtdb.firebaseio.com",
  projectId: "h-couple",
  storageBucket: "h-couple.firebasestorage.app",
  messagingSenderId: "692477466695",
  appId: "1:692477466695:web:4a588a7a7a4ae0ba92b962",
  measurementId: "G-ZG0BXRWMTC"
};

let app = null;
let database = null;
let auth = null;
let isConfigured = false;
let firebaseError = null;

try {
  // 1. Initialiser l'app (éviter double init)
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  // 2. Base de données
  database = getDatabase(app);

  // 3. Auth — stratégie à 3 niveaux de fallback
  //    Niveau 1 : initializeAuth + AsyncStorage persistence
  //    Niveau 2 : initializeAuth + inMemoryPersistence (si AsyncStorage échoue)
  //    Niveau 3 : getAuth (si auth déjà initialisé)
  const isAlreadyInit = (e) =>
    e?.code === 'auth/already-initialized' || String(e).includes('already');

  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e1) {
    if (isAlreadyInit(e1)) {
      auth = getAuth(app);
    } else {
      // Niveau 2 : persistence AsyncStorage a échoué → essayer sans
      console.warn('⚠️ Auth persistence failed, trying inMemory:', e1.message);
      try {
        auth = initializeAuth(app, { persistence: inMemoryPersistence });
      } catch (e2) {
        if (isAlreadyInit(e2)) {
          auth = getAuth(app);
        } else {
          // Niveau 3 : dernier recours — initializeAuth nu
          console.warn('⚠️ inMemory failed too, trying bare init:', e2.message);
          try {
            auth = initializeAuth(app);
          } catch (e3) {
            if (isAlreadyInit(e3)) {
              auth = getAuth(app);
            } else {
              throw e3;
            }
          }
        }
      }
    }
  }

  isConfigured = !!auth;
  console.log('✅ Firebase connecté — auth:', !!auth, 'db:', !!database);
} catch (error) {
  firebaseError = error.message || 'Erreur inconnue Firebase';
  console.error('❌ Firebase init FAILED:', error);
}

export { app, database, auth, isConfigured, firebaseError };

export const GOOGLE_WEB_CLIENT_ID = '692477466695-nbk8ke52kf2jta63vsee32n64o92apec.apps.googleusercontent.com';

