import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const { width } = Dimensions.get('window');

export default function StatsScreen({ navigation }) {
  const { theme } = useTheme();
  const { memories, challenges, bucketList, loveNotes, timeCapsules, sharedDiary, loveMeter } = useData();
  const { messages } = useChat();
  const { user, couple, partner } = useAuth();

  const [stats, setStats] = useState({});

  useEffect(() => {
    calculateStats();
  }, [memories, challenges, messages, bucketList, loveNotes, timeCapsules, sharedDiary]);

  const calculateStats = () => {
    // Calcul des jours ensemble
    let daysTogether = 0;
    if (couple?.anniversary) {
      const parts = couple.anniversary.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const anniversaryDate = new Date(parts[2], parts[1] - 1, parts[0]);
        const now = new Date();
        daysTogether = Math.floor((now - anniversaryDate) / (1000 * 60 * 60 * 24));
      }
    }

    // Messages envoyés
    const myMessages = messages?.filter(m => m.senderId === user?.id).length || 0;
    const partnerMessages = messages?.filter(m => m.senderId !== user?.id).length || 0;

    // Souvenirs par mois
    const memoriesByMonth = {};
    memories?.forEach(m => {
      const month = m.date?.substring(3, 10) || 'Inconnu';
      memoriesByMonth[month] = (memoriesByMonth[month] || 0) + 1;
    });

    // Défis complétés
    const completedChallenges = challenges?.filter(c => c.completed).length || 0;

    // Bucket list
    const completedBucket = bucketList?.filter(b => b.completed).length || 0;

    // Journal entries
    const myDiaryEntries = sharedDiary?.filter(d => d.authorId === user?.id).length || 0;
    const partnerDiaryEntries = sharedDiary?.filter(d => d.authorId !== user?.id).length || 0;

    setStats({
      daysTogether,
      totalMemories: memories?.length || 0,
      totalMessages: messages?.length || 0,
      myMessages,
      partnerMessages,
      memoriesByMonth,
      completedChallenges,
      totalChallenges: challenges?.length || 0,
      completedBucket,
      totalBucket: bucketList?.length || 0,
      totalNotes: loveNotes?.length || 0,
      totalCapsules: timeCapsules?.length || 0,
      totalDiary: sharedDiary?.length || 0,
      myDiaryEntries,
      partnerDiaryEntries,
      loveMeter,
    });
  };

  const StatCard = ({ icon, title, value, subtitle, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color || theme.accent }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const ProgressBar = ({ value, max, color, label }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={styles.progressValue}>{value}/{max}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${percentage}%`, backgroundColor: color || theme.accent }
            ]} 
          />
        </View>
      </View>
    );
  };

  const ComparisonBar = ({ label1, value1, label2, value2, emoji1, emoji2 }) => {
    const total = value1 + value2;
    const percent1 = total > 0 ? (value1 / total) * 100 : 50;
    
    return (
      <View style={styles.comparisonContainer}>
        <View style={styles.comparisonLabels}>
          <Text style={styles.comparisonLabel}>{emoji1} {label1}: {value1}</Text>
          <Text style={styles.comparisonLabel}>{label2}: {value2} {emoji2}</Text>
        </View>
        <View style={styles.comparisonBar}>
          <View style={[styles.comparisonLeft, { width: `${percent1}%` }]} />
          <View style={[styles.comparisonRight, { width: `${100 - percent1}%` }]} />
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={theme.primary} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 Statistiques</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Stats */}
        <View style={styles.heroSection}>
          <View style={styles.heroCard}>
            <Text style={styles.heroEmoji}>💕</Text>
            <Text style={styles.heroValue}>{stats.daysTogether || 0}</Text>
            <Text style={styles.heroLabel}>Jours ensemble</Text>
          </View>
          <View style={styles.heroCard}>
            <Text style={styles.heroEmoji}>💗</Text>
            <Text style={styles.heroValue}>{stats.loveMeter || 0}%</Text>
            <Text style={styles.heroLabel}>Love Meter</Text>
          </View>
        </View>

        {/* Communication */}
        <Text style={styles.sectionTitle}>💬 Communication</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="💬" title="Messages" value={stats.totalMessages} color="#667eea" />
          <StatCard icon="💌" title="Notes d'amour" value={stats.totalNotes} color="#f093fb" />
        </View>

        {stats.totalMessages > 0 && (
          <ComparisonBar
            label1={user?.name || 'Moi'}
            value1={stats.myMessages}
            label2={partner?.name || 'Partenaire'}
            value2={stats.partnerMessages}
            emoji1="💬"
            emoji2="💬"
          />
        )}

        {/* Souvenirs */}
        <Text style={styles.sectionTitle}>📸 Souvenirs</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="📸" title="Photos/Vidéos" value={stats.totalMemories} color="#10B981" />
          <StatCard icon="⏰" title="Capsules" value={stats.totalCapsules} color="#F59E0B" />
        </View>

        {/* Défis & Bucket List */}
        <Text style={styles.sectionTitle}>🎯 Objectifs</Text>
        
        <ProgressBar
          value={stats.completedChallenges}
          max={stats.totalChallenges}
          label="Défis complétés"
          color="#10B981"
        />

        <ProgressBar
          value={stats.completedBucket}
          max={stats.totalBucket}
          label="Bucket List réalisée"
          color="#8B5CF6"
        />

        {/* Journal */}
        {stats.totalDiary > 0 && (
          <>
            <Text style={styles.sectionTitle}>📖 Journal partagé</Text>
            <StatCard 
              icon="📖" 
              title="Entrées totales" 
              value={stats.totalDiary} 
              color="#C44569"
            />
            <ComparisonBar
              label1={user?.name || 'Moi'}
              value1={stats.myDiaryEntries}
              label2={partner?.name || 'Partenaire'}
              value2={stats.partnerDiaryEntries}
              emoji1="✍️"
              emoji2="✍️"
            />
          </>
        )}

        {/* Fun Facts */}
        <Text style={styles.sectionTitle}>✨ Fun Facts</Text>
        <View style={styles.funFactsCard}>
          <Text style={styles.funFact}>
            💑 Vous êtes ensemble depuis {stats.daysTogether || 0} jours
          </Text>
          <Text style={styles.funFact}>
            📸 Vous avez créé {stats.totalMemories || 0} souvenirs ensemble
          </Text>
          <Text style={styles.funFact}>
            💬 Vous avez échangé {stats.totalMessages || 0} messages
          </Text>
          <Text style={styles.funFact}>
            🎯 Vous avez complété {stats.completedChallenges || 0} défis
          </Text>
          {stats.completedBucket > 0 && (
            <Text style={styles.funFact}>
              ✅ Vous avez réalisé {stats.completedBucket} rêves de votre bucket list !
            </Text>
          )}
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  backButton: {
    padding: 10,
  },
  backText: {
    fontSize: 24,
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  content: {
    padding: 20,
  },
  heroSection: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
  },
  heroCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 30,
    marginBottom: 5,
  },
  heroValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  heroLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    marginBottom: 10,
  },
  statIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  statSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  progressContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressValue: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  comparisonContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 15,
    marginTop: 10,
    marginBottom: 10,
  },
  comparisonLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  comparisonLabel: {
    fontSize: 13,
    color: '#fff',
  },
  comparisonBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  comparisonLeft: {
    backgroundColor: '#FF6B9D',
    height: '100%',
  },
  comparisonRight: {
    backgroundColor: '#667eea',
    height: '100%',
  },
  funFactsCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 20,
  },
  funFact: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 12,
    lineHeight: 22,
  },
});
