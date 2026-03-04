import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database, isConfigured } from '../config/firebase';
import { ref, set, onValue, remove, update, push, get, off } from 'firebase/database';
import { useAuth } from './AuthContext';

const GameContext = createContext({});

export const useGame = () => useContext(GameContext);

export function GameProvider({ children }) {
  const { couple, user, isOnline } = useAuth();
  const coupleId = couple?.id || null;
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
  
  // Référence pour éviter les doubles listeners
  const sessionListenerRef = useRef(null);
  
  // État pour détecter une invitation de jeu du partenaire
  const [pendingGameInvite, setPendingGameInvite] = useState(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  // Charger le playerId et vérifier Firebase au démarrage
  useEffect(() => {
    generatePlayerId();
    setIsFirebaseReady(isConfigured && database !== null);
  }, []);
  
  // Écouter automatiquement les sessions de jeu quand on a un coupleId
  useEffect(() => {
    if (!coupleId || !isFirebaseReady || !database || !myPlayerId) return;
    
    console.log('🎮 Démarrage écoute permanente des sessions pour:', coupleId);
    const sessionRef = ref(database, `games/${coupleId}/session`);
    
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('📥 Session détectée:', data.gameType, 'status:', data.status);
        
        setGameSession(data);
        setGameData(data);
        setHasActiveSession(true);
        
        // Vérifier les joueurs
        const players = data.players || {};
        const playerIds = Object.keys(players);
        const hasPartner = playerIds.length >= 2;
        const isMySession = data.createdBy === myPlayerId;
        const imInSession = playerIds.includes(myPlayerId);
        
        setPartnerOnline(hasPartner);
        setWaitingForPartner(!hasPartner && isMySession);
        
        // Détecter une invitation du partenaire (session créée par quelqu'un d'autre et je n'y suis pas)
        if (!isMySession && !imInSession && data.status === 'waiting') {
          console.log('📨 Invitation de jeu détectée!');
          setPendingGameInvite({
            gameType: data.gameType,
            createdBy: data.createdBy,
            creatorName: players[data.createdBy]?.name || 'Partenaire',
          });
        } else {
          setPendingGameInvite(null);
        }
        
        // Si les deux joueurs sont là, mettre à jour le statut
        if (hasPartner && data.status === 'waiting') {
          update(sessionRef, { status: 'ready' }).then(() => {
            console.log('✅ Session prête!');
          });
        }
      } else {
        console.log('📭 Pas de session active');
        setGameSession(null);
        setGameData(null);
        setHasActiveSession(false);
        setPendingGameInvite(null);
        setPartnerOnline(false);
        setWaitingForPartner(false);
      }
    });
    
    sessionListenerRef.current = unsubscribe;
    
    return () => {
      console.log('🔕 Arrêt écoute permanente');
      unsubscribe();
      sessionListenerRef.current = null;
    };
  }, [coupleId, isFirebaseReady, myPlayerId]);

  // Utiliser isOnline de AuthContext
  useEffect(() => {
    setIsConnected(isOnline);
  }, [isOnline]);

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

  // ============ SYSTÈME DE JEU EN TEMPS RÉEL ============

  // Créer une session de jeu
  const createGameSession = async (gameType, playerName) => {
    if (!coupleId) {
      console.log('❌ Couple ID non disponible - assurez-vous d\'avoir rejoint un couple');
      return { error: 'Vous devez d\'abord créer ou rejoindre un couple' };
    }

    // Si Firebase n'est pas configuré, utiliser le mode local
    if (!isFirebaseReady || !database) {
      console.log('⚠️ Mode local activé - Firebase non configuré');
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
      setPartnerOnline(true);
      setWaitingForPartner(false);
      return localSession;
    }

    try {
      const sessionRef = ref(database, `games/${coupleId}/session`);
      await remove(sessionRef);
      console.log('🗑️ Ancienne session supprimée');
      
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

      console.log('🎮 Création session pour:', coupleId, 'par:', myPlayerId);
      await set(sessionRef, sessionData);
      setCurrentGame(gameType);
      setWaitingForPartner(true);
      setPartnerOnline(false);
      setGameSession(sessionData);
      setGameData(sessionData);
      
      console.log('✅ Session créée avec succès - en attente du partenaire');
      return sessionData;
    } catch (error) {
      console.error('❌ Erreur création session:', error);
      return { error: 'Erreur: ' + error.message };
    }
  };

  // Rejoindre une session de jeu existante
  const joinGameSession = async (playerName) => {
    if (!coupleId) {
      console.log('❌ Couple ID non disponible - assurez-vous d\'avoir rejoint un couple');
      return { error: 'Vous devez d\'abord rejoindre un couple avec le code de votre partenaire' };
    }

    if (!database) {
      console.log('❌ Firebase non disponible');
      return { error: 'Connexion au serveur impossible' };
    }

    try {
      console.log('🔍 Recherche session pour coupleId:', coupleId);
      const sessionRef = ref(database, `games/${coupleId}/session`);
      const snapshot = await get(sessionRef);
      
      if (snapshot.exists()) {
        const session = snapshot.val();
        console.log('🎮 Session trouvée:', session.gameType, 'status:', session.status, 'createdBy:', session.createdBy);
        
        // Vérifier si je suis déjà dans la session
        if (session.players && session.players[myPlayerId]) {
          console.log('ℹ️ Déjà dans la session');
          setCurrentGame(session.gameType);
          setGameSession(session);
          setGameData(session);
          return session;
        }
        
        // Ajouter ce joueur à la session
        const playerRef = ref(database, `games/${coupleId}/session/players/${myPlayerId}`);
        await set(playerRef, {
          name: playerName,
          ready: true,
          joinedAt: Date.now(),
        });
        console.log('✅ Joueur ajouté à la session');

        // Mettre à jour le statut si les deux joueurs sont là
        const playersCount = Object.keys(session.players || {}).length + 1;
        console.log('👥 Nombre de joueurs:', playersCount);
        
        if (playersCount >= 2) {
          await update(sessionRef, { status: 'ready' });
          console.log('✅ Statut mis à jour: ready');
          setWaitingForPartner(false);
          setPartnerOnline(true);
        }

        setCurrentGame(session.gameType);
        setGameSession(session);
        setGameData(session);
        
        return session;
      } else {
        console.log('❌ Aucune session trouvée pour:', currentCoupleId);
        return { error: 'Votre partenaire n\'a pas encore créé de partie. Demandez-lui de créer une partie d\'abord!' };
      }
    } catch (error) {
      console.error('❌ Erreur jointure session:', error);
      return { error: 'Erreur de connexion: ' + error.message };
    }
  };

  // Soumettre une réponse
  const submitAnswer = async (questionIndex, answer, playerName = null) => {
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
          playerName: playerName || 'Joueur',
        };
        // Simuler la réponse du partenaire pour les tests
        newSession.answers[questionIndex]['partner'] = {
          answer: answer, // Même réponse pour simplifier
          timestamp: Date.now(),
          playerName: 'Partenaire',
        };
        return newSession;
      });
      return true;
    }

    if (!coupleId || !database || !myPlayerId) {
      console.log('❌ Impossible de soumettre: coupleId, database ou myPlayerId manquant');
      return false;
    }

    try {
      console.log('📤 Soumission réponse:', { questionIndex, answer, myPlayerId });
      
      const answerRef = ref(database, `games/${coupleId}/session/answers/${questionIndex}/${myPlayerId}`);
      await set(answerRef, {
        answer,
        timestamp: Date.now(),
        playerName: playerName || 'Joueur',
        playerId: myPlayerId,
      });
      
      console.log('✅ Réponse soumise avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur soumission réponse:', error);
      return false;
    }
  };

  // Vérifier si les deux joueurs ont répondu à une question
  const checkBothAnswered = (questionIndex) => {
    // Utiliser gameData qui est mis à jour en temps réel via Firebase
    const sessionData = gameData || gameSession;
    if (!sessionData?.answers?.[questionIndex]) return false;
    const answers = sessionData.answers[questionIndex];
    const answerCount = Object.keys(answers).length;
    console.log(`📊 Question ${questionIndex}: ${answerCount} réponse(s)`);
    return answerCount >= 2;
  };

  // Obtenir les réponses des deux joueurs
  const getBothAnswers = (questionIndex) => {
    // Utiliser gameData qui est mis à jour en temps réel via Firebase
    const sessionData = gameData || gameSession;
    if (!sessionData?.answers?.[questionIndex]) return null;
    return sessionData.answers[questionIndex];
  };

  // Obtenir ma réponse pour une question
  const getMyAnswer = (questionIndex) => {
    const sessionData = gameData || gameSession;
    if (!sessionData?.answers?.[questionIndex]) return null;
    return sessionData.answers[questionIndex][myPlayerId];
  };

  // Vérifier si j'ai déjà répondu à une question
  const hasMyAnswer = (questionIndex) => {
    return getMyAnswer(questionIndex) !== null && getMyAnswer(questionIndex) !== undefined;
  };

  // Attendre que le partenaire réponde (avec timeout)
  const waitForPartnerAnswer = async (questionIndex, timeoutMs = 60000) => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkInterval = setInterval(() => {
        if (checkBothAnswered(questionIndex)) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (Date.now() - startTime > timeoutMs) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 500); // Vérifier toutes les 500ms
    });
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
    
    // Nouveaux états pour invitations
    pendingGameInvite,
    hasActiveSession,
    
    // Fonctions jeu
    createGameSession,
    joinGameSession,
    submitAnswer,
    checkBothAnswered,
    getBothAnswers,
    getMyAnswer,
    hasMyAnswer,
    waitForPartnerAnswer,
    nextQuestion,
    endGameSession,
    checkActiveSession,
    setPlayerReady,
    getPartnerInfo,
    getMyInfo,
    toggleOnlineMode,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
