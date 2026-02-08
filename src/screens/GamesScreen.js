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
    firebaseError,
    pendingGameInvite,
    hasActiveSession,
    updateCoupleId,
    coupleId,
    myPlayerId,
  } = useGame();

  // États principaux des jeux
  const [activeGame, setActiveGame] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [showResult, setShowResult] = useState(false);
  const [truthOrDare, setTruthOrDare] = useState(null);
  const [wyrChoice, setWyrChoice] = useState(null);
  const [gameMode, setGameMode] = useState(null); // 'online'
  
  // États pour "Qui est le Plus" TOUR PAR TOUR
  const [wimPhase, setWimPhase] = useState('player1'); // 'player1', 'passPhone', 'player2', 'reveal'
  const [wimPlayer1Answer, setWimPlayer1Answer] = useState(null);
  const [wimPlayer2Answer, setWimPlayer2Answer] = useState(null);
  
  // États pour "Tu Préfères" TOUR PAR TOUR
  const [wyrPhase, setWyrPhase] = useState('player1'); // 'player1', 'passPhone', 'player2', 'reveal'
  const [wyrPlayer1Choice, setWyrPlayer1Choice] = useState(null);
  const [wyrPlayer2Choice, setWyrPlayer2Choice] = useState(null);
  
  // États pour Quiz
  const [quizPhase, setQuizPhase] = useState('player1'); // 'player1', 'player2', 'reveal'
  const [player1Answer, setPlayer1Answer] = useState(null);
  const [player2Answer, setPlayer2Answer] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [quizOpenAnswer, setQuizOpenAnswer] = useState(''); // Réponse texte libre pour questions open

  // États pour Action/Vérité — FIL DE CONVERSATION
  const [todResponse, setTodResponse] = useState('');
  const [todSubmitted, setTodSubmitted] = useState(false);
  const [todRound, setTodRound] = useState(0);
  // Phases: 'modeSelect' → 'choose' → 'writeQuestion' → 'waitQuestion' → 'answer' → 'waitAnswer' → 'react' → 'next'
  const [todPhase, setTodPhase] = useState('modeSelect');
  const [todAsker, setTodAsker] = useState(null);
  const [todAnswerer, setTodAnswerer] = useState(null);
  const [todThread, setTodThread] = useState([]); // Fil de conversation complet
  const [isMyTurnToAsk, setIsMyTurnToAsk] = useState(true);
  const [todPartnerResponse, setTodPartnerResponse] = useState(null);
  const [todGameMode, setTodGameMode] = useState(null); // 'classic' or 'custom'
  const [todCustomQuestion, setTodCustomQuestion] = useState('');
  const [todChosenType, setTodChosenType] = useState(null);
  const todScrollRef = useRef(null); // Ref pour auto-scroll du fil
  
  // États pour le mode multijoueur à distance
  const [showLobby, setShowLobby] = useState(false);
  const [selectedGameForLobby, setSelectedGameForLobby] = useState(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Version 3.1.0 - 100% Online

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
        // ✅ Reset des états avant de démarrer un nouveau jeu
        resetAllGameStates();
        setActiveGame(gameSession.gameType);
      }
    }
  }, [gameSession, waitingForPartner, gameMode]);

  // ✅ Fonction centralisée de reset de TOUS les états de jeu
  const resetAllGameStates = () => {
    setCurrentQuestion(0);
    setScores({ player1: 0, player2: 0 });
    setShowResult(false);
    // Quiz
    setQuizPhase('player1');
    setPlayer1Answer(null);
    setPlayer2Answer(null);
    setCurrentPlayer(1);
    setQuizOpenAnswer('');
    // Who is More
    setWimPhase('player1');
    setWimPlayer1Answer(null);
    setWimPlayer2Answer(null);
    // Would You Rather
    setWyrPhase('player1');
    setWyrPlayer1Choice(null);
    setWyrPlayer2Choice(null);
    setWyrChoice(null);
    // Truth or Dare
    setTruthOrDare(null);
    setTodResponse('');
    setTodSubmitted(false);
    setTodRound(0);
    setTodPhase('modeSelect');
    setTodAsker(null);
    setTodAnswerer(null);
    setTodThread([]);
    setIsMyTurnToAsk(true);
    setTodPartnerResponse(null);
    setTodGameMode(null);
    setTodCustomQuestion('');
    setTodChosenType(null);
    // Online states
    setOnlineAnswerSent(false);
    setOnlinePartnerAnswer(null);
    setOnlineWaitingPartner(false);
    setOnlineReadyForNext(false);
    setOnlinePartnerReady(false);
    setOnlineWaitingNextPartner(false);
  };

  // ═══════════════════════════════════════════════════════
  // ✅ ÉTATS MODE ONLINE POUR QUIZ, WIM, WYR
  // ═══════════════════════════════════════════════════════
  const [onlineAnswerSent, setOnlineAnswerSent] = useState(false);
  const [onlinePartnerAnswer, setOnlinePartnerAnswer] = useState(null);
  const [onlineWaitingPartner, setOnlineWaitingPartner] = useState(false);
  // ✅ SYNC: Attendre que les deux joueurs cliquent "Suivant" avant d'avancer
  const [onlineReadyForNext, setOnlineReadyForNext] = useState(false);
  const [onlinePartnerReady, setOnlinePartnerReady] = useState(false);
  const [onlineWaitingNextPartner, setOnlineWaitingNextPartner] = useState(false);

  // ✅ LISTENER: Détecte les réponses du partenaire pour Quiz/WIM/WYR en mode online
  useEffect(() => {
    if (!activeGame || activeGame === 'truthordare') return;
    if (gameMode !== 'online' || !isFirebaseReady) return;
    if (!gameData?.answers) return;

    const answerKey = `${activeGame}_${currentQuestion}`;
    const answers = gameData.answers[answerKey];
    if (!answers) return;

    // Chercher la réponse du partenaire (pas la mienne)
    const partnerEntry = Object.entries(answers).find(
      ([playerId, data]) => playerId !== myPlayerId && !playerId.startsWith('partner_')
    );

    if (partnerEntry) {
      const [, partnerData] = partnerEntry;
      console.log(`📥 Réponse partenaire reçue pour ${answerKey}:`, partnerData.answer);
      setOnlinePartnerAnswer(partnerData.answer);
      setOnlineWaitingPartner(false);
      
      // Si j'ai déjà répondu, passer en phase reveal
      if (onlineAnswerSent) {
        if (activeGame === 'quiz') setQuizPhase('reveal');
        if (activeGame === 'whoismore') setWimPhase('reveal');
        if (activeGame === 'wouldyourather') setWyrPhase('reveal');
      }
    }
  }, [activeGame, gameMode, isFirebaseReady, gameData, currentQuestion, onlineAnswerSent, myPlayerId]);

  // Helper: Soumettre ma réponse online pour Quiz/WIM/WYR
  const submitOnlineAnswer = async (answer) => {
    const answerKey = `${activeGame}_${currentQuestion}`;
    await submitAnswer(answerKey, {
      answer,
      questionIndex: currentQuestion,
      playerName: user?.name || 'Joueur',
    }, user?.name);
    setOnlineAnswerSent(true);
    setOnlineWaitingPartner(true);
    
    // Vérifier si le partenaire a déjà répondu
    if (onlinePartnerAnswer !== null) {
      setOnlineWaitingPartner(false);
      if (activeGame === 'quiz') setQuizPhase('reveal');
      if (activeGame === 'whoismore') setWimPhase('reveal');
      if (activeGame === 'wouldyourather') setWyrPhase('reveal');
    }
  };

  // ✅ LISTENER: Détecte quand le partenaire clique "Suivant" pour synchroniser
  useEffect(() => {
    if (!activeGame || activeGame === 'truthordare') return;
    if (gameMode !== 'online' || !isFirebaseReady) return;
    if (!gameData?.answers) return;

    const readyKey = `ready_next_${activeGame}_${currentQuestion}`;
    const readyData = gameData.answers[readyKey];
    if (!readyData) return;

    const partnerReady = Object.entries(readyData).find(
      ([playerId]) => playerId !== myPlayerId && !playerId.startsWith('partner_')
    );

    if (partnerReady) {
      console.log(`✅ Partenaire prêt pour question suivante (${readyKey})`);
      setOnlinePartnerReady(true);
      
      // Si moi aussi je suis prêt, avancer automatiquement
      if (onlineReadyForNext) {
        console.log('🚀 Les deux joueurs sont prêts, passage à la question suivante');
        advanceToNextQuestion();
      }
    }
  }, [activeGame, gameMode, isFirebaseReady, gameData, currentQuestion, onlineReadyForNext, myPlayerId]);

  // Helper: Avancer effectivement à la question suivante (appelé quand les 2 sont prêts)
  const advanceToNextQuestion = () => {
    // Reset tous les états online
    setOnlineAnswerSent(false);
    setOnlinePartnerAnswer(null);
    setOnlineWaitingPartner(false);
    setOnlineReadyForNext(false);
    setOnlinePartnerReady(false);
    setOnlineWaitingNextPartner(false);

    if (activeGame === 'quiz') {
      if (currentQuestion < 9) {
        setCurrentQuestion(prev => prev + 1);
        setQuizPhase('player1');
        setPlayer1Answer(null);
        setPlayer2Answer(null);
        setQuizOpenAnswer('');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setShowResult(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        notifyGameWin('Quiz Couple');
      }
    } else if (activeGame === 'whoismore') {
      if (currentQuestion < WHO_IS_MORE.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setWimPhase('player1');
        setWimPlayer1Answer(null);
        setWimPlayer2Answer(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setShowResult(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        notifyGameWin('Qui est le Plus');
      }
    } else if (activeGame === 'wouldyourather') {
      if (currentQuestion < WOULD_YOU_RATHER.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setWyrPhase('player1');
        setWyrPlayer1Choice(null);
        setWyrPlayer2Choice(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setShowResult(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        notifyGameWin('Tu Préfères');
      }
    }
  };

  // Helper: Signaler que je suis prêt pour la question suivante (envoie signal Firebase + attend partenaire)
  const signalReadyForNext = async () => {
    const readyKey = `ready_next_${activeGame}_${currentQuestion}`;
    await submitAnswer(readyKey, {
      ready: true,
      playerName: user?.name || 'Joueur',
      timestamp: Date.now(),
    }, user?.name);
    setOnlineReadyForNext(true);
    setOnlineWaitingNextPartner(true);

    // Vérifier si le partenaire a déjà cliqué "Suivant"
    if (onlinePartnerReady) {
      console.log('🚀 Partenaire déjà prêt, passage immédiat');
      advanceToNextQuestion();
    }
  };

  // Helper: Passer à la question suivante en mode online (reset online states) — mode local uniquement
  const nextOnlineQuestion = () => {
    setOnlineAnswerSent(false);
    setOnlinePartnerAnswer(null);
    setOnlineWaitingPartner(false);
    setOnlineReadyForNext(false);
    setOnlinePartnerReady(false);
    setOnlineWaitingNextPartner(false);
  };

  // ✅ NOUVEAU: Écouter les données du partenaire en Action/Vérité
  useEffect(() => {
    if (activeGame !== 'truthordare' || !isFirebaseReady) return;
    if (gameMode !== 'online') return;
    
    const myName = user?.name || 'Moi';
    const partnerName = partner?.name || 'Partenaire';
    
    // 1. Écouter le choix Action/Vérité du partenaire (mode personnalisé)
    const choiceKey = `tod_choice_${todRound}`;
    if (gameData?.answers?.[choiceKey] && todPhase === 'choose' && todGameMode === 'custom') {
      const choices = gameData.answers[choiceKey];
      const partnerChoice = Object.entries(choices).find(
        ([playerId, data]) => playerId !== myPlayerId && !playerId.startsWith('partner_')
      );
      
      if (partnerChoice) {
        const [, choiceData] = partnerChoice;
        if (choiceData.chosenBy !== myName) {
          console.log('📨 Partenaire a choisi:', choiceData.type);
          setTodChosenType(choiceData.type);
          // Ajouter le choix du partenaire dans le fil
          addToThread({
            type: 'choice',
            player: choiceData.chosenBy,
            choice: choiceData.type,
            text: choiceData.type === 'truth' ? '💬 Vérité' : '⚡ Action',
            round: todRound,
          });
          setTodPhase('writeQuestion');
        }
      }
    }
    
    // 2. Écouter la question posée par le partenaire
    const questionKey = `tod_question_${todRound}`;
    if (gameData?.answers?.[questionKey] && !truthOrDare) {
      const questions = gameData.answers[questionKey];
      const partnerQuestion = Object.entries(questions).find(
        ([playerId, data]) => playerId !== myPlayerId && !playerId.startsWith('partner_')
      );
      
      if (partnerQuestion) {
        const [, questionData] = partnerQuestion;
        if (questionData.mustAnswerBy === myName) {
          console.log('📨 Question du partenaire reçue:', questionData);
          setTruthOrDare({ type: questionData.type, text: questionData.text, round: questionData.round });
          setTodAsker(questionData.askedBy);
          setTodAnswerer(questionData.mustAnswerBy);
          setTodChosenType(questionData.type);
          // Ajouter la question du partenaire dans le fil
          addToThread({
            type: 'question',
            player: questionData.askedBy,
            questionType: questionData.type,
            text: questionData.text,
            round: todRound,
          });
          setTodPhase('answer');
        }
      }
    }

    // 3. Écouter la réponse du partenaire
    if (todPhase === 'waitAnswer' || todPhase === 'react') {
      const responseKey = `tod_response_${todRound}`;
      if (gameData?.answers?.[responseKey]) {
        const responses = gameData.answers[responseKey];
        const partnerResponse = Object.entries(responses).find(
          ([playerId, data]) => playerId !== myPlayerId && !playerId.startsWith('partner_')
        );
        
        if (partnerResponse) {
          const [, responseData] = partnerResponse;
          console.log('✅ Réponse du partenaire reçue:', responseData);
          setTodPartnerResponse(responseData);
          if (todPhase === 'waitAnswer') {
            // Ajouter la réponse du partenaire dans le fil
            addToThread({
              type: 'response',
              player: responseData.respondedBy || partnerName,
              text: responseData.response,
              round: todRound,
            });
            setTodPhase('react');
          }
        }
      }
    }
    
    // 4. Écouter la réaction du partenaire
    const reactionKey = `tod_reaction_${todRound}`;
    if (gameData?.answers?.[reactionKey]) {
      const reactions = gameData.answers[reactionKey];
      const partnerReaction = Object.entries(reactions).find(
        ([playerId, data]) => playerId !== myPlayerId && !playerId.startsWith('partner_')
      );
      if (partnerReaction) {
        const [, reactionData] = partnerReaction;
        addReactionToThread(reactionData.reaction);
      }
    }
  }, [activeGame, gameMode, isFirebaseReady, gameData, todRound, todPhase, todSubmitted, myPlayerId, user?.name, truthOrDare, todGameMode]);

  // ✅ Synchroniser le tour de question en mode online via gameSession
  useEffect(() => {
    if (activeGame === 'truthordare' && gameMode === 'online' && gameSession) {
      // Le créateur de la session commence à poser
      const iAmCreator = gameSession.createdBy === myPlayerId;
      // Tour pair = créateur pose, tour impair = l'autre pose
      const creatorAsks = todRound % 2 === 0;
      setIsMyTurnToAsk(iAmCreator ? creatorAsks : !creatorAsks);
    }
  }, [activeGame, gameMode, gameSession, todRound, myPlayerId]);

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
      // ✅ Toujours démarrer le jeu après join réussi
      setShowLobby(false);
      resetAllGameStates();
      setActiveGame(result.gameType);
      Alert.alert('🎉 Connecté !', 'Vous avez rejoint la partie !');
    } else {
      Alert.alert(
        'Aucune partie trouvée',
        'Votre partenaire n\'a pas encore créé de partie.\nDemandez-lui de créer une partie d\'abord.',
        [{ text: 'OK' }]
      );
    }
  };

  const startGame = (game) => {
    // Proposer le choix : online (lobby) ou local (même téléphone)
    Alert.alert(
      getGameTitle(game),
      'Comment voulez-vous jouer ?',
      [
        {
          text: '🌐 À distance',
          onPress: () => openGameLobby(game),
        },
        {
          text: '📱 Même téléphone',
          onPress: () => {
            resetAllGameStates();
            setGameMode('local');
            setActiveGame(game);
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const nextQuestion = () => {
    if (currentQuestion < 9) {
      setCurrentQuestion(currentQuestion + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setShowResult(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // ✅ Notifier le partenaire de la fin du jeu
      notifyGameWin('Quiz Couple');
    }
  };

  // Helper: ajouter un message dans le fil de conversation
  const addToThread = (entry) => {
    setTodThread(prev => [...prev, { ...entry, id: Date.now(), timestamp: new Date().toISOString() }]);
    setTimeout(() => todScrollRef.current?.scrollToEnd?.({ animated: true }), 200);
  };

  // Helper: ajouter une réaction à la dernière entrée du fil
  const addReactionToThread = (emoji) => {
    setTodThread(prev => {
      const updated = [...prev];
      // Trouver la dernière réponse
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].type === 'response') {
          updated[i] = { ...updated[i], reaction: emoji };
          break;
        }
      }
      return updated;
    });
  };

  const selectTruthOrDare = async (type) => {
    const myName = user?.name || 'Moi';
    const partnerName = partner?.name || 'Partenaire';
    
    setTodChosenType(type);
    setTodResponse('');
    setTodSubmitted(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Ajouter le choix dans le fil
    const chooserName = isMyTurnToAsk ? partnerName : myName;
    addToThread({
      type: 'choice',
      player: chooserName,
      choice: type,
      text: type === 'truth' ? '💬 Vérité' : '⚡ Action',
      round: todRound,
    });
    
    if (todGameMode === 'custom') {
      // MODE PERSONNALISÉ
      setTodAsker(isMyTurnToAsk ? myName : partnerName);
      setTodAnswerer(isMyTurnToAsk ? partnerName : myName);
      
      if (gameMode === 'online' && isFirebaseReady) {
        await submitAnswer(`tod_choice_${todRound}`, {
          type,
          chosenBy: myName,
          round: todRound,
          timestamp: Date.now()
        }, myName);
      }
      
      if (isMyTurnToAsk) {
        setTodPhase('writeQuestion');
      } else {
        setTodPhase('waitQuestion');
      }
    } else {
      // MODE CLASSIQUE: Question aléatoire
      const items = type === 'truth' ? TRUTH_OR_DARE.truths : TRUTH_OR_DARE.dares;
      const random = items[Math.floor(Math.random() * items.length)];
      const selection = { type, text: random, round: todRound };
      setTruthOrDare(selection);
      
      const asker = isMyTurnToAsk ? myName : partnerName;
      const answerer = isMyTurnToAsk ? partnerName : myName;
      setTodAsker(asker);
      setTodAnswerer(answerer);
      
      // Ajouter la question dans le fil
      addToThread({
        type: 'question',
        player: asker,
        questionType: type,
        text: random,
        round: todRound,
      });
      
      if (isMyTurnToAsk) {
        setTodPhase('waitAnswer');
      } else {
        setTodPhase('answer');
      }
      
      if (gameMode === 'online' && isFirebaseReady) {
        await submitAnswer(`tod_question_${todRound}`, { 
          type, text: random, 
          askedBy: asker, mustAnswerBy: answerer,
          round: todRound, mode: 'classic',
          timestamp: Date.now()
        }, myName);
      }
    }
  };

  // Envoyer une question personnalisée au partenaire
  const submitCustomQuestion = async () => {
    if (!todCustomQuestion.trim()) {
      Alert.alert('Oops', 'Écris une question ou un défi pour ton partenaire !');
      return;
    }
    
    const myName = user?.name || 'Moi';
    const partnerName = partner?.name || 'Partenaire';
    const questionText = todCustomQuestion.trim();
    const selection = { type: todChosenType, text: questionText, round: todRound };
    setTruthOrDare(selection);
    
    // Ajouter la question dans le fil
    addToThread({
      type: 'question',
      player: myName,
      questionType: todChosenType,
      text: questionText,
      round: todRound,
    });
    
    setTodPhase('waitAnswer');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (gameMode === 'online' && isFirebaseReady) {
      await submitAnswer(`tod_question_${todRound}`, {
        type: todChosenType, text: questionText,
        askedBy: myName, mustAnswerBy: partnerName,
        round: todRound, mode: 'custom',
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
    
    const myName = user?.name || 'Moi';
    const responseText = todResponse.trim();
    
    // Ajouter la réponse dans le fil
    addToThread({
      type: 'response',
      player: myName,
      text: responseText,
      round: todRound,
    });
    
    setTodSubmitted(true);
    setTodPhase('react');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (gameMode === 'online' && isFirebaseReady) {
      await submitAnswer(`tod_response_${todRound}`, {
        response: responseText,
        respondedBy: myName,
        question: truthOrDare,
        round: todRound,
        timestamp: Date.now()
      }, myName);
      await notifyGameAnswer();
    }
  };

  // Confirmer qu'une Action a été réalisée
  const confirmActionDone = async () => {
    const myName = user?.name || 'Moi';
    const responseText = '✅ Action réalisée !';
    
    addToThread({
      type: 'response',
      player: myName,
      text: responseText,
      round: todRound,
    });
    
    setTodSubmitted(true);
    setTodResponse(responseText);
    setTodPhase('react');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (gameMode === 'online' && isFirebaseReady) {
      await submitAnswer(`tod_response_${todRound}`, {
        response: responseText,
        respondedBy: myName,
        question: truthOrDare,
        round: todRound,
        timestamp: Date.now()
      }, myName);
      await notifyGameAnswer();
    }
  };

  // Réagir avec un emoji et passer au tour suivant
  const reactAndNextRound = (emoji) => {
    const myName = user?.name || 'Moi';
    
    // Ajouter la réaction dans le fil
    addReactionToThread(emoji);
    addToThread({
      type: 'reaction',
      player: myName,
      text: emoji,
      round: todRound,
    });
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Synchroniser la réaction en mode online
    if (gameMode === 'online' && isFirebaseReady) {
      submitAnswer(`tod_reaction_${todRound}`, {
        reaction: emoji,
        reactedBy: myName,
        round: todRound,
        timestamp: Date.now()
      }, myName);
    }
    
    // Passer au tour suivant après un court délai
    setTimeout(() => {
      setTruthOrDare(null);
      setTodResponse('');
      setTodSubmitted(false);
      setTodRound(prev => prev + 1);
      setTodPhase('choose');
      setTodCustomQuestion('');
      setTodChosenType(null);
      setTodPartnerResponse(null);
      setIsMyTurnToAsk(prev => !prev);
    }, 800);
  };

  // Passer au tour suivant d'Action/Vérité (alterner les rôles)
  const nextTodRound = () => {
    setTruthOrDare(null);
    setTodResponse('');
    setTodSubmitted(false);
    setTodRound(prev => prev + 1);
    setTodPhase('choose');
    setTodCustomQuestion('');
    setTodChosenType(null);
    setTodPartnerResponse(null);
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
      // ✅ Notifier le partenaire de la fin du jeu
      notifyGameWin('Tu Préfères');
    }
  };

  const renderWouldYouRather = () => {
    const myName = user?.name || 'Moi';
    const partnerName = partner?.name || 'Partenaire';
    const currentQ = WOULD_YOU_RATHER[currentQuestion];
    const isOnline = gameMode === 'online';

    // ══════ MODE ONLINE ══════
    const handleWyrAnswerOnline = async (choice) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setWyrPlayer1Choice(choice);
      setWyrPhase('waitingPartner');
      await submitOnlineAnswer(choice);
    };

    // ══════ MODE LOCAL ══════
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
      // ✅ MODE ONLINE: Signaler qu'on est prêt et attendre le partenaire
      if (isOnline) {
        setWyrPhase('waitingNext');
        signalReadyForNext();
        return;
      }
      // MODE LOCAL: Avancer directement
      if (currentQuestion < WOULD_YOU_RATHER.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setWyrPhase('player1');
        setWyrPlayer1Choice(null);
        setWyrPlayer2Choice(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setShowResult(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        notifyGameWin('Tu Préfères');
      }
    };

    // Options partagées
    const renderWyrOptions = (onAnswer) => (
      <>
        <TouchableOpacity
          style={styles.wyrOption}
          onPress={() => onAnswer(1)}
        >
          <Text style={styles.wyrOptionText}>{currentQ.option1}</Text>
        </TouchableOpacity>

        <Text style={styles.wyrOr}>OU</Text>

        <TouchableOpacity
          style={styles.wyrOption}
          onPress={() => onAnswer(2)}
        >
          <Text style={styles.wyrOptionText}>{currentQ.option2}</Text>
        </TouchableOpacity>
      </>
    );

    // Déterminer la réponse du partenaire (online vs local)
    const partnerChoice = isOnline ? onlinePartnerAnswer : wyrPlayer2Choice;

    return (
      <View style={styles.gameContainer}>
        {!showResult ? (
          <>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / WOULD_YOU_RATHER.length) * 100}%` }]} />
            </View>
            <Text style={styles.questionNumber}>{currentQuestion + 1}/{WOULD_YOU_RATHER.length}</Text>
            
            <Text style={styles.wyrTitle}>Tu préfères...</Text>

            {/* ══════ MODE ONLINE: Chaque joueur choisit sur son tel ══════ */}
            {isOnline && wyrPhase === 'player1' && (
              <View style={styles.wyrPhaseContainer}>
                <Text style={styles.wyrPhaseTitle}>🌐 Fais ton choix !</Text>
                {renderWyrOptions(handleWyrAnswerOnline)}
              </View>
            )}

            {/* MODE ONLINE: En attente */}
            {isOnline && wyrPhase === 'waitingPartner' && (
              <View style={styles.onlineWaitingContainer}>
                <Text style={styles.onlineWaitingEmoji}>⏳</Text>
                <Text style={styles.onlineWaitingTitle}>Choix envoyé !</Text>
                <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 15 }} />
                <Text style={styles.onlineWaitingText}>
                  En attente du choix de {partnerName}...
                </Text>
              </View>
            )}

            {/* ══════ MODE LOCAL: Phase 1 ══════ */}
            {!isOnline && wyrPhase === 'player1' && (
              <View style={styles.wyrPhaseContainer}>
                <Text style={styles.wyrPhaseTitle}>🎯 C'est au tour de {myName}</Text>
                {renderWyrOptions(handleWyrAnswer)}
              </View>
            )}

            {/* MODE LOCAL: Passer le téléphone */}
            {!isOnline && wyrPhase === 'passPhone' && (
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

            {/* MODE LOCAL: Phase 2 */}
            {!isOnline && wyrPhase === 'player2' && (
              <View style={styles.wyrPhaseContainer}>
                <Text style={styles.wyrPhaseTitle}>🎯 C'est au tour de {partnerName}</Text>
                {renderWyrOptions(handleWyrAnswer)}
              </View>
            )}

            {/* ══════ REVEAL (online + local) ══════ */}
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
                      {partnerChoice === 1 ? currentQ.option1 : currentQ.option2}
                    </Text>
                  </View>
                  
                  {wyrPlayer1Choice === partnerChoice ? (
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

            {/* ══════ MODE ONLINE: En attente que le partenaire clique Suivant ══════ */}
            {isOnline && wyrPhase === 'waitingNext' && (
              <View style={styles.onlineWaitingContainer}>
                <Text style={styles.onlineWaitingEmoji}>⏳</Text>
                <Text style={styles.onlineWaitingTitle}>Prêt !</Text>
                <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 15 }} />
                <Text style={styles.onlineWaitingText}>
                  En attente de {partnerName} pour continuer...
                </Text>
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
                if (isOnline) nextOnlineQuestion();
              }}
            >
              <Text style={styles.playAgainText}>🔄 Rejouer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quitGameButton}
              onPress={() => {
                setActiveGame(null);
                endGameSession();
                setGameMode(null);
                resetAllGameStates();
              }}
            >
              <Text style={styles.quitGameText}>🚪 Quitter</Text>
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
          <Text style={styles.lobbySubtitle}>Jouez à distance, chacun sur votre téléphone</Text>

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
                
                if (session && !session.error) {
                  setGameMode('online');
                  resetAllGameStates();
                  // ✅ Toujours démarrer le jeu après join réussi
                  setActiveGame(pendingGameInvite.gameType);
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
              // ✅ Proposer le choix du jeu au lieu de forcer quiz
              Alert.alert(
                '🎮 Choisir un jeu',
                'Quel jeu voulez-vous jouer \u00e0 distance ?',
                [
                  { text: '🧠 Quiz Couple', onPress: () => openGameLobby('quiz') },
                  { text: '🏆 Qui est le Plus', onPress: () => openGameLobby('whoismore') },
                  { text: '🤔 Tu Pr\u00e9f\u00e8res', onPress: () => openGameLobby('wouldyourather') },
                  { text: '🎲 Action/V\u00e9rit\u00e9', onPress: () => openGameLobby('truthordare') },
                  { text: 'Annuler', style: 'cancel' },
                ]
              );
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
              const result = await joinGameSession(user?.name || 'Joueur 2');
              setIsJoiningGame(false);
              
              if (result && !result.error) {
                setGameMode('online');
                const gameType = result.gameType || gameSession?.gameType;
                Alert.alert('🎉 Connecté !', `Vous rejoignez ${getGameTitle(gameType)}`);
                // ✅ Toujours démarrer le jeu après join réussi
                // (joinGameSession retourne maintenant les données fraîches avec status='ready')
                resetAllGameStates();
                setActiveGame(gameType);
              } else {
                Alert.alert(
                  '😕 Aucune partie',
                  result?.error || 'Votre partenaire n\'a pas encore créé de partie.\n\nDemandez-lui de cliquer sur "CRÉER une partie" d\'abord !',
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
    const isOnline = gameMode === 'online';
    
    // ══════ MODE ONLINE ══════
    const handleQuizAnswerOnline = async (answer) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPlayer1Answer(answer);
      setQuizPhase('waitingPartner');
      await submitOnlineAnswer(answer);
    };

    // ══════ MODE LOCAL (passe le téléphone) ══════
    const handleQuizAnswer = (answer) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (quizPhase === 'player1') {
        setPlayer1Answer(answer);
        setQuizPhase('passPhone1');
      } else if (quizPhase === 'player2') {
        setPlayer2Answer(answer);
        setQuizPhase('reveal');
      }
    };

    const handleQuizNext = () => {
      // ✅ MODE ONLINE: Signaler qu'on est prêt et attendre le partenaire
      if (isOnline) {
        setQuizPhase('waitingNext');
        signalReadyForNext();
        return;
      }
      // MODE LOCAL: Avancer directement
      if (currentQuestion < 9) {
        setCurrentQuestion(currentQuestion + 1);
        setQuizPhase('player1');
        setPlayer1Answer(null);
        setPlayer2Answer(null);
        setQuizOpenAnswer('');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setShowResult(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        notifyGameWin('Quiz Couple');
      }
    };

    const handleCorrect = (player) => {
      setScores(prev => ({
        ...prev,
        [player]: prev[player] + 1,
      }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // Afficher les options de réponse (partagé)
    const renderQuizOptions = (onAnswer) => (
      question.type === 'choice' ? (
        <View style={styles.quizOptions}>
          {question.options.map((option, idx) => (
            <TouchableOpacity
              key={`opt-${idx}`}
              style={styles.quizOptionButton}
              onPress={() => onAnswer(option)}
            >
              <Text style={styles.quizOptionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.quizOpenContainer}
        >
          <Text style={styles.quizOpenLabel}>📝 Écris ta réponse :</Text>
          <TextInput
            style={styles.quizOpenInput}
            value={quizOpenAnswer}
            onChangeText={setQuizOpenAnswer}
            placeholder="Tape ta réponse ici..."
            placeholderTextColor="#999"
            multiline
            maxLength={200}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[
              styles.quizOpenSubmitButton,
              !quizOpenAnswer.trim() && styles.quizOpenSubmitDisabled
            ]}
            onPress={() => {
              if (quizOpenAnswer.trim()) {
                onAnswer(quizOpenAnswer.trim());
                setQuizOpenAnswer('');
              }
            }}
            disabled={!quizOpenAnswer.trim()}
          >
            <Text style={styles.quizOpenSubmitText}>
              {quizOpenAnswer.trim() ? 'Envoyer ma réponse ✓' : 'Écris ta réponse...'}
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )
    );

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

            {/* ══════ MODE ONLINE: Chaque joueur répond sur son tel ══════ */}
            {isOnline && quizPhase === 'player1' && (
              <View style={styles.quizPhaseContainer}>
                <Text style={styles.quizPhaseTitle}>🌐 Réponds à la question !</Text>
                <Text style={styles.quizPhaseHint}>{partnerName} répond aussi de son côté</Text>
                {renderQuizOptions(handleQuizAnswerOnline)}
              </View>
            )}

            {/* MODE ONLINE: En attente du partenaire */}
            {isOnline && quizPhase === 'waitingPartner' && (
              <View style={styles.onlineWaitingContainer}>
                <Text style={styles.onlineWaitingEmoji}>⏳</Text>
                <Text style={styles.onlineWaitingTitle}>Réponse envoyée !</Text>
                <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 15 }} />
                <Text style={styles.onlineWaitingText}>
                  En attente de la réponse de {partnerName}...
                </Text>
              </View>
            )}

            {/* ══════ MODE LOCAL: Phase 1 ══════ */}
            {!isOnline && quizPhase === 'player1' && (
              <View style={styles.quizPhaseContainer}>
                <Text style={styles.quizPhaseTitle}>🎯 C'est au tour de {myName}</Text>
                <Text style={styles.quizPhaseHint}>{partnerName} doit deviner ta réponse ensuite !</Text>
                {renderQuizOptions(handleQuizAnswer)}
              </View>
            )}

            {/* MODE LOCAL: Passer le téléphone */}
            {!isOnline && quizPhase === 'passPhone1' && (
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

            {/* MODE LOCAL: Phase 2 */}
            {!isOnline && quizPhase === 'player2' && (
              <View style={styles.quizPhaseContainer}>
                <Text style={styles.quizPhaseTitle}>🤔 C'est au tour de {partnerName}</Text>
                <Text style={styles.quizPhaseHint}>Devine la réponse de {myName} !</Text>
                {renderQuizOptions(handleQuizAnswer)}
              </View>
            )}

            {/* ══════ REVEAL (online + local) ══════ */}
            {quizPhase === 'reveal' && (
              <View style={styles.quizRevealContainer}>
                <Text style={styles.quizRevealTitle}>🎯 Comparez vos réponses !</Text>
                
                <View style={styles.quizRevealAnswers}>
                  <View style={question.type === 'open' ? styles.quizRevealAnswerOpen : styles.quizRevealAnswer}>
                    <Text style={styles.quizRevealLabel}>{myName} :</Text>
                    <Text style={question.type === 'open' ? styles.quizRevealValueOpen : styles.quizRevealValue}>
                      {player1Answer}
                    </Text>
                  </View>
                  <View style={question.type === 'open' ? styles.quizRevealAnswerOpen : styles.quizRevealAnswer}>
                    <Text style={styles.quizRevealLabel}>{partnerName} :</Text>
                    <Text style={question.type === 'open' ? styles.quizRevealValueOpen : styles.quizRevealValue}>
                      {isOnline ? onlinePartnerAnswer : player2Answer}
                    </Text>
                  </View>
                  {question.type === 'choice' && (isOnline ? player1Answer === onlinePartnerAnswer : player1Answer === player2Answer) && (
                    <Text style={styles.quizMatch}>✨ Match parfait !</Text>
                  )}
                  {question.type === 'open' && (
                    <Text style={styles.quizOpenCompareHint}>💬 Discutez de vos réponses !</Text>
                  )}
                </View>

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

            {/* ══════ MODE ONLINE: En attente que le partenaire clique Suivant ══════ */}
            {isOnline && quizPhase === 'waitingNext' && (
              <View style={styles.onlineWaitingContainer}>
                <Text style={styles.onlineWaitingEmoji}>⏳</Text>
                <Text style={styles.onlineWaitingTitle}>Prêt !</Text>
                <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 15 }} />
                <Text style={styles.onlineWaitingText}>
                  En attente de {partnerName} pour continuer...
                </Text>
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
              onPress={() => {
                setCurrentQuestion(0);
                setScores({ player1: 0, player2: 0 });
                setShowResult(false);
                setQuizPhase('player1');
                setPlayer1Answer(null);
                setPlayer2Answer(null);
                setQuizOpenAnswer('');
                if (isOnline) nextOnlineQuestion();
              }}
            >
              <Text style={styles.playAgainText}>🔄 Rejouer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quitGameButton}
              onPress={() => {
                setActiveGame(null);
                endGameSession();
                setGameMode(null);
                resetAllGameStates();
              }}
            >
              <Text style={styles.quitGameText}>🚪 Quitter</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderTruthOrDare = () => {
    const myName = user?.name || 'Moi';
    const partnerName = partner?.name || 'Partenaire';
    
    // Rendu d'une bulle dans le fil de conversation
    const renderThreadBubble = (item, index) => {
      const isMe = item.player === myName;
      
      if (item.type === 'choice') {
        return (
          <View key={item.id || index} style={styles.todBubbleRow}>
            <View style={[styles.todBubbleSystem]}>
              <Text style={styles.todBubbleSystemText}>
                {item.player} choisit → {item.text}
              </Text>
            </View>
          </View>
        );
      }
      
      if (item.type === 'question') {
        return (
          <View key={item.id || index} style={[styles.todBubbleRow, isMe ? styles.todBubbleRowRight : styles.todBubbleRowLeft]}>
            <View style={styles.todBubbleName}>
              <Text style={styles.todBubbleNameText}>{item.player}</Text>
            </View>
            <View style={[styles.todBubble, styles.todBubbleQuestion]}>
              <Text style={styles.todBubbleTypeTag}>
                {item.questionType === 'truth' ? '💬 Vérité' : '⚡ Action'}
              </Text>
              <Text style={styles.todBubbleQuestionText}>{item.text}</Text>
            </View>
          </View>
        );
      }
      
      if (item.type === 'response') {
        return (
          <View key={item.id || index} style={[styles.todBubbleRow, isMe ? styles.todBubbleRowRight : styles.todBubbleRowLeft]}>
            <View style={styles.todBubbleName}>
              <Text style={styles.todBubbleNameText}>{item.player}</Text>
            </View>
            <View style={[styles.todBubble, styles.todBubbleResponse]}>
              <Text style={styles.todBubbleResponseLabel}>Réponse :</Text>
              <Text style={styles.todBubbleResponseText}>{item.text}</Text>
              {item.reaction && (
                <View style={styles.todBubbleReactionBadge}>
                  <Text style={styles.todBubbleReactionBadgeText}>{item.reaction}</Text>
                </View>
              )}
            </View>
          </View>
        );
      }
      
      if (item.type === 'reaction') {
        return (
          <View key={item.id || index} style={[styles.todBubbleRow, isMe ? styles.todBubbleRowRight : styles.todBubbleRowLeft]}>
            <View style={styles.todReactionInline}>
              <Text style={styles.todReactionInlineText}>{item.player} → {item.text}</Text>
            </View>
          </View>
        );
      }
      
      return null;
    };
    
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.gameContainer}
        keyboardVerticalOffset={100}
      >
        {/* Header */}
        <View style={styles.todTurnIndicator}>
          <Text style={styles.todTurnText}>
            {todGameMode 
              ? (todGameMode === 'custom' ? '✍️ Mode Personnalisé' : '🎲 Mode Classique')
              : '🎭 Action ou Vérité'}
          </Text>
          <Text style={styles.todRoundText}>Tour {todRound + 1}</Text>
        </View>

        {/* ===================== PHASE: MODE SELECT ===================== */}
        {todPhase === 'modeSelect' && (
          <View style={styles.todChoice}>
            <Text style={[styles.todTitle, { fontSize: 22 }]}>Choisis un mode :</Text>
            
            <TouchableOpacity
              style={styles.todButton}
              onPress={() => {
                setTodGameMode('classic');
                setTodPhase('choose');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            >
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.todButtonGradient}>
                <Text style={styles.todButtonIcon}>🎲</Text>
                <Text style={styles.todButtonText}>CLASSIQUE</Text>
                <Text style={styles.todButtonHint}>Questions aléatoires du jeu</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={styles.todOr}>ou</Text>
            
            <TouchableOpacity
              style={styles.todButton}
              onPress={() => {
                setTodGameMode('custom');
                setTodPhase('choose');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            >
              <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.todButtonGradient}>
                <Text style={styles.todButtonIcon}>✍️</Text>
                <Text style={styles.todButtonText}>PERSONNALISÉ</Text>
                <Text style={styles.todButtonHint}>Écrivez vos propres questions !</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ================ FIL DE CONVERSATION (visible après modeSelect) ================ */}
        {todPhase !== 'modeSelect' && (
          <>
            {/* Le fil de discussion scrollable */}
            <ScrollView 
              ref={todScrollRef}
              style={styles.todThreadContainer}
              contentContainerStyle={styles.todThreadContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => todScrollRef.current?.scrollToEnd?.({ animated: true })}
            >
              {/* Séparateur de début */}
              {todThread.length === 0 && (
                <View style={styles.todThreadEmpty}>
                  <Text style={styles.todThreadEmptyText}>
                    {isMyTurnToAsk 
                      ? `C'est ton tour ! Choisis Action ou Vérité pour ${partnerName}` 
                      : `C'est le tour de ${partnerName}. En attente...`}
                  </Text>
                </View>
              )}
              
              {/* Toutes les bulles */}
              {todThread.map((item, index) => renderThreadBubble(item, index))}
              
              {/* Indicateur d'attente si nécessaire */}
              {(todPhase === 'waitAnswer' || todPhase === 'waitQuestion') && (
                <View style={styles.todThreadWaiting}>
                  <ActivityIndicator size="small" color="#FF6B9D" />
                  <Text style={styles.todThreadWaitingText}>
                    {todPhase === 'waitAnswer' 
                      ? `${todAnswerer || partnerName} écrit sa réponse...`
                      : `${partnerName} écrit la question...`}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* ===================== ZONE D'ACTION (en bas) ===================== */}
            
            {/* PHASE: CHOOSE — Boutons Action/Vérité */}
            {todPhase === 'choose' && (
              <View style={styles.todBottomBar}>
                {isMyTurnToAsk ? (
                  <>
                    <Text style={styles.todBottomLabel}>
                      {todGameMode === 'custom' 
                        ? `Choisis pour ${partnerName} :`
                        : `Choisis pour ${partnerName} :`}
                    </Text>
                    <View style={styles.todBottomButtons}>
                      <TouchableOpacity
                        style={[styles.todBottomBtn, { backgroundColor: '#3B82F6' }]}
                        onPress={() => selectTruthOrDare('truth')}
                      >
                        <Text style={styles.todBottomBtnText}>💬 VÉRITÉ</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.todBottomBtn, { backgroundColor: '#EF4444' }]}
                        onPress={() => selectTruthOrDare('dare')}
                      >
                        <Text style={styles.todBottomBtnText}>⚡ ACTION</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={styles.todBottomWait}>
                    <ActivityIndicator size="small" color="#FF6B9D" />
                    <Text style={styles.todBottomWaitText}>
                      {partnerName} choisit Action ou Vérité...
                    </Text>
                    {gameMode !== 'online' && (
                      <TouchableOpacity
                        style={styles.todBottomLocalBtn}
                        onPress={() => setIsMyTurnToAsk(true)}
                      >
                        <Text style={styles.todBottomLocalBtnText}>👋 C'est mon tour</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* PHASE: WRITE QUESTION — Input pour écrire la question */}
            {todPhase === 'writeQuestion' && (
              <View style={styles.todBottomBar}>
                <Text style={styles.todBottomLabel}>
                  {todChosenType === 'truth' ? '💬 Écris ta question :' : '⚡ Écris ton défi :'}
                </Text>
                <View style={styles.todInputRow}>
                  <TextInput
                    style={styles.todBottomInput}
                    value={todCustomQuestion}
                    onChangeText={setTodCustomQuestion}
                    placeholder={todChosenType === 'truth' 
                      ? "Pose ta question..." 
                      : "Décris le défi..."}
                    placeholderTextColor="#999"
                    multiline
                    maxLength={300}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[styles.todSendBtn, !todCustomQuestion.trim() && styles.todSendBtnDisabled]}
                    onPress={submitCustomQuestion}
                    disabled={!todCustomQuestion.trim()}
                  >
                    <Text style={styles.todSendBtnText}>✉️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* PHASE: WAIT QUESTION — En attente de la question */}
            {todPhase === 'waitQuestion' && (
              <View style={styles.todBottomBar}>
                <View style={styles.todBottomWait}>
                  <ActivityIndicator size="small" color="#FF6B9D" />
                  <Text style={styles.todBottomWaitText}>
                    {partnerName} écrit {todChosenType === 'truth' ? 'une question' : 'un défi'} pour toi...
                  </Text>
                </View>
              </View>
            )}

            {/* PHASE: ANSWER — Input pour répondre */}
            {todPhase === 'answer' && truthOrDare && (
              <View style={styles.todBottomBar}>
                {truthOrDare.type === 'truth' ? (
                  <>
                    <Text style={styles.todBottomLabel}>📝 Ta réponse :</Text>
                    <View style={styles.todInputRow}>
                      <TextInput
                        style={styles.todBottomInput}
                        value={todResponse}
                        onChangeText={setTodResponse}
                        placeholder="Écris ta réponse..."
                        placeholderTextColor="#999"
                        multiline
                        maxLength={500}
                        autoFocus
                      />
                      <TouchableOpacity
                        style={[styles.todSendBtn, !todResponse.trim() && styles.todSendBtnDisabled]}
                        onPress={submitTodResponse}
                        disabled={!todResponse.trim()}
                      >
                        <Text style={styles.todSendBtnText}>✓</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.todBottomLabel}>⚡ As-tu fait l'action ?</Text>
                    <View style={styles.todBottomButtons}>
                      <TouchableOpacity
                        style={[styles.todBottomBtn, { backgroundColor: '#10B981' }]}
                        onPress={confirmActionDone}
                      >
                        <Text style={styles.todBottomBtnText}>✅ Fait !</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.todBottomBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                        onPress={() => {
                          const responseText = '❌ Action passée...';
                          addToThread({ type: 'response', player: myName, text: responseText, round: todRound });
                          setTodSubmitted(true);
                          setTodResponse(responseText);
                          setTodPhase('react');
                          if (gameMode === 'online' && isFirebaseReady) {
                            submitAnswer(`tod_response_${todRound}`, {
                              response: responseText, respondedBy: myName,
                              question: truthOrDare, round: todRound, timestamp: Date.now()
                            }, myName);
                          }
                        }}
                      >
                        <Text style={styles.todBottomBtnText}>😅 Passe</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* PHASE: WAIT ANSWER — En attente de la réponse */}
            {todPhase === 'waitAnswer' && (
              <View style={styles.todBottomBar}>
                <View style={styles.todBottomWait}>
                  <ActivityIndicator size="small" color="#FF6B9D" />
                  <Text style={styles.todBottomWaitText}>
                    En attente de la réponse de {todAnswerer || partnerName}...
                  </Text>
                </View>
                {gameMode !== 'online' && (
                  <TouchableOpacity
                    style={styles.todBottomLocalBtn}
                    onPress={() => setTodPhase('answer')}
                  >
                    <Text style={styles.todBottomLocalBtnText}>📱 Téléphone passé à {todAnswerer}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* PHASE: REACT — Réactions emoji */}
            {todPhase === 'react' && (
              <View style={styles.todBottomBar}>
                <Text style={styles.todBottomLabel}>Réagis ! 👇</Text>
                <View style={styles.todReactionRow}>
                  {['👍', '😂', '😱', '🥰', '🔥', '💀', '👏', '😏'].map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={styles.todReactionBtn}
                      onPress={() => reactAndNextRound(emoji)}
                    >
                      <Text style={styles.todReactionEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.todSkipReactBtn}
                  onPress={nextTodRound}
                >
                  <Text style={styles.todSkipReactText}>➡️ Tour suivant</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Boutons Rejouer / Quitter (toujours visibles) */}
        {todPhase !== 'modeSelect' && (
          <View style={styles.todEndButtons}>
            <TouchableOpacity
              style={styles.todReplayButton}
              onPress={() => {
                resetAllGameStates();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            >
              <Text style={styles.todReplayText}>🔄 Recommencer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.todQuitButton}
              onPress={() => {
                setActiveGame(null);
                endGameSession();
                setGameMode(null);
                resetAllGameStates();
              }}
            >
              <Text style={styles.todQuitText}>🚪 Quitter</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    );
  };

  const renderWhoIsMore = () => {
    const myName = user?.name || 'Moi';
    const partnerName = partner?.name || 'Partenaire';
    const isOnline = gameMode === 'online';

    // ══════ MODE ONLINE ══════
    const handleWimAnswerOnline = async (answer) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setWimPlayer1Answer(answer);
      setWimPhase('waitingPartner');
      await submitOnlineAnswer(answer);
    };

    // ══════ MODE LOCAL ══════
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
      // ✅ MODE ONLINE: Signaler qu'on est prêt et attendre le partenaire
      if (isOnline) {
        setWimPhase('waitingNext');
        signalReadyForNext();
        return;
      }
      // MODE LOCAL: Avancer directement
      if (currentQuestion < WHO_IS_MORE.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setWimPhase('player1');
        setWimPlayer1Answer(null);
        setWimPlayer2Answer(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setShowResult(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        notifyGameWin('Qui est le Plus');
      }
    };

    const handleWimScore = (bothAgree, who) => {
      if (bothAgree) {
        if (who === 'player1') {
          setScores(prev => ({ ...prev, player1: prev.player1 + 1 }));
        } else {
          setScores(prev => ({ ...prev, player2: prev.player2 + 1 }));
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleWimNext();
    };

    // Boutons partagés
    const renderWimButtons = (onAnswer) => (
      <View style={styles.whoIsMoreButtons}>
        <TouchableOpacity
          style={styles.whoButton}
          onPress={() => onAnswer('player1')}
        >
          <Text style={styles.whoButtonEmoji}>👈</Text>
          <Text style={styles.whoButtonText}>{myName}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.whoButton}
          onPress={() => onAnswer('player2')}
        >
          <Text style={styles.whoButtonEmoji}>👉</Text>
          <Text style={styles.whoButtonText}>{partnerName}</Text>
        </TouchableOpacity>
      </View>
    );

    // Déterminer la réponse du partenaire
    const partnerAnswer = isOnline ? onlinePartnerAnswer : wimPlayer2Answer;

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

            {/* ══════ MODE ONLINE: Chaque joueur pointe sur son tel ══════ */}
            {isOnline && wimPhase === 'player1' && (
              <View style={styles.wimPhaseContainer}>
                <Text style={styles.wimPhaseTitle}>🌐 Qui est le plus... ?</Text>
                <Text style={styles.wimPhaseHint}>{partnerName} répond aussi de son côté</Text>
                {renderWimButtons(handleWimAnswerOnline)}
              </View>
            )}

            {/* MODE ONLINE: En attente */}
            {isOnline && wimPhase === 'waitingPartner' && (
              <View style={styles.onlineWaitingContainer}>
                <Text style={styles.onlineWaitingEmoji}>⏳</Text>
                <Text style={styles.onlineWaitingTitle}>Réponse envoyée !</Text>
                <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 15 }} />
                <Text style={styles.onlineWaitingText}>
                  En attente de la réponse de {partnerName}...
                </Text>
              </View>
            )}

            {/* ══════ MODE LOCAL: Phase 1 ══════ */}
            {!isOnline && wimPhase === 'player1' && (
              <View style={styles.wimPhaseContainer}>
                <Text style={styles.wimPhaseTitle}>🎯 C'est au tour de {myName}</Text>
                <Text style={styles.wimPhaseHint}>Qui correspond le plus à cette question ?</Text>
                {renderWimButtons(handleWimAnswer)}
              </View>
            )}

            {/* MODE LOCAL: Passer le téléphone */}
            {!isOnline && wimPhase === 'passPhone' && (
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

            {/* MODE LOCAL: Phase 2 */}
            {!isOnline && wimPhase === 'player2' && (
              <View style={styles.wimPhaseContainer}>
                <Text style={styles.wimPhaseTitle}>🎯 C'est au tour de {partnerName}</Text>
                <Text style={styles.wimPhaseHint}>Qui correspond le plus à cette question ?</Text>
                {renderWimButtons(handleWimAnswer)}
              </View>
            )}

            {/* ══════ REVEAL (online + local) ══════ */}
            {wimPhase === 'reveal' && (
              <View style={styles.quizRevealContainer}>
                <Text style={styles.quizRevealTitle}>🔮 Révélation !</Text>
                
                <View style={styles.quizRevealAnswers}>
                  <View style={styles.quizRevealAnswer}>
                    <Text style={styles.quizRevealLabel}>{myName} a pointé :</Text>
                    <Text style={styles.quizRevealValue}>
                      {wimPlayer1Answer === 'player1' ? `👈 ${myName}` : `👉 ${partnerName}`}
                    </Text>
                  </View>
                  <View style={styles.quizRevealAnswer}>
                    <Text style={styles.quizRevealLabel}>{partnerName} a pointé :</Text>
                    <Text style={styles.quizRevealValue}>
                      {partnerAnswer === 'player1' ? `👈 ${myName}` : `👉 ${partnerName}`}
                    </Text>
                  </View>
                  
                  {wimPlayer1Answer === partnerAnswer ? (
                    <Text style={styles.quizMatch}>✨ Vous êtes d'accord !</Text>
                  ) : (
                    <Text style={styles.wimDisagree}>🤔 Vous n'êtes pas d'accord !</Text>
                  )}
                </View>

                <View style={styles.quizRevealButtons}>
                  {wimPlayer1Answer === partnerAnswer ? (
                    <TouchableOpacity
                      style={[styles.quizRevealBtn, styles.quizRevealBtnBoth]}
                      onPress={() => handleWimScore(true, wimPlayer1Answer)}
                    >
                      <Text style={styles.quizRevealBtnText}>
                        +1 point pour {wimPlayer1Answer === 'player1' ? myName : partnerName} !
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

            {/* ══════ MODE ONLINE: En attente que le partenaire clique Suivant ══════ */}
            {isOnline && wimPhase === 'waitingNext' && (
              <View style={styles.onlineWaitingContainer}>
                <Text style={styles.onlineWaitingEmoji}>⏳</Text>
                <Text style={styles.onlineWaitingTitle}>Prêt !</Text>
                <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 15 }} />
                <Text style={styles.onlineWaitingText}>
                  En attente de {partnerName} pour continuer...
                </Text>
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
                if (isOnline) nextOnlineQuestion();
              }}
            >
              <Text style={styles.playAgainText}>🔄 Rejouer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quitGameButton}
              onPress={() => {
                setActiveGame(null);
                endGameSession();
                setGameMode(null);
                resetAllGameStates();
              }}
            >
              <Text style={styles.quitGameText}>🚪 Quitter</Text>
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
            resetAllGameStates();
          }}>
            <Text style={styles.backButton}>← Retour</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.title}>🎮 Jeux Couple</Text>
        )}
      </View>

      {/* ⚠️ Bandeau d'erreur Firebase */}
      {firebaseError && !activeGame && (
        <View style={{ backgroundColor: '#FF4444', padding: 12, marginHorizontal: 16, borderRadius: 10, marginBottom: 8 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>
            ⚠️ Connexion Firebase impossible
          </Text>
          <Text style={{ color: '#FFD4D4', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
            Les jeux en ligne ne fonctionneront pas. Vérifiez les règles Firebase.
          </Text>
        </View>
      )}

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
    marginBottom: 12,
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C44569',
  },
  quitGameButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  quitGameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  todEndButtons: {
    marginTop: 20,
    alignItems: 'center',
    gap: 10,
    paddingBottom: 20,
  },
  todReplayButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  todReplayText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#C44569',
  },
  todQuitButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  todQuitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // ===== STYLES FIL DE CONVERSATION =====
  todThreadContainer: {
    flex: 1,
    marginBottom: 5,
  },
  todThreadContent: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  todThreadEmpty: {
    alignItems: 'center',
    padding: 30,
    opacity: 0.7,
  },
  todThreadEmptyText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  todThreadWaiting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 10,
    opacity: 0.8,
  },
  todThreadWaitingText: {
    color: '#fff',
    fontSize: 14,
    fontStyle: 'italic',
  },
  // Bulles
  todBubbleRow: {
    marginBottom: 8,
  },
  todBubbleRowLeft: {
    alignItems: 'flex-start',
  },
  todBubbleRowRight: {
    alignItems: 'flex-end',
  },
  todBubbleName: {
    marginBottom: 3,
    paddingHorizontal: 8,
  },
  todBubbleNameText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  todBubbleSystem: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginVertical: 5,
  },
  todBubbleSystemText: {
    color: '#fff',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  todBubble: {
    maxWidth: '85%',
    borderRadius: 18,
    padding: 14,
  },
  todBubbleQuestion: {
    backgroundColor: 'rgba(139, 92, 246, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.8)',
  },
  todBubbleTypeTag: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E0D4FF',
    marginBottom: 6,
  },
  todBubbleQuestionText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  todBubbleResponse: {
    backgroundColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.7)',
  },
  todBubbleResponseLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: 4,
  },
  todBubbleResponseText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  todBubbleReactionBadge: {
    position: 'absolute',
    bottom: -8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  todBubbleReactionBadgeText: {
    fontSize: 16,
  },
  todReactionInline: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'center',
    marginVertical: 2,
  },
  todReactionInlineText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  // Barre du bas (input/boutons)
  todBottomBar: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  todBottomLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  todBottomButtons: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  todBottomBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 15,
    alignItems: 'center',
  },
  todBottomBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  todBottomWait: {
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  todBottomWaitText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  todBottomLocalBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 8,
  },
  todBottomLocalBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  todInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  todBottomInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#fff',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  todSendBtn: {
    backgroundColor: '#10B981',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todSendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  todSendBtnText: {
    fontSize: 20,
    color: '#fff',
  },
  todReactionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  todReactionBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 25,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todReactionEmoji: {
    fontSize: 24,
  },
  todSkipReactBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  todSkipReactText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
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
  // Styles pour les questions ouvertes du Quiz
  quizOpenContainer: {
    width: '100%',
    marginTop: 10,
  },
  quizOpenLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  quizOpenInput: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 12,
  },
  quizOpenSubmitButton: {
    backgroundColor: '#10B981',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
  },
  quizOpenSubmitDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  quizOpenSubmitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  quizRevealAnswerOpen: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  quizRevealValueOpen: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
    fontStyle: 'italic',
  },
  quizOpenCompareHint: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 15,
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
  // ===== STYLES MODE ONLINE ATTENTE =====
  onlineWaitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 25,
    marginVertical: 20,
  },
  onlineWaitingEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  onlineWaitingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textAlign: 'center',
  },
  onlineWaitingText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
});
