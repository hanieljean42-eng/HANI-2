import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { useNotifyPartner } from '../hooks/useNotifyPartner';
import AnimatedModal from '../components/AnimatedModal';

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

export default function ChallengesScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { loveMeter, updateLoveMeter, challenges, addChallenge } = useData();
  const { partner, user } = useAuth();
  const { notifyChallenge } = useNotifyPartner();
  const { 
    pendingGameInvite,
  } = useGame();

  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [completedToday, setCompletedToday] = useState([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [streak, setStreak] = useState(7);
  const [totalXP, setTotalXP] = useState(150);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Charger les défis complétés aujourd'hui depuis le contexte
  useEffect(() => {
    try {
      if (challenges && Array.isArray(challenges) && challenges.length > 0) {
        const today = new Date().toDateString();
        const todayCompleted = challenges
          .filter(c => c && c.completedAt && new Date(c.completedAt).toDateString() === today)
          .map(c => c.challengeId);
        setCompletedToday(todayCompleted);
        
        // Calculer le total XP depuis l'historique
        const totalFromHistory = challenges.reduce((sum, c) => sum + (c?.xp || 0), 0);
        setTotalXP(150 + totalFromHistory);
      }
    } catch (error) {
      console.log('Erreur chargement défis:', error);
    }
  }, [challenges]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * DAILY_CHALLENGES.length);
    setDailyChallenge(DAILY_CHALLENGES[randomIndex]);
  }, []);

  const handleCompleteChallenge = async (challenge) => {
    if (completedToday.includes(challenge.id)) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCompletedToday([...completedToday, challenge.id]);
    setTotalXP(totalXP + challenge.xp);
    updateLoveMeter(loveMeter + challenge.xp / 5);
    
    // Sauvegarder le défi complété dans DataContext (Firebase)
    await addChallenge({
      challengeId: challenge.id,
      title: challenge.title,
      icon: challenge.icon,
      desc: challenge.desc,
      xp: challenge.xp,
      completedBy: user?.name || 'Moi',
      completedById: user?.id,
    });
    
    // ✅ Notifier le partenaire que le défi a été complété (une seule notification)
    await notifyChallenge(challenge.title);
    
    setShowChallengeModal(false);
  };

  const openChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    setShowChallengeModal(true);
  };

  const isCompleted = (id) => completedToday.includes(id);

  // Navigation vers GamesScreen
  const openGames = () => {
    navigation.navigate('Games');
  };

  // Écran principal des défis
  return (
    <LinearGradient
      colors={theme.primary}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>⚡ Défis</Text>
          <View style={[styles.streakBadge, { backgroundColor: theme.card }]}> 
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={[styles.streakText, { color: theme.text }]}>{streak} jours</Text>
          </View>
        </View>

        {/* XP Progress */}
        <View style={[styles.xpCard, { backgroundColor: theme.card }]}> 
          <View style={styles.xpHeader}>
            <Text style={[styles.xpTitle, { color: theme.text } ]}>Niveau d'Amour</Text>
            <Text style={[styles.xpValue, { color: theme.accent }]}>{totalXP} XP</Text>
          </View>
          <View style={styles.xpBar}>
            <LinearGradient
              colors={[theme.secondary, theme.accent]}
              style={[styles.xpFill, { width: `${(totalXP % 100)}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={[styles.xpLabel, { color: theme.text } ]}>Niveau {Math.floor(totalXP / 100) + 1} • {100 - (totalXP % 100)} XP pour le prochain niveau</Text>
        </View>

        {/* Daily Challenge */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>🌟 Défi du Jour</Text>
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
              colors={isCompleted(dailyChallenge.id) ? [theme.secondary, theme.accent] : theme.primary}
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

        {/* Couple Games - Navigation vers GamesScreen */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>🎮 Jeux à Deux</Text>
        
        {!partner?.name ? (
          <View style={[styles.noPartnerCard, { backgroundColor: theme.card, borderColor: theme.accent }] }>
            <Text style={styles.noPartnerEmoji}>💑</Text>
            <Text style={[styles.noPartnerTitle, { color: theme.text }]}>En attente de votre partenaire</Text>
            <Text style={[styles.noPartnerDesc, { color: theme.text }]}>
              Les jeux seront disponibles une fois que votre partenaire aura rejoint votre espace couple avec le code.
            </Text>
          </View>
        ) : (
        <>
          {/* Bannière d'invitation si partenaire attend */}
          {pendingGameInvite && (
            <TouchableOpacity 
              style={styles.inviteBanner}
              onPress={openGames}
            >
              <LinearGradient colors={[theme.secondary, theme.accent]} style={styles.inviteBannerGradient}>
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

          {/* Gros bouton pour ouvrir les jeux */}
          <TouchableOpacity 
            style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 15 }}
            onPress={openGames}
          >
            <LinearGradient colors={['#8B5CF6', '#A855F7']} style={{ padding: 25, alignItems: 'center' }}>
              <Text style={{ fontSize: 50, marginBottom: 10 }}>🎮</Text>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 5 }}>Ouvrir les Jeux</Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 15 }}>
                Quiz • Action/Vérité • Qui est le Plus • Tu Préfères
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>🌐 À distance</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>📱 Même téléphone</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Cartes de jeux rapides */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.gamesScroll}
          >
            {COUPLE_GAMES.map((game) => (
              <TouchableOpacity
                key={game.id}
                style={styles.gameCard}
                onPress={openGames}
              >
                <LinearGradient
                  colors={game.color || theme.primary}
                  style={styles.gameGradient}
                >
                  <Text style={styles.gameIcon}>{game.icon}</Text>
                  <Text style={[styles.gameTitle, { color: theme.text }]}>{game.title}</Text>
                  <Text style={[styles.gameDesc, { color: theme.text }]}>{game.desc}</Text>
                  <View style={styles.gamePlayBadge}>
                    <Text style={[styles.gamePlayText, { color: theme.text }]}>▶ JOUER</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
        )}

        {/* More Daily Challenges */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>📋 Plus de Défis</Text>
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
              <Text style={[styles.challengeXP, { color: theme.accent }]}>+{challenge.xp} XP</Text>
              {isCompleted(challenge.id) && (
                <View style={styles.completedOverlay}>
                  <Text style={styles.completedOverlayText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Weekly Challenges */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>📅 Défis de la Semaine</Text>
        {WEEKLY_CHALLENGES.slice(0, 2).map((challenge) => (
          <TouchableOpacity
            key={challenge.id}
            style={styles.weeklyCard}
            onPress={() => openChallenge(challenge)}
          >
            <Text style={styles.weeklyIcon}>{challenge.icon}</Text>
            <View style={styles.weeklyContent}>
              <Text style={[styles.weeklyTitle, { color: theme.text }]}>{challenge.title}</Text>
              <Text style={[styles.weeklyDesc, { color: theme.text }]}>{challenge.desc}</Text>
            </View>
            <View style={styles.weeklyMeta}>
              <Text style={[styles.weeklyXP, { color: theme.accent }]}>+{challenge.xp} XP</Text>
              <Text style={[styles.weeklyDuration, { color: theme.text }]}>{challenge.duration}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Historique des défis */}
        <View style={styles.historySection}>
          <View style={styles.historySectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>📜 Historique</Text>
            {challenges && challenges.length > 0 && (
              <TouchableOpacity onPress={() => setShowHistoryModal(true)}>
                <Text style={[styles.seeAllText, { color: theme.accent }]}>Voir tout</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {challenges && challenges.length > 0 ? (
            <View style={styles.historyPreview}>
              {challenges.slice(0, 3).map((item, index) => (
                <View key={item.id || index} style={styles.historyItem}>
                  <Text style={styles.historyItemIcon}>{item.icon || '⚡'}</Text>
                  <View style={styles.historyItemContent}>
                    <Text style={[styles.historyItemTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={styles.historyItemMeta}>
                      {item.completedBy} • {new Date(item.completedAt).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <Text style={[styles.historyItemXP, { color: theme.accent }]}>+{item.xp} XP</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryEmoji}>🏆</Text>
              <Text style={[styles.emptyHistoryText, { color: theme.text }]}>Aucun défi complété</Text>
              <Text style={styles.emptyHistoryHint}>Complétez des défis pour les voir ici !</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Challenge Modal - Animé */}
      <AnimatedModal
        visible={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        title={selectedChallenge?.title || 'Défi'}
        emoji={selectedChallenge?.icon || '⚡'}
        type="spring"
        size="medium"
        showCloseButton={false}
        gradientColors={theme.primary}
      >
        {selectedChallenge && (
          <View style={styles.challengeModalContent}>
            <Text style={styles.modalDesc}>{selectedChallenge.desc}</Text>
            
            <View style={styles.modalXPBadge}>
              <Text style={styles.modalXPText}>+{selectedChallenge.xp} XP</Text>
            </View>

            <View style={styles.modalInstructionsBox}>
              <Text style={styles.modalInstructionsTitle}>📝 Comment faire</Text>
              <Text style={styles.modalInstructionsText}>
                Réalisez ce défi ensemble et appuyez sur "Fait !" quand c'est terminé.
              </Text>
            </View>

            <View style={styles.challengeModalButtons}>
              <TouchableOpacity
                style={styles.laterButton}
                onPress={() => setShowChallengeModal(false)}
              >
                <Text style={styles.laterButtonText}>Plus tard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => handleCompleteChallenge(selectedChallenge)}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.doneButtonGradient}
                >
                  <Text style={styles.doneButtonText}>Fait ! ✓</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </AnimatedModal>

      {/* History Modal */}
      <AnimatedModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Historique des Défis"
        emoji="📜"
        type="spring"
        size="large"
        closeButtonText="Fermer"
        gradientColors={theme.primary}
      >
        <ScrollView style={styles.historyModalScroll}>
          {challenges && Array.isArray(challenges) && challenges.length > 0 ? (
            challenges.filter(item => item != null).map((item, index) => (
              <View key={item?.id || `challenge-${index}`} style={styles.historyModalItem}>
                <Text style={styles.historyModalIcon}>{item.icon || '⚡'}</Text>
                <View style={styles.historyModalContent}>
                  <Text style={styles.historyModalTitle}>{item.title}</Text>
                  <Text style={styles.historyModalMeta}>
                    Par {item.completedBy} • {new Date(item.completedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                  <Text style={styles.historyModalDesc}>{item.desc}</Text>
                </View>
                <View style={styles.historyModalXPBadge}>
                  <Text style={styles.historyModalXPText}>+{item.xp}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyHistoryModal}>
              <Text style={styles.emptyHistoryModalEmoji}>🏆</Text>
              <Text style={styles.emptyHistoryModalText}>Aucun défi complété pour le moment</Text>
            </View>
          )}
        </ScrollView>
      </AnimatedModal>
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
    color: 'rgba(255,255,255,0.8)',
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
  // Modal styles - Améliorés pour AnimatedModal
  challengeModalContent: {
    alignItems: 'center',
    width: '100%',
  },
  modalDesc: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  modalXPBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalXPText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  modalInstructionsBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  modalInstructionsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalInstructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  challengeModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 10,
    paddingBottom: 5,
  },
  laterButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  laterButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  doneButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
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
  // History Section Styles
  historySection: {
    marginTop: 25,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyPreview: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 10,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  historyItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  historyItemMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  historyItemXP: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyHistory: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
  },
  emptyHistoryEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  emptyHistoryHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  // History Modal Styles
  historyModalScroll: {
    maxHeight: 400,
  },
  historyModalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 10,
  },
  historyModalIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  historyModalContent: {
    flex: 1,
  },
  historyModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  historyModalMeta: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  historyModalDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  historyModalXPBadge: {
    backgroundColor: '#10B981',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  historyModalXPText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyHistoryModal: {
    alignItems: 'center',
    padding: 40,
  },
  emptyHistoryModalEmoji: {
    fontSize: 50,
    marginBottom: 15,
  },
  emptyHistoryModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
