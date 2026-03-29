import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { database, isConfigured } from '../config/firebase';
import { ref, set, onValue, off, push, query as fbQuery, limitToLast, get, update } from 'firebase/database';
import { useAuth } from './AuthContext';
import { encryptMessageObject, decryptMessageObject } from '../utils/encryption';
import webrtcService from '../services/webrtcService';

const ChatContext = createContext({});

export const useChat = () => useContext(ChatContext);

export function ChatProvider({ children }) {
  const { user, couple, partner } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerRecording, setPartnerRecording] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [webrtcState, setWebrtcState] = useState(null); // 'connecting', 'connected', 'disconnected'
  
  const typingTimeoutRef = useRef(null);
  const listenerRef = useRef(null);
  const isCallerRef = useRef(false);
  const pendingOfferListenerRef = useRef(null);
  const lastMessageTimestampRef = useRef(null); // Pour détecter les NOUVEAUX messages
  const isChatActiveRef = useRef(false); // true si l'utilisateur est sur l'écran chat

  // ✅ Synchroniser les messages en attente (queue hors-ligne → Firebase)
  const syncingRef = useRef(false);
  const syncPendingMessages = async (coupleId) => {
    if (syncingRef.current || !isConfigured || !database) return;
    try {
      const raw = await AsyncStorage.getItem('@pendingMessages');
      const queue = raw ? JSON.parse(raw) : [];
      if (queue.length === 0) return;

      syncingRef.current = true;
      console.log(`📤 Sync ${queue.length} messages en attente...`);
      const remaining = [];

      for (const item of queue) {
        if (item.coupleId !== coupleId) { remaining.push(item); continue; }
        try {
          const messagesRef = ref(database, `couples/${coupleId}/chat/messages`);
          const newRef = push(messagesRef);
          await set(newRef, item.message);
        } catch (e) {
          remaining.push(item); // garder pour la prochaine sync
        }
      }

      await AsyncStorage.setItem('@pendingMessages', JSON.stringify(remaining));
      // Retirer les messages pending de la liste locale
      if (remaining.length < queue.length) {
        setMessages(prev => prev.filter(m => !m._pending));
      }
      console.log(`✅ Sync terminée, ${remaining.length} restants`);
    } catch (e) {
      console.log('⚠️ Erreur sync pending:', e.message);
    } finally {
      syncingRef.current = false;
    }
  };

  // Écouter les messages Firebase
  useEffect(() => {
    if (!couple?.id || !isConfigured || !database) return;

    const messagesRef = ref(database, `couples/${couple.id}/chat/messages`);
    const messagesQuery = fbQuery(messagesRef, limitToLast(100));
    const typingRef = ref(database, `couples/${couple.id}/chat/typing`);

    // Écouter les 100 derniers messages
    const messagesListener = onValue(messagesQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const messagesArray = Object.entries(data).map(([key, value]) => {
          // Déchiffrer les messages texte
          if (value.type === 'text' && value.content) {
            return {
              id: key,
              ...value,
              content: decryptMessageObject({ content: value.content }, couple.id).content,
            };
          }
          return { id: key, ...value };
        });
        // Trier par date
        messagesArray.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(messagesArray);
        
        // Compter les non lus
        const unread = messagesArray.filter(
          m => m.senderId !== user?.id && !m.read
        ).length;
        setUnreadCount(unread);

        // ✅ NOTIFICATION LOCALE pour les nouveaux messages du partenaire
        // Fonctionne même si les push notifications sont cassées
        const lastMsg = messagesArray[messagesArray.length - 1];
        if (lastMsg && lastMsg.senderId !== user?.id && lastMsg.timestamp) {
          const msgTime = new Date(lastMsg.timestamp).getTime();
          const isNew = !lastMessageTimestampRef.current || msgTime > lastMessageTimestampRef.current;
          const isRecent = (Date.now() - msgTime) < 10000; // Moins de 10 secondes
          const appInBackground = AppState.currentState !== 'active';
          
          if (isNew && isRecent && (!isChatActiveRef.current || appInBackground)) {
            // Envoyer une notification locale
            const senderName = lastMsg.senderName || partner?.name || 'Partenaire';
            let body = '';
            if (lastMsg.type === 'image') body = `${senderName} t'a envoyé une photo 📸`;
            else if (lastMsg.type === 'voice') body = `${senderName} t'a envoyé un vocal 🎤`;
            else if (lastMsg.type === 'call') body = `${senderName} — ${lastMsg.content}`;
            else body = `${senderName}: ${(lastMsg.content || '').substring(0, 80)}`;
            
            Notifications.scheduleNotificationAsync({
              content: {
                title: '💌 Nouveau message',
                body: body,
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
                ...(Platform.OS === 'android' ? { channelId: 'love-messages' } : {}),
                data: { type: 'love_note' },
              },
              trigger: null,
            }).catch(e => console.log('⚠️ Notif locale msg:', e.message));
          }
          lastMessageTimestampRef.current = msgTime;
        }
        
        // Sauvegarder localement
        AsyncStorage.setItem('@chatMessages', JSON.stringify(messagesArray));

        // ✅ Synchroniser les messages en attente (queue hors-ligne)
        syncPendingMessages(couple.id);
      }
    });

    // Écouter le statut de frappe
    const typingListener = onValue(typingRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Vérifier si le partenaire tape
        if (partner?.id && data[partner.id]) {
          const lastTyping = new Date(data[partner.id]);
          const now = new Date();
          // Si moins de 3 secondes
          setPartnerTyping((now - lastTyping) < 3000);
        }
      }
    });

    // Écouter le statut d'enregistrement vocal
    const recordingRef = ref(database, `couples/${couple.id}/chat/recording`);
    const recordingListener = onValue(recordingRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setPartnerRecording(partner?.id ? data[partner.id] === true : false);
      } else {
        setPartnerRecording(false);
      }
    });

    // Écouter les appels actifs
    const callActiveRef = ref(database, `couples/${couple.id}/calls/active`);
    const callListener = onValue(callActiveRef, (snapshot) => {
      if (snapshot.exists()) {
        const callData = snapshot.val();
        if (callData.status === 'ringing' && callData.callerId !== user.id) {
          // ✅ Gestion appels simultanés : si j'ai aussi un appel 'ringing' en cours
          // Le premier appel (createdAt le plus ancien) gagne
          if (isCallerRef.current && activeCall?.status === 'ringing' && activeCall?.callerId === user.id) {
            // Conflit ! Les deux ont appelé en même temps
            const myCallTime = activeCall?.createdAt || new Date(activeCall?.timestamp).getTime();
            const theirCallTime = callData.createdAt || new Date(callData.timestamp).getTime();
            
            if (theirCallTime <= myCallTime) {
              // Le partenaire a appelé en premier → j'annule mon appel et j'accepte le sien
              console.log('📞 Conflit appel simultané → le partenaire a appelé en premier, auto-accept');
              isCallerRef.current = false;
              setActiveCall(null);
              setIncomingCall(callData);
              return;
            } else {
              // J'ai appelé en premier → ignorer son appel (il verra mon appel entrant)
              console.log('📞 Conflit appel simultané → j\'ai appelé en premier, j\'ignore son appel');
              return;
            }
          }
          // Appel entrant normal pour moi
          setIncomingCall(callData);
        } else if (callData.status === 'accepted') {
          // Appel accepté — mettre à jour activeCall pour les DEUX côtés
          setActiveCall(callData);
          setIncomingCall(null);
          
          // Si on est l'appelant, initialiser WebRTC et créer l'offre
          if (isCallerRef.current && callData.callerId === user.id) {
            webrtcService.init(couple.id, user.id);
            webrtcService.onConnectionStateChange = (state) => setWebrtcState(state);
            webrtcService.onLocalStream = (stream) => setLocalStream(stream);
            webrtcService.onRemoteStream = (stream) => setRemoteStream(stream);
            webrtcService.getLocalStream(callData.type || 'audio').then(stream => {
              if (stream) {
                webrtcService.createPeerConnection();
                webrtcService.createOffer();
              }
            }).catch(e => console.log('⚠️ WebRTC caller setup error:', e));
          }
        } else if (callData.status === 'rejected') {
          // Appel rejeté par le partenaire
          console.log('📵 Appel rejeté par le partenaire');
          setIncomingCall(null);
          setActiveCall(prev => prev ? { ...prev, status: 'rejected' } : null);
          setLocalStream(null);
          setRemoteStream(null);
          setWebrtcState(null);
          webrtcService.cleanup().catch(() => {});
        } else if (callData.status === 'ended') {
          setIncomingCall(null);
          setActiveCall(null);
          setLocalStream(null);
          setRemoteStream(null);
          setWebrtcState(null);
          webrtcService.cleanup().catch(() => {});
        }
      } else {
        // Noeud supprimé = appel terminé
        setIncomingCall(null);
        setActiveCall(null);
        setLocalStream(null);
        setRemoteStream(null);
        setWebrtcState(null);
        webrtcService.cleanup().catch(() => {});
      }
    });

    listenerRef.current = { messagesListener, typingListener, recordingListener, callListener };

    return () => {
      off(messagesQuery);
      off(typingRef);
      off(recordingRef);
      off(callActiveRef);
    };
  }, [couple?.id, user?.id, partner?.id]);

  // Charger les messages locaux au démarrage
  useEffect(() => {
    loadLocalMessages();
  }, []);

  const loadLocalMessages = async () => {
    try {
      const saved = await AsyncStorage.getItem('@chatMessages');
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Erreur chargement messages:', error);
    }
  };

  // Envoyer un message
  const sendMessage = async (content, type = 'text', metadata = {}, replyTo = null) => {
    if (!couple?.id || !user?.id) return null;

    try {
      // Normaliser metadata: si c'est un string, le convertir en objet
      const safeMetadata = (metadata && typeof metadata === 'object' && !Array.isArray(metadata))
        ? metadata
        : (typeof metadata === 'string' ? { value: metadata } : {});

      const message = {
        content: type === 'text' ? encryptMessageObject({ content }, couple.id).content : content,
        type, // 'text', 'image', 'voice', 'sticker'
        senderId: user.id,
        senderName: user.name,
        timestamp: new Date().toISOString(),
        read: false,
        reactions: {},
        ...(Object.keys(safeMetadata).length > 0 ? { metadata: safeMetadata } : {}),
        ...(replyTo ? { replyTo: { id: replyTo.id, content: replyTo.content?.substring(0, 100), senderName: replyTo.senderName, type: replyTo.type } } : {}),
      };

      if (isConfigured && database) {
        // Mode Firebase
        let retries = 0;
        const maxRetries = 3;

        const attemptSend = async () => {
          try {
            const messagesRef = ref(database, `couples/${couple.id}/chat/messages`);
            const newMessageRef = push(messagesRef);
            await set(newMessageRef, message);
            return { success: true, id: newMessageRef.key };
          } catch (error) {
            if (retries < maxRetries && error.message?.includes('NETWORK')) {
              retries++;
              console.warn(`⚠️ Retry ${retries}/${maxRetries} d'envoi du message...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * retries));
              return attemptSend();
            }
            throw error;
          }
        };

        try {
          return await attemptSend();
        } catch (sendError) {
          // ✅ Sauvegarder en queue hors-ligne si l'envoi échoue
          console.warn('📱 Sauvegarde du message en queue hors-ligne');
          const localMessage = { id: 'pending_' + Date.now().toString(), ...message, _pending: true };
          const updated = [...messages, localMessage];
          setMessages(updated);
          // Ajouter à la queue de messages en attente
          const pendingQueue = JSON.parse(await AsyncStorage.getItem('@pendingMessages') || '[]');
          pendingQueue.push({ coupleId: couple.id, message });
          await AsyncStorage.setItem('@pendingMessages', JSON.stringify(pendingQueue));
          await AsyncStorage.setItem('@chatMessages', JSON.stringify(updated));
          return { success: true, id: localMessage.id, pending: true };
        }
      } else {
        // Mode local (Firebase pas configuré)
        const localMessage = { id: Date.now().toString(), ...message };
        const updated = [...messages, localMessage];
        setMessages(updated);
        await AsyncStorage.setItem('@chatMessages', JSON.stringify(updated));
        console.warn('📱 Mode local - message en attente de sync');
        return { success: true, id: localMessage.id };
      }
    } catch (error) {
      console.error('❌ Erreur envoi message:', error.message);
      return { success: false, error: error.message };
    }
  };

  // Marquer les messages comme lus (batch update — une seule écriture Firebase)
  const markAsRead = async () => {
    if (!couple?.id || !user?.id || !isConfigured || !database) return;

    try {
      const unreadMessages = messages.filter(
        m => m.senderId !== user.id && !m.read
      );

      if (unreadMessages.length === 0) return;

      // ✅ Batch update : une seule écriture Firebase au lieu de N
      const updates = {};
      unreadMessages.forEach(msg => {
        updates[`couples/${couple.id}/chat/messages/${msg.id}/read`] = true;
      });
      await update(ref(database), updates);
      
      setUnreadCount(0);
    } catch (error) {
      console.log('Erreur markAsRead:', error);
    }
  };

  // Ajouter une réaction
  const addReaction = async (messageId, emoji) => {
    if (!couple?.id || !user?.id || !isConfigured || !database) return;

    try {
      const reactionRef = ref(
        database, 
        `couples/${couple.id}/chat/messages/${messageId}/reactions/${user.id}`
      );
      await set(reactionRef, emoji);
    } catch (error) {
      console.log('Erreur réaction:', error);
    }
  };

  // Signaler que l'utilisateur tape
  const setTyping = async (typing) => {
    if (!couple?.id || !user?.id || !isConfigured || !database) return;

    setIsTyping(typing);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (typing) {
      try {
        const typingRef = ref(database, `couples/${couple.id}/chat/typing/${user.id}`);
        await set(typingRef, new Date().toISOString());
      } catch (error) {
        console.log('Erreur typing:', error);
      }

      // Arrêter après 2 secondes d'inactivité
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    }
  };

  // Signaler que l'utilisateur enregistre un vocal
  const setVoiceRecording = async (recording) => {
    if (!couple?.id || !user?.id || !isConfigured || !database) return;
    try {
      const recRef = ref(database, `couples/${couple.id}/chat/recording/${user.id}`);
      await set(recRef, recording ? true : null);
    } catch (error) {
      console.log('Erreur recording status:', error);
    }
  };

  // Lancer un appel audio via Firebase Relay
  const initiateCall = async (type) => {
    if (!couple?.id || !user?.id || !isConfigured || !database) return null;

    // ✅ Vérifier s'il y a déjà un appel actif (évite les appels simultanés)
    const callRef = ref(database, `couples/${couple.id}/calls/active`);
    try {
      const existingCall = await get(callRef);
      if (existingCall.exists()) {
        const existingData = existingCall.val();
        // Si un appel est déjà en cours (ringing ou accepted), ne pas en créer un nouveau
        if (existingData.status === 'ringing' || existingData.status === 'accepted') {
          console.log('⚠️ Un appel est déjà en cours, impossible d\'en lancer un autre');
          // Si c'est le partenaire qui appelle, traiter comme appel entrant
          if (existingData.callerId !== user.id) {
            setIncomingCall(existingData);
          }
          return null;
        }
      }
    } catch (e) {
      console.log('⚠️ Vérification appel existant échouée:', e.message);
    }

    const roomId = `HANI2${couple.id.replace(/-/g, '')}${Date.now()}`;
    const callData = {
      callerId: user.id,
      callerName: user.name,
      type: 'audio',
      roomId,
      status: 'ringing',
      timestamp: new Date().toISOString(),
      createdAt: Date.now(), // ✅ Timestamp numérique pour résoudre les conflits
    };
    try {
      // Nettoyer les anciennes données SDP/ICE
      const sdpCleanRef = ref(database, `couples/${couple.id}/calls/sdp`);
      const iceCleanRef = ref(database, `couples/${couple.id}/calls/ice`);
      await set(sdpCleanRef, null);
      await set(iceCleanRef, null);

      await set(callRef, callData);
      setActiveCall(callData);
      isCallerRef.current = true;

      return roomId;
    } catch (error) {
      console.log('Erreur initiation appel:', error);
      return null;
    }
  };

  // Accepter un appel entrant via Firebase Relay
  const acceptCall = async () => {
    if (!couple?.id || !incomingCall) return null;
    try {
      // Mettre à jour le status + ajouter acceptedAt pour synchroniser le timer
      const callRef = ref(database, `couples/${couple.id}/calls/active`);
      const updatedCallData = {
        ...incomingCall,
        status: 'accepted',
        acceptedAt: Date.now(),
      };
      await set(callRef, updatedCallData);
      const roomId = incomingCall.roomId;
      setActiveCall(updatedCallData);
      setIncomingCall(null);
      isCallerRef.current = false;

      // Initialiser WebRTC côté appelé
      webrtcService.init(couple.id, user.id);
      webrtcService.onConnectionStateChange = (state) => setWebrtcState(state);
      webrtcService.onLocalStream = (stream) => setLocalStream(stream);
      webrtcService.onRemoteStream = (stream) => setRemoteStream(stream);

      const rtcStream = await webrtcService.getLocalStream(incomingCall.type || 'audio');
      if (rtcStream) {
        webrtcService.createPeerConnection();
        // Attendre l'offre SDP de l'appelant
        const offerRef = ref(database, `couples/${couple.id}/calls/sdp/offer`);
        const unsubOffer = onValue(offerRef, async (snap) => {
          if (snap.exists() && webrtcService.peerConnection && !webrtcService.peerConnection.remoteDescription) {
            unsubOffer();
            await webrtcService.handleOffer(snap.val()).catch(e => console.log('⚠️ handleOffer error:', e));
          }
        });
      }

      return roomId;
    } catch (error) {
      console.log('Erreur acceptation appel:', error);
      return null;
    }
  };

  // Rejeter un appel entrant — écrire 'rejected' puis supprimer pour que le caller soit notifié
  const rejectCall = async () => {
    if (!couple?.id) return;
    try {
      webrtcService.cleanup().catch(() => {});
      setLocalStream(null);
      setRemoteStream(null);
      setWebrtcState(null);
      const callRef = ref(database, `couples/${couple.id}/calls/active`);
      // Écrire 'rejected' pour que le caller détecte le refus
      if (incomingCall) {
        await set(callRef, { ...incomingCall, status: 'rejected' });
        // Petit délai pour que le caller puisse lire le status
        await new Promise(r => setTimeout(r, 500));
      }
      await set(callRef, null);
      setIncomingCall(null);
    } catch (error) {
      console.log('Erreur rejet appel:', error);
    }
  };

  // Terminer un appel + cleanup Firebase Relay
  const endCall = async () => {
    if (!couple?.id) return;
    try {
      await webrtcService.cleanup();
      setLocalStream(null);
      setRemoteStream(null);
      setWebrtcState(null);
      isCallerRef.current = false;
      const callRef = ref(database, `couples/${couple.id}/calls/active`);
      await set(callRef, null);
      setActiveCall(null);
      setIncomingCall(null);
    } catch (error) {
      console.log('Erreur fin appel:', error);
    }
  };

  // Toggle mute micro (Firebase Relay)
  const toggleMute = () => {
    return webrtcService.toggleMute();
  };

  // Toggle haut-parleur (Firebase Relay)
  const toggleSpeaker = () => {
    return webrtcService.toggleSpeaker();
  };

  // Toggle caméra (WebRTC)
  const toggleCamera = () => {
    return webrtcService.toggleCamera();
  };

  // Basculer caméra avant/arrière (WebRTC)
  const switchCamera = async () => {
    return webrtcService.switchCamera();
  };

  // Supprimer un message (soft delete — le partenaire voit "Message supprimé")
  const deleteMessage = async (messageId) => {
    if (!couple?.id || !user?.id || !isConfigured || !database) return;

    try {
      // ✅ Soft delete : marquer comme supprimé au lieu d'effacer
      const msgRef = ref(database, `couples/${couple.id}/chat/messages/${messageId}`);
      await update(ref(database), {
        [`couples/${couple.id}/chat/messages/${messageId}/deleted`]: true,
        [`couples/${couple.id}/chat/messages/${messageId}/deletedAt`]: new Date().toISOString(),
        [`couples/${couple.id}/chat/messages/${messageId}/deletedBy`]: user.id,
      });
      
      // Mettre à jour localement
      const updated = messages.map(m => 
        m.id === messageId 
          ? { ...m, deleted: true, deletedAt: new Date().toISOString(), deletedBy: user.id }
          : m
      );
      setMessages(updated);
      await AsyncStorage.setItem('@chatMessages', JSON.stringify(updated));
    } catch (error) {
      console.log('Erreur suppression message:', error);
    }
  };

  // ✅ Fonction pour indiquer si l'utilisateur est sur l'écran chat
  const setChatActive = (active) => {
    isChatActiveRef.current = active;
  };

  const value = {
    messages,
    unreadCount,
    isTyping,
    partnerTyping,
    partnerRecording,
    incomingCall,
    activeCall,
    localStream,
    remoteStream,
    webrtcState,
    sendMessage,
    markAsRead,
    addReaction,
    setTyping,
    setVoiceRecording,
    deleteMessage,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    toggleCamera,
    switchCamera,
    setChatActive,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
