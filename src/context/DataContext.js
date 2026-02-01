import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database, isConfigured } from '../config/firebase';
import { ref, set, onValue, off } from 'firebase/database';
import { useAuth } from './AuthContext';

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
    
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('📥 Données couple reçues de Firebase');
        
        // Mettre à jour tous les états avec les données Firebase
        if (data.memories) {
          const memoriesArray = Object.values(data.memories);
          setMemories(memoriesArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
          AsyncStorage.setItem('@memories', JSON.stringify(memoriesArray));
        }
        
        if (data.bucketList) {
          const bucketArray = Object.values(data.bucketList);
          setBucketList(bucketArray);
          AsyncStorage.setItem('@bucketList', JSON.stringify(bucketArray));
        }
        
        if (data.loveNotes) {
          const notesArray = Object.values(data.loveNotes);
          setLoveNotes(notesArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
          AsyncStorage.setItem('@loveNotes', JSON.stringify(notesArray));
        }
        
        if (data.timeCapsules) {
          const capsulesArray = Object.values(data.timeCapsules);
          setTimeCapsules(capsulesArray);
          AsyncStorage.setItem('@timeCapsules', JSON.stringify(capsulesArray));
        }
        
        if (data.challenges) {
          const challengesArray = Object.values(data.challenges);
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
      }
    }, (error) => {
      console.error('❌ Erreur écoute données Firebase:', error);
      setIsDataSynced(false);
    });

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
        '@bucketList', '@loveNotes', '@timeCapsules'
      ];
      const results = await AsyncStorage.multiGet(keys);
      
      results.forEach(([key, value]) => {
        if (value) {
          const data = JSON.parse(value);
          switch(key) {
            case '@memories': setMemories(data); break;
            case '@challenges': setChallenges(data); break;
            case '@quizScores': setQuizScores(data); break;
            case '@loveMeter': setLoveMeter(data); break;
            case '@bucketList': setBucketList(data); break;
            case '@loveNotes': setLoveNotes(data); break;
            case '@timeCapsules': setTimeCapsules(data); break;
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
      completed: false,
      createdAt: new Date().toISOString(),
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

  // Love Notes - avec sync Firebase
  const addLoveNote = async (note) => {
    const newNote = { 
      id: Date.now().toString(), 
      ...note, 
      createdAt: new Date().toISOString(),
      from: user?.name || 'Anonyme',
      fromId: user?.id
    };
    
    const updated = [newNote, ...loveNotes];
    setLoveNotes(updated);
    await AsyncStorage.setItem('@loveNotes', JSON.stringify(updated));
    
    // Sync vers Firebase
    if (couple?.id && isConfigured && database) {
      try {
        const noteRef = ref(database, `couples/${couple.id}/data/loveNotes/${newNote.id}`);
        await set(noteRef, newNote);
        console.log('✅ Note d\'amour synchronisée');
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

      await set(dataRef, {
        memories: memoriesObj,
        bucketList: bucketObj,
        loveNotes: notesObj,
        timeCapsules: capsulesObj,
        challenges: challengesObj,
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
    isDataSynced,
    addMemory,
    deleteMemory,
    completeChallenge,
    addChallenge,
    updateLoveMeter,
    addBucketItem,
    toggleBucketItem,
    deleteBucketItem,
    addLoveNote,
    deleteLoveNote,
    addTimeCapsule,
    setQuizScores: updateQuizScores,
    forceSyncAll,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
