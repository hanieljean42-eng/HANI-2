import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  return (
    <LinearGradient
      colors={['#FF6B9D', '#C44569', '#8B5CF6']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        {/* Logo HANI 2 */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>H</Text>
            <Text style={styles.logoHeart}>💕</Text>
            <Text style={styles.logoText}>2</Text>
          </View>
          <View style={styles.hearts}>
            <Text style={styles.floatingHeart}>❤️</Text>
            <Text style={[styles.floatingHeart, styles.heart2]}>💜</Text>
            <Text style={[styles.floatingHeart, styles.heart3]}>💖</Text>
          </View>
        </View>

        {/* Titre */}
        <Text style={styles.title}>HANI 2</Text>
        <Text style={styles.subtitle}>Votre espace couple privé</Text>

        {/* Description */}
        <View style={styles.features}>
          <Text style={styles.featureText}>💑 Partagez des moments uniques</Text>
          <Text style={styles.featureText}>🎯 Relevez des défis ensemble</Text>
          <Text style={styles.featureText}>💌 Envoyez des messages d'amour</Text>
          <Text style={styles.featureText}>📸 Créez votre jar à souvenirs</Text>
        </View>

        {/* Boutons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.primaryButtonText}>Créer un compte</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>J'ai déjà un compte</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Créé avec ❤️ par Djeble Haniel Henoc</Text>
      </View>
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
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 20,
    alignItems: 'center',
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#C44569',
  },
  logoHeart: {
    fontSize: 36,
    marginHorizontal: 2,
  },
  hearts: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  floatingHeart: {
    position: 'absolute',
    fontSize: 30,
    top: -10,
    right: -20,
  },
  heart2: {
    top: 20,
    right: -40,
    fontSize: 20,
  },
  heart3: {
    top: -20,
    left: -30,
    fontSize: 25,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 40,
  },
  features: {
    marginBottom: 50,
  },
  featureText: {
    fontSize: 16,
    color: '#fff',
    marginVertical: 8,
    textAlign: 'center',
  },
  buttons: {
    width: '100%',
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#C44569',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
});
