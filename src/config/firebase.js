import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// ⚠️ IMPORTANT: Pour activer le mode temps réel, créez un projet Firebase gratuit:
// 1. Allez sur https://console.firebase.google.com/
// 2. Créez un nouveau projet
// 3. Activez "Realtime Database" 
// 4. Activez "Storage" pour les médias
// 5. Copiez vos clés de configuration ci-dessous
// 6. Réglez les règles de sécurité sur "test mode" pour commencer

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

// Initialiser Firebase
let app = null;
let database = null;
let storage = null;

// Vérifier si les clés sont configurées
const isConfigured = !firebaseConfig.apiKey.includes('Example');

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    storage = getStorage(app);
    console.log('✅ Firebase connecté avec succès !');
    console.log('✅ Firebase Storage activé !');
  } catch (error) {
    console.log('❌ Erreur Firebase:', error.message);
  }
} else {
  console.log('⚠️ Firebase non configuré - Les jeux fonctionneront en mode local uniquement');
  console.log('📖 Pour activer le mode multijoueur à distance, configurez Firebase dans src/config/firebase.js');
}

export { app, database, storage, isConfigured };

