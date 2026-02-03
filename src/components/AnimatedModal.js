import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

/**
 * AnimatedModal - Modal avec animations fluides et fiables
 */
export default function AnimatedModal({
  visible,
  onClose,
  title,
  emoji,
  children,
  type = 'spring',
  size = 'medium',
  showCloseButton = true,
  closeButtonText = 'Fermer',
  gradientColors = ['#FF6B9D', '#C44569'],
}) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(40)).current;
  const bounceAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (visible) {
      // Reset des valeurs initiales
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      translateYAnim.setValue(40);
      bounceAnim.setValue(0.6);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Animation d'entrée simple et fiable
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();

      // Animation bounce de l'emoji
      Animated.sequence([
        Animated.delay(150),
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const getModalWidth = () => {
    switch (size) {
      case 'small': return width * 0.85;
      case 'medium': return width * 0.9;
      case 'large': return width * 0.92;
      case 'fullscreen': return width * 0.95;
      default: return width * 0.9;
    }
  };

  const modalWidth = getModalWidth();

  const emojiScale = bounceAnim.interpolate({
    inputRange: [0.6, 0.8, 1],
    outputRange: [0.7, 1.2, 1],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlayBackground} />
        </TouchableWithoutFeedback>
        
        <Animated.View
          style={[
            styles.modalContainer,
            { width: modalWidth },
            {
              opacity: opacityAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: translateYAnim },
              ],
            },
          ]}
        >
          {/* Header avec gradient */}
          <LinearGradient
            colors={gradientColors}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {emoji && (
              <Animated.Text
                style={[
                  styles.emoji,
                  { transform: [{ scale: emojiScale }] },
                ]}
              >
                {emoji}
              </Animated.Text>
            )}
            {title && <Text style={styles.title}>{title}</Text>}
          </LinearGradient>

          {/* Contenu */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>

          {/* Bouton fermer */}
          {showCloseButton && (
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <LinearGradient
                colors={gradientColors}
                style={styles.closeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.closeButtonText}>{closeButtonText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    maxHeight: height * 0.8,
  },
  header: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scrollView: {
    maxHeight: height * 0.4,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 15,
  },
  closeButton: {
    margin: 15,
    marginTop: 10,
    borderRadius: 15,
    overflow: 'hidden',
  },
  closeButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
