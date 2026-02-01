import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';

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
];

const TRUTH_OR_DARE = {
  truths: [
    "Quel a été ton premier sentiment quand tu m'as vu(e) pour la première fois ?",
    "Quelle est la chose la plus romantique que tu aies faite pour moi en secret ?",
    "Y a-t-il quelque chose que tu n'oses pas me dire ?",
    "Quel est ton fantasme le plus doux avec moi ?",
    "Qu'est-ce que tu préfères le plus chez moi ?",
    "Quel moment ensemble voudrais-tu revivre ?",
    "As-tu déjà eu peur de me perdre ?",
    "Quelle est la chose la plus drôle que j'ai faite sans le savoir ?",
    "Comment imagines-tu notre vie dans 10 ans ?",
    "Quel surnom secret tu me donnes dans ta tête ?",
  ],
  dares: [
    "Fais-moi un câlin de 30 secondes minimum",
    "Chante-moi une chanson d'amour",
    "Écris-moi un petit poème maintenant",
    "Fais-moi un massage de 5 minutes",
    "Dis-moi 5 choses que tu aimes chez moi",
    "Danse avec moi sans musique pendant 1 minute",
    "Fais-moi un bisou sur chaque joue",
    "Imite-moi pendant 30 secondes",
    "Prépare-moi un petit-déjeuner demain matin",
    "Envoie-moi un message d'amour maintenant",
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
    nextQuestion: nextGameQuestion,
    isFirebaseReady,
    pendingGameInvite,
    hasActiveSession,
    updateCoupleId,
    listenToGameSession,
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
  
  // États pour le mode multijoueur à distance
  const [showLobby, setShowLobby] = useState(false);
  const [selectedGameForLobby, setSelectedGameForLobby] = useState(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [gameMode, setGameMode] = useState(null); // 'local' ou 'online'
  const [showInviteModal, setShowInviteModal] = useState(false);

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

  const openGameLobby = (gameType) => {
    setSelectedGameForLobby(gameType);
    setShowLobby(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleCreateGame = async () => {
    setIsCreatingGame(true);
    const session = await createGameSession(selectedGameForLobby, user?.name || 'Joueur 1');
    setIsCreatingGame(false);
    
    if (session) {
      setGameMode('online');
      // Démarrer l'écoute Firebase
      listenToGameSession();
      Alert.alert(
        '🎮 Partie créée !',
        'En attente de votre partenaire...\n\nVotre partenaire doit appuyer sur "Rejoindre la partie" dans le même jeu.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Erreur', 'Impossible de créer la partie');
    }
  };

  const handleJoinGame = async () => {
    setIsJoiningGame(true);
    const session = await joinGameSession(user?.name || 'Joueur 2');
    setIsJoiningGame(false);
    
    if (session) {
      setGameMode('online');
      // Démarrer l'écoute Firebase
      listenToGameSession();
      
      // Vérifier si le jeu peut démarrer immédiatement
      if (session.status === 'ready') {
        setShowLobby(false);
        setActiveGame(session.gameType);
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

  const selectTruthOrDare = (type) => {
    const items = type === 'truth' ? TRUTH_OR_DARE.truths : TRUTH_OR_DARE.dares;
    const random = items[Math.floor(Math.random() * items.length)];
    setTruthOrDare({ type, text: random });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

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

  const renderWouldYouRather = () => (
    <View style={styles.gameContainer}>
      {!showResult ? (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / WOULD_YOU_RATHER.length) * 100}%` }]} />
          </View>
          <Text style={styles.questionNumber}>{currentQuestion + 1}/{WOULD_YOU_RATHER.length}</Text>
          
          <Text style={styles.wyrTitle}>Tu préfères...</Text>

          <TouchableOpacity
            style={[styles.wyrOption, wyrChoice === 1 && styles.wyrOptionSelected]}
            onPress={() => selectWyrOption(1)}
          >
            <Text style={[styles.wyrOptionText, wyrChoice === 1 && styles.wyrOptionTextSelected]}>
              {WOULD_YOU_RATHER[currentQuestion].option1}
            </Text>
          </TouchableOpacity>

          <Text style={styles.wyrOr}>OU</Text>

          <TouchableOpacity
            style={[styles.wyrOption, wyrChoice === 2 && styles.wyrOptionSelected]}
            onPress={() => selectWyrOption(2)}
          >
            <Text style={[styles.wyrOptionText, wyrChoice === 2 && styles.wyrOptionTextSelected]}>
              {WOULD_YOU_RATHER[currentQuestion].option2}
            </Text>
          </TouchableOpacity>

          {wyrChoice && (
            <TouchableOpacity style={styles.wyrNextButton} onPress={nextWyrQuestion}>
              <Text style={styles.wyrNextButtonText}>
                {currentQuestion < WOULD_YOU_RATHER.length - 1 ? 'Suivant →' : 'Terminer ✓'}
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.resultContainer}>
          <Text style={styles.resultEmoji}>🎉</Text>
          <Text style={styles.resultTitle}>Bravo !</Text>
          <Text style={styles.resultScore}>Vous avez terminé le jeu "Tu préfères" !</Text>
          <Text style={styles.wyrResultHint}>Discutez de vos choix ensemble 💕</Text>
          <TouchableOpacity
            style={styles.playAgainButton}
            onPress={() => {
              setCurrentQuestion(0);
              setWyrChoice(null);
              setShowResult(false);
            }}
          >
            <Text style={styles.playAgainText}>Rejouer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

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
      <View style={{backgroundColor: '#FF0000', padding: 15, borderRadius: 10, marginBottom: 15, alignItems: 'center'}}>
        <Text style={{color: '#FFFFFF', fontSize: 20, fontWeight: 'bold'}}>🚀 VERSION 4.0.0 🚀</Text>
        <Text style={{color: '#FFFFFF', fontSize: 14}}>Nouvelles fonctionnalités activées</Text>
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
    
    const handleQuizAnswer = (answer) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (quizPhase === 'player1') {
        setPlayer1Answer(answer);
        setQuizPhase('player2');
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
                <Text style={styles.quizPlayerLabel}>Joueur 1</Text>
                <Text style={styles.quizPlayerPoints}>{scores.player1} pts</Text>
              </View>
              <Text style={styles.quizVs}>VS</Text>
              <View style={styles.quizPlayerScore}>
                <Text style={styles.quizPlayerLabel}>Joueur 2</Text>
                <Text style={styles.quizPlayerPoints}>{scores.player2} pts</Text>
              </View>
            </View>

            <Text style={styles.questionNumber}>Question {currentQuestion + 1}/10</Text>
            
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{question.question}</Text>
            </View>

            {quizPhase === 'player1' && (
              <View style={styles.quizPhaseContainer}>
                <Text style={styles.quizPhaseTitle}>👤 Joueur 1 répond :</Text>
                <Text style={styles.quizPhaseHint}>(Le partenaire doit deviner la réponse)</Text>
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

            {quizPhase === 'player2' && (
              <View style={styles.quizPhaseContainer}>
                <Text style={styles.quizPhaseTitle}>👤 Joueur 2 devine :</Text>
                <Text style={styles.quizPhaseHint}>(Essaie de deviner la réponse !)</Text>
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

            {quizPhase === 'reveal' && (
              <View style={styles.quizRevealContainer}>
                <Text style={styles.quizRevealTitle}>🎯 Comparez vos réponses !</Text>
                
                {question.type === 'choice' && (
                  <View style={styles.quizRevealAnswers}>
                    <View style={styles.quizRevealAnswer}>
                      <Text style={styles.quizRevealLabel}>Joueur 1 :</Text>
                      <Text style={styles.quizRevealValue}>{player1Answer}</Text>
                    </View>
                    <View style={styles.quizRevealAnswer}>
                      <Text style={styles.quizRevealLabel}>Joueur 2 :</Text>
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
                    <Text style={styles.quizRevealBtnText}>Joueur 1 ✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quizRevealBtn}
                    onPress={() => handleCorrect('player2')}
                  >
                    <Text style={styles.quizRevealBtnText}>Joueur 2 ✓</Text>
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
                ? `Joueur 1 gagne ${scores.player1}-${scores.player2} !`
                : scores.player2 > scores.player1
                ? `Joueur 2 gagne ${scores.player2}-${scores.player1} !`
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

  const renderTruthOrDare = () => (
    <View style={styles.gameContainer}>
      {!truthOrDare ? (
        <View style={styles.todChoice}>
          <Text style={styles.todTitle}>Choisis :</Text>
          <TouchableOpacity
            style={styles.todButton}
            onPress={() => selectTruthOrDare('truth')}
          >
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.todButtonGradient}>
              <Text style={styles.todButtonIcon}>💬</Text>
              <Text style={styles.todButtonText}>VÉRITÉ</Text>
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
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.todResult}>
          <Text style={styles.todResultType}>
            {truthOrDare.type === 'truth' ? '💬 VÉRITÉ' : '⚡ ACTION'}
          </Text>
          <View style={styles.todResultCard}>
            <Text style={styles.todResultText}>{truthOrDare.text}</Text>
          </View>
          <TouchableOpacity
            style={styles.todNextButton}
            onPress={() => setTruthOrDare(null)}
          >
            <Text style={styles.todNextButtonText}>Prochain tour</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderWhoIsMore = () => (
    <View style={styles.gameContainer}>
      {!showResult ? (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / 10) * 100}%` }]} />
          </View>
          <Text style={styles.questionNumber}>{currentQuestion + 1}/10</Text>
          
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{WHO_IS_MORE[currentQuestion]}</Text>
          </View>

          <View style={styles.whoIsMoreButtons}>
            <TouchableOpacity
              style={styles.whoButton}
              onPress={() => addScore('player1')}
            >
              <Text style={styles.whoButtonEmoji}>👈</Text>
              <Text style={styles.whoButtonText}>Moi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.whoButton}
              onPress={() => addScore('player2')}
            >
              <Text style={styles.whoButtonEmoji}>👉</Text>
              <Text style={styles.whoButtonText}>Toi</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scoresContainer}>
            <Text style={styles.scoreText}>Moi: {scores.player1}</Text>
            <Text style={styles.scoreText}>Toi: {scores.player2}</Text>
          </View>
        </>
      ) : (
        <View style={styles.resultContainer}>
          <Text style={styles.resultEmoji}>🏆</Text>
          <Text style={styles.resultTitle}>Résultats !</Text>
          <Text style={styles.resultScore}>
            {scores.player1 > scores.player2 
              ? `Moi gagne ${scores.player1}-${scores.player2} !`
              : scores.player2 > scores.player1
              ? `Toi gagne ${scores.player2}-${scores.player1} !`
              : `Égalité ${scores.player1}-${scores.player2} !`
            }
          </Text>
          <TouchableOpacity
            style={styles.playAgainButton}
            onPress={() => {
              setCurrentQuestion(0);
              setScores({ player1: 0, player2: 0 });
              setShowResult(false);
            }}
          >
            <Text style={styles.playAgainText}>Rejouer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

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
  todTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
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
  todOr: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.7)',
    marginVertical: 20,
  },
  todResult: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todResultType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  todResultCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 25,
    padding: 35,
    width: '100%',
    marginBottom: 30,
  },
  todResultText: {
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    lineHeight: 30,
  },
  todNextButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 30,
  },
  todNextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
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
    color: '#999',
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
});
