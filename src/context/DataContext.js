import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DataContext = createContext({});

export const useData = () => useContext(DataContext);

export function DataProvider({ children }) {
  const [memories, setMemories] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [quizScores, setQuizScores] = useState({ user: 0, partner: 0 });
  const [loveMeter, setLoveMeter] = useState(0);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [bucketList, setBucketList] = useState([]);
  const [loveNotes, setLoveNotes] = useState([]);
  const [timeCapsules, setTimeCapsules] = useState([]);

  useEffect(() => {
    loadAllData();
  }, []);

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

  // Memories
  const addMemory = async (memory) => {
    const newMemory = { id: Date.now().toString(), ...memory, createdAt: new Date().toISOString() };
    const updated = [newMemory, ...memories];
    setMemories(updated);
    await AsyncStorage.setItem('@memories', JSON.stringify(updated));
    return newMemory;
  };

  // Challenges
  const completeChallenge = async (challengeId) => {
    const updated = challenges.map(c => 
      c.id === challengeId ? { ...c, completed: true, completedAt: new Date().toISOString() } : c
    );
    setChallenges(updated);
    await AsyncStorage.setItem('@challenges', JSON.stringify(updated));
    
    // Augmenter le love meter
    await updateLoveMeter(loveMeter + 10);
  };

  // Love Meter
  const updateLoveMeter = async (value) => {
    const newValue = Math.min(100, Math.max(0, value));
    setLoveMeter(newValue);
    await AsyncStorage.setItem('@loveMeter', JSON.stringify(newValue));
  };

  // Bucket List
  const addBucketItem = async (item) => {
    const newItem = { id: Date.now().toString(), ...item, completed: false };
    const updated = [...bucketList, newItem];
    setBucketList(updated);
    await AsyncStorage.setItem('@bucketList', JSON.stringify(updated));
    return newItem;
  };

  const toggleBucketItem = async (itemId) => {
    const updated = bucketList.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setBucketList(updated);
    await AsyncStorage.setItem('@bucketList', JSON.stringify(updated));
  };

  // Love Notes
  const addLoveNote = async (note) => {
    const newNote = { id: Date.now().toString(), ...note, createdAt: new Date().toISOString() };
    const updated = [newNote, ...loveNotes];
    setLoveNotes(updated);
    await AsyncStorage.setItem('@loveNotes', JSON.stringify(updated));
    return newNote;
  };

  // Time Capsules
  const addTimeCapsule = async (capsule) => {
    const newCapsule = { id: Date.now().toString(), ...capsule, createdAt: new Date().toISOString() };
    const updated = [...timeCapsules, newCapsule];
    setTimeCapsules(updated);
    await AsyncStorage.setItem('@timeCapsules', JSON.stringify(updated));
    return newCapsule;
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
    addMemory,
    completeChallenge,
    updateLoveMeter,
    addBucketItem,
    toggleBucketItem,
    addLoveNote,
    addTimeCapsule,
    setQuizScores,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
