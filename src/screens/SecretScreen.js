import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useSecurity } from '../context/SecurityContext';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';

export default function SecretScreen() {
  const { theme } = useTheme();
  const { privateContent, addPrivateContent, removePrivateContent, isSecretModeEnabled, setupPin, pinCode, isUnlocked, verifyPin, authenticateWithBiometrics, useBiometrics, biometricsAvailable } = useSecurity();
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);
  const [image, setImage] = useState(null);
  
  // États pour la configuration du PIN
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState(1);
  
  // État pour le déverrouillage
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockPin, setUnlockPin] = useState('');

  const handleAddNote = async () => {
    // Vérifier si le code PIN est configuré
    if (!isSecretModeEnabled) {
      Alert.alert(
        '🔐 Code secret requis',
        'Tu dois d\'abord définir un code secret pour protéger ton espace privé.',
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Configurer', onPress: () => setShowPinSetup(true) }
        ]
      );
      return;
    }
    
    if (note.trim().length === 0 && !image) return;
    
    let imageUrl = null;
    let publicId = null;
    
    if (image) {
      try {
        const file = {
          uri: image,
          type: 'image/jpeg',
          name: `secret_${Date.now()}.jpg`
        };
        
        const { url, publicId: pubId } = await uploadToCloudinary(file);
        imageUrl = url;
        publicId = pubId;
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de télécharger l\'image');
        return;
      }
    }
    
    await addPrivateContent({ 
      type: imageUrl ? 'image' : 'note', 
      data: imageUrl ? imageUrl : note,
      publicId: publicId
    });
    setNote('');
    setImage(null);
    setAdding(false);
  };

  const pickImage = async () => {
    if (!isSecretModeEnabled) {
      Alert.alert(
        '🔐 Code secret requis',
        'Tu dois d\'abord définir un code secret pour protéger ton espace privé.',
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Configurer', onPress: () => setShowPinSetup(true) }
        ]
      );
      return;
    }
    
    try {
      // Demander la permission galerie (nécessaire Android 13+)
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '📸 Permission requise',
          'L\'accès à la galerie photo est nécessaire pour ajouter des images.\n\nAllez dans Paramètres > Applications > HANI 2 > Permissions > Photos pour l\'activer.',
          [{ text: 'Compris' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({ 
        mediaTypes: ['images'], 
        quality: 0.7 
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    }
  };

  const handleStartAdding = () => {
    // Vérifier si le code PIN est configuré
    if (!isSecretModeEnabled) {
      Alert.alert(
        '🔐 Code secret requis',
        'Tu dois d\'abord définir un code secret pour protéger ton espace privé.',
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Configurer', onPress: () => setShowPinSetup(true) }
        ]
      );
      return;
    }
    setAdding(true);
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
      Alert.alert('✅', 'Code secret configuré ! Ton espace privé est maintenant protégé.');
      setShowPinSetup(false);
      setPinInput('');
      setConfirmPin('');
      setPinStep(1);
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  const handleUnlock = () => {
    if (verifyPin(unlockPin)) {
      setShowUnlock(false);
      setUnlockPin('');
    } else {
      Alert.alert('❌', 'Code incorrect');
      setUnlockPin('');
    }
  };

  const handleBiometricUnlock = async () => {
    const result = await authenticateWithBiometrics();
    if (result.success) {
      setShowUnlock(false);
    }
  };

  // Si le mode secret est activé mais pas déverrouillé, demander le code
  const needsUnlock = isSecretModeEnabled && !isUnlocked;

  return (
    <LinearGradient colors={theme.primary} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>🔐 Espace Secret</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>Ici, tu peux écrire des notes intimes ou stocker des photos privées, protégées par ton code secret.</Text>

        {/* Message si le code n'est pas configuré */}
        {!isSecretModeEnabled && (
          <View style={styles.setupCard}>
            <Text style={styles.setupIcon}>🔒</Text>
            <Text style={styles.setupTitle}>Protège ton espace</Text>
            <Text style={styles.setupDesc}>Configure un code secret pour sécuriser tes notes et photos privées.</Text>
            <TouchableOpacity 
              style={[styles.setupBtn, { backgroundColor: theme.accent }]} 
              onPress={() => setShowPinSetup(true)}
            >
              <Text style={styles.setupBtnText}>Configurer le code secret</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contenu verrouillé */}
        {needsUnlock && (
          <View style={styles.lockedCard}>
            <Text style={styles.lockedIcon}>🔒</Text>
            <Text style={styles.lockedTitle}>Espace verrouillé</Text>
            <Text style={styles.lockedDesc}>Entre ton code secret pour accéder à ton contenu privé.</Text>
            
            <TextInput
              style={styles.unlockInput}
              value={unlockPin}
              onChangeText={setUnlockPin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              placeholder="Code secret"
              placeholderTextColor="#999"
            />
            
            <TouchableOpacity 
              style={[styles.unlockBtn, { backgroundColor: theme.accent }]} 
              onPress={handleUnlock}
            >
              <Text style={styles.unlockBtnText}>Déverrouiller</Text>
            </TouchableOpacity>
            
            {biometricsAvailable && useBiometrics && (
              <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometricUnlock}>
                <Text style={styles.biometricText}>👆 Utiliser l'empreinte</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Contenu déverrouillé ou mode non configuré */}
        {(!isSecretModeEnabled || (isSecretModeEnabled && isUnlocked)) && (
          <>
            {adding ? (
              <View style={styles.addBox}>
                <TextInput
                  style={styles.input}
                  placeholder="Écris une note secrète..."
                  placeholderTextColor="#aaa"
                  value={note}
                  onChangeText={setNote}
                  multiline
                />
                {image && (
                  <Image source={{ uri: image }} style={styles.previewImg} />
                )}
                <View style={styles.addActions}>
                  <TouchableOpacity style={styles.addBtn} onPress={pickImage}>
                    <Text style={styles.addBtnText}>+ Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addBtn} onPress={handleAddNote}>
                    <Text style={styles.addBtnText}>Enregistrer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => { setAdding(false); setNote(''); setImage(null); }}>
                    <Text style={styles.cancelBtnText}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : isSecretModeEnabled ? (
              <TouchableOpacity style={styles.addMainBtn} onPress={handleStartAdding}>
                <Text style={styles.addMainBtnText}>+ Ajouter une note ou photo secrète</Text>
              </TouchableOpacity>
            ) : null}

            {isSecretModeEnabled && isUnlocked && (
              <View style={styles.list}>
                {(!privateContent || privateContent.length === 0) && (
                  <Text style={[styles.emptyText, { color: theme.text }]}>Aucun contenu secret pour l'instant.</Text>
                )}
                {(privateContent || []).slice().reverse().filter(item => item != null).map(item => (
                  <View key={item?.id || Math.random()} style={styles.item}>
                    {item.type === 'note' ? (
                      <Text style={styles.noteText}>{item.data}</Text>
                    ) : (
                      <Image source={{ uri: item.data }} style={styles.secretImg} />
                    )}
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => removePrivateContent(item.id)}>
                      <Text style={styles.deleteBtnText}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal Configuration PIN */}
      <Modal
        visible={showPinSetup}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowPinSetup(false);
          setPinInput('');
          setConfirmPin('');
          setPinStep(1);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔐 Créer ton code secret</Text>
            <Text style={styles.modalSubtitle}>
              {pinStep === 1 
                ? 'Choisis un code de 4 à 6 chiffres' 
                : 'Confirme ton code secret'}
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
              {[...Array(6)].map((_, i) => (
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
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowPinSetup(false);
                  setPinInput('');
                  setConfirmPin('');
                  setPinStep(1);
                }}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: theme.accent }]}
                onPress={handleSetupPin}
              >
                <Text style={styles.modalConfirmText}>
                  {pinStep === 1 ? 'Suivant' : 'Confirmer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  
  // Card de configuration
  setupCard: { 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    borderRadius: 20, 
    padding: 30, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  setupIcon: { fontSize: 60, marginBottom: 15 },
  setupTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  setupDesc: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  setupBtn: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
  setupBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  // Card verrouillée
  lockedCard: { 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    borderRadius: 20, 
    padding: 30, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  lockedIcon: { fontSize: 60, marginBottom: 15 },
  lockedTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  lockedDesc: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  unlockInput: { 
    backgroundColor: '#f0f0f0', 
    borderRadius: 15, 
    padding: 15, 
    fontSize: 24, 
    textAlign: 'center',
    width: 150,
    marginBottom: 15,
    color: '#333',
    letterSpacing: 10,
  },
  unlockBtn: { paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, marginBottom: 10 },
  unlockBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  biometricBtn: { padding: 10 },
  biometricText: { color: '#666', fontSize: 14 },
  
  // Bouton ajouter
  addMainBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 16, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  addMainBtnText: { color: '#fff', fontWeight: 'bold' },
  
  // Box d'ajout
  addBox: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 16, marginBottom: 20 },
  input: { backgroundColor: '#f0f0f0', borderRadius: 10, padding: 12, minHeight: 60, marginBottom: 10, color: '#333' },
  addActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  addBtn: { backgroundColor: '#8B5CF6', borderRadius: 10, padding: 10, marginRight: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  cancelBtn: { backgroundColor: '#eee', borderRadius: 10, padding: 10 },
  cancelBtnText: { color: '#666' },
  previewImg: { width: 120, height: 120, borderRadius: 10, marginBottom: 10, alignSelf: 'center' },
  
  // Liste
  list: { marginTop: 20 },
  item: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 14, marginBottom: 16 },
  noteText: { fontSize: 16, color: '#333' },
  secretImg: { width: '100%', height: 200, borderRadius: 10, marginBottom: 10 },
  deleteBtn: { alignSelf: 'flex-end', marginTop: 6 },
  deleteBtnText: { color: '#EF4444', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 15, opacity: 0.7 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 25, padding: 30, width: '100%', maxWidth: 350, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  modalSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  pinInput: { 
    backgroundColor: '#f0f0f0', 
    borderRadius: 15, 
    padding: 15, 
    fontSize: 24, 
    textAlign: 'center',
    width: 200,
    marginBottom: 15,
    color: '#333',
    letterSpacing: 10,
  },
  pinDots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 25 },
  pinDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ddd', marginHorizontal: 5 },
  pinDotFilled: { backgroundColor: '#8B5CF6' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalCancelBtn: { flex: 1, padding: 15, alignItems: 'center', marginRight: 10, backgroundColor: '#f0f0f0', borderRadius: 15 },
  modalCancelText: { color: '#666', fontWeight: 'bold' },
  modalConfirmBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 15 },
  modalConfirmText: { color: '#fff', fontWeight: 'bold' },
});
