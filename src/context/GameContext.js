import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { database, isConfigured } from '../config/firebase';
import { ref, set, onValue, remove, update, push, get } from 'firebase/database';

const GameContext = createContext({});

export const useGame = () => useContext(GameContext);

export function GameProvider({ children }) {
  const [coupleId, setCoupleId] = useState(null);
  const [currentGame, setCurrentGame] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [waitingForPartner, setWaitingForPartner] = useState(false);
  const [gameData, setGameData] = useState(null);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  
  // Mode en ligne / hors ligne
  const [isOnlineMode, setIsOnlineMode] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  // Surveiller la connexion réseau
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // Charger l'ID du couple au démarrage
  useEffect(() => {
    loadCoupleId();
    generatePlayerId();
    setIsFirebaseReady(isConfigured && database !== null);
  }, []);

  const loadCoupleId = async () => {
    try {
      const id = await AsyncStorage.getItem('@coupleId');
      if (id) {
        setCoupleId(id);
      } else {
        // Générer un ID de couple si pas encore créé
        const newId = 'couple_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
        await AsyncStorage.setItem('@coupleId', newId);
        setCoupleId(newId);
      }
    } catch (error) {
      console.error('Erreur chargement coupleId:', error);
    }
  };

  const generatePlayerId = async () => {
    try {
      let playerId = await AsyncStorage.getItem('@playerId');
      if (!playerId) {
        playerId = 'player_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
        await AsyncStorage.setItem('@playerId', playerId);
      }
      setMyPlayerId(playerId);
    } catch (error) {
      console.error('Erreur génération playerId:', error);
    }
  };

  // Partager le code du couple
  const getCoupleCode = () => {
    if (!coupleId) return null;
    // Retourner les 6 derniers caractères comme code court
    return coupleId.slice(-6).toUpperCase();
  };

  // Rejoindre un couple avec un code
  const joinCouple = async (code) => {
    try {
      // Chercher le couple avec ce code dans Firebase
      const couplesRef = ref(database, 'couples');
      const snapshot = await get(couplesRef);
      
      if (snapshot.exists()) {
        const couples = snapshot.val();
        for (const [id, data] of Object.entries(couples)) {
          if (id.slice(-6).toUpperCase() === code.toUpperCase()) {
            await AsyncStorage.setItem('@coupleId', id);
            setCoupleId(id);
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Erreur joinCouple:', error);
      return false;
    }
  };

  // ============ SYSTÈME DE JEU EN TEMPS RÉEL ============

  // Créer une session de jeu
  const createGameSession = async (gameType, playerName) => {
    if (!coupleId) {
      console.log('Couple ID non disponible');
      return null;
    }

    // Si Firebase n'est pas configuré, utiliser le mode local
    if (!isFirebaseReady || !database) {
      console.log('Mode local activé - Firebase non configuré');
      const localSession = {
        gameType,
        status: 'ready',
        createdAt: Date.now(),
        createdBy: myPlayerId,
        players: {
          [myPlayerId]: {
            name: playerName,
            ready: true,
            joinedAt: Date.now(),
          }
        },
        currentQuestion: 0,
        answers: {},
      };
      setGameSession(localSession);
      setGameData(localSession);
      setCurrentGame(gameType);
      setPartnerOnline(true); // En mode local, on simule le partenaire
      setWaitingForPartner(false);
      return localSession;
    }

    try {
      const sessionRef = ref(database, `games/${coupleId}/session`);
      const sessionData = {
        gameType,
        status: 'waiting', // waiting, ready, playing, finished
        createdAt: Date.now(),
        createdBy: myPlayerId,
        players: {
          [myPlayerId]: {
            name: playerName,
            ready: true,
            joinedAt: Date.now(),
          }
        },
        currentQuestion: 0,
        answers: {},
      };

      await set(sessionRef, sessionData);
      setCurrentGame(gameType);
      setWaitingForPartner(true);
      
      // Écouter les changements de session
      listenToGameSession();
      
      return sessionData;
    } catch (error) {
      console.error('Erreur création session:', error);
      return null;
    }
  };

  // Rejoindre une session de jeu existante
  const joinGameSession = async (playerName) => {
    if (!coupleId || !database) return null;

    try {
      const sessionRef = ref(database, `games/${coupleId}/session`);
      const snapshot = await get(sessionRef);
      
      if (snapshot.exists()) {
        const session = snapshot.val();
        
        // Ajouter ce joueur à la session
        const playerRef = ref(database, `games/${coupleId}/session/players/${myPlayerId}`);
        await set(playerRef, {
          name: playerName,
          ready: true,
          joinedAt: Date.now(),
        });

        // Mettre à jour le statut si les deux joueurs sont là
        const playersCount = Object.keys(session.players || {}).length + 1;
        if (playersCount >= 2) {
          await update(sessionRef, { status: 'ready' });
        }

        setCurrentGame(session.gameType);
        setWaitingForPartner(false);
        
        listenToGameSession();
        
        return session;
      }
      return null;
    } catch (error) {
      console.error('Erreur jointure session:', error);
      return null;
    }
  };

  // Écouter les changements de session en temps réel
  const listenToGameSession = useCallback(() => {
    // Mode local - pas besoin d'écouter
    if (!isFirebaseReady) {
      return () => {};
    }

    if (!coupleId || !database) return () => {};

    const sessionRef = ref(database, `games/${coupleId}/session`);
    
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setGameSession(data);
        setGameData(data);

        // Vérifier si le partenaire est connecté
        const players = data.players || {};
        const playerIds = Object.keys(players);
        const hasPartner = playerIds.length >= 2;
        setPartnerOnline(hasPartner);

        // Si les deux joueurs sont prêts, le jeu peut commencer
        if (hasPartner && data.status === 'waiting') {
          update(sessionRef, { status: 'ready' });
        }

        setWaitingForPartner(!hasPartner);
      } else {
        setGameSession(null);
        setGameData(null);
        setPartnerOnline(false);
      }
    });

    return () => unsubscribe();
  }, [coupleId, isFirebaseReady]);

  // Soumettre une réponse
  const submitAnswer = async (questionIndex, answer) => {
    // Mode local - mettre à jour l'état local directement
    if (!isFirebaseReady) {
      setGameSession(prev => {
        const newSession = { ...prev };
        if (!newSession.answers) newSession.answers = {};
        if (!newSession.answers[questionIndex]) newSession.answers[questionIndex] = {};
        
        // En mode local, simuler les deux réponses
        newSession.answers[questionIndex][myPlayerId] = {
          answer,
          timestamp: Date.now(),
        };
        // Simuler la réponse du partenaire pour les tests
        newSession.answers[questionIndex]['partner'] = {
          answer: answer, // Même réponse pour simplifier
          timestamp: Date.now(),
        };
        return newSession;
      });
      return;
    }

    if (!coupleId || !database || !myPlayerId) return;

    try {
      const answerRef = ref(database, `games/${coupleId}/session/answers/${questionIndex}/${myPlayerId}`);
      await set(answerRef, {
        answer,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Erreur soumission réponse:', error);
    }
  };

  // Vérifier si les deux joueurs ont répondu à une question
  const checkBothAnswered = (questionIndex) => {
    if (!gameSession?.answers?.[questionIndex]) return false;
    const answers = gameSession.answers[questionIndex];
    return Object.keys(answers).length >= 2;
  };

  // Obtenir les réponses des deux joueurs
  const getBothAnswers = (questionIndex) => {
    if (!gameSession?.answers?.[questionIndex]) return null;
    return gameSession.answers[questionIndex];
  };

  // Passer à la question suivante
  const nextQuestion = async () => {
    // Mode local
    if (!isFirebaseReady) {
      setGameSession(prev => ({
        ...prev,
        currentQuestion: (prev?.currentQuestion || 0) + 1
      }));
      return;
    }

    if (!coupleId || !database) return;

    try {
      const sessionRef = ref(database, `games/${coupleId}/session`);
      const newIndex = (gameSession?.currentQuestion || 0) + 1;
      await update(sessionRef, { currentQuestion: newIndex });
    } catch (error) {
      console.error('Erreur passage question suivante:', error);
    }
  };

  // Terminer la session de jeu
  const endGameSession = async () => {
    // Mode local - juste réinitialiser l'état
    if (!isFirebaseReady) {
      setCurrentGame(null);
      setGameSession(null);
      setGameData(null);
      setWaitingForPartner(false);
      setPartnerOnline(false);
      return;
    }

    if (!coupleId || !database) return;

    try {
      const sessionRef = ref(database, `games/${coupleId}/session`);
      await remove(sessionRef);
      setCurrentGame(null);
      setGameSession(null);
      setGameData(null);
      setWaitingForPartner(false);
      setPartnerOnline(false);
    } catch (error) {
      console.error('Erreur fin session:', error);
    }
  };

  // Vérifier s'il y a une session active
  const checkActiveSession = async () => {
    // Mode local - retourner la session actuelle
    if (!isFirebaseReady) {
      return gameSession;
    }

    if (!coupleId || !database) return null;

    try {
      const sessionRef = ref(database, `games/${coupleId}/session`);
      const snapshot = await get(sessionRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('Erreur vérification session:', error);
      return null;
    }
  };

  // Marquer le joueur comme prêt
  const setPlayerReady = async (ready = true) => {
    // Mode local
    if (!isFirebaseReady) {
      setGameSession(prev => ({
        ...prev,
        players: {
          ...prev?.players,
          [myPlayerId]: { ...prev?.players?.[myPlayerId], ready }
        }
      }));
      return;
    }

    if (!coupleId || !database || !myPlayerId) return;

    try {
      const playerRef = ref(database, `games/${coupleId}/session/players/${myPlayerId}/ready`);
      await set(playerRef, ready);
    } catch (error) {
      console.error('Erreur mise à jour ready:', error);
    }
  };

  // Obtenir le nom du partenaire
  const getPartnerInfo = () => {
    if (!gameSession?.players || !myPlayerId) return null;
    
    const players = gameSession.players;
    for (const [id, data] of Object.entries(players)) {
      if (id !== myPlayerId) {
        return { id, ...data };
      }
    }
    return null;
  };

  // Obtenir mon info
  const getMyInfo = () => {
    if (!gameSession?.players || !myPlayerId) return null;
    return gameSession.players[myPlayerId];
  };

  // Basculer entre mode en ligne et hors ligne
  const toggleOnlineMode = async (online) => {
    setIsOnlineMode(online);
    await AsyncStorage.setItem('@onlineMode', online ? 'true' : 'false');
    
    if (!online) {
      // Mode hors ligne - simuler le partenaire présent
      setPartnerOnline(true);
      setWaitingForPartner(false);
    }
  };

  // Charger le mode au démarrage
  useEffect(() => {
    const loadMode = async () => {
      const mode = await AsyncStorage.getItem('@onlineMode');
      if (mode !== null) {
        setIsOnlineMode(mode === 'true');
      }
    };
    loadMode();
  }, []);

  const value = {
    // État
    coupleId,
    currentGame,
    gameSession,
    gameData,
    partnerOnline,
    myPlayerId,
    waitingForPartner,
    isFirebaseReady,
    isOnlineMode,
    isConnected,
    
    // Fonctions couple
    getCoupleCode,
    joinCouple,
    
    // Fonctions jeu
    createGameSession,
    joinGameSession,
    submitAnswer,
    checkBothAnswered,
    getBothAnswers,
    nextQuestion,
    endGameSession,
    checkActiveSession,
    setPlayerReady,
    getPartnerInfo,
    getMyInfo,
    listenToGameSession,
    toggleOnlineMode,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
