// Hook pour envoyer des notifications au partenaire depuis n'importe quel écran
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const useNotifyPartner = () => {
  const { user, partner } = useAuth();
  const notifications = useNotifications();

  // Accord grammatical selon le genre de l'expéditeur
  const accord = (user?.gender === 'feminin') ? 'e' : '';
  const partnerName = partner?.name || 'ton amour';

  // === SOUVENIRS & CAPSULES ===
  // ═══════════════════════════════════════════
  // SOUVENIRS & CAPSULES
  // ═══════════════════════════════════════════

  const notifyMemory = async () => {
    if (!notifications?.notifyNewMemory || !user?.name) return;
    await notifications.notifyNewMemory(user.name);
  };

  const notifyCapsule = async () => {
    if (!notifications?.notifyTimeCapsule || !user?.name) return;
    await notifications.notifyTimeCapsule(user.name);
  };

  const notifyCapsuleOpened = async (title) => {
    if (!notifications?.notifyCapsuleOpened || !user?.name) return;
    await notifications.notifyCapsuleOpened(user.name, title);
  };

  // ═══════════════════════════════════════════
  // CHAT & MESSAGES
  // ═══════════════════════════════════════════

  // message = texte, "📸 Photo" ou "🎤 Message vocal"
  const notifyLoveNote = async (message) => {
    if (!notifications?.notifyLoveNote || !user?.name) return;
    await notifications.notifyLoveNote(user.name, message);
  };

  const notifyNoteRead = async () => {
    if (!notifications?.sendPushNotification || !user?.name) return;
    await notifications.sendPushNotification(
      '👀 Message lu',
      `${user.name} a lu ton message 💕`,
      { type: 'note_read' }
    );
  };

  // ═══════════════════════════════════════════
  // DÉFIS
  // ═══════════════════════════════════════════

  // Appelé quand UN défi est complété
  const notifyChallenge = async (challengeName) => {
    if (!notifications?.notifyChallengeCompleted || !user?.name) return;
    await notifications.notifyChallengeCompleted(user.name, challengeName);
  };

  // Appelé quand un défi est assigné au partenaire
  const notifyNewChallenge = async (challengeName) => {
    if (!notifications?.notifyChallengeAssigned || !user?.name) return;
    await notifications.notifyChallengeAssigned(user.name, challengeName);
  };

  // ═══════════════════════════════════════════
  // BUCKET LIST
  // ═══════════════════════════════════════════

  // Rêve coché comme accompli
  const notifyBucket = async (itemName) => {
    if (!notifications?.notifyBucketCompleted || !user?.name) return;
    await notifications.notifyBucketCompleted(user.name, itemName);
  };

  // Nouveau rêve ajouté
  const notifyNewBucketItem = async (itemName) => {
    if (!notifications?.sendPushNotification || !user?.name) return;
    await notifications.sendPushNotification(
      '🌟 Nouveau rêve ajouté !',
      `${user.name} a ajouté "${itemName}" à votre bucket list ! Un rêve de plus à réaliser ensemble 💑`,
      { type: 'new_bucket' }
    );
  };

  // ═══════════════════════════════════════════
  // JEUX
  // ═══════════════════════════════════════════

  // Invitation à jouer (envoyée quand on lance une partie en ligne)
  const notifyGame = async (gameName) => {
    if (!notifications?.notifyGameInvite || !user?.name) return;
    await notifications.notifyGameInvite(user.name, gameName);
  };

  // Preuve photo/vidéo envoyée en TOD (partenaire doit réagir)
  const notifyProofSent = async () => {
    if (!notifications?.sendPushNotification || !user?.name) return;
    await notifications.sendPushNotification(
      '📸 Preuve envoyée !',
      `${user.name} a envoyé${accord} sa preuve ! Viens réagir 🎯`,
      { type: 'game_proof' }
    );
  };

  // Réaction du questioner à la preuve (responder est notifié)
  const notifyProofReaction = async (reaction) => {
    if (!notifications?.sendPushNotification || !user?.name) return;
    const emoji = reaction === 'approved' ? '✅' : '❌';
    await notifications.sendPushNotification(
      `${emoji} Réaction reçue !`,
      `${user.name} a ${reaction === 'approved' ? 'validé' : 'refusé'} ta preuve ${emoji}`,
      { type: 'game_reaction' }
    );
  };

  // Fin de partie (résultats disponibles)
  const notifyGameWin = async (gameName) => {
    if (!notifications?.sendPushNotification || !user?.name) return;
    await notifications.sendPushNotification(
      '\u{1F3C6} Partie terminée !',
      `${user.name} a terminé la partie de ${gameName} ! Viens voir les résultats 🎯`,
      { type: 'game_win' }
    );
  };

  // Signal "c'est ton tour" pendant une partie en ligne
  const notifyGameAnswer = async () => {
    if (!notifications?.sendPushNotification || !user?.name) return;
    await notifications.sendPushNotification(
      '🎮 C\'est ton tour !',
      `${user.name} a répondu${accord}. À toi de jouer ! ⚡`,
      { type: 'game_turn' }
    );
  };

  // ═══════════════════════════════════════════
  // PROFIL & COUPLE
  // ═══════════════════════════════════════════

  const notifyOnline = async () => {
    if (!notifications?.notifyPartnerOnline || !user?.name) return;
    await notifications.notifyPartnerOnline(user.name);
  };

  const notifyProfileUpdate = async () => {
    if (!notifications?.sendPushNotification || !user?.name) return;
    await notifications.sendPushNotification(
      '✏️ Profil mis à jour',
      `${user.name} a mis à jour son profil. Viens jeter un œil ! 👀`,
      { type: 'profile_update' }
    );
  };

  const notifyCoupleNameChanged = async (newName) => {
    if (!notifications?.sendPushNotification || !user?.name) return;
    await notifications.sendPushNotification(
      '💑 Nouveau nom de couple',
      `${user.name} a renommé votre couple en "${newName}" 💕`,
      { type: 'couple_name' }
    );
  };

  const notifyAnniversarySet = async (date) => {
    if (!notifications?.sendPushNotification || !user?.name) return;
    await notifications.sendPushNotification(
      '📅 Anniversaire enregistré',
      `${user.name} a défini votre anniversaire au ${date} ! Des rappels seront envoyés 🎂`,
      { type: 'anniversary' }
    );
  };

  const notifyPhotoChanged = async (type) => {
    if (!notifications?.sendPushNotification || !user?.name) return;
    const isCouple = type === 'couple';
    await notifications.sendPushNotification(
      isCouple ? '📸 Photo de couple changée' : '🤳 Nouvelle photo de profil',
      isCouple
        ? `${user.name} a mis une nouvelle photo de couple ! 💑 Viens la voir !`
        : `${user.name} a changé sa photo de profil ! Qui est cette belle personne ? 😍`,
      { type: 'photo_change' }
    );
  };

  // ═══════════════════════════════════════════
  // LOVE METER
  // ═══════════════════════════════════════════

  const notifyLoveMeterMilestone = async (value) => {
    if (!notifications?.sendPushNotification || !user?.name) return;
    let emoji, message;
    if (value >= 100) {
      emoji = '💯'; message = `L'amour est au maximum ! Votre Love Meter déborde de bonheur 🎉`;
    } else if (value >= 75) {
      emoji = '🔥'; message = `${user.name} a fait grimper le Love Meter à ${value}% ! Vous êtes en feu !`;
    } else if (value >= 50) {
      emoji = '💖'; message = `Love Meter à ${value}% ! ${user.name} pense à toi 💖`;
    } else if (value >= 25) {
      emoji = '💗'; message = `${user.name} a ajouté un peu d'amour ! Love Meter : ${value}%`;
    }
    if (emoji && message) {
      await notifications.sendPushNotification(`${emoji} Love Meter`, message, { type: 'love_meter' });
    }
  };

  // ═══════════════════════════════════════════
  // ROUE DES DATES
  // ═══════════════════════════════════════════

  const notifyWheelSpin = async (result) => {
    if (!notifications?.notifyWheelSpin || !user?.name) return;
    await notifications.notifyWheelSpin(user.name, result);
  };

  // ═══════════════════════════════════════════
  // CONNEXION & COUPLE
  // ═══════════════════════════════════════════

  const notifyPartnerJoined = async (joinedPartnerName) => {
    if (!notifications?.sendPushNotification) return;
    await notifications.sendPushNotification(
      '👫 Votre couple est prêt !',
      `${joinedPartnerName} a rejoint votre espace couple sur HANI ! 🎉 Synchronisation en temps réel activée 💕`,
      { type: 'partner_joined' }
    );
  };

  // ═══════════════════════════════════════════
  // LETTRES D'AMOUR PROGRAMMÉES
  // ═══════════════════════════════════════════

  const notifyScheduledLetter = async (deliveryDateStr) => {
    if (!notifications?.sendPushNotification || !user?.name) return;
    const dateInfo = deliveryDateStr ? ` Elle s'ouvrira le ${deliveryDateStr} ❤️` : '';
    await notifications.sendPushNotification(
      '💌 Lettre d\'amour secrète',
      `${user.name} t'a écrit une lettre d'amour pour plus tard...${dateInfo} Patience ! 🥺`,
      { type: 'scheduled_letter' }
    );
  };

  const notifyLetterDelivered = async () => {
    if (!notifications?.sendPushNotification || !user?.name) return;
    await notifications.sendPushNotification(
      '💌 Ta lettre a été lue !',
      `${user.name} a ouvert et lu${accord} ta lettre d'amour avec les yeux pétillants 🥹`,
      { type: 'letter_read' }
    );
  };

  // ═══════════════════════════════════════════
  // JOURNAL INTIME PARTAGÉ
  // ═══════════════════════════════════════════

  const notifyDiaryEntry = async () => {
    if (!notifications?.sendPushNotification || !user?.name) return;
    await notifications.sendPushNotification(
      '📖 Nouvelle page du journal',
      `${user.name} a écrit une nouvelle entrée dans votre journal intime partagé 💕`,
      { type: 'diary_entry' }
    );
  };

  // ═══════════════════════════════════════════
  // RAPPELS
  // ═══════════════════════════════════════════

  const sendDailyReminder = async () => {
    if (notifications?.scheduleDailyReminder) {
      await notifications.scheduleDailyReminder();
    }
  };

  const sendSmartReminder = async (isChallengeIncomplete = false) => {
    if (notifications?.scheduleSmartReminder) {
      await notifications.scheduleSmartReminder(partnerName, isChallengeIncomplete);
    }
  };

  // ═══════════════════════════════════════════
  // TU ME MANQUES & MESSAGES LIBRES
  // ═══════════════════════════════════════════

  const notifyMissYou = async () => {
    if (!notifications?.sendPushNotification || !user?.name) return;
    const messages = [
      `${user.name} pense à toi en ce moment 💭`,
      `${user.name} s'ennuie sans toi... 🥺 Viens dire bonjour !`,
      `Un câlin virtuel pour toi de la part de ${user.name} 🤗`,
      `${user.name} compte les secondes avant de te retrouver 💕`,
      `Coucou ${partnerName} ! ${user.name} t'envoie tout son amour ❤️`,
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    await notifications.sendPushNotification(
      '💭 Tu me manques...',
      msg,
      { type: 'miss_you' }
    );
  };

  const sendCustomNotification = async (title, body) => {
    if (notifications?.sendPushNotification) {
      await notifications.sendPushNotification(title, body, { type: 'custom' });
    }
  };

  // ═══════════════════════════════════════════
  // APPELS
  // ═══════════════════════════════════════════

  const notifyCall = async (type) => {
    if (!notifications?.sendPushNotification || !user?.name) return;
    if (type === 'missed') {
      await notifications.sendPushNotification(
        '📵 Appel manqué',
        `Vous avez manqué un appel de ${user.name}. Rappelez-le ! 💕`,
        { type: 'missed_call' }
      );
    } else {
      await notifications.sendPushNotification(
        type === 'video' ? '🎥 Appel vidéo entrant' : '📞 Appel vocal entrant',
        `${user.name} vous appelle... Ouvrez l'application pour répondre 💕`,
        { type: 'incoming_call', callType: type }
      );
    }
  };

  return {
    // Souvenirs & Capsules
    notifyMemory,
    notifyCapsule,
    notifyCapsuleOpened,
    // Chat & Messages
    notifyLoveNote,
    notifyNoteRead,
    // Défis
    notifyChallenge,
    notifyNewChallenge,
    // Bucket list
    notifyBucket,
    notifyNewBucketItem,
    // Jeux
    notifyGame,
    notifyGameWin,
    notifyGameAnswer,
    notifyProofSent,
    notifyProofReaction,
    // Profil & Couple
    notifyOnline,
    notifyProfileUpdate,
    notifyCoupleNameChanged,
    notifyAnniversarySet,
    notifyPhotoChanged,
    // Love Meter
    notifyLoveMeterMilestone,
    // Roue
    notifyWheelSpin,
    // Connexion & Couple
    notifyPartnerJoined,
    // Lettres d'amour programmées
    notifyScheduledLetter,
    notifyLetterDelivered,
    // Journal intime
    notifyDiaryEntry,
    // Rappels intelligents
    sendDailyReminder,
    sendSmartReminder,
    // Custom
    sendCustomNotification,
    notifyMissYou,
    // Appels
    notifyCall,
  };
};
