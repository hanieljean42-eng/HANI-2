import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  Alert,
  Animated,
  Keyboard,
  Modal,
  StatusBar,
  ActivityIndicator,
  Vibration,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
// RTCView stub — react-native-webrtc temporairement retiré (jitpack down)
const RTCView = () => null;
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifyPartner } from '../hooks/useNotifyPartner';
import { useData } from '../context/DataContext';
import { uploadToCloudinary, uploadAudioToCloudinary } from '../utils/uploadToCloudinary';

const { width, height } = Dimensions.get('window');

const MAX_IMAGE_WIDTH = width * 0.65;
const MIN_IMAGE_WIDTH = 120;

// 🔥 Helper: niveau de flamme selon le streak
const getStreakLevel = (count) => {
  if (count >= 365) return { emoji: '🌟', label: 'Éternel', color: '#FFD700' };
  if (count >= 100) return { emoji: '💖', label: 'Indestructible', color: '#FF1493' };
  if (count >= 30) return { emoji: '🔥🔥🔥', label: 'En feu !', color: '#FF4500' };
  if (count >= 7) return { emoji: '🔥🔥', label: 'Flamme vive', color: '#FF6347' };
  if (count >= 1) return { emoji: '🔥', label: 'Flamme allumée', color: '#FFA500' };
  return { emoji: '❄️', label: 'Pas de série', color: '#87CEEB' };
};

// Composant image adaptative qui préserve les proportions
const ChatImage = React.memo(({ uri }) => {
  const { theme } = useTheme();
  const [dims, setDims] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uri) {
      Image.getSize(
        uri,
        (w, h) => {
          const ratio = h / w;
          let displayWidth = Math.min(MAX_IMAGE_WIDTH, Math.max(MIN_IMAGE_WIDTH, w));
          let displayHeight = displayWidth * ratio;
          // Limiter la hauteur max à 400
          if (displayHeight > 400) {
            displayHeight = 400;
            displayWidth = displayHeight / ratio;
          }
          setDims({ width: displayWidth, height: displayHeight });
          setLoading(false);
        },
        () => {
          // Fallback si on ne peut pas obtenir les dimensions
          setDims({ width: MAX_IMAGE_WIDTH, height: 200 });
          setLoading(false);
        }
      );
    }
  }, [uri]);

  if (loading || !dims) {
    return (
      <View style={styles.messageImageLoading}>
        <ActivityIndicator size="small" color={theme.secondary} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[styles.messageImage, { width: dims.width, height: dims.height }]}
      resizeMode="contain"
    />
  );
});

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

