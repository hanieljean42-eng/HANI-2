import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const SecurityContext = createContext({});

export const useSecurity = () => useContext(SecurityContext);

export function SecurityProvider({ children }) {
  const [pinCode, setPinCode] = useState(null);
  const [isSecretModeEnabled, setIsSecretModeEnabled] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [privateContent, setPrivateContent] = useState([]);
  const [useBiometrics, setUseBiometrics] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  useEffect(() => {
    loadSecuritySettings();
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricsAvailable(compatible && enrolled);
    } catch (error) {
      console.log('Erreur biométrie:', error);
    }
  };

  const loadSecuritySettings = async () => {
    try {
      const savedPin = await AsyncStorage.getItem('@pinCode');
      const savedBiometrics = await AsyncStorage.getItem('@useBiometrics');
      const savedPrivateContent = await AsyncStorage.getItem('@privateContent');
      
      if (savedPin) {
        setPinCode(savedPin);
        setIsSecretModeEnabled(true);
      }
      if (savedBiometrics === 'true') {
        setUseBiometrics(true);
      }
      if (savedPrivateContent) {
        setPrivateContent(JSON.parse(savedPrivateContent));
      }
    } catch (error) {
      console.log('Erreur chargement sécurité:', error);
    }
  };

  const setupPin = async (newPin) => {
    try {
      await AsyncStorage.setItem('@pinCode', newPin);
      setPinCode(newPin);
      setIsSecretModeEnabled(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const removePin = async () => {
    try {
      await AsyncStorage.removeItem('@pinCode');
      setPinCode(null);
      setIsSecretModeEnabled(false);
      setIsUnlocked(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const verifyPin = (inputPin) => {
    if (inputPin === pinCode) {
      setIsUnlocked(true);
      return true;
    }
    return false;
  };

  const lockSecretMode = () => {
    setIsUnlocked(false);
  };

  const toggleBiometrics = async (enabled) => {
    setUseBiometrics(enabled);
    await AsyncStorage.setItem('@useBiometrics', enabled ? 'true' : 'false');
  };

  const authenticateWithBiometrics = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Déverrouiller l\'espace secret',
        cancelLabel: 'Annuler',
        fallbackLabel: 'Utiliser le code PIN',
      });
      
      if (result.success) {
        setIsUnlocked(true);
        return { success: true };
      }
      return { success: false, error: 'Authentification échouée' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Ajouter du contenu privé
  const addPrivateContent = async (content) => {
    const newContent = {
      id: Date.now().toString(),
      ...content,
      addedAt: new Date().toISOString(),
    };
    
    const updated = [...privateContent, newContent];
    setPrivateContent(updated);
    await AsyncStorage.setItem('@privateContent', JSON.stringify(updated));
    return newContent;
  };

  // Supprimer du contenu privé
  const removePrivateContent = async (contentId) => {
    const updated = privateContent.filter(c => c.id !== contentId);
    setPrivateContent(updated);
    await AsyncStorage.setItem('@privateContent', JSON.stringify(updated));
  };

  // Déplacer un souvenir vers l'espace privé
  const moveToPrivate = async (memory) => {
    return await addPrivateContent({
      type: 'memory',
      data: memory,
    });
  };

  const value = {
    pinCode,
    isSecretModeEnabled,
    isUnlocked,
    privateContent,
    useBiometrics,
    biometricsAvailable,
    setupPin,
    removePin,
    verifyPin,
    lockSecretMode,
    toggleBiometrics,
    authenticateWithBiometrics,
    addPrivateContent,
    removePrivateContent,
    moveToPrivate,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}
