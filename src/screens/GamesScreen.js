import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { useNotifyPartner } from '../hooks/useNotifyPartner';

const { width } = Dimensions.get('window');

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Quel est mon plat préféré ?",
    type: "open",
  },
  {
    id: 2,
    question: "Où avons-nous eu notre premier rendez-vous ?",
    type: "open",
  },
  {
    id: 3,
    question: "Quelle est ma couleur préférée ?",
    type: "choice",
    options: ["Rouge", "Bleu", "Vert", "Violet", "Rose", "Noir"],
  },
  {
    id: 4,
    question: "Quel est mon film préféré ?",
    type: "open",
  },
  {
    id: 5,
    question: "Qu'est-ce qui me fait le plus rire ?",
    type: "open",
  },
  {
    id: 6,
    question: "Où aimerais-je voyager le plus ?",
    type: "open",
  },
  {
    id: 7,
    question: "Quelle est ma plus grande peur ?",
    type: "open",
  },
  {
    id: 8,
    question: "Quel super-pouvoir je voudrais avoir ?",
    type: "choice",
    options: ["Voler", "Invisible", "Téléportation", "Lire les pensées", "Super force", "Contrôler le temps"],
  },
  {
    id: 9,
    question: "Quel est mon rêve le plus fou ?",
    type: "open",
  },
  {
    id: 10,
    question: "Qu'est-ce qui me rend le plus heureux/heureuse ?",
    type: "open",
  },
  {
    id: 11,
    question: "Quel est mon plus beau souvenir avec toi ?",
    type: "open",
  },
  {
    id: 12,
    question: "Quel artiste ou musicien j'aime le plus ?",
    type: "open",
  },
  {
    id: 13,
    question: "Quel type d'animal j'aimerais avoir ?",
    type: "choice",
    options: ["Chat", "Chien", "Oiseau", "Poisson", "Aucun", "Autre"],
  },
  {
    id: 14,
    question: "Quelle est ma saison préférée ?",
    type: "choice",
    options: ["Printemps", "Été", "Automne", "Hiver"],
  },
  {
    id: 15,
    question: "Quel est mon nombre porte-bonheur ?",
    type: "open",
  },
  {
    id: 16,
    question: "Quel hobby je pratique le plus souvent ?",
    type: "open",
  },
  {
    id: 17,
    question: "Quelle est ma plus grande qualité selon moi ?",
    type: "open",
  },
  {
    id: 18,
    question: "Si j'avais un jour de libre, je ferais quoi ?",
    type: "open",
  },
  {
    id: 19,
    question: "Quel est mon plus grand rêve professionnel ?",
    type: "open",
  },
  {
    id: 20,
    question: "Quel moment avec toi je voudrais revivre ?",
    type: "open",
  },
];

const TRUTH_OR_DARE = {
  truths: [
    // Vérités Classiques Couple
    "Qu'est-ce que tu préfères le plus chez moi ?",
    "Quel moment avec moi t'a le plus marqué ?",
    "C'est quoi ton souvenir le plus drôle de nous deux ?",
    "Qu'est-ce que je fais qui te fait craquer direct ?",
    "Si tu pouvais changer une chose dans notre couple, ce serait quoi ?",
    "Tu te souviens de notre premier moment gênant ?",
    "Quelle est ta plus grande peur dans notre relation ?",
    "Qu'est-ce que tu veux qu'on fasse ensemble cette année ?",
    "Quel surnom tu préfères que je te donne ?",
    "Tu es fier/fière de quoi chez moi ?",
    "Quel est ton moment préféré quand on est seuls ?",
    "Qu'est-ce que je fais mieux que tout le monde pour toi ?",
    "Tu préfères qu'on sorte ou qu'on reste à la maison ensemble ?",
    "Quel est ton rêve de couple idéal ?",
    "Qu'est-ce que tu aimerais que je fasse plus souvent ?",
    "Quel est le plus beau compliment que tu m'as jamais fait ?",
    "Si on partait demain, tu voudrais aller où avec moi ?",
    "Qu'est-ce qui te rassure le plus chez moi ?",
    "Tu te vois avec moi dans 5 ans ?",
    "Quelle est la chose la plus romantique que je pourrais faire ?",
    "C'est quoi ton moment préféré quand je suis jaloux/jalouse ?",
    "Tu préfères qu'on se taquine ou qu'on soit sérieux ?",
    "Quelle habitude chez moi te fait sourire ?",
    "Tu aimerais qu'on vive où ensemble ?",
    "Quel est ton plus grand objectif avec moi ?",
    // Vérités Intimes (18+)
    "Quel est ton fantasme secret avec moi ?",
    "Qu'est-ce qui t'excite le plus chez moi ?",
    "Quel est l'endroit le plus fou où tu voudrais qu'on soit intimes ?",
    "Quelle tenue tu voudrais me voir porter ?",
    "Quel est ton meilleur souvenir intime avec moi ?",
    "Qu'est-ce que tu n'as jamais osé me demander au lit ?",
    "Quel moment de la journée tu préfères pour les câlins intimes ?",
    "Tu préfères la tendresse ou la passion ?",
    "Qu'est-ce qui te fait le plus d'effet quand je te touche ?",
    "Quel est le geste intime que tu préfères que je fasse ?",
    "As-tu déjà pensé à moi de façon coquine au travail/en cours ?",
    "Quel est ton point sensible préféré ?",
    "Tu préfères les préliminaires longs ou aller droit au but ?",
    "Quelle est ta position préférée avec moi ?",
    "Qu'est-ce qui t'a le plus surpris(e) chez moi intimement ?",
  ],
  dares: [
    // Actions Classiques Couple
    "Fais-moi un câlin de 20 secondes.",
    "Dis-moi 3 choses que tu aimes chez moi.",
    "Fais-moi un bisou sur le front.",
    "Danse avec moi 30 secondes, même sans musique.",
    "Fais une déclaration d'amour version drôle.",
    "Donne-moi un surnom nouveau maintenant.",
    "Écris 'je t'aime' d'une manière originale.",
    "Fais-moi rire tout de suite.",
    "Regarde-moi dans les yeux 15 secondes sans parler.",
    "Fais un compliment très précis sur moi.",
    "Fais semblant de me demander en mariage (juste pour rire).",
    "Prends une photo de nous deux maintenant.",
    "Choisis notre prochaine sortie en amoureux.",
    "Fais-moi une promesse mignonne.",
    "Fais une imitation de moi.",
    "Dis-moi une phrase romantique comme dans un film.",
    "Donne-moi un bisou surprise.",
    "Chuchote-moi un truc gentil.",
    "Fais un petit massage des épaules 1 minute.",
    "Mets une chanson qui nous représente.",
    "Fais une mini scène 'couple de film' pendant 20 sec.",
    "Dis-moi ton meilleur souvenir de nous en 1 phrase.",
    "Fais un bisou sur la main.",
    "Dis 'je suis chanceux(se) de t'avoir' avec sérieux.",
    // Actions Intimes (18+)
    "Fais-moi un bisou dans le cou.",
    "Murmure-moi quelque chose de coquin à l'oreille.",
    "Enlève un vêtement au choix.",
    "Fais-moi un massage sensuel de 2 minutes.",
    "Embrasse-moi comme si c'était notre premier baiser.",
    "Caresse-moi le visage pendant 30 secondes.",
    "Dis-moi ce que tu vas me faire ce soir.",
    "Fais-moi un slow très collé-serré.",
    "Embrasse une partie de mon corps de ton choix.",
    "Déshabille-moi du regard pendant 20 secondes.",
    "Montre-moi comment tu aimes être embrassé(e).",
    "Fais-moi un câlin très serré en me caressant le dos.",
    "Dis-moi ton plus grand désir avec moi ce soir.",
    "Mordille-moi légèrement l'oreille.",
    "Guide ma main où tu veux.",
  ],
};

const WHO_IS_MORE = [
  "Qui est le/la plus romantique ?",
  "Qui ronfle le plus ?",
  "Qui est le/la plus jaloux/jalouse ?",
  "Qui fait le plus de bêtises ?",
  "Qui dit 'je t'aime' en premier ?",
  "Qui est le/la plus têtu(e) ?",
  "Qui cuisine le mieux ?",
  "Qui oublie le plus les dates importantes ?",
  "Qui est le/la plus drôle ?",
  "Qui est le/la plus câlin(e) ?",
  "Qui s'endort en premier ?",
  "Qui prend le plus de temps pour se préparer ?",
  "Qui est le/la plus désordre ?",
  "Qui est le/la plus sportif/sportive ?",
  "Qui est le/la plus stressé(e) ?",
  "Qui contrôle le plus la télécommande ?",
  "Qui est le/la plus emo ?",
  "Qui aime le plus les animaux ?",
  "Qui a le plus d'amis ?",
  "Qui est le/la plus heureux/heureuse maintenant ?",
  "Qui est le/la plus patient(e) ?",
  "Qui est le/la plus aventurier/aventurière ?",
  "Qui est le/la plus gourmand(e) ?",
  "Qui est le/la plus matinal(e) ?",
  "Qui est le/la plus extravagant(e) en dépenses ?",
  "Qui me connaît le mieux ?",
  "Qui est le/la plus jaloux/jalouse au lit ?",
  "Qui est le/la plus passionné(e) ?",
  "Qui est le/la plus attentionné(e) ?",
  "Qui nous aime le plus ?",
];

