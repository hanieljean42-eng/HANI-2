import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const { width, height } = Dimensions.get('window');

export default function RetrospectiveScreen({ navigation }) {
  const { theme } = useTheme();
  const { memories, challenges, bucketList, loveNotes, sharedDiary } = useData();
  const { messages } = useChat();
  const { user, couple, partner } = useAuth();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [retrospective, setRetrospective] = useState(null);

  useEffect(() => {
    generateRetrospective();
  }, [memories, challenges, bucketList, loveNotes, sharedDiary, messages]);

  const generateRetrospective = () => {
    const now = new Date();
    const thisYear = now.getFullYear();
    
    // Filtrer les données de cette année
    const thisYearMemories = memories?.filter(m => {
      const parts = m.date?.split('/');
      return parts && parts[2] === thisYear.toString();
    }) || [];

    const thisYearChallenges = challenges?.filter(c => {
      const date = new Date(c.completedAt || c.createdAt);
      return date.getFullYear() === thisYear;
    }) || [];

    const thisYearMessages = messages?.filter(m => {
      const date = new Date(m.timestamp);
      return date.getFullYear() === thisYear;
    }) || [];

    const thisYearDiary = sharedDiary?.filter(d => {
      const date = new Date(d.createdAt);
      return date.getFullYear() === thisYear;
    }) || [];

    // Calcul des jours ensemble
    let daysTogether = 0;
    if (couple?.anniversary) {
      const parts = couple.anniversary.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const anniversaryDate = new Date(parts[2], parts[1] - 1, parts[0]);
        daysTogether = Math.floor((now - anniversaryDate) / (1000 * 60 * 60 * 24));
      }
    }

    // Trouver le mois le plus actif
    const monthCounts = {};
    thisYearMemories.forEach(m => {
      const month = m.date?.substring(3, 5);
      if (month) {
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      }
    });
    
    const monthNames = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    let topMonth = '';
    let topMonthCount = 0;
    Object.entries(monthCounts).forEach(([month, count]) => {
      if (count > topMonthCount) {
        topMonthCount = count;
        topMonth = monthNames[parseInt(month)] || month;
      }
    });

    // Compter les défis complétés
    const completedChallenges = thisYearChallenges.filter(c => c.completed).length;

    // Emoji le plus utilisé dans les messages
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu;
    const emojiCounts = {};
    thisYearMessages.forEach(m => {
      const emojis = m.content?.match(emojiRegex) || [];
      emojis.forEach(emoji => {
        emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
      });
    });
    
    let topEmoji = '💕';
    let topEmojiCount = 0;
    Object.entries(emojiCounts).forEach(([emoji, count]) => {
      if (count > topEmojiCount) {
        topEmojiCount = count;
        topEmoji = emoji;
      }
    });

    // Humeur la plus fréquente dans le journal
    const moodCounts = {};
    thisYearDiary.forEach(d => {
      if (d.mood) {
        moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1;
      }
    });
    
    let topMood = '😊';
    let topMoodCount = 0;
    Object.entries(moodCounts).forEach(([mood, count]) => {
      if (count > topMoodCount) {
        topMoodCount = count;
        topMood = mood;
      }
    });

    setRetrospective({
      year: thisYear,
      daysTogether,
      totalMemories: thisYearMemories.length,
      totalMessages: thisYearMessages.length,
      totalDiary: thisYearDiary.length,
      completedChallenges,
      completedBucket: bucketList?.filter(b => b.completed).length || 0,
      topMonth,
      topMonthCount,
      topEmoji,
      topEmojiCount,
      topMood,
      topMoodCount,
    });
  };

  const slides = retrospective ? [
    {
      emoji: '✨',
      title: `Votre ${retrospective.year}`,
      subtitle: 'Une année d\'amour',
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
      subtitle: 'Capturés ensemble',
      gradient: ['#11998e', '#38ef7d'],
    },
    {
      emoji: '💬',
      title: `${retrospective.totalMessages} messages`,
      subtitle: 'Échangés avec amour',
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
      subtitle: `Une belle année ${retrospective.year} ensemble 💕`,
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
          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.finishButtonText}>Terminer 💕</Text>
          </TouchableOpacity>
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
});
