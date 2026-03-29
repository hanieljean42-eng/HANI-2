import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  AppState,
  Alert,
  Image,
  Share,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData, BADGES_LIST, getLevelInfo, MILESTONES, SPECIAL_DATES } from '../context/DataContext';
import { formatDateInput } from '../utils/dateFormat';
import { useNotifyPartner } from '../hooks/useNotifyPartner';
import { useNotifications } from '../context/NotificationContext';
import { useChat } from '../context/ChatContext';

const { width } = Dimensions.get('window');

// Questions "Tu préfères" du jour (pool)
const TU_PREFERES_POOL = [
  { a: 'Petit-déjeuner au lit tous les matins', b: 'Dîner romantique chaque semaine' },
  { a: 'Voyager ensemble pour toujours', b: 'Avoir la maison de nos rêves' },
  { a: 'Lire les pensées de ton partenaire', b: 'Que ton partenaire lise tes pensées' },
  { a: 'Revoir notre premier rendez-vous', b: 'Voir notre futur dans 10 ans' },
  { a: 'Ne jamais se disputer', b: 'Toujours se réconcilier parfaitement' },
  { a: 'Être incroyablement riche mais occupé', b: 'Peu d\'argent mais tout le temps ensemble' },
  { a: 'Un baiser de 5 minutes', b: 'Un câlin de 30 minutes' },
  { a: 'Une lettre d\'amour chaque jour', b: 'Un cadeau surprise chaque mois' },
  { a: 'Danser sous la pluie ensemble', b: 'Regarder les étoiles ensemble' },
  { a: 'Un road trip spontané', b: 'Des vacances planifiées de luxe' },
  { a: 'Connaître la date exacte de notre mariage', b: 'Être surpris quand ça arrivera' },
  { a: 'Vivre sur une île déserte ensemble', b: 'Vivre dans une grande ville ensemble' },
  { a: 'Toujours dire la vérité', b: 'Pouvoir faire une surprise secrète' },
  { a: 'Avoir le même rêve chaque nuit', b: 'Ne jamais oublier un souvenir' },
];

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, couple, partner, isOnline, isSynced } = useAuth();
  const { loveMeter, challenges, memories, loveNotes, countdownEvents, addCountdownEvent, deleteCountdownEvent, unlockedBadges, checkBadges } = useData();
  const { notifyMissYou, notifyOnline, sendDailyReminder, sendSmartReminder } = useNotifyPartner();
  const { notifyMilestone, notifyBadgeUnlocked, notifyLevelUp, scheduleCountdownReminder, notifyNewEvent } = useNotifications();
  const { messages: chatMessages, unreadCount, partnerTyping } = useChat();
  const [daysCount, setDaysCount] = useState(0);
  const [timeTogetherText, setTimeTogetherText] = useState('');
  const [hasValidDate, setHasValidDate] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toDateString());
  const [showCountdownModal, setShowCountdownModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventEmoji, setNewEventEmoji] = useState('🎉');
  const [tuPreferesAnswer, setTuPreferesAnswer] = useState(null);

  // "Tu préfères" du jour (déterministe)
  const dailyTuPreferes = useMemo(() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return TU_PREFERES_POOL[seed % TU_PREFERES_POOL.length];
  }, []);

  // Milestone du jour
  const todayMilestone = useMemo(() => {
    if (!daysCount) return null;
    if (MILESTONES.includes(daysCount)) return daysCount;
    return null;
  }, [daysCount]);

  // Date spéciale aujourd'hui
  const todaySpecial = useMemo(() => {
    const today = new Date();
    const d = today.getDate();
    const m = today.getMonth() + 1;
    return SPECIAL_DATES.find(s => s.month === m && s.day === d) || null;
  }, []);

  // Prochain countdown event
  const nextCountdown = useMemo(() => {
    if (!countdownEvents || countdownEvents.length === 0) return null;
    const now = new Date();
    const future = countdownEvents.filter(e => {
      const evDate = new Date(e.date);
      return evDate > now;
    });
    if (future.length === 0) return null;
    const ev = future[0]; // already sorted by date
    const evDate = new Date(ev.date);
    const diffDays = Math.ceil((evDate - now) / (1000 * 60 * 60 * 24));
    return { ...ev, daysLeft: diffDays };
  }, [countdownEvents]);

  // Badges info
  const levelInfo = useMemo(() => {
    const xp = challenges?.reduce((sum, c) => sum + (c?.xp || 0), 0) || 0;
    return getLevelInfo(xp);
  }, [challenges]);

  const totalBadges = useMemo(() => {
    return unlockedBadges?.length || 0;
  }, [unlockedBadges]);

  // Check badges quand les données changent (avec debounce)
  const badgeCheckTimerRef = useRef(null);
  useEffect(() => {
    if (!user?.id) return;
    // Debounce pour éviter les appels multiples rapides
    if (badgeCheckTimerRef.current) clearTimeout(badgeCheckTimerRef.current);
    badgeCheckTimerRef.current = setTimeout(() => {
      const completedChallenges = challenges?.filter(c => c.completed)?.length || 0;
      const statsObj = {
        streak: 0, // streak est calculé dans ChallengesScreen, les badges flamme se débloquent là-bas
        challenges: completedChallenges,
        messages: chatMessages?.length || 0,
        memories: memories?.length || 0,
        notes: loveNotes?.length || 0,
        days: daysCount,
        level: levelInfo.level,
      };
      checkBadges(statsObj).then(newBadges => {
        if (newBadges && newBadges.length > 0) {
          const badge = BADGES_LIST.find(b => b.id === newBadges[0].id);
          if (badge) {
            notifyBadgeUnlocked(badge.name, badge.emoji);
            Alert.alert(`${badge.emoji} Nouveau badge !`, `Tu as débloqué "${badge.name}" !\n${badge.desc}`);
          }
        }
      });
    }, 2000);
    return () => { if (badgeCheckTimerRef.current) clearTimeout(badgeCheckTimerRef.current); };
  }, [challenges?.length, memories?.length, daysCount, levelInfo.level, chatMessages?.length, loveNotes?.length]);

  // Check milestones
  useEffect(() => {
    if (todayMilestone && daysCount > 0) {
      const emoji = daysCount >= 1000 ? '💎' : daysCount >= 365 ? '🎂' : daysCount >= 100 ? '💯' : '🎉';
      notifyMilestone(daysCount, emoji);
    }
  }, [todayMilestone]);

  // Notifier le partenaire qu'on est en ligne + programmer les rappels quotidiens
  // ✅ Cooldown 30 min pour éviter de spammer le partenaire
  const onlineCooldownRef = useRef(0);
  useEffect(() => {
    if (user?.id && couple?.id) {
      const now = Date.now();
      // Notifier "en ligne" max 1 fois toutes les 30 min
      if ((now - onlineCooldownRef.current) > 1800000) {
        onlineCooldownRef.current = now;
        notifyOnline();
      }
      sendDailyReminder();
      const hasPendingChallenge = challenges?.some(c => !c.completed);
      sendSmartReminder(hasPendingChallenge);
    }
  }, [user?.id, couple?.id]);

  // Notification level up quand le rang change
  const [prevLevel, setPrevLevel] = useState(null);
  useEffect(() => {
    if (prevLevel !== null && levelInfo.level > prevLevel) {
      notifyLevelUp(levelInfo.level, levelInfo.rank, levelInfo.rankEmoji);
    }
    setPrevLevel(levelInfo.level);
  }, [levelInfo.level]);

  // Programmer les rappels de countdown pour les événements futurs
  // ✅ Éviter les doublons en traçant les événements déjà programmés
  const scheduledCountdownsRef = useRef(new Set());
  useEffect(() => {
    if (countdownEvents && countdownEvents.length > 0) {
      countdownEvents.forEach(ev => {
        const evKey = `${ev.name}_${ev.date}`;
        const evDate = new Date(ev.date);
        if (evDate > new Date() && !scheduledCountdownsRef.current.has(evKey)) {
          scheduledCountdownsRef.current.add(evKey);
          scheduleCountdownReminder(ev.name, ev.emoji || '📅', ev.date);
        }
      });
    }
  }, [countdownEvents?.length]);

  // Fonction pour calculer les jours ensemble
  const calculateDaysTogether = useCallback(() => {
    if (!couple?.anniversary) {
      setHasValidDate(false);
      setDaysCount(0);
      setTimeTogetherText('');
      return;
    }
    
    // Essayer différents formats de date
    let anniversaryDate = null;
    const dateStr = couple.anniversary.trim();
    
    // Format JJ/MM/AAAA ou JJ-MM-AAAA
    const parts = dateStr.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      
      // Valider les valeurs
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
        anniversaryDate = new Date(year, month, day);
      }
    }
    
    if (!anniversaryDate || isNaN(anniversaryDate.getTime())) {
      setHasValidDate(false);
      setDaysCount(0);
      setTimeTogetherText('');
      return;
    }
    
    setHasValidDate(true);
    
    // Utiliser la date système actuelle de l'appareil
    const now = new Date();
    
    // Calculer la différence en jours (basé sur les dates, pas les timestamps)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfAnniversary = new Date(anniversaryDate.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
    
    const diffTime = startOfToday.getTime() - startOfAnniversary.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Si la date est dans le futur, afficher 0
    if (days < 0) {
      setDaysCount(0);
      setTimeTogetherText('Votre aventure commence bientôt !');
      return;
    }
    
    setDaysCount(days);
    
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    const remainingDays = days % 30;
    
    let text = '';
    if (years > 0) text += `${years} an${years > 1 ? 's' : ''} `;
    if (months > 0) text += `${months} mois `;
    if (remainingDays > 0 || text === '') text += `${remainingDays} jour${remainingDays > 1 ? 's' : ''}`;
    
    setTimeTogetherText(text.trim());
    
    // Mettre à jour la date courante pour détecter le changement de jour
    setCurrentDate(now.toDateString());
  }, [couple?.anniversary]);

  // Effet principal - calcul initial et intervalle
  useEffect(() => {
    calculateDaysTogether();
    
    // Vérifier toutes les minutes si on a changé de jour
    const interval = setInterval(() => {
      const newDate = new Date().toDateString();
      if (newDate !== currentDate) {
        console.log('📅 Nouveau jour détecté ! Mise à jour du compteur...');
        calculateDaysTogether();
      }
    }, 60000); // Vérifier toutes les minutes
    
    return () => clearInterval(interval);
  }, [couple?.anniversary, currentDate, calculateDaysTogether]);

  // Écouter quand l'app revient au premier plan pour recalculer + notifier partenaire
  const lastOnlineNotifRef = useRef(0);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📱 App revenue au premier plan - recalcul des jours');
        calculateDaysTogether();
        // ✅ Notifier le partenaire qu'on est de retour (cooldown 5 min)
        const now = Date.now();
        if (user?.id && couple?.id && (now - lastOnlineNotifRef.current) > 300000) {
          lastOnlineNotifRef.current = now;
          notifyOnline();
        }
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [calculateDaysTogether, user?.id, couple?.id]);

  // Recalculer quand la date anniversaire change
  useEffect(() => {
    calculateDaysTogether();
  }, [couple?.anniversary, calculateDaysTogether]);

  const completedChallenges = challenges.filter(c => c.completed).length;

  // "Ce jour-là" - Souvenirs d'il y a un an
  const onThisDay = useMemo(() => {
    if (!memories || memories.length === 0) return [];
    
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    
    return memories.filter(memory => {
      if (!memory.date) return false;
      const parts = memory.date.split('/');
      if (parts.length !== 3) return false;
      
      const memDay = parseInt(parts[0], 10);
      const memMonth = parseInt(parts[1], 10);
      const memYear = parseInt(parts[2], 10);
      
      // Même jour et mois, mais pas cette année
      return memDay === currentDay && 
             memMonth === currentMonth && 
             memYear < today.getFullYear();
    }).sort((a, b) => {
      // Trier par année la plus récente d'abord
      const yearA = parseInt(a.date.split('/')[2], 10);
      const yearB = parseInt(b.date.split('/')[2], 10);
      return yearB - yearA;
    });
  }, [memories]);

  const getYearsAgo = (dateStr) => {
    const year = parseInt(dateStr.split('/')[2], 10);
    const yearsAgo = new Date().getFullYear() - year;
    if (yearsAgo === 1) return 'Il y a 1 an';
    return `Il y a ${yearsAgo} ans`;
  };

  return (
    <LinearGradient
      colors={theme.primary}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Message de bienvenue */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeEmoji}>💑</Text>
          <Text style={styles.welcomeText}>Bienvenue dans votre espace couple !</Text>
          <Text style={styles.welcomeSubtext}>Cultivez votre amour chaque jour ✨</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Bonjour {user?.name} 💖</Text>
            {/* Nom du couple - seulement si partenaire a rejoint */}
            {partner?.name ? (
              <Text style={styles.coupleName}>{couple?.name || 'Notre Couple'}</Text>
            ) : (
              <Text style={styles.waitingText}>En attente de votre partenaire...</Text>
            )}
            {/* Présence partenaire : en ligne / écrit / dernière vue */}
            {partner?.name && (
              <View style={styles.syncIndicator}>
                {partnerTyping ? (
                  <>
                    <Text style={styles.syncDot}>✏️</Text>
                    <Text style={[styles.syncText, { color: '#7FFF7F', fontStyle: 'italic' }]}>
                      {partner.name} écrit...
                    </Text>
                  </>
                ) : partner?.isOnline ? (
                  <>
                    <Text style={styles.syncDot}>🟢</Text>
                    <Text style={[styles.syncText, { color: '#7FFF7F' }]}>
                      {partner.name} est en ligne
                    </Text>
                  </>
                ) : partner?.lastSeen ? (
                  <>
                    <Text style={styles.syncDot}>⚪</Text>
                    <Text style={styles.syncText}>
                      {(() => {
                        const lastSeen = new Date(partner.lastSeen);
                        const now = new Date();
                        const diffMins = Math.floor((now - lastSeen) / 60000);
                        if (diffMins < 1) return `${partner.name} vu à l'instant`;
                        if (diffMins < 60) return `${partner.name} vu il y a ${diffMins} min`;
                        const diffHours = Math.floor(diffMins / 60);
                        if (diffHours < 24) return `${partner.name} vu à ${lastSeen.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
                        return `${partner.name} vu le ${lastSeen.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
                      })()}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.syncDot}>{isOnline ? '🟢' : '🔴'}</Text>
                    <Text style={styles.syncText}>
                      {isOnline ? (isSynced ? 'Synchronisé' : 'En ligne') : 'Hors ligne'}
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{user?.avatar || '😊'}</Text>
            {partner?.name && (
              <View>
                <Text style={styles.partnerAvatar}>{partner?.avatar || '💕'}</Text>
                {/* Point de présence sur l'avatar du partenaire */}
                <View style={[
                  styles.presenceDot,
                  { backgroundColor: partner?.isOnline ? '#4ADE80' : '#9CA3AF' }
                ]} />
              </View>
            )}
          </View>
        </View>

        {/* Raccourcis rapides vers le Chat */}
        {partner?.name && (
          <TouchableOpacity
            style={styles.chatShortcutCard}
            onPress={() => navigation.navigate('Chat')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B9D', '#FF8E53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.chatShortcutGradient}
            >
              <View style={styles.chatShortcutLeft}>
                <Text style={styles.chatShortcutIcon}>💬</Text>
                <View>
                  <Text style={styles.chatShortcutTitle}>
                    Chat avec {partner.name}
                  </Text>
                  <Text style={styles.chatShortcutSub}>
                    {partnerTyping 
                      ? '✏️ écrit en ce moment...'
                      : unreadCount > 0 
                        ? `${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''}`
                        : partner?.isOnline 
                          ? '🟢 En ligne maintenant'
                          : 'Envoyer un message'}
                  </Text>
                </View>
              </View>
              <View style={styles.chatShortcutActions}>
                <TouchableOpacity 
                  style={styles.chatShortcutCallBtn}
                  onPress={(e) => { e.stopPropagation(); navigation.navigate('Chat', { autoCall: 'audio' }); }}
                >
                  <Text style={styles.chatShortcutCallIcon}>📞</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.chatShortcutCallBtn}
                  onPress={(e) => { e.stopPropagation(); navigation.navigate('Chat', { autoCall: 'video' }); }}
                >
                  <Text style={styles.chatShortcutCallIcon}>🎥</Text>
                </TouchableOpacity>
                {unreadCount > 0 && (
                  <View style={styles.chatBadge}>
                    <Text style={styles.chatBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Days Counter */}
        <View style={styles.counterCard}>
          <Text style={styles.counterEmoji}>💕</Text>
          {hasValidDate ? (
            <>
              <Text style={styles.counterNumber}>{daysCount}</Text>
              <Text style={styles.counterLabel}>jours d'amour</Text>
              {timeTogetherText && (
                <Text style={styles.counterDetail}>{timeTogetherText}</Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.counterNumber}>∞</Text>
              <Text style={styles.counterLabel}>jours d'amour</Text>
              <Text style={styles.counterDetail}>
                Ajoutez votre date d'anniversaire dans les paramètres !
              </Text>
            </>
          )}
        </View>

        {/* Love Meter */}
        <View style={styles.loveMeterCard}>
          <View style={styles.loveMeterHeader}>
            <Text style={styles.loveMeterTitle}>💗 Love Meter</Text>
            <Text style={[styles.loveMeterValue, { color: theme.accent }]}>{loveMeter}%</Text>
          </View>
          <View style={styles.loveMeterBar}>
            <LinearGradient
              colors={theme.primary}
              style={[styles.loveMeterFill, { width: `${loveMeter}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.loveMeterHint}>Complétez des défis pour augmenter !</Text>
        </View>

        {/* Quick Actions */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Actions rapides</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Wheel')}
          >
            <Text style={styles.actionIcon}>🎰</Text>
            <Text style={styles.actionLabel}>Roue des Dates</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Challenges')}
          >
            <Text style={styles.actionIcon}>⚡</Text>
            <Text style={styles.actionLabel}>Défis du jour</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Memories')}
          >
            <Text style={styles.actionIcon}>📸</Text>
            <Text style={styles.actionLabel}>Souvenirs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={async () => {
              await notifyMissYou();
              Alert.alert('💕', `Un petit message d'amour a été envoyé à ${partner?.name || 'ton partenaire'} !`);
            }}
          >
            <Text style={styles.actionIcon}>💭</Text>
            <Text style={styles.actionLabel}>Tu me manques</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Widgets')}
          >
            <Text style={styles.actionIcon}>📱</Text>
            <Text style={styles.actionLabel}>Widgets</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Vos statistiques</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{memories.length}</Text>
            <Text style={styles.statLabel}>Souvenirs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedChallenges}</Text>
            <Text style={styles.statLabel}>Défis</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{daysCount}</Text>
            <Text style={styles.statLabel}>Jours</Text>
          </View>
        </View>

        {/* "Ce jour-là" - Souvenirs d'il y a un an */}
        {onThisDay.length > 0 && (
          <View style={styles.onThisDaySection}>
            <View style={styles.onThisDayHeader}>
              <Text style={styles.onThisDayIcon}>📅</Text>
              <Text style={styles.onThisDayTitle}>Ce jour-là...</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.onThisDayScroll}
            >
              {onThisDay.map((memory, index) => (
                <TouchableOpacity 
                  key={`otd-${memory.id || index}`}
                  style={styles.onThisDayCard}
                  onPress={() => navigation.navigate('Memories')}
                >
                  {memory.photos && memory.photos.length > 0 ? (
                    <Image 
                      source={{ uri: memory.photos[0] }} 
                      style={styles.onThisDayImage}
                    />
                  ) : (
                    <View style={styles.onThisDayImagePlaceholder}>
                      <Text style={styles.onThisDayEmoji}>{memory.emoji || '💕'}</Text>
                    </View>
                  )}
                  <View style={styles.onThisDayOverlay}>
                    <Text style={styles.onThisDayYears}>{getYearsAgo(memory.date)}</Text>
                    <Text style={styles.onThisDayText} numberOfLines={2}>
                      {memory.title || memory.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 🎉 Milestone ou Date Spéciale */}
        {(todayMilestone || todaySpecial) && (
          <View style={styles.milestoneCard}>
            <Text style={styles.milestoneEmoji}>
              {todaySpecial ? todaySpecial.emoji : '🎉'}
            </Text>
            <Text style={styles.milestoneTitle}>
              {todaySpecial
                ? `Joyeuse ${todaySpecial.name} ! 💕`
                : `🎉 ${todayMilestone} jours ensemble !`}
            </Text>
            <Text style={styles.milestoneSubtext}>
              {todaySpecial
                ? 'Profitez de cette journée spéciale ensemble !'
                : 'Félicitations ! Un cap magnifique 🏆'}
            </Text>
          </View>
        )}

        {/* ⏳ Countdown prochain événement */}
        {nextCountdown && (
          <TouchableOpacity 
            style={styles.countdownCard}
            onPress={() => setShowCountdownModal(true)}
          >
            <Text style={styles.countdownEmoji}>{nextCountdown.emoji || '📅'}</Text>
            <View style={styles.countdownInfo}>
              <Text style={styles.countdownName}>{nextCountdown.name}</Text>
              <Text style={styles.countdownDays}>
                dans <Text style={[styles.countdownNumber, { color: theme.accent }]}>{nextCountdown.daysLeft}</Text> jour{nextCountdown.daysLeft > 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={() => deleteCountdownEvent(nextCountdown.id)}>
              <Text style={{ fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {!nextCountdown && (
          <TouchableOpacity
            style={styles.addCountdownBtn}
            onPress={() => setShowCountdownModal(true)}
          >
            <Text style={styles.addCountdownText}>+ Ajouter un événement à compter</Text>
          </TouchableOpacity>
        )}

        {/* 🤔 Tu préfères du jour */}
        <View style={styles.tuPreferesCard}>
          <Text style={styles.tuPreferesTitle}>🤔 Tu préfères...</Text>
          <View style={styles.tuPreferesOptions}>
            <TouchableOpacity
              style={[
                styles.tuPreferesOption,
                tuPreferesAnswer === 'a' && { backgroundColor: theme.accent, borderColor: theme.accent },
              ]}
              onPress={() => setTuPreferesAnswer('a')}
            >
              <Text style={[styles.tuPreferesOptionText, tuPreferesAnswer === 'a' && { color: '#fff' }]}>
                {dailyTuPreferes.a}
              </Text>
            </TouchableOpacity>
            <Text style={styles.tuPreferesOu}>ou</Text>
            <TouchableOpacity
              style={[
                styles.tuPreferesOption,
                tuPreferesAnswer === 'b' && { backgroundColor: theme.accent, borderColor: theme.accent },
              ]}
              onPress={() => setTuPreferesAnswer('b')}
            >
              <Text style={[styles.tuPreferesOptionText, tuPreferesAnswer === 'b' && { color: '#fff' }]}>
                {dailyTuPreferes.b}
              </Text>
            </TouchableOpacity>
          </View>
          {tuPreferesAnswer && (
            <Text style={styles.tuPreferesResult}>
              ✅ Tu as choisi ! Demande à {partner?.name || 'ton partenaire'} son choix 💬
            </Text>
          )}
        </View>

        {/* 🏆 Badges & Niveau */}
        <View style={styles.badgesSection}>
          <Text style={styles.badgesSectionTitle}>🏆 Niveau & Badges</Text>
          <View style={styles.levelRow}>
            <Text style={styles.levelEmoji}>{levelInfo.rankEmoji}</Text>
            <View style={styles.levelInfo}>
              <Text style={styles.levelRank}>Couple {levelInfo.rank}</Text>
              <Text style={styles.levelDetail}>Niveau {levelInfo.level} • {levelInfo.totalXP} XP</Text>
            </View>
          </View>
          <View style={styles.badgesGrid}>
            {BADGES_LIST.slice(0, 8).map(badge => {
              const isUnlocked = unlockedBadges?.some(b => b.id === badge.id);
              return (
                <TouchableOpacity
                  key={badge.id}
                  style={[styles.badgeItem, !isUnlocked && styles.badgeLocked]}
                  onPress={() => Alert.alert(
                    `${badge.emoji} ${badge.name}`,
                    `${badge.desc}\n\n${isUnlocked ? '✅ Débloqué !' : '🔒 Pas encore débloqué'}`,
                  )}
                >
                  <Text style={[styles.badgeEmoji, !isUnlocked && { opacity: 0.3 }]}>
                    {badge.emoji}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.badgesCount}>
            {totalBadges}/{BADGES_LIST.length} badges débloqués
          </Text>
        </View>

        {/* 📣 Partager l'app / Parrainage */}
        <TouchableOpacity
          style={[styles.referralCard, { borderColor: theme.accent }]}
          onPress={async () => {
            try {
              const code = couple?.id ? couple.id.substring(0, 8).toUpperCase() : '';
              await Share.share({
                message: `💕 Rejoins-nous sur HANI, l'app couple ! Relève des défis, chatte et maintiens ta flamme 🔥\n${code ? `Code couple : ${code}\n` : ''}Télécharge HANI maintenant !`,
              });
            } catch (e) { console.log(e); }
          }}
        >
          <Text style={styles.referralEmoji}>📣</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.referralTitle}>Invite un couple !</Text>
            <Text style={styles.referralSubtext}>Partage HANI avec tes amis en couple 💕</Text>
          </View>
          <Text style={{ fontSize: 20, color: theme.accent }}>→</Text>
        </TouchableOpacity>

        {/* Daily Quote */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteIcon}>💭</Text>
          <Text style={styles.quoteText}>
            "L'amour ne se compte pas en jours, mais en moments inoubliables."
          </Text>
        </View>

        {/* Modal Countdown */}
        <Modal visible={showCountdownModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>📅 Nouvel événement</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nom (ex: Vacances, Anniversaire...)"
                value={newEventName}
                onChangeText={setNewEventName}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Date (ex: 14022025)"
                value={newEventDate}
                onChangeText={(text) => setNewEventDate(formatDateInput(text))}
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={10}
              />
              <View style={styles.emojiRow}>
                {['🎉', '✈️', '🎂', '💍', '🏖️', '🎄', '💝', '🎓'].map(e => (
                  <TouchableOpacity
                    key={e}
                    style={[
                      styles.emojiPick,
                      newEventEmoji === e && { backgroundColor: theme.accent },
                    ]}
                    onPress={() => setNewEventEmoji(e)}
                  >
                    <Text style={{ fontSize: 24 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowCountdownModal(false)}
                >
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { backgroundColor: theme.accent }]}
                  onPress={async () => {
                    if (!newEventName.trim() || !newEventDate.trim()) {
                      Alert.alert('Erreur', 'Remplis le nom et la date');
                      return;
                    }
                    // Parse date JJ/MM/AAAA
                    const parts = newEventDate.split('/');
                    if (parts.length !== 3) {
                      Alert.alert('Erreur', 'Format de date : JJ/MM/AAAA');
                      return;
                    }
                    const d = parseInt(parts[0]), m = parseInt(parts[1]) - 1, y = parseInt(parts[2]);
                    const date = new Date(y, m, d);
                    if (date <= new Date()) {
                      Alert.alert('Erreur', 'La date doit être dans le futur');
                      return;
                    }
                    await addCountdownEvent({
                      name: newEventName.trim(),
                      date: date.toISOString(),
                      emoji: newEventEmoji,
                    });
                    // ✅ Notifier le partenaire du nouvel événement
                    notifyNewEvent(newEventName.trim(), newEventEmoji);
                    setNewEventName('');
                    setNewEventDate('');
                    setNewEventEmoji('🎉');
                    setShowCountdownModal(false);
                    Alert.alert('✅', 'Événement ajouté !');
                  }}
                >
                  <Text style={styles.modalConfirmText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  welcomeCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  welcomeEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  welcomeSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
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
    marginBottom: 25,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  coupleName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  waitingText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
    marginTop: 5,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  syncDot: {
    fontSize: 8,
    marginRight: 5,
  },
  syncText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  partnerName: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  avatarContainer: {
    flexDirection: 'row',
  },
  avatar: {
    fontSize: 40,
    marginRight: -10,
  },
  partnerAvatar: {
    fontSize: 40,
  },
  presenceDot: {
    position: 'absolute',
    bottom: 2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  // Raccourcis chat
  chatShortcutCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  chatShortcutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 18,
  },
  chatShortcutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  chatShortcutIcon: {
    fontSize: 32,
  },
  chatShortcutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  chatShortcutSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  chatShortcutActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatShortcutCallBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatShortcutCallIcon: {
    fontSize: 18,
  },
  chatBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  counterCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  counterEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  counterNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  counterLabel: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
  },
  counterDetail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 5,
  },
  loveMeterCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
  },
  loveMeterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loveMeterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  loveMeterValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loveMeterBar: {
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  loveMeterFill: {
    height: '100%',
    borderRadius: 6,
  },
  loveMeterHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  actionCard: {
    width: (width - 50) / 2,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  quoteCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  quoteIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  quoteText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  // "Ce jour-là" styles
  onThisDaySection: {
    marginBottom: 25,
  },
  onThisDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  onThisDayIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  onThisDayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  onThisDayScroll: {
    marginHorizontal: -10,
    paddingHorizontal: 10,
  },
  onThisDayCard: {
    width: 180,
    height: 220,
    marginRight: 15,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  onThisDayImage: {
    width: '100%',
    height: '100%',
  },
  onThisDayImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onThisDayEmoji: {
    fontSize: 60,
  },
  onThisDayOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  onThisDayYears: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  onThisDayText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  // ===== Milestone / Date spéciale =====
  milestoneCard: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  milestoneEmoji: { fontSize: 50, marginBottom: 8 },
  milestoneTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  milestoneSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5, textAlign: 'center' },
  // ===== Countdown =====
  countdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  countdownEmoji: { fontSize: 36 },
  countdownInfo: { flex: 1 },
  countdownName: { fontSize: 16, fontWeight: '700', color: '#333' },
  countdownDays: { fontSize: 14, color: '#666', marginTop: 2 },
  countdownNumber: { fontSize: 22, fontWeight: 'bold' },
  addCountdownBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
  },
  addCountdownText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  // ===== Tu Préfères =====
  tuPreferesCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  tuPreferesTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  tuPreferesOptions: { gap: 8 },
  tuPreferesOption: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  tuPreferesOptionText: { fontSize: 15, color: '#333', textAlign: 'center', fontWeight: '600' },
  tuPreferesOu: { textAlign: 'center', fontSize: 14, color: '#999', fontWeight: '700', marginVertical: 2 },
  tuPreferesResult: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 10 },
  // ===== Badges =====
  badgesSection: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  badgesSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  levelEmoji: { fontSize: 36 },
  levelInfo: { flex: 1 },
  levelRank: { fontSize: 16, fontWeight: '700', color: '#333' },
  levelDetail: { fontSize: 13, color: '#666', marginTop: 2 },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  badgeItem: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF5F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  badgeLocked: {
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  badgeEmoji: { fontSize: 24 },
  badgesCount: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 10 },
  // ===== Referral =====
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    borderWidth: 2,
  },
  referralEmoji: { fontSize: 32 },
  referralTitle: { fontSize: 15, fontWeight: '700', color: '#333' },
  referralSubtext: { fontSize: 12, color: '#666', marginTop: 2 },
  // ===== Modal =====
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 16, textAlign: 'center' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  emojiPick: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  modalButtons: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  modalCancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  modalCancelText: { fontSize: 15, color: '#999', fontWeight: '600' },
  modalConfirmBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  modalConfirmText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