const WOULD_YOU_RATHER = [
  {
    option1: "Voyager ensemble pour toujours sans maison fixe",
    option2: "Avoir la maison de nos rêves mais ne jamais voyager",
  },
  {
    option1: "Lire toutes les pensées de ton/ta partenaire",
    option2: "Que ton/ta partenaire lise toutes tes pensées",
  },
  {
    option1: "Revoir notre premier rendez-vous",
    option2: "Voir notre futur ensemble dans 10 ans",
  },
  {
    option1: "Ne jamais pouvoir se disputer",
    option2: "Toujours se réconcilier de la meilleure façon",
  },
  {
    option1: "Avoir un super-pouvoir mais le cacher",
    option2: "Être normal mais célèbre",
  },
  {
    option1: "Un petit-déjeuner au lit tous les matins",
    option2: "Un dîner romantique chaque semaine",
  },
  {
    option1: "Vivre 1000 ans sans ton/ta partenaire",
    option2: "Vivre 50 ans ensemble",
  },
  {
    option1: "Perdre tous nos souvenirs ensemble et recommencer",
    option2: "Garder nos souvenirs mais ne plus créer de nouveaux",
  },
  {
    option1: "Être incroyablement riche mais très occupé",
    option2: "Avoir peu d'argent mais tout le temps ensemble",
  },
  {
    option1: "Connaître la date exacte de notre mariage futur",
    option2: "Être surpris(e) quand ça arrivera",
  },
];

