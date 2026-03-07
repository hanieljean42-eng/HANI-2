import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
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
  // 1. Initialiser l'app Firebase (éviter double init)
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  // 2. Initialiser la base de données
  database = getDatabase(app);

  // 3. Initialiser l'authentification avec persistance AsyncStorage
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (authError) {
    // Si déjà initialisé (double chargement module), récupérer l'instance existante
    console.warn('⚠️ initializeAuth error, fallback getAuth:', authError.message);
    auth = getAuth(app);
  }

  isConfigured = true;
  console.log('✅ Firebase connecté — auth:', !!auth, 'db:', !!database);
} catch (error) {
  firebaseError = error.message || 'Erreur inconnue Firebase';
  console.error('❌ Firebase init FAILED:', error);
}

export { app, database, auth, isConfigured, firebaseError };

export const GOOGLE_WEB_CLIENT_ID = '692477466695-nbk8ke52kf2jta63vsee32n64o92apec.apps.googleusercontent.com';

