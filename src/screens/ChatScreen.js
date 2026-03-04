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

const { width, height } = Dimensions.get('window');

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

// Palette HANI — romantique & unique
const HANI = {
  headerGrad1: '#C44569',
  headerGrad2: '#FF6B9D',
  chatBg: '#FFF5F7',
  bubbleMe1: '#FF6B9D',
  bubbleMe2: '#C44569',
  bubbleOther: '#FFFFFF',
  textMe: '#FFFFFF',
  textOther: '#3D3D3D',
  textSecondary: '#A78B9B',
  heartRead: '#FF6B9D',
  heartUnread: '#CCAAB5',
  inputBg: '#FFFFFF',
  accent: '#FF6B9D',
  dateChipBg: '#FDE8EF',
  dateChipText: '#B55A7A',
  sendBtnGrad1: '#FF6B9D',
  sendBtnGrad2: '#C44569',
};

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
    if (!inputText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = inputText.trim();
    setInputText('');
    const result = await sendMessage(text, 'text');
    if (result?.success) {
      await notifyLoveNote(text.substring(0, 50));
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        await sendMessage(result.assets[0].uri, 'image');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Erreur', "Impossible d'envoyer l'image");
    }
  };

  // === MESSAGES VOCAUX ===
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission requise', "L'accès au microphone est nécessaire");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      Alert.alert('Erreur', "Impossible de démarrer l'enregistrement");
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
        await sendMessage(uri, 'voice', { duration: recordingDuration });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await notifyLoveNote('🎤 Message vocal');
      }
      setRecordingDuration(0);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
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
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
    } catch (error) {
      console.log('Erreur annulation:', error);
    }
  };

  const playAudio = async (messageId, uri) => {
    try {
      if (soundRef.current && playingAudio !== messageId) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
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
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setAudioProgress(prev => ({
              ...prev,
              [messageId]: status.positionMillis / status.durationMillis,
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
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Coeur lu / non-lu (au lieu des ticks WhatsApp)
  const renderReadStatus = (item) => {
    if (item.senderId !== user?.id) return null;
    const isRead = item.read;
    return (
      <Text style={{ fontSize: 10, marginLeft: 4, color: isRead ? HANI.heartRead : HANI.heartUnread }}>
        {isRead ? '❤️' : '🧡'}
      </Text>
    );
  };

  // Contenu d'une bulle (factorisé pour gradient/view)
  const renderBubbleContent = (item, isMe) => {
    const reactions = item.reactions ? Object.values(item.reactions) : [];
    const voiceColor = isMe ? '#fff' : HANI.accent;
    const waveActive = isMe ? 'rgba(255,255,255,0.9)' : HANI.accent;
    const waveInactive = isMe ? 'rgba(255,255,255,0.35)' : '#DCC5CF';

    return (
      <>
        {item.type === 'image' ? (
          <Image source={{ uri: item.content }} style={styles.messageImage} resizeMode="cover" />
        ) : item.type === 'voice' ? (
          <TouchableOpacity
            style={styles.voiceMessage}
            onPress={() => playAudio(item.id, item.content)}
            activeOpacity={0.7}
          >
            <View style={[styles.voiceAvatar, isMe ? styles.voiceAvatarMe : styles.voiceAvatarOther]}>
              <Text style={{ fontSize: 16 }}>{isMe ? (user?.avatar || '😊') : (partner?.avatar || '💕')}</Text>
            </View>
            <View style={styles.voiceContent}>
              <View style={styles.voicePlayRow}>
                <Ionicons
                  name={playingAudio === item.id ? 'pause' : 'play'}
                  size={24}
                  color={voiceColor}
                />
                <View style={styles.voiceWave}>
                  {[...Array(20)].map((_, i) => (
                    <View
                      key={i}
                      style={{
                        width: 3,
                        height: 4 + Math.sin(i * 0.7) * 10 + Math.random() * 4,
                        backgroundColor: audioProgress[item.id] > (i / 20) ? waveActive : waveInactive,
                        borderRadius: 2,
                        marginHorizontal: 1,
                      }}
                    />
                  ))}
                </View>
              </View>
              <Text style={[styles.voiceDuration, isMe && { color: 'rgba(255,255,255,0.7)' }]}>
                {formatDuration(item.metadata?.duration || 0)}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
            {item.content}
          </Text>
        )}

        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
            {formatTime(item.timestamp)}
          </Text>
          {renderReadStatus(item)}
        </View>

        {reactions.length > 0 && (
          <View style={styles.reactionsContainer}>
            {reactions.map((emoji, i) => (
              <Text key={i} style={styles.reactionEmoji}>{emoji}</Text>
            ))}
          </View>
        )}
      </>
    );
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
            <View style={styles.dateChip}>
              <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.messageRow, isMe && styles.messageRowMe]}
          onLongPress={() => handleLongPress(item)}
          delayLongPress={400}
          activeOpacity={0.9}
        >
          {isMe ? (
            <LinearGradient
              colors={[HANI.bubbleMe1, HANI.bubbleMe2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.messageBubble, styles.bubbleMe]}
            >
              {renderBubbleContent(item, true)}
            </LinearGradient>
          ) : (
            <View style={[styles.messageBubble, styles.bubbleOther]}>
              {renderBubbleContent(item, false)}
            </View>
          )}
        </TouchableOpacity>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* ===== HEADER HANI romantique ===== */}
      <LinearGradient colors={[HANI.headerGrad1, HANI.headerGrad2]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{partner?.avatar || '💕'}</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {partner?.name || 'Mon amour'}
          </Text>
          <Text style={styles.headerStatus}>
            {partnerTyping ? '💬 écrit...' : '💗 en ligne'}
          </Text>
        </View>

        <TouchableOpacity style={styles.headerAction} onPress={handleImagePick}>
          <Ionicons name="camera-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* ===== ZONE DES MESSAGES ===== */}
      <View style={styles.chatArea}>
        <FlatList
          ref={flatListRef}
          data={messages || []}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item?.id || `msg-${index}`}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatEmoji}>💌</Text>
              <Text style={styles.emptyChatTitle}>Votre espace privé</Text>
              <Text style={styles.emptyChatText}>
                Envoyez un premier message à {partner?.name || 'votre partenaire'} 💕
              </Text>
            </View>
          }
        />
      </View>

      {/* ===== BARRE D'INPUT HANI ===== */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {isRecording ? (
          <View style={styles.recordingBar}>
            <TouchableOpacity onPress={cancelRecording} style={styles.recordCancelBtn}>
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
            <View style={styles.recordingInfo}>
              <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.recordingTime}>{formatDuration(recordingDuration)}</Text>
            </View>
            <TouchableOpacity onPress={stopRecording}>
              <LinearGradient colors={[HANI.sendBtnGrad1, HANI.sendBtnGrad2]} style={styles.sendBtn}>
                <Ionicons name="send" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputBar}>
            <View style={styles.inputRow}>
              <TouchableOpacity onPress={handleImagePick} style={styles.inputIcon}>
                <Ionicons name="image-outline" size={23} color={HANI.textSecondary} />
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={(text) => {
                  setInputText(text);
                  setTyping(text.length > 0);
                }}
                placeholder="Écris un message..."
                placeholderTextColor="#BBA0AD"
                multiline
                maxLength={1000}
              />
              <TouchableOpacity onPress={handleImagePick} style={styles.inputIcon}>
                <Ionicons name="camera-outline" size={22} color={HANI.textSecondary} />
              </TouchableOpacity>
            </View>
            {inputText.trim() ? (
              <TouchableOpacity onPress={handleSend}>
                <LinearGradient colors={[HANI.sendBtnGrad1, HANI.sendBtnGrad2]} style={styles.sendBtn}>
                  <Ionicons name="send" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={startRecording}>
                <LinearGradient colors={[HANI.sendBtnGrad1, HANI.sendBtnGrad2]} style={styles.sendBtn}>
                  <Ionicons name="mic" size={22} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ===== MODAL RÉACTIONS ===== */}
      {showReactions && (
        <TouchableOpacity
          style={styles.reactionsOverlay}
          activeOpacity={1}
          onPress={() => { setShowReactions(false); setSelectedMessage(null); }}
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
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HANI.chatBg,
  },

  // ===== HEADER =====
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  backButton: {
    padding: 6,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  headerAvatarText: {
    fontSize: 22,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  headerAction: {
    padding: 8,
    marginLeft: 4,
  },

  // ===== ZONE MESSAGES =====
  chatArea: {
    flex: 1,
    backgroundColor: HANI.chatBg,
  },
  messagesList: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    paddingBottom: 6,
  },

  // Date separator
  dateContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateChip: {
    backgroundColor: HANI.dateChipBg,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  dateText: {
    fontSize: 12,
    color: HANI.dateChipText,
    fontWeight: '600',
  },

  // Bulles de messages
  messageRow: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingHorizontal: 4,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: width * 0.78,
    minWidth: 80,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 5,
    borderRadius: 18,
    elevation: 2,
    shadowColor: '#C44569',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginVertical: 1,
  },
  bubbleMe: {
    borderBottomRightRadius: 4,
    marginLeft: 50,
  },
  bubbleOther: {
    backgroundColor: HANI.bubbleOther,
    borderBottomLeftRadius: 4,
    marginRight: 50,
    borderWidth: 1,
    borderColor: '#F5DDE5',
  },
  messageText: {
    fontSize: 15.5,
    color: HANI.textOther,
    lineHeight: 21,
  },
  messageTextMe: {
    color: HANI.textMe,
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
    marginBottom: 1,
  },
  messageTime: {
    fontSize: 11,
    color: HANI.textSecondary,
  },
  messageTimeMe: {
    color: 'rgba(255,255,255,0.7)',
  },

  // Réactions
  reactionsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: -10,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  reactionEmoji: {
    fontSize: 14,
    marginHorizontal: 1,
  },

  // Chat vide
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.25,
    paddingHorizontal: 40,
  },
  emptyChatEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyChatTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: HANI.dateChipText,
    marginBottom: 6,
  },
  emptyChatText: {
    fontSize: 14,
    color: HANI.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ===== INPUT BAR =====
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 6,
    paddingBottom: Platform.OS === 'ios' ? 30 : 8,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F5DDE5',
    gap: 8,
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFF5F7',
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: Platform.OS === 'ios' ? 6 : 2,
    borderWidth: 1,
    borderColor: '#F5DDE5',
  },
  inputIcon: {
    padding: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: HANI.textOther,
    maxHeight: 100,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#C44569',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // ===== ENREGISTREMENT VOCAL =====
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F5DDE5',
  },
  recordCancelBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  recordingTime: {
    fontSize: 18,
    fontWeight: '600',
    color: HANI.textOther,
    fontVariant: ['tabular-nums'],
  },

  // ===== MESSAGE VOCAL =====
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 200,
    paddingVertical: 4,
  },
  voiceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceAvatarMe: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  voiceAvatarOther: {
    backgroundColor: '#FDE8EF',
  },
  voiceContent: {
    flex: 1,
  },
  voicePlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceWave: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    height: 28,
  },
  voiceDuration: {
    fontSize: 11,
    color: HANI.textSecondary,
    marginTop: 2,
  },

  // ===== MODAL RÉACTIONS =====
  reactionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionsModal: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 8,
    gap: 4,
    elevation: 8,
    shadowColor: '#C44569',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  reactionButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F7',
  },
  reactionButtonText: {
    fontSize: 22,
  },
  deleteButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
  },
});
