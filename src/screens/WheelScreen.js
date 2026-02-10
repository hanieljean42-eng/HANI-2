import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';
import { useNotifyPartner } from '../hooks/useNotifyPartner';
import AnimatedModal from '../components/AnimatedModal';

const { width } = Dimensions.get('window');

const WHEEL_ITEMS = [
  { id: 1, text: 'Restaurant 🍽️', color: '#FF6B9D', details: 'Choisissez un restaurant que vous n\'avez jamais essayé!' },
  { id: 2, text: 'Cinéma 🎬', color: '#8B5CF6', details: 'Film au choix du perdant de pierre-feuille-ciseaux!' },
  { id: 3, text: 'Pique-nique 🧺', color: '#10B981', details: 'Préparez chacun une surprise pour l\'autre!' },
  { id: 4, text: 'Massage 💆', color: '#F59E0B', details: '30 minutes de massage mutuel, musique relaxante!' },
  { id: 5, text: 'Cuisine 👨‍🍳', color: '#EF4444', details: 'Cuisinez ensemble un plat d\'un pays au hasard!' },
  { id: 6, text: 'Balade 🚶', color: '#3B82F6', details: 'Promenade romantique, téléphones interdits!' },
  { id: 7, text: 'Jeux 🎮', color: '#EC4899', details: 'Soirée jeux de société ou jeux vidéo ensemble!' },
  { id: 8, text: 'Spa maison 🛁', color: '#14B8A6', details: 'Bain moussant, bougies, et détente!' },
  { id: 9, text: 'Karaoké 🎤', color: '#F97316', details: 'Chantez vos chansons préférées ensemble!' },
  { id: 10, text: 'Photos 📸', color: '#6366F1', details: 'Séance photo couple dans un bel endroit!' },
  { id: 11, text: 'Danse 💃', color: '#A855F7', details: 'Apprenez une nouvelle danse ensemble!' },
  { id: 12, text: 'Surprise 🎁', color: '#F43F5E', details: 'Chacun prépare une surprise pour l\'autre!' },
  { id: 13, text: 'Mougou 🥰', color: '#E11D48', details: 'Moment câlin et tendresse, juste vous deux 💕' },
  { id: 14, text: 'Tuaibailait 💋', color: '#BE185D', details: 'Moment intime et passionné ensemble 🔥' },
  { id: 15, text: 'Sucer Junior 🍆', color: '#9333EA', details: 'Moment coquin et gourmand pour lui 😈🔥' },
  { id: 16, text: 'Laper Brigitte 👅', color: '#DB2777', details: 'Moment coquin et gourmand pour elle 😈💦' },
  { id: 17, text: 'Jouer avec Brigitte 🎀', color: '#EC4899', details: 'Moment de plaisir et de jeux intimes avec elle 💕🔥' },
];

