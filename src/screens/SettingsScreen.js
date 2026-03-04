import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, THEMES } from '../context/ThemeContext';
import { useSecurity } from '../context/SecurityContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const { width } = Dimensions.get('window');

export default function SettingsScreen({ navigation }) {
  const { theme, changeTheme, themes } = useTheme();
  const { 
    isSecretModeEnabled, 
    setupPin, 
    removePin, 
    useBiometrics, 
    biometricsAvailable,
    toggleBiometrics,
    isUnlocked,
    lockSecretMode,
  } = useSecurity();
  const { logout, user, couple } = useAuth();
  const { testNotification, testNotificationDelayed, notificationsEnabled, expoPushToken, partnerToken } = useNotifications();

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState(1);

  // Fonction pour tester les notifications
  const handleTestNotification = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await testNotification();
    if (result.success) {
      Alert.alert('✅ Notification envoyée !', 'Tu devrais la recevoir dans 1 seconde.');
    } else {
      Alert.alert('❌ Erreur', result.error || 'Impossible d\'envoyer la notification');
    }
  };

  const handleTestNotificationDelayed = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await testNotificationDelayed(5);
    if (result.success) {
      Alert.alert('✅ Notification programmée !', 'Tu la recevras dans 5 secondes. Tu peux fermer l\'app pour tester !');
    } else {
      Alert.alert('❌ Erreur', result.error || 'Impossible de programmer la notification');
    }
  };

  const handleThemeChange = (themeId) => {
    changeTheme(themeId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowThemeModal(false);
  };

  const handleSetupPin = async () => {
    if (pinStep === 1) {
      if (pinInput.length < 4) {
        Alert.alert('Erreur', 'Le code doit contenir au moins 4 chiffres');
        return;
      }
      setPinStep(2);
      return;
    }

    if (confirmPin !== pinInput) {
      Alert.alert('Erreur', 'Les codes ne correspondent pas');
      setPinInput('');
      setConfirmPin('');
      setPinStep(1);
      return;
    }

    const result = await setupPin(pinInput);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅', 'Code PIN configuré !');
      setShowPinModal(false);
      setPinInput('');
      setConfirmPin('');
      setPinStep(1);
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  const handleRemovePin = () => {
    Alert.alert(
      'Supprimer le code PIN',
      'Êtes-vous sûr ? L\'espace secret sera désactivé.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await removePin();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    );
  };

  return (
    <LinearGradient colors={theme.primary} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Paramètres</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Section Personnalisation */}
        <Text style={styles.sectionTitle}>🎨 Personnalisation</Text>
        
        <TouchableOpacity
          style={styles.settingCard}
          onPress={() => setShowThemeModal(true)}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingIcon}>🎨</Text>
            <View>
              <Text style={styles.settingLabel}>Thème de l'app</Text>
              <Text style={styles.settingValue}>{theme.name}</Text>
            </View>
          </View>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>

        {/* Section Sécurité */}
        <Text style={styles.sectionTitle}>🔒 Sécurité & Confidentialité</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingIcon}>🔐</Text>
            <View>
              <Text style={styles.settingLabel}>Espace secret</Text>
              <Text style={styles.settingValue}>
                {isSecretModeEnabled ? 'Activé' : 'Désactivé'}
              </Text>
            </View>
          </View>
          {isSecretModeEnabled ? (
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleRemovePin}
            >
              <Text style={styles.dangerButtonText}>Supprimer</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowPinModal(true)}
            >
              <Text style={styles.primaryButtonText}>Configurer</Text>
            </TouchableOpacity>
          )}
        </View>

        {isSecretModeEnabled && biometricsAvailable && (
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>👆</Text>
              <View>
                <Text style={styles.settingLabel}>Biométrie</Text>
                <Text style={styles.settingValue}>Face ID / Empreinte</Text>
              </View>
            </View>
            <Switch
              value={useBiometrics}
              onValueChange={toggleBiometrics}
              trackColor={{ false: '#767577', true: theme.accent }}
              thumbColor="#fff"
            />
          </View>
        )}

        {isSecretModeEnabled && isUnlocked && (
          <TouchableOpacity
            style={styles.settingCard}
            onPress={lockSecretMode}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🔒</Text>
              <View>
                <Text style={styles.settingLabel}>Verrouiller maintenant</Text>
                <Text style={styles.settingValue}>Fermer l'espace secret</Text>
              </View>
            </View>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Section Statistiques */}
        <Text style={styles.sectionTitle}>📊 Données</Text>

        <TouchableOpacity
          style={styles.settingCard}
          onPress={() => navigation.navigate('Stats')}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingIcon}>📈</Text>
            <View>
              <Text style={styles.settingLabel}>Statistiques</Text>
              <Text style={styles.settingValue}>Voir vos stats de couple</Text>
            </View>
          </View>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingCard}
          onPress={() => navigation.navigate('Retrospective')}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingIcon}>📅</Text>
            <View>
              <Text style={styles.settingLabel}>Rétrospective</Text>
              <Text style={styles.settingValue}>Revivez votre année</Text>
            </View>
          </View>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>

        {/* Section Notifications */}
        <Text style={styles.sectionTitle}>🔔 Notifications</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingIcon}>🔔</Text>
            <View>
              <Text style={styles.settingLabel}>Statut</Text>
              <Text style={[styles.settingValue, { color: notificationsEnabled ? '#4CAF50' : '#F44336' }]}>
                {notificationsEnabled ? '✅ Activées' : '❌ Désactivées'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.settingCard}
          onPress={handleTestNotification}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingIcon}>🧪</Text>
            <View>
              <Text style={styles.settingLabel}>Test immédiat</Text>
              <Text style={styles.settingValue}>Envoyer une notification maintenant</Text>
            </View>
          </View>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingCard}
          onPress={handleTestNotificationDelayed}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingIcon}>⏱️</Text>
            <View>
              <Text style={styles.settingLabel}>Test différé (5s)</Text>
              <Text style={styles.settingValue}>Ferme l'app pour vérifier</Text>
            </View>
          </View>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>

        {expoPushToken && (
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📱</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Mon token Push</Text>
                <Text style={[styles.settingValue, { fontSize: 10 }]} numberOfLines={1}>
                  {expoPushToken}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.settingCard}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingIcon}>{partnerToken ? '✅' : '❌'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Token partenaire</Text>
              <Text style={[styles.settingValue, { fontSize: 11, color: partnerToken ? '#4CAF50' : '#F44336' }]}>
                {partnerToken 
                  ? (partnerToken.startsWith('ExponentPushToken') ? '🟢 Connecté - Push actif' : '🟡 Token dev (pas de push réel)')
                  : '🔴 Non détecté - Le partenaire doit ouvrir l\'app'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section Compte */}
        <Text style={styles.sectionTitle}>👤 Compte</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingIcon}>👤</Text>
            <View>
              <Text style={styles.settingLabel}>{user?.name || 'Utilisateur'}</Text>
              <Text style={styles.settingValue}>{user?.email || ''}</Text>
            </View>
          </View>
        </View>

        {couple?.id && (
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>💑</Text>
              <View>
                <Text style={styles.settingLabel}>Code couple</Text>
                <Text style={styles.settingValue}>{couple.code}</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.settingCard, styles.logoutCard]}
          onPress={handleLogout}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingIcon}>🚪</Text>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Theme Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎨 Choisir un thème</Text>
            
            <ScrollView style={styles.themeList}>
              {Object.values(themes).map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.themeOption,
                    theme.id === t.id && styles.themeOptionActive
                  ]}
                  onPress={() => handleThemeChange(t.id)}
                >
                  <LinearGradient
                    colors={t.primary}
                    style={styles.themePreview}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <Text style={styles.themeName}>{t.name}</Text>
                  {theme.id === t.id && <Text style={styles.themeCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowThemeModal(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PIN Setup Modal */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowPinModal(false);
          setPinInput('');
          setConfirmPin('');
          setPinStep(1);
        }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔐 Code PIN</Text>
            <Text style={styles.modalSubtitle}>
              {pinStep === 1 
                ? 'Entrez votre nouveau code PIN' 
                : 'Confirmez votre code PIN'}
            </Text>
            
            <TextInput
              style={styles.pinInput}
              value={pinStep === 1 ? pinInput : confirmPin}
              onChangeText={pinStep === 1 ? setPinInput : setConfirmPin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              placeholder="••••"
              placeholderTextColor="#999"
            />

            <View style={styles.pinDots}>
              {[...Array(4)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.pinDot,
                    (pinStep === 1 ? pinInput : confirmPin).length > i && styles.pinDotFilled
                  ]}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowPinModal(false);
                  setPinInput('');
                  setConfirmPin('');
                  setPinStep(1);
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleSetupPin}
              >
                <LinearGradient
                  colors={theme.primary}
                  style={styles.confirmButtonGradient}
                >
                  <Text style={styles.confirmButtonText}>
                    {pinStep === 1 ? 'Suivant' : 'Confirmer'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 20,
    marginBottom: 10,
  },
  settingCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingValue: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  settingArrow: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.5)',
  },
  primaryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  dangerButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dangerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  logoutCard: {
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  themeList: {
    maxHeight: 400,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  themeOptionActive: {
    backgroundColor: '#e0e7ff',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  themePreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  themeName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  themeCheck: {
    fontSize: 20,
    color: '#667eea',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  pinInput: {
    fontSize: 32,
    textAlign: 'center',
    letterSpacing: 10,
    padding: 20,
    marginBottom: 20,
    color: '#333',
  },
  pinDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 15,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ddd',
  },
  pinDotFilled: {
    backgroundColor: '#667eea',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    padding: 15,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
