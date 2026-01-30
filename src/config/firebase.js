import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// ⚠️ IMPORTANT: Pour activer le mode temps réel, créez un projet Firebase gratuit:
// 1. Allez sur https://console.firebase.google.com/
// 2. Créez un nouveau projet
// 3. Activez "Realtime Database" 
// 4. Copiez vos clés de configuration ci-dessous
// 5. Réglez les règles de sécurité sur "test mode" pour commencer

const firebaseConfig = {
  apiKey: "AIzaSyDf2kl-QrVROEnc1lyLIoo9yb-X6jdESlg",
  authDomain: "couple-app-ac19e.firebaseapp.com",
  databaseURL: "https://couple-app-ac19e-default-rtdb.firebaseio.com",
  projectId: "couple-app-ac19e",
  storageBucket: "couple-app-ac19e.firebasestorage.app",
  messagingSenderId: "28681990481",
  appId: "1:28681990481:web:489c5f351b43fc4cd32370",
  measurementId: "G-31LZH2V5JW"
};

// Initialiser Firebase
let app = null;
let database = null;

// Vérifier si les clés sont configurées
const isConfigured = !firebaseConfig.apiKey.includes('Example');

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log('✅ Firebase connecté avec succès !');
  } catch (error) {
    console.log('❌ Erreur Firebase:', error.message);
  }
} else {
  console.log('⚠️ Firebase non configuré - Les jeux fonctionneront en mode local uniquement');
  console.log('📖 Pour activer le mode multijoueur à distance, configurez Firebase dans src/config/firebase.js');
}

export { app, database, isConfigured };

