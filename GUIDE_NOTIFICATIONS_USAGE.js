// ✅ GUIDE D'UTILISATION DES 3 NOUVELLES NOTIFICATIONS

// ============================================================
// 1. 💊 CAPSULE TEMPORELLE OUVERTE
// ============================================================

// Dans MemoriesScreen.js (quand on ouvre une capsule):
import { useNotifyPartner } from '../hooks/useNotifyPartner';

export default function MemoriesScreen() {
  const { notifyCapsuleOpened } = useNotifyPartner();
  
  const handleOpenCapsule = async (capsule) => {
    // ... logique d'ouverture ...
    
    // Notifier le partenaire
    await notifyCapsuleOpened(capsule.title);
  };
}

// Résultat:
// Destinataire reçoit: 💊 Capsule ouverte !
// Message: "Jean a ouvert la capsule 'Notre premier baiser' ! Venez revivre ce moment ensemble 💕"


// ============================================================
// 2. ⚡ DÉFI ASSIGNÉ (Nouveau Défi à Faire)
// ============================================================

// Dans ChallengesScreen.js (quand on ajoute un défi):
import { useNotifyPartner } from '../hooks/useNotifyPartner';

export default function ChallengesScreen() {
  const { notifyNewChallenge } = useNotifyPartner();
  
  const handleAddChallenge = async (challenge) => {
    // ... logique d'ajout du défi ...
    
    // Notifier le partenaire du nouveau défi
    await notifyNewChallenge(challenge.title);
  };
}

// Résultat:
// Destinataire reçoit: ⚡ Nouveau défi !
// Message: "Marie t'a assigné le défi 'Danse 15 min ensemble' ! Tu peux le faire ? 💪"


// ============================================================
// 3. 💕 RAPPELS INTELLIGENTS QUOTIDIENS
// ============================================================

// 3A. RAPPEL DU MATIN (9h) - Appeler une fois au démarrage
// Dans App.js:
import { useNotifications } from './src/context/NotificationContext';

export default function App() {
  const { scheduleDailyReminder } = useNotifications();
  
  // À l'initialisation (faire une seule fois)
  useEffect(() => {
    const initReminders = async () => {
      // Programmer le rappel du matin à 9h
      await scheduleDailyReminder();
      console.log('✅ Rappel du matin programmé');
    };
    initReminders();
  }, []);
  
  // ...
}

// Résultat chaque matin à 9h:
// Notification: 💕 Bonjour !
// Message: "N'oublie pas de dire bonjour à ton amour aujourd'hui !"


// 3B. RAPPEL INTELLIGENT (14h) - Appeler régulièrement
// Dans HomeScreen.js ou AppNavigator.js:
import { useNotifyPartner } from '../hooks/useNotifyPartner';
import { useData } from '../context/DataContext';

export default function HomeScreen() {
  const { sendSmartReminder } = useNotifyPartner();
  const { challenges } = useData();
  
  // Appeler quand on revient à l'app
  useFocusEffect(
    useCallback(() => {
      const scheduleReminder = async () => {
        // Vérifier si défi non complété
        const todaysChallenge = challenges.find(c => !c.completed);
        const isChallengeIncomplete = !!todaysChallenge;
        
        // Programmer le rappel
        await sendSmartReminder(isChallengeIncomplete);
      };
      scheduleReminder();
    }, [challenges])
  );
  
  // ...
}

// Résultat chaque jour à 14h:
// Mode 1 (défi non complété):
//   Notification: ⚡ Le défi t'attend !
//   Message: "Vous n'avez pas encore complété le défi d'aujourd'hui ! C'est le moment ? 🎯"
//
// Mode 2 (pas de défi ou tous complétés):
//   Notification: 💬 Prends du temps ensemble
//   Message: "Ça fait un moment que tu n'as pas parlé avec [partenaire]... Elle/il te manque peut-être ? 💭"


// ============================================================
// CONFIGURATION ANDROID 13+ GARANTIE
// ============================================================

// Toutes les notifications utilisent:
// 1. Canaux Android configurés (default + love-messages)
// 2. Priorités appropriées (HIGH pour urgents, DEFAULT pour rappels)
// 3. Sons et vibrations activés
// 4. Tokens Firebase pour push au partenaire
// 5. Fallback local si pas de connexion réseau

// Format local:
Notifications.scheduleNotificationAsync({
  content: {
    title: 'Titre',
    body: 'Corps du message',
    sound: 'default',
    priority: Notifications.AndroidNotificationPriority.HIGH, // ou DEFAULT
  },
  trigger: { seconds: X } // ou { date: targetDate } pour les lettres programmées
})

// Format push (via Firebase):
sendPushNotification(title, body, { type: 'event_type' })
// → Vérifie si token du partenaire existe
// → Envoie via Expo Push Service
// → Fallback sur local si erreur réseau


// ============================================================
// ✅ TOUT PRÊT POUR UTILISATION
// ============================================================
