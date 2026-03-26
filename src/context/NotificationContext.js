import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, AppState } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database, isConfigured } from '../config/firebase';
import { ref, set, get, push, remove, onValue, off, onChildAdded } from 'firebase/database';
import { useAuth } from './AuthContext';
import { navigate } from '../navigation/navigationRef';

const NotificationContext = createContext({});

export const useNotifications = () => useContext(NotificationContext);

// ✅ Configuration des notifications — FORCER l'affichage dans tous les cas
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification?.request?.content?.data;
    const isCall = data?.type === 'incoming_call' || data?.type === 'call';
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      // ✅ Priorité maximale pour les appels, haute pour le reste
      priority: isCall
        ? Notifications.AndroidNotificationPriority.MAX
        : Notifications.AndroidNotificationPriority.HIGH,
    };
  },
});

export function NotificationProvider({ children }) {
  const { user: authUser, couple: authCouple } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  const partnerTokenListenerRef = useRef(); // ✅ Ref pour cleanup propre
  const tokenSavedForCoupleRef = useRef(null); // ✅ Track quel coupleId a déjà été sauvegardé
  const firebaseNotifListenerRef = useRef(null); // ✅ Listener notifications Firebase
  const [userId, setUserId] = useState(null);
  const [coupleId, setCoupleId] = useState(null);
  const [partnerToken, setPartnerToken] = useState(null);

  // ✅ Refs pour éviter les closures stale dans sendPushNotification
  const partnerTokenRef = useRef(null);
  const authUserRef = useRef(null);
  const authCoupleRef = useRef(null);

  // Synchroniser les refs avec les valeurs actuelles
  useEffect(() => { partnerTokenRef.current = partnerToken; }, [partnerToken]);
  useEffect(() => { authUserRef.current = authUser; }, [authUser]);
  useEffect(() => { authCoupleRef.current = authCouple; }, [authCouple]);

  // ✅ Mapping type de notification → écran de destination
  const getScreenForType = (type) => {
    switch (type) {
      // Chat & Messages
      case 'love_note':
      case 'note_read':
      case 'chat_message':
      case 'voice_message':
      case 'incoming_call':
        return { stack: 'Chat' };
      // Jeux
      case 'game_invite':
      case 'game_win':
      case 'game_turn':
        return { stack: 'Games' };
      // Souvenirs & Capsules
      case 'memory':
      case 'capsule':
      case 'capsule_opened':
      case 'scheduled_letter':
      case 'letter_read':
      case 'diary_entry':
        return { tab: 'Memories' };
      // Défis
      case 'challenge':
      case 'challenge_assigned':
        return { tab: 'Challenges' };
      // Roue
      case 'wheel_spin':
      case 'wheel_spin_partner':
        return { tab: 'Wheel' };
      // Profil & Couple
      case 'profile_update':
      case 'couple_name':
      case 'photo_change':
        return { tab: 'Profile' };
      case 'online':
      case 'anniversary':
      case 'partner_joined':
      case 'partner_joined_creator':
        return { tab: 'Home' };
      // Love Meter
      case 'love_meter':
      case 'miss_you':
        return { tab: 'Home' };
      // Bucket list
      case 'bucket':
      case 'new_bucket':
        return { tab: 'Profile' };
      // Stats
      case 'stats':
        return { stack: 'Stats' };
      // Test / Welcome / Login
      case 'test':
      case 'welcome':
      case 'login':
      case 'couple_created':
        return { tab: 'Home' };
      default:
        return { tab: 'Home' };
    }
  };

  // ✅ Naviguer vers le bon écran selon le type de notification
  const handleNotificationNavigation = (data) => {
    if (!data?.type) {
      console.log('⚠️ Pas de type dans la notification, navigation vers Home');
      navigate('MainTabs', { screen: 'Home' });
      return;
    }

    const destination = getScreenForType(data.type);
    console.log('🧭 Navigation notification:', data.type, '→', destination);

    if (destination.stack) {
      // Navigation vers un écran Stack (Chat, Games, Stats...)
      navigate(destination.stack, destination.params || undefined);
    } else if (destination.tab) {
      // Navigation vers un onglet (Home, Wheel, Memories, Challenges, Profile...)
      navigate('MainTabs', { screen: destination.tab });
    }
  };

  // ✅ Réagir aux changements d'authentification (login/logout/join couple)
  useEffect(() => {
    if (authUser?.id) {
      console.log('🔔 NotificationContext: User détecté:', authUser.name);
      setUserId(authUser.id);
    } else {
      setUserId(null);
    }
  }, [authUser?.id]);

  useEffect(() => {
    if (authCouple?.id) {
      console.log('🔔 NotificationContext: Couple détecté:', authCouple.id);
      setCoupleId(authCouple.id);
    } else {
      setCoupleId(null);
    }
  }, [authCouple?.id]);

  // ✅ ÉTAPE 1: Obtenir le token push au démarrage + rafraîchir à chaque retour au premier plan
  useEffect(() => {
    const fetchToken = () => {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          console.log('🔔 Token obtenu:', token.substring(0, 25) + '...');
          setExpoPushToken(token);
          setNotificationsEnabled(true);
        }
      });
    };

    // Obtenir le token au démarrage
    fetchToken();

    // ✅ Rafraîchir le token à chaque retour de l'app au premier plan
    // Cela garantit que le token est toujours à jour (expiration, changement de device, etc.)
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        console.log('🔄 App revenue au premier plan — rafraîchissement token push');
        fetchToken();
        // ✅ Forcer resave sur Firebase au retour (token peut avoir changé)
        tokenSavedForCoupleRef.current = null;
      }
    });

    // Listener pour les notifications reçues quand l'app est ouverte
    notificationListener.current = Notifications.addNotificationReceivedListener(notif => {
      console.log('📬 Notification reçue:', notif);
      setNotification(notif);
    });

    // ✅ Listener pour quand l'utilisateur clique sur la notification → navigation
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification cliquée:', response.notification?.request?.content?.title);
      const data = response.notification?.request?.content?.data;
      if (data) {
        // Petit délai pour s'assurer que la navigation est prête
        setTimeout(() => {
          handleNotificationNavigation(data);
        }, 500);
      }
    });

    return () => {
      appStateSubscription.remove();
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // ✅ ÉTAPE 2: Sauvegarder le token sur Firebase QUAND on a TOUTES les données nécessaires
  // Ce useEffect se déclenche chaque fois que expoPushToken, authUser ou authCouple changent
  // Il résout le problème de closure stale qui empêchait la sauvegarde
  useEffect(() => {
    if (!expoPushToken) {
      return; // Pas encore de token
    }
    if (!authUser?.id || !authCouple?.id) {
      console.log('🔔 Token prêt mais en attente de user/couple pour sauvegarder sur Firebase');
      return; // Pas encore de user ou couple
    }
    // Éviter de re-sauvegarder si déjà fait pour ce couple
    if (tokenSavedForCoupleRef.current === authCouple.id) {
      console.log('⏭️ Token déjà sauvegardé pour ce couple, skip');
      return;
    }

    console.log('🔔 ✅ Toutes les données prêtes → Sauvegarde token sur Firebase');
    console.log('   User:', authUser.name, '| Couple:', authCouple.id);

    const doSave = async () => {
      try {
        // Ne sauvegarder QUE les vrais tokens Expo sur Firebase
        if (!expoPushToken.startsWith('ExponentPushToken')) {
          console.log('⚠️ Token non valide, pas sauvegardé sur Firebase:', expoPushToken.substring(0, 20));
          return;
        }
        if (isConfigured && database) {
          const tokenRef = ref(database, `couples/${authCouple.id}/pushTokens/${authUser.id}`);
          await set(tokenRef, {
            token: expoPushToken,
            platform: Platform.OS,
            updatedAt: new Date().toISOString(),
            userName: authUser.name || 'User',
          });
          console.log('✅ Token push sauvegardé sur Firebase pour couple:', authCouple.id);
          tokenSavedForCoupleRef.current = authCouple.id;
          setUserId(authUser.id);
          setCoupleId(authCouple.id);
        }
        await AsyncStorage.setItem('@pushToken', expoPushToken);
      } catch (error) {
        console.error('❌ Erreur sauvegarde token sur Firebase:', error);
      }
    };

    doSave();
  }, [expoPushToken, authUser?.id, authCouple?.id]);

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
          
          let foundValid = false;
          // Chercher le token du partenaire (pas le nôtre)
          for (const [id, tokenData] of Object.entries(tokens)) {
            if (id !== userId && tokenData?.token) {
              // ✅ Accepter UNIQUEMENT les vrais tokens Expo
              if (tokenData.token.startsWith('ExponentPushToken')) {
                setPartnerToken(tokenData.token);
                partnerTokenRef.current = tokenData.token;
                foundValid = true;
                console.log('✅ Token partenaire valide détecté:', tokenData.token.substring(0, 25) + '...');
                break;
              } else {
                // Nettoyer le token invalide de Firebase et continuer la recherche
                console.log('⚠️ Token partenaire invalide détecté, nettoyage:', tokenData.token.substring(0, 20));
                const invalidRef = ref(database, `couples/${coupleId}/pushTokens/${id}`);
                set(invalidRef, null).catch(() => {});
                // Ne pas break ici — continuer à chercher un token valide
              }
            }
          }
          if (!foundValid) {
            console.log('⚠️ Aucun token partenaire valide trouvé');
            setPartnerToken(null);
            partnerTokenRef.current = null;
          }
        } else {
          console.log('⚠️ Pas de tokens trouvés - partenaire pas encore en ligne');
          setPartnerToken(null);
          partnerTokenRef.current = null;
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

  // 🔇 CANAL FIREBASE DÉSACTIVÉ — Notifications passent uniquement par Expo Push API
  // Le listener Firebase pendingNotifications est en pause.
  // Pour réactiver : décommenter le useEffect ci-dessous.
  /*
  useEffect(() => {
    if (!coupleId || !userId || !isConfigured || !database) return;
    console.log('👂 Écoute notifications Firebase pour:', userId);
    const notifsRef = ref(database, `couples/${coupleId}/pendingNotifications/${userId}`);
    const listenerStartTime = Date.now();
    get(notifsRef).then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const now = Date.now();
        Object.entries(data).forEach(([key, notif]) => {
          if (notif.createdAt && (now - notif.createdAt) > 120000) {
            remove(ref(database, `couples/${coupleId}/pendingNotifications/${userId}/${key}`)).catch(() => {});
          }
        });
      }
    }).catch(() => {});
    const unsubscribe = onChildAdded(notifsRef, async (snapshot) => {
      const notif = snapshot.val();
      const notifKey = snapshot.key;
      if (!notif || !notif.title) return;
      if (notif.createdAt && notif.createdAt < (listenerStartTime - 10000)) {
        remove(ref(database, `couples/${coupleId}/pendingNotifications/${userId}/${notifKey}`)).catch(() => {});
        return;
      }
      console.log('🔔 Notification Firebase reçue:', notif.title, notif.type);
      const channelId = getChannelForType(notif.type);
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notif.title, body: notif.body || '', sound: 'default',
            priority: notif.type === 'incoming_call' ? Notifications.AndroidNotificationPriority.MAX : Notifications.AndroidNotificationPriority.HIGH,
            ...(Platform.OS === 'android' ? { channelId } : {}),
            data: notif.data || { type: notif.type },
          },
          trigger: null,
        });
      } catch (e) { console.log('⚠️ Erreur notification locale Firebase:', e.message); }
      remove(ref(database, `couples/${coupleId}/pendingNotifications/${userId}/${notifKey}`)).catch(() => {});
    });
    firebaseNotifListenerRef.current = unsubscribe;
    return () => {
      if (firebaseNotifListenerRef.current) { firebaseNotifListenerRef.current(); firebaseNotifListenerRef.current = null; }
    };
  }, [coupleId, userId]);
  */

  // Fonction pour demander les permissions (Android 13+ compatible)
  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      // ✅ Créer TOUS les canaux de notification (requis Android 8+)
      // Les canaux doivent être créés AVANT d'envoyer des notifications
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Général',
        description: 'Notifications générales de l\'application',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B9D',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('love-messages', {
        name: 'Messages d\'amour 💕',
        description: 'Messages et notifications de votre partenaire',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B9D',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('game-invites', {
        name: 'Invitations aux jeux 🎮',
        description: 'Invitations et résultats de jeux en couple',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B9D',
        sound: 'default',
        enableVibrate: true,
      });

      await Notifications.setNotificationChannelAsync('challenges', {
        name: 'Défis 🏆',
        description: 'Nouveaux défis et accomplissements',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B9D',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Rappels ⏰',
        description: 'Rappels quotidiens et anniversaires',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      });

      // ✅ Canal appels — priorité maximale, son fort, vibration longue
      await Notifications.setNotificationChannelAsync('calls', {
        name: 'Appels 📞',
        description: 'Appels vocaux et vidéo entrants',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 800, 400, 800, 400, 800],
        lightColor: '#10B981',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: 1,
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        // ✅ Android 13+ (API 33) : demande explicite de POST_NOTIFICATIONS
        // Sur Android 13+, requestPermissionsAsync() affiche le dialogue système
        // Sur Android 12 et moins, la permission est automatiquement accordée
        console.log('🔔 Demande permission notifications (Android 13+ requis)...');
        const { status } = await Notifications.requestPermissionsAsync({
          android: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
          },
        });
        finalStatus = status;
        console.log('🔔 Résultat permission:', finalStatus);
      }
      
      if (finalStatus !== 'granted') {
        console.log('⚠️ Permissions de notification non accordées - Android 13+ nécessite une permission explicite');
        // ✅ Ne pas retourner null - on peut quand même essayer d'obtenir le token
        // L'utilisateur pourra activer les notifications plus tard dans les paramètres
        return null;
      }

      try {
        // Obtenir le token Expo Push avec le bon projectId
        // Le projectId doit correspondre à celui de app.json/eas.json
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
          console.log('⚠️ projectId manquant dans app.json extra.eas');
          return null;
        }
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
          // Ne PAS générer de token factice - il serait sauvegardé sur Firebase
          // et empêcherait les notifications push réelles
          console.log('⚠️ Aucun token valide disponible');
          token = null;
        }
      }
    } else {
      console.log('⚠️ Les notifications push nécessitent un appareil physique');
      token = null;
    }

    return token;
  }

  // ✅ Déterminer le channelId Android selon le type de notification
  const getChannelForType = (type) => {
    switch (type) {
      case 'call':
      case 'incoming_call':
      case 'missed_call':
        return 'calls';
      case 'game_invite':
      case 'game_win':
      case 'game_turn':
        return 'game-invites';
      case 'challenge':
      case 'challenge_assigned':
        return 'challenges';
      case 'daily_reminder':
      case 'smart_reminder':
      case 'anniversary':
        return 'reminders';
      default:
        // love_note, memory, capsule, online, wheel_spin, photo_change, etc.
        return 'love-messages';
    }
  };

  // ✅ Envoyer une notification push au partenaire via Expo Push API + Firebase
  const sendPushNotification = async (title, body, data = {}) => {
    const currentPartnerToken = partnerTokenRef.current;
    const currentUser = authUserRef.current;
    const currentCouple = authCoupleRef.current;
    
    console.log('📤 Envoi notification:', { title, type: data?.type });
    
    if (!currentCouple?.id || !currentUser?.id || !isConfigured || !database) {
      console.log('⚠️ Données manquantes pour envoyer la notification');
      return false;
    }

    // ✅ Récupérer token partenaire + partnerId EN UNE SEULE lecture Firebase
    let tokenToUse = (currentPartnerToken && currentPartnerToken.startsWith('ExponentPushToken')) 
      ? currentPartnerToken 
      : null;
    let partnerId = null;

    // Chercher partnerId dans members (toujours fiable)
    try {
      const membersRef = ref(database, `couples/${currentCouple.id}/members`);
      const membersSnap = await get(membersRef);
      if (membersSnap.exists()) {
        for (const id of Object.keys(membersSnap.val())) {
          if (id !== currentUser.id) { partnerId = id; break; }
        }
      }
    } catch (e) { /* ignore */ }

    // Fallback local pour partnerId
    if (!partnerId && currentCouple.members) {
      partnerId = Array.isArray(currentCouple.members)
        ? currentCouple.members.find(m => m !== currentUser.id)
        : Object.keys(currentCouple.members).find(m => m !== currentUser.id);
    }

    // Si pas de token, une seule tentative rapide de récupération
    if (!tokenToUse) {
      try {
        const tokensRef = ref(database, `couples/${currentCouple.id}/pushTokens`);
        const snapshot = await get(tokensRef);
        if (snapshot.exists()) {
          const tokens = snapshot.val();
          for (const [id, tokenData] of Object.entries(tokens)) {
            if (id !== currentUser.id && tokenData?.token?.startsWith('ExponentPushToken')) {
              tokenToUse = tokenData.token;
              setPartnerToken(tokenToUse);
              partnerTokenRef.current = tokenToUse;
              if (!partnerId) partnerId = id;
              break;
            }
          }
        }
      } catch (e) { /* ignore */ }
    }

    // ✅ Envoi UNIQUEMENT via Expo Push API (Canal Firebase désactivé)
    if (tokenToUse) {
      const channelId = getChannelForType(data?.type);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: tokenToUse,
            sound: 'default',
            title,
            body,
            data,
            priority: 'high',
            channelId,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const result = await response.json();
        if (response.ok) {
          console.log('✅ Push Expo envoyé');
        } else {
          console.log('⚠️ Push Expo erreur:', result);
        }
      } catch (e) {
        console.log('⚠️ Push Expo timeout/erreur:', e.message);
      }
    } else {
      console.log('⚠️ Pas de token push partenaire — notification non envoyée');
    }

    return true;
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

      // Créer le trigger approprié (useNextNotificationsApi: true requiert le type)
      let trigger;
      if (typeof triggerOptions === 'number') {
        // Compatibilité avec l'ancienne API (seconds) — ajout du type requis
        trigger = { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: triggerOptions };
      } else if (triggerOptions.date) {
        // Notification à une date précise
        const targetDate = new Date(triggerOptions.date);
        const now = new Date();
        if (targetDate <= now) {
          console.log('⚠️ Date de notification passée');
          return false;
        }
        trigger = { type: SchedulableTriggerInputTypes.DATE, date: targetDate };
      } else if (triggerOptions.seconds) {
        trigger = { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: triggerOptions.seconds };
      } else {
        trigger = { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 };
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
      '📸 Nouveau souvenir partagé !',
      `${userName} vient d'ajouter un souvenir à votre album commun 💑 Viens le voir !`,
      { type: 'memory' }
    );
  };

  // Notification quand un message est envoyé dans le chat
  const notifyLoveNote = async (userName, preview) => {
    const isMedia = preview === '📸 Photo' || preview === '🎤 Message vocal';
    const body = isMedia
      ? `${userName} t'a envoyé ${preview} 💕`
      : `${userName} : ${preview.substring(0, 60)}${preview.length > 60 ? '...' : ''}`;
    await sendPushNotification(
      isMedia ? `${userName} t'a envoyé quelque chose` : '💌 Nouveau message',
      body,
      { type: 'love_note' }
    );
  };

  // Notification quand un défi est complété
  const notifyChallengeCompleted = async (userName, challengeName) => {
    await sendPushNotification(
      '🏆 Défi accompli !',
      `${userName} a relevé le défi "${challengeName}" ! Bravo ! Vous formez une super équipe 💪`,
      { type: 'challenge' }
    );
  };

  // Notification quand un défi est assigné
  const notifyChallengeAssigned = async (userName, challengeName) => {
    await sendPushNotification(
      '⚡ Défi lancé !',
      `${userName} te lance le défi "${challengeName}" ! Tu l'acceptes ? 💪`,
      { type: 'challenge_assigned' }
    );
  };

  // Notification quand une capsule temporelle est créée
  const notifyTimeCapsule = async (userName) => {
    await sendPushNotification(
      '⏳ Capsule du futur créée !',
      `${userName} a scellé un souvenir pour vous deux dans une capsule... 🔒 Elle s'ouvrira bientôt !`,
      { type: 'capsule' }
    );
  };

  // Notification quand une capsule temporelle est ouverte
  const notifyCapsuleOpened = async (userName, capsuleTitle) => {
    await sendPushNotification(
      '✨ Capsule déscellée !',
      `${userName} a ouvert la capsule "${capsuleTitle}" ! Un voyage dans le temps vous attend 💕`,
      { type: 'capsule_opened' }
    );
  };

  // Notification quand le partenaire se connecte
  const notifyPartnerOnline = async (userName) => {
    await sendPushNotification(
      `💚 ${userName} est là !`,
      `${userName} vient de se connecter sur HANI 👋 Dis-lui bonjour !`,
      { type: 'online' }
    );
  };

  // Notification quand un élément bucket list est coché
  const notifyBucketCompleted = async (userName, itemName) => {
    await sendPushNotification(
      '🌟 Rêve accompli !',
      `${userName} a coché "${itemName}" de votre bucket list ! Un rêve de moins, un souvenir de plus 🎉`,
      { type: 'bucket' }
    );
  };

  // Notification pour invitation à jouer
  const notifyGameInvite = async (userName, gameName) => {
    await sendPushNotification(
      `🎮 ${userName} te défie !`,
      `${userName} veut jouer à ${gameName} avec toi ! Tu es prêt(e) à relever le défi ? 🎯`,
      { type: 'game_invite', game: gameName }
    );
  };

  // Notification quand la roue des dates est tournée
  const notifyWheelSpin = async (userName, result) => {
    await sendPushNotification(
      '🎰 La roue a tourné !',
      `${userName} vient de faire tourner la roue des dates ! Résultat : "${result}" 💑 À vous de jouer !`,
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
        title: '☀️ Bonne journée !',
        body: 'N\'oublie pas d\'envoyer un message à ton amour aujourd\'hui 💕 Même un petit mot compte !',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
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
    
    const title = isChallengeIncomplete ? '⚡ Le défi t\'attend !' : '💬 Un moment ensemble ?';
    const body = isChallengeIncomplete
      ? `Le défi du jour n'est pas encore terminé ! C'est le moment parfait pour le faire ensemble 🎯`
      : `Ça fait un moment que tu n'as pas écrit à ${partnerName}... Un petit message pour lui faire sourire ? 💭`;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
        data: { type: isChallengeIncomplete ? 'challenge' : 'smart_reminder' },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
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
          data: { type: 'anniversary' },
        },
        trigger: {
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
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
        trigger: { type: SchedulableTriggerInputTypes.DATE, date: targetDate },
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

  // À l'initialisation, reprogrammer les notifications de lettres REÇUES (du partenaire)
  useEffect(() => {
    if (!authUser?.id) return;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@scheduledLetters');
        if (!stored) return;
        const letters = JSON.parse(stored);
        const letterNotifs = await AsyncStorage.getItem('@letterNotifications');
        const notifs = letterNotifs ? JSON.parse(letterNotifs) : {};

        for (const l of letters) {
          // ✅ Ne programmer que les lettres REÇUES du partenaire (pas les miennes)
          // Si fromId === mon id, c'est ma lettre → pas de notification pour moi
          if (l && l.id && !notifs[l.id] && l.fromId && l.fromId !== authUser.id) {
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
  }, [coupleId, authUser?.id]);

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
          title: '🎉 Bienvenue sur HANI !',
          body: `Salut ${userName} ! Prends le temps de te connecter avec ton amour 💕 Explore les jeux, souvenirs et bien plus !`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: 'welcome' },
        },
        trigger: { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2 },
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
          return { success: false, error: 'Permissions refusées. Allez dans Paramètres > Applications > HANI 2 > Notifications pour les activer.' };
        }
      }

      // IMPORTANT: trigger: null = notification immédiate (pas de délai)
      console.log('📤 Envoi notification immédiate...');
      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💕 Test HANI 2',
          body: 'Super ! Les notifications fonctionnent parfaitement ! 🎉',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
          data: { type: 'test' },
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
          data: { type: 'test' },
        },
        trigger: { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: seconds },
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
          data: { type: 'couple_created' },
        },
        trigger: { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 }, // Immédiat (après 1 seconde)
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
        '👫 Votre couple est complet !',
        `${partnerName} a rejoint votre espace couple sur HANI ! 🎉 Tout se synchronise maintenant en temps réel 💕`,
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
          title: `👋 Re-bonjour ${userName} !`,
          body: `Quelque chose de nouveau t'attend peut-être 💕 Viens vite !`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          data: { type: 'login' },
        },
        trigger: null, // Immédiat
      });
      return true;
    } catch (error) {
      console.error('❌ Erreur notification login:', error);
      return false;
    }
  };

  // ==================== NOTIFICATIONS MANQUANTES (HomeScreen) ====================
  const notifyMilestone = async (daysCount, emoji) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: `${emoji} ${daysCount} jours ensemble !`, body: 'Félicitations pour ce cap magnifique 🏆💕', sound: true },
        trigger: null,
      });
    } catch (e) { console.log('⚠️ notifyMilestone:', e.message); }
  };

  const notifyBadgeUnlocked = async (badgeName, badgeEmoji) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: `${badgeEmoji} Nouveau badge !`, body: `Tu as débloqué "${badgeName}" !`, sound: true },
        trigger: null,
      });
    } catch (e) { console.log('⚠️ notifyBadgeUnlocked:', e.message); }
  };

  const notifyLevelUp = async (level, rank, rankEmoji) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: `${rankEmoji} Niveau ${level} !`, body: `Vous êtes maintenant un couple ${rank} !`, sound: true },
        trigger: null,
      });
    } catch (e) { console.log('⚠️ notifyLevelUp:', e.message); }
  };

  const scheduleCountdownReminder = async (eventName, emoji, dateStr) => {
    try {
      const eventDate = new Date(dateStr);
      const now = new Date();
      
      // ✅ Notification J-1 (veille)
      const reminderDate = new Date(eventDate);
      reminderDate.setDate(reminderDate.getDate() - 1);
      reminderDate.setHours(9, 0, 0, 0);
      if (reminderDate > now) {
        await Notifications.scheduleNotificationAsync({
          content: { title: `${emoji} Demain : ${eventName}`, body: 'Préparez-vous pour demain ! 💕', sound: true },
          trigger: { type: SchedulableTriggerInputTypes.DATE, date: reminderDate },
        });
      }
      
      // ✅ Notification Jour J (le matin)
      const dayOfDate = new Date(eventDate);
      dayOfDate.setHours(8, 0, 0, 0);
      if (dayOfDate > now) {
        await Notifications.scheduleNotificationAsync({
          content: { title: `🎉 C'est aujourd'hui : ${eventName} !`, body: `${emoji} Le grand jour est arrivé ! Profitez-en ensemble 💕`, sound: true },
          trigger: { type: SchedulableTriggerInputTypes.DATE, date: dayOfDate },
        });
      }
    } catch (e) { console.log('⚠️ scheduleCountdownReminder:', e.message); }
  };

  // ✅ Notifier le partenaire qu'un nouvel événement a été créé
  const notifyNewEvent = async (eventName, emoji) => {
    try {
      // Notification locale
      await Notifications.scheduleNotificationAsync({
        content: { title: `${emoji} Nouvel événement`, body: `"${eventName}" a été ajouté au calendrier ! 📅`, sound: true },
        trigger: null,
      });
      // Notification push au partenaire
      await sendPushNotification(
        `${emoji} Nouvel événement`,
        `"${eventName}" a été ajouté ! Consultez la page d'accueil 📅`,
        { type: 'new_event' }
      );
    } catch (e) { console.log('⚠️ notifyNewEvent:', e.message); }
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
    // HomeScreen milestones & badges
    notifyMilestone,
    notifyBadgeUnlocked,
    notifyLevelUp,
    scheduleCountdownReminder,
    notifyNewEvent,
    // ChallengesScreen streaks
    notifyStreakDanger: async (streakCount, partnerName) => {
      try {
        await Notifications.scheduleNotificationAsync({
          content: { title: '🔥 Attention à votre flamme !', body: `Votre série de ${streakCount} jours est en danger ! Parlez à ${partnerName || 'votre partenaire'} aujourd'hui 💬`, sound: true },
          trigger: null,
        });
      } catch (e) { console.log('⚠️ notifyStreakDanger:', e.message); }
    },
    scheduleStreakReminder: async (streakCount) => {
      try {
        const reminderDate = new Date();
        reminderDate.setHours(20, 0, 0, 0);
        if (reminderDate <= new Date()) return;
        await Notifications.scheduleNotificationAsync({
          content: { title: '🔥 Maintenez votre flamme !', body: `${streakCount} jours consécutifs ! N'oubliez pas de discuter aujourd'hui 💕`, sound: true },
          trigger: { type: SchedulableTriggerInputTypes.DATE, date: reminderDate },
        });
      } catch (e) { console.log('⚠️ scheduleStreakReminder:', e.message); }
    },
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
