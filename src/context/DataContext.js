import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database, isConfigured } from '../config/firebase';
import { ref, set, get, onValue, off } from 'firebase/database';
import { useAuth } from './AuthContext';
import { encryptLoveNote, decryptLoveNote } from '../utils/encryption';

// ==================== CONSTANTES EXPORTÉES ====================

export const BADGES_LIST = [
  { id: 'first_memory', name: 'Premier Souvenir', emoji: '📸', desc: 'Ajoutez votre premier souvenir', check: (s) => s.memories >= 1 },
  { id: 'first_challenge', name: 'Premier Défi', emoji: '⚡', desc: 'Complétez votre premier défi', check: (s) => s.challenges >= 1 },
  { id: 'chatterbox', name: 'Bavards', emoji: '💬', desc: 'Envoyez 50 messages', check: (s) => s.messages >= 50 },
  { id: 'love_writer', name: 'Poète', emoji: '✍️', desc: 'Écrivez 5 notes d\'amour', check: (s) => s.notes >= 5 },
  { id: 'week_together', name: 'Semaine d\'amour', emoji: '📅', desc: '7 jours ensemble', check: (s) => s.days >= 7 },
  { id: 'month_together', name: 'Premier Mois', emoji: '🌙', desc: '30 jours ensemble', check: (s) => s.days >= 30 },
  { id: 'year_together', name: 'Un An !', emoji: '🎂', desc: '365 jours ensemble', check: (s) => s.days >= 365 },
  { id: 'memory_collector', name: 'Collectionneur', emoji: '🏆', desc: '10 souvenirs créés', check: (s) => s.memories >= 10 },
  { id: 'challenge_master', name: 'Maître des Défis', emoji: '🎯', desc: '10 défis complétés', check: (s) => s.challenges >= 10 },
  { id: 'love_bomb', name: 'Bombe d\'amour', emoji: '💝', desc: '20 notes d\'amour', check: (s) => s.notes >= 20 },
  { id: 'hundred_days', name: '100 Jours', emoji: '💯', desc: '100 jours ensemble', check: (s) => s.days >= 100 },
  { id: 'level_5', name: 'Niveau 5', emoji: '⭐', desc: 'Atteindre le niveau 5', check: (s) => s.level >= 5 },
];

export const MILESTONES = [1, 7, 14, 30, 50, 100, 150, 200, 250, 300, 365, 500, 730, 1000, 1095, 1461, 1826, 2000, 2500, 3000, 3650];

export const SPECIAL_DATES = [
  { month: 2, day: 14, name: 'Saint-Valentin', emoji: '❤️' },
  { month: 12, day: 25, name: 'Noël', emoji: '🎄' },
  { month: 1, day: 1, name: 'Nouvel An', emoji: '🎆' },
  { month: 3, day: 8, name: 'Journée de la Femme', emoji: '🌸' },
  { month: 5, day: 1, name: 'Fête du Travail', emoji: '🌻' },
  { month: 6, day: 21, name: 'Fête de la Musique', emoji: '🎵' },
];

export function getLevelInfo(xp) {
  const level = Math.floor((xp || 0) / 100) + 1;
  const ranks = [
    { min: 1, rank: 'Débutant', emoji: '🌱' },
    { min: 3, rank: 'Amoureux', emoji: '💕' },
    { min: 5, rank: 'Complices', emoji: '🤝' },
    { min: 10, rank: 'Fusionnels', emoji: '🔥' },
    { min: 20, rank: 'Légendaires', emoji: '👑' },
  ];
  const rankInfo = [...ranks].reverse().find(r => level >= r.min) || ranks[0];
  return { level, totalXP: xp || 0, rank: rankInfo.rank, rankEmoji: rankInfo.emoji };
}

// ==================== CONTEXTE ====================

const DataContext = createContext({});

export const useData = () => useContext(DataContext);

