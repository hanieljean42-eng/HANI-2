import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database, isConfigured } from '../config/firebase';
import { ref, set, onValue, off, push, query as fbQuery, limitToLast, get } from 'firebase/database';
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
        
        // Sauvegarder localement
        AsyncStorage.setItem('@chatMessages', JSON.stringify(messagesArray));
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
          // Appel entrant pour moi
          setIncomingCall(callData);
        } else if (callData.status === 'accepted') {
          // Appel accepté — mettre à jour activeCall pour les DEUX côtés
          setActiveCall(callData);
          setIncomingCall(null);
          
          // Si on est l'appelant, envoyer l'offre SDP maintenant que l'appel est accepté
          if (isCallerRef.current && callData.callerId === user.id && webrtcService.peerConnection) {
            webrtcService.createOffer().catch(e => console.log('⚠️ SDP offer error:', e));
          }
        } else if (callData.status === 'ended') {
          setIncomingCall(null);
          setActiveCall(null);
          setLocalStream(null);
          setRemoteStream(null);
          setWebrtcState(null);
          webrtcService.cleanup();
        }
      } else {
        // Noeud supprimé = appel terminé
        setIncomingCall(null);
        setActiveCall(null);
        setLocalStream(null);
        setRemoteStream(null);
        setWebrtcState(null);
        webrtcService.cleanup();
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

        return attemptSend();
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

  // Marquer les messages comme lus
  const markAsRead = async () => {
    if (!couple?.id || !user?.id || !isConfigured || !database) return;

    try {
      const unreadMessages = messages.filter(
        m => m.senderId !== user.id && !m.read
      );

      for (const msg of unreadMessages) {
        const msgRef = ref(database, `couples/${couple.id}/chat/messages/${msg.id}/read`);
        await set(msgRef, true);
      }
      
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

  // Lancer un appel (audio ou vidéo) avec WebRTC
  const initiateCall = async (type) => {
    if (!couple?.id || !user?.id || !isConfigured || !database) return null;
    const roomId = `HANI2${couple.id.replace(/-/g, '')}${Date.now()}`;
    const callData = {
      callerId: user.id,
      callerName: user.name,
      type,
      roomId,
      status: 'ringing',
      timestamp: new Date().toISOString(),
    };
    try {
      // Nettoyer d'abord les anciennes données de signaling
      const sdpRef = ref(database, `couples/${couple.id}/calls/sdp`);
      const iceRef = ref(database, `couples/${couple.id}/calls/ice`);
      await set(sdpRef, null);
      await set(iceRef, null);

      const callRef = ref(database, `couples/${couple.id}/calls/active`);
      await set(callRef, callData);
      setActiveCall(callData);
      isCallerRef.current = true;

      // Initialiser WebRTC côté appelant
      webrtcService.init(couple.id, user.id);
      webrtcService.onLocalStream = (stream) => setLocalStream(stream);
      webrtcService.onRemoteStream = (stream) => setRemoteStream(stream);
      webrtcService.onConnectionStateChange = (state) => setWebrtcState(state);
      
      await webrtcService.getLocalStream(type);
      webrtcService.createPeerConnection();
      // L'offre SDP sera envoyée quand l'appel est accepté (status='accepted')

      return roomId;
    } catch (error) {
      console.log('Erreur initiation appel:', error);
      return null;
    }
  };

  // Accepter un appel entrant avec WebRTC
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
      webrtcService.onLocalStream = (stream) => setLocalStream(stream);
      webrtcService.onRemoteStream = (stream) => setRemoteStream(stream);
      webrtcService.onConnectionStateChange = (state) => setWebrtcState(state);
      
      await webrtcService.getLocalStream(incomingCall.type);
      webrtcService.createPeerConnection();

      // Lire l'offre SDP du caller depuis Firebase
      const offerRef = ref(database, `couples/${couple.id}/calls/sdp/offer`);
      const offerSnap = await get(offerRef);
      if (offerSnap.exists()) {
        await webrtcService.handleOffer(offerSnap.val());
      } else {
        // L'offre n'est pas encore là, écouter
        const unsubscribeOffer = onValue(offerRef, async (snapshot) => {
          if (snapshot.exists()) {
            unsubscribeOffer();
            pendingOfferListenerRef.current = null;
            await webrtcService.handleOffer(snapshot.val());
          }
        });
        pendingOfferListenerRef.current = unsubscribeOffer;
      }

      return roomId;
    } catch (error) {
      console.log('Erreur acceptation appel:', error);
      return null;
    }
  };

  // Rejeter un appel entrant
  const rejectCall = async () => {
    if (!couple?.id) return;
    try {
      if (pendingOfferListenerRef.current) {
        pendingOfferListenerRef.current();
        pendingOfferListenerRef.current = null;
      }
      await webrtcService.cleanup();
      setLocalStream(null);
      setRemoteStream(null);
      setWebrtcState(null);
      const callRef = ref(database, `couples/${couple.id}/calls/active`);
      await set(callRef, null);
      setIncomingCall(null);
    } catch (error) {
      console.log('Erreur rejet appel:', error);
    }
  };

  // Terminer un appel + cleanup WebRTC
  const endCall = async () => {
    if (!couple?.id) return;
    try {
      if (pendingOfferListenerRef.current) {
        pendingOfferListenerRef.current();
        pendingOfferListenerRef.current = null;
      }
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

  // Toggle mute micro (WebRTC)
  const toggleMute = () => {
    return webrtcService.toggleMute();
  };

  // Toggle caméra on/off (WebRTC)
  const toggleCamera = () => {
    return webrtcService.toggleCamera();
  };

  // Basculer caméra avant/arrière
  const switchCamera = async () => {
    await webrtcService.switchCamera();
  };

  // Supprimer un message
  const deleteMessage = async (messageId) => {
    if (!couple?.id || !isConfigured || !database) return;

    try {
      const msgRef = ref(database, `couples/${couple.id}/chat/messages/${messageId}`);
      await set(msgRef, null);
      
      const updated = messages.filter(m => m.id !== messageId);
      setMessages(updated);
      await AsyncStorage.setItem('@chatMessages', JSON.stringify(updated));
    } catch (error) {
      console.log('Erreur suppression message:', error);
    }
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
    toggleCamera,
    switchCamera,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
