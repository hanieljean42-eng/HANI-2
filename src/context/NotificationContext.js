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
  const partnerTokenListenerRef = useRef(); // ✅ Ref pour cleanup propre
  const tokenSavedRef = useRef(false); // ✅ Flag pour éviter double save
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

  // ✅ AMÉLIORÉ: Écouter le token du partenaire sur Firebase avec cleanup propre
  useEffect(() => {
    if (!coupleId || !userId || !isConfigured || !database) return;

    console.log('👂 Écoute tokens partenaire pour:', coupleId);
    const tokensRef = ref(database, `couples/${coupleId}/pushTokens`);
    
    const unsubscribe = onValue(
      tokensRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const tokens = snapshot.val();
          console.log('📋 Tokens trouvés:', Object.keys(tokens));
          
          // Chercher le token du partenaire (pas le nôtre)
          for (const [id, tokenData] of Object.entries(tokens)) {
            if (id !== userId && tokenData?.token) {
              setPartnerToken(tokenData.token);
              console.log('✅ Token partenaire détecté:', tokenData.token.substring(0, 20) + '...');
              break;
            }
          }
        } else {
          console.log('⚠️ Pas de tokens trouvés - partenaire pas encore en ligne');
          setPartnerToken(null);
        }
      },
      (error) => {
        console.error('❌ Erreur écoute tokens:', error);
      }
    );

    // ✅ Stocker la référence pour cleanup propre
    partnerTokenListenerRef.current = unsubscribe;

    return () => {
      console.log('🔕 Arrêt écoute tokens partenaire');
      if (partnerTokenListenerRef.current) {
        partnerTokenListenerRef.current();
        partnerTokenListenerRef.current = null;
      }
    };
  }, [coupleId, userId]);

  // Sauvegarder le token sur Firebase
  const saveTokenToFirebase = async (token) => {
    // ✅ DEDUPLICATE: Ne sauvegarder qu'une fois
    if (tokenSavedRef.current) {
      console.log('⏭️ Token déjà sauvegardé, skip');
      return;
    }
    
    try {
      const user = await AsyncStorage.getItem('@user');
      const couple = await AsyncStorage.getItem('@couple');
      
      if (!user || !couple) {
        console.log('⚠️ Données utilisateur/couple non disponibles');
        return;
      }
      
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
        tokenSavedRef.current = true; // ✅ MARQUER COMME SAUVEGARDÉ
      }
      
      // Sauvegarder aussi localement
      await AsyncStorage.setItem('@pushToken', token);
    } catch (error) {
      console.error('Erreur sauvegarde token:', error);
    }
  };

  // ✅ SUPPRIMÉ: Ce useEffect causait un double appel
  // Le saveTokenToFirebase dans registerForPushNotificationsAsync() suffit
  // et il a un flag tokenSavedRef pour éviter les doubles écritures

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
        const projectId = 'b1f00575-c61e-45ee-84ac-b1644dff132f'; // ID du projet EAS
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

  // ✅ RESTRUCTURÉ: Envoyer une notification au partenaire via Expo Push
  const sendPushNotification = async (title, body, data = {}) => {
    console.log('📤 Tentative envoi notification push:', { title, body, hasPartnerToken: !!partnerToken });
    
    // ÉTAPE 1: Vérifier si on a un token partenaire valide
    if (!partnerToken) {
      console.log('⚠️ Pas de token partenaire - impossible d\'envoyer push');
      return false;
    }

    // ÉTAPE 2: Vérifier que c'est un vrai token Expo (pas mode dev)
    if (!partnerToken.startsWith('ExponentPushToken')) {
      console.log('⚠️ Token partenaire non valide (mode dev/simulator)');
      return false;
    }

    // ÉTAPE 3: Essayer d'envoyer via Expo Push Service
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

      console.log('🔗 Appel Expo Push Service...');
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
      
      if (response.ok) {
        console.log('✅ Notification push envoyée avec succès:', result);
        return true;
      } else {
        console.error('❌ Expo répondu avec erreur:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur envoi notification push:', error.message);
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

  // Notification quand un défi EST ASSIGNÉ (nouveau défi à faire)
  const notifyChallengeAssigned = async (userName, challengeName) => {
    await sendPushNotification(
      '⚡ Nouveau défi !',
      `${userName} t'a assigné le défi "${challengeName}" ! Tu peux le faire ? 💪`,
      { type: 'challenge_assigned' }
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

  // Notification quand une capsule temporelle est OUVERTE
  const notifyCapsuleOpened = async (userName, capsuleTitle) => {
    await sendPushNotification(
      '💊 Capsule ouverte !',
      `${userName} a ouvert la capsule "${capsuleTitle}" ! Venez revivre ce moment ensemble 💕`,
      { type: 'capsule_opened' }
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

  // Notification quand la roue est tournée
  const notifyWheelSpin = async (userName, result) => {
    await sendPushNotification(
      '🎡 Roue tournée !',
      `${userName} a tourné la roue ! Résultat: ${result} 🎯`,
      { type: 'wheel_spin', result }
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
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        seconds: seconds,
        repeats: false,
      },
    });
  };

  // RAPPELS INTELLIGENTS - À faire si défi pas complété
  const scheduleSmartReminder = async (partnerName, isChallengeIncomplete = false) => {
    // Programmer pour 14h
    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(14, 0, 0, 0);
    
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const seconds = Math.floor((scheduledTime.getTime() - now.getTime()) / 1000);
    
    const title = isChallengeIncomplete ? '⚡ Le défi t\'attend !' : '💬 Prends du temps ensemble';
    const body = isChallengeIncomplete 
      ? `Vous n'avez pas encore complété le défi d'aujourd'hui ! C'est le moment ? 🎯`
      : `Ça fait un moment que tu n'as pas parlé avec ${partnerName}... Elle/il te manque peut-être ? 💭`;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: {
        seconds: seconds,
        repeats: false,
      },
    });
    console.log('📅 Rappel intelligent programmé');
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

  // Notification quand on rejoint ou crée un couple
  const notifyCoupleJoined = async (partnerName) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💑 Couple créé !',
          body: `Félicitations ! Tu es maintenant en couple avec ${partnerName} sur HANI 2 ! 💕`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { seconds: 1 }, // Immédiat (après 1 seconde pour s'assurer que tout est chargé)
      });
      return true;
    } catch (error) {
      console.error('❌ Erreur notification couple:', error);
      return false;
    }
  };

  // Notification quand un partenaire rejoint après création
  const notifyPartnerJoinedCreator = async (partnerName) => {
    try {
      await sendPushNotification(
        '👫 Partenaire connecté !',
        `${partnerName} a rejoint votre espace couple ! 🎉 Synchronisation en temps réel activée 💕`,
        { type: 'partner_joined_creator' }
      );
      return true;
    } catch (error) {
      console.error('❌ Erreur notification partenaire rejoint:', error);
      return false;
    }
  };

  // Notification quand on se connecte
  const notifyLoginSuccess = async (userName) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '👋 Re-bonjour !',
          body: `Content de te revoir ${userName} ! Ton amour t'attend 💕`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: null, // Immédiat
      });
      return true;
    } catch (error) {
      console.error('❌ Erreur notification login:', error);
      return false;
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
    notifyChallengeAssigned,
    notifyTimeCapsule,
    notifyCapsuleOpened,
    notifyPartnerOnline,
    notifyBucketCompleted,
    notifyGameInvite,
    notifyWheelSpin,
    // Rappels
    scheduleDailyReminder,
    scheduleSmartReminder,
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
    notifyPartnerJoinedCreator,
    notifyLoginSuccess,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