export function DataProvider({ children }) {
  const { couple, user, isOnline } = useAuth();
  
  const [memories, setMemories] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [quizScores, setQuizScores] = useState({ user: 0, partner: 0 });
  const [loveMeter, setLoveMeter] = useState(0);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [bucketList, setBucketList] = useState([]);
  const [loveNotes, setLoveNotes] = useState([]);
  const [timeCapsules, setTimeCapsules] = useState([]);
  const [scheduledLetters, setScheduledLetters] = useState([]);
  const [sharedDiary, setSharedDiary] = useState([]);
  const [isDataSynced, setIsDataSynced] = useState(false);
  
  // 🔥 Système de flammes/streaks
  const [streak, setStreak] = useState({ count: 0, lastDate: null, bestStreak: 0 });

  // 🏆 Badges & Countdown
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [countdownEvents, setCountdownEvents] = useState([]);

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
        
        // 🔥 Streak
        if (data.streak) {
          setStreak(data.streak);
          AsyncStorage.setItem('@streak', JSON.stringify(data.streak));
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
      
      // Tentative de reconnexion après délai (avec backoff progressif)
      const retryDelay = isListeningRef.current ? 5000 : 10000;
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
        '@bucketList', '@loveNotes', '@timeCapsules', '@scheduledLetters', '@sharedDiary', '@streak',
        '@unlockedBadges', '@countdownEvents'
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
              case '@streak': if (data && typeof data === 'object') setStreak(data); break;
              case '@unlockedBadges': if (Array.isArray(data)) setUnlockedBadges(data); break;
              case '@countdownEvents': if (Array.isArray(data)) setCountdownEvents(data); break;
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
      completed: challenge.completed || false,
      createdAt: new Date().toISOString(),
      completedAt: challenge.completed ? new Date().toISOString() : null,
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
    
    // Chiffrer la note pour Firebase
    const encryptedNote = encryptLoveNote(newNote, couple?.id);
    
    // Stocker la version déchiffrée en local (état + AsyncStorage)
    // car le listener Firebase déchiffre aussi avant de mettre en état
    const updated = [newNote, ...loveNotes];
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

  // 🔥 FLAMMES/STREAKS: Enregistrer une interaction du joueur actuel
  // Chaque partenaire écrit UNIQUEMENT son propre flag sur son chemin Firebase unique
  // → Pas de race condition : les deux peuvent écrire en même temps sans s'écraser
  // La flamme s'allume quand les DEUX partenaires ont interagi le même jour
  const recordInteraction = async () => {
    const today = new Date().toISOString().split('T')[0]; // ex: "2026-02-10"

    if (!couple?.id || !user?.id || !isConfigured || !database) return;

    try {
      // ÉTAPE 1: Écrire UNIQUEMENT le flag de ce joueur sur son propre chemin
      // (pas d'écrasement des données de l'autre partenaire)
      const myFlagRef = ref(database, `couples/${couple.id}/data/streak/todayInteractions/${user.id}`);
      await set(myFlagRef, today);

      // ÉTAPE 2: Lire l'état frais depuis Firebase (fusion des deux partenaires)
      const streakRef = ref(database, `couples/${couple.id}/data/streak`);
      const snapshot = await get(streakRef);
      const current = snapshot.exists() ? snapshot.val() : { count: 0, lastDate: null, bestStreak: 0 };

      // ÉTAPE 3: Vérifier si les DEUX partenaires ont interagi AUJOURD'HUI
      const todayInteractions = current.todayInteractions || {};
      const bothTalked = Object.values(todayInteractions).filter(d => d === today).length >= 2;

      if (bothTalked && current.lastDate !== today) {
        // 🔥 Les deux ont parlé ! Calculer le nouveau streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newCount = 1;
        if (current.lastDate === yesterdayStr) {
          // Jour consécutif → incrémenter
          newCount = (current.count || 0) + 1;
        }
        // Sinon série cassée → reset à 1

        const newStreak = {
          ...current,
          count: newCount,
          lastDate: today,
          bestStreak: Math.max(newCount, current.bestStreak || 0),
          todayInteractions: todayInteractions,
        };

        await set(streakRef, newStreak);
        setStreak(newStreak);
        await AsyncStorage.setItem('@streak', JSON.stringify(newStreak));
        console.log(`🔥 Streak activé ! Les deux ont parlé : ${newCount} jours !`);
      } else {
        // Un seul a parlé ou déjà compté aujourd'hui — mettre à jour le state local
        const updated = {
          ...current,
          todayInteractions: { ...todayInteractions, [user.id]: today },
        };
        setStreak(updated);
        await AsyncStorage.setItem('@streak', JSON.stringify(updated));
      }
    } catch (e) {
      console.log('⚠️ Erreur streak:', e.message);
    }
  };

  // 🔥 Vérifier si le streak est cassé au démarrage (nouveau jour sans interaction hier)
  useEffect(() => {
    if (!streak.lastDate || streak.count === 0) return;
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Si la dernière interaction n'était ni aujourd'hui ni hier → streak cassé
    if (streak.lastDate !== today && streak.lastDate !== yesterdayStr) {
      console.log('💔 Streak cassé ! Dernier jour:', streak.lastDate);
      const resetStreak = { ...streak, count: 0, todayInteractions: {}, interactionDate: null };
      setStreak(resetStreak);
      AsyncStorage.setItem('@streak', JSON.stringify(resetStreak));
      
      if (couple?.id && isConfigured && database) {
        const streakRef = ref(database, `couples/${couple.id}/data/streak`);
        set(streakRef, resetStreak);
      }
    }
  }, [streak.lastDate, couple?.id]);

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

  // ==================== BADGES ====================
  const checkBadges = async (stats) => {
    try {
      const newlyUnlocked = [];
      for (const badge of BADGES_LIST) {
        const alreadyUnlocked = unlockedBadges.some(b => b.id === badge.id);
        if (!alreadyUnlocked && badge.check(stats)) {
          newlyUnlocked.push({ id: badge.id, unlockedAt: new Date().toISOString() });
        }
      }
      if (newlyUnlocked.length > 0) {
        const updated = [...unlockedBadges, ...newlyUnlocked];
        setUnlockedBadges(updated);
        await AsyncStorage.setItem('@unlockedBadges', JSON.stringify(updated));
        if (couple?.id && isConfigured && database) {
          try {
            const badgesRef = ref(database, `couples/${couple.id}/data/unlockedBadges`);
            const obj = {};
            updated.forEach(b => { obj[b.id] = b; });
            await set(badgesRef, obj);
          } catch (e) { console.log('⚠️ Erreur sync badges:', e.message); }
        }
      }
      return newlyUnlocked;
    } catch (e) {
      console.log('⚠️ Erreur checkBadges:', e.message);
      return [];
    }
  };

  // ==================== COUNTDOWN EVENTS ====================
  const addCountdownEvent = async (event) => {
    const newEvent = { id: Date.now().toString(), ...event, createdAt: new Date().toISOString() };
    const updated = [...countdownEvents, newEvent].sort((a, b) => new Date(a.date) - new Date(b.date));
    setCountdownEvents(updated);
    await AsyncStorage.setItem('@countdownEvents', JSON.stringify(updated));
    if (couple?.id && isConfigured && database) {
      try {
        const evRef = ref(database, `couples/${couple.id}/data/countdownEvents/${newEvent.id}`);
        await set(evRef, newEvent);
      } catch (e) { console.log('⚠️ Erreur sync countdown:', e.message); }
    }
    return newEvent;
  };

  const deleteCountdownEvent = async (eventId) => {
    const updated = countdownEvents.filter(e => e.id !== eventId);
    setCountdownEvents(updated);
    await AsyncStorage.setItem('@countdownEvents', JSON.stringify(updated));
    if (couple?.id && isConfigured && database) {
      try {
        const evRef = ref(database, `couples/${couple.id}/data/countdownEvents/${eventId}`);
        await set(evRef, null);
      } catch (e) { console.log('⚠️ Erreur suppression countdown:', e.message); }
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
    // Badges & Countdown
    unlockedBadges,
    countdownEvents,
    checkBadges,
    addCountdownEvent,
    deleteCountdownEvent,
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
    // 🔥 Streaks
    streak,
    recordInteraction,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
