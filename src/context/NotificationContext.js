import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database, isConfigured } from '../config/firebase';
import { ref, set, get, onValue, off } from 'firebase/database';

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
      if (snapshot.exists()) {
        const tokens = snapshot.val();
        // Trouver le token du partenaire (pas le nôtre)
        for (const [id, tokenData] of Object.entries(tokens)) {
          if (id !== userId && tokenData.token) {
            setPartnerToken(tokenData.token);
            console.log('🔔 Token partenaire trouvé');
            break;
          }
        }
      }
    });

    return () => off(tokensRef);
  }, [coupleId, userId]);

  // Sauvegarder le token sur Firebase
  const saveTokenToFirebase = async (token) => {
    try {
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
        // Obtenir le token Expo Push avec le bon projectId
        // Le projectId doit correspondre à celui de app.json/eas.json
        const projectId = '87b635c7-a516-44d2-a9b4-8783d45c6cf4'; // ID du projet EAS
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });
        token = tokenData.data;
        console.log('🔔 Token Push obtenu:', token);
        
        // Sauvegarder le token pour persistance
        await AsyncStorage.setItem('@expoPushToken', token);
      } catch (error) {
        console.log('⚠️ Erreur obtention token:', error.message);
        
        // Essayer de récupérer un token précédemment sauvegardé
        const savedToken = await AsyncStorage.getItem('@expoPushToken');
        if (savedToken && savedToken.startsWith('ExponentPushToken')) {
          token = savedToken;
          console.log('🔔 Token Push récupéré du cache:', token);
        } else {
          // En mode développement, générer un token factice
          token = `dev-token-${Date.now()}`;
          console.log('⚠️ Mode dev - Token factice généré');
        }
      }
    } else {
      console.log('⚠️ Les notifications push nécessitent un appareil physique');
      // Token factice pour simulateur
      token = `simulator-token-${Date.now()}`;
    }

    return token;
  }

  // Envoyer une notification au partenaire via Expo Push
  const sendPushNotification = async (title, body, data = {}) => {
    if (!partnerToken) {
      console.log('⚠️ Pas de token partenaire disponible');
      return false;
    }

    // Vérifier si c'est un vrai token Expo
    if (!partnerToken.startsWith('ExponentPushToken')) {
      console.log('⚠️ Token partenaire non valide (mode dev)');
      // En mode dev, on peut simuler avec une notification locale
      await scheduleLocalNotification(title, body, data);
      return true;
    }

    try {
      const message = {
        to: partnerToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
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
      console.log('📤 Notification envoyée:', result);
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
      `${userName} a ajouté un nouveau souvenir. Viens le voir ! 💕`,
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
      // Parser la date (format attendu: JJ/MM/AAAA ou AAAA-MM-DD)
      let targetDate;
      if (deliveryDate.includes('/')) {
        const [day, month, year] = deliveryDate.split('/').map(Number);
        targetDate = new Date(year, month - 1, day, 9, 0, 0); // 9h du matin
      } else {
        targetDate = new Date(deliveryDate);
        targetDate.setHours(9, 0, 0, 0);
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
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