export default function WheelScreen() {
  const { theme } = useTheme();
  const { notifyWheelSpin } = useNotifyPartner();
  const [spinning, setSpinning] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);

  const spinWheel = () => {
    if (spinning) return;

    setSpinning(true);
    setSelectedItem(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Random spins between 5-10 full rotations + random final position
    const randomIndex = Math.floor(Math.random() * WHEEL_ITEMS.length);
    const itemAngle = 360 / WHEEL_ITEMS.length;
    const targetAngle = (360 * (5 + Math.random() * 5)) + (randomIndex * itemAngle);
    
    currentRotation.current += targetAngle;

    Animated.timing(spinValue, {
      toValue: currentRotation.current,
      duration: 4000,
      useNativeDriver: true,
    }).start(async () => {
      setSpinning(false);
      setSelectedItem(WHEEL_ITEMS[randomIndex]);
      setShowModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // ✅ Notifier le partenaire du résultat (une seule notification)
      await notifyWheelSpin(WHEEL_ITEMS[randomIndex].text);
    });
  };

  const rotation = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={['#8B5CF6', '#C44569', '#FF6B9D']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>🎰 Roue des Dates</Text>
        <Text style={styles.subtitle}>Tournez pour décider de votre prochaine activité !</Text>

        {/* Wheel Container */}
        <View style={styles.wheelContainer}>
          {/* Pointer */}
          <View style={styles.pointer}>
            <Text style={styles.pointerArrow}>▼</Text>
          </View>

          {/* Wheel */}
          <Animated.View
            style={[
              styles.wheel,
              { transform: [{ rotate: rotation }] },
            ]}
          >
            {WHEEL_ITEMS.map((item, index) => {
              const angle = (index * 360) / WHEEL_ITEMS.length;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.wheelSection,
                    {
                      transform: [
                        { rotate: `${angle}deg` },
                        { translateY: -100 },
                      ],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.wheelSectionInner,
                      { backgroundColor: item.color },
                    ]}
                  >
                    <Text style={styles.wheelText}>{item.text}</Text>
                  </View>
                </View>
              );
            })}
            <View style={styles.wheelCenter}>
              <Text style={styles.wheelCenterText}>💕</Text>
            </View>
          </Animated.View>
        </View>

        {/* Spin Button */}
        <TouchableOpacity
          style={[styles.spinButton, spinning && styles.spinButtonDisabled]}
          onPress={spinWheel}
          disabled={spinning}
        >
          <Text style={styles.spinButtonText}>
            {spinning ? 'Ça tourne... 🎲' : 'TOURNER LA ROUE !'}
          </Text>
        </TouchableOpacity>

        {/* Recent Results */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Dernières activités</Text>
          <View style={styles.historyItems}>
            {WHEEL_ITEMS.slice(0, 3).map((item) => (
              <View key={`history-${item.id}`} style={styles.historyItem}>
                <Text style={styles.historyEmoji}>{item.text.slice(-2)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Result Modal - Animé */}
      <AnimatedModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title="C'est décidé !"
        emoji="🎉"
        type="spring"
        size="medium"
        closeButtonText="Super ! 💖"
        gradientColors={selectedItem ? [selectedItem.color, '#C44569'] : ['#FF6B9D', '#C44569']}
      >
        {selectedItem && (
          <View style={styles.modalResultContent}>
            <View style={[styles.modalResult, { backgroundColor: selectedItem.color }]}>
              <Text style={styles.modalResultText}>{selectedItem.text}</Text>
            </View>
            <Text style={styles.modalDetails}>{selectedItem.details}</Text>
            <View style={styles.modalTip}>
              <Text style={styles.modalTipEmoji}>💡</Text>
              <Text style={styles.modalTipText}>
                Préparez-vous pour une activité mémorable ensemble !
              </Text>
            </View>
          </View>
        )}
      </AnimatedModal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
    textAlign: 'center',
  },
  wheelContainer: {
    width: width * 0.8,
    height: width * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  pointer: {
    position: 'absolute',
    top: -10,
    zIndex: 10,
  },
  pointerArrow: {
    fontSize: 40,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  wheel: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: (width * 0.75) / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  wheelSection: {
    position: 'absolute',
    width: 80,
    height: 100,
    alignItems: 'center',
  },
  wheelSectionInner: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  wheelText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  wheelCenter: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  wheelCenterText: {
    fontSize: 30,
  },
  spinButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    marginBottom: 30,
  },
  spinButtonDisabled: {
    opacity: 0.7,
  },
  spinButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C44569',
  },
  historySection: {
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  historyItems: {
    flexDirection: 'row',
    gap: 15,
  },
  historyItem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyEmoji: {
    fontSize: 24,
  },
  modalResultContent: {
    alignItems: 'center',
    width: '100%',
  },
  modalResult: {
    paddingVertical: 18,
    paddingHorizontal: 35,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalResultText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  modalDetails: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  modalTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 15,
    borderRadius: 15,
    marginTop: 10,
    gap: 10,
  },
  modalTipEmoji: {
    fontSize: 24,
  },
  modalTipText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
