// Overlay global pour les appels entrants — visible sur TOUS les écrans
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
  Dimensions,
  Platform,
} from 'react-native';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { navigate } from '../navigation/navigationRef';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

const { width } = Dimensions.get('window');

export default function IncomingCallOverlay() {
  const { incomingCall, acceptCall, rejectCall, activeCall } = useChat();
  const { partner } = useAuth();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-300)).current;

  const ringIntervalRef = useRef(null);

  // ✅ Jouer une sonnerie via notification locale (son système) répétée
  const startRinging = async () => {
    // Première sonnerie immédiate
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📞 Appel entrant',
          body: 'Quelqu\'un vous appelle...',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 500, 200, 500],
        },
        trigger: null,
      });
    } catch (e) {
      console.log('⚠️ Erreur sonnerie:', e.message);
    }
    // Répéter toutes les 3 secondes
    ringIntervalRef.current = setInterval(async () => {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '📞 Appel entrant',
            body: 'Quelqu\'un vous appelle...',
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
            vibrate: [0, 500, 200, 500],
          },
          trigger: null,
        });
      } catch (e) { /* ignore */ }
    }, 3000);
  };

  const stopRinging = async () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    // Supprimer les notifications de sonnerie affichées
    await Notifications.dismissAllNotificationsAsync().catch(() => {});
  };

  // Animation d'entrée + pulsation + sonnerie
  useEffect(() => {
    if (incomingCall) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }).start();

      // Pulsation du bouton répondre
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();

      // ✅ Sonnerie audio + vibration
      startRinging();
      Vibration.vibrate([0, 800, 400, 800, 400, 800, 400, 800], true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Vibration.cancel();
      stopRinging();
      pulseAnim.setValue(1);
    }

    return () => {
      Vibration.cancel();
      stopRinging();
    };
  }, [incomingCall]);

  // Accepter l'appel et naviguer vers Chat
  const handleAccept = async () => {
    Vibration.cancel();
    await stopRinging();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await acceptCall();
    navigate('Chat', { fromCallOverlay: true });
  };

  // Rejeter l'appel
  const handleReject = async () => {
    Vibration.cancel();
    await stopRinging();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    await rejectCall();
  };

  // Ne rien afficher si pas d'appel entrant ou si l'appel est déjà actif
  if (!incomingCall || activeCall) return null;

  const callerName = incomingCall.callerName || partner?.name || 'Partenaire';
  const isVideo = incomingCall.type === 'video';

  return (
    <Animated.View style={[styles.overlay, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.container}>
        {/* Info appelant */}
        <View style={styles.callerInfo}>
          <Text style={styles.callIcon}>{isVideo ? '🎥' : '📞'}</Text>
          <View style={styles.callerTextContainer}>
            <Text style={styles.callLabel}>
              {isVideo ? 'Appel vidéo entrant' : 'Appel vocal entrant'}
            </Text>
            <Text style={styles.callerName}>{callerName}</Text>
          </View>
        </View>

        {/* Boutons */}
        <View style={styles.buttonsRow}>
          {/* Rejeter */}
          <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} activeOpacity={0.7}>
            <Text style={styles.btnEmoji}>📵</Text>
            <Text style={styles.rejectText}>Refuser</Text>
          </TouchableOpacity>

          {/* Accepter */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} activeOpacity={0.7}>
              <Text style={styles.btnEmoji}>{isVideo ? '🎥' : '📞'}</Text>
              <Text style={styles.acceptText}>Répondre</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 12,
  },
  container: {
    backgroundColor: 'rgba(20, 20, 40, 0.97)',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },
  callerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  callIcon: {
    fontSize: 40,
    marginRight: 14,
  },
  callerTextContainer: {
    flex: 1,
  },
  callLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  callerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    minWidth: 110,
  },
  acceptBtn: {
    backgroundColor: '#10B981',
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    minWidth: 110,
  },
  btnEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  rejectText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  acceptText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
