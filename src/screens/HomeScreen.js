import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user, couple, partner } = useAuth();
  const { loveMeter, challenges, memories } = useData();
  const [daysCount, setDaysCount] = useState(0);
  const [timeTogetherText, setTimeTogetherText] = useState('');

  useEffect(() => {
    if (couple?.anniversary) {
      calculateDaysTogether();
      const interval = setInterval(calculateDaysTogether, 60000);
      return () => clearInterval(interval);
    }
  }, [couple]);

  const calculateDaysTogether = () => {
    if (!couple?.anniversary) return;
    
    const parts = couple.anniversary.split('/');
    if (parts.length === 3) {
      const anniversaryDate = new Date(parts[2], parts[1] - 1, parts[0]);
      const now = new Date();
      const diff = now - anniversaryDate;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      setDaysCount(days);
      
      const years = Math.floor(days / 365);
      const months = Math.floor((days % 365) / 30);
      const remainingDays = days % 30;
      
      let text = '';
      if (years > 0) text += `${years} an${years > 1 ? 's' : ''} `;
      if (months > 0) text += `${months} mois `;
      if (remainingDays > 0) text += `${remainingDays} jour${remainingDays > 1 ? 's' : ''}`;
      
      setTimeTogetherText(text.trim());
    }
  };

  const completedChallenges = challenges.filter(c => c.completed).length;

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
          <View>
            <Text style={styles.greeting}>Bonjour {user?.name} 💖</Text>
            <Text style={styles.coupleName}>{couple?.name || 'Votre Couple'}</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{user?.avatar || '😊'}</Text>
            <Text style={styles.partnerAvatar}>{partner?.avatar || '💕'}</Text>
          </View>
        </View>

        {/* Days Counter */}
        <View style={styles.counterCard}>
          <Text style={styles.counterEmoji}>💕</Text>
          <Text style={styles.counterNumber}>{daysCount}</Text>
          <Text style={styles.counterLabel}>jours d'amour</Text>
          {timeTogetherText && (
            <Text style={styles.counterDetail}>{timeTogetherText}</Text>
          )}
        </View>

        {/* Love Meter */}
        <View style={styles.loveMeterCard}>
          <View style={styles.loveMeterHeader}>
            <Text style={styles.loveMeterTitle}>💗 Love Meter</Text>
            <Text style={styles.loveMeterValue}>{loveMeter}%</Text>
          </View>
          <View style={styles.loveMeterBar}>
            <LinearGradient
              colors={['#FF6B9D', '#C44569']}
              style={[styles.loveMeterFill, { width: `${loveMeter}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.loveMeterHint}>Complétez des défis pour augmenter !</Text>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Actions rapides</Text>
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
            onPress={() => {}}
          >
            <Text style={styles.actionIcon}>💌</Text>
            <Text style={styles.actionLabel}>Love Note</Text>
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
    color: '#C44569',
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
    color: '#999',
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
});
