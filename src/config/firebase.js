// ============================================================
// FIREBASE — Initialisation robuste pour React Native / Hermes
// ============================================================
// Stratégie : les imports compat FORCENT l'enregistrement des
// composants Firebase (auth, database) dans le registre interne.
// Cela résout l'erreur "component auth has not been registered yet"
// qui survient avec Hermes/Metro en builds production.
// Ensuite on utilise l'API modulaire normalement.
// ============================================================

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';      // Force l'enregistrement du composant auth
import 'firebase/compat/database';   // Force l'enregistrement du composant database

import { getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
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
  // 1. Initialiser via compat (garantit l'enregistrement des composants)
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // 2. Récupérer l'app modulaire depuis le registre partagé
  app = getApp();

  // 3. Database — API modulaire
  database = getDatabase(app);

  // 4. Auth — API modulaire avec persistence AsyncStorage
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    // Déjà initialisé (hot reload ou compat) → récupérer l'instance existante
    auth = getAuth(app);
  }

  isConfigured = !!auth;
  console.log('✅ Firebase connecté — auth:', !!auth, 'db:', !!database);
} catch (error) {
  firebaseError = error.message || 'Erreur inconnue Firebase';
  console.error('❌ Firebase init FAILED:', error);
}

export { app, database, auth, isConfigured, firebaseError };

export const GOOGLE_WEB_CLIENT_ID = '692477466695-nbk8ke52kf2jta63vsee32n64o92apec.apps.googleusercontent.com';

