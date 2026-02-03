import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNotifyPartner } from '../hooks/useNotifyPartner';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, couple, partner, isOnline, isSynced } = useAuth();
  const { loveMeter, challenges, memories } = useData();
  const { notifyMissYou, notifyLoveNote, sendCustomNotification } = useNotifyPartner();
  const [daysCount, setDaysCount] = useState(0);
  const [timeTogetherText, setTimeTogetherText] = useState('');
  const [hasValidDate, setHasValidDate] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toDateString());

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

  // Écouter quand l'app revient au premier plan pour recalculer
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📱 App revenue au premier plan - recalcul des jours');
        calculateDaysTogether();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [calculateDaysTogether]);

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
          <View>
            <Text style={styles.greeting}>Bonjour {user?.name} 💖</Text>
            {/* Nom du couple - seulement si partenaire a rejoint */}
            {partner?.name ? (
              <Text style={styles.coupleName}>{couple?.name || 'Notre Couple'}</Text>
            ) : (
              <Text style={styles.waitingText}>En attente de votre partenaire...</Text>
            )}
            {/* Indicateur de synchronisation - seulement si partenaire a rejoint */}
            {partner?.name && (
              <View style={styles.syncIndicator}>
                <Text style={styles.syncDot}>{isOnline ? '🟢' : '🔴'}</Text>
                <Text style={styles.syncText}>
                  {isOnline ? (isSynced ? 'Synchronisé' : 'En ligne') : 'Hors ligne'}
                </Text>
                <Text style={styles.partnerName}> • avec {partner.name}</Text>
              </View>
            )}
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{user?.avatar || '😊'}</Text>
            {partner?.name && (
              <Text style={styles.partnerAvatar}>{partner?.avatar || '💕'}</Text>
            )}
          </View>
        </View>

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

        {/* Daily Quote */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteIcon}>💭</Text>
          <Text style={styles.quoteText}>
            "L'amour ne se compte pas en jours, mais en moments inoubliables."
          </Text>
        </View>

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
});
