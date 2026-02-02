import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const DAILY_CHALLENGES = [
  { id: 1, title: 'Compliment Surprise', icon: '💬', desc: 'Envoie un compliment inattendu à ton/ta partenaire', xp: 10 },
  { id: 2, title: 'Photo du Jour', icon: '📸', desc: 'Prends une photo de quelque chose qui te fait penser à lui/elle', xp: 15 },
  { id: 3, title: 'Message Vocal', icon: '🎤', desc: 'Envoie un message vocal romantique', xp: 10 },
  { id: 4, title: 'Câlin de 20 secondes', icon: '🤗', desc: 'Un câlin d\'au moins 20 secondes libère l\'ocytocine!', xp: 20 },
  { id: 5, title: 'Petit-déjeuner au lit', icon: '🥐', desc: 'Prépare le petit-déjeuner pour ton amour', xp: 25 },
  { id: 6, title: 'Sans téléphone', icon: '📵', desc: '1 heure ensemble sans regarder vos téléphones', xp: 30 },
  { id: 7, title: 'Danse spontanée', icon: '💃', desc: 'Mets une chanson et dansez ensemble!', xp: 15 },
  { id: 8, title: 'Gratitude', icon: '🙏', desc: 'Dis 3 choses que tu aimes chez ton/ta partenaire', xp: 15 },
];

const WEEKLY_CHALLENGES = [
  { id: 101, title: 'Date Night', icon: '🌙', desc: 'Organisez une soirée romantique cette semaine', xp: 50, duration: '7j' },
  { id: 102, title: 'Nouvelle Recette', icon: '👨‍🍳', desc: 'Cuisinez ensemble un plat jamais essayé', xp: 40, duration: '7j' },
  { id: 103, title: 'Album Photo', icon: '📷', desc: 'Créez un mini album de vos 10 meilleurs moments', xp: 45, duration: '7j' },
  { id: 104, title: 'Lettre d\'Amour', icon: '💌', desc: 'Écrivez-vous une lettre d\'amour manuscrite', xp: 35, duration: '7j' },
];

const COUPLE_GAMES = [
  { id: 201, title: 'Quiz Couple', icon: '🧠', desc: 'Jouez ensemble à distance', xp: 20, type: 'quiz', color: ['#FF6B9D', '#C44569'] },
  { id: 202, title: 'Action ou Vérité', icon: '🎲', desc: 'Version couple épicée', xp: 25, type: 'truthordare', color: ['#8B5CF6', '#A855F7'] },
  { id: 203, title: 'Qui est le Plus...', icon: '🏆', desc: 'Votez chacun de votre côté', xp: 20, type: 'whoismore', color: ['#10B981', '#059669'] },
  { id: 204, title: 'Tu Préfères...', icon: '🤔', desc: 'Comparez vos choix', xp: 15, type: 'wouldyourather', color: ['#F59E0B', '#D97706'] },
];

// Données des jeux
const QUIZ_QUESTIONS = [
  { id: 1, question: "Quel est le plat préféré de ton/ta partenaire ?", type: "open" },
  { id: 2, question: "Où avez-vous eu votre premier rendez-vous ?", type: "open" },
  { id: 3, question: "Quelle est la couleur préférée de ton/ta partenaire ?", type: "choice", options: ["Rouge", "Bleu", "Vert", "Violet", "Rose", "Noir"] },
  { id: 4, question: "Quel est le film préféré de ton/ta partenaire ?", type: "open" },
  { id: 5, question: "Qu'est-ce qui fait le plus rire ton/ta partenaire ?", type: "open" },
  { id: 6, question: "Où ton/ta partenaire aimerait-il/elle voyager ?", type: "open" },
  { id: 7, question: "Quelle est la plus grande peur de ton/ta partenaire ?", type: "open" },
  { id: 8, question: "Quel super-pouvoir ton/ta partenaire voudrait avoir ?", type: "choice", options: ["Voler", "Invisibilité", "Téléportation", "Lire les pensées", "Super force", "Contrôler le temps"] },
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
  "Qui est le/la plus drôle ?",
  "Qui est le/la plus câlin(e) ?",
  "Qui s'endort en premier ?",
];

const WOULD_YOU_RATHER = [
  { option1: "Voyager ensemble pour toujours sans maison fixe", option2: "Avoir la maison de nos rêves mais ne jamais voyager" },
  { option1: "Lire toutes les pensées de ton/ta partenaire", option2: "Que ton/ta partenaire lise toutes tes pensées" },
  { option1: "Revoir notre premier rendez-vous", option2: "Voir notre futur ensemble dans 10 ans" },
  { option1: "Ne jamais pouvoir se disputer", option2: "Toujours se réconcilier de la meilleure façon" },
  { option1: "Un petit-déjeuner au lit tous les matins", option2: "Un dîner romantique chaque semaine" },
  { option1: "Vivre 1000 ans sans ton/ta partenaire", option2: "Vivre 50 ans ensemble" },
  { option1: "Être incroyablement riche mais très occupé", option2: "Avoir peu d'argent mais tout le temps ensemble" },
  { option1: "Connaître la date exacte de notre mariage", option2: "Être surpris(e) quand ça arrivera" },
];

