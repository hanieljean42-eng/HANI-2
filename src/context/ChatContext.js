import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database, isConfigured } from '../config/firebase';
import { ref, set, onValue, off, push } from 'firebase/database';
import { useAuth } from './AuthContext';
import { encryptMessageObject, decryptMessageObject } from '../utils/encryption';

const ChatContext = createContext({});

export const useChat = () => useContext(ChatContext);

export function ChatProvider({ children }) {
  const { user, couple, partner } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const typingTimeoutRef = useRef(null);
  const listenerRef = useRef(null);

  // Écouter les messages Firebase
  useEffect(() => {
    if (!couple?.id || !isConfigured || !database) return;

    const messagesRef = ref(database, `couples/${couple.id}/chat/messages`);
    const typingRef = ref(database, `couples/${couple.id}/chat/typing`);

    // Écouter les messages
    const messagesListener = onValue(messagesRef, (snapshot) => {
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

    listenerRef.current = { messagesListener, typingListener };

    return () => {
      off(messagesRef);
      off(typingRef);
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
  const sendMessage = async (content, type = 'text', metadata = {}) => {
    if (!couple?.id || !user?.id) return null;

    const message = {
      content: type === 'text' ? encryptMessageObject({ content }, couple.id).content : content,
      type, // 'text', 'image', 'voice', 'sticker'
      senderId: user.id,
      senderName: user.name,
      timestamp: new Date().toISOString(),
      read: false,
      reactions: {},
      ..
        // Retry logic pour réseau instable
        let retries = 0;
        const maxRetries = 3;
        
        const attemptSend = async () => {
          try {
            await set(newMessageRef, message);
            return { success: true, id: newMessageRef.key };
          } catch (error) {
            if (retries < maxRetries && error.message?.includes('NETWORK')) {
              retries++;
              console.warn(`⚠️ Retry ${retries}/${maxRetries} d'envoi du message...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Backoff
              return attemptSend();
            }
            throw error;
          }
        };
        
        return attemptSend();
      } else {
        // Mode local
        const localMessage = { id: Date.now().toString(), ...message };
        const updated = [...messages, localMessage];
        setMessages(updated);
        await AsyncStorage.setItem('@chatMessages', JSON.stringify(updated));
        console.warn('📱 Mode local - message en attente de sync');
        return { success: true, id: localMessage.id };
      }
    } catch (error) {
      console.error('❌ Erreur envoi message:', error.messageString(), ...message };
        const updated = [...messages, localMessage];
        setMessages(updated);
        await AsyncStorage.setItem('@chatMessages', JSON.stringify(updated));
        return { success: true, id: localMessage.id };
      }
    } catch (error) {
      console.log('Erreur envoi message:', error);
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
        setTyping(false);
      }, 2000);
    }
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
    sendMessage,
    markAsRead,
    addReaction,
    setTyping,
    deleteMessage,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
