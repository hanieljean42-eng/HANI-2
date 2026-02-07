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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifyPartner } from '../hooks/useNotifyPartner';
import { useData } from '../context/DataContext';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';

const { width, height } = Dimensions.get('window');

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

export default function ChatScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, partner } = useAuth();
  const { 
    messages, 
    sendMessage, 
    markAsRead, 
    addReaction, 
    partnerTyping,
    setTyping,
    deleteMessage,
  } = useChat();

  // Chat is now available
  const chatAvailable = true;
  const { notifyLoveNote } = useNotifyPartner();
  const { addDiaryEntry } = useData();

  const [inputText, setInputText] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReactions, setShowReactions] = useState(false);
  
  // États pour les messages vocaux
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioProgress, setAudioProgress] = useState({});
  
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
    };
  }, []);

  // Marquer comme lu à l'ouverture
  useEffect(() => {
    markAsRead();
  }, [messages]);

  // Scroll en bas quand nouveaux messages
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!chatAvailable) {
      Alert.alert('💬 Chat indisponible', "L'envoi de messages n'est pas disponible pour le moment. Cette fonctionnalité arrivera dans une prochaine version.");
      return;
    }

    if (!inputText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const text = inputText.trim();
    setInputText('');
    
    const result = await sendMessage(text, 'text');
    
    if (result?.success) {
      // Notifier le partenaire
      await notifyLoveNote(text.substring(0, 50));
    }
  };

  const handleImagePick = async () => {
    if (!chatAvailable) {
      Alert.alert('💬 Chat indisponible', "L'envoi d'images n'est pas disponible pour le moment.");
      return;
    }

    try {
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
      
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      setIsRecording(false);
      recordingRef.current = null;
      
      if (uri && recordingDuration >= 1) {
        // Envoyer le message vocal
        await sendMessage(uri, 'voice', { duration: recordingDuration });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await notifyLoveNote('🎤 Message vocal');
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
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setAudioProgress(prev => ({
              ...prev,
              [messageId]: status.positionMillis / status.durationMillis
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
      Alert.alert('Erreur', 'Impossible de lire le message vocal');
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
          <View style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            {item.type === 'image' ? (
              <Image source={{ uri: item.content }} style={styles.messageImage} />
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
                            height: 6 + Math.sin(i * 0.8) * 8 + Math.random() * 4,
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
          {partnerTyping && (
            <Text style={styles.typingText}>écrit...</Text>
          )}
        </View>
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

      {/* Messages */}
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages || []}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item?.id || `msg-${index}`}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
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
              <LinearGradient colors={['#FF6B9D', '#C44569']} style={styles.stopRecordGradient}>
                <Ionicons name="send" size={22} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          // Interface normale
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
                  colors={['#FF6B9D', '#C44569']}
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
                  colors={['#FF6B9D', '#C44569']}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="mic" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

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
    width: 200,
    height: 200,
    borderRadius: 12,
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
});
