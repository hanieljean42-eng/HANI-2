import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

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
];

export default function WheelScreen() {
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
    }).start(() => {
      setSpinning(false);
      setSelectedItem(WHEEL_ITEMS[randomIndex]);
      setShowModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

      {/* Result Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={styles.modalTitle}>C'est décidé !</Text>
            
            {selectedItem && (
              <>
                <View style={[styles.modalResult, { backgroundColor: selectedItem.color }]}>
                  <Text style={styles.modalResultText}>{selectedItem.text}</Text>
                </View>
                <Text style={styles.modalDetails}>{selectedItem.details}</Text>
              </>
            )}

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalButtonText}>Super ! 💖</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    width: '100%',
  },
  modalEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  modalResult: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginBottom: 15,
  },
  modalResultText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#C44569',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
