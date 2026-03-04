import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNotifyPartner } from '../hooks/useNotifyPartner';

const { width, height } = Dimensions.get('window');

export default function WidgetsScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, partner, couple } = useAuth();
  const { memories, loveNotes, challenges } = useData();
  const { notifyLoveNote } = useNotifyPartner();
  
  const [widgetSettings, setWidgetSettings] = useState({
    showCountdown: true,
    showQuickLove: true,
    showDailyChallenge: true,
    showRelationshipStats: true,
    showMoodTracker: true,
    notifyMorning: true,
    notifyEvening: true,
  });
  
  const [todayMood, setTodayMood] = useState(null);
  const [quickLoveCount, setQuickLoveCount] = useState(0);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('@widgetSettings');
      if (saved) setWidgetSettings(JSON.parse(saved));
      
      const mood = await AsyncStorage.getItem('@todayMood');
      if (mood) setTodayMood(JSON.parse(mood));
      
      const loveCount = await AsyncStorage.getItem('@quickLoveToday');
      if (loveCount) setQuickLoveCount(parseInt(loveCount) || 0);
    } catch (error) {
      console.log('Erreur chargement widgets:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    setWidgetSettings(newSettings);
    await AsyncStorage.setItem('@widgetSettings', JSON.stringify(newSettings));
  };

  const toggleSetting = async (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSettings = { ...widgetSettings, [key]: !widgetSettings[key] };
    await saveSettings(newSettings);
  };

  // Parser une date au format JJ/MM/AAAA ou JJ-MM-AAAA
  const parseAnniversary = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.trim().split(/[\/\-\.]/); 
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900) {
        return new Date(year, month, day);
      }
    }
    // Fallback: essayer le format natif
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // Calculer les jours ensemble
  const getDaysTogether = () => {
    const start = parseAnniversary(couple?.anniversary);
    if (!start) return 0;
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  };

  // Calculer le prochain anniversaire
  const getNextAnniversary = () => {
    const anniversary = parseAnniversary(couple?.anniversary);
    if (!anniversary) return null;
    const now = new Date();
    const thisYear = new Date(now.getFullYear(), anniversary.getMonth(), anniversary.getDate());
    const nextYear = new Date(now.getFullYear() + 1, anniversary.getMonth(), anniversary.getDate());
    
    const next = thisYear > now ? thisYear : nextYear;
    const days = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
    return { date: next, days };
  };

  // Envoyer un Quick Love
  const sendQuickLove = async (type) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newCount = quickLoveCount + 1;
    setQuickLoveCount(newCount);
    await AsyncStorage.setItem('@quickLoveToday', newCount.toString());
    
    const messages = {
      heart: 'Je t\'aime ❤️',
      kiss: 'Bisou 💋',
      hug: 'Câlin virtuel 🤗',
      thinking: 'Je pense à toi 💭',
      miss: 'Tu me manques 😢💕',
    };
    
    // ✅ Envoyer une notification push au partenaire
    try {
      await notifyLoveNote(messages[type]);
    } catch (e) {
      console.log('Erreur envoi Quick Love push:', e);
    }
    
    Alert.alert(
      'Envoyé !',
      `${messages[type]} envoyé à ${partner?.name || 'ton amour'} !`,
      [{ text: '💕' }]
    );
  };

  // Définir l'humeur du jour
  const setMood = async (mood) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const moodData = {
      mood,
      date: new Date().toDateString(),
    };
    setTodayMood(moodData);
    await AsyncStorage.setItem('@todayMood', JSON.stringify(moodData));
  };

  const moods = [
    { id: 'happy', emoji: '😊', label: 'Heureux(se)' },
    { id: 'love', emoji: '🥰', label: 'Amoureux(se)' },
    { id: 'excited', emoji: '🤩', label: 'Excité(e)' },
    { id: 'calm', emoji: '😌', label: 'Serein(e)' },
    { id: 'tired', emoji: '😴', label: 'Fatigué(e)' },
    { id: 'stressed', emoji: '😰', label: 'Stressé(e)' },
    { id: 'sad', emoji: '😢', label: 'Triste' },
    { id: 'angry', emoji: '😤', label: 'Énervé(e)' },
  ];

  const quickLoves = [
    { id: 'heart', emoji: '❤️', label: 'Je t\'aime' },
    { id: 'kiss', emoji: '💋', label: 'Bisou' },
    { id: 'hug', emoji: '🤗', label: 'Câlin' },
    { id: 'thinking', emoji: '💭', label: 'Je pense à toi' },
    { id: 'miss', emoji: '🥺', label: 'Tu me manques' },
  ];

  const nextAnniversary = getNextAnniversary();
  const daysTogether = getDaysTogether();

  // Obtenir le défi du jour
  const getDailyChallenge = () => {
    const dailyChallenges = [
      'Faites-vous 3 compliments aujourd\'hui 💬',
      'Préparez une surprise pour l\'autre 🎁',
      'Regardez un coucher de soleil ensemble 🌅',
      'Écrivez une lettre d\'amour ✉️',
      'Cuisinez ensemble ce soir 👨‍🍳',
      'Partagez 3 choses que vous adorez chez l\'autre 💕',
      'Faites une promenade main dans la main 🚶‍♂️🚶‍♀️',
      'Regardez vos photos de couple 📸',
    ];
    const dayIndex = new Date().getDate() % dailyChallenges.length;
    return dailyChallenges[dayIndex];
  };

  return (
    <LinearGradient colors={theme.primary} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Widgets & Raccourcis</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Widget Compteur */}
        {widgetSettings.showCountdown && (
          <View style={styles.widget}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>📅 Notre Histoire</Text>
              <Switch
                value={widgetSettings.showCountdown}
                onValueChange={() => toggleSetting('showCountdown')}
                trackColor={{ false: '#ccc', true: theme.accent + '80' }}
                thumbColor={widgetSettings.showCountdown ? theme.accent : '#f4f3f4'}
              />
            </View>
            <View style={styles.countdownContent}>
              <View style={styles.countdownItem}>
                <Text style={styles.countdownNumber}>{daysTogether}</Text>
                <Text style={styles.countdownLabel}>jours ensemble</Text>
              </View>
              {nextAnniversary && (
                <View style={styles.countdownItem}>
                  <Text style={styles.countdownNumber}>{nextAnniversary.days}</Text>
                  <Text style={styles.countdownLabel}>jours avant l'anniversaire</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Widget Quick Love */}
        {widgetSettings.showQuickLove && (
          <View style={styles.widget}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>💌 Quick Love</Text>
              <Switch
                value={widgetSettings.showQuickLove}
                onValueChange={() => toggleSetting('showQuickLove')}
                trackColor={{ false: '#ccc', true: theme.accent + '80' }}
                thumbColor={widgetSettings.showQuickLove ? theme.accent : '#f4f3f4'}
              />
            </View>
            <Text style={styles.widgetSubtitle}>
              Envoyé {quickLoveCount}x aujourd'hui
            </Text>
            <View style={styles.quickLoveGrid}>
              {quickLoves.map((love) => (
                <TouchableOpacity
                  key={love.id}
                  style={styles.quickLoveButton}
                  onPress={() => sendQuickLove(love.id)}
                >
                  <Text style={styles.quickLoveEmoji}>{love.emoji}</Text>
                  <Text style={styles.quickLoveLabel}>{love.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Widget Défi du jour */}
        {widgetSettings.showDailyChallenge && (
          <View style={styles.widget}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>🎯 Défi du Jour</Text>
              <Switch
                value={widgetSettings.showDailyChallenge}
                onValueChange={() => toggleSetting('showDailyChallenge')}
                trackColor={{ false: '#ccc', true: theme.accent + '80' }}
                thumbColor={widgetSettings.showDailyChallenge ? theme.accent : '#f4f3f4'}
              />
            </View>
            <View style={styles.challengeCard}>
              <Text style={styles.challengeText}>{getDailyChallenge()}</Text>
              <TouchableOpacity style={styles.challengeDoneButton}>
                <LinearGradient
                  colors={theme.primary}
                  style={styles.challengeDoneGradient}
                >
                  <Text style={styles.challengeDoneText}>Fait ! ✓</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Widget Mood Tracker */}
        {widgetSettings.showMoodTracker && (
          <View style={styles.widget}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>😊 Mon Humeur</Text>
              <Switch
                value={widgetSettings.showMoodTracker}
                onValueChange={() => toggleSetting('showMoodTracker')}
                trackColor={{ false: '#ccc', true: theme.accent + '80' }}
                thumbColor={widgetSettings.showMoodTracker ? theme.accent : '#f4f3f4'}
              />
            </View>
            {todayMood?.date === new Date().toDateString() ? (
              <View style={styles.moodSet}>
                <Text style={styles.moodSetEmoji}>
                  {moods.find(m => m.id === todayMood.mood)?.emoji}
                </Text>
                <Text style={styles.moodSetText}>
                  Tu te sens {moods.find(m => m.id === todayMood.mood)?.label.toLowerCase()} aujourd'hui
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.widgetSubtitle}>Comment te sens-tu ?</Text>
                <View style={styles.moodGrid}>
                  {moods.map((mood) => (
                    <TouchableOpacity
                      key={mood.id}
                      style={[
                        styles.moodButton,
                        todayMood?.mood === mood.id && styles.moodButtonSelected,
                      ]}
                      onPress={() => setMood(mood.id)}
                    >
                      <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Widget Stats rapides */}
        {widgetSettings.showRelationshipStats && (
          <View style={styles.widget}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>📊 Stats Rapides</Text>
              <Switch
                value={widgetSettings.showRelationshipStats}
                onValueChange={() => toggleSetting('showRelationshipStats')}
                trackColor={{ false: '#ccc', true: theme.accent + '80' }}
                thumbColor={widgetSettings.showRelationshipStats ? theme.accent : '#f4f3f4'}
              />
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{challenges?.length || 0}</Text>
                <Text style={styles.statLabel}>Défis</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{memories?.length || 0}</Text>
                <Text style={styles.statLabel}>Souvenirs</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{loveNotes?.length || 0}</Text>
                <Text style={styles.statLabel}>Love Notes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {challenges?.filter(c => c.completed)?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Défis</Text>
              </View>
            </View>
          </View>
        )}

        {/* Paramètres de notifications */}
        <View style={styles.widget}>
          <Text style={styles.widgetTitle}>🔔 Rappels quotidiens</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Rappel du matin</Text>
              <Text style={styles.settingHint}>Envoyer un message d'amour à 8h</Text>
            </View>
            <Switch
              value={widgetSettings.notifyMorning}
              onValueChange={() => toggleSetting('notifyMorning')}
              trackColor={{ false: '#ccc', true: theme.accent + '80' }}
              thumbColor={widgetSettings.notifyMorning ? theme.accent : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Rappel du soir</Text>
              <Text style={styles.settingHint}>Dire bonne nuit à 22h</Text>
            </View>
            <Switch
              value={widgetSettings.notifyEvening}
              onValueChange={() => toggleSetting('notifyEvening')}
              trackColor={{ false: '#ccc', true: theme.accent + '80' }}
              thumbColor={widgetSettings.notifyEvening ? theme.accent : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Info sur les widgets natifs */}
        <View style={[styles.widget, styles.infoWidget]}>
          <Ionicons name="information-circle-outline" size={24} color={theme.accent} />
          <Text style={styles.infoText}>
            Pour ajouter des widgets sur votre écran d'accueil, maintenez appuyé sur l'écran 
            d'accueil de votre téléphone et sélectionnez "Widgets" puis recherchez "HANI 2".
          </Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
  },
  widget: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  widgetSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  countdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  countdownItem: {
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B9D',
  },
  countdownLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickLoveGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickLoveButton: {
    width: '18%',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FFF0F5',
  },
  quickLoveEmoji: {
    fontSize: 24,
  },
  quickLoveLabel: {
    fontSize: 9,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  challengeCard: {
    backgroundColor: '#FFF0F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  challengeText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  challengeDoneButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  challengeDoneGradient: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  challengeDoneText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  moodButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodButtonSelected: {
    backgroundColor: '#FFE4EC',
    borderWidth: 2,
    borderColor: '#FF6B9D',
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodSet: {
    alignItems: 'center',
    padding: 16,
  },
  moodSetEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  moodSetText: {
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#FFF0F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B9D',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    color: '#333',
  },
  settingHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  infoWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF8E1',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
