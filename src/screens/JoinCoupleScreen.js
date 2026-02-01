import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

export default function JoinCoupleScreen() {
  const { user, joinCouple, createCouple, logout } = useAuth();
  const [mode, setMode] = useState('choice'); // 'choice', 'create', 'join'
  const [coupleCode, setCoupleCode] = useState('');
  const [formData, setFormData] = useState({
    coupleName: '',
    partnerName: '',
    anniversary: '',
    partnerAvatar: '💕',
  });
  const [generatedCode, setGeneratedCode] = useState('');

  const handleCreateCouple = async () => {
    if (!formData.coupleName || !formData.partnerName) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const result = await createCouple({
      name: formData.coupleName,
      anniversary: formData.anniversary,
    });

    if (result.success) {
      setGeneratedCode(result.code);
      Alert.alert(
        '✅ Espace créé !',
        `Votre code couple est:\n\n${result.code}\n\nPartagez ce code avec votre partenaire pour qu'il/elle puisse vous rejoindre.\n\n📱 Les données seront synchronisées automatiquement !`,
        [{ text: 'Super !', onPress: () => joinCouple(result.code, formData) }]
      );
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  const handleJoinCouple = async () => {
    if (!coupleCode || !formData.partnerName) {
      Alert.alert('Erreur', 'Veuillez entrer le code et le nom de votre partenaire');
      return;
    }

    const result = await joinCouple(coupleCode, formData);
    if (result.success) {
      if (result.synced) {
        Alert.alert(
          '🎉 Connectés !',
          'Vous êtes maintenant connecté(e) avec votre partenaire !\n\nToutes vos données seront synchronisées en temps réel. 💕'
        );
      }
    } else {
      Alert.alert('Erreur', result.error || 'Code invalide. Vérifiez que votre partenaire a bien créé l\'espace couple et que vous êtes connecté(e) à Internet.');
    }
  };

  if (mode === 'choice') {
    return (
      <LinearGradient
        colors={['#FF6B9D', '#C44569', '#8B5CF6']}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.welcomeEmoji}>👋</Text>
          <Text style={styles.welcomeTitle}>Bienvenue {user?.name} !</Text>
          <Text style={styles.welcomeSubtitle}>
            Maintenant, connectons-vous avec votre moitié 💕
          </Text>

          <View style={styles.choiceCards}>
            <TouchableOpacity
              style={styles.choiceCard}
              onPress={() => setMode('create')}
            >
              <Text style={styles.choiceIcon}>✨</Text>
              <Text style={styles.choiceTitle}>Créer un espace couple</Text>
              <Text style={styles.choiceDesc}>
                Créez votre espace et invitez votre partenaire avec un code
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.choiceCard}
              onPress={() => setMode('join')}
            >
              <Text style={styles.choiceIcon}>🔗</Text>
              <Text style={styles.choiceTitle}>Rejoindre un espace</Text>
              <Text style={styles.choiceDesc}>
                Vous avez reçu un code ? Rejoignez votre partenaire
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (mode === 'create') {
    return (
      <LinearGradient
        colors={['#FF6B9D', '#C44569', '#8B5CF6']}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setMode('choice')}
          >
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>

          <Text style={styles.createEmoji}>✨</Text>
          <Text style={styles.title}>Créer votre espace couple</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>💕</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom de votre couple (ex: Emma & Lucas)"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={formData.coupleName}
                onChangeText={(text) => setFormData({ ...formData, coupleName: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Prénom de votre partenaire"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={formData.partnerName}
                onChangeText={(text) => setFormData({ ...formData, partnerName: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>📅</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 14/02/2024"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={formData.anniversary}
                onChangeText={(text) => setFormData({ ...formData, anniversary: text })}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <Text style={styles.dateHint}>💡 Entrez la date au format JJ/MM/AAAA</Text>
          </View>

          {generatedCode ? (
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Code de votre couple :</Text>
              <Text style={styles.codeText}>{generatedCode}</Text>
              <Text style={styles.codeHint}>
                Partagez ce code avec votre partenaire pour qu'il/elle puisse vous rejoindre !
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCreateCouple}
          >
            <Text style={styles.submitButtonText}>Créer notre espace 💖</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  if (mode === 'join') {
    return (
      <LinearGradient
        colors={['#8B5CF6', '#C44569', '#FF6B9D']}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setMode('choice')}
          >
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>

          <Text style={styles.createEmoji}>🔗</Text>
          <Text style={styles.title}>Rejoindre votre partenaire</Text>
          <Text style={styles.subtitle}>
            Entrez le code que votre partenaire vous a partagé
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔑</Text>
              <TextInput
                style={styles.input}
                placeholder="Code couple (ex: LOVE-ABC123)"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={coupleCode}
                onChangeText={setCoupleCode}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Prénom de votre partenaire"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={formData.partnerName}
                onChangeText={(text) => setFormData({ ...formData, partnerName: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>📅</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 14/02/2024"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={formData.anniversary}
                onChangeText={(text) => setFormData({ ...formData, anniversary: text })}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <Text style={styles.dateHint}>💡 Entrez la date au format JJ/MM/AAAA</Text>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleJoinCouple}
          >
            <Text style={styles.submitButtonText}>Rejoindre 💕</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
  welcomeEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 40,
  },
  choiceCards: {
    width: '100%',
    gap: 20,
  },
  choiceCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  choiceIcon: {
    fontSize: 50,
    marginBottom: 15,
  },
  choiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  choiceDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  createEmoji: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 30,
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
  dateHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: -5,
    marginBottom: 15,
    marginLeft: 10,
    fontStyle: 'italic',
  },
  codeContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  codeLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 10,
  },
  codeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 10,
  },
  codeHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
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
  },
  submitButtonText: {
    color: '#C44569',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 40,
    padding: 15,
  },
  logoutText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
});
