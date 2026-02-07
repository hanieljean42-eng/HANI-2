import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database, isConfigured } from '../config/firebase';
import { ref, set, onValue, off } from 'firebase/database';
import { useAuth } from './AuthContext';
import { encryptLoveNote, decryptLoveNote } from '../utils/encryption';

const DataContext = createContext({});

export const useData = () => useContext(DataContext);

export function DataProvider({ children }) {
  const { couple, user, isOnline } = useAuth();
  
  const [memories, setMemories] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [quizScores, setQuizScores] = useState({ user: 0, partner: 0 });
  const [loveMeter, setLoveMeter] = useState(0);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [bucketList, setBucketList] = useState([]);
  const [loveNotes, setLoveNotes] = useState([]);
  const [timeCapsules, setTimeCapsules] = useState([]);
  const [scheduledLetters, setScheduledLetters] = useState([]);
  const [sharedDiary, setSharedDiary] = useState([]);
  const [isDataSynced, setIsDataSynced] = useState(false);

  // Référence pour éviter les boucles
  const coupleIdRef = useRef(null);
  const isListeningRef = useRef(false);

  // Charger les données locales au démarrage
  useEffect(() => {
    loadAllData();
  }, []);

  // Écouter les changements Firebase en temps réel
  useEffect(() => {
    if (!couple?.id || !isConfigured || !database) {
      return;
    }

    // Éviter de recréer le listener
    if (coupleIdRef.current === couple.id && isListeningRef.current) {
      return;
    }
    
    coupleIdRef.current = couple.id;
    isListeningRef.current = true;

    console.log('📊 Écoute des données Firebase pour:', couple.id);
    
    const dataRef = ref(database, `couples/${couple.id}/data`);
    
    const handleSnapshot = (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('📥 Données couple reçues de Firebase');
        
        // Mettre à jour tous les états avec les données Firebase
        if (data.memories && typeof data.memories === 'object') {
          const memoriesArray = Object.values(data.memories).filter(Boolean);
          setMemories(memoriesArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
          AsyncStorage.setItem('@memories', JSON.stringify(memoriesArray));
        }
        
        if (data.bucketList && typeof data.bucketList === 'object') {
          const bucketArray = Object.values(data.bucketList).filter(Boolean);
          setBucketList(bucketArray);
          AsyncStorage.setItem('@bucketList', JSON.stringify(bucketArray));
        }
        
        if (data.loveNotes && typeof data.loveNotes === 'object') {
          const notesArray = Object.values(data.loveNotes).filter(Boolean);
          // Déchiffrer les notes d'amour
          const decryptedNotes = notesArray.map(note => decryptLoveNote(note, couple.id));
          setLoveNotes(decryptedNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
          AsyncStorage.setItem('@loveNotes', JSON.stringify(decryptedNotes));
        }
        
        if (data.timeCapsules && typeof data.timeCapsules === 'object') {
          const capsulesArray = Object.values(data.timeCapsules).filter(Boolean);
          setTimeCapsules(capsulesArray);
          AsyncStorage.setItem('@timeCapsules', JSON.stringify(capsulesArray));
        }
        
        if (data.scheduledLetters && typeof data.scheduledLetters === 'object') {
          const lettersArray = Object.values(data.scheduledLetters).filter(Boolean);
          setScheduledLetters(lettersArray.sort((a, b) => new Date(a.deliveryDate) - new Date(b.deliveryDate)));
          AsyncStorage.setItem('@scheduledLetters', JSON.stringify(lettersArray));
        }
        
        if (data.sharedDiary && typeof data.sharedDiary === 'object') {
          const diaryArray = Object.values(data.sharedDiary).filter(Boolean);
          setSharedDiary(diaryArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
          AsyncStorage.setItem('@sharedDiary', JSON.stringify(diaryArray));
        }
        
        if (data.challenges && typeof data.challenges === 'object') {
          const challengesArray = Object.values(data.challenges).filter(Boolean);
          setChallenges(challengesArray);
          AsyncStorage.setItem('@challenges', JSON.stringify(challengesArray));
        }
        
        if (data.loveMeter !== undefined) {
          setLoveMeter(data.loveMeter);
          AsyncStorage.setItem('@loveMeter', JSON.stringify(data.loveMeter));
        }
        
        if (data.quizScores) {
          setQuizScores(data.quizScores);
          AsyncStorage.setItem('@quizScores', JSON.stringify(data.quizScores));
        }
        
        setIsDataSynced(true);
      } else {
        console.log('📭 Aucune donnée couple trouvée sur Firebase');
      }
    };
    
    const handleError = (error) => {
      console.error('❌ Erreur écoute données Firebase:', error.message);
      setIsDataSynced(false);
      
      // Log détaillé pour debugging
      const errorType = error.code || 'UNKNOWN_ERROR';
      if (errorType === 'PERMISSION_DENIED') {
        console.error('🔒 Accès refusé - vérifier les règles Firebase');
      } else if (errorType === 'NETWORK_ERROR') {
        console.warn('📡 Erreur réseau - mode local activé');
      } else {
        console.warn('⚠️ Erreur Firebase:', errorType, error.message);
      }
      
      // Tentative de reconnexion après 5 secondes (avec backoff progressif)
      const retryDelay = Math.min(5000, isListeningRef.current ? 5000 : 10000);
      setTimeout(() => {
        if (coupleIdRef.current === couple.id && !isListeningRef.current) {
          console.log('🔄 Tentative de reconnexion Firebase...');
          isListeningRef.current = false;
          // Le useEffect se redéclenchera
        }
      }, retryDelay);
    };
    
    const unsubscribe = onValue(dataRef, handleSnapshot, handleError);

    return () => {
      console.log('🔕 Arrêt écoute données Firebase');
      off(dataRef);
      isListeningRef.current = false;
    };
  }, [couple?.id]);

  const loadAllData = async () => {
    try {
      const keys = [
        '@memories', '@challenges', '@quizScores', '@loveMeter',
        '@bucketList', '@loveNotes', '@timeCapsules', '@scheduledLetters', '@sharedDiary'
      ];
      const results = await AsyncStorage.multiGet(keys);
      
      results.forEach(([key, value]) => {
        if (value) {
          try {
            const data = JSON.parse(value);
            if (!data) return;
            switch(key) {
              case '@memories': if (Array.isArray(data)) setMemories(data); break;
              case '@challenges': if (Array.isArray(data)) setChallenges(data); break;
              case '@quizScores': setQuizScores(data); break;
              case '@loveMeter': setLoveMeter(data); break;
              case '@bucketList': if (Array.isArray(data)) setBucketList(data); break;
              case '@loveNotes': if (Array.isArray(data)) setLoveNotes(data); break;
              case '@timeCapsules': if (Array.isArray(data)) setTimeCapsules(data); break;
              case '@scheduledLetters': if (Array.isArray(data)) setScheduledLetters(data); break;
              case '@sharedDiary': if (Array.isArray(data)) setSharedDiary(data); break;
            }
          } catch (parseError) {
            console.error(`Erreur parsing ${key}:`, parseError);
          }
        }
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Memories - avec sync Firebase
  const addMemory = async (memory) => {
    const newMemory = { 
      id: Date.now().toString(), 
      ...memory, 
      createdAt: new Date().toISOString(),
      addedBy: user?.name || 'Anonyme',
      addedById: user?.id
    };
    
    const updated = [newMemory, ...memories];
    setMemories(updated);
    await AsyncStorage.setItem('@memories', JSON.stringify(updated));
    
    // Sync vers Firebase
    if (couple?.id && isConfigured && database) {
      try {
        const memoryRef = ref(database, `couples/${couple.id}/data/memories/${newMemory.id}`);
        await set(memoryRef, newMemory);
        console.log('✅ Souvenir synchronisé');
      } catch (e) {
        console.log('⚠️ Erreur sync souvenir:', e.message);
      }
    }
    
    return newMemory;
  };

  const deleteMemory = async (memoryId) => {
    const updated = memories.filter(m => m.id !== memoryId);
    setMemories(updated);
    await AsyncStorage.setItem('@memories', JSON.stringify(updated));
    
    // Supprimer sur Firebase
    if (couple?.id && isConfigured && database) {
      try {
        const memoryRef = ref(database, `couples/${couple.id}/data/memories/${memoryId}`);
        await set(memoryRef, null);
      } catch (e) {
        console.log('⚠️ Erreur suppression Firebase:', e.message);
      }
    }
  };

  // Modifier un souvenir
  const updateMemory = async (memoryId, updates) => {
    const updated = memories.map(m => 
      m.id === memoryId ? { 
        ...m, 
        ...updates, 
        updatedAt: new Date().toISOString(),
        updatedBy: user?.name
      } : m
    );
    setMemories(updated);
    await AsyncStorage.setItem('@memories', JSON.stringify(updated));
    
    // Sync vers Firebase
    const updatedMemory = updated.find(m => m.id === memoryId);
    if (updatedMemory && couple?.id && isConfigured && database) {
      try {
        const memoryRef = ref(database, `couples/${couple.id}/data/memories/${memoryId}`);
        await set(memoryRef, updatedMemory);
        console.log('✅ Souvenir modifié');
      } catch (e) {
        console.log('⚠️ Erreur update souvenir:', e.message);
      }
    }
    
    return updatedMemory;
  };

  // Challenges - avec sync Firebase
  const completeChallenge = async (challengeId) => {
    const updated = challenges.map(c => 
      c.id === challengeId ? { 
        ...c, 
        completed: true, 
        completedAt: new Date().toISOString(),
        completedBy: user?.name
      } : c
    );
    setChallenges(updated);
    await AsyncStorage.setItem('@challenges', JSON.stringify(updated));
    
    // Sync vers Firebase
    const completedChallenge = updated.find(c => c.id === challengeId);
    if (completedChallenge && couple?.id && isConfigured && database) {
      try {
        const challengeRef = ref(database, `couples/${couple.id}/data/challenges/${challengeId}`);
        await set(challengeRef, completedChallenge);
      } catch (e) {
        console.log('⚠️ Erreur sync défi:', e.message);
      }
    }
    
    // Augmenter le love meter
    await updateLoveMeter(loveMeter + 10);
  };

  const addChallenge = async (challenge) => {
    const newChallenge = {
      id: Date.now().toString(),
      ...challenge,
      completed: true,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      addedBy: user?.name
    };
    
    const updated = [...challenges, newChallenge];
    setChallenges(updated);
    await AsyncStorage.setItem('@challenges', JSON.stringify(updated));
    
    // Sync vers Firebase
    if (couple?.id && isConfigured && database) {
      try {
        const challengeRef = ref(database, `couples/${couple.id}/data/challenges/${newChallenge.id}`);
        await set(challengeRef, newChallenge);
      } catch (e) {
        console.log('⚠️ Erreur sync défi:', e.message);
      }
    }
    
    return newChallenge;
  };

  // Modifier un défi
  const updateChallenge = async (challengeId, updates) => {
    const updated = challenges.map(c => 
      c.id === challengeId ? { 
        ...c, 
        ...updates, 
        updatedAt: new Date().toISOString(),
        updatedBy: user?.name
      } : c
    );
    setChallenges(updated);
    await AsyncStorage.setItem('@challenges', JSON.stringify(updated));
    
    // Sync vers Firebase
    const updatedChallenge = updated.find(c => c.id === challengeId);
    if (updatedChallenge && couple?.id && isConfigured && database) {
      try {
        const challengeRef = ref(database, `couples/${couple.id}/data/challenges/${challengeId}`);
        await set(challengeRef, updatedChallenge);
        console.log('✅ Défi modifié');
      } catch (e) {
        console.log('⚠️ Erreur update défi:', e.message);
      }
    }
    
    return updatedChallenge;
  };

  // Supprimer un défi
  const deleteChallenge = async (challengeId) => {
    const updated = challenges.filter(c => c.id !== challengeId);
    setChallenges(updated);
    await AsyncStorage.setItem('@challenges', JSON.stringify(updated));
    
    // Supprimer sur Firebase
    if (couple?.id && isConfigured && database) {
      try {
        const challengeRef = ref(database, `couples/${couple.id}/data/challenges/${challengeId}`);
        await set(challengeRef, null);
        console.log('✅ Défi supprimé');
      } catch (e) {
        console.log('⚠️ Erreur suppression défi:', e.message);
      }
    }
  };

  // Love Meter - avec sync Firebase
  const updateLoveMeter = async (value) => {
    const newValue = Math.min(100, Math.max(0, value));
    setLoveMeter(newValue);
    await AsyncStorage.setItem('@loveMeter', JSON.stringify(newValue));
    
    // Sync vers Firebase
    if (couple?.id && isConfigured && database) {
      try {
        const meterRef = ref(database, `couples/${couple.id}/data/loveMeter`);
        await set(meterRef, newValue);
        
        // Aussi mettre à jour dans les infos du couple
        const coupleRef = ref(database, `couples/${couple.id}/loveMeter`);
        await set(coupleRef, newValue);
      } catch (e) {
        console.log('⚠️ Erreur sync loveMeter:', e.message);
      }
    }
  };

  // Bucket List - avec sync Firebase
  const addBucketItem = async (item) => {
    const newItem = { 
      id: Date.now().toString(), 
      ...item, 
      completed: false,
      createdAt: new Date().toISOString(),
      addedBy: user?.name,
      addedById: user?.id
    };
    
    const updated = [...bucketList, newItem];
    setBucketList(updated);
    await AsyncStorage.setItem('@bucketList', JSON.stringify(updated));
    
    // Sync vers Firebase
    if (couple?.id && isConfigured && database) {
      try {
        const itemRef = ref(database, `couples/${couple.id}/data/bucketList/${newItem.id}`);
        await set(itemRef, newItem);
        console.log('✅ Bucket item synchronisé');
      } catch (e) {
        console.log('⚠️ Erreur sync bucket:', e.message);
      }
    }
    
    return newItem;
  };

  const toggleBucketItem = async (itemId) => {
    const updated = bucketList.map(item =>
      item.id === itemId ? { 
        ...item, 
        completed: !item.completed,
        completedAt: !item.completed ? new Date().toISOString() : null,
        completedBy: !item.completed ? user?.name : null
      } : item
    );
    setBucketList(updated);
    await AsyncStorage.setItem('@bucketList', JSON.stringify(updated));
    
    // Sync vers Firebase
    const toggledItem = updated.find(i => i.id === itemId);
    if (toggledItem && couple?.id && isConfigured && database) {
      try {
        const itemRef = ref(database, `couples/${couple.id}/data/bucketList/${itemId}`);
        await set(itemRef, toggledItem);
      } catch (e) {
        console.log('⚠️ Erreur sync bucket:', e.message);
      }
    }
  };

  const deleteBucketItem = async (itemId) => {
    const updated = bucketList.filter(item => item.id !== itemId);
    setBucketList(updated);
    await AsyncStorage.setItem('@bucketList', JSON.stringify(updated));
    
    // Supprimer sur Firebase
    if (couple?.id && isConfigured && database) {
      try {
        const itemRef = ref(database, `couples/${couple.id}/data/bucketList/${itemId}`);
        await set(itemRef, null);
      } catch (e) {
        console.log('⚠️ Erreur suppression bucket:', e.message);
      }
    }
  };

  // Modifier un item de bucket list
  const updateBucketItem = async (itemId, updates) => {
    const updated = bucketList.map(item => 
      item.id === itemId ? { 
        ...item, 
        ...updates, 
        updatedAt: new Date().toISOString(),
        updatedBy: user?.name
      } : item
    );
    setBucketList(updated);
    await AsyncStorage.setItem('@bucketList', JSON.stringify(updated));
    
    // Sync vers Firebase
    const updatedItem = updated.find(i => i.id === itemId);
    if (updatedItem && couple?.id && isConfigured && database) {
      try {
        const itemRef = ref(database, `couples/${couple.id}/data/bucketList/${itemId}`);
        await set(itemRef, updatedItem);
        console.log('✅ Bucket item modifié');
      } catch (e) {
        console.log('⚠️ Erreur update bucket:', e.message);
      }
    }
    
    return updatedItem;
  };

  // Love Notes - avec sync Firebase et chiffrement
  const addLoveNote = async (note) => {
    const newNote = { 
      id: Date.now().toString(), 
      ...note, 
      createdAt: new Date().toISOString(),
      from: user?.name || 'Anonyme',
      fromId: user?.id
    };
    
    // Chiffrer la note avant de la sauvegarder
    const encryptedNote = encryptLoveNote(newNote, couple?.id);
    
    const updated = [encryptedNote, ...loveNotes];
    setLoveNotes(updated);
    await AsyncStorage.setItem('@loveNotes', JSON.stringify(updated));
    
    // Sync vers Firebase
    if (couple?.id && isConfigured && database) {
      try {
        const noteRef = ref(database, `couples/${couple.id}/data/loveNotes/${newNote.id}`);
        await set(noteRef, encryptedNote);
        console.log('✅ Note d\'amour synchronisée (chiffrée)');
      } catch (e) {
        console.log('⚠️ Erreur sync note:', e.message);
      }
    }
    
    return newNote;
  };

  const deleteLoveNote = async (noteId) => {
    const updated = loveNotes.filter(n => n.id !== noteId);
    setLoveNotes(updated);
    await AsyncStorage.setItem('@loveNotes', JSON.stringify(updated));
    
    // Supprimer sur Firebase
    if (couple?.id && isConfigured && database) {
      try {
        const noteRef = ref(database, `couples/${couple.id}/data/loveNotes/${noteId}`);
        await set(noteRef, null);
      } catch (e) {
        console.log('⚠️ Erreur suppression note:', e.message);
      }
    }
  };

  // Modifier une love note
  const updateLoveNote = async (noteId, updates) => {
    const updated = loveNotes.map(n => 
      n.id === noteId ? { 
        ...n, 
        ...updates, 
        updatedAt: new Date().toISOString()
      } : n
    );
    setLoveNotes(updated);
    await AsyncStorage.setItem('@loveNotes', JSON.stringify(updated));
    
    // Sync vers Firebase
    const updatedNote = updated.find(n => n.id === noteId);
    if (updatedNote && couple?.id && isConfigured && database) {
      try {
        const noteRef = ref(database, `couples/${couple.id}/data/loveNotes/${noteId}`);
        await set(noteRef, updatedNote);
        console.log('✅ Note modifiée');
      } catch (e) {
        console.log('⚠️ Erreur update note:', e.message);
      }
    }
    
    return updatedNote;
  };

  // Time Capsules - avec sync Firebase
  const addTimeCapsule = async (capsule) => {
    const newCapsule = { 
      id: Date.now().toString(), 
      ...capsule, 
      createdAt: new Date().toISOString(),
      addedBy: user?.name,
      addedById: user?.id
    };
    
    const updated = [...timeCapsules, newCapsule];
    setTimeCapsules(updated);
    await AsyncStorage.setItem('@timeCapsules', JSON.stringify(updated));
    
    // Sync vers Firebase
    if (couple?.id && isConfigured && database) {
      try {
        const capsuleRef = ref(database, `couples/${couple.id}/data/timeCapsules/${newCapsule.id}`);
        await set(capsuleRef, newCapsule);
        console.log('✅ Capsule temporelle synchronisée');
      } catch (e) {
        console.log('⚠️ Erreur sync capsule:', e.message);
      }
    }
    
    return newCapsule;
  };

  // Supprimer une capsule temporelle
  const deleteTimeCapsule = async (capsuleId) => {
    const updated = timeCapsules.filter(c => c.id !== capsuleId);
    setTimeCapsules(updated);
    await AsyncStorage.setItem('@timeCapsules', JSON.stringify(updated));
    
    // Supprimer de Firebase
    if (couple?.id && isConfigured && database) {
      try {
        const capsuleRef = ref(database, `couples/${couple.id}/data/timeCapsules/${capsuleId}`);
        await set(capsuleRef, null);
        console.log('✅ Capsule supprimée de Firebase');
      } catch (e) {
        console.log('⚠️ Erreur suppression capsule:', e.message);
      }
    }
  };

  // Modifier une capsule temporelle
  const updateTimeCapsule = async (capsuleId, updates) => {
    const updated = timeCapsules.map(c => 
      c.id === capsuleId ? { 
        ...c, 
        ...updates, 
        updatedAt: new Date().toISOString()
      } : c
    );
    setTimeCapsules(updated);
    await AsyncStorage.setItem('@timeCapsules', JSON.stringify(updated));
    
    // Sync vers Firebase
    const updatedCapsule = updated.find(c => c.id === capsuleId);
    if (updatedCapsule && couple?.id && isConfigured && database) {
      try {
        const capsuleRef = ref(database, `couples/${couple.id}/data/timeCapsules/${capsuleId}`);
        await set(capsuleRef, updatedCapsule);
        console.log('✅ Capsule modifiée');
      } catch (e) {
        console.log('⚠️ Erreur update capsule:', e.message);
      }
    }
    
    return updatedCapsule;
  };

  // ===== LETTRES D'AMOUR PROGRAMMÉES =====
  const addScheduledLetter = async (letter) => {
    const newLetter = {
      id: Date.now().toString(),
      ...letter,
      createdAt: new Date().toISOString(),
      from: user?.name || 'Anonyme',
      fromId: user?.id,
      isDelivered: false,
      isRead: false,
    };
    
    const updated = [...scheduledLetters, newLetter];
    setScheduledLetters(updated);
    await AsyncStorage.setItem('@scheduledLetters', JSON.stringify(updated));
    
    // Sync vers Firebase
    if (couple?.id && isConfigured && database) {
      try {
        const letterRef = ref(database, `couples/${couple.id}/data/scheduledLetters/${newLetter.id}`);
        await set(letterRef, newLetter);
        console.log('✅ Lettre programmée synchronisée');
      } catch (e) {
        console.log('⚠️ Erreur sync lettre:', e.message);
      }
    }
    
    return newLetter;
  };

  const markLetterAsRead = async (letterId) => {
    const updated = scheduledLetters.map(l => 
      l.id === letterId ? { ...l, isRead: true } : l
    );
    setScheduledLetters(updated);
    await AsyncStorage.setItem('@scheduledLetters', JSON.stringify(updated));
    
    // Sync vers Firebase
    if (couple?.id && isConfigured && database) {
      try {
        const letterRef = ref(database, `couples/${couple.id}/data/scheduledLetters/${letterId}/isRead`);
        await set(letterRef, true);
      } catch (e) {
        console.log('⚠️ Erreur update lettre:', e.message);
      }
    }
  };

  const deleteScheduledLetter = async (letterId) => {
    const updated = scheduledLetters.filter(l => l.id !== letterId);
    setScheduledLetters(updated);
    await AsyncStorage.setItem('@scheduledLetters', JSON.stringify(updated));
    
    // Supprimer de Firebase
    if (couple?.id && isConfigured && database) {
      try {
        const letterRef = ref(database, `couples/${couple.id}/data/scheduledLetters/${letterId}`);
        await set(letterRef, null);
        console.log('✅ Lettre supprimée de Firebase');
      } catch (e) {
        console.log('⚠️ Erreur suppression lettre:', e.message);
      }
    }
  };

  // Modifier une lettre programmée
  const updateScheduledLetter = async (letterId, updates) => {
    const updated = scheduledLetters.map(l => 
      l.id === letterId ? { 
        ...l, 
        ...updates, 
        updatedAt: new Date().toISOString()
      } : l
    );
    setScheduledLetters(updated);
    await AsyncStorage.setItem('@scheduledLetters', JSON.stringify(updated));
    
    // Sync vers Firebase
    const updatedLetter = updated.find(l => l.id === letterId);
    if (updatedLetter && couple?.id && isConfigured && database) {
      try {
        const letterRef = ref(database, `couples/${couple.id}/data/scheduledLetters/${letterId}`);
        await set(letterRef, updatedLetter);
        console.log('✅ Lettre modifiée');
      } catch (e) {
        console.log('⚠️ Erreur update lettre:', e.message);
      }
    }
    
    return updatedLetter;
  };

  // Vérifier si des lettres sont prêtes à être délivrées
  const getDeliverableLetters = () => {
    const now = new Date();
    return scheduledLetters.filter(letter => {
      if (letter.isDelivered) return false;
      if (letter.fromId === user?.id) return false; // Pas ses propres lettres
      
      // Parser la date correctement
      let deliveryDate;
      if (letter.deliveryDate.includes('/')) {
        const [day, month, year] = letter.deliveryDate.split('/').map(Number);
        deliveryDate = new Date(year, month - 1, day, 0, 0, 0);
      } else {
        deliveryDate = new Date(letter.deliveryDate);
      }
      
      // Comparer les dates (pas l'heure)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const deliveryDay = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate());
      
      return today >= deliveryDay;
    });
  };

  // Vérifier et notifier les lettres délivrables au démarrage
  const checkDeliverableLettersAtStartup = async () => {
    const deliverable = getDeliverableLetters();
    if (deliverable.length > 0) {
      console.log(`💌 ${deliverable.length} lettre(s) à livrer !`);
      // Les notifications seront affichées dans l'écran Memories
    }
    return deliverable;
  };

  // ===== JOURNAL INTIME PARTAGÉ =====
  const addDiaryEntry = async (entry) => {
    const newEntry = {
      id: Date.now().toString(),
      ...entry,
      createdAt: new Date().toISOString(),
      author: user?.name || 'Anonyme',
      authorId: user?.id,
      date: new Date().toLocaleDateString('fr-FR'),
    };
    
    const updated = [newEntry, ...sharedDiary];
    setSharedDiary(updated);
    await AsyncStorage.setItem('@sharedDiary', JSON.stringify(updated));
    
    // Sync vers Firebase
    if (couple?.id && isConfigured && database) {
      try {
        const entryRef = ref(database, `couples/${couple.id}/data/sharedDiary/${newEntry.id}`);
        await set(entryRef, newEntry);
        console.log('✅ Entrée du journal synchronisée');
      } catch (e) {
        console.log('⚠️ Erreur sync journal:', e.message);
      }
    }
    
    return newEntry;
  };

  const deleteDiaryEntry = async (entryId) => {
    const updated = sharedDiary.filter(e => e.id !== entryId);
    setSharedDiary(updated);
    await AsyncStorage.setItem('@sharedDiary', JSON.stringify(updated));
    
    // Supprimer de Firebase
    if (couple?.id && isConfigured && database) {
      try {
        const entryRef = ref(database, `couples/${couple.id}/data/sharedDiary/${entryId}`);
        await set(entryRef, null);
        console.log('✅ Entrée du journal supprimée');
      } catch (e) {
        console.log('⚠️ Erreur suppression journal:', e.message);
      }
    }
  };

  // Modifier une entrée de journal
  const updateDiaryEntry = async (entryId, updates) => {
    const updated = sharedDiary.map(e => 
      e.id === entryId ? { 
        ...e, 
        ...updates, 
        updatedAt: new Date().toISOString()
      } : e
    );
    setSharedDiary(updated);
    await AsyncStorage.setItem('@sharedDiary', JSON.stringify(updated));
    
    // Sync vers Firebase
    const updatedEntry = updated.find(e => e.id === entryId);
    if (updatedEntry && couple?.id && isConfigured && database) {
      try {
        const entryRef = ref(database, `couples/${couple.id}/data/sharedDiary/${entryId}`);
        await set(entryRef, updatedEntry);
        console.log('✅ Entrée du journal modifiée');
      } catch (e) {
        console.log('⚠️ Erreur update journal:', e.message);
      }
    }
    
    return updatedEntry;
  };

  // Quiz Scores - avec sync Firebase
  const updateQuizScores = async (scores) => {
    setQuizScores(scores);
    await AsyncStorage.setItem('@quizScores', JSON.stringify(scores));
    
    // Sync vers Firebase
    if (couple?.id && isConfigured && database) {
      try {
        const scoresRef = ref(database, `couples/${couple.id}/data/quizScores`);
        await set(scoresRef, scores);
      } catch (e) {
        console.log('⚠️ Erreur sync scores:', e.message);
      }
    }
  };

  // Forcer la synchronisation de toutes les données
  const forceSyncAll = async () => {
    if (!couple?.id || !isConfigured || !database) {
      console.log('⚠️ Impossible de synchroniser - pas de connexion');
      return false;
    }

    try {
      console.log('🔄 Synchronisation forcée de toutes les données...');
      
      const dataRef = ref(database, `couples/${couple.id}/data`);
      
      // Convertir les tableaux en objets pour Firebase
      const memoriesObj = {};
      memories.forEach(m => { memoriesObj[m.id] = m; });
      
      const bucketObj = {};
      bucketList.forEach(b => { bucketObj[b.id] = b; });
      
      const notesObj = {};
      loveNotes.forEach(n => { notesObj[n.id] = n; });
      
      const capsulesObj = {};
      timeCapsules.forEach(c => { capsulesObj[c.id] = c; });
      
      const challengesObj = {};
      challenges.forEach(c => { challengesObj[c.id] = c; });

      const lettersObj = {};
      scheduledLetters.forEach(l => { lettersObj[l.id] = l; });

      const diaryObj = {};
      sharedDiary.forEach(d => { diaryObj[d.id] = d; });

      await set(dataRef, {
        memories: memoriesObj,
        bucketList: bucketObj,
        loveNotes: notesObj,
        timeCapsules: capsulesObj,
        challenges: challengesObj,
        scheduledLetters: lettersObj,
        sharedDiary: diaryObj,
        loveMeter: loveMeter,
        quizScores: quizScores,
        lastSync: new Date().toISOString()
      });

      console.log('✅ Toutes les données synchronisées !');
      setIsDataSynced(true);
      return true;
    } catch (error) {
      console.error('❌ Erreur sync forcée:', error);
      return false;
    }
  };

  const value = {
    memories,
    challenges,
    quizScores,
    loveMeter,
    dailyChallenge,
    bucketList,
    loveNotes,
    timeCapsules,
    scheduledLetters,
    sharedDiary,
    isDataSynced,
    // Memories
    addMemory,
    deleteMemory,
    updateMemory,
    // Challenges
    completeChallenge,
    addChallenge,
    updateChallenge,
    deleteChallenge,
    // Love Meter
    updateLoveMeter,
    // Bucket List
    addBucketItem,
    toggleBucketItem,
    deleteBucketItem,
    updateBucketItem,
    // Love Notes
    addLoveNote,
    deleteLoveNote,
    updateLoveNote,
    // Time Capsules
    addTimeCapsule,
    deleteTimeCapsule,
    updateTimeCapsule,
    // Scheduled Letters
    addScheduledLetter,
    markLetterAsRead,
    deleteScheduledLetter,
    updateScheduledLetter,
    getDeliverableLetters,
    checkDeliverableLettersAtStartup,
    // Shared Diary
    addDiaryEntry,
    deleteDiaryEntry,
    updateDiaryEntry,
    // Quiz
    setQuizScores: updateQuizScores,
    // Sync
    forceSyncAll,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
