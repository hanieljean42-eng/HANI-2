// Hook pour utiliser les notifications facilement depuis n'importe quel composant
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const useNotifyPartner = () => {
  const { user, partner } = useAuth();
  const notifications = useNotifications();

  // Helper: obtenir le pronom selon le genre
  const pronoun = (user?.gender === 'feminin') ? 'elle' : 'il';
  const possessif = (user?.gender === 'feminin') ? 'sa' : 'son';
  const accord = (user?.gender === 'feminin') ? 'e' : '';

  // === SOUVENIRS & CAPSULES ===
  const notifyMemory = async () => {
    if (notifications?.notifyNewMemory && user?.name) {
      await notifications.notifyNewMemory(user.name);
    }
  };

  const notifyCapsule = async () => {
    if (notifications?.notifyTimeCapsule && user?.name) {
      await notifications.notifyTimeCapsule(user.name);
    }
  };

  const notifyCapsuleOpened = async (title) => {
    if (notifications?.notifyCapsuleOpened && user?.name) {
      await notifications.notifyCapsuleOpened(user.name, title);
    }
  };

  // === MESSAGES & NOTES ===
  const notifyLoveNote = async (message) => {
    if (notifications?.notifyLoveNote && user?.name) {
      await notifications.notifyLoveNote(user.name, message);
    }
  };

  const notifyNoteRead = async () => {
    if (notifications?.sendPushNotification && user?.name) {
      await notifications.sendPushNotification(
        '👀 Message lu',
        `${user.name} a lu ton message 💕`,
        { type: 'note_read' }
      );
    }
  };

  // === DÉFIS ===
  const notifyChallenge = async (challengeName) => {
    if (notifications?.notifyChallengeCompleted && user?.name) {
      await notifications.notifyChallengeCompleted(user.name, challengeName);
    }
  };

  const notifyNewChallenge = async (challengeName) => {
    if (notifications?.notifyChallengeAssigned && user?.name) {
      await notifications.notifyChallengeAssigned(user.name, challengeName);
    }
  };

  // === BUCKET LIST ===
  const notifyBucket = async (itemName) => {
    if (notifications?.notifyBucketCompleted && user?.name) {
      await notifications.notifyBucketCompleted(user.name, itemName);
    }
  };

  const notifyNewBucketItem = async (itemName) => {
    if (notifications?.sendPushNotification && user?.name) {
      await notifications.sendPushNotification(
        '✨ Nouveau rêve',
        `${user.name} a ajouté "${itemName}" à votre bucket list !`,
        { type: 'new_bucket' }
      );
    }
  };

  // === JEUX ===
  const notifyGame = async (gameName) => {
    if (notifications?.notifyGameInvite && user?.name) {
      await notifications.notifyGameInvite(user.name, gameName);
    }
  };

  const notifyGameWin = async (gameName) => {
    if (notifications?.sendPushNotification && user?.name) {
      await notifications.sendPushNotification(
        '� Partie terminée !',
        `La partie de ${gameName} avec ${user.name} est terminée ! Viens voir les résultats 🎯`,
        { type: 'game_win' }
      );
    }
  };

  const notifyGameAnswer = async () => {
    if (notifications?.sendPushNotification && user?.name) {
      await notifications.sendPushNotification(
        '🎮 À ton tour !',
        `${user.name} a répondu${accord}. C'est à toi !`,
        { type: 'game_turn' }
      );
    }
  };

  // === PROFIL & COUPLE ===
  const notifyOnline = async () => {
    if (notifications?.notifyPartnerOnline && user?.name) {
      await notifications.notifyPartnerOnline(user.name);
    }
  };

  const notifyProfileUpdate = async () => {
    if (notifications?.sendPushNotification && user?.name) {
      await notifications.sendPushNotification(
        '👤 Profil modifié',
        `${user.name} a mis à jour ${possessif} profil`,
        { type: 'profile_update' }
      );
    }
  };

  const notifyCoupleNameChanged = async (newName) => {
    if (notifications?.sendPushNotification && user?.name) {
      await notifications.sendPushNotification(
        '💑 Nom du couple',
        `${user.name} a renommé votre couple en "${newName}" 💕`,
        { type: 'couple_name' }
      );
    }
  };

  const notifyAnniversarySet = async (date) => {
    if (notifications?.sendPushNotification && user?.name) {
      await notifications.sendPushNotification(
        '📅 Date d\'anniversaire',
        `${user.name} a défini votre anniversaire au ${date} !`,
        { type: 'anniversary' }
      );
    }
  };

  const notifyPhotoChanged = async (type) => {
    if (notifications?.sendPushNotification && user?.name) {
      const title = type === 'couple' ? '💑 Photo de couple' : '📷 Photo de profil';
      await notifications.sendPushNotification(
        title,
        `${user.name} a changé ${type === 'couple' ? 'la photo de couple' : 'sa photo de profil'} !`,
        { type: 'photo_change' }
      );
    }
  };

  // === LOVE METER ===
  const notifyLoveMeterMilestone = async (value) => {
    if (notifications?.sendPushNotification && user?.name) {
      let emoji = '💕';
      let message = '';
      
      if (value >= 100) {
        emoji = '💯';
        message = 'Votre Love Meter est au maximum ! 🎉';
      } else if (value >= 75) {
        emoji = '🔥';
        message = `Love Meter à ${value}% ! Vous êtes en feu !`;
      } else if (value >= 50) {
        emoji = '💖';
        message = `Love Meter à ${value}% ! Continuez comme ça !`;
      } else if (value >= 25) {
        emoji = '💗';
        message = `Love Meter à ${value}% !`;
      }
      
      if (message) {
        await notifications.sendPushNotification(
          `${emoji} Love Meter`,
          message,
          { type: 'love_meter' }
        );
      }
    }
  };

  // === ROUE DES DATES ===
  const notifyWheelSpin = async (result) => {
    if (notifications?.notifyWheelSpin && user?.name) {
      await notifications.notifyWheelSpin(user.name, result);
    }
  };

  // === CONNEXION & COUPLE ===
  const notifyPartnerJoined = async (partnerName) => {
    if (notifications?.sendPushNotification && user?.name) {
      await notifications.sendPushNotification(
        `👫 Partenaire connecté${accord} !`,
        `${partnerName} a rejoint votre espace couple ! 🎉 Maintenant tout se synchronise en temps réel 💕`,
        { type: 'partner_joined' }
      );
    }
  };

  // === LETTRES D'AMOUR PROGRAMMÉES ===
  const notifyScheduledLetter = async (deliveryDateStr) => {
    if (notifications?.sendPushNotification && user?.name) {
      const dateInfo = deliveryDateStr ? ` Elle s'ouvrira le ${deliveryDateStr} ❤️` : '';
      await notifications.sendPushNotification(
        '💌 Lettre programmée',
        `${user.name} t'a écrit une lettre d'amour pour plus tard...${dateInfo} 💕`,
        { type: 'scheduled_letter' }
      );
    }
  };

  const notifyLetterDelivered = async () => {
    if (notifications?.sendPushNotification && user?.name) {
      await notifications.sendPushNotification(
        '💌 Ta lettre a été lue !',
        `${user.name} a ouvert et lu${accord} ta lettre d'amour ! 💕`,
        { type: 'letter_read' }
      );
    }
  };

  // === JOURNAL INTIME PARTAGÉ ===
  const notifyDiaryEntry = async () => {
    if (notifications?.sendPushNotification && user?.name) {
      await notifications.sendPushNotification(
        '📖 Nouvelle entrée',
        `${user.name} a écrit dans votre journal intime 💕`,
        { type: 'diary_entry' }
      );
    }
  };



  // === RAPPELS INTELLIGENTS ===
  const sendDailyReminder = async () => {
    if (notifications?.scheduleDailyReminder) {
      await notifications.scheduleDailyReminder();
    }
  };

  const sendSmartReminder = async (isChallengeIncomplete = false) => {
    if (notifications?.scheduleSmartReminder) {
      // ✅ Passer le nom du PARTENAIRE (car le rappel dit "tu n'as pas parlé avec [nom]")
      const partnerName = partner?.name || 'ton partenaire';
      await notifications.scheduleSmartReminder(partnerName, isChallengeIncomplete);
    }
  };

  // === MESSAGES PERSONNALISÉS ===
  const sendCustomNotification = async (title, body) => {
    if (notifications?.sendPushNotification) {
      await notifications.sendPushNotification(title, body, { type: 'custom' });
    }
  };

  // === RAPPELS SPÉCIAUX ===
  const notifyMissYou = async () => {
    if (notifications?.sendPushNotification && user?.name) {
      const messages = [
        `${user.name} pense à toi 💭`,
        `Tu manques à ${user.name}... 🥺`,
        `${user.name} a hâte de te voir ! 🤗`,
        `${user.name} t'envoie plein d'amour 💕`,
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      await notifications.sendPushNotification(
        '💭 Tu me manques',
        randomMsg,
        { type: 'miss_you' }
      );
    }
  };

  return {
    // Souvenirs
    notifyMemory,
    notifyCapsule,
    notifyCapsuleOpened,
    // Messages
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
  };
};
