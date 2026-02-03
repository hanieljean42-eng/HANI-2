// Hook pour utiliser les notifications facilement depuis n'importe quel composant
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const useNotifyPartner = () => {
  const { user } = useAuth();
  const notifications = useNotifications();

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
    if (notifications?.sendPushNotification && user?.name) {
      await notifications.sendPushNotification(
        '💊 Capsule ouverte !',
        `${user.name} a ouvert la capsule "${title}" !`,
        { type: 'capsule_opened' }
      );
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
    if (notifications?.sendPushNotification && user?.name) {
      await notifications.sendPushNotification(
        '⚡ Nouveau défi !',
        `${user.name} a ajouté un défi : "${challengeName}"`,
        { type: 'new_challenge' }
      );
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
        '🏆 Partie terminée !',
        `${user.name} a gagné à ${gameName} ! Revanche ? 😏`,
        { type: 'game_win' }
      );
    }
  };

  const notifyGameAnswer = async () => {
    if (notifications?.sendPushNotification && user?.name) {
      await notifications.sendPushNotification(
        '🎮 À ton tour !',
        `${user.name} a répondu. C'est à toi !`,
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
        `${user.name} a mis à jour son profil`,
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
    if (notifications?.sendPushNotification && user?.name) {
      await notifications.sendPushNotification(
        '🎰 Roue des Dates',
        `${user.name} a tourné la roue ! Résultat : "${result}" 🎯`,
        { type: 'wheel_spin' }
      );
    }
  };

  // === LETTRES D'AMOUR PROGRAMMÉES ===
  const notifyScheduledLetter = async () => {
    if (notifications?.sendPushNotification && user?.name) {
      await notifications.sendPushNotification(
        '💌 Lettre programmée',
        `${user.name} t'a écrit une lettre d'amour pour plus tard... 💕`,
        { type: 'scheduled_letter' }
      );
    }
  };

  const notifyLetterDelivered = async (from) => {
    if (notifications?.sendPushNotification) {
      await notifications.sendPushNotification(
        '💌 Lettre d\'amour !',
        `${from} t'a envoyé une lettre d'amour ! Ouvre-la vite ! 💕`,
        { type: 'letter_delivered' }
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

  // === CONNEXION / PRÉSENCE ===
  const notifyPartnerJoined = async () => {
    if (notifications?.sendPushNotification && user?.name) {
      await notifications.sendPushNotification(
        '🎉 Partenaire connecté !',
        `${user.name} a rejoint votre couple ! Bienvenue ! 💕`,
        { type: 'partner_joined' }
      );
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
        `${user.name} te manque... 🥺`,
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
    // Lettres d'amour programmées
    notifyScheduledLetter,
    notifyLetterDelivered,
    // Journal intime
    notifyDiaryEntry,
    // Connexion
    notifyPartnerJoined,
    // Custom
    sendCustomNotification,
    notifyMissYou,
  };
};
