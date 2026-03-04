import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database, isConfigured } from '../config/firebase';
import { ref, set, onValue, off } from 'firebase/database';

const NotificationContext = createContext({});

export const useNotifications = () => useContext(NotificationContext);

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function NotificationProvider({ children }) {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  const [userId, setUserId] = useState(null);
  const [coupleId, setCoupleId] = useState(null);
  const [partnerToken, setPartnerToken] = useState(null);

  // Charger les données utilisateur
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await AsyncStorage.getItem('@user');
      const couple = await AsyncStorage.getItem('@couple');
      
      if (user) {
        const userData = JSON.parse(user);
        setUserId(userData.id);
      }
      if (couple) {
        const coupleData = JSON.parse(couple);
        setCoupleId(coupleData.id);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  // Initialiser les notifications
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        setNotificationsEnabled(true);
        // Sauvegarder le token
        saveTokenToFirebase(token);
      }
    });

    // Listener pour les notifications reçues quand l'app est ouverte
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification reçue:', notification);
      setNotification(notification);
    });

    // Listener pour quand l'utilisateur clique sur la notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification cliquée:', response);
      // Ici on peut naviguer vers un écran spécifique
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Écouter le token du partenaire sur Firebase
  useEffect(() => {
    if (!coupleId || !userId || !isConfigured || !database) return;

    const tokensRef = ref(database, `couples/${coupleId}/pushTokens`);
    
    const unsubscribe = onValue(tokensRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const tokens = snapshot.val();
      // Trouver le token VALIDE du partenaire (pas le nôtre, et uniquement un vrai token Expo)
      for (const [id, tokenData] of Object.entries(tokens)) {
        if (id !== userId && tokenData.token && tokenData.token.startsWith('ExponentPushToken')) {
          setPartnerToken(tokenData.token);
          console.log('🔔 Token partenaire trouvé');
          break;
        }
      }
    });

    return () => off(tokensRef);
  }, [coupleId, userId]);

  // Sauvegarder le token sur Firebase
  const saveTokenToFirebase = async (token) => {
    try {
      // Ne sauvegarder que les vrais tokens Expo
      if (!token || !token.startsWith('ExponentPushToken')) return;

      const user = await AsyncStorage.getItem('@user');
      const couple = await AsyncStorage.getItem('@couple');
      
      if (!user || !couple) return;
      
      const userData = JSON.parse(user);
      const coupleData = JSON.parse(couple);
      
      setUserId(userData.id);
      setCoupleId(coupleData.id);
      
      if (isConfigured && database) {
        const tokenRef = ref(database, `couples/${coupleData.id}/pushTokens/${userData.id}`);
        await set(tokenRef, {
          token: token,
          platform: Platform.OS,
          updatedAt: new Date().toISOString(),
          userName: userData.name,
        });
        console.log('✅ Token push sauvegardé sur Firebase');
      }
      
      // Sauvegarder aussi localement
      await AsyncStorage.setItem('@pushToken', token);
    } catch (error) {
      console.error('Erreur sauvegarde token:', error);
    }
  };

  // Ré-sauvegarder le token quand on récupère le couple/user (utile si on s'enregistre avant d'avoir joint le couple)
  useEffect(() => {
    if (expoPushToken && userId && coupleId) {
      saveTokenToFirebase(expoPushToken);
    }
  }, [expoPushToken, userId, coupleId]);

  // Fonction pour demander les permissions
  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      // Configuration du canal Android
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B9D',
        sound: 'default',
      });

      // Canal pour les messages d'amour
      await Notifications.setNotificationChannelAsync('love-messages', {
        name: 'Messages d\'amour',
        description: 'Notifications de votre partenaire',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B9D',
        sound: 'default',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('⚠️ Permissions de notification non accordées');
        return null;
      }

      try {
        const projectId = 'b1f00575-c61e-45ee-84ac-b1644dff132f';
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        token = tokenData.data;
        console.log('🔔 Token Push obtenu:', token);
        await AsyncStorage.setItem('@expoPushToken', token);
      } catch (error) {
        console.log('⚠️ Erreur obtention token:', error.message);
        // Récupérer un token précédemment sauvegardé
        const savedToken = await AsyncStorage.getItem('@expoPushToken');
        if (savedToken && savedToken.startsWith('ExponentPushToken')) {
          token = savedToken;
          console.log('🔔 Token Push récupéré du cache');
        } else {
          console.log('⚠️ Aucun token push disponible');
          token = null;
        }
      }
    } else {
      console.log('⚠️ Notifications push : appareil physique requis');
      token = null;
    }

    return token;
  }

  /**
   * Envoyer une notification push au partenaire via Expo Push API.
   * Ne s'auto-envoie JAMAIS de notification locale (pas de fallback trompeur).
   * Retourne false si le token partenaire n'est pas disponible.
   */
  const sendPushNotification = async (title, body, data = {}) => {
    if (!partnerToken || !partnerToken.startsWith('ExponentPushToken')) {
      console.log('⚠️ Pas de token partenaire valide — notification non envoyée');
      return false;
    }

    try {
      const message = {
        to: partnerToken,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
        channelId: 'love-messages',
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      if (result.data?.status === 'error') {
        console.error('❌ Push API erreur:', result.data.message);
        return false;
      }
      console.log('📤 Notification envoyée au partenaire');
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);
      return false;
    }
  };

  // Programmer une notification locale (pour test ou rappels)
  const scheduleLocalNotification = async (title, body, data = {}, triggerOptions = { seconds: 1 }) => {
    try {
      // Vérifier les permissions d'abord
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.log('⚠️ Permissions notifications non accordées');
        return false;
      }

      // Créer le trigger approprié
      let trigger;
      if (typeof triggerOptions === 'number') {
        // Compatibilité avec l'ancienne API (seconds)
        trigger = { seconds: triggerOptions };
      } else if (triggerOptions.date) {
        // Notification à une date précise
        const targetDate = new Date(triggerOptions.date);
        const now = new Date();
        if (targetDate <= now) {
          console.log('⚠️ Date de notification passée');
          return false;
        }
        trigger = { date: targetDate };
      } else if (triggerOptions.seconds) {
        trigger = { seconds: triggerOptions.seconds };
      } else {
        trigger = { seconds: 1 };
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: { ...data, scheduledAt: new Date().toISOString() },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: trigger,
      });
      
      console.log('📅 Notification locale programmée, ID:', notificationId);
      
      // Sauvegarder l'ID pour pouvoir annuler si nécessaire
      const scheduled = await AsyncStorage.getItem('@scheduledNotifications');
      const notifications = scheduled ? JSON.parse(scheduled) : [];
      notifications.push({
        id: notificationId,
        title,
        body,
        data,
        trigger: triggerOptions,
        createdAt: new Date().toISOString(),
      });
      await AsyncStorage.setItem('@scheduledNotifications', JSON.stringify(notifications));
      
      return notificationId;
    } catch (error) {
      console.error('❌ Erreur notification locale:', error);
      return false;
    }
  };

  // === FONCTIONS POUR ENVOYER DES NOTIFICATIONS SELON LES ÉVÉNEMENTS ===

  // Notification quand un souvenir est ajouté
  const notifyNewMemory = async (userName) => {
    await sendPushNotification(
      '📸 Nouveau souvenir !',
      `${userName} a ajouté un nouveau souvenir, viens voir ! 💕`,
      { type: 'memory' }
    );
  };

  // Notification quand une love note est envoyée
  const notifyLoveNote = async (userName, preview) => {
    await sendPushNotification(
      '💌 Message d\'amour',
      `${userName}: ${preview.substring(0, 50)}${preview.length > 50 ? '...' : ''}`,
      { type: 'love_note' }
    );
  };

  // Notification quand un défi est complété
  const notifyChallengeCompleted = async (userName, challengeName) => {
    await sendPushNotification(
      '🏆 Défi complété !',
      `${userName} a terminé le défi "${challengeName}" !`,
      { type: 'challenge' }
    );
  };

  // Notification quand une capsule temporelle est créée
  const notifyTimeCapsule = async (userName) => {
    await sendPushNotification(
      '💊 Capsule temporelle',
      `${userName} a créé une capsule temporelle secrète ! 🔒`,
      { type: 'capsule' }
    );
  };

  // Notification quand le partenaire se connecte
  const notifyPartnerOnline = async (userName) => {
    await sendPushNotification(
      '💚 En ligne',
      `${userName} vient de se connecter ! 👋`,
      { type: 'online' }
    );
  };

  // Notification quand un élément bucket list est coché
  const notifyBucketCompleted = async (userName, itemName) => {
    await sendPushNotification(
      '✨ Rêve réalisé !',
      `${userName} a coché "${itemName}" de votre bucket list ! 🎉`,
      { type: 'bucket' }
    );
  };

  // Notification pour invitation à jouer
  const notifyGameInvite = async (userName, gameName) => {
    await sendPushNotification(
      '🎮 Invitation à jouer',
      `${userName} t'invite à jouer à ${gameName} !`,
      { type: 'game_invite' }
    );
  };

  // Notification le matin (rappel quotidien)
  const scheduleDailyReminder = async () => {
    // Programmer pour 9h du matin
    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(9, 0, 0, 0);
    
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const seconds = Math.floor((scheduledTime.getTime() - now.getTime()) / 1000);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💕 Bonjour !',
        body: 'N\'oublie pas de dire bonjour à ton amour aujourd\'hui !',
        sound: 'default',
      },
      trigger: {
        seconds: seconds,
        repeats: false,
      },
    });
  };

  // Notification pour anniversaire
  const scheduleAnniversaryReminder = async (date, coupleName) => {
    const [day, month, year] = date.split('/').map(Number);
    const anniversaryDate = new Date(new Date().getFullYear(), month - 1, day);
    
    // Si la date est passée cette année, programmer pour l'année prochaine
    if (anniversaryDate < new Date()) {
      anniversaryDate.setFullYear(anniversaryDate.getFullYear() + 1);
    }
    
    // Notification la veille
    const reminderDate = new Date(anniversaryDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(10, 0, 0, 0);
    
    const seconds = Math.floor((reminderDate.getTime() - new Date().getTime()) / 1000);
    
    if (seconds > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎂 Rappel important !',
          body: `Demain c'est votre anniversaire de couple ! Prépare quelque chose de spécial 💕`,
          sound: 'default',
        },
        trigger: {
          seconds: seconds,
          repeats: false,
        },
      });
      console.log('📅 Rappel anniversaire programmé');
    }
  };

  // Annuler toutes les notifications programmées
  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem('@scheduledNotifications');
  };

  // Programmer une notification pour une lettre d'amour avec date spécifique
  const scheduleLetterNotification = async (letterId, title, body, deliveryDate, fromName) => {
    try {
      // Accepter ISO (AAAA-MM-DDTHH:MM:SSZ) ou format JJ/MM/AAAA HH:MM
      let targetDate;
      if (!deliveryDate) return false;

      if (deliveryDate.includes('/')) {
        // Format JJ/MM/AAAA ou JJ/MM/AAAA HH:MM
        const parts = deliveryDate.split(' ');
        const [day, month, year] = parts[0].split('/').map(Number);
        let hour = 9, minute = 0;
        if (parts[1]) {
          const tm = parts[1].match(/^([01]\d|2[0-3]):([0-5]\d)$/);
          if (tm) {
            hour = parseInt(tm[1], 10);
            minute = parseInt(tm[2], 10);
          }
        }
        targetDate = new Date(year, month - 1, day, hour, minute, 0);
      } else {
        // ISO string -> use exact time if present
        targetDate = new Date(deliveryDate);
      }

      const now = new Date();
      if (targetDate <= now) {
        console.log('⚠️ Date de livraison déjà passée');
        return false;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💌 Lettre d\'amour !',
          body: `${fromName} t'a écrit une lettre d'amour ! Ouvre-la vite ! 💕`,
          data: { 
            type: 'scheduled_letter',
            letterId: letterId,
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { date: targetDate },
      });

      console.log('📅 Notification lettre programmée pour:', targetDate.toISOString(), 'ID:', notificationId);
      
      // Sauvegarder la correspondance lettre -> notification
      const letterNotifs = await AsyncStorage.getItem('@letterNotifications');
      const notifs = letterNotifs ? JSON.parse(letterNotifs) : {};
      notifs[letterId] = notificationId;
      await AsyncStorage.setItem('@letterNotifications', JSON.stringify(notifs));
      
      return notificationId;
    } catch (error) {
      console.error('❌ Erreur programmation notification lettre:', error);
      return false;
    }
  };

  // À l'initialisation, reprogrammer les notifications de lettres existantes si besoin
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@scheduledLetters');
        if (!stored) return;
        const letters = JSON.parse(stored);
        const letterNotifs = await AsyncStorage.getItem('@letterNotifications');
        const notifs = letterNotifs ? JSON.parse(letterNotifs) : {};

        for (const l of letters) {
          // Ne programmer que si pas encore programmé et si future
          if (l && l.id && !notifs[l.id]) {
            const date = new Date(l.deliveryDate);
            if (date > new Date()) {
              await scheduleLetterNotification(l.id, l.title, l.content, l.deliveryDate, l.from || '');
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ Erreur reprogrammation lettres:', e.message);
      }
    })();
  }, [coupleId]);

  // Annuler une notification de lettre
  const cancelLetterNotification = async (letterId) => {
    try {
      const letterNotifs = await AsyncStorage.getItem('@letterNotifications');
      if (letterNotifs) {
        const notifs = JSON.parse(letterNotifs);
        if (notifs[letterId]) {
          await Notifications.cancelScheduledNotificationAsync(notifs[letterId]);
          delete notifs[letterId];
          await AsyncStorage.setItem('@letterNotifications', JSON.stringify(notifs));
          console.log('🔕 Notification lettre annulée');
        }
      }
    } catch (error) {
      console.error('Erreur annulation notification lettre:', error);
    }
  };

  // === NOTIFICATIONS DE TEST ===
  
  // Notification de bienvenue après création de compte
  const notifyWelcome = async (userName) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Bienvenue sur HANI 2 !',
          body: `Salut ${userName} ! Ton compte a été créé avec succès. L'amour t'attend ! 💕`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { seconds: 2 },
      });
      console.log('✅ Notification de bienvenue envoyée');
      return true;
    } catch (error) {
      console.error('❌ Erreur notification bienvenue:', error);
      return false;
    }
  };

  // Notification de test immédiate
  const testNotification = async () => {
    try {
      console.log('🔔 Démarrage test notification...');
      
      const { status } = await Notifications.getPermissionsAsync();
      console.log('📱 Status permissions:', status);
      
      if (status !== 'granted') {
        console.log('⚠️ Demande de permissions...');
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        console.log('📱 Nouveau status:', newStatus);
        if (newStatus !== 'granted') {
          console.log('❌ Permissions refusées');
          return { success: false, error: 'Permissions refusées. Allez dans Paramètres > Applications > Couple H > Notifications pour les activer.' };
        }
      }

      // IMPORTANT: trigger: null = notification immédiate (pas de délai)
      console.log('📤 Envoi notification immédiate...');
      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💕 Test Couple H',
          body: 'Super ! Les notifications fonctionnent parfaitement ! 🎉',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
          data: { test: true },
        },
        trigger: null, // NULL = immédiat, pas de délai
      });
      
      console.log('✅ Notification envoyée avec succès ! ID:', notifId);
      return { success: true, id: notifId };
    } catch (error) {
      console.error('❌ Erreur test notification:', error);
      return { success: false, error: error.message };
    }
  };

  // Test notification avec délai
  const testNotificationDelayed = async (seconds = 5) => {
    try {
      console.log(`🔔 Programmation notification dans ${seconds}s...`);
      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Notification différée',
          body: `Cette notification était programmée pour ${seconds} secondes. Ça fonctionne ! 🎯`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { seconds: seconds },
      });
      console.log(`✅ Notification différée programmée (${seconds}s), ID:`, notifId);
      return { success: true, id: notifId };
    } catch (error) {
      console.error('❌ Erreur notification différée:', error);
      return { success: false, error: error.message };
    }
  };

  // Notification quand on rejoint un couple
  const notifyCoupleJoined = async (partnerName) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💑 Couple créé !',
          body: `Félicitations ! Tu es maintenant en couple avec ${partnerName} sur HANI 2 ! 💕`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Immédiat
      });
      return true;
    } catch (error) {
      console.error('❌ Erreur notification couple:', error);
      return false;
    }
  };

  // Notification quand on se connecte
  const notifyLoginSuccess = async (userName) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '👋 Re-bonjour !',
          body: `Content de te revoir ${userName} ! 💕`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: null,
      });
      return true;
    } catch (error) {
      console.error('❌ Erreur notification login:', error);
      return false;
    }
  };

  // ===== NOTIFICATION FLAMME EN DANGER =====
  // Envoie un push au partenaire quand la flamme risque de se perdre
  const notifyStreakDanger = async (streakCount, partnerName) => {
    // Push vers le partenaire
    await sendPushNotification(
      '🔥⏳ Flamme en danger !',
      `Votre flamme de ${streakCount} jour${streakCount > 1 ? 's' : ''} est en danger ! ${partnerName} t'attend 💕`,
      { type: 'streak_danger', streakCount }
    );
  };

  // Notification locale de rappel flamme (programmée pour 20h si pas d'activité)
  const scheduleStreakReminder = async (streakCount) => {
    try {
      // Annuler l'ancien rappel flamme
      const oldId = await AsyncStorage.getItem('@streakReminderId');
      if (oldId) {
        try { await Notifications.cancelScheduledNotificationAsync(oldId); } catch {}
      }

      const now = new Date();
      const reminderTime = new Date(now);
      reminderTime.setHours(20, 0, 0, 0);

      // Si 20h est déjà passé, ne pas programmer
      if (reminderTime <= now) return;

      const seconds = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);
      if (seconds <= 0) return;

      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 N\'oublie pas ta flamme !',
          body: streakCount > 0
            ? `Tu as une flamme de ${streakCount} jour${streakCount > 1 ? 's' : ''} ! Envoie un message ou fais un défi pour ne pas la perdre 🔥`
            : 'Envoie un message ou fais un défi pour commencer une flamme avec ton amour ! 💕',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { seconds },
      });

      await AsyncStorage.setItem('@streakReminderId', notifId);
      console.log('📅 Rappel flamme programmé pour 20h');
      return notifId;
    } catch (e) {
      console.log('⚠️ Erreur rappel flamme:', e.message);
    }
  };

  // ===== NOTIFICATION DÉFI DU JOUR (auto-programmée chaque matin) =====
  const scheduleMorningChallenge = async () => {
    try {
      // Annuler l'ancien rappel matin
      const oldId = await AsyncStorage.getItem('@morningChallengeId');
      if (oldId) {
        try { await Notifications.cancelScheduledNotificationAsync(oldId); } catch {}
      }

      const now = new Date();
      const morning = new Date(now);
      morning.setDate(morning.getDate() + 1); // demain
      morning.setHours(9, 0, 0, 0);

      const seconds = Math.floor((morning.getTime() - now.getTime()) / 1000);
      if (seconds <= 0) return;

      const messages_morning = [
        '💕 Votre défi du jour est prêt ! Relevez-le ensemble !',
        '🔥 Nouveau défi couple ! Montrez que votre amour est plus fort !',
        '⚡ Un défi vous attend ! Qui le fera en premier ?',
        '💪 Prêt pour le défi du jour ? Votre flamme vous attend !',
        '🌟 Bonjour ! Un nouveau défi vous rapproche encore plus !',
      ];
      const randomMsg = messages_morning[Math.floor(Math.random() * messages_morning.length)];

      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚡ Défi du jour !',
          body: randomMsg,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { seconds },
      });

      await AsyncStorage.setItem('@morningChallengeId', notifId);
      console.log('📅 Notification défi du matin programmée pour demain 9h');
      return notifId;
    } catch (e) {
      console.log('⚠️ Erreur notif matin:', e.message);
    }
  };

  // ===== NOTIFICATION MILESTONE (100 jours, 365 jours, etc.) =====
  const notifyMilestone = async (dayCount, emoji) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${emoji} Joli cap !`,
          body: `Félicitations ! Vous êtes ensemble depuis ${dayCount} jours ! 🎉💕`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
      // Aussi push au partenaire
      await sendPushNotification(
        `${emoji} ${dayCount} jours ensemble !`,
        `Vous avez atteint ${dayCount} jours d'amour ! Célébrez ça ! 🎉💕`,
        { type: 'milestone', dayCount }
      );
    } catch (e) {
      console.log('⚠️ Erreur notif milestone:', e.message);
    }
  };

  // ===== NOTIFICATION BADGE DÉBLOQUÉ =====
  const notifyBadgeUnlocked = async (badgeName, badgeEmoji) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${badgeEmoji} Nouveau badge !`,
          body: `Tu as débloqué le badge "${badgeName}" ! Continue comme ça ! 🏆`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { seconds: 1 },
      });
    } catch (e) {
      console.log('⚠️ Erreur notif badge:', e.message);
    }
  };

  // ===== NOTIFICATION COUNTDOWN (événement approche) =====
  const scheduleCountdownReminder = async (eventName, eventEmoji, eventDate) => {
    try {
      const target = new Date(eventDate);
      // Rappel la veille à 10h
      const reminderDate = new Date(target);
      reminderDate.setDate(reminderDate.getDate() - 1);
      reminderDate.setHours(10, 0, 0, 0);

      const now = new Date();
      if (reminderDate <= now) return;

      const seconds = Math.floor((reminderDate.getTime() - now.getTime()) / 1000);
      if (seconds <= 0) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${eventEmoji} Demain c'est le jour !`,
          body: `"${eventName}" est prévu demain ! Préparez-vous ensemble 💕`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { seconds },
      });
      console.log('📅 Rappel countdown programmé pour', eventName);
    } catch (e) {
      console.log('⚠️ Erreur notif countdown:', e.message);
    }
  };

  // ===== NOTIFICATION JOURNAL PARTAGÉ =====
  const notifyNewDiaryEntry = async (userName) => {
    await sendPushNotification(
      '📓 Nouvelle entrée au journal',
      `${userName} a écrit dans le journal partagé ! Viens lire 💕`,
      { type: 'diary' }
    );
  };

  // ===== NOTIFICATION NIVEAU SUPÉRIEUR =====
  const notifyLevelUp = async (newLevel, rankName, rankEmoji) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${rankEmoji} Niveau ${newLevel} !`,
          body: `Votre couple est maintenant ${rankName} ! Continuez comme ça 💪💕`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { seconds: 1 },
      });
      // Aussi notifier le partenaire
      await sendPushNotification(
        `${rankEmoji} Niveau ${newLevel} atteint !`,
        `Votre couple est maintenant ${rankName} ! Célébrez ensemble 🎉`,
        { type: 'level_up', level: newLevel }
      );
    } catch (e) {
      console.log('⚠️ Erreur notif level up:', e.message);
    }
  };

  // ===== NOTIFICATION RÉTROSPECTIVE MENSUELLE =====
  const scheduleMonthlyRetroReminder = async () => {
    try {
      // Programmée pour le 1er du mois prochain à 11h
      const now = new Date();
      const target = new Date(now.getFullYear(), now.getMonth() + 1, 1, 11, 0, 0);
      const seconds = Math.floor((target.getTime() - now.getTime()) / 1000);
      if (seconds <= 0) return;

      // Annuler l'ancienne
      const oldId = await AsyncStorage.getItem('@monthlyRetroId');
      if (oldId) {
        try { await Notifications.cancelScheduledNotificationAsync(oldId); } catch {}
      }

      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Votre rétrospective du mois est prête !',
          body: 'Découvrez vos stats du mois passé ensemble ! 💕',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { seconds },
      });

      await AsyncStorage.setItem('@monthlyRetroId', notifId);
      console.log('📅 Rappel rétrospective mensuelle programmé');
    } catch (e) {
      console.log('⚠️ Erreur notif retro:', e.message);
    }
  };

  // ===== NOTIFICATION CAPSULE TEMPORELLE PRÊTE =====
  const scheduleCapsuleReminder = async (capsuleId, openDate, fromName) => {
    try {
      const target = new Date(openDate);
      const now = new Date();
      if (target <= now) return;

      const seconds = Math.floor((target.getTime() - now.getTime()) / 1000);
      if (seconds <= 0) return;

      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Capsule temporelle déverrouillée !',
          body: `Une capsule de ${fromName} est maintenant ouvrable ! Découvrez-la 💕`,
          data: { type: 'capsule_open', capsuleId },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { seconds },
      });

      // Sauvegarder
      const capsuleNotifs = await AsyncStorage.getItem('@capsuleNotifications');
      const notifs = capsuleNotifs ? JSON.parse(capsuleNotifs) : {};
      notifs[capsuleId] = notifId;
      await AsyncStorage.setItem('@capsuleNotifications', JSON.stringify(notifs));
      console.log('📅 Rappel capsule programmé pour', openDate);
      return notifId;
    } catch (e) {
      console.log('⚠️ Erreur notif capsule:', e.message);
    }
  };

  // Auto-programmer les notifications au démarrage
  useEffect(() => {
    if (notificationsEnabled) {
      scheduleMorningChallenge();
      scheduleMonthlyRetroReminder();
    }
  }, [notificationsEnabled]);

  const value = {
    expoPushToken,
    notification,
    notificationsEnabled,
    partnerToken,
    // Fonctions d'envoi
    sendPushNotification,
    scheduleLocalNotification,
    // Notifications spécifiques
    notifyNewMemory,
    notifyLoveNote,
    notifyChallengeCompleted,
    notifyTimeCapsule,
    notifyPartnerOnline,
    notifyBucketCompleted,
    notifyGameInvite,
    // Rappels
    scheduleDailyReminder,
    scheduleAnniversaryReminder,
    cancelAllNotifications,
    // Lettres programmées
    scheduleLetterNotification,
    cancelLetterNotification,
    // Notifications de test et événements
    notifyWelcome,
    testNotification,
    testNotificationDelayed,
    notifyCoupleJoined,
    notifyLoginSuccess,
    // Engagement (nouvelles)
    notifyStreakDanger,
    scheduleStreakReminder,
    scheduleMorningChallenge,
    notifyMilestone,
    notifyBadgeUnlocked,
    // Nouvelles notifications v5
    scheduleCountdownReminder,
    notifyNewDiaryEntry,
    notifyLevelUp,
    scheduleMonthlyRetroReminder,
    scheduleCapsuleReminder,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