export default function ChatScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { user, partner } = useAuth();
  const { 
    messages, 
    sendMessage, 
    markAsRead, 
    addReaction, 
    partnerTyping,
    partnerRecording,
    setTyping,
    deleteMessage,
    incomingCall,
    activeCall,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    setVoiceRecording,
    localStream,
    remoteStream,
    webrtcState,
    toggleMute: webrtcToggleMute,
    toggleCamera: webrtcToggleCamera,
    switchCamera,
  } = useChat();

  // Chat is now available
  const chatAvailable = true;
  const { notifyLoveNote, notifyNoteRead, notifyCall } = useNotifyPartner();
  const { addDiaryEntry, recordInteraction, streak } = useData();

  const [inputText, setInputText] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReactions, setShowReactions] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // Message auquel on répond
  
  // États pour les messages vocaux
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioProgress, setAudioProgress] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({});
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const callTimerRef = useRef(null);
  const ringtoneRef = useRef(null);
  const vibrationRef = useRef(null);
  
  const flatListRef = useRef(null);
  const recordingRef = useRef(null);
  const soundRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animation du bouton d'enregistrement
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (ringtoneRef.current) {
        ringtoneRef.current.unloadAsync();
        ringtoneRef.current = null;
      }
      Vibration.cancel();
    };
  }, []);

  // Auto-lancer un appel si navigué depuis le raccourci HomeScreen
  const autoCallHandled = useRef(false);
  useEffect(() => {
    const autoCall = route?.params?.autoCall;
    if (autoCall && !autoCallHandled.current) {
      autoCallHandled.current = true;
      // Petit délai pour que l'écran soit monté
      setTimeout(() => handleCall(autoCall), 500);
    }
  }, [route?.params?.autoCall]);

  // Marquer comme lu à l'ouverture + notifier le partenaire
  const hasNotifiedReadRef = React.useRef(false);
  const lastNotifiedCountRef = React.useRef(0);
  useEffect(() => {
    markAsRead();
    // Notifier le partenaire qu'on a lu ses messages
    if (messages.length > 0) {
      const unreadFromPartner = messages.filter(m => m.senderId !== user?.id && !m.read);
      // Re-notifier seulement si de nouveaux messages non-lus sont apparus
      if (unreadFromPartner.length > 0 && unreadFromPartner.length !== lastNotifiedCountRef.current) {
        lastNotifiedCountRef.current = unreadFromPartner.length;
        if (!hasNotifiedReadRef.current) {
          hasNotifiedReadRef.current = true;
          notifyNoteRead();
        }
      } else if (unreadFromPartner.length === 0) {
        hasNotifiedReadRef.current = false;
        lastNotifiedCountRef.current = 0;
      }
    }
  }, [messages]);

  // Scroll en bas quand nouveaux messages
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Scroll en bas quand le clavier s'ouvre (pour ne pas cacher les messages)
  useEffect(() => {
    const keyboardShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 150);
      }
    );
    return () => keyboardShow.remove();
  }, []);

  // Statut affiché sous le prénom du partenaire
  const getPartnerStatus = () => {
    if (partnerTyping) return { text: 'écrit...', color: 'rgba(255,255,255,0.85)', italic: true };
    if (partnerRecording) return { text: '🎤 enregistre un vocal...', color: 'rgba(255,255,255,0.85)', italic: true };
    if (partner?.isOnline) return { text: '🟢 En ligne', color: '#7FFF7F', italic: false };
    if (partner?.lastSeen) {
      const lastSeen = new Date(partner.lastSeen);
      const now = new Date();
      const diffMins = Math.floor((now - lastSeen) / 60000);
      if (diffMins < 1) return { text: 'Vu il y a quelques secondes', color: 'rgba(255,255,255,0.6)', italic: false };
      if (diffMins < 60) return { text: `Vu il y a ${diffMins} min`, color: 'rgba(255,255,255,0.6)', italic: false };
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return { text: `Vu à ${lastSeen.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, color: 'rgba(255,255,255,0.6)', italic: false };
      return { text: `Vu le ${lastSeen.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`, color: 'rgba(255,255,255,0.6)', italic: false };
    }
    return null;
  };

  // === SONNERIE & VIBRATION POUR APPELS ENTRANTS ===
  const startRingtone = async () => {
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      // Générer un son de sonnerie en boucle via le système
      // On utilise un pattern de vibration qui simule une sonnerie
      Vibration.vibrate([0, 800, 400, 800, 400, 800, 400, 800], true); // Boucle de vibration
    } catch (e) {
      console.log('⚠️ Erreur sonnerie:', e.message);
    }
  };

  const stopRingtone = () => {
    Vibration.cancel();
    if (ringtoneRef.current) {
      ringtoneRef.current.unloadAsync().catch(() => {});
      ringtoneRef.current = null;
    }
  };

  // Déclencher sonnerie + vibration quand appel entrant
  useEffect(() => {
    if (incomingCall) {
      startRingtone();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      stopRingtone();
    }
    return () => stopRingtone();
  }, [incomingCall]);

  // Lancer un appel
  const handleCall = async (type) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const roomId = await initiateCall(type);
    if (!roomId) {
      Alert.alert('Erreur', "Impossible de lancer l'appel. Vérifiez votre connexion.");
      return;
    }
    await notifyCall(type);
    setShowCallScreen(true);
    setCallTimer(0);
    setIsMuted(false);
    setIsSpeaker(false);
  };

  // Accepter un appel entrant
  const handleAcceptCall = async () => {
    stopRingtone();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await acceptCall();
    setShowCallScreen(true);
    setCallTimer(0);
    setIsMuted(false);
    setIsSpeaker(false);
  };

  // Raccrocher l'appel
  const handleEndCall = async () => {
    stopRingtone();
    setShowCallScreen(false);
    setCallTimer(0);
    setIsCameraOff(false);
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    await endCall();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  // Timer d'appel synchronisé via acceptedAt (Firebase timestamp)
  useEffect(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    
    if (showCallScreen && activeCall?.acceptedAt) {
      // Calculer le temps écoulé depuis acceptedAt pour synchronisation
      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - activeCall.acceptedAt) / 1000);
        setCallTimer(Math.max(0, elapsed));
      };
      updateTimer(); // Mise à jour immédiate
      callTimerRef.current = setInterval(updateTimer, 1000);
    } else if (showCallScreen && activeCall?.status === 'accepted' && !activeCall?.acceptedAt) {
      // Fallback si pas de acceptedAt
      callTimerRef.current = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }
    
    return () => { 
      if (callTimerRef.current) clearInterval(callTimerRef.current); 
    };
  }, [showCallScreen, activeCall?.acceptedAt, activeCall?.status]);

  // Fermer l'écran d'appel si l'appel se termine (partenaire raccroche)
  useEffect(() => {
    if (showCallScreen && !activeCall && !incomingCall) {
      stopRingtone();
      setShowCallScreen(false);
      setCallTimer(0);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
  }, [activeCall, incomingCall]);

  // Formater le timer
  const formatCallTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Lancer un vrai appel téléphonique via le numéro du partenaire
  const launchPhoneCall = () => {
    Alert.alert(
      '📞 Appel téléphonique',
      'Voulez-vous appeler votre partenaire via le téléphone ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: '📞 Appeler', 
          onPress: () => {
            // Ouvrir le dialer nativement
            Linking.openURL('tel:');
          }
        },
      ]
    );
  };

  const handleSend = async () => {
    if (!chatAvailable) {
      Alert.alert('💬 Chat indisponible', "L'envoi de messages n'est pas disponible pour le moment. Cette fonctionnalité arrivera dans une prochaine version.");
      return;
    }

    if (!inputText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const text = inputText.trim();
    setInputText('');
    
    const result = await sendMessage(text, 'text', {}, replyingTo);
    
    if (result?.success) {
      // Notifier le partenaire
      await notifyLoveNote(text.substring(0, 50));
      // 🔥 Compter comme interaction pour les flammes
      recordInteraction();
      // Effacer le reply
      setReplyingTo(null);
    }
  };

  const handleImagePick = async () => {
    if (!chatAvailable) {
      Alert.alert('💬 Chat indisponible', "L'envoi d'images n'est pas disponible pour le moment.");
      return;
    }

    try {
      // Demander la permission galerie (nécessaire Android 13+)
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '📸 Permission requise',
          'L\'accès à la galerie photo est nécessaire pour envoyer des images.\n\nAllez dans Paramètres > Applications > HANI 2 > Permissions > Photos pour l\'activer.',
          [{ text: 'Compris' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const file = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `chat_${Date.now()}.jpg`
        };

        try {
          const { url, publicId } = await uploadToCloudinary(file);
          await sendMessage(url, 'image', publicId);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // ✅ Notifier le partenaire qu'une image a été envoyée
          await notifyLoveNote('📸 Photo');
        } catch (error) {
          Alert.alert('Erreur', 'Impossible de télécharger l\'image');
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'image');
    }
  };

  // === MESSAGES VOCAUX ===
  const startRecording = async () => {
    if (!chatAvailable) {
      Alert.alert('💬 Chat indisponible', "L'envoi de messages vocaux n'est pas disponible pour le moment.");
      return;
    }

    try {
      // Demander les permissions
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission requise', 'L\'accès au microphone est nécessaire pour enregistrer des messages vocaux');
        return;
      }

      // Configurer le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Créer et démarrer l'enregistrement
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      setVoiceRecording(true); // Signaler au partenaire qu'on enregistre
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Timer pour afficher la durée
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.log('Erreur enregistrement:', error);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    
    try {
      clearInterval(recordingTimerRef.current);
      
      const status = await recordingRef.current.getStatusAsync();
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      // Utiliser la durée réelle du recording (en ms → sec), sinon le compteur
      const actualDuration = status?.durationMillis 
        ? Math.round(status.durationMillis / 1000) 
        : recordingDuration;
      
      setIsRecording(false);
      setVoiceRecording(false); // Arrêter l'indicateur partenaire
      recordingRef.current = null;
      
      if (uri && actualDuration >= 1) {
        try {
          // Upload l'audio vers Cloudinary pour que le partenaire puisse l'écouter
          const file = {
            uri: uri,
            type: 'audio/m4a',
            name: `voice_${Date.now()}.m4a`
          };
          const cloudResult = await uploadAudioToCloudinary(file);
          const audioUrl = cloudResult.url;
          
          // Envoyer le message avec l'URL Cloudinary (pas l'URI locale)
          await sendMessage(audioUrl, 'voice', { duration: actualDuration });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await notifyLoveNote('🎤 Message vocal');
        } catch (uploadError) {
          console.log('Erreur upload vocal:', uploadError);
          Alert.alert('Erreur', 'Impossible d\'envoyer le message vocal. Vérifie ta connexion.');
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      
      setRecordingDuration(0);
      
      // Remettre le mode audio normal
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      
    } catch (error) {
      console.log('Erreur arrêt enregistrement:', error);
    }
  };

  const cancelRecording = async () => {
    if (!recordingRef.current) return;
    
    try {
      clearInterval(recordingTimerRef.current);
      await recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
      setIsRecording(false);
      setVoiceRecording(false); // Arrêter l'indicateur partenaire
      setRecordingDuration(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.log('Erreur annulation:', error);
    }
  };

  const playAudio = async (messageId, uri) => {
    try {
      // Configurer le mode audio pour la lecture
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      
      // Arrêter l'audio en cours si différent
      if (soundRef.current && playingAudio !== messageId) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      
      // Si c'est le même, toggle pause/play
      if (playingAudio === messageId && soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isPlaying) {
          await soundRef.current.pauseAsync();
          setPlayingAudio(null);
        } else {
          await soundRef.current.playAsync();
          setPlayingAudio(messageId);
        }
        return;
      }
      
      // Charger et jouer le nouveau son
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, progressUpdateIntervalMillis: 100 },
        (status) => {
          if (status.isLoaded) {
            const duration = status.durationMillis || 1;
            setAudioProgress(prev => ({
              ...prev,
              [messageId]: status.positionMillis / duration
            }));
            
            if (status.didJustFinish) {
              setPlayingAudio(null);
              setAudioProgress(prev => ({ ...prev, [messageId]: 0 }));
            }
          }
        }
      );
      
      soundRef.current = sound;
      setPlayingAudio(messageId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
    } catch (error) {
      console.log('Erreur lecture audio:', error);
      Alert.alert('Erreur', 'Impossible de lire le message vocal. Vérifie ta connexion.');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLongPress = (message) => {
    setSelectedMessage(message);
    setShowReactions(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleReaction = async (emoji) => {
    if (selectedMessage) {
      await addReaction(selectedMessage.id, emoji);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowReactions(false);
    setSelectedMessage(null);
  };

  const handleDelete = (messageId) => {
    Alert.alert(
      'Supprimer',
      'Supprimer ce message ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteMessage(messageId)
        }
      ]
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hier";
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  const renderMessage = ({ item, index }) => {
    if (!item) return null;
    
    const isMe = item.senderId === user?.id;
    const showDate = index === 0 || 
      formatDate(item.timestamp) !== formatDate(messages[index - 1]?.timestamp);

    const reactions = item.reactions ? Object.values(item.reactions) : [];

    return (
      <>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.messageRow, isMe && styles.messageRowMe]}
          onLongPress={() => handleLongPress(item)}
          delayLongPress={500}
          activeOpacity={0.8}
        >
          <View style={[styles.messageBubble, isMe ? [styles.bubbleMe, { backgroundColor: theme.secondary }] : styles.bubbleOther]}>
            {/* Message cité (reply) */}
            {item.replyTo && (
              <View style={[styles.replyPreview, isMe ? styles.replyPreviewMe : styles.replyPreviewOther]}>
                <Text style={[styles.replyPreviewName, isMe && { color: 'rgba(255,255,255,0.9)' }]} numberOfLines={1}>
                  {item.replyTo.senderName || 'Message'}
                </Text>
                <Text style={[styles.replyPreviewText, isMe && { color: 'rgba(255,255,255,0.7)' }]} numberOfLines={2}>
                  {item.replyTo.type === 'image' ? '📸 Photo' : item.replyTo.type === 'voice' ? '🎤 Vocal' : item.replyTo.content}
                </Text>
              </View>
            )}
            {item.type === 'image' ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setSelectedImage(item.content)}
              >
                <ChatImage uri={item.content} />
              </TouchableOpacity>
            ) : item.type === 'voice' ? (
              <TouchableOpacity 
                style={styles.voiceMessage}
                onPress={() => playAudio(item.id, item.content)}
                activeOpacity={0.7}
              >
                <View style={[styles.playButton, isMe ? styles.playButtonMe : styles.playButtonOther]}>
                  <Ionicons 
                    name={playingAudio === item.id ? 'pause' : 'play'} 
                    size={20} 
                    color={isMe ? '#fff' : theme.accent} 
                  />
                </View>
                <View style={styles.voiceWaveContainer}>
                  <View style={styles.voiceWave}>
                    {[...Array(15)].map((_, i) => (
                      <View 
                        key={i} 
                        style={[
                          styles.voiceBar,
                          { 
                            height: 6 + Math.sin(i * 0.8 + (item.id?.charCodeAt(0) || 0) * 0.3) * 8 + Math.sin(i * 1.5) * 4,
                            backgroundColor: isMe ? 'rgba(255,255,255,0.7)' : theme.accent + '80',
                            opacity: audioProgress[item.id] > (i / 15) ? 1 : 0.4
                          }
                        ]} 
                      />
                    ))}
                  </View>
                  <Text style={[styles.voiceDuration, isMe && styles.voiceDurationMe]}>
                    {formatDuration(item.metadata?.duration || 0)}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
                {item.content}
              </Text>
            )}
            
            <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
              {formatTime(item.timestamp)}
              {isMe && item.read && ' ✓✓'}
            </Text>

            {reactions.length > 0 && (
              <View style={styles.reactionsContainer}>
                {reactions.map((emoji, i) => (
                  <Text key={i} style={styles.reactionEmoji}>{emoji}</Text>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <LinearGradient colors={theme.primary} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{partner?.name || 'Mon amour'}</Text>
          {(() => {
            const status = getPartnerStatus();
            return status ? (
              <Text style={[styles.typingText, { color: status.color, fontStyle: status.italic ? 'italic' : 'normal' }]}>
                {status.text}
              </Text>
            ) : null;
          })()}
        </View>
        {/* Boutons appel vocal et vidéo */}
        <TouchableOpacity style={styles.callButton} onPress={() => handleCall('audio')}>
          <Ionicons name="call-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.callButton} onPress={() => handleCall('video')}>
          <Ionicons name="videocam-outline" size={22} color="#fff" />
        </TouchableOpacity>
        {/* 🔥 Flamme / Streak */}
        {(() => {
          const level = getStreakLevel(streak?.count || 0);
          const streakCount = streak?.count || 0;
          return (
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeEmoji}>{level.emoji}</Text>
              <Text style={[styles.streakBadgeCount, { color: level.color }]}>{streakCount}</Text>
            </View>
          );
        })()}
        <View style={styles.headerAvatar}>
          <Text style={styles.avatarText}>{partner?.avatar || '💕'}</Text>
        </View>
      </View>

      {/* Chat disabled banner */}
      {!chatAvailable && (
        <View style={styles.disabledBanner}>
          <Text style={styles.disabledBannerText}>💬 Le chat et l'envoi de messages ne sont pas disponibles pour le moment.</Text>
        </View>
      )}

      {/* Messages + Input wrapped in KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={{ flex: 1 }}
      >
      {/* Messages */}
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages || []}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item?.id || `msg-${index}`}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatEmoji}>💬</Text>
              <Text style={styles.emptyChatText}>Commencez à discuter !</Text>
              <Text style={styles.emptyChatHint}>
                Envoyez un message à {partner?.name || 'votre partenaire'}
              </Text>
            </View>
          }
        />
      </View>

      {/* Input */}
        {isRecording ? (
          // Interface d'enregistrement vocal
          <View style={styles.recordingContainer}>
            <TouchableOpacity style={styles.cancelRecordButton} onPress={cancelRecording}>
              <Ionicons name="trash-outline" size={24} color="#FF4444" />
            </TouchableOpacity>
            
            <View style={styles.recordingInfo}>
              <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.recordingTime}>{formatDuration(recordingDuration)}</Text>
              <Text style={styles.recordingHint}>Enregistrement...</Text>
            </View>
            
            <TouchableOpacity style={styles.stopRecordButton} onPress={stopRecording}>
              <LinearGradient colors={[theme.secondary, theme.accent]} style={styles.stopRecordGradient}>
                <Ionicons name="send" size={22} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          // Interface normale
          <View>
            {/* Bandeau de réponse */}
            {replyingTo && (
              <View style={styles.replyBanner}>
                <View style={styles.replyBannerLine} />
                <View style={styles.replyBannerContent}>
                  <Text style={styles.replyBannerName}>
                    ↩️ {replyingTo.senderName === user?.name ? 'Toi' : replyingTo.senderName}
                  </Text>
                  <Text style={styles.replyBannerText} numberOfLines={1}>
                    {replyingTo.type === 'image' ? '📸 Photo' : replyingTo.type === 'voice' ? '🎤 Vocal' : replyingTo.content}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.replyBannerClose}>
                  <Text style={{ fontSize: 18, color: '#999' }}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton} onPress={handleImagePick}>
              <Text style={styles.attachText}>📷</Text>
            </TouchableOpacity>
            
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={(text) => {
                setInputText(text);
                setTyping(text.length > 0);
              }}
              placeholder="Message..."
              placeholderTextColor="#999"
              multiline
              maxLength={1000}
            />
            
            {inputText.trim() ? (
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={handleSend}
              >
                <LinearGradient
                  colors={[theme.secondary, theme.accent]}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="send" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.micButton}
                onPress={startRecording}
              >
                <LinearGradient
                  colors={[theme.secondary, theme.accent]}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="mic" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Modal Image Plein Écran */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity
            style={styles.fullscreenClose}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={styles.fullscreenCloseText}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Écran d'appel avec WebRTC */}
      <Modal
        visible={showCallScreen}
        animationType="slide"
        onRequestClose={handleEndCall}
      >
        <LinearGradient
          colors={
            (activeCall?.type || incomingCall?.type) === 'video'
              ? ['#1a0a2e', '#2d1b69', '#441188']
              : ['#1a1a2e', '#16213e', '#0f3460']
          }
          style={styles.callScreenContainer}
        >
          <StatusBar backgroundColor="#1a1a2e" barStyle="light-content" />

          {/* Vidéo distante en plein écran (si appel vidéo + stream reçu) */}
          {(activeCall?.type === 'video') && remoteStream && (
            <RTCView
              streamURL={remoteStream.toURL()}
              style={styles.remoteVideo}
              objectFit="cover"
              mirror={false}
            />
          )}

          {/* Vidéo locale en miniature (si appel vidéo + stream local) */}
          {(activeCall?.type === 'video') && localStream && !isCameraOff && (
            <View style={styles.localVideoContainer}>
              <RTCView
                streamURL={localStream.toURL()}
                style={styles.localVideo}
                objectFit="cover"
                mirror={true}
                zOrder={1}
              />
            </View>
          )}
          
          {/* Info partenaire (visible si audio OU vidéo sans stream distant) */}
          {((activeCall?.type !== 'video') || !remoteStream) && (
            <View style={styles.callPartnerInfo}>
              <View style={[
                styles.callTypeIcon,
                (activeCall?.type || incomingCall?.type) === 'video' && styles.callTypeIconVideo
              ]}>
                <Ionicons 
                  name={(activeCall?.type || incomingCall?.type) === 'video' ? 'videocam' : 'call'} 
                  size={24} 
                  color="#fff" 
                />
              </View>
              
              <View style={[
                styles.callAvatar,
                (activeCall?.type || incomingCall?.type) === 'video' && styles.callAvatarVideo
              ]}>
                <Text style={styles.callAvatarText}>{partner?.avatar || '💕'}</Text>
              </View>
              <Text style={styles.callPartnerName}>{partner?.name || 'Mon amour'}</Text>
              <Text style={styles.callStatus}>
                {activeCall?.status === 'accepted'
                  ? (webrtcState === 'connected' ? formatCallTimer(callTimer) : '🔄 Connexion...')
                  : activeCall?.status === 'ringing'
                    ? '📞 Appel en cours...'
                    : '⏳ Connexion...'}
              </Text>
              <Text style={styles.callType}>
                {(activeCall?.type || incomingCall?.type) === 'video' ? '🎥 Appel vidéo' : '📞 Appel vocal'}
              </Text>
            </View>
          )}

          {/* Timer overlay pour appel vidéo avec stream */}
          {(activeCall?.type === 'video') && remoteStream && (
            <View style={styles.videoCallInfoOverlay}>
              <Text style={styles.videoCallName}>{partner?.name || 'Mon amour'}</Text>
              <Text style={styles.videoCallTimer}>
                {webrtcState === 'connected' ? formatCallTimer(callTimer) : '🔄 Connexion...'}
              </Text>
            </View>
          )}

          {/* Animation ondulation (seulement pour audio ou en attente) */}
          {((activeCall?.type !== 'video') || !remoteStream) && (
            <View style={styles.callWaveContainer}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[
                  styles.callWave,
                  { 
                    width: 120 + i * 40, 
                    height: 120 + i * 40, 
                    borderRadius: 60 + i * 20, 
                    opacity: 0.15 / i,
                    borderColor: (activeCall?.type || incomingCall?.type) === 'video' 
                      ? 'rgba(168,85,247,0.4)' 
                      : 'rgba(255,255,255,0.3)',
                  }
                ]} />
              ))}
            </View>
          )}

          {/* Boutons de contrôle */}
          <View style={styles.callControls}>
            <TouchableOpacity
              style={[styles.callControlButton, isMuted && styles.callControlActive]}
              onPress={() => { 
                const muted = webrtcToggleMute();
                setIsMuted(muted); 
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
              }}
            >
              <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={26} color="#fff" />
              <Text style={styles.callControlLabel}>{isMuted ? 'Activer' : 'Muet'}</Text>
            </TouchableOpacity>

            {/* Bouton caméra (uniquement pour appel vidéo) */}
            {(activeCall?.type === 'video') && (
              <TouchableOpacity
                style={[styles.callControlButton, isCameraOff && styles.callControlActive]}
                onPress={() => { 
                  const camOff = webrtcToggleCamera();
                  setIsCameraOff(camOff); 
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
                }}
              >
                <Ionicons name={isCameraOff ? 'videocam-off' : 'videocam'} size={26} color="#fff" />
                <Text style={styles.callControlLabel}>{isCameraOff ? 'Caméra' : 'Off'}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.callEndButton}
              onPress={handleEndCall}
            >
              <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>

            {/* Bouton retourner caméra (uniquement pour appel vidéo) */}
            {(activeCall?.type === 'video') && (
              <TouchableOpacity
                style={styles.callControlButton}
                onPress={() => { switchCamera(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Ionicons name="camera-reverse" size={26} color="#fff" />
                <Text style={styles.callControlLabel}>Retourner</Text>
              </TouchableOpacity>
            )}

            {(activeCall?.type !== 'video') && (
              <TouchableOpacity
                style={[styles.callControlButton, isSpeaker && styles.callControlActive]}
                onPress={() => { setIsSpeaker(!isSpeaker); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Ionicons name={isSpeaker ? 'volume-high' : 'volume-medium'} size={26} color="#fff" />
                <Text style={styles.callControlLabel}>{isSpeaker ? 'Écouteur' : 'HP'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </Modal>

      {/* Appel entrant */}
      {incomingCall && !showCallScreen && (
        <View style={styles.incomingCallOverlay}>
          <LinearGradient 
            colors={
              incomingCall.type === 'video' 
                ? ['rgba(45,27,105,0.97)', 'rgba(68,17,136,0.97)'] 
                : ['rgba(20,0,40,0.97)', 'rgba(0,0,20,0.97)']
            } 
            style={styles.incomingCallCard}
          >
            {/* Animation pulse pour appel entrant */}
            <View style={styles.incomingCallPulse}>
              <Text style={styles.incomingCallEmoji}>
                {incomingCall.type === 'video' ? '🎥' : '📞'}
              </Text>
            </View>
            <Text style={styles.incomingCallName}>{incomingCall.callerName}</Text>
            <Text style={styles.incomingCallType}>
              {incomingCall.type === 'video' ? 'Appel vidéo entrant' : 'Appel vocal entrant'}
            </Text>
            <Text style={styles.incomingCallRinging}>🔔 Sonnerie...</Text>
            <View style={styles.incomingCallButtons}>
              <TouchableOpacity style={styles.rejectCallButton} onPress={() => { stopRingtone(); rejectCall(); }}>
                <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                <Text style={styles.callBtnLabel}>Refuser</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptCallButton} onPress={handleAcceptCall}>
                <Ionicons name="call" size={28} color="#fff" />
                <Text style={styles.callBtnLabel}>Répondre</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Reactions Modal */}
      {showReactions && (
        <TouchableOpacity
          style={styles.reactionsOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowReactions(false);
            setSelectedMessage(null);
          }}
        >
          <View style={styles.reactionsModal}>
            {REACTION_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionButton}
                onPress={() => handleReaction(emoji)}
              >
                <Text style={styles.reactionButtonText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
            
            {/* Bouton Répondre */}
            <TouchableOpacity
              style={styles.replyButton}
              onPress={() => {
                setReplyingTo(selectedMessage);
                setShowReactions(false);
                setSelectedMessage(null);
              }}
            >
              <Text style={styles.replyButtonText}>↩️</Text>
            </TouchableOpacity>
            
            {selectedMessage?.senderId === user?.id && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  handleDelete(selectedMessage.id);
                  setShowReactions(false);
                  setSelectedMessage(null);
                }}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  backButton: {
    padding: 10,
  },
  backText: {
    fontSize: 24,
    color: '#fff',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  typingText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 10,
  },
  streakBadgeEmoji: {
    fontSize: 16,
  },
  streakBadgeCount: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  disabledBanner: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  disabledBannerText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  messagesList: {
    padding: 15,
    paddingBottom: 20,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 10,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    padding: 12,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: '#FF6B9D',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageImage: {
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  messageImageLoading: {
    width: width * 0.6,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: width,
    height: height,
  },
  fullscreenClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
    textAlign: 'right',
  },
  messageTimeMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 2,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.2,
  },
  emptyChatEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  emptyChatHint: {
    fontSize: 14,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  attachButton: {
    padding: 10,
  },
  attachText: {
    fontSize: 24,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    marginLeft: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  reactionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionsModal: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 10,
    gap: 5,
  },
  reactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  reactionButtonText: {
    fontSize: 22,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    fontSize: 20,
  },
  // Styles pour le reply-to-message
  replyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
  },
  replyButtonText: {
    fontSize: 22,
  },
  replyPreview: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 4,
    marginBottom: 6,
    borderRadius: 4,
  },
  replyPreviewMe: {
    borderLeftColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  replyPreviewOther: {
    borderLeftColor: '#FF6B9D',
    backgroundColor: 'rgba(255,107,157,0.08)',
  },
  replyPreviewName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B9D',
    marginBottom: 2,
  },
  replyPreviewText: {
    fontSize: 13,
    color: '#666',
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  replyBannerLine: {
    width: 3,
    height: '100%',
    backgroundColor: '#FF6B9D',
    borderRadius: 2,
    marginRight: 10,
    minHeight: 30,
  },
  replyBannerContent: {
    flex: 1,
  },
  replyBannerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF6B9D',
  },
  replyBannerText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  replyBannerClose: {
    padding: 8,
  },
  // Styles pour messages vocaux
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 180,
    paddingVertical: 5,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  playButtonMe: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  playButtonOther: {
    backgroundColor: 'rgba(255,107,157,0.2)',
  },
  voiceWaveContainer: {
    flex: 1,
  },
  voiceWave: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    gap: 2,
  },
  voiceBar: {
    width: 3,
    borderRadius: 2,
  },
  voiceDuration: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  voiceDurationMe: {
    color: 'rgba(255,255,255,0.8)',
  },
  // Styles pour l'interface d'enregistrement
  micButton: {
    marginLeft: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    paddingBottom: Platform.OS === 'ios' ? 35 : 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelRecordButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4444',
  },
  recordingTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontVariant: ['tabular-nums'],
  },
  recordingHint: {
    fontSize: 12,
    color: '#999',
  },
  stopRecordButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  stopRecordGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Boutons d'appel dans le header
  callButton: {
    padding: 7,
    marginHorizontal: 1,
  },
  // Écran d'appel
  callScreenContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 60,
  },
  // Vidéo distante plein écran
  remoteVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  // Vidéo locale miniature
  localVideoContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 120,
    height: 170,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    zIndex: 10,
    elevation: 10,
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  // Overlay info pour appel vidéo
  videoCallInfoOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 5,
  },
  videoCallName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  videoCallTimer: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  callTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59,130,246,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.5)',
  },
  callTypeIconVideo: {
    backgroundColor: 'rgba(168,85,247,0.3)',
    borderColor: 'rgba(168,85,247,0.5)',
  },
  callPartnerInfo: {
    alignItems: 'center',
    zIndex: 2,
  },
  callAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(59,130,246,0.4)',
  },
  callAvatarVideo: {
    borderColor: 'rgba(168,85,247,0.5)',
    backgroundColor: 'rgba(168,85,247,0.15)',
  },
  callAvatarText: {
    fontSize: 50,
  },
  callPartnerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  callStatus: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  callType: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  callWaveContainer: {
    position: 'absolute',
    top: '30%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  callWave: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  callControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
    zIndex: 2,
  },
  callControlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callControlActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  callControlLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginTop: 4,
  },
  callEndButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  realCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 10,
  },
  realCallButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  // Modal appel entrant
  incomingCallOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    zIndex: 1000,
  },
  incomingCallCard: {
    width: width * 0.82,
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  incomingCallPulse: {
    marginBottom: 8,
  },
  incomingCallEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  incomingCallRinging: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 20,
  },
  callBtnLabel: {
    color: '#fff',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },
  incomingCallName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  incomingCallType: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 8,
  },
  incomingCallButtons: {
    flexDirection: 'row',
    gap: 50,
  },
  rejectCallButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptCallButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
