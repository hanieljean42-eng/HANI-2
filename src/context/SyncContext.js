import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { database, isConfigured } from '../config/firebase';
import { ref, set, onValue, update, get, serverTimestamp } from 'firebase/database';

const SyncContext = createContext({});

export const useSync = () => useContext(SyncContext);

export function SyncProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [coupleId, setCoupleId] = useState(null);
  const [syncedData, setSyncedData] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  // Surveiller la connexion
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });
    return () => unsubscribe();
  }, []);

  // Charger le coupleId au démarrage
  useEffect(() => {
    loadCoupleId();
  }, []);

  // Écouter les changements en temps réel quand on a un coupleId
  useEffect(() => {
    if (!coupleId || !isConfigured || !database) return;

    const coupleRef = ref(database, `couples/${coupleId}`);
    const unsubscribe = onValue(coupleRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setSyncedData(data);
        setLastSync(new Date().toISOString());
        // Sauvegarder localement pour le mode hors ligne
        AsyncStorage.setItem('@syncedCoupleData', JSON.stringify(data));
      }
    }, (error) => {
      console.error('Erreur écoute Firebase:', error);
    });

    return () => unsubscribe();
  }, [coupleId]);

  const loadCoupleId = async () => {
    try {
      const stored = await AsyncStorage.getItem('@couple');
      if (stored) {
        const couple = JSON.parse(stored);
        if (couple.id) {
          setCoupleId(couple.id);
        }
      }
    } catch (error) {
      console.error('Erreur chargement coupleId:', error);
    }
  };

  // Créer un espace couple sur Firebase
  const createCoupleOnline = async (coupleData, userData) => {
    if (!isConfigured || !database) {
      console.log('Firebase non configuré, mode local uniquement');
      return { success: false, error: 'Pas de connexion Firebase' };
    }

    try {
      setIsSyncing(true);
      const coupleRef = ref(database, `couples/${coupleData.id}`);
      
      await set(coupleRef, {
        ...coupleData,
        members: {
          [userData.id]: {
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar || '😊',
            joinedAt: new Date().toISOString(),
            isCreator: true,
          }
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setCoupleId(coupleData.id);
      setIsSyncing(false);
      return { success: true };
    } catch (error) {
      console.error('Erreur création couple Firebase:', error);
      setIsSyncing(false);
      return { success: false, error: error.message };
    }
  };

  // Rejoindre un couple existant sur Firebase
  const joinCoupleOnline = async (code, userData) => {
    if (!isConfigured || !database) {
      return { success: false, error: 'Pas de connexion Firebase' };
    }

    try {
      setIsSyncing(true);
      
      // Chercher le couple par code
      const couplesRef = ref(database, 'couples');
      const snapshot = await get(couplesRef);
      
      if (!snapshot.exists()) {
        setIsSyncing(false);
        return { success: false, error: 'Code invalide' };
      }

      const couples = snapshot.val();
      let foundCoupleId = null;
      let foundCoupleData = null;

      for (const [id, data] of Object.entries(couples)) {
        if (data.code === code || data.code?.toUpperCase() === code?.toUpperCase()) {
          foundCoupleId = id;
          foundCoupleData = data;
          break;
        }
      }

      if (!foundCoupleId) {
        setIsSyncing(false);
        return { success: false, error: 'Code couple introuvable' };
      }

      // Ajouter le nouveau membre
      const memberRef = ref(database, `couples/${foundCoupleId}/members/${userData.id}`);
      await set(memberRef, {
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar || '😊',
        joinedAt: new Date().toISOString(),
        isCreator: false,
      });

      // Mettre à jour le timestamp
      const updateRef = ref(database, `couples/${foundCoupleId}`);
      await update(updateRef, {
        updatedAt: serverTimestamp(),
      });

      // Sauvegarder localement
      const localCouple = {
        id: foundCoupleId,
        code: foundCoupleData.code,
        name: foundCoupleData.name,
        anniversary: foundCoupleData.anniversary,
      };
      await AsyncStorage.setItem('@couple', JSON.stringify(localCouple));

      setCoupleId(foundCoupleId);
      setIsSyncing(false);
      return { success: true, couple: localCouple, partnerData: foundCoupleData };
    } catch (error) {
      console.error('Erreur jonction couple Firebase:', error);
      setIsSyncing(false);
      return { success: false, error: error.message };
    }
  };

  // Synchroniser les données du couple
  const syncCoupleData = async (dataType, data) => {
    if (!coupleId || !isConfigured || !database) return;

    try {
      const dataRef = ref(database, `couples/${coupleId}/${dataType}`);
      await set(dataRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Erreur sync ${dataType}:`, error);
    }
  };

  // Mettre à jour une propriété du couple
  const updateCoupleProperty = async (property, value) => {
    if (!coupleId || !isConfigured || !database) return;

    try {
      const updateData = {
        [property]: value,
        updatedAt: serverTimestamp(),
      };
      const coupleRef = ref(database, `couples/${coupleId}`);
      await update(coupleRef, updateData);
    } catch (error) {
      console.error('Erreur update couple:', error);
    }
  };

  // Ajouter un souvenir synchronisé
  const addSyncedMemory = async (memory) => {
    if (!coupleId || !isConfigured || !database) return null;

    try {
      const memoryId = Date.now().toString();
      const memoryRef = ref(database, `couples/${coupleId}/memories/${memoryId}`);
      await set(memoryRef, {
        ...memory,
        id: memoryId,
        createdAt: new Date().toISOString(),
      });
      return memoryId;
    } catch (error) {
      console.error('Erreur ajout mémoire:', error);
      return null;
    }
  };

  // Ajouter une love note synchronisée
  const addSyncedLoveNote = async (note) => {
    if (!coupleId || !isConfigured || !database) return null;

    try {
      const noteId = Date.now().toString();
      const noteRef = ref(database, `couples/${coupleId}/loveNotes/${noteId}`);
      await set(noteRef, {
        ...note,
        id: noteId,
        createdAt: new Date().toISOString(),
      });
      return noteId;
    } catch (error) {
      console.error('Erreur ajout note:', error);
      return null;
    }
  };

  // Mettre à jour le love meter
  const updateSyncedLoveMeter = async (value) => {
    if (!coupleId || !isConfigured || !database) return;

    try {
      const coupleRef = ref(database, `couples/${coupleId}`);
      await update(coupleRef, {
        loveMeter: value,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erreur update love meter:', error);
    }
  };

  const value = {
    isOnline,
    isSyncing,
    coupleId,
    syncedData,
    lastSync,
    isFirebaseConfigured: isConfigured && database !== null,
    setCoupleId,
    createCoupleOnline,
    joinCoupleOnline,
    syncCoupleData,
    updateCoupleProperty,
    addSyncedMemory,
    addSyncedLoveNote,
    updateSyncedLoveMeter,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}
