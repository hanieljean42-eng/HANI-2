import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const AVATARS = ['😊', '😍', '🥰', '😎', '🤗', '💖', '👸', '🤴', '🦋', '🌸', '⭐', '🌙'];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { notifyWelcome } = useNotifications();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: '😊',
    birthday: '',
    gender: '',
  });
  const [showAvatars, setShowAvatars] = useState(false);

  const handleRegister = async () => {
    // Valider le nom
    if (!formData.name || !formData.name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre prénom');
      return;
    }
    
    if (formData.name.trim().length < 2) {
      Alert.alert('Erreur', 'Le prénom doit contenir au moins 2 caractères');
      return;
    }
    
    if (formData.name.length > 50) {
      Alert.alert('Erreur', 'Le prénom ne peut pas dépasser 50 caractères');
      return;
    }

    // Valider l'email (maintenant obligatoire - nécessaire pour Firebase Auth)
    if (!formData.email || !formData.email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre adresse email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }
    
    // Construire la date de naissance si fournie
    if (formData.birthDay && formData.birthMonth && formData.birthYear) {
      formData.birthday = `${formData.birthDay.padStart(2, '0')}/${formData.birthMonth.padStart(2, '0')}/${formData.birthYear}`;
    }

    // Valider le sexe
    if (!formData.gender) {
      Alert.alert('Erreur', 'Veuillez choisir votre sexe (Masculin ou Féminin)');
      return;
    }

    // Valider les mots de passe
    if (!formData.password || formData.password.length === 0) {
      Alert.alert('Erreur', 'Veuillez entrer un mot de passe');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length > 100) {
      Alert.alert('Erreur', 'Le mot de passe ne peut pas dépasser 100 caractères');
      return;
    }

    const result = await register(formData);
    if (result.success) {
      // Envoyer notification de bienvenue
      await notifyWelcome(formData.name);
      // Navigation automatique via AuthContext
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  return (
    <LinearGradient
      colors={['#FF6B9D', '#C44569', '#8B5CF6']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez HANI 2 💕</Text>

          {/* Avatar Selector */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => setShowAvatars(!showAvatars)}
          >
            <Text style={styles.avatar}>{formData.avatar}</Text>
            <Text style={styles.avatarHint}>Tap pour changer</Text>
          </TouchableOpacity>

          {showAvatars && (
            <View style={styles.avatarGrid}>
              {AVATARS.map((avatar, index) => (
                <TouchableOpacity
                  key={`avatar-${avatar}-${index}`}
                  style={[
                    styles.avatarOption,
                    formData.avatar === avatar && styles.avatarSelected,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, avatar });
                    setShowAvatars(false);
                  }}
                >
                  <Text style={styles.avatarOptionText}>{avatar}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Ton prénom"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.input}
                placeholder="Ton adresse email"
                placeholderTextColor="rgba(255,255,255,0.6)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
              />
            </View>

            <View style={styles.birthdaySection}>
              <Text style={styles.birthdayLabel}>🎂 Date de naissance</Text>
              <View style={styles.birthdayRow}>
                <TextInput
                  style={styles.birthdayInput}
                  placeholder="JJ"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={formData.birthDay || ''}
                  onChangeText={(text) => {
                    const num = text.replace(/[^0-9]/g, '').slice(0, 2);
                    setFormData({ ...formData, birthDay: num });
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.birthdaySeparator}>/</Text>
                <TextInput
                  style={styles.birthdayInput}
                  placeholder="MM"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={formData.birthMonth || ''}
                  onChangeText={(text) => {
                    const num = text.replace(/[^0-9]/g, '').slice(0, 2);
                    setFormData({ ...formData, birthMonth: num });
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.birthdaySeparator}>/</Text>
                <TextInput
                  style={[styles.birthdayInput, styles.birthdayYear]}
                  placeholder="AAAA"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={formData.birthYear || ''}
                  onChangeText={(text) => {
                    const num = text.replace(/[^0-9]/g, '').slice(0, 4);
                    setFormData({ ...formData, birthYear: num });
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>

            {/* Gender Selector */}
            <View style={styles.genderSection}>
              <Text style={styles.genderLabel}>👤 Sexe</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    formData.gender === 'masculin' && styles.genderSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, gender: 'masculin' })}
                >
                  <Text style={styles.genderEmoji}>👨</Text>
                  <Text style={[
                    styles.genderText,
                    formData.gender === 'masculin' && styles.genderTextSelected,
                  ]}>Masculin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    formData.gender === 'feminin' && styles.genderSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, gender: 'feminin' })}
                >
                  <Text style={styles.genderEmoji}>👩</Text>
                  <Text style={[
                    styles.genderText,
                    formData.gender === 'feminin' && styles.genderTextSelected,
                  ]}>Féminin</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="rgba(255,255,255,0.6)"
                secureTextEntry
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor="rgba(255,255,255,0.6)"
                secureTextEntry
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleRegister}>
            <Text style={styles.submitButtonText}>Créer mon compte 💖</Text>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>
              Déjà un compte ? <Text style={styles.loginLinkBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 30,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 30,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    fontSize: 80,
  },
  avatarHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 5,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 15,
  },
  avatarOption: {
    padding: 10,
    margin: 5,
    borderRadius: 15,
  },
  avatarSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  avatarOptionText: {
    fontSize: 35,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    color: '#fff',
    fontSize: 16,
  },
  inputHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 15,
    marginLeft: 10,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#C44569',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontSize: 15,
  },
  loginLinkBold: {
    fontWeight: 'bold',
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.75)',
    marginHorizontal: 12,
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 20,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  googleButtonText: {
    color: '#444',
    fontSize: 16,
    fontWeight: '600',
  },
  birthdaySection: {
    marginBottom: 15,
  },
  birthdayLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginBottom: 10,
    marginLeft: 5,
  },
  birthdayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  birthdayInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingVertical: 16,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    width: 70,
  },
  birthdaySeparator: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 20,
    marginHorizontal: 5,
  },
  birthdayYear: {
    width: 100,
  },
  genderSection: {
    marginBottom: 15,
  },
  genderLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginBottom: 10,
    marginLeft: 5,
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderColor: '#fff',
  },
  genderEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  genderText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  genderTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
