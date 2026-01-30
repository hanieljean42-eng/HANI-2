import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  Switch,
  Share,
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const { width } = Dimensions.get('window');

const QUICK_MESSAGES = [
  '❤️ Je t\'aime',
  '🥰 Tu me manques',
  '😘 Bisou',
  '🤗 Câlin virtuel',
  '💭 Je pense à toi',
  '⭐ T\'es génial(e)',
  '🌙 Bonne nuit mon amour',
  '☀️ Bonjour mon cœur',
];

const AVATARS = ['😊', '😍', '🥰', '😘', '🤩', '😎', '🤗', '🦊', '🐰', '🐻', '🦁', '🐼', '🦋', '🌸', '⭐', '💖'];

export default function ProfileScreen() {
  const { user, couple, partner, logout, updateUser } = useAuth();
  const { loveMeter, memories, bucketList, loveNotes, addLoveNote, addBucketItem, toggleBucketItem, updateLoveMeter } = useData();
  const [activeSection, setActiveSection] = useState('profile');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newBucketItem, setNewBucketItem] = useState('');
  const [showCoupleCode, setShowCoupleCode] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSendNote = async () => {
    if (!newNote.trim()) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    await addLoveNote({
      text: newNote,
      from: user?.name,
      read: false,
    });
    
    // Augmenter le love meter
    await updateLoveMeter(loveMeter + 2);
    
    setNewNote('');
    setShowNoteModal(false);
    Alert.alert('💌', 'Love Note envoyée !');
  };

  const handleAddBucketItem = async () => {
    if (!newBucketItem.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    await addBucketItem({
      text: newBucketItem,
    });
    
    setNewBucketItem('');
    setShowBucketModal(false);
    Alert.alert('✨', 'Rêve ajouté à votre liste !');
  };

  const handleQuickMessage = async (message) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    await addLoveNote({
      text: message,
      from: user?.name,
      read: false,
    });
    
    await updateLoveMeter(loveMeter + 1);
    Alert.alert('💕', 'Message envoyé !');
  };

  const handleToggleBucket = async (itemId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleBucketItem(itemId);
    
    // Augmenter le love meter quand on complète un élément
    const item = bucketList.find(b => b.id === itemId);
    if (item && !item.completed) {
      await updateLoveMeter(loveMeter + 5);
      Alert.alert('🎉', 'Félicitations ! Un rêve réalisé !');
    }
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Erreur', 'Le nom ne peut pas être vide');
      return;
    }
    
    await updateUser({ name: editName.trim() });
    setShowEditProfileModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('✅', 'Profil mis à jour !');
  };

  const handleSelectAvatar = async (avatar) => {
    await updateUser({ avatar });
    setShowAvatarModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleShareCode = async () => {
    const code = couple?.code || 'LOVE-XXXXX';
    try {
      await Share.share({
        message: `Rejoins-moi sur Love App ! 💕\n\nUtilise ce code pour nous connecter : ${code}`,
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager le code');
    }
  };

  const handleCopyCode = () => {
    const code = couple?.code || 'LOVE-XXXXX';
    Clipboard.setString(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('📋', 'Code copié !');
  };

  const handleDeleteNote = (noteId) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous supprimer ce message ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // Note: Pour implémenter la suppression, il faudrait ajouter une fonction deleteLoveNote dans DataContext
          }
        }
      ]
    );
  };

  const renderProfile = () => (
    <View style={styles.section}>
      {/* User Card */}
      <View style={styles.userCard}>
        <TouchableOpacity onPress={() => setShowAvatarModal(true)}>
          <Text style={styles.userAvatar}>{user?.avatar || '😊'}</Text>
          <View style={styles.editAvatarBadge}>
            <Text style={styles.editAvatarText}>✏️</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => {
            setEditName(user?.name || '');
            setShowEditProfileModal(true);
          }}
        >
          <Text style={styles.editProfileText}>Modifier le profil</Text>
        </TouchableOpacity>
      </View>

      {/* Partner Card */}
      <View style={styles.partnerCard}>
        <View style={styles.partnerHeader}>
          <Text style={styles.partnerAvatar}>{partner?.avatar || '💕'}</Text>
          <View>
            <Text style={styles.partnerLabel}>Mon/Ma Partenaire</Text>
            <Text style={styles.partnerName}>{partner?.name || couple?.name}</Text>
          </View>
        </View>
      </View>

      {/* Couple Info */}
      <View style={styles.coupleInfo}>
        <TouchableOpacity
          style={styles.codeButton}
          onPress={() => setShowCoupleCode(!showCoupleCode)}
          onLongPress={handleCopyCode}
        >
          <Text style={styles.codeButtonText}>
            {showCoupleCode ? `Code: ${couple?.code || 'LOVE-XXXXX'}` : '🔐 Afficher le code couple'}
          </Text>
        </TouchableOpacity>
        
        {showCoupleCode && (
          <View style={styles.codeActions}>
            <TouchableOpacity style={styles.codeAction} onPress={handleCopyCode}>
              <Text style={styles.codeActionText}>📋 Copier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.codeAction} onPress={handleShareCode}>
              <Text style={styles.codeActionText}>📤 Partager</Text>
            </TouchableOpacity>
          </View>
        )}

        {couple?.anniversary && (
          <View style={styles.anniversaryBadge}>
            <Text style={styles.anniversaryIcon}>📅</Text>
            <Text style={styles.anniversaryText}>Ensemble depuis le {couple.anniversary}</Text>
          </View>
        )}
      </View>

      {/* Love Meter */}
      <View style={styles.loveMeterSection}>
        <Text style={styles.loveMeterTitle}>💕 Love Meter</Text>
        <View style={styles.loveMeterBar}>
          <LinearGradient
            colors={['#FF6B9D', '#C44569']}
            style={[styles.loveMeterFill, { width: `${loveMeter}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
        <Text style={styles.loveMeterValue}>{loveMeter}%</Text>
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>📊 Nos Statistiques</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{memories.length}</Text>
          <Text style={styles.statLabel}>Souvenirs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{loveNotes.length}</Text>
          <Text style={styles.statLabel}>Messages</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{bucketList.filter(b => b.completed).length}/{bucketList.length}</Text>
          <Text style={styles.statLabel}>Bucket List</Text>
        </View>
      </View>
    </View>
  );

  const renderLoveNotes = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💌 Love Notes</Text>
      <Text style={styles.sectionDesc}>Envoyez des petits messages d'amour</Text>

      {/* Quick Messages */}
      <View style={styles.quickMessages}>
        {QUICK_MESSAGES.map((msg, index) => (
          <TouchableOpacity
            key={`quick-msg-${index}`}
            style={styles.quickMessage}
            onPress={() => handleQuickMessage(msg)}
          >
            <Text style={styles.quickMessageText}>{msg}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Note Button */}
      <TouchableOpacity
        style={styles.customNoteButton}
        onPress={() => setShowNoteModal(true)}
      >
        <Text style={styles.customNoteButtonText}>✍️ Écrire un message personnalisé</Text>
      </TouchableOpacity>

      {/* Recent Notes */}
      <Text style={styles.subTitle}>Messages récents</Text>
      {loveNotes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💌</Text>
          <Text style={styles.emptyText}>Aucun message encore...</Text>
        </View>
      ) : (
        loveNotes.slice(0, 5).map((note, index) => (
          <View key={`note-${note.id || index}-${index}`} style={styles.noteCard}>
            <Text style={styles.noteFrom}>{note.from}</Text>
            <Text style={styles.noteText}>{note.text}</Text>
            <Text style={styles.noteDate}>
              {new Date(note.createdAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  const renderBucketList = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🪣 Bucket List</Text>
      <Text style={styles.sectionDesc}>Choses à faire ensemble</Text>

      <TouchableOpacity
        style={styles.addBucketButton}
        onPress={() => setShowBucketModal(true)}
      >
        <Text style={styles.addBucketText}>➕ Ajouter un rêve</Text>
      </TouchableOpacity>

      {bucketList.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>✨</Text>
          <Text style={styles.emptyText}>Ajoutez vos rêves à réaliser ensemble !</Text>
        </View>
      ) : (
        bucketList.map((item, index) => (
          <TouchableOpacity
            key={`bucket-${item.id || index}`}
            style={[styles.bucketItem, item.completed && styles.bucketItemCompleted]}
            onPress={() => handleToggleBucket(item.id)}
          >
            <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
              {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.bucketText, item.completed && styles.bucketTextCompleted]}>
              {item.text}
            </Text>
          </TouchableOpacity>
        ))
      )}

      {/* Sample Items */}
      {bucketList.length === 0 && (
        <View style={styles.sampleItems}>
          <Text style={styles.sampleTitle}>Idées :</Text>
          {['🌅 Voir un lever de soleil ensemble', '✈️ Voyager dans un nouveau pays', '🎢 Parc d\'attractions', '⭐ Dormir à la belle étoile'].map((item, i) => (
            <TouchableOpacity
              key={`sample-${i}`}
              style={styles.sampleItem}
              onPress={() => addBucketItem({ text: item })}
            >
              <Text style={styles.sampleItemText}>{item}</Text>
              <Text style={styles.sampleItemAdd}>+</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚙️ Paramètres</Text>

      <View style={styles.settingsGroup}>
        <View style={styles.settingItem}>
          <Text style={styles.settingIcon}>🔔</Text>
          <Text style={styles.settingText}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#ddd', true: '#C44569' }}
            thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => {
            setEditName(user?.name || '');
            setShowEditProfileModal(true);
          }}
        >
          <Text style={styles.settingIcon}>👤</Text>
          <Text style={styles.settingText}>Modifier mon profil</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => setShowAvatarModal(true)}
        >
          <Text style={styles.settingIcon}>🎨</Text>
          <Text style={styles.settingText}>Changer mon avatar</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={handleShareCode}
        >
          <Text style={styles.settingIcon}>📤</Text>
          <Text style={styles.settingText}>Inviter mon partenaire</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => Alert.alert('💕 Love App', 'Version 1.0.0\n\nUne application pour les couples qui s\'aiment !\n\nMerci d\'utiliser Love App ❤️')}
        >
          <Text style={styles.settingIcon}>❓</Text>
          <Text style={styles.settingText}>À propos</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={() => {
          Alert.alert(
            'Déconnexion',
            'Voulez-vous vraiment vous déconnecter ?',
            [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Déconnexion', style: 'destructive', onPress: logout }
            ]
          );
        }}
      >
        <Text style={styles.logoutButtonText}>🚪 Se déconnecter</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Love App v1.0.0 💕</Text>
    </View>
  );

  return (
    <LinearGradient
      colors={['#8B5CF6', '#C44569', '#FF6B9D']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>💑 Profil</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabs}
        >
          {[
            { key: 'profile', label: '👤 Profil' },
            { key: 'notes', label: '💌 Notes' },
            { key: 'bucket', label: '🪣 Bucket' },
            { key: 'settings', label: '⚙️ Param.' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeSection === tab.key && styles.activeTab]}
              onPress={() => setActiveSection(tab.key)}
            >
              <Text style={[styles.tabText, activeSection === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeSection === 'profile' && renderProfile()}
        {activeSection === 'notes' && renderLoveNotes()}
        {activeSection === 'bucket' && renderBucketList()}
        {activeSection === 'settings' && renderSettings()}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Love Note Modal */}
      <Modal
        visible={showNoteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💌 Love Note</Text>
            <TextInput
              style={styles.modalTextArea}
              placeholder="Écris ton message d'amour..."
              placeholderTextColor="#999"
              multiline
              value={newNote}
              onChangeText={setNewNote}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowNoteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendNote}
              >
                <Text style={styles.sendButtonText}>Envoyer 💕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bucket List Modal */}
      <Modal
        visible={showBucketModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBucketModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✨ Nouveau Rêve</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Quelque chose à faire ensemble..."
              placeholderTextColor="#999"
              value={newBucketItem}
              onChangeText={setNewBucketItem}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowBucketModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleAddBucketItem}
              >
                <Text style={styles.sendButtonText}>Ajouter ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>👤 Modifier le profil</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Votre nom"
              placeholderTextColor="#999"
              value={editName}
              onChangeText={setEditName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditProfileModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.sendButtonText}>Enregistrer ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Avatar Selection Modal */}
      <Modal
        visible={showAvatarModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎨 Choisir un avatar</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.map((avatar, index) => (
                <TouchableOpacity
                  key={`avatar-select-${index}`}
                  style={[
                    styles.avatarOption,
                    user?.avatar === avatar && styles.avatarOptionSelected
                  ]}
                  onPress={() => handleSelectAvatar(avatar)}
                >
                  <Text style={styles.avatarOptionText}>{avatar}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.cancelButtonFull}
              onPress={() => setShowAvatarModal(false)}
            >
              <Text style={styles.cancelButtonText}>Fermer</Text>
            </TouchableOpacity>
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabsScroll: {
    minHeight: 55,
    maxHeight: 55,
    flexGrow: 0,
  },
  tabs: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.25)',
    minWidth: 80,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    fontSize: 13,
  },
  activeTabText: {
    color: '#C44569',
  },
  tabsContainer: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingVertical: 5,
  },
  scrollContent: {
    padding: 20,
  },
  section: {},
  userCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    marginBottom: 15,
  },
  userAvatar: {
    fontSize: 70,
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#999',
  },
  partnerCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerAvatar: {
    fontSize: 50,
    marginRight: 15,
  },
  partnerLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  partnerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  coupleInfo: {
    marginBottom: 25,
  },
  codeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  codeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  anniversaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anniversaryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  anniversaryText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  sectionDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 20,
    marginTop: -10,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 5,
  },
  quickMessages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  quickMessage: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    margin: 5,
  },
  quickMessageText: {
    fontSize: 14,
    color: '#333',
  },
  customNoteButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
  },
  customNoteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  noteCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  noteFrom: {
    fontSize: 12,
    color: '#C44569',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  noteText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  noteDate: {
    fontSize: 11,
    color: '#999',
  },
  addBucketButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  addBucketText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C44569',
  },
  bucketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  bucketItemCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bucketText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  bucketTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  sampleItems: {
    marginTop: 20,
  },
  sampleTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  sampleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 8,
  },
  sampleItemText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  sampleItemAdd: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingsGroup: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 25,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    fontSize: 22,
    marginRight: 15,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  settingArrow: {
    fontSize: 22,
    color: '#ccc',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 20,
    fontSize: 12,
  },
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
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    padding: 18,
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  modalTextArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    padding: 18,
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
    height: 120,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#999',
  },
  sendButton: {
    flex: 1,
    backgroundColor: '#C44569',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  editAvatarBadge: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    backgroundColor: '#fff',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  editAvatarText: {
    fontSize: 14,
  },
  editProfileButton: {
    marginTop: 15,
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  editProfileText: {
    color: '#C44569',
    fontWeight: '600',
  },
  codeActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 15,
  },
  codeAction: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  codeActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  loveMeterSection: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
  },
  loveMeterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  loveMeterBar: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  loveMeterFill: {
    height: '100%',
    borderRadius: 6,
  },
  loveMeterValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: '#C44569',
    backgroundColor: '#FFE4EC',
  },
  avatarOptionText: {
    fontSize: 35,
  },
  cancelButtonFull: {
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
});
