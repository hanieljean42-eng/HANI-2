import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { database, isConfigured } from '../config/firebase';
import { ref, set, onValue, remove, update, push, get, off } from 'firebase/database';
import { useAuth } from './AuthContext';

const GameContext = createContext({});

export const useGame = () => useContext(GameContext);

export function GameProvider({ children }) {
  const { couple: authCouple } = useAuth();
  const [coupleId, setCoupleId] = useState(null);
  const [currentGame, setCurrentGame] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [waitingForPartner, setWaitingForPartner] = useState(false);
  const [gameData, setGameData] = useState(null);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);
  
  // Mode en ligne / hors ligne
  const [isOnlineMode, setIsOnlineMode] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  
  // État pour détecter une invitation de jeu du partenaire
  const [pendingGameInvite, setPendingGameInvite] = useState(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  
  // Références pour gérer les listeners
  const sessionListenerRef = useRef(null);

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

  // ✅ NOUVEAU: Synchroniser coupleId depuis AuthContext automatiquement
  // Quand l'utilisateur crée ou rejoint un couple, AuthContext met à jour authCouple
  // Ce useEffect réagit et met à jour le coupleId dans GameContext
  useEffect(() => {
    if (authCouple?.id && authCouple.id !== coupleId) {
      console.log('🔄 GameContext: coupleId sync depuis AuthContext:', authCouple.id);
      setCoupleId(authCouple.id);
      AsyncStorage.setItem('@coupleId', authCouple.id).catch(e => 
        console.log('⚠️ Erreur sauvegarde coupleId:', e.message)
      );
    }
  }, [authCouple?.id]);

  // ✅ NOUVEAU: Tester la connexion Firebase au démarrage
  useEffect(() => {
    if (isConfigured && database && coupleId) {
      const testFirebaseConnection = async () => {
        try {
          const testRef = ref(database, `.info/connected`);
          const unsubscribe = onValue(testRef, (snapshot) => {
            if (snapshot.val() === true) {
              console.log('✅ Firebase Realtime Database connecté !');
              setFirebaseError(null);
            } else {
              console.log('⚠️ Firebase déconnecté (hors ligne)');
            }
          }, (error) => {
            console.log('❌ Firebase erreur connexion:', error.message);
            setFirebaseError(error.message);
          });
          
          // Tester un read/write sur le chemin games
          const testGameRef = ref(database, `games/${coupleId}/_connectionTest`);
          await set(testGameRef, { timestamp: Date.now(), test: true });
          console.log('✅ Firebase: écriture sur games/ OK');
          // Nettoyer le test
          await remove(testGameRef);
          
          return () => unsubscribe();
        } catch (error) {
          console.log('❌ Firebase: ERREUR écriture sur games/:', error.message);
          console.log('❌ Cause probable: Règles Firebase interdisent l\'accès');
          console.log('❌ Solution: Mettre les règles en mode ouvert ou ajouter le noeud games/');
          setFirebaseError('Règles Firebase bloquent l\'accès aux jeux: ' + error.message);
        }
      };
      testFirebaseConnection();
    }
  }, [coupleId, isConfigured]);
  
  // ✅ LISTENER PERMANENT UNIQUE - Écouter les sessions de jeu quand on a un coupleId
  useEffect(() => {
    // Si on a un listener actif, le fermer d'abord
    if (sessionListenerRef.current) {
      console.log('🔕 Fermeture ancien listener');
      sessionListenerRef.current();
      sessionListenerRef.current = null;
    }

    if (!coupleId || !isFirebaseReady || !database || !myPlayerId) return;
    
    console.log('🎮 Démarrage listener permanent pour:', coupleId);
    const sessionRef = ref(database, `games/${coupleId}/session`);
    
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('📥 Session mise à jour:', data.gameType, 'status:', data.status);
        
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
        
        // Si les deux joueurs sont là, mettre à jour le statut (seul le créateur le fait pour éviter le double-write)
        if (hasPartner && data.status === 'waiting' && isMySession) {
          update(sessionRef, { status: 'ready' }).then(() => {
            console.log('✅ Session prête!');
          }).catch(e => console.log('⚠️ Erreur update status:', e.message));
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
    
    // ✅ Stocker la référence pour cleanup ultérieur
    sessionListenerRef.current = unsubscribe;
    
    return () => {
      console.log('🔕 Cleanup listener permanent');
      if (sessionListenerRef.current) {
        sessionListenerRef.current();
        sessionListenerRef.current = null;
      }
    };
  }, [coupleId, isFirebaseReady, myPlayerId]);

  const loadCoupleId = async () => {
    try {
      // D'abord essayer de récupérer depuis le couple existant (priorité)
      const storedCouple = await AsyncStorage.getItem('@couple');
      if (storedCouple) {
        const couple = JSON.parse(storedCouple);
        if (couple.id) {
          console.log('✅ CoupleId chargé depuis @couple:', couple.id);
          setCoupleId(couple.id);
          // Sauvegarder aussi dans @coupleId pour compatibilité
          await AsyncStorage.setItem('@coupleId', couple.id);
          return couple.id;
        }
      }
      
      // Sinon essayer @coupleId
      const id = await AsyncStorage.getItem('@coupleId');
      if (id) {
        console.log('✅ CoupleId chargé depuis @coupleId:', id);
        setCoupleId(id);
        return id;
      }
      
      // NE PAS générer un nouvel ID - attendre que l'utilisateur crée/rejoigne un couple
      console.log('⚠️ Aucun coupleId trouvé - en attente de création/jonction de couple');
      return null;
    } catch (error) {
      console.error('Erreur chargement coupleId:', error);
      return null;
    }
  };
  
  // Mettre à jour le coupleId quand le couple change
  const updateCoupleId = async (newCoupleId) => {
    if (newCoupleId && newCoupleId !== coupleId) {
      console.log('🔄 Mise à jour coupleId:', newCoupleId);
      setCoupleId(newCoupleId);
      await AsyncStorage.setItem('@coupleId', newCoupleId);
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
    // Toujours recharger le coupleId depuis le stockage pour s'assurer qu'on a le bon
    let currentCoupleId = null;
    
    // Priorité 1: depuis @couple
    const storedCouple = await AsyncStorage.getItem('@couple');
    if (storedCouple) {
      const couple = JSON.parse(storedCouple);
      if (couple.id) {
        currentCoupleId = couple.id;
        console.log('🔄 CoupleId rechargé depuis @couple:', currentCoupleId);
      }
    }
    
    // Priorité 2: depuis @coupleId
    if (!currentCoupleId) {
      currentCoupleId = await AsyncStorage.getItem('@coupleId');
      console.log('🔄 CoupleId rechargé depuis @coupleId:', currentCoupleId);
    }
    
    // Priorité 3: utiliser l'état actuel
    if (!currentCoupleId) {
      currentCoupleId = coupleId;
    }
    
    if (!currentCoupleId) {
      console.log('❌ Couple ID non disponible - assurez-vous d\'avoir rejoint un couple');
      return { error: 'Vous devez d\'abord créer ou rejoindre un couple' };
    }
    
    // Mettre à jour l'état si nécessaire
    if (currentCoupleId !== coupleId) {
      setCoupleId(currentCoupleId);
      await AsyncStorage.setItem('@coupleId', currentCoupleId);
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
      setPartnerOnline(true); // En mode local, on simule le partenaire
      setWaitingForPartner(false);
      return localSession;
    }

    try {
      // D'abord supprimer toute session existante
      const sessionRef = ref(database, `games/${currentCoupleId}/session`);
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

      console.log('🎮 Création session pour:', currentCoupleId, 'par:', myPlayerId);
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
    // Toujours recharger le coupleId depuis le stockage pour s'assurer qu'on a le bon
    let currentCoupleId = null;
    
    // Priorité 1: depuis @couple
    const storedCouple = await AsyncStorage.getItem('@couple');
    if (storedCouple) {
      const couple = JSON.parse(storedCouple);
      if (couple.id) {
        currentCoupleId = couple.id;
        console.log('🔄 CoupleId rechargé depuis @couple:', currentCoupleId);
      }
    }
    
    // Priorité 2: depuis @coupleId
    if (!currentCoupleId) {
      currentCoupleId = await AsyncStorage.getItem('@coupleId');
      console.log('🔄 CoupleId rechargé depuis @coupleId:', currentCoupleId);
    }
    
    // Priorité 3: utiliser l'état actuel
    if (!currentCoupleId) {
      currentCoupleId = coupleId;
    }
    
    if (!currentCoupleId) {
      console.log('❌ Couple ID non disponible - assurez-vous d\'avoir rejoint un couple');
      return { error: 'Vous devez d\'abord rejoindre un couple avec le code de votre partenaire' };
    }
    
    // Mettre à jour l'état si nécessaire
    if (currentCoupleId !== coupleId) {
      setCoupleId(currentCoupleId);
    }

    if (!database) {
      console.log('❌ Firebase non disponible');
      return { error: 'Connexion au serveur impossible' };
    }

    try {
      console.log('🔍 Recherche session pour coupleId:', currentCoupleId);
      const sessionRef = ref(database, `games/${currentCoupleId}/session`);
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
        const playerRef = ref(database, `games/${currentCoupleId}/session/players/${myPlayerId}`);
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

        // ✅ Re-lire la session APRÈS les modifications pour avoir les données à jour
        const freshSnapshot = await get(sessionRef);
        const freshSession = freshSnapshot.exists() ? freshSnapshot.val() : session;
        
        setCurrentGame(freshSession.gameType);
        setGameSession(freshSession);
        setGameData(freshSession);
        
        return freshSession;
      } else {
        console.log('❌ Aucune session trouvée pour:', currentCoupleId);
        return { error: 'Votre partenaire n\'a pas encore créé de partie. Demandez-lui de créer une partie d\'abord!' };
      }
    } catch (error) {
      console.error('❌ Erreur jointure session:', error);
      return { error: 'Erreur de connexion: ' + error.message };
    }
  };

  // Écouter les changements de session en temps réel
  // ✅ FONCTION SUPPRIMÉE - Le listener permanent suffit !
  // Cette fonction créait un double listener (bug #1)
  // Le listener permanent (useEffect ligne 60) gère déjà tout

  // ✅ RESTRUCTURÉ: Soumettre une réponse (COHÉRENT pour tous les types)
  const submitAnswer = async (answerKey, answerData, playerName = null) => {
    // answerKey: peut être "0" (quiz), "tod_question_0" (vérité question), "tod_response_0" (vérité réponse)
    // answerData: objet avec {answer, response, type, text, ...} ou string simple
    // playerName: le nom du joueur qui répond
    
    // Mode local - mettre à jour l'état local directement
    if (!isFirebaseReady) {
      setGameSession(prev => {
        const newSession = { ...prev };
        if (!newSession.answers) newSession.answers = {};
        if (!newSession.answers[answerKey]) newSession.answers[answerKey] = {};
        
        // En mode local, ajouter la réponse
        const playerId = myPlayerId;
        newSession.answers[answerKey][playerId] = {
          ...answerData,
          timestamp: Date.now(),
          playerName: playerName || 'Joueur',
          playerId,
        };
        
        // En mode local, simuler la réponse du partenaire (pour tests)
        newSession.answers[answerKey]['partner_' + playerId] = {
          ...answerData,
          timestamp: Date.now(),
          playerName: 'Partenaire',
          playerId: 'partner_' + playerId,
        };
        
        return newSession;
      });
      return true;
    }

    if (!coupleId || !database || !myPlayerId) {
      // ✅ Tenter de recharger coupleId depuis AsyncStorage
      let reloadedCoupleId = null;
      try {
        const storedCouple = await AsyncStorage.getItem('@couple');
        if (storedCouple) {
          const couple = JSON.parse(storedCouple);
          if (couple.id) reloadedCoupleId = couple.id;
        }
        if (!reloadedCoupleId) {
          reloadedCoupleId = await AsyncStorage.getItem('@coupleId');
        }
        if (reloadedCoupleId) {
          setCoupleId(reloadedCoupleId);
        }
      } catch (e) {
        console.log('❌ Erreur rechargement coupleId:', e.message);
      }
      
      if ((!coupleId && !reloadedCoupleId) || !database || !myPlayerId) {
        console.log('❌ Impossible de soumettre: coupleId, database ou myPlayerId manquant');
        return false;
      }
    }

    // ✅ Utiliser le coupleId le plus récent
    const effectiveCoupleId = coupleId || (await AsyncStorage.getItem('@coupleId'));

    try {
      console.log('📤 Soumission réponse:', { answerKey, answerData, myPlayerId, effectiveCoupleId });
      
      // ✅ PATH COHÉRENT pour tous les types:
      // games/{coupleId}/session/answers/{answerKey}/{myPlayerId}
      const answerRef = ref(database, `games/${effectiveCoupleId}/session/answers/${answerKey}/${myPlayerId}`);
      await set(answerRef, {
        ...answerData,
        timestamp: Date.now(),
        playerName: playerName || 'Joueur',
        playerId: myPlayerId,
      });
      
      console.log('✅ Réponse soumise avec succès à:', answerKey);
      return true;
    } catch (error) {
      console.error('❌ Erreur soumission réponse:', error);
      return false;
    }
  };

  // ✅ AMÉLIORÉ: Vérifier si les deux joueurs ont répondu à une question
  const checkBothAnswered = (answerKey) => {
    // Utiliser gameData qui est mis à jour en temps réel via Firebase
    const sessionData = gameData || gameSession;
    if (!sessionData?.answers?.[answerKey]) return false;
    
    const answers = sessionData.answers[answerKey];
    const answerCount = Object.keys(answers).length;
    
    console.log(`📊 Clé ${answerKey}: ${answerCount} réponse(s)`, Object.keys(answers));
    
    // Besoin d'au moins 2 réponses de joueurs DIFFÉRENTS
    // (Exclure les fausses réponses 'partner_xxx' en mode local)
    const realAnswers = Object.entries(answers).filter(([playerId, data]) => {
      return !playerId.startsWith('partner_') && playerId !== 'partner';
    });
    
    return realAnswers.length >= 2;
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

  // Attendre que le partenaire réponde (réactif via gameData au lieu de polling)
  const waitForPartnerAnswer = async (questionIndex, timeoutMs = 60000) => {
    // Vérification immédiate
    if (checkBothAnswered(questionIndex)) return true;
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // Utiliser un listener Firebase direct au lieu de polling
      if (isFirebaseReady && database && coupleId) {
        const answerRef = ref(database, `games/${coupleId}/session/answers/${questionIndex}`);
        const unsubscribe = onValue(answerRef, (snapshot) => {
          if (snapshot.exists()) {
            const answers = snapshot.val();
            const realAnswers = Object.keys(answers).filter(id => !id.startsWith('partner_'));
            if (realAnswers.length >= 2) {
              unsubscribe();
              resolve(true);
            }
          }
        });
        
        // Timeout de sécurité
        setTimeout(() => {
          unsubscribe();
          resolve(false);
        }, timeoutMs);
      } else {
        // Mode local - vérifier périodiquement
        const checkInterval = setInterval(() => {
          if (checkBothAnswered(questionIndex)) {
            clearInterval(checkInterval);
            resolve(true);
          } else if (Date.now() - startTime > timeoutMs) {
            clearInterval(checkInterval);
            resolve(false);
          }
        }, 500);
      }
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

  // ✅ NOUVEAU: Nettoyer les réponses Firebase sans détruire la session (pour "Rejouer")
  const clearGameAnswers = async () => {
    if (!isFirebaseReady || !database || !coupleId) return;
    
    try {
      const answersRef = ref(database, `games/${coupleId}/session/answers`);
      await remove(answersRef);
      console.log('🗑️ Réponses Firebase nettoyées pour rejouer');
    } catch (error) {
      console.error('❌ Erreur nettoyage réponses:', error);
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
    firebaseError,
    
    // Nouveaux états pour invitations
    pendingGameInvite,
    hasActiveSession,
    
    // Fonctions couple
    getCoupleCode,
    joinCouple,
    updateCoupleId,
    
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
    clearGameAnswers,
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