export default function ChallengesScreen() {
  const { loveMeter, updateLoveMeter } = useData();
  const { partner } = useAuth();
  const { 
    coupleId,
    gameSession, 
    partnerOnline, 
    waitingForPartner,
    myPlayerId,
    createGameSession, 
    joinGameSession,
    submitAnswer,
    checkBothAnswered,
    getBothAnswers,
    nextQuestion,
    endGameSession,
    checkActiveSession,
    getPartnerInfo,
    getMyInfo,
    listenToGameSession,
    pendingGameInvite,
    hasActiveSession,
  } = useGame();

  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [completedToday, setCompletedToday] = useState([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [streak, setStreak] = useState(7);
  const [totalXP, setTotalXP] = useState(150);
  
  // États pour les jeux
  const [activeGame, setActiveGame] = useState(null);
  const [gamePhase, setGamePhase] = useState('menu'); // menu, setup, waiting, playing, results
  const [playerName, setPlayerName] = useState('');
  const [myAnswer, setMyAnswer] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [scores, setScores] = useState({ me: 0, partner: 0 });
  const [truthOrDare, setTruthOrDare] = useState(null);
  
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Message de bienvenue au premier lancement (désactivé)
  // L'alerte de version a été supprimée pour une meilleure expérience utilisateur

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * DAILY_CHALLENGES.length);
    setDailyChallenge(DAILY_CHALLENGES[randomIndex]);
  }, []);

  // Animation de pulsation pour l'attente
  useEffect(() => {
    if (waitingForPartner || gamePhase === 'waiting') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [waitingForPartner, gamePhase]);

  // Écouter les changements de session et mettre à jour l'état
  useEffect(() => {
    if (gameSession) {
      // Vérifier si les deux joueurs ont répondu
      const currentQ = gameSession.currentQuestion || 0;
      const bothAnswered = checkBothAnswered(currentQ);
      
      if (bothAnswered && !showResults) {
        setShowResults(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [gameSession]);

  const handleCompleteChallenge = (challenge) => {
    if (completedToday.includes(challenge.id)) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCompletedToday([...completedToday, challenge.id]);
    setTotalXP(totalXP + challenge.xp);
    updateLoveMeter(loveMeter + challenge.xp / 5);
    setShowChallengeModal(false);
  };

  const openChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    setShowChallengeModal(true);
  };

  const isCompleted = (id) => completedToday.includes(id);

  // ============ FONCTIONS DE JEU EN TEMPS RÉEL ============

  const startGame = async (gameType) => {
    setActiveGame(gameType);
    setGamePhase('setup');
    setMyAnswer(null);
    setShowResults(false);
    setScores({ me: 0, partner: 0 });
    setTruthOrDare(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Vérifier s'il y a déjà une session active
    const existingSession = await checkActiveSession();
    if (existingSession && existingSession.gameType === gameType) {
      // Rejoindre la session existante
      Alert.alert(
        '🎮 Partie en cours !',
        'Ton/Ta partenaire t\'attend déjà ! Veux-tu le/la rejoindre ?',
        [
          { text: 'Annuler', style: 'cancel', onPress: () => setActiveGame(null) },
          { text: 'Rejoindre !', onPress: () => setGamePhase('setup') }
        ]
      );
    }
  };

  const confirmNameAndStart = async () => {
    if (!playerName.trim()) {
      Alert.alert('Oups !', 'Entre ton prénom pour continuer');
      return;
    }

    setGamePhase('waiting');

    // Vérifier s'il y a une session existante à rejoindre
    const existingSession = await checkActiveSession();
    
    if (existingSession && existingSession.gameType === activeGame) {
      // Rejoindre la session
      await joinGameSession(playerName);
      setGamePhase('playing');
    } else {
      // Créer une nouvelle session
      await createGameSession(activeGame, playerName);
    }
  };

  const closeGame = async () => {
    await endGameSession();
    setActiveGame(null);
    setGamePhase('menu');
    setMyAnswer(null);
    setShowResults(false);
    
    // Donner XP
    const game = COUPLE_GAMES.find(g => g.type === activeGame);
    if (game) {
      setTotalXP(totalXP + game.xp);
      updateLoveMeter(loveMeter + game.xp / 5);
    }
  };

  const handleSubmitAnswer = async (answer) => {
    setMyAnswer(answer);
    const currentQ = gameSession?.currentQuestion || 0;
    await submitAnswer(currentQ, answer);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNextQuestion = async () => {
    setMyAnswer(null);
    setShowResults(false);
    await nextQuestion();
  };

  // ============ RENDU DES JEUX ============

  // Écran de configuration (entrer son nom)
  const renderSetupScreen = () => {
    const game = COUPLE_GAMES.find(g => g.type === activeGame);
    
    return (
      <View style={styles.gameFullScreen}>
        <LinearGradient colors={game?.color || ['#8B5CF6', '#A855F7']} style={styles.setupContainer}>
          <Text style={styles.setupEmoji}>{game?.icon}</Text>
          <Text style={styles.setupTitle}>{game?.title}</Text>
          <Text style={styles.setupSubtitle}>Jeu à distance en temps réel</Text>
          
          <View style={styles.setupInfo}>
            <Text style={styles.setupInfoIcon}>📱</Text>
            <Text style={styles.setupInfoText}>
              Toi et ton/ta partenaire jouez chacun sur votre téléphone !
            </Text>
          </View>
          
          <View style={styles.setupNameBox}>
            <Text style={styles.setupLabel}>Ton prénom :</Text>
            <TextInput
              style={styles.setupInput}
              placeholder="Entre ton prénom..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={playerName}
              onChangeText={setPlayerName}
              autoFocus
            />
          </View>
          
          <TouchableOpacity style={styles.setupStartBtn} onPress={confirmNameAndStart}>
            <Text style={styles.setupStartText}>🚀 Lancer le jeu !</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.setupCancelBtn} onPress={() => setActiveGame(null)}>
            <Text style={styles.setupCancelText}>Annuler</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  // Écran d'attente du partenaire
  const renderWaitingScreen = () => {
    const game = COUPLE_GAMES.find(g => g.type === activeGame);
    
    // Si le partenaire est en ligne, passer au jeu
    if (partnerOnline && gamePhase === 'waiting') {
      setTimeout(() => setGamePhase('playing'), 500);
    }
    
    return (
      <View style={styles.gameFullScreen}>
        <LinearGradient colors={game?.color || ['#8B5CF6', '#A855F7']} style={styles.waitingContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Text style={styles.waitingEmoji}>💕</Text>
          </Animated.View>
          
          <Text style={styles.waitingTitle}>En attente de ton/ta partenaire...</Text>
          <Text style={styles.waitingSubtitle}>
            Dis-lui d'ouvrir l'appli et de rejoindre "{game?.title}" !
          </Text>
          
          <View style={styles.waitingStatus}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.waitingStatusText}>
              {partnerOnline ? '✨ Partenaire connecté(e) !' : '⏳ En attente...'}
            </Text>
          </View>
          
          <View style={styles.waitingTip}>
            <Text style={styles.waitingTipIcon}>💡</Text>
            <Text style={styles.waitingTipText}>
              Ton/Ta partenaire doit aussi lancer ce jeu depuis son téléphone
            </Text>
          </View>
          
          <TouchableOpacity style={styles.waitingCancelBtn} onPress={closeGame}>
            <Text style={styles.waitingCancelText}>Annuler</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  // Quiz Couple - Version temps réel
  const renderQuizGame = () => {
    const currentQ = gameSession?.currentQuestion || 0;
    const question = QUIZ_QUESTIONS[currentQ];
    const partnerInfo = getPartnerInfo();
    const bothAnswered = checkBothAnswered(currentQ);
    const answers = getBothAnswers(currentQ);
    
    if (!question) {
      return renderGameResults();
    }

    return (
      <View style={styles.gameFullScreen}>
        <LinearGradient colors={['#FF6B9D', '#C44569']} style={styles.gameHeader}>
          <TouchableOpacity onPress={closeGame} style={styles.gameBackBtn}>
            <Text style={styles.gameBackText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.gameHeaderTitle}>🧠 Quiz Couple</Text>
          <View style={styles.onlineIndicator}>
            <View style={[styles.onlineDot, partnerOnline && styles.onlineDotActive]} />
          </View>
        </LinearGradient>

        <ScrollView style={styles.gameContent}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentQ + 1) / QUIZ_QUESTIONS.length) * 100}%` }]} />
          </View>

          <View style={styles.playersStatus}>
            <View style={styles.playerStatusCard}>
              <Text style={styles.playerStatusEmoji}>👤</Text>
              <Text style={styles.playerStatusName}>{playerName}</Text>
              <Text style={styles.playerStatusState}>
                {myAnswer ? '✅ Répondu' : '⏳ En cours'}
              </Text>
            </View>
            <Text style={styles.vsText}>❤️</Text>
            <View style={styles.playerStatusCard}>
              <Text style={styles.playerStatusEmoji}>👤</Text>
              <Text style={styles.playerStatusName}>{partnerInfo?.name || 'Partenaire'}</Text>
              <Text style={styles.playerStatusState}>
                {answers && answers[Object.keys(answers).find(k => k !== myPlayerId)] ? '✅ Répondu' : '⏳ En cours'}
              </Text>
            </View>
          </View>

          <Text style={styles.questionNumber}>Question {currentQ + 1}/{QUIZ_QUESTIONS.length}</Text>
          
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{question.question}</Text>
          </View>

          {!myAnswer && !showResults && (
            <View style={styles.answerSection}>
              {question.type === 'choice' ? (
                <View style={styles.choiceOptions}>
                  {question.options.map((opt, idx) => (
                    <TouchableOpacity 
                      key={`quiz-opt-${idx}`}
                      style={styles.choiceOption}
                      onPress={() => handleSubmitAnswer(opt)}
                    >
                      <Text style={styles.choiceOptionText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.openAnswer}>
                  <TextInput
                    style={styles.openAnswerInput}
                    placeholder="Ta réponse..."
                    placeholderTextColor="#999"
                    value={myAnswer || ''}
                    onChangeText={setMyAnswer}
                  />
                  <TouchableOpacity 
                    style={styles.submitAnswerBtn}
                    onPress={() => handleSubmitAnswer(myAnswer)}
                  >
                    <Text style={styles.submitAnswerText}>Valider ✓</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {myAnswer && !showResults && (
            <View style={styles.waitingForPartnerAnswer}>
              <ActivityIndicator size="small" color="#FF6B9D" />
              <Text style={styles.waitingAnswerText}>
                En attente de la réponse de {partnerInfo?.name || 'ton/ta partenaire'}...
              </Text>
            </View>
          )}

          {showResults && answers && (
            <View style={styles.answersReveal}>
              <Text style={styles.answersRevealTitle}>🎉 Vos réponses !</Text>
              
              <View style={styles.answerComparison}>
                <View style={styles.answerCard}>
                  <Text style={styles.answerCardName}>{playerName}</Text>
                  <Text style={styles.answerCardValue}>
                    {answers[myPlayerId]?.answer || '?'}
                  </Text>
                </View>
                
                <View style={styles.answerCard}>
                  <Text style={styles.answerCardName}>{partnerInfo?.name}</Text>
                  <Text style={styles.answerCardValue}>
                    {answers[Object.keys(answers).find(k => k !== myPlayerId)]?.answer || '?'}
                  </Text>
                </View>
              </View>

              {currentQ < QUIZ_QUESTIONS.length - 1 ? (
                <TouchableOpacity style={styles.nextQuestionBtn} onPress={handleNextQuestion}>
                  <Text style={styles.nextQuestionText}>Question suivante →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.finishGameBtn} onPress={closeGame}>
                  <Text style={styles.finishGameText}>Terminer (+20 XP) 🎉</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // Qui est le plus - Version temps réel
  const renderWhoIsMore = () => {
    const currentQ = gameSession?.currentQuestion || 0;
    const question = WHO_IS_MORE[currentQ];
    const partnerInfo = getPartnerInfo();
    const bothAnswered = checkBothAnswered(currentQ);
    const answers = getBothAnswers(currentQ);
    
    if (!question || currentQ >= WHO_IS_MORE.length) {
      return renderGameResults();
    }

    return (
      <View style={styles.gameFullScreen}>
        <LinearGradient colors={['#10B981', '#059669']} style={styles.gameHeader}>
          <TouchableOpacity onPress={closeGame} style={styles.gameBackBtn}>
            <Text style={styles.gameBackText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.gameHeaderTitle}>🏆 Qui est le Plus...</Text>
          <View style={styles.onlineIndicator}>
            <View style={[styles.onlineDot, partnerOnline && styles.onlineDotActive]} />
          </View>
        </LinearGradient>

        <ScrollView style={styles.gameContent}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentQ + 1) / WHO_IS_MORE.length) * 100}%` }]} />
          </View>

          <View style={styles.playersStatus}>
            <View style={styles.playerStatusCard}>
              <Text style={styles.playerStatusEmoji}>👤</Text>
              <Text style={styles.playerStatusName}>{playerName}</Text>
              <Text style={styles.playerStatusState}>
                {myAnswer ? '✅' : '⏳'}
              </Text>
            </View>
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.playerStatusCard}>
              <Text style={styles.playerStatusEmoji}>👤</Text>
              <Text style={styles.playerStatusName}>{partnerInfo?.name || 'Partenaire'}</Text>
              <Text style={styles.playerStatusState}>
                {answers && Object.keys(answers).length > 1 ? '✅' : '⏳'}
              </Text>
            </View>
          </View>

          <Text style={styles.questionNumber}>{currentQ + 1}/{WHO_IS_MORE.length}</Text>
          
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{question}</Text>
          </View>

          {!myAnswer && !showResults && (
            <View style={styles.whoButtonsContainer}>
              <TouchableOpacity 
                style={styles.whoButton}
                onPress={() => handleSubmitAnswer('moi')}
              >
                <Text style={styles.whoButtonEmoji}>🙋</Text>
                <Text style={styles.whoButtonText}>Moi ({playerName})</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.whoButton}
                onPress={() => handleSubmitAnswer('partenaire')}
              >
                <Text style={styles.whoButtonEmoji}>💕</Text>
                <Text style={styles.whoButtonText}>{partnerInfo?.name || 'Mon/Ma partenaire'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {myAnswer && !showResults && (
            <View style={styles.waitingForPartnerAnswer}>
              <ActivityIndicator size="small" color="#10B981" />
              <Text style={styles.waitingAnswerText}>
                En attente du vote de {partnerInfo?.name || 'ton/ta partenaire'}...
              </Text>
            </View>
          )}

          {showResults && answers && (
            <View style={styles.answersReveal}>
              <Text style={styles.answersRevealTitle}>🎉 Vos votes !</Text>
              
              <View style={styles.whoVoteResults}>
                {Object.entries(answers).map(([id, data]) => {
                  const isMe = id === myPlayerId;
                  const voterName = isMe ? playerName : partnerInfo?.name;
                  const votedFor = data.answer === 'moi' 
                    ? (isMe ? playerName : partnerInfo?.name)
                    : (isMe ? partnerInfo?.name : playerName);
                  
                  return (
                    <View key={id} style={styles.voteResult}>
                      <Text style={styles.voteResultName}>{voterName} a voté :</Text>
                      <Text style={styles.voteResultValue}>{votedFor}</Text>
                    </View>
                  );
                })}
              </View>

              {currentQ < WHO_IS_MORE.length - 1 ? (
                <TouchableOpacity style={styles.nextQuestionBtn} onPress={handleNextQuestion}>
                  <Text style={styles.nextQuestionText}>Question suivante →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.finishGameBtn} onPress={closeGame}>
                  <Text style={styles.finishGameText}>Terminer (+20 XP) 🎉</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // Tu préfères - Version temps réel
  const renderWouldYouRather = () => {
    const currentQ = gameSession?.currentQuestion || 0;
    const question = WOULD_YOU_RATHER[currentQ];
    const partnerInfo = getPartnerInfo();
    const bothAnswered = checkBothAnswered(currentQ);
    const answers = getBothAnswers(currentQ);
    
    if (!question || currentQ >= WOULD_YOU_RATHER.length) {
      return renderGameResults();
    }

    return (
      <View style={styles.gameFullScreen}>
        <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.gameHeader}>
          <TouchableOpacity onPress={closeGame} style={styles.gameBackBtn}>
            <Text style={styles.gameBackText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.gameHeaderTitle}>🤔 Tu Préfères...</Text>
          <View style={styles.onlineIndicator}>
            <View style={[styles.onlineDot, partnerOnline && styles.onlineDotActive]} />
          </View>
        </LinearGradient>

        <ScrollView style={styles.gameContent}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentQ + 1) / WOULD_YOU_RATHER.length) * 100}%` }]} />
          </View>

          <View style={styles.playersStatus}>
            <View style={styles.playerStatusCard}>
              <Text style={styles.playerStatusEmoji}>👤</Text>
              <Text style={styles.playerStatusName}>{playerName}</Text>
              <Text style={styles.playerStatusState}>
                {myAnswer ? '✅' : '⏳'}
              </Text>
            </View>
            <Text style={styles.vsText}>❤️</Text>
            <View style={styles.playerStatusCard}>
              <Text style={styles.playerStatusEmoji}>👤</Text>
              <Text style={styles.playerStatusName}>{partnerInfo?.name || 'Partenaire'}</Text>
              <Text style={styles.playerStatusState}>
                {answers && Object.keys(answers).length > 1 ? '✅' : '⏳'}
              </Text>
            </View>
          </View>

          <Text style={styles.questionNumber}>{currentQ + 1}/{WOULD_YOU_RATHER.length}</Text>
          
          <Text style={styles.wyrTitle}>Tu préfères...</Text>

          {!showResults ? (
            <>
              <TouchableOpacity 
                style={[styles.wyrOption, myAnswer === 1 && styles.wyrOptionSelected]}
                onPress={() => !myAnswer && handleSubmitAnswer(1)}
                disabled={!!myAnswer}
              >
                <Text style={[styles.wyrOptionText, myAnswer === 1 && styles.wyrOptionTextSelected]}>
                  {question.option1}
                </Text>
              </TouchableOpacity>

              <Text style={styles.wyrOr}>OU</Text>

              <TouchableOpacity 
                style={[styles.wyrOption, myAnswer === 2 && styles.wyrOptionSelected]}
                onPress={() => !myAnswer && handleSubmitAnswer(2)}
                disabled={!!myAnswer}
              >
                <Text style={[styles.wyrOptionText, myAnswer === 2 && styles.wyrOptionTextSelected]}>
                  {question.option2}
                </Text>
              </TouchableOpacity>

              {myAnswer && !showResults && (
                <View style={styles.waitingForPartnerAnswer}>
                  <ActivityIndicator size="small" color="#F59E0B" />
                  <Text style={styles.waitingAnswerText}>
                    En attente du choix de {partnerInfo?.name || 'ton/ta partenaire'}...
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.answersReveal}>
              <Text style={styles.answersRevealTitle}>🎉 Vos choix !</Text>
              
              <View style={styles.wyrCompareResults}>
                {Object.entries(answers || {}).map(([id, data]) => {
                  const isMe = id === myPlayerId;
                  const voterName = isMe ? playerName : partnerInfo?.name;
                  const choice = data.answer === 1 ? question.option1 : question.option2;
                  
                  return (
                    <View key={id} style={styles.wyrCompareCard}>
                      <Text style={styles.wyrCompareName}>{voterName}</Text>
                      <Text style={styles.wyrCompareChoice}>{choice}</Text>
                    </View>
                  );
                })}
              </View>

              {answers && Object.values(answers).every(a => a.answer === Object.values(answers)[0]?.answer) && (
                <Text style={styles.matchText}>💕 Vous êtes sur la même longueur d'onde !</Text>
              )}

              {currentQ < WOULD_YOU_RATHER.length - 1 ? (
                <TouchableOpacity style={styles.nextQuestionBtn} onPress={handleNextQuestion}>
                  <Text style={styles.nextQuestionText}>Question suivante →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.finishGameBtn} onPress={closeGame}>
                  <Text style={styles.finishGameText}>Terminer (+15 XP) 🎉</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // Action ou Vérité - Mode asynchrone (un joueur pose, l'autre répond)
  const renderTruthOrDare = () => {
    const partnerInfo = getPartnerInfo();
    
    return (
      <View style={styles.gameFullScreen}>
        <LinearGradient colors={['#8B5CF6', '#A855F7']} style={styles.gameHeader}>
          <TouchableOpacity onPress={closeGame} style={styles.gameBackBtn}>
            <Text style={styles.gameBackText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.gameHeaderTitle}>🎲 Action ou Vérité</Text>
          <View style={styles.onlineIndicator}>
            <View style={[styles.onlineDot, partnerOnline && styles.onlineDotActive]} />
          </View>
        </LinearGradient>

        <View style={styles.gameContent}>
          <View style={styles.todPlayerInfo}>
            <Text style={styles.todPlayerName}>C'est au tour de</Text>
            <Text style={styles.todCurrentPlayer}>{playerName}</Text>
          </View>

          {!truthOrDare ? (
            <View style={styles.todChoiceContainer}>
              <Text style={styles.todChoiceTitle}>Que choisis-tu ?</Text>
              
              <TouchableOpacity 
                style={styles.todTruthBtn}
                onPress={() => {
                  const t = TRUTH_OR_DARE.truths[Math.floor(Math.random() * TRUTH_OR_DARE.truths.length)];
                  setTruthOrDare({ type: 'truth', text: t });
                  handleSubmitAnswer({ type: 'truth', text: t });
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <Text style={styles.todBtnIcon}>💬</Text>
                <Text style={styles.todBtnText}>VÉRITÉ</Text>
              </TouchableOpacity>
              
              <Text style={styles.todOr}>ou</Text>
              
              <TouchableOpacity 
                style={styles.todDareBtn}
                onPress={() => {
                  const d = TRUTH_OR_DARE.dares[Math.floor(Math.random() * TRUTH_OR_DARE.dares.length)];
                  setTruthOrDare({ type: 'dare', text: d });
                  handleSubmitAnswer({ type: 'dare', text: d });
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <Text style={styles.todBtnIcon}>⚡</Text>
                <Text style={styles.todBtnText}>ACTION</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.todResultContainer}>
              <Text style={styles.todResultType}>
                {truthOrDare.type === 'truth' ? '💬 VÉRITÉ' : '⚡ ACTION'}
              </Text>
              
              <View style={styles.todResultCard}>
                <Text style={styles.todResultText}>{truthOrDare.text}</Text>
              </View>
              
              <Text style={styles.todWaitingText}>
                {partnerInfo?.name || 'Ton/Ta partenaire'} peut voir ce défi sur son écran !
              </Text>
              
              <TouchableOpacity 
                style={styles.todNextBtn}
                onPress={() => {
                  setTruthOrDare(null);
                  setMyAnswer(null);
                  handleNextQuestion();
                }}
              >
                <Text style={styles.todNextBtnText}>Prochain tour →</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.gameExitBtn} onPress={closeGame}>
                <Text style={styles.gameExitText}>Terminer (+25 XP)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Écran de résultats finaux
  const renderGameResults = () => {
    const game = COUPLE_GAMES.find(g => g.type === activeGame);
    
    return (
      <View style={styles.gameFullScreen}>
        <LinearGradient colors={game?.color || ['#8B5CF6', '#A855F7']} style={styles.resultsContainer}>
          <Text style={styles.resultsEmoji}>🎉</Text>
          <Text style={styles.resultsTitle}>Jeu terminé !</Text>
          <Text style={styles.resultsSubtitle}>
            Bravo à vous deux pour avoir joué ensemble 💕
          </Text>
          
          <TouchableOpacity style={styles.resultsPlayAgain} onPress={() => startGame(activeGame)}>
            <Text style={styles.resultsPlayAgainText}>🔄 Rejouer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resultsExitBtn} onPress={closeGame}>
            <Text style={styles.resultsExitText}>Terminer (+{game?.xp} XP)</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  // Rendu principal du jeu actif
  const renderActiveGame = () => {
    if (gamePhase === 'setup') {
      return renderSetupScreen();
    }
    
    if (gamePhase === 'waiting' || (waitingForPartner && !partnerOnline)) {
      return renderWaitingScreen();
    }

    switch (activeGame) {
      case 'quiz':
        return renderQuizGame();
      case 'whoismore':
        return renderWhoIsMore();
      case 'wouldyourather':
        return renderWouldYouRather();
      case 'truthordare':
        return renderTruthOrDare();
      default:
        return null;
    }
  };

  // Si un jeu est actif, afficher le jeu
  if (activeGame) {
    return renderActiveGame();
  }

  // Écran principal des défis
  return (
    <LinearGradient
      colors={['#FF6B9D', '#C44569', '#8B5CF6']}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>⚡ Défis</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakText}>{streak} jours</Text>
          </View>
        </View>

        {/* XP Progress */}
        <View style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpTitle}>Niveau d'Amour</Text>
            <Text style={styles.xpValue}>{totalXP} XP</Text>
          </View>
          <View style={styles.xpBar}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={[styles.xpFill, { width: `${(totalXP % 100)}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.xpLabel}>Niveau {Math.floor(totalXP / 100) + 1} • {100 - (totalXP % 100)} XP pour le prochain niveau</Text>
        </View>

        {/* Daily Challenge */}
        <Text style={styles.sectionTitle}>🌟 Défi du Jour</Text>
        {dailyChallenge && (
          <TouchableOpacity
            style={[
              styles.dailyChallengeCard,
              isCompleted(dailyChallenge.id) && styles.completedCard,
            ]}
            onPress={() => openChallenge(dailyChallenge)}
            disabled={isCompleted(dailyChallenge.id)}
          >
            <LinearGradient
              colors={isCompleted(dailyChallenge.id) ? ['#10B981', '#059669'] : ['#FF6B9D', '#C44569']}
              style={styles.dailyChallengeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.dailyChallengeIcon}>{dailyChallenge.icon}</Text>
              <View style={styles.dailyChallengeContent}>
                <Text style={styles.dailyChallengeTitle}>{dailyChallenge.title}</Text>
                <Text style={styles.dailyChallengeDesc}>{dailyChallenge.desc}</Text>
                <View style={styles.xpBadge}>
                  <Text style={styles.xpBadgeText}>+{dailyChallenge.xp} XP</Text>
                </View>
              </View>
              {isCompleted(dailyChallenge.id) && (
                <Text style={styles.completedCheck}>✅</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Couple Games */}
        <Text style={styles.sectionTitle}>🎮 Jeux à Deux (En Temps Réel)</Text>
        
        {/* ========== SECTION JEUX À DISTANCE ========== */}
        {!partner?.name ? (
          /* Message si partenaire n'a pas rejoint */
          <View style={styles.noPartnerCard}>
            <Text style={styles.noPartnerEmoji}>💑</Text>
            <Text style={styles.noPartnerTitle}>En attente de votre partenaire</Text>
            <Text style={styles.noPartnerDesc}>
              Les jeux à distance seront disponibles une fois que votre partenaire aura rejoint votre espace couple avec le code.
            </Text>
          </View>
        ) : (
        <View style={styles.distanceGamingSection}>
          {/* Status de connexion */}
          <View style={styles.connectionStatusBar}>
            <View style={styles.connectionDot}>
              <View style={[styles.dot, coupleId ? styles.dotOnline : styles.dotOffline]} />
              <Text style={styles.connectionText}>
                {coupleId ? `🟢 Connecté avec ${partner.name}` : '🔴 Non connecté'}
              </Text>
            </View>
            <Text style={styles.coupleIdText}>
              Code: {coupleId ? coupleId.slice(-6).toUpperCase() : '------'}
            </Text>
          </View>

          {/* Bannière d'invitation si partenaire attend */}
          {pendingGameInvite && (
            <TouchableOpacity 
              style={styles.inviteBanner}
              onPress={() => {
                startGame(pendingGameInvite.gameType);
              }}
            >
              <LinearGradient colors={['#10B981', '#059669']} style={styles.inviteBannerGradient}>
                <Text style={styles.inviteBannerEmoji}>🎉</Text>
                <View style={styles.inviteBannerContent}>
                  <Text style={styles.inviteBannerTitle}>
                    {pendingGameInvite.creatorName || 'Ton/Ta partenaire'} t'attend !
                  </Text>
                  <Text style={styles.inviteBannerDesc}>
                    Appuie ici pour rejoindre la partie
                  </Text>
                </View>
                <Text style={styles.inviteBannerArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Session active */}
          {hasActiveSession && gameSession && !pendingGameInvite && (
            <View style={styles.activeSessionBar}>
              <Text style={styles.activeSessionIcon}>⚡</Text>
              <Text style={styles.activeSessionText}>
                Partie en cours: {gameSession.gameType}
              </Text>
              <TouchableOpacity 
                style={styles.quitSessionBtn}
                onPress={async () => {
                  Alert.alert(
                    'Quitter la partie ?',
                    'Voulez-vous vraiment quitter cette partie ?',
                    [
                      { text: 'Non', style: 'cancel' },
                      { 
                        text: 'Oui, quitter', 
                        style: 'destructive',
                        onPress: async () => {
                          await endGameSession();
                          Alert.alert('✅', 'Partie terminée');
                        }
                      }
                    ]
                  );
                }}
              >
                <Text style={styles.quitSessionText}>Quitter</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Boutons principaux CRÉER / REJOINDRE */}
          <View style={styles.mainActionsRow}>
            {/* Bouton CRÉER une partie */}
            <TouchableOpacity 
              style={styles.mainActionBtn}
              onPress={() => {
                Alert.alert(
                  '🎮 Créer une partie',
                  'Choisissez un jeu pour créer une partie que votre partenaire pourra rejoindre.',
                  [
                    { text: '🧠 Quiz', onPress: () => startGame('quiz') },
                    { text: '🎲 Action/Vérité', onPress: () => startGame('truthordare') },
                    { text: '🏆 Qui est le plus...', onPress: () => startGame('whoismore') },
                    { text: '🤔 Tu préfères...', onPress: () => startGame('wouldyourather') },
                    { text: 'Annuler', style: 'cancel' },
                  ]
                );
              }}
            >
              <LinearGradient colors={['#8B5CF6', '#A855F7']} style={styles.mainActionGradient}>
                <Text style={styles.mainActionIcon}>🎮</Text>
                <Text style={styles.mainActionTitle}>CRÉER</Text>
                <Text style={styles.mainActionSubtitle}>une partie</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Bouton REJOINDRE une partie */}
            <TouchableOpacity 
              style={styles.mainActionBtn}
              onPress={async () => {
                const session = await checkActiveSession();
                if (session) {
                  Alert.alert(
                    '🎉 Partie trouvée !',
                    `Une partie de ${session.gameType} vous attend !`,
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Rejoindre !', onPress: () => startGame(session.gameType) },
                    ]
                  );
                } else {
                  Alert.alert(
                    '😕 Aucune partie',
                    'Votre partenaire n\'a pas encore créé de partie.\n\nDemandez-lui de cliquer sur "CRÉER une partie" d\'abord !',
                    [{ text: 'OK' }]
                  );
                }
              }}
            >
              <LinearGradient colors={['#10B981', '#059669']} style={styles.mainActionGradient}>
                <Text style={styles.mainActionIcon}>🤝</Text>
                <Text style={styles.mainActionTitle}>REJOINDRE</Text>
                <Text style={styles.mainActionSubtitle}>une partie</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>📱 Comment jouer à distance ?</Text>
            <Text style={styles.instructionsText}>
              1️⃣ L'un de vous crée une partie{'\n'}
              2️⃣ L'autre clique sur "REJOINDRE"{'\n'}
              3️⃣ Jouez ensemble en temps réel ! 💕
            </Text>
          </View>
        </View>
        )}
        {/* ========== FIN SECTION JEUX À DISTANCE ========== */}

        {partner?.name && (
        <>
        <Text style={styles.gamesSectionHint}>📱 Ou choisissez directement un jeu :</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.gamesScroll}
        >
          {COUPLE_GAMES.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={styles.gameCard}
              onPress={() => startGame(game.type)}
            >
              <LinearGradient
                colors={game.color}
                style={styles.gameGradient}
              >
                <Text style={styles.gameIcon}>{game.icon}</Text>
                <Text style={styles.gameTitle}>{game.title}</Text>
                <Text style={styles.gameDesc}>{game.desc}</Text>
                <View style={styles.gamePlayBadge}>
                  <Text style={styles.gamePlayText}>▶ JOUER</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
        </>
        )}

        {/* More Daily Challenges */}
        <Text style={styles.sectionTitle}>📋 Plus de Défis</Text>
        <View style={styles.challengesGrid}>
          {DAILY_CHALLENGES.slice(0, 4).map((challenge) => (
            <TouchableOpacity
              key={challenge.id}
              style={[
                styles.challengeCard,
                isCompleted(challenge.id) && styles.completedSmallCard,
              ]}
              onPress={() => openChallenge(challenge)}
              disabled={isCompleted(challenge.id)}
            >
              <Text style={styles.challengeIcon}>{challenge.icon}</Text>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <Text style={styles.challengeXP}>+{challenge.xp} XP</Text>
              {isCompleted(challenge.id) && (
                <View style={styles.completedOverlay}>
                  <Text style={styles.completedOverlayText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Weekly Challenges */}
        <Text style={styles.sectionTitle}>📅 Défis de la Semaine</Text>
        {WEEKLY_CHALLENGES.slice(0, 2).map((challenge) => (
          <TouchableOpacity
            key={challenge.id}
            style={styles.weeklyCard}
            onPress={() => openChallenge(challenge)}
          >
            <Text style={styles.weeklyIcon}>{challenge.icon}</Text>
            <View style={styles.weeklyContent}>
              <Text style={styles.weeklyTitle}>{challenge.title}</Text>
              <Text style={styles.weeklyDesc}>{challenge.desc}</Text>
            </View>
            <View style={styles.weeklyMeta}>
              <Text style={styles.weeklyXP}>+{challenge.xp} XP</Text>
              <Text style={styles.weeklyDuration}>{challenge.duration}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Challenge Modal */}
      <Modal
        visible={showChallengeModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedChallenge && (
              <>
                <Text style={styles.modalIcon}>{selectedChallenge.icon}</Text>
                <Text style={styles.modalTitle}>{selectedChallenge.title}</Text>
                <Text style={styles.modalDesc}>{selectedChallenge.desc}</Text>
                
                <View style={styles.modalXPContainer}>
                  <Text style={styles.modalXP}>+{selectedChallenge.xp} XP</Text>
                </View>

                <View style={styles.modalInstructions}>
                  <Text style={styles.modalInstructionsTitle}>📝 Comment faire :</Text>
                  <Text style={styles.modalInstructionsText}>
                    Réalisez ce défi ensemble et appuyez sur "Fait !" quand c'est terminé.
                  </Text>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowChallengeModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Plus tard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handleCompleteChallenge(selectedChallenge)}
                  >
                    <Text style={styles.completeButtonText}>Fait ! ✓</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  streakIcon: {
    fontSize: 18,
    marginRight: 5,
  },
  streakText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  xpCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  xpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  xpValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  xpBar: {
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 5,
  },
  xpLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    marginTop: 10,
  },
  gamesSectionHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 15,
    marginTop: -10,
  },
  dailyChallengeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  dailyChallengeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  dailyChallengeIcon: {
    fontSize: 50,
    marginRight: 15,
  },
  dailyChallengeContent: {
    flex: 1,
  },
  dailyChallengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  dailyChallengeDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 10,
  },
  xpBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  xpBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  completedCard: {
    opacity: 0.8,
  },
  completedCheck: {
    fontSize: 30,
  },
  challengesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  challengeCard: {
    width: (width - 50) / 2,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  completedSmallCard: {
    opacity: 0.6,
  },
  challengeIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  challengeXP: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedOverlayText: {
    fontSize: 40,
    color: '#10B981',
  },
  weeklyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  weeklyIcon: {
    fontSize: 35,
    marginRight: 15,
  },
  weeklyContent: {
    flex: 1,
  },
  weeklyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 3,
  },
  weeklyDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  weeklyMeta: {
    alignItems: 'flex-end',
  },
  weeklyXP: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  weeklyDuration: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 3,
  },
  gamesScroll: {
    marginLeft: -20,
    paddingLeft: 20,
    marginBottom: 10,
  },
  gameCard: {
    marginRight: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gameGradient: {
    width: 150,
    height: 180,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameIcon: {
    fontSize: 45,
    marginBottom: 8,
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  gameDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 10,
  },
  gamePlayBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  gamePlayText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 70,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalDesc: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  modalXPContainer: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 25,
  },
  modalXP: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#999',
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalInstructions: {
    backgroundColor: '#F3F4F6',
    borderRadius: 15,
    padding: 15,
    width: '100%',
    marginBottom: 20,
  },
  modalInstructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalInstructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  // Game full screen styles
  gameFullScreen: {
    flex: 1,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  gameBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameBackText: {
    fontSize: 24,
    color: '#fff',
  },
  gameHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  onlineIndicator: {
    width: 40,
    alignItems: 'flex-end',
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#666',
  },
  onlineDotActive: {
    backgroundColor: '#10B981',
  },
  gameContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  // Setup screen
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  setupEmoji: {
    fontSize: 80,
    marginBottom: 15,
  },
  setupTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  setupSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 30,
  },
  setupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 30,
  },
  setupInfoIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  setupInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  setupNameBox: {
    width: '100%',
    marginBottom: 25,
  },
  setupLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
    fontWeight: '600',
  },
  setupInput: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 18,
    color: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  setupStartBtn: {
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 50,
    paddingVertical: 18,
    marginTop: 10,
  },
  setupStartText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  setupCancelBtn: {
    marginTop: 20,
    paddingVertical: 15,
  },
  setupCancelText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  // Waiting screen
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  waitingEmoji: {
    fontSize: 100,
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 30,
    marginBottom: 10,
    textAlign: 'center',
  },
  waitingSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 40,
  },
  waitingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    paddingHorizontal: 25,
    paddingVertical: 15,
    marginBottom: 30,
  },
  waitingStatusText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
  },
  waitingTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 30,
  },
  waitingTipIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  waitingTipText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  waitingCancelBtn: {
    paddingVertical: 15,
  },
  waitingCancelText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  // Progress bar
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  // Players status
  playersStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  playerStatusCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 12,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerStatusEmoji: {
    fontSize: 30,
    marginBottom: 5,
  },
  playerStatusName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  playerStatusState: {
    fontSize: 12,
    color: '#666',
  },
  vsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginHorizontal: 15,
  },
  // Question card
  questionNumber: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 28,
  },
  // Answer section
  answerSection: {
    marginBottom: 20,
  },
  choiceOptions: {
    gap: 10,
  },
  choiceOption: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 18,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  choiceOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  openAnswer: {
    gap: 15,
  },
  openAnswerInput: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 18,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  submitAnswerBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
  },
  submitAnswerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Waiting for partner
  waitingForPartnerAnswer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
  },
  waitingAnswerText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 15,
  },
  // Answers reveal
  answersReveal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  answersRevealTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  answerComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  answerCard: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 15,
    padding: 15,
    minWidth: 130,
  },
  answerCardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  answerCardValue: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  nextQuestionBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 25,
    paddingHorizontal: 35,
    paddingVertical: 15,
    marginTop: 10,
  },
  nextQuestionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  finishGameBtn: {
    backgroundColor: '#10B981',
    borderRadius: 25,
    paddingHorizontal: 35,
    paddingVertical: 15,
    marginTop: 10,
  },
  finishGameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  matchText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 15,
  },
  // Who buttons
  whoButtonsContainer: {
    gap: 15,
  },
  whoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  whoButtonEmoji: {
    fontSize: 35,
    marginRight: 15,
  },
  whoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  // Who vote results
  whoVoteResults: {
    width: '100%',
    marginBottom: 20,
  },
  voteResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  voteResultName: {
    fontSize: 14,
    color: '#666',
  },
  voteResultValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  // Would you rather
  wyrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  wyrOption: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    borderWidth: 3,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  wyrOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  wyrOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  },
  wyrOptionTextSelected: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  wyrOr: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    textAlign: 'center',
    marginVertical: 10,
  },
  wyrCompareResults: {
    width: '100%',
    marginBottom: 20,
  },
  wyrCompareCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  wyrCompareName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  wyrCompareChoice: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
  },
  // Truth or Dare
  todPlayerInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  todPlayerName: {
    fontSize: 16,
    color: '#666',
  },
  todCurrentPlayer: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  todChoiceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  todChoiceTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 40,
  },
  todTruthBtn: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  todDareBtn: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  todBtnIcon: {
    fontSize: 45,
    marginBottom: 5,
  },
  todBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  todOr: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999',
    marginVertical: 15,
  },
  todResultContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  todResultType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 20,
  },
  todResultCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todResultText: {
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    lineHeight: 30,
  },
  todWaitingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
  },
  todNextBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 25,
    paddingHorizontal: 35,
    paddingVertical: 15,
    marginBottom: 15,
  },
  todNextBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  gameExitBtn: {
    paddingVertical: 15,
  },
  gameExitText: {
    fontSize: 14,
    color: '#666',
  },
  // Results screen
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  resultsEmoji: {
    fontSize: 100,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 40,
  },
  resultsPlayAgain: {
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 40,
    paddingVertical: 18,
    marginBottom: 15,
  },
  resultsPlayAgainText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  resultsExitBtn: {
    paddingVertical: 15,
  },
  resultsExitText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  // ========== CARTE PAS DE PARTENAIRE ==========
  noPartnerCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
  },
  noPartnerEmoji: {
    fontSize: 50,
    marginBottom: 15,
  },
  noPartnerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  noPartnerDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  // ========== STYLES JEUX À DISTANCE ==========
  distanceGamingSection: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  connectionStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  connectionDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  dotOnline: {
    backgroundColor: '#10B981',
  },
  dotOffline: {
    backgroundColor: '#EF4444',
  },
  connectionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  coupleIdText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  inviteBanner: {
    marginBottom: 15,
    borderRadius: 15,
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
  inviteBannerContent: {
    flex: 1,
  },
  inviteBannerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inviteBannerDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  inviteBannerArrow: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  activeSessionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  activeSessionIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  activeSessionText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quitSessionBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quitSessionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mainActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  mainActionBtn: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 15,
    overflow: 'hidden',
  },
  mainActionGradient: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  mainActionIcon: {
    fontSize: 35,
    marginBottom: 8,
  },
  mainActionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mainActionSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  instructionsBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 15,
  },
  instructionsTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionsText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 22,
  },
});