export default function GamesScreen() {
  const { user, couple, partner } = useAuth();
  const { notifyGame, notifyGameAnswer, notifyGameWin } = useNotifyPartner();
  const { 
    createGameSession, 
    joinGameSession, 
    gameSession, 
    waitingForPartner, 
    partnerOnline,
    endGameSession,
    submitAnswer,
    checkBothAnswered,
    getBothAnswers,
    getMyAnswer,
    hasMyAnswer,
    gameData,
    nextQuestion: nextGameQuestion,
    isFirebaseReady,
    pendingGameInvite,
    hasActiveSession,
    updateCoupleId,
    coupleId,
  } = useGame();

  const [activeGame, setActiveGame] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [showResult, setShowResult] = useState(false);
  const [truthOrDare, setTruthOrDare] = useState(null);
  const [wyrChoice, setWyrChoice] = useState(null);
  const [quizPhase, setQuizPhase] = useState('player1'); // 'player1', 'player2', 'reveal'
  const [player1Answer, setPlayer1Answer] = useState(null);
  const [player2Answer, setPlayer2Answer] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  
  // États pour Action/Vérité TOUR PAR TOUR
  const [todResponse, setTodResponse] = useState('');
  const [todSubmitted, setTodSubmitted] = useState(false);
  const [todRound, setTodRound] = useState(0);
  const [todCurrentPlayer, setTodCurrentPlayer] = useState(null); // qui doit répondre
  const [todPhase, setTodPhase] = useState('choose'); // 'choose', 'waiting', 'answer', 'view'
  const [todAsker, setTodAsker] = useState(null); // qui pose la question (c'est lui qui commence)
  const [todAnswerer, setTodAnswerer] = useState(null); // qui doit répondre
  const [todHistory, setTodHistory] = useState([]); // historique des réponses du tour
  const [isMyTurnToAsk, setIsMyTurnToAsk] = useState(true); // est-ce mon tour de poser?
  const [todPartnerResponse, setTodPartnerResponse] = useState(null); // ✅ NOUVEAU: Réponse du partenaire en temps réel
  
  // États pour "Qui est le Plus" TOUR PAR TOUR
  const [wimPhase, setWimPhase] = useState('player1'); // 'player1', 'passPhone', 'player2', 'reveal'
  const [wimPlayer1Answer, setWimPlayer1Answer] = useState(null);
  const [wimPlayer2Answer, setWimPlayer2Answer] = useState(null);
  
  // États pour "Tu Préfères" TOUR PAR TOUR  
  const [wyrPhase, setWyrPhase] = useState('player1'); // 'player1', 'passPhone', 'player2', 'reveal'
  const [wyrPlayer1Choice, setWyrPlayer1Choice] = useState(null);
  const [wyrPlayer2Choice, setWyrPlayer2Choice] = useState(null)
  
  // États pour le mode multijoueur à distance
  const [showLobby, setShowLobby] = useState(false);
  const [selectedGameForLobby, setSelectedGameForLobby] = useState(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [gameMode, setGameMode] = useState(null); // 'local' ou 'online'
  const [showInviteModal, setShowInviteModal] = useState(false);

  // ========== ALERTE VERSION - TEST ==========
  useEffect(() => {
    Alert.alert(
      '🚀 VERSION 3.0.0',
      'Cette popup confirme que vous avez la NOUVELLE version !\n\n✅ Jeux à distance\n✅ 35 Vérités + 39 Actions\n✅ Contenu adulte',
      [{ text: 'Super !', style: 'default' }]
    );
  }, []);
  // ============================================

  // Synchroniser le coupleId avec le couple de l'AuthContext
  useEffect(() => {
    if (couple?.id && couple.id !== coupleId) {
      console.log('🔄 Synchronisation coupleId:', couple.id);
      updateCoupleId(couple.id);
    }
  }, [couple?.id, coupleId, updateCoupleId]);

  // Détecter les invitations de jeu du partenaire
  useEffect(() => {
    if (pendingGameInvite && !activeGame && !showLobby) {
      console.log('📨 Affichage invitation:', pendingGameInvite);
      setShowInviteModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [pendingGameInvite, activeGame, showLobby]);

  // Surveiller les changements de session pour le mode en ligne
  useEffect(() => {
    if (gameSession && gameMode === 'online') {
      if (gameSession.status === 'ready' && !waitingForPartner) {
        // Les deux joueurs sont là, démarrer le jeu
        setShowLobby(false);
        setShowInviteModal(false);
        setActiveGame(gameSession.gameType);
      }
    }
  }, [gameSession, waitingForPartner, gameMode]);

  // ✅ NOUVEAU: Écouter les réponses du partenaire en Vérité/Action (bug #5)
  useEffect(() => {
    if (activeGame !== 'truthordare' || gameMode !== 'online' || !isFirebaseReady) return;
    
    // Si on est en phase d'attente (questioner attend la réponse)
    if (todPhase === 'waiting' || (todSubmitted && !todResponse?.trim())) {
      console.log(`👂 Écoute réponse partenaire pour tour ${todRound}...`);
      
      // Écouter la réponse du partenaire
      const responseKey = `tod_response_${todRound}`;
      
      // Vérifier les réponses existantes
      if (gameData?.answers?.[responseKey]) {
        const responses = gameData.answers[responseKey];
        const partnerResponse = Object.entries(responses).find(
          ([playerId, data]) => playerId !== user?.id && !playerId.startsWith('partner_')
        );
        
        if (partnerResponse) {
          const [playerId, responseData] = partnerResponse;
          console.log('✅ Réponse du partenaire reçue:', responseData);
          setTodPartnerResponse(responseData);
          setTodPhase('reveal'); // Passer à révélation
        }
      }
    }
  }, [activeGame, gameMode, isFirebaseReady, gameData, todRound, todPhase, todResponse, todSubmitted, user?.id]);

  // Surveiller les changements de session pour le mode en ligne
  useEffect(() => {
    if (gameSession && gameMode === 'online') {
      if (gameSession.status === 'ready' && !waitingForPartner) {
        // Les deux joueurs sont là, démarrer le jeu
        setShowLobby(false);
        setShowInviteModal(false);
        setActiveGame(gameSession.gameType);
      }
    }
  }, [gameSession, waitingForPartner, gameMode]);

  const openGameLobby = (gameType) => {
    setSelectedGameForLobby(gameType);
    setShowLobby(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleCreateGame = async () => {
    setIsCreatingGame(true);
    const session = await createGameSession(selectedGameForLobby, user?.name || 'Joueur 1');
    setIsCreatingGame(false);
    
    if (session && !session.error) {
      setGameMode('online');
      // ✅ Plus besoin d'appeler listenToGameSession() - le listener permanent dans GameContext gère tout
      
      // Envoyer une notification push au partenaire
      const gameTitle = getGameTitle(selectedGameForLobby);
      await notifyGame(gameTitle);
      
      Alert.alert(
        '🎮 Partie créée !',
        'En attente de votre partenaire...\n\nVotre partenaire doit appuyer sur "Rejoindre la partie" dans le même jeu.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Erreur', session?.error || 'Impossible de créer la partie');
    }
  };

  const handleJoinGame = async () => {
    setIsJoiningGame(true);
    const result = await joinGameSession(user?.name || 'Joueur 2');
    setIsJoiningGame(false);
    
    // Vérifier si c'est une erreur
    if (result && result.error) {
      Alert.alert(
        '❌ Impossible de rejoindre',
        result.error,
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (result && !result.error) {
      setGameMode('online');
      // ✅ Plus besoin d'appeler listenToGameSession() - le listener permanent dans GameContext gère tout
      
      // Vérifier si le jeu peut démarrer immédiatement
      if (result.status === 'ready') {
        setShowLobby(false);
        setActiveGame(result.gameType);
      }
      Alert.alert('🎉 Connecté !', 'Vous avez rejoint la partie !');
    } else {
      Alert.alert(
        'Aucune partie trouvée',
        'Votre partenaire n\'a pas encore créé de partie.\nDemandez-lui de créer une partie d\'abord.',
        [{ text: 'OK' }]
      );
    }
  };

  const startLocalGame = (game) => {
    setShowLobby(false);
    setGameMode('local');
    setActiveGame(game);
    setCurrentQuestion(0);
    setScores({ player1: 0, player2: 0 });
    setShowResult(false);
    setTruthOrDare(null);
    setWyrChoice(null);
    setQuizPhase('player1');
    setPlayer1Answer(null);
    setPlayer2Answer(null);
    setCurrentPlayer(1);
    // Reset pour "Qui est le Plus" tour par tour
    setWimPhase('player1');
    setWimPlayer1Answer(null);
    setWimPlayer2Answer(null);
    // Reset pour "Tu Préfères" tour par tour
    setWyrPhase('player1');
    setWyrPlayer1Choice(null);
    setWyrPlayer2Choice(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const startGame = (game) => {
    // Ouvrir le lobby pour choisir le mode
    openGameLobby(game);
  };

  const nextQuestion = () => {
    if (currentQuestion < 9) {
      setCurrentQuestion(currentQuestion + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setShowResult(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const selectTruthOrDare = async (type) => {
    const items = type === 'truth' ? TRUTH_OR_DARE.truths : TRUTH_OR_DARE.dares;
    const random = items[Math.floor(Math.random() * items.length)];
    const selection = { type, text: random, round: todRound };
    
    setTruthOrDare(selection);
    setTodResponse('');
    setTodSubmitted(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Définir qui pose et qui répond
    const myName = user?.name || 'Moi';
    const partnerName = partner?.name || 'Partenaire';
    
    if (isMyTurnToAsk) {
      // C'est moi qui pose → mon partenaire doit répondre
      setTodAsker(myName);
      setTodAnswerer(partnerName);
      setTodPhase('waiting'); // J'attends que mon partenaire réponde
    } else {
      // C'est mon partenaire qui pose → je dois répondre
      setTodAsker(partnerName);
      setTodAnswerer(myName);
      setTodPhase('answer'); // Je dois répondre
    }
    
    // En mode online, synchroniser le choix avec le partenaire
    if (gameMode === 'online' && isFirebaseReady) {
      await submitAnswer(`tod_question_${todRound}`, { 
        type, 
        text: random, 
        askedBy: isMyTurnToAsk ? myName : partnerName,
        mustAnswerBy: isMyTurnToAsk ? partnerName : myName,
        round: todRound,
        timestamp: Date.now()
      }, myName);
    }
  };

  // Soumettre la réponse à une Action/Vérité
  const submitTodResponse = async () => {
    if (!todResponse.trim()) {
      Alert.alert('Oops', 'Écris ta réponse avant de soumettre !');
      return;
    }
    
    setTodSubmitted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // En mode online, synchroniser la réponse avec le partenaire
    if (gameMode === 'online' && isFirebaseReady) {
      await submitAnswer(`tod_response_${todRound}`, {
        response: todResponse.trim(),
        respondedBy: user?.name || 'Moi',
        question: truthOrDare,
        round: todRound,
        timestamp: Date.now()
      }, user?.name);
    }
  };

  // Confirmer qu'une Action a été réalisée (sans texte)
  const confirmActionDone = async () => {
    setTodSubmitted(true);
    setTodResponse('✅ Action réalisée !');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (gameMode === 'online' && isFirebaseReady) {
      await submitAnswer(`tod_response_${todRound}`, {
        response: '✅ Action réalisée !',
        respondedBy: user?.name || 'Moi',
        question: truthOrDare,
        round: todRound,
        timestamp: Date.now()
      }, user?.name);
    }
  };

  // Passer au tour suivant d'Action/Vérité (alterner les rôles)
  const nextTodRound = () => {
    // Sauvegarder la réponse dans l'historique
    if (truthOrDare && todResponse) {
      setTodHistory(prev => [...prev, {
        round: todRound,
        question: truthOrDare,
        response: todResponse,
        asker: todAsker,
        answerer: todAnswerer
      }]);
    }
    
    // Réinitialiser pour le prochain tour
    setTruthOrDare(null);
    setTodResponse('');
    setTodSubmitted(false);
    setTodRound(prev => prev + 1);
    setTodPhase('choose');
    
    // ALTERNER : si c'était mon tour de poser, maintenant c'est au partenaire
    setIsMyTurnToAsk(prev => !prev);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Obtenir la réponse du partenaire pour le tour actuel
  const getPartnerTodResponse = useCallback(() => {
    if (!gameData?.answers) return null;
    const responseKey = `tod_response_${todRound}`;
    const responses = gameData.answers[responseKey];
    if (!responses) return null;
    
    // Trouver la réponse qui n'est pas la mienne
    for (const [playerId, data] of Object.entries(responses)) {
      if (data.respondedBy !== user?.name) {
        return data;
      }
    }
    return null;
  }, [gameData, todRound, user?.name]);

  const addScore = (player) => {
    setScores({
      ...scores,
      [player]: scores[player] + 1,
    });
    nextQuestion();
  };

  const selectWyrOption = (option) => {
    setWyrChoice(option);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const nextWyrQuestion = () => {
    if (currentQuestion < WOULD_YOU_RATHER.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setWyrChoice(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setShowResult(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const renderWouldYouRather = () => {
    const myName = user?.name || 'Moi';
    const partnerName = partner?.name || 'Partenaire';
    const currentQ = WOULD_YOU_RATHER[currentQuestion];

    const handleWyrAnswer = (choice) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (wyrPhase === 'player1') {
        setWyrPlayer1Choice(choice);
        setWyrPhase('passPhone');
      } else if (wyrPhase === 'player2') {
        setWyrPlayer2Choice(choice);
        setWyrPhase('reveal');
      }
    };

    const handleWyrNext = () => {
      if (currentQuestion < WOULD_YOU_RATHER.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setWyrPhase('player1');
        setWyrPlayer1Choice(null);
        setWyrPlayer2Choice(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setShowResult(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    };

    return (
      <View style={styles.gameContainer}>
        {!showResult ? (
          <>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / WOULD_YOU_RATHER.length) * 100}%` }]} />
            </View>
            <Text style={styles.questionNumber}>{currentQuestion + 1}/{WOULD_YOU_RATHER.length}</Text>
            
            <Text style={styles.wyrTitle}>Tu préfères...</Text>

            {/* PHASE 1: Premier joueur choisit */}
            {wyrPhase === 'player1' && (
              <View style={styles.wyrPhaseContainer}>
                <Text style={styles.wyrPhaseTitle}>🎯 C'est au tour de {myName}</Text>
                
                <TouchableOpacity
                  style={styles.wyrOption}
                  onPress={() => handleWyrAnswer(1)}
                >
                  <Text style={styles.wyrOptionText}>{currentQ.option1}</Text>
                </TouchableOpacity>

                <Text style={styles.wyrOr}>OU</Text>

                <TouchableOpacity
                  style={styles.wyrOption}
                  onPress={() => handleWyrAnswer(2)}
                >
                  <Text style={styles.wyrOptionText}>{currentQ.option2}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PHASE PASS: Passer le téléphone */}
            {wyrPhase === 'passPhone' && (
              <View style={styles.passPhoneContainer}>
                <Text style={styles.passPhoneEmoji}>📱</Text>
                <Text style={styles.passPhoneTitle}>Passe le téléphone !</Text>
                <Text style={styles.passPhoneText}>
                  {myName} a fait son choix. Maintenant passe le téléphone à {partnerName} !
                </Text>
                <Text style={styles.passPhoneWarning}>⚠️ {partnerName} ne doit pas voir le choix de {myName} !</Text>
                <TouchableOpacity
                  style={styles.passPhoneButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setWyrPhase('player2');
                  }}
                >
                  <Text style={styles.passPhoneButtonText}>👋 {partnerName} est prêt(e)</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PHASE 2: Deuxième joueur choisit */}
            {wyrPhase === 'player2' && (
              <View style={styles.wyrPhaseContainer}>
                <Text style={styles.wyrPhaseTitle}>🎯 C'est au tour de {partnerName}</Text>
                
                <TouchableOpacity
                  style={styles.wyrOption}
                  onPress={() => handleWyrAnswer(1)}
                >
                  <Text style={styles.wyrOptionText}>{currentQ.option1}</Text>
                </TouchableOpacity>

                <Text style={styles.wyrOr}>OU</Text>

                <TouchableOpacity
                  style={styles.wyrOption}
                  onPress={() => handleWyrAnswer(2)}
                >
                  <Text style={styles.wyrOptionText}>{currentQ.option2}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PHASE REVEAL: Comparer les choix */}
            {wyrPhase === 'reveal' && (
              <View style={styles.quizRevealContainer}>
                <Text style={styles.quizRevealTitle}>🔮 Révélation !</Text>
                
                <View style={styles.quizRevealAnswers}>
                  <View style={styles.quizRevealAnswer}>
                    <Text style={styles.quizRevealLabel}>{myName} préfère :</Text>
                    <Text style={styles.quizRevealValue}>
                      {wyrPlayer1Choice === 1 ? currentQ.option1 : currentQ.option2}
                    </Text>
                  </View>
                  <View style={styles.quizRevealAnswer}>
                    <Text style={styles.quizRevealLabel}>{partnerName} préfère :</Text>
                    <Text style={styles.quizRevealValue}>
                      {wyrPlayer2Choice === 1 ? currentQ.option1 : currentQ.option2}
                    </Text>
                  </View>
                  
                  {wyrPlayer1Choice === wyrPlayer2Choice ? (
                    <Text style={styles.quizMatch}>✨ Vous êtes d'accord !</Text>
                  ) : (
                    <Text style={styles.wimDisagree}>🤔 Goûts différents !</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.quizNextButton, { marginTop: 20 }]}
                  onPress={handleWyrNext}
                >
                  <Text style={styles.quizNextButtonText}>
                    {currentQuestion < WOULD_YOU_RATHER.length - 1 ? 'Suivant →' : 'Terminer ✓'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <View style={styles.resultContainer}>
            <Text style={styles.resultEmoji}>🎉</Text>
            <Text style={styles.resultTitle}>Bravo {myName} & {partnerName} !</Text>
            <Text style={styles.resultScore}>Vous avez terminé le jeu "Tu préfères" !</Text>
            <Text style={styles.wyrResultHint}>Discutez de vos choix différents 💕</Text>
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={() => {
                setCurrentQuestion(0);
                setWyrChoice(null);
                setWyrPhase('player1');
                setWyrPlayer1Choice(null);
                setWyrPlayer2Choice(null);
                setShowResult(false);
              }}
            >
              <Text style={styles.playAgainText}>Rejouer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const getGameTitle = (gameType) => {
    const titles = {
      'quiz': '🧠 Quiz Couple',
      'truthordare': '🎲 Action ou Vérité',
      'whoismore': '🏆 Qui est le Plus...',
      'wouldyourather': '🤔 Tu Préfères...',
    };
    return titles[gameType] || 'Jeu';
  };

  const renderLobbyModal = () => (
    <Modal
      visible={showLobby}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowLobby(false);
        endGameSession();
      }}
    >
      <View style={styles.lobbyOverlay}>
        <View style={styles.lobbyContent}>
          <Text style={styles.lobbyTitle}>{getGameTitle(selectedGameForLobby)}</Text>
          <Text style={styles.lobbySubtitle}>Choisissez comment jouer</Text>

          {/* Mode Local */}
          <TouchableOpacity
            style={styles.lobbyOption}
            onPress={() => startLocalGame(selectedGameForLobby)}
          >
            <LinearGradient colors={['#10B981', '#059669']} style={styles.lobbyOptionGradient}>
              <Text style={styles.lobbyOptionIcon}>👫</Text>
              <View style={styles.lobbyOptionTextContainer}>
                <Text style={styles.lobbyOptionTitle}>Jouer ensemble</Text>
                <Text style={styles.lobbyOptionDesc}>Sur le même téléphone</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Séparateur */}
          <View style={styles.lobbySeparator}>
            <View style={styles.lobbySeparatorLine} />
            <Text style={styles.lobbySeparatorText}>ou à distance</Text>
            <View style={styles.lobbySeparatorLine} />
          </View>

          {/* Mode En ligne - Créer */}
          <TouchableOpacity
            style={[styles.lobbyOption, waitingForPartner && styles.lobbyOptionActive]}
            onPress={handleCreateGame}
            disabled={isCreatingGame || waitingForPartner}
          >
            <LinearGradient 
              colors={waitingForPartner ? ['#F59E0B', '#D97706'] : ['#8B5CF6', '#A855F7']} 
              style={styles.lobbyOptionGradient}
            >
              {isCreatingGame ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <>
                  <Text style={styles.lobbyOptionIcon}>{waitingForPartner ? '⏳' : '🎮'}</Text>
                  <View style={styles.lobbyOptionTextContainer}>
                    <Text style={styles.lobbyOptionTitle}>
                      {waitingForPartner ? 'En attente...' : 'Créer une partie'}
                    </Text>
                    <Text style={styles.lobbyOptionDesc}>
                      {waitingForPartner 
                        ? `${partner?.name || 'Partenaire'} doit rejoindre` 
                        : 'Votre partenaire rejoint ensuite'}
                    </Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Mode En ligne - Rejoindre */}
          <TouchableOpacity
            style={styles.lobbyOption}
            onPress={handleJoinGame}
            disabled={isJoiningGame || waitingForPartner}
          >
            <LinearGradient colors={['#FF6B9D', '#C44569']} style={styles.lobbyOptionGradient}>
              {isJoiningGame ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <>
                  <Text style={styles.lobbyOptionIcon}>🤝</Text>
                  <View style={styles.lobbyOptionTextContainer}>
                    <Text style={styles.lobbyOptionTitle}>Rejoindre la partie</Text>
                    <Text style={styles.lobbyOptionDesc}>Si votre partenaire a créé une partie</Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Indicateur partenaire */}
          {partner && (
            <View style={styles.partnerIndicator}>
              <Text style={styles.partnerIndicatorText}>
                {partnerOnline ? '🟢' : '🔴'} {partner.name} {partnerOnline ? 'est disponible' : 'est hors ligne'}
              </Text>
            </View>
          )}

          {/* Info de synchronisation (pour débogage) */}
          <View style={styles.syncInfo}>
            <Text style={styles.syncInfoText}>
              📡 ID Couple: {coupleId ? coupleId.slice(-8) : 'Non défini'}
            </Text>
            {couple?.code && (
              <Text style={styles.syncInfoText}>
                🔑 Code: {couple.code}
              </Text>
            )}
          </View>

          {/* Bouton Annuler */}
          <TouchableOpacity
            style={styles.lobbyCancelButton}
            onPress={() => {
              setShowLobby(false);
              endGameSession();
            }}
          >
            <Text style={styles.lobbyCancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Modal pour afficher les invitations de jeu du partenaire
  const renderInviteModal = () => {
    if (!pendingGameInvite) return null;
    
    return (
      <Modal
        visible={showInviteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.lobbyOverlay}>
          <View style={styles.inviteContent}>
            <Text style={styles.inviteEmoji}>🎮</Text>
            <Text style={styles.inviteTitle}>Invitation de jeu !</Text>
            <Text style={styles.inviteText}>
              {partner?.name || pendingGameInvite.creatorName} vous invite à jouer à
            </Text>
            <Text style={styles.inviteGameName}>
              {getGameTitle(pendingGameInvite.gameType)}
            </Text>
            
            <TouchableOpacity
              style={styles.inviteAcceptButton}
              onPress={async () => {
                setShowInviteModal(false);
                setIsJoiningGame(true);
                const session = await joinGameSession(user?.name || 'Joueur 2');
                setIsJoiningGame(false);
                
                if (session) {
                  setGameMode('online');
                  if (session.status === 'ready' || gameSession?.status === 'ready') {
                    setActiveGame(pendingGameInvite.gameType);
                  }
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              }}
            >
              <LinearGradient colors={['#10B981', '#059669']} style={styles.inviteAcceptGradient}>
                {isJoiningGame ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.inviteAcceptText}>🎉 Rejoindre la partie !</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.inviteDeclineButton}
              onPress={() => setShowInviteModal(false)}
            >
              <Text style={styles.inviteDeclineText}>Plus tard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderGameSelector = () => (
    <ScrollView contentContainerStyle={styles.gamesGrid}>
      {/* Bannière si une invitation est en attente */}
      {pendingGameInvite && !showInviteModal && (
        <TouchableOpacity 
          style={styles.inviteBanner}
          onPress={() => setShowInviteModal(true)}
        >
          <LinearGradient colors={['#FF6B9D', '#C44569']} style={styles.inviteBannerGradient}>
            <Text style={styles.inviteBannerEmoji}>🎮</Text>
            <View style={styles.inviteBannerTextContainer}>
              <Text style={styles.inviteBannerTitle}>
                {partner?.name || 'Partenaire'} vous attend !
              </Text>
              <Text style={styles.inviteBannerDesc}>
                Touchez pour rejoindre {getGameTitle(pendingGameInvite.gameType)}
              </Text>
            </View>
            <Text style={styles.inviteBannerArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* VERSION BANNER - TRÈS VISIBLE */}
      <View style={{backgroundColor: '#00AA00', padding: 15, borderRadius: 10, marginBottom: 15, alignItems: 'center'}}>
        <Text style={{color: '#FFFFFF', fontSize: 20, fontWeight: 'bold'}}>✅ JEUX V2.0.0 ✅</Text>
        <Text style={{color: '#FFFFFF', fontSize: 14}}>Jeux à distance activés !</Text>
      </View>

      {/* Indicateur de connexion Firebase */}
      <View style={styles.connectionStatus}>
        <Text style={styles.connectionStatusText}>
          {isFirebaseReady ? '🟢 Firebase OK' : '🔴 Hors ligne'}
        </Text>
        <Text style={styles.connectionStatusText}>
          📱 ID Couple: {coupleId ? coupleId.slice(-8) : 'Non défini'}
        </Text>
        {partner && (
          <Text style={styles.connectionStatusText}>
            👫 {partner.name} {partnerOnline ? '(en ligne)' : ''}
          </Text>
        )}
      </View>

      {/* SECTION JOUER À DISTANCE */}
      <View style={styles.distanceSection}>
        <Text style={styles.distanceSectionTitle}>🌐 JOUER À DISTANCE</Text>
        <Text style={styles.distanceSectionDesc}>
          Jouez avec votre partenaire même à distance !
        </Text>
        
        <View style={styles.distanceButtonsRow}>
          {/* Bouton Créer une partie */}
          <TouchableOpacity 
            style={styles.distanceButton}
            onPress={() => {
              setSelectedGameForLobby('quiz');
              setShowLobby(true);
            }}
          >
            <LinearGradient colors={['#8B5CF6', '#A855F7']} style={styles.distanceButtonGradient}>
              <Text style={styles.distanceButtonIcon}>🎮</Text>
              <Text style={styles.distanceButtonText}>CRÉER</Text>
              <Text style={styles.distanceButtonSubtext}>une partie</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Bouton Rejoindre une partie */}
          <TouchableOpacity 
            style={styles.distanceButton}
            onPress={async () => {
              setIsJoiningGame(true);
              const session = await joinGameSession(user?.name || 'Joueur 2');
              setIsJoiningGame(false);
              
              if (session) {
                setGameMode('online');
                Alert.alert('🎉 Connecté !', `Vous rejoignez ${getGameTitle(session.gameType)}`);
                if (session.status === 'ready' || gameSession?.status === 'ready') {
                  setActiveGame(session.gameType);
                }
              } else {
                Alert.alert(
                  '😕 Aucune partie',
                  'Votre partenaire n\'a pas encore créé de partie.\n\nDemandez-lui de cliquer sur "CRÉER une partie" d\'abord !',
                  [{ text: 'OK' }]
                );
              }
            }}
            disabled={isJoiningGame}
          >
            <LinearGradient colors={['#10B981', '#059669']} style={styles.distanceButtonGradient}>
              {isJoiningGame ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <>
                  <Text style={styles.distanceButtonIcon}>🤝</Text>
                  <Text style={styles.distanceButtonText}>REJOINDRE</Text>
                  <Text style={styles.distanceButtonSubtext}>la partie</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Indicateur de session active */}
        {hasActiveSession && gameSession && (
          <View style={styles.activeSessionBanner}>
            <Text style={styles.activeSessionText}>
              ⚡ Session active: {getGameTitle(gameSession.gameType)} 
              {waitingForPartner ? ' (en attente...)' : ' (prêt!)'}
            </Text>
          </View>
        )}
      </View>

      {/* Séparateur */}
      <View style={styles.sectionSeparator}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>OU JOUER ENSEMBLE</Text>
        <View style={styles.separatorLine} />
      </View>

      {/* SECTION JEUX */}
      <Text style={styles.gamesSectionTitle}>📱 Jeux sur le même téléphone</Text>

      <TouchableOpacity style={styles.gameCard} onPress={() => startGame('quiz')}>
        <LinearGradient colors={['#FF6B9D', '#C44569']} style={styles.gameGradient}>
          <Text style={styles.gameIcon}>🧠</Text>
          <Text style={styles.gameTitle}>Quiz Couple</Text>
          <Text style={styles.gameDesc}>Testez vos connaissances sur l'autre</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.gameCard} onPress={() => startGame('truthordare')}>
        <LinearGradient colors={['#8B5CF6', '#A855F7']} style={styles.gameGradient}>
          <Text style={styles.gameIcon}>🎲</Text>
          <Text style={styles.gameTitle}>Action ou Vérité</Text>
          <Text style={styles.gameDesc}>Version couple épicée</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.gameCard} onPress={() => startGame('whoismore')}>
        <LinearGradient colors={['#10B981', '#059669']} style={styles.gameGradient}>
          <Text style={styles.gameIcon}>🏆</Text>
          <Text style={styles.gameTitle}>Qui est le Plus...</Text>
          <Text style={styles.gameDesc}>Pointez l'un vers l'autre !</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.gameCard} onPress={() => startGame('wouldyourather')}>
        <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.gameGradient}>
          <Text style={styles.gameIcon}>🤔</Text>
          <Text style={styles.gameTitle}>Tu Préfères...</Text>
          <Text style={styles.gameDesc}>Des choix impossibles !</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderQuizGame = () => {
    const question = QUIZ_QUESTIONS[currentQuestion];
    const myName = user?.name || 'Joueur 1';
    const partnerName = partner?.name || 'Joueur 2';
    
    const handleQuizAnswer = (answer) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (quizPhase === 'player1') {
        setPlayer1Answer(answer);
        setQuizPhase('passPhone1'); // Passer le téléphone
      } else if (quizPhase === 'player2') {
        setPlayer2Answer(answer);
        setQuizPhase('reveal');
      }
    };

    const handleQuizNext = () => {
      if (currentQuestion < 9) {
        setCurrentQuestion(currentQuestion + 1);
        setQuizPhase('player1');
        setPlayer1Answer(null);
        setPlayer2Answer(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setShowResult(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    };

    const handleCorrect = (player) => {
      setScores({
        ...scores,
        [player]: scores[player] + 1,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    return (
      <View style={styles.gameContainer}>
        {!showResult ? (
          <>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / 10) * 100}%` }]} />
            </View>
            
            <View style={styles.quizScoreBoard}>
              <View style={styles.quizPlayerScore}>
                <Text style={styles.quizPlayerLabel}>{myName}</Text>
                <Text style={styles.quizPlayerPoints}>{scores.player1} pts</Text>
              </View>
              <Text style={styles.quizVs}>VS</Text>
              <View style={styles.quizPlayerScore}>
                <Text style={styles.quizPlayerLabel}>{partnerName}</Text>
                <Text style={styles.quizPlayerPoints}>{scores.player2} pts</Text>
              </View>
            </View>

            <Text style={styles.questionNumber}>Question {currentQuestion + 1}/10</Text>
            
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{question.question}</Text>
            </View>

            {/* PHASE 1: Premier joueur répond */}
            {quizPhase === 'player1' && (
              <View style={styles.quizPhaseContainer}>
                <Text style={styles.quizPhaseTitle}>🎯 C'est au tour de {myName}</Text>
                <Text style={styles.quizPhaseHint}>{partnerName} doit deviner ta réponse ensuite !</Text>
                {question.type === 'choice' ? (
                  <View style={styles.quizOptions}>
                    {question.options.map((option, idx) => (
                      <TouchableOpacity
                        key={`opt-${idx}`}
                        style={styles.quizOptionButton}
                        onPress={() => handleQuizAnswer(option)}
                      >
                        <Text style={styles.quizOptionText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.quizReadyButton}
                    onPress={() => handleQuizAnswer('open')}
                  >
                    <Text style={styles.quizReadyButtonText}>J'ai ma réponse en tête ✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* PHASE PASS: Passer le téléphone */}
            {quizPhase === 'passPhone1' && (
              <View style={styles.passPhoneContainer}>
                <Text style={styles.passPhoneEmoji}>📱</Text>
                <Text style={styles.passPhoneTitle}>Passe le téléphone !</Text>
                <Text style={styles.passPhoneText}>
                  {myName} a répondu. Maintenant passe le téléphone à {partnerName} pour qu'il/elle devine.
                </Text>
                <Text style={styles.passPhoneWarning}>⚠️ {partnerName} ne doit pas voir la réponse !</Text>
                <TouchableOpacity
                  style={styles.passPhoneButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setQuizPhase('player2');
                  }}
                >
                  <Text style={styles.passPhoneButtonText}>👋 {partnerName} est prêt(e)</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PHASE 2: Deuxième joueur devine */}
            {quizPhase === 'player2' && (
              <View style={styles.quizPhaseContainer}>
                <Text style={styles.quizPhaseTitle}>🤔 C'est au tour de {partnerName}</Text>
                <Text style={styles.quizPhaseHint}>Devine la réponse de {myName} !</Text>
                {question.type === 'choice' ? (
                  <View style={styles.quizOptions}>
                    {question.options.map((option, idx) => (
                      <TouchableOpacity
                        key={`opt2-${idx}`}
                        style={styles.quizOptionButton}
                        onPress={() => handleQuizAnswer(option)}
                      >
                        <Text style={styles.quizOptionText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.quizReadyButton}
                    onPress={() => handleQuizAnswer('open')}
                  >
                    <Text style={styles.quizReadyButtonText}>J'ai deviné ! ✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* PHASE REVEAL: Comparer les réponses */}
            {quizPhase === 'reveal' && (
              <View style={styles.quizRevealContainer}>
                <Text style={styles.quizRevealTitle}>🎯 Comparez vos réponses !</Text>
                
                {question.type === 'choice' && (
                  <View style={styles.quizRevealAnswers}>
                    <View style={styles.quizRevealAnswer}>
                      <Text style={styles.quizRevealLabel}>{myName} :</Text>
                      <Text style={styles.quizRevealValue}>{player1Answer}</Text>
                    </View>
                    <View style={styles.quizRevealAnswer}>
                      <Text style={styles.quizRevealLabel}>{partnerName} :</Text>
                      <Text style={styles.quizRevealValue}>{player2Answer}</Text>
                    </View>
                    {player1Answer === player2Answer && (
                      <Text style={styles.quizMatch}>✨ Match parfait !</Text>
                    )}
                  </View>
                )}

                <Text style={styles.quizRevealQuestion}>Qui a bien deviné ?</Text>
                
                <View style={styles.quizRevealButtons}>
                  <TouchableOpacity
                    style={styles.quizRevealBtn}
                    onPress={() => handleCorrect('player1')}
                  >
                    <Text style={styles.quizRevealBtnText}>{myName} ✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quizRevealBtn}
                    onPress={() => handleCorrect('player2')}
                  >
                    <Text style={styles.quizRevealBtnText}>{partnerName} ✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.quizRevealBtn, styles.quizRevealBtnBoth]}
                    onPress={() => {
                      handleCorrect('player1');
                      handleCorrect('player2');
                    }}
                  >
                    <Text style={styles.quizRevealBtnText}>Les deux !</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.quizNextButton} onPress={handleQuizNext}>
                  <Text style={styles.quizNextButtonText}>
                    {currentQuestion < 9 ? 'Question suivante →' : 'Voir résultats 🏆'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <View style={styles.resultContainer}>
            <Text style={styles.resultEmoji}>🏆</Text>
            <Text style={styles.resultTitle}>Résultats du Quiz !</Text>
            <Text style={styles.resultScore}>
              {scores.player1 > scores.player2 
                ? `${myName} gagne ${scores.player1}-${scores.player2} !`
                : scores.player2 > scores.player1
                ? `${partnerName} gagne ${scores.player2}-${scores.player1} !`
                : `Égalité ${scores.player1}-${scores.player2} !`
              }
            </Text>
            <Text style={styles.quizResultHint}>Vous vous connaissez {Math.round((scores.player1 + scores.player2) / 20 * 100)}% 💕</Text>
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={() => startGame('quiz')}
            >
              <Text style={styles.playAgainText}>Rejouer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderTruthOrDare = () => {
    const myName = user?.name || 'Moi';
    const partnerName = partner?.name || 'Partenaire';
    
    return (
      <View style={styles.gameContainer}>
        {/* Indicateur de tour */}
        <View style={styles.todTurnIndicator}>
          <Text style={styles.todTurnText}>
            {isMyTurnToAsk 
              ? `🎯 C'est ton tour de poser une question à ${partnerName}` 
              : `⏳ C'est au tour de ${partnerName} de te poser une question`}
          </Text>
          <Text style={styles.todRoundText}>Tour {todRound + 1}</Text>
        </View>

        {/* Phase 1: Choix Action/Vérité */}
        {!truthOrDare && isMyTurnToAsk && (
          <View style={styles.todChoice}>
            <Text style={styles.todTitle}>
              Choisis pour {partnerName} :
            </Text>
            <TouchableOpacity
              style={styles.todButton}
              onPress={() => selectTruthOrDare('truth')}
            >
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.todButtonGradient}>
                <Text style={styles.todButtonIcon}>💬</Text>
                <Text style={styles.todButtonText}>VÉRITÉ</Text>
                <Text style={styles.todButtonHint}>{partnerName} devra répondre honnêtement</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.todOr}>ou</Text>
            <TouchableOpacity
              style={styles.todButton}
              onPress={() => selectTruthOrDare('dare')}
            >
              <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.todButtonGradient}>
                <Text style={styles.todButtonIcon}>⚡</Text>
                <Text style={styles.todButtonText}>ACTION</Text>
                <Text style={styles.todButtonHint}>{partnerName} devra faire un défi</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Phase: Attente du partenaire (mode local - pas online) */}
        {!truthOrDare && !isMyTurnToAsk && gameMode !== 'online' && (
          <View style={styles.todWaitingTurn}>
            <Text style={styles.todWaitingIcon}>🔄</Text>
            <Text style={styles.todWaitingTitle}>
              C'est au tour de {partnerName} !
            </Text>
            <Text style={styles.todWaitingHint}>
              Passe le téléphone à ton partenaire pour qu'il/elle choisisse Action ou Vérité pour toi.
            </Text>
            <TouchableOpacity
              style={styles.todReadyButton}
              onPress={() => setIsMyTurnToAsk(true)}
            >
              <Text style={styles.todReadyButtonText}>
                👋 {partnerName} est prêt(e) à choisir
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Phase 2: Question posée - Affichage */}
        {truthOrDare && (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.todResult}
          >
            {/* Header: Qui pose à qui */}
            <View style={styles.todQuestionHeader}>
              <Text style={styles.todAskerText}>
                {todAsker} demande à {todAnswerer} :
              </Text>
            </View>

            {/* Type: Vérité ou Action */}
            <Text style={styles.todResultType}>
              {truthOrDare.type === 'truth' ? '💬 VÉRITÉ' : '⚡ ACTION'}
            </Text>
            
            {/* La question/action */}
            <View style={styles.todResultCard}>
              <Text style={styles.todResultText}>{truthOrDare.text}</Text>
            </View>

            {/* Zone de réponse - uniquement si c'est mon tour de répondre */}
            {todAnswerer === myName && !todSubmitted && (
              <View style={styles.todResponseContainer}>
                <Text style={styles.todResponseLabel}>
                  {truthOrDare.type === 'truth' 
                    ? '📝 Écris ta réponse pour ' + todAsker + ' :' 
                    : '⚡ Confirme quand tu as fait l\'action :'}
                </Text>
                
                {truthOrDare.type === 'truth' ? (
                  <>
                    <TextInput
                      style={styles.todResponseInput}
                      value={todResponse}
                      onChangeText={setTodResponse}
                      placeholder="Tape ta réponse ici..."
                      placeholderTextColor="#999"
                      multiline
                      maxLength={500}
                    />
                    <TouchableOpacity
                      style={[
                        styles.todSubmitButton,
                        !todResponse.trim() && styles.todSubmitButtonDisabled
                      ]}
                      onPress={submitTodResponse}
                      disabled={!todResponse.trim()}
                    >
                      <Text style={styles.todSubmitButtonText}>
                        Envoyer ma réponse à {todAsker} ✓
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.todActionButtons}>
                    <TouchableOpacity
                      style={styles.todActionDoneButton}
                      onPress={confirmActionDone}
                    >
                      <Text style={styles.todActionDoneText}>✅ J'ai fait l'action !</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.todActionSkipButton}
                      onPress={() => {
                        setTodSubmitted(true);
                        setTodResponse('❌ Action passée...');
                        if (gameMode === 'online' && isFirebaseReady) {
                          submitAnswer(`tod_response_${todRound}`, {
                            response: '❌ Action passée...',
                            respondedBy: myName,
                            question: truthOrDare,
                            round: todRound,
                            timestamp: Date.now()
                          }, myName);
                        }
                      }}
                    >
                      <Text style={styles.todActionSkipText}>😅 Je passe...</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Attente de réponse - si c'est moi qui ai posé */}
            {todAsker === myName && !todSubmitted && gameMode !== 'online' && (
              <View style={styles.todWaitingResponse}>
                <ActivityIndicator size="small" color="#FF6B9D" />
                <Text style={styles.todWaitingResponseText}>
                  En attente de la réponse de {todAnswerer}...
                </Text>
                <Text style={styles.todWaitingResponseHint}>
                  Passe le téléphone à {todAnswerer} pour qu'il/elle réponde.
                </Text>
                <TouchableOpacity
                  style={styles.todPassPhoneButton}
                  onPress={() => {
                    // Simuler que le partenaire va répondre
                    setIsMyTurnToAsk(false);
                  }}
                >
                  <Text style={styles.todPassPhoneText}>
                    📱 Téléphone passé à {todAnswerer}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Réponse soumise - Affichage pour les deux */}
            {todSubmitted && (
              <View style={styles.todAnswerContainer}>
                <Text style={styles.todAnswerLabel}>
                  ✅ Réponse de {todAnswerer} :
                </Text>
                <View style={styles.todAnswerBox}>
                  <Text style={styles.todAnswerText}>{todResponse}</Text>
                </View>
                
                {/* En mode online, afficher aussi la réponse du partenaire */}
                {gameMode === 'online' && (
                  <View style={styles.todPartnerSection}>
                    {(() => {
                      const partnerResponse = getPartnerTodResponse();
                      if (partnerResponse) {
                        return (
                          <>
                            <Text style={styles.todPartnerLabel}>
                              💕 Réponse de {partnerResponse.respondedBy || partnerName} :
                            </Text>
                            <View style={styles.todPartnerAnswerBox}>
                              <Text style={styles.todPartnerAnswerText}>
                                {partnerResponse.response}
                              </Text>
                            </View>
                          </>
                        );
                      } else {
                        return (
                          <View style={styles.todWaitingPartner}>
                            <ActivityIndicator size="small" color="#FF6B9D" />
                            <Text style={styles.todWaitingText}>
                              En attente de la réponse de {partnerName}...
                            </Text>
                          </View>
                        );
                      }
                    })()}
                  </View>
                )}
              </View>
            )}

            {/* Bouton tour suivant - visible après réponse */}
            {todSubmitted && (
              <TouchableOpacity
                style={styles.todNextButton}
                onPress={nextTodRound}
              >
                <Text style={styles.todNextButtonText}>
                  {isMyTurnToAsk 
                    ? `Prochain tour → (${partnerName} pose)` 
                    : `Prochain tour → (Je pose)`}
                </Text>
              </TouchableOpacity>
            )}
          </KeyboardAvoidingView>
        )}

        {/* Historique des tours */}
        {todHistory.length > 0 && (
          <View style={styles.todHistoryContainer}>
            <Text style={styles.todHistoryTitle}>📜 Historique</Text>
            <ScrollView style={styles.todHistoryScroll} horizontal>
              {todHistory.map((item, idx) => (
                <View key={idx} style={styles.todHistoryItem}>
                  <Text style={styles.todHistoryRound}>Tour {item.round + 1}</Text>
                  <Text style={styles.todHistoryType}>
                    {item.question.type === 'truth' ? '💬' : '⚡'}
                  </Text>
                  <Text style={styles.todHistoryAnswer} numberOfLines={2}>
                    {item.response}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderWhoIsMore = () => {
    const myName = user?.name || 'Moi';
    const partnerName = partner?.name || 'Partenaire';

    const handleWimAnswer = (answer) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (wimPhase === 'player1') {
        setWimPlayer1Answer(answer);
        setWimPhase('passPhone');
      } else if (wimPhase === 'player2') {
        setWimPlayer2Answer(answer);
        setWimPhase('reveal');
      }
    };

    const handleWimNext = () => {
      if (currentQuestion < WHO_IS_MORE.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setWimPhase('player1');
        setWimPlayer1Answer(null);
        setWimPlayer2Answer(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setShowResult(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    };

    const handleWimScore = (bothAgree, who) => {
      if (bothAgree) {
        // Les deux sont d'accord
        if (who === 'me') {
          setScores(prev => ({ ...prev, player1: prev.player1 + 1 }));
        } else {
          setScores(prev => ({ ...prev, player2: prev.player2 + 1 }));
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleWimNext();
    };

    return (
      <View style={styles.gameContainer}>
        {!showResult ? (
          <>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / WHO_IS_MORE.length) * 100}%` }]} />
            </View>
            <Text style={styles.questionNumber}>{currentQuestion + 1}/{WHO_IS_MORE.length}</Text>
            
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{WHO_IS_MORE[currentQuestion]}</Text>
            </View>

            {/* PHASE 1: Premier joueur pointe */}
            {wimPhase === 'player1' && (
              <View style={styles.wimPhaseContainer}>
                <Text style={styles.wimPhaseTitle}>🎯 C'est au tour de {myName}</Text>
                <Text style={styles.wimPhaseHint}>Qui correspond le plus à cette question ?</Text>
                
                <View style={styles.whoIsMoreButtons}>
                  <TouchableOpacity
                    style={styles.whoButton}
                    onPress={() => handleWimAnswer('me')}
                  >
                    <Text style={styles.whoButtonEmoji}>👈</Text>
                    <Text style={styles.whoButtonText}>Moi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.whoButton}
                    onPress={() => handleWimAnswer('partner')}
                  >
                    <Text style={styles.whoButtonEmoji}>👉</Text>
                    <Text style={styles.whoButtonText}>{partnerName}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* PHASE PASS: Passer le téléphone */}
            {wimPhase === 'passPhone' && (
              <View style={styles.passPhoneContainer}>
                <Text style={styles.passPhoneEmoji}>📱</Text>
                <Text style={styles.passPhoneTitle}>Passe le téléphone !</Text>
                <Text style={styles.passPhoneText}>
                  {myName} a fait son choix. Maintenant passe le téléphone à {partnerName} pour qu'il/elle réponde aussi !
                </Text>
                <Text style={styles.passPhoneWarning}>⚠️ {partnerName} ne doit pas voir le choix de {myName} !</Text>
                <TouchableOpacity
                  style={styles.passPhoneButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setWimPhase('player2');
                  }}
                >
                  <Text style={styles.passPhoneButtonText}>👋 {partnerName} est prêt(e)</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PHASE 2: Deuxième joueur pointe */}
            {wimPhase === 'player2' && (
              <View style={styles.wimPhaseContainer}>
                <Text style={styles.wimPhaseTitle}>🎯 C'est au tour de {partnerName}</Text>
                <Text style={styles.wimPhaseHint}>Qui correspond le plus à cette question ?</Text>
                
                <View style={styles.whoIsMoreButtons}>
                  <TouchableOpacity
                    style={styles.whoButton}
                    onPress={() => handleWimAnswer('me')}
                  >
                    <Text style={styles.whoButtonEmoji}>👈</Text>
                    <Text style={styles.whoButtonText}>{myName}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.whoButton}
                    onPress={() => handleWimAnswer('partner')}
                  >
                    <Text style={styles.whoButtonEmoji}>👉</Text>
                    <Text style={styles.whoButtonText}>Moi</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* PHASE REVEAL: Comparer les réponses */}
            {wimPhase === 'reveal' && (
              <View style={styles.quizRevealContainer}>
                <Text style={styles.quizRevealTitle}>🔮 Révélation !</Text>
                
                <View style={styles.quizRevealAnswers}>
                  <View style={styles.quizRevealAnswer}>
                    <Text style={styles.quizRevealLabel}>{myName} a pointé :</Text>
                    <Text style={styles.quizRevealValue}>
                      {wimPlayer1Answer === 'me' ? `👈 ${myName}` : `👉 ${partnerName}`}
                    </Text>
                  </View>
                  <View style={styles.quizRevealAnswer}>
                    <Text style={styles.quizRevealLabel}>{partnerName} a pointé :</Text>
                    <Text style={styles.quizRevealValue}>
                      {wimPlayer2Answer === 'me' ? `👈 ${myName}` : `👉 ${partnerName}`}
                    </Text>
                  </View>
                  
                  {/* Vérifier si les deux sont d'accord */}
                  {wimPlayer1Answer === wimPlayer2Answer ? (
                    <Text style={styles.quizMatch}>✨ Vous êtes d'accord !</Text>
                  ) : (
                    <Text style={styles.wimDisagree}>🤔 Vous n'êtes pas d'accord !</Text>
                  )}
                </View>

                <View style={styles.quizRevealButtons}>
                  {wimPlayer1Answer === wimPlayer2Answer ? (
                    <TouchableOpacity
                      style={[styles.quizRevealBtn, styles.quizRevealBtnBoth]}
                      onPress={() => handleWimScore(true, wimPlayer1Answer)}
                    >
                      <Text style={styles.quizRevealBtnText}>
                        +1 point pour {wimPlayer1Answer === 'me' ? myName : partnerName} !
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.quizRevealBtn}
                      onPress={() => handleWimScore(false, null)}
                    >
                      <Text style={styles.quizRevealBtnText}>Question suivante →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <View style={styles.scoresContainer}>
              <Text style={styles.scoreText}>{myName}: {scores.player1}</Text>
              <Text style={styles.scoreText}>{partnerName}: {scores.player2}</Text>
            </View>
          </>
        ) : (
          <View style={styles.resultContainer}>
            <Text style={styles.resultEmoji}>🏆</Text>
            <Text style={styles.resultTitle}>Résultats !</Text>
            <Text style={styles.resultScore}>
              {scores.player1 > scores.player2 
                ? `${myName} gagne ${scores.player1}-${scores.player2} !`
                : scores.player2 > scores.player1
                ? `${partnerName} gagne ${scores.player2}-${scores.player1} !`
                : `Égalité ${scores.player1}-${scores.player2} !`
              }
            </Text>
            <Text style={styles.wyrResultHint}>
              {scores.player1 > scores.player2 
                ? `${myName} est vraiment unique ! 💕`
                : scores.player2 > scores.player1
                ? `${partnerName} est vraiment unique ! 💕`
                : `Vous êtes tous les deux incroyables ! 💕`
              }
            </Text>
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={() => {
                setCurrentQuestion(0);
                setScores({ player1: 0, player2: 0 });
                setShowResult(false);
                setWimPhase('player1');
                setWimPlayer1Answer(null);
                setWimPlayer2Answer(null);
              }}
            >
              <Text style={styles.playAgainText}>Rejouer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#FF6B9D', '#C44569', '#8B5CF6']}
      style={styles.container}
    >
      <View style={styles.header}>
        {activeGame ? (
          <TouchableOpacity onPress={() => {
            setActiveGame(null);
            endGameSession();
            setGameMode(null);
          }}>
            <Text style={styles.backButton}>← Retour</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.title}>🎮 Jeux Couple</Text>
        )}
      </View>

      {!activeGame && renderGameSelector()}
      {activeGame === 'quiz' && renderQuizGame()}
      {activeGame === 'truthordare' && renderTruthOrDare()}
      {activeGame === 'whoismore' && renderWhoIsMore()}
      {activeGame === 'wouldyourather' && renderWouldYouRather()}

      {/* Modal Lobby */}
      {renderLobbyModal()}
      
      {/* Modal Invitation */}
      {renderInviteModal()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    fontSize: 18,
    color: '#fff',
  },
  gamesGrid: {
    padding: 20,
    paddingBottom: 120,
  },
  gameCard: {
    marginBottom: 20,
    borderRadius: 25,
    overflow: 'hidden',
  },
  gameGradient: {
    padding: 30,
    alignItems: 'center',
  },
  gameIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  gameDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  gameContainer: {
    flex: 1,
    padding: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginBottom: 15,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  questionNumber: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 25,
    padding: 40,
    alignItems: 'center',
    marginBottom: 30,
  },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    lineHeight: 32,
  },
  quizActions: {
    alignItems: 'center',
  },
  quizButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 30,
  },
  quizButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C44569',
  },
  todChoice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todTurnIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  todTurnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  todRoundText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  todTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
  },
  todButton: {
    width: width * 0.7,
    borderRadius: 25,
    overflow: 'hidden',
  },
  todButtonGradient: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  todButtonIcon: {
    fontSize: 50,
    marginBottom: 15,
  },
  todButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  todButtonHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  todOr: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.7)',
    marginVertical: 20,
  },
  todWaitingTurn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  todWaitingIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  todWaitingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  todWaitingHint: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  todReadyButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  todReadyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  todQuestionHeader: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  todAskerText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  todResult: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  todResultType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  todResultCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 25,
    padding: 30,
    width: '100%',
    marginBottom: 20,
  },
  todResultText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    lineHeight: 28,
  },
  todWaitingResponse: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    marginVertical: 15,
  },
  todWaitingResponseText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  todWaitingResponseHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  todPassPhoneButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    marginTop: 15,
  },
  todPassPhoneText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  todNextButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 15,
  },
  todNextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
    textAlign: 'center',
  },
  todHistoryContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginTop: 20,
    width: '100%',
  },
  todHistoryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  todHistoryScroll: {
    flexDirection: 'row',
  },
  todHistoryItem: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    width: 120,
    alignItems: 'center',
  },
  todHistoryRound: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  todHistoryType: {
    fontSize: 20,
    marginVertical: 5,
  },
  todHistoryAnswer: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    textAlign: 'center',
  },
  whoIsMoreButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  whoButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  whoButtonEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  whoButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  resultScore: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 40,
  },
  playAgainButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 30,
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C44569',
  },
  wyrTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  wyrOption: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  wyrOptionSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#fff',
  },
  wyrOptionText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    lineHeight: 26,
  },
  wyrOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  wyrOr: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginVertical: 15,
  },
  wyrNextButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 30,
    alignSelf: 'center',
    marginTop: 30,
  },
  wyrNextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  wyrResultHint: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
    textAlign: 'center',
  },
  quizScoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  quizPlayerScore: {
    alignItems: 'center',
  },
  quizPlayerLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  quizPlayerPoints: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  quizVs: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quizPhaseContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  quizPhaseTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  quizPhaseHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 25,
  },
  quizOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  quizOptionButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 20,
    margin: 5,
  },
  quizOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  quizReadyButton: {
    backgroundColor: '#10B981',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  quizReadyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quizRevealContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  quizRevealTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  quizRevealAnswers: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  quizRevealAnswer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  quizRevealLabel: {
    fontSize: 16,
    color: '#666',
  },
  quizRevealValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  quizMatch: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
  },
  quizRevealQuestion: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 15,
  },
  quizRevealButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  quizRevealBtn: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 20,
    margin: 5,
  },
  quizRevealBtnBoth: {
    backgroundColor: '#F59E0B',
  },
  quizRevealBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  quizNextButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 10,
  },
  quizNextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C44569',
  },
  quizResultHint: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
  },
  // Styles Lobby
  lobbyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  lobbyContent: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
  },
  lobbyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  lobbySubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
  },
  lobbyOption: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  lobbyOptionActive: {
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  lobbyOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  lobbyOptionIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  lobbyOptionTextContainer: {
    flex: 1,
  },
  lobbyOptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  lobbyOptionDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  lobbySeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 15,
  },
  lobbySeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  lobbySeparatorText: {
    marginHorizontal: 15,
    color: '#666',
    fontSize: 14,
  },
  partnerIndicator: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 5,
  },
  partnerIndicatorText: {
    fontSize: 14,
    color: '#666',
  },
  syncInfo: {
    backgroundColor: '#e8f4f8',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  syncInfoText: {
    fontSize: 11,
    color: '#0891b2',
    fontFamily: 'monospace',
  },
  lobbyCancelButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  lobbyCancelText: {
    fontSize: 16,
    color: '#999',
  },
  
  // Styles pour l'invitation
  inviteContent: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 30,
    width: width * 0.85,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  inviteEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  inviteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  inviteText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  inviteGameName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B9D',
    marginBottom: 25,
  },
  inviteAcceptButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 15,
  },
  inviteAcceptGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  inviteAcceptText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  inviteDeclineButton: {
    paddingVertical: 10,
  },
  inviteDeclineText: {
    fontSize: 16,
    color: '#999',
  },
  
  // Bannière d'invitation
  inviteBanner: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  inviteBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  inviteBannerEmoji: {
    fontSize: 30,
    marginRight: 12,
  },
  inviteBannerTextContainer: {
    flex: 1,
  },
  inviteBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  inviteBannerDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  inviteBannerArrow: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  
  // Indicateur de connexion
  connectionStatus: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignSelf: 'stretch',
    marginHorizontal: 0,
  },
  connectionStatusText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginVertical: 2,
  },
  
  // Section jouer à distance
  distanceSection: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  distanceSectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  distanceSectionDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 15,
  },
  distanceButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  distanceButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  distanceButtonGradient: {
    paddingVertical: 25,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceButtonIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  distanceButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  distanceButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  activeSessionBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  activeSessionText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Séparateur
  sectionSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  separatorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 15,
  },
  gamesSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  
  // ===== STYLES ACTION/VÉRITÉ AVEC RÉPONSES =====
  todResponseContainer: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  todResponseLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  todResponseInput: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 15,
  },
  todSubmitButton: {
    backgroundColor: '#10B981',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
  },
  todSubmitButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  todSubmitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  todActionButtons: {
    gap: 12,
  },
  todActionDoneButton: {
    backgroundColor: '#10B981',
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
  },
  todActionDoneText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  todActionSkipButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  todActionSkipText: {
    fontSize: 15,
    color: '#fff',
  },
  todAnswerContainer: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  todAnswerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  todAnswerBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  todAnswerText: {
    fontSize: 15,
    color: '#fff',
  },
  todPartnerSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  todPartnerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B9D',
    marginBottom: 8,
  },
  todPartnerAnswerBox: {
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#FF6B9D',
  },
  todPartnerAnswerText: {
    fontSize: 15,
    color: '#fff',
  },
  todWaitingPartner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    gap: 10,
  },
  todWaitingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
  },
  // ===== NOUVEAUX STYLES TOUR PAR TOUR =====
  passPhoneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 25,
    marginVertical: 20,
  },
  passPhoneEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  passPhoneTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  passPhoneText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  passPhoneWarning: {
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 25,
    fontWeight: '600',
  },
  passPhoneButton: {
    backgroundColor: '#10B981',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  passPhoneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  wimPhaseContainer: {
    alignItems: 'center',
    padding: 20,
  },
  wimPhaseTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  wimPhaseHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 25,
    textAlign: 'center',
  },
  wimDisagree: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginTop: 15,
    textAlign: 'center',
  },
  wyrPhaseContainer: {
    alignItems: 'center',
    width: '100%',
  },
  wyrPhaseTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
});
