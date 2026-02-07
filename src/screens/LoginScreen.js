import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { notifyLoginSuccess } = useNotifications();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotName, setForgotName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState([]);

  const handleLogin = async () => {
    if (!name || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    const result = await login(name.trim(), password);
    setLoading(false);

    if (result.success) {
      // ✅ Notification de bienvenue après connexion réussie
      await notifyLoginSuccess(name.trim());
    } else {
      // Afficher plus de détails pour aider l'utilisateur
      Alert.alert(
        'Erreur de connexion', 
        result.error + '\n\nVérifiez que:\n• Le prénom est exactement comme à l\'inscription\n• Le mot de passe est correct',
        [
          { text: 'Réessayer', style: 'cancel' },
          { text: 'Mot de passe oublié', onPress: () => handleForgotPassword() }
        ]
      );
    }
  };

  const handleForgotPassword = async () => {
    // Charger les utilisateurs enregistrés
    try {
      const stored = await AsyncStorage.getItem('@registeredUsers');
      if (stored) {
        setRegisteredUsers(JSON.parse(stored));
      }
    } catch (e) {
      console.log('Erreur chargement users:', e);
    }
    setShowForgotModal(true);
  };

  const handleResetPassword = async () => {
    if (!forgotName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre prénom');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit avoir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    try {
      const stored = await AsyncStorage.getItem('@registeredUsers');
      if (stored) {
        let users = JSON.parse(stored);
        const userIndex = users.findIndex(u => 
          u.name.toLowerCase().trim() === forgotName.toLowerCase().trim()
        );
        
        if (userIndex >= 0) {
          // Mettre à jour le mot de passe
          users[userIndex].password = newPassword;
          await AsyncStorage.setItem('@registeredUsers', JSON.stringify(users));
          
          Alert.alert(
            '✅ Succès', 
            'Votre mot de passe a été réinitialisé !\n\nVous pouvez maintenant vous connecter.',
            [{ text: 'OK', onPress: () => {
              setShowForgotModal(false);
              setName(forgotName);
              setPassword('');
              setForgotName('');
              setNewPassword('');
              setConfirmNewPassword('');
            }}]
          );
        } else {
          Alert.alert('Erreur', 'Aucun compte trouvé avec ce prénom.\n\nComptes existants: ' + users.map(u => u.name).join(', '));
        }
      } else {
        Alert.alert('Erreur', 'Aucun compte enregistré sur cet appareil.');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de réinitialiser le mot de passe: ' + error.message);
    }
  };

  return (
    <LinearGradient
      colors={['#8B5CF6', '#C44569', '#FF6B9D']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>

          {/* Logo HANI 2 */}
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>H</Text>
            <Text style={styles.logoHeart}>💕</Text>
            <Text style={styles.logoText}>2</Text>
          </View>
          <Text style={styles.title}>Bon retour !</Text>
          <Text style={styles.subtitle}>Connectez-vous pour retrouver votre espace couple</Text>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>�</Text>
              <TextInput
                style={styles.input}
                placeholder="Ton prénom"
                placeholderTextColor="rgba(255,255,255,0.6)"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="rgba(255,255,255,0.6)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity style={styles.forgotButton} onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          </View>

          {/* Modal Mot de passe oublié */}
          <Modal
            visible={showForgotModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowForgotModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>🔐 Réinitialiser le mot de passe</Text>
                
                {registeredUsers.length > 0 && (
                  <View style={styles.usersHint}>
                    <Text style={styles.usersHintText}>Comptes sur cet appareil:</Text>
                    {registeredUsers.map((u, i) => (
                      <TouchableOpacity 
                        key={i} 
                        style={styles.userChip}
                        onPress={() => setForgotName(u.name)}
                      >
                        <Text style={styles.userChipText}>{u.avatar || '👤'} {u.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                <TextInput
                  style={styles.modalInput}
                  placeholder="Votre prénom"
                  placeholderTextColor="#999"
                  value={forgotName}
                  onChangeText={setForgotName}
                  autoCapitalize="words"
                />
                
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nouveau mot de passe"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                
                <TextInput
                  style={styles.modalInput}
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                />
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalCancelBtn}
                    onPress={() => {
                      setShowForgotModal(false);
                      setForgotName('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                    }}
                  >
                    <Text style={styles.modalCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.modalConfirmBtn}
                    onPress={handleResetPassword}
                  >
                    <Text style={styles.modalConfirmText}>Réinitialiser</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Connexion...' : 'Se connecter 💖'}
            </Text>
          </TouchableOpacity>

          {/* Register Link */}
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>
              Pas encore de compte ? <Text style={styles.registerLinkBold}>S'inscrire</Text>
            </Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    padding: 30,
    paddingTop: 60,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 30,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#C44569',
  },
  logoHeart: {
    fontSize: 24,
    marginHorizontal: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
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
  forgotButton: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
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
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#C44569',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerLink: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontSize: 15,
  },
  registerLinkBold: {
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#C44569',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '600',
  },
  usersHint: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
  },
  usersHintText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  userChip: {
    backgroundColor: '#e0e7ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  userChipText: {
    color: '#4338ca',
    fontSize: 14,
  },
});
