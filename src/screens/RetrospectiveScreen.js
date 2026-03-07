import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const { width, height } = Dimensions.get('window');

const MONTH_NAMES = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function RetrospectiveScreen({ navigation }) {
  const { theme } = useTheme();
  const { memories, challenges, bucketList, loveNotes, sharedDiary } = useData();
  const { messages } = useChat();
  const { user, couple, partner } = useAuth();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [retrospective, setRetrospective] = useState(null);
  const [mode, setMode] = useState('year'); // 'year' ou 'month'

  useEffect(() => {
    generateRetrospective();
  }, [mode]);

  const generateRetrospective = () => {
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth(); // 0-indexed
    
    // En mode mois, on regarde le mois dernier
    const targetMonth = mode === 'month' ? (thisMonth === 0 ? 11 : thisMonth - 1) : null;
    const targetMonthYear = mode === 'month' ? (thisMonth === 0 ? thisYear - 1 : thisYear) : thisYear;

    const isInPeriod = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (mode === 'month') {
        return d.getMonth() === targetMonth && d.getFullYear() === targetMonthYear;
      }
      return d.getFullYear() === thisYear;
    };

    const isMemoryInPeriod = (m) => {
      const parts = m.date?.split('/');
      if (!parts || parts.length !== 3) return false;
      const memMonth = parseInt(parts[1], 10) - 1;
      const memYear = parseInt(parts[2], 10);
      if (mode === 'month') return memMonth === targetMonth && memYear === targetMonthYear;
      return memYear === thisYear;
    };
    
    const filteredMemories = memories?.filter(isMemoryInPeriod) || [];
    const filteredChallenges = challenges?.filter(c => isInPeriod(c.completedAt || c.createdAt)) || [];
    const filteredMessages = messages?.filter(m => isInPeriod(m.timestamp)) || [];
    const filteredDiary = sharedDiary?.filter(d => isInPeriod(d.createdAt)) || [];

    // Calcul des jours ensemble
    let daysTogether = 0;
    if (couple?.anniversary) {
      const parts = couple.anniversary.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const anniversaryDate = new Date(parts[2], parts[1] - 1, parts[0]);
        daysTogether = Math.floor((now - anniversaryDate) / (1000 * 60 * 60 * 24));
      }
    }

    // Trouver le mois le plus actif (seulement en mode annuel)
    const monthCounts = {};
    filteredMemories.forEach(m => {
      const month = m.date?.substring(3, 5);
      if (month) monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    
    let topMonth = '';
    let topMonthCount = 0;
    Object.entries(monthCounts).forEach(([month, count]) => {
      if (count > topMonthCount) {
        topMonthCount = count;
        topMonth = MONTH_NAMES[parseInt(month)] || month;
      }
    });

    const completedChallenges = filteredChallenges.filter(c => c.completed).length;

    // Emoji le plus utilisé
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu;
    const emojiCounts = {};
    filteredMessages.forEach(m => {
      const emojis = m.content?.match(emojiRegex) || [];
      emojis.forEach(emoji => { emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1; });
    });
    let topEmoji = '💕', topEmojiCount = 0;
    Object.entries(emojiCounts).forEach(([emoji, count]) => {
      if (count > topEmojiCount) { topEmojiCount = count; topEmoji = emoji; }
    });

    // Humeur dominante
    const moodCounts = {};
    filteredDiary.forEach(d => { if (d.mood) moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1; });
    let topMood = '😊', topMoodCount = 0;
    Object.entries(moodCounts).forEach(([mood, count]) => {
      if (count > topMoodCount) { topMoodCount = count; topMood = mood; }
    });

    const periodLabel = mode === 'month' 
      ? MONTH_NAMES[targetMonth + 1] + ' ' + targetMonthYear
      : thisYear.toString();

    setRetrospective({
      year: thisYear,
      periodLabel,
      daysTogether,
      totalMemories: filteredMemories.length,
      totalMessages: filteredMessages.length,
      totalDiary: filteredDiary.length,
      completedChallenges,
      completedBucket: bucketList?.filter(b => b.completed).length || 0,
      topMonth,
      topMonthCount,
      topEmoji,
      topEmojiCount,
      topMood,
      topMoodCount,
    });
    setCurrentSlide(0);
  };

  const isMonthly = mode === 'month';
  const periodTitle = retrospective?.periodLabel || '';

  const shareRetrospective = async () => {
    if (!retrospective) return;
    const label = isMonthly ? `du mois de ${periodTitle}` : `de ${periodTitle}`;
    const text = `💕 Notre rétrospective ${label} sur HANI !\n\n` +
      `📸 ${retrospective.totalMemories} souvenirs\n` +
      `💬 ${retrospective.totalMessages} messages\n` +
      `🏆 ${retrospective.completedChallenges} défis relevés\n` +
      `${retrospective.topEmoji} Emoji préféré (${retrospective.topEmojiCount}x)\n` +
      `${retrospective.topMood} Humeur dominante\n\n` +
      `Téléchargez HANI pour votre couple ! 💕`;
    try { await Share.share({ message: text }); } catch (_) {}
  };

  const slides = retrospective ? [
    {
      emoji: '✨',
      title: isMonthly ? periodTitle : `Votre ${periodTitle}`,
      subtitle: isMonthly ? 'Votre mois en couple' : 'Une année d\'amour',
      gradient: ['#667eea', '#764ba2'],
    },
    {
      emoji: '💕',
      title: `${retrospective.daysTogether} jours`,
      subtitle: 'D\'amour partagé',
      gradient: ['#FF6B9D', '#C44569'],
    },
    {
      emoji: '📸',
      title: `${retrospective.totalMemories} souvenirs`,
      subtitle: isMonthly ? 'Ce mois-ci' : 'Capturés ensemble',
      gradient: ['#11998e', '#38ef7d'],
    },
    {
      emoji: '💬',
      title: `${retrospective.totalMessages} messages`,
      subtitle: isMonthly ? 'Ce mois-ci' : 'Échangés avec amour',
      gradient: ['#f093fb', '#f5576c'],
    },
    {
      emoji: retrospective.topEmoji,
      title: 'Votre emoji préféré',
      subtitle: `Utilisé ${retrospective.topEmojiCount} fois`,
      gradient: ['#F7971E', '#FFD200'],
    },
    {
      emoji: '🏆',
      title: `${retrospective.completedChallenges} défis`,
      subtitle: 'Relevés ensemble',
      gradient: ['#8B5CF6', '#6366F1'],
    },
    {
      emoji: retrospective.topMood,
      title: 'Votre humeur dominante',
      subtitle: `${retrospective.topMoodCount} fois dans le journal`,
      gradient: ['#a18cd1', '#fbc2eb'],
    },
    {
      emoji: '🎉',
      title: 'Bravo !',
      subtitle: isMonthly 
        ? `Un beau mois de ${periodTitle} ensemble 💕`
        : `Une belle année ${periodTitle} ensemble 💕`,
      gradient: ['#FF6B9D', '#8B5CF6'],
    },
  ] : [];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSlide(currentSlide + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSlide(currentSlide - 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  if (!retrospective || slides.length === 0) {
    return (
      <LinearGradient colors={theme.primary} style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Préparation de votre rétrospective...</Text>
        </View>
      </LinearGradient>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <LinearGradient colors={currentSlideData.gradient} style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      {/* Mode toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'year' && styles.modeBtnActive]}
          onPress={() => { setMode('year'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        >
          <Text style={[styles.modeBtnText, mode === 'year' && styles.modeBtnTextActive]}>📅 Année</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'month' && styles.modeBtnActive]}
          onPress={() => { setMode('month'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        >
          <Text style={[styles.modeBtnText, mode === 'month' && styles.modeBtnTextActive]}>🗓️ Mois</Text>
        </TouchableOpacity>
      </View>

      {/* Progress dots */}
      <View style={styles.progressDots}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentSlide === index && styles.dotActive,
              currentSlide > index && styles.dotCompleted,
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <Animated.View style={[styles.slideContent, { opacity: fadeAnim }]}>
        <Text style={styles.slideEmoji}>{currentSlideData.emoji}</Text>
        <Text style={styles.slideTitle}>{currentSlideData.title}</Text>
        <Text style={styles.slideSubtitle}>{currentSlideData.subtitle}</Text>
      </Animated.View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, currentSlide === 0 && styles.navButtonDisabled]}
          onPress={prevSlide}
          disabled={currentSlide === 0}
        >
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.slideCounter}>
          {currentSlide + 1} / {slides.length}
        </Text>

        {currentSlide < slides.length - 1 ? (
          <TouchableOpacity
            style={styles.navButton}
            onPress={nextSlide}
          >
            <Text style={styles.navButtonText}>→</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={shareRetrospective}
            >
              <Text style={styles.shareButtonText}>Partager 📤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.finishButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.finishButtonText}>Terminer 💕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeText: {
    fontSize: 20,
    color: '#fff',
  },
  progressDots: {
    position: 'absolute',
    top: 100,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  dotCompleted: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideEmoji: {
    fontSize: 100,
    marginBottom: 30,
  },
  slideTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  slideSubtitle: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  navigation: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  slideCounter: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  finishButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  modeToggle: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 3,
    zIndex: 10,
  },
  modeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 17,
  },
  modeBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  modeBtnText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: '#fff',
  },
  shareButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
});
