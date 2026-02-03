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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, THEMES } from '../context/ThemeContext';
import { useSecurity } from '../context/SecurityContext';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNotifyPartner } from '../hooks/useNotifyPartner';
import AnimatedModal from '../components/AnimatedModal';

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

export default function ProfileScreen({ navigation }) {
  const { theme, changeTheme, themes } = useTheme();
  const { 
    isSecretModeEnabled, 
    setupPin, 
    removePin, 
    useBiometrics, 
    biometricsAvailable,
    toggleBiometrics,
    isUnlocked,
    lockSecretMode,
  } = useSecurity();
  const { user, couple, partner, logout, updateUser, updateCouple, updatePartnerName, updateCoupleName, deleteAccount } = useAuth();
  const { loveMeter, memories, bucketList, loveNotes, addLoveNote, addBucketItem, toggleBucketItem, deleteBucketItem, updateBucketItem, updateLoveMeter } = useData();
  const { 
    notifyLoveNote, 
    notifyBucket, 
    notifyNewBucketItem,
    notifyProfileUpdate, 
    notifyCoupleNameChanged, 
    notifyAnniversarySet,
    notifyPhotoChanged 
  } = useNotifyPartner();
  const [activeSection, setActiveSection] = useState('profile');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [showEditBucketModal, setShowEditBucketModal] = useState(false);
  const [editBucketItem, setEditBucketItem] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showEditAnniversaryModal, setShowEditAnniversaryModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showCouplePhotoModal, setShowCouplePhotoModal] = useState(false);
  const [showEditPartnerModal, setShowEditPartnerModal] = useState(false);
  const [showEditCoupleNameModal, setShowEditCoupleNameModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newBucketItem, setNewBucketItem] = useState('');
  const [showCoupleCode, setShowCoupleCode] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPartnerName, setEditPartnerName] = useState(partner?.name || '');
  const [editCoupleName, setEditCoupleName] = useState(couple?.name || '');
  const [editAnniversary, setEditAnniversary] = useState(couple?.anniversary || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAboutModal, setShowAboutModal] = useState(false);
  
  // États pour les paramètres avancés (thème, sécurité)
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState(1);

  // Handlers pour thème et PIN
  const handleThemeChange = (themeId) => {
    changeTheme(themeId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowThemeModal(false);
  };

  const handleSetupPin = async () => {
    if (pinStep === 1) {
      if (pinInput.length < 4) {
        Alert.alert('Erreur', 'Le code doit contenir au moins 4 chiffres');
        return;
      }
      setPinStep(2);
      return;
    }

    if (confirmPin !== pinInput) {
      Alert.alert('Erreur', 'Les codes ne correspondent pas');
      setPinInput('');
      setConfirmPin('');
      setPinStep(1);
      return;
    }

    const result = await setupPin(pinInput);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅', 'Code PIN configuré !');
      setShowPinModal(false);
      setPinInput('');
      setConfirmPin('');
      setPinStep(1);
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  const handleRemovePin = () => {
    Alert.alert(
      'Supprimer le code PIN',
      'Êtes-vous sûr ? L\'espace secret sera désactivé.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await removePin();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      ]
    );
  };

  // Suppression du compte utilisateur
  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteAccount();
            if (res.success) {
              Alert.alert('Compte supprimé', 'Votre compte a bien été supprimé.');
            } else {
              Alert.alert('Erreur', res.error || 'Impossible de supprimer le compte.');
            }
          }
        }
      ]
    );
  };

  // Fonction pour choisir une photo de profil
  const pickProfilePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await updateUser({ profilePhoto: result.assets[0].uri });
        setShowPhotoModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Notifier le partenaire
        await notifyPhotoChanged('profil');
        Alert.alert('✅', 'Photo de profil mise à jour !');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accéder à la galerie');
    }
  };

  // Fonction pour prendre une photo de profil
  const takeProfilePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission requise', 'L\'accès à la caméra est nécessaire');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await updateUser({ profilePhoto: result.assets[0].uri });
        setShowPhotoModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Notifier le partenaire
        await notifyPhotoChanged('profil');
        Alert.alert('✅', 'Photo de profil mise à jour !');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accéder à la caméra');
    }
  };

  // Fonction pour choisir une photo du couple
  const pickCouplePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await updateCouple({ couplePhoto: result.assets[0].uri });
        setShowCouplePhotoModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Notifier le partenaire
        await notifyPhotoChanged('couple');
        Alert.alert('✅', 'Photo de couple mise à jour !');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accéder à la galerie');
    }
  };

  const handleSendNote = async () => {
    if (!newNote.trim()) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    await addLoveNote({
      text: newNote,
      from: user?.name,
      read: false,
    });
    
    // Envoyer notification au partenaire
    await notifyLoveNote(newNote);
    
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
    
    // Notifier le partenaire
    await notifyNewBucketItem(newBucketItem);
    
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
    
    // Envoyer notification au partenaire
    await notifyLoveNote(message);
    
    await updateLoveMeter(loveMeter + 1);
    Alert.alert('💕', 'Message envoyé !');
  };

  const handleToggleBucket = async (itemId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Récupérer l'item avant de le toggle
    const item = bucketList.find(b => b.id === itemId);
    
    await toggleBucketItem(itemId);
    
    // Augmenter le love meter quand on complète un élément
    if (item && !item.completed) {
      await updateLoveMeter(loveMeter + 5);
      // Envoyer notification au partenaire
      await notifyBucket(item.text);
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
    // Notifier le partenaire
    await notifyProfileUpdate();
    Alert.alert('✅', 'Profil mis à jour !');
  };

  const handleUpdateAnniversary = async () => {
    // Valider le format de la date (JJ/MM/AAAA)
    const dateRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/;
    const match = editAnniversary.trim().match(dateRegex);
    
    if (!match) {
      Alert.alert('Erreur', 'Format de date invalide.\nUtilisez le format JJ/MM/AAAA\n\nExemple: 14/02/2024');
      return;
    }
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
      Alert.alert('Erreur', 'Date invalide. Vérifiez le jour, le mois et l\'année.');
      return;
    }
    
    // Formater la date correctement
    const formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    
    await updateCouple({ anniversary: formattedDate });
    setShowEditAnniversaryModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Notifier le partenaire
    await notifyAnniversarySet(formattedDate);
    Alert.alert('✅', 'Date d\'anniversaire mise à jour !\n\nLe compteur de jours est maintenant actif 💕');
  };

  const handleSelectAvatar = async (avatar) => {
    await updateUser({ avatar });
    setShowAvatarModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Modifier le nom du partenaire
  const handleUpdatePartnerName = async () => {
    if (!editPartnerName.trim()) {
      Alert.alert('Erreur', 'Le nom ne peut pas être vide');
      return;
    }
    
    const result = await updatePartnerName(editPartnerName.trim());
    if (result.success) {
      setShowEditPartnerModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅', 'Nom du partenaire mis à jour !\n\nLe changement sera visible sur les deux appareils 💕');
    } else {
      Alert.alert('Erreur', result.error || 'Impossible de modifier le nom');
    }
  };

  // Modifier le nom du couple
  const handleUpdateCoupleName = async () => {
    if (!editCoupleName.trim()) {
      Alert.alert('Erreur', 'Le nom du couple ne peut pas être vide');
      return;
    }
    
    const result = await updateCoupleName(editCoupleName.trim());
    if (result.success) {
      setShowEditCoupleNameModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Notifier le partenaire
      await notifyCoupleNameChanged(editCoupleName.trim());
      Alert.alert('✅', 'Nom du couple mis à jour !\n\nLe changement sera visible sur les deux appareils 💕');
    } else {
      Alert.alert('Erreur', result.error || 'Impossible de modifier le nom');
    }
  };

  const handleShareCode = async () => {
    const code = couple?.code || 'LOVE-XXXXX';
    try {
      await Share.share({
        message: `Rejoins-moi sur HANI 2 ! 💕\n\nUtilise ce code pour nous connecter : ${code}`,
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
      {/* Photo du couple en haut */}
      <TouchableOpacity 
        style={styles.couplePhotoContainer}
        onPress={() => setShowCouplePhotoModal(true)}
      >
        {couple?.couplePhoto ? (
          <Image source={{ uri: couple.couplePhoto }} style={styles.couplePhoto} />
        ) : (
          <LinearGradient colors={['#FF6B9D', '#C44569']} style={styles.couplePhotoPlaceholder}>
            <Text style={styles.couplePhotoPlaceholderText}>💑</Text>
            <Text style={styles.couplePhotoAddText}>Ajouter une photo de couple</Text>
          </LinearGradient>
        )}
        <View style={styles.editCouplePhotoBadge}>
          <Text style={styles.editPhotoBadgeText}>📷</Text>
        </View>
      </TouchableOpacity>

      {/* User Card */}
      <View style={styles.userCard}>
        <TouchableOpacity onPress={() => setShowPhotoModal(true)}>
          {user?.profilePhoto ? (
            <Image source={{ uri: user.profilePhoto }} style={styles.userPhoto} />
          ) : (
            <Text style={styles.userAvatar}>{user?.avatar || '😊'}</Text>
          )}
          <View style={styles.editAvatarBadge}>
            <Text style={styles.editAvatarText}>📷</Text>
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

      {/* Partner Card - seulement si partenaire a rejoint */}
      {partner?.name ? (
        <View style={styles.partnerCard}>
          <View style={styles.partnerHeader}>
            <Text style={styles.partnerAvatar}>{partner?.avatar || '💕'}</Text>
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerNameOnly}>{partner.name}</Text>
              <Text style={styles.partnerLabel}>Votre partenaire</Text>
            </View>
            <TouchableOpacity
              style={styles.editPartnerBtn}
              onPress={() => {
                setEditPartnerName(partner?.name || '');
                setShowEditPartnerModal(true);
              }}
            >
              <Text style={styles.editPartnerBtnText}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.waitingPartnerCard}>
          <Text style={styles.waitingEmoji}>⏳</Text>
          <Text style={styles.waitingTitle}>En attente de votre partenaire</Text>
          <Text style={styles.waitingDesc}>Partagez votre code couple pour qu'il/elle vous rejoigne</Text>
        </View>
      )}

      {/* Couple Name Card */}
      <View style={styles.coupleNameCard}>
        <View style={styles.coupleNameHeader}>
          <Text style={styles.coupleNameIcon}>💑</Text>
          <View style={styles.coupleNameInfo}>
            <Text style={styles.coupleNameText}>{couple?.name || 'Notre Couple'}</Text>
            <Text style={styles.coupleNameLabel}>Nom du couple</Text>
          </View>
          <TouchableOpacity
            style={styles.editCoupleNameBtn}
            onPress={() => {
              setEditCoupleName(couple?.name || '');
              setShowEditCoupleNameModal(true);
            }}
          >
            <Text style={styles.editCoupleNameBtnText}>✏️</Text>
          </TouchableOpacity>
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

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>🚀 Actions rapides</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('Chat')}
        >
          <Text style={styles.quickActionIcon}>💬</Text>
          <Text style={styles.quickActionLabel}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('Stats')}
        >
          <Text style={styles.quickActionIcon}>📈</Text>
          <Text style={styles.quickActionLabel}>Statistiques</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('Retrospective')}
        >
          <Text style={styles.quickActionIcon}>✨</Text>
          <Text style={styles.quickActionLabel}>Rétrospective</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => setActiveSection('settings')}
        >
          <Text style={styles.quickActionIcon}>⚙️</Text>
          <Text style={styles.quickActionLabel}>Paramètres</Text>
        </TouchableOpacity>
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
        (loveNotes || []).slice(0, 5).map((note, index) => (
          <View key={`note-${note?.id || index}-${index}`} style={styles.noteCard}>
            <Text style={styles.noteFrom}>{note?.from || 'Anonyme'}</Text>
            <Text style={styles.noteText}>{note?.text || ''}</Text>
            <Text style={styles.noteDate}>
              {note?.createdAt ? new Date(note.createdAt).toLocaleDateString('fr-FR') : ''}
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

      {(!bucketList || bucketList.length === 0) ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>✨</Text>
          <Text style={styles.emptyText}>Ajoutez vos rêves à réaliser ensemble !</Text>
        </View>
      ) : (
        (bucketList || []).map((item, index) => (
          <View key={`bucket-${item?.id || index}`} style={styles.bucketItemWrapper}>
            <TouchableOpacity
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
            <View style={styles.bucketActionsRow}>
              <TouchableOpacity
                style={styles.bucketEditBtn}
                onPress={() => {
                  setEditBucketItem({ id: item.id, text: item.text });
                  setShowEditBucketModal(true);
                }}
              >
                <Text style={styles.bucketActionText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bucketDeleteBtn}
                onPress={() => {
                  Alert.alert(
                    '🗑️ Supprimer',
                    'Supprimer ce rêve de la liste ?',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      {
                        text: 'Supprimer',
                        style: 'destructive',
                        onPress: async () => {
                          await deleteBucketItem(item.id);
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.bucketActionText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
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
      {/* Section Personnalisation */}
      <Text style={styles.sectionTitle}>🎨 Personnalisation</Text>
      
      <View style={styles.settingsGroup}>
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => setShowThemeModal(true)}
        >
          <Text style={styles.settingIcon}>🎨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingText}>Thème de l'app</Text>
            <Text style={styles.settingSubtext}>{theme.name}</Text>
          </View>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Section Sécurité */}
      <Text style={styles.sectionTitle}>🔒 Sécurité & Confidentialité</Text>
      
      <View style={styles.settingsGroup}>
        <View style={styles.settingItem}>
          <Text style={styles.settingIcon}>🔐</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingText}>Espace secret</Text>
            <Text style={styles.settingSubtext}>
              {isSecretModeEnabled ? 'Activé' : 'Désactivé'}
            </Text>
          </View>
          {isSecretModeEnabled ? (
            <TouchableOpacity
              style={styles.dangerBadge}
              onPress={handleRemovePin}
            >
              <Text style={styles.dangerBadgeText}>Supprimer</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryBadge}
              onPress={() => setShowPinModal(true)}
            >
              <Text style={styles.primaryBadgeText}>Configurer</Text>
            </TouchableOpacity>
          )}
        </View>

        {isSecretModeEnabled && biometricsAvailable && (
          <View style={styles.settingItem}>
            <Text style={styles.settingIcon}>👆</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingText}>Biométrie</Text>
              <Text style={styles.settingSubtext}>Face ID / Empreinte</Text>
            </View>
            <Switch
              value={useBiometrics}
              onValueChange={toggleBiometrics}
              trackColor={{ false: '#ddd', true: theme.accent }}
              thumbColor="#fff"
            />
          </View>
        )}

        {isSecretModeEnabled && isUnlocked && (
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={lockSecretMode}
          >
            <Text style={styles.settingIcon}>🔒</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingText}>Verrouiller maintenant</Text>
              <Text style={styles.settingSubtext}>Fermer l'espace secret</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Section Profil & Couple */}
      <Text style={styles.sectionTitle}>👤 Profil & Couple</Text>
      
      <View style={styles.settingsGroup}>
        <View style={styles.settingItem}>
          <Text style={styles.settingIcon}>🔔</Text>
          <Text style={styles.settingText}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#ddd', true: theme.accent }}
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
          <Text style={styles.settingIcon}>😊</Text>
          <Text style={styles.settingText}>Changer mon avatar</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => {
            setEditAnniversary(couple?.anniversary || '');
            setShowEditAnniversaryModal(true);
          }}
        >
          <Text style={styles.settingIcon}>📅</Text>
          <Text style={styles.settingText}>Date d'anniversaire du couple</Text>
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
      </View>

      {/* Section Données */}
      <Text style={styles.sectionTitle}>📊 Données</Text>
      
      <View style={styles.settingsGroup}>
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('Stats')}
        >
          <Text style={styles.settingIcon}>📈</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingText}>Statistiques</Text>
            <Text style={styles.settingSubtext}>Voir vos stats de couple</Text>
          </View>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('Retrospective')}
        >
          <Text style={styles.settingIcon}>📅</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingText}>Rétrospective</Text>
            <Text style={styles.settingSubtext}>Revivez votre année</Text>
          </View>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Section Compte */}
      <Text style={styles.sectionTitle}>👤 Compte</Text>
      
      <View style={styles.settingsGroup}>
        <View style={styles.settingItem}>
          <Text style={styles.settingIcon}>👤</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingText}>{user?.name || 'Utilisateur'}</Text>
            <Text style={styles.settingSubtext}>{user?.email || ''}</Text>
          </View>
        </View>

        {couple?.id && (
          <View style={styles.settingItem}>
            <Text style={styles.settingIcon}>💑</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingText}>Code couple</Text>
              <Text style={styles.settingSubtext}>{couple.code}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Section Infos */}
      <Text style={styles.sectionTitle}>ℹ️ Informations</Text>
      
      <View style={styles.settingsGroup}>
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => setShowAboutModal(true)}
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

      <TouchableOpacity 
        style={styles.deleteAccountButton} 
        onPress={handleDeleteAccount}
      >
        <Text style={styles.deleteAccountButtonText}>🗑️ Supprimer mon compte</Text>
      </TouchableOpacity>

      <Text style={styles.version}>HANI 2 v5.0.0 - by Haniel Henoc 💕</Text>
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

      {/* Edit Anniversary Modal */}
      <Modal
        visible={showEditAnniversaryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditAnniversaryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📅 Date d'anniversaire</Text>
            <Text style={styles.modalSubtitle}>
              Entrez la date où vous vous êtes mis en couple
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="JJ/MM/AAAA (ex: 14/02/2024)"
              placeholderTextColor="#999"
              value={editAnniversary}
              onChangeText={setEditAnniversary}
              keyboardType="numbers-and-punctuation"
            />
            <Text style={styles.modalHint}>
              💡 Cette date sera utilisée pour calculer le nombre de jours d'amour affiché sur l'écran d'accueil
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditAnniversaryModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleUpdateAnniversary}
              >
                <Text style={styles.confirmButtonText}>Enregistrer 💕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo de profil Modal */}
      <Modal
        visible={showPhotoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📷 Photo de profil</Text>
            <Text style={styles.modalSubtitle}>
              Choisissez votre photo de profil
            </Text>
            
            {/* Aperçu actuel */}
            <View style={styles.photoPreviewContainer}>
              {user?.profilePhoto ? (
                <Image source={{ uri: user.profilePhoto }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPreviewPlaceholder}>
                  <Text style={styles.photoPreviewEmoji}>{user?.avatar || '😊'}</Text>
                </View>
              )}
            </View>

            <View style={styles.photoOptionsRow}>
              <TouchableOpacity style={styles.photoOptionButton} onPress={pickProfilePhoto}>
                <Text style={styles.photoOptionIcon}>🖼️</Text>
                <Text style={styles.photoOptionText}>Galerie</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoOptionButton} onPress={takeProfilePhoto}>
                <Text style={styles.photoOptionIcon}>📸</Text>
                <Text style={styles.photoOptionText}>Caméra</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.photoOptionButton} 
                onPress={() => {
                  setShowPhotoModal(false);
                  setShowAvatarModal(true);
                }}
              >
                <Text style={styles.photoOptionIcon}>😊</Text>
                <Text style={styles.photoOptionText}>Emoji</Text>
              </TouchableOpacity>
            </View>

            {user?.profilePhoto && (
              <TouchableOpacity 
                style={styles.removePhotoButton}
                onPress={async () => {
                  await updateUser({ profilePhoto: null });
                  setShowPhotoModal(false);
                  Alert.alert('✅', 'Photo supprimée');
                }}
              >
                <Text style={styles.removePhotoText}>🗑️ Supprimer la photo</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelButtonFull}
              onPress={() => setShowPhotoModal(false)}
            >
              <Text style={styles.cancelButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Photo du couple Modal */}
      <Modal
        visible={showCouplePhotoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCouplePhotoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💑 Photo de couple</Text>
            <Text style={styles.modalSubtitle}>
              Ajoutez une photo de vous deux !
            </Text>
            
            {/* Aperçu actuel */}
            <View style={styles.couplePhotoPreviewContainer}>
              {couple?.couplePhoto ? (
                <Image source={{ uri: couple.couplePhoto }} style={styles.couplePhotoPreview} />
              ) : (
                <View style={styles.couplePhotoPreviewPlaceholder}>
                  <Text style={styles.couplePhotoPreviewEmoji}>💑</Text>
                  <Text style={styles.couplePhotoPreviewText}>Aucune photo</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.pickCouplePhotoButton} onPress={pickCouplePhoto}>
              <Text style={styles.pickCouplePhotoIcon}>🖼️</Text>
              <Text style={styles.pickCouplePhotoText}>Choisir depuis la galerie</Text>
            </TouchableOpacity>

            {couple?.couplePhoto && (
              <TouchableOpacity 
                style={styles.removePhotoButton}
                onPress={async () => {
                  await updateCouple({ couplePhoto: null });
                  setShowCouplePhotoModal(false);
                  Alert.alert('✅', 'Photo supprimée');
                }}
              >
                <Text style={styles.removePhotoText}>🗑️ Supprimer la photo</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelButtonFull}
              onPress={() => setShowCouplePhotoModal(false)}
            >
              <Text style={styles.cancelButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Partner Name Modal */}
      <Modal
        visible={showEditPartnerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditPartnerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💕 Modifier le nom du partenaire</Text>
            <Text style={styles.modalSubtitle}>
              Ce changement sera synchronisé sur les deux appareils
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nom de votre partenaire"
              placeholderTextColor="#999"
              value={editPartnerName}
              onChangeText={setEditPartnerName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditPartnerModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleUpdatePartnerName}
              >
                <Text style={styles.sendButtonText}>Enregistrer ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Couple Name Modal */}
      <Modal
        visible={showEditCoupleNameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditCoupleNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💑 Modifier le nom du couple</Text>
            <Text style={styles.modalSubtitle}>
              Donnez un nom unique à votre couple !{'\n'}Exemple: "Les Amoureux", "John & Jane"
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nom de votre couple"
              placeholderTextColor="#999"
              value={editCoupleName}
              onChangeText={setEditCoupleName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditCoupleNameModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleUpdateCoupleName}
              >
                <Text style={styles.sendButtonText}>Enregistrer ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Bucket Item Modal */}
      <Modal
        visible={showEditBucketModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditBucketModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ Modifier le rêve</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Votre rêve à réaliser"
              placeholderTextColor="#999"
              value={editBucketItem?.text || ''}
              onChangeText={(text) => setEditBucketItem({ ...editBucketItem, text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowEditBucketModal(false);
                  setEditBucketItem(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={async () => {
                  if (editBucketItem?.text?.trim()) {
                    await updateBucketItem(editBucketItem.id, { text: editBucketItem.text });
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setShowEditBucketModal(false);
                    setEditBucketItem(null);
                    Alert.alert('✅', 'Rêve modifié !');
                  }
                }}
              >
                <Text style={styles.sendButtonText}>Enregistrer ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Theme Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎨 Choisir un thème</Text>
            
            <ScrollView style={styles.themeList}>
              {Object.values(themes).map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.themeOption,
                    theme.id === t.id && styles.themeOptionActive
                  ]}
                  onPress={() => handleThemeChange(t.id)}
                >
                  <LinearGradient
                    colors={t.primary}
                    style={styles.themePreview}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <Text style={styles.themeName}>{t.name}</Text>
                  {theme.id === t.id && <Text style={styles.themeCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeThemeButton}
              onPress={() => setShowThemeModal(false)}
            >
              <Text style={styles.closeThemeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PIN Setup Modal */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowPinModal(false);
          setPinInput('');
          setConfirmPin('');
          setPinStep(1);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔐 Code PIN</Text>
            <Text style={styles.modalSubtitle}>
              {pinStep === 1 
                ? 'Entrez votre nouveau code PIN' 
                : 'Confirmez votre code PIN'}
            </Text>
            
            <TextInput
              style={styles.pinInput}
              value={pinStep === 1 ? pinInput : confirmPin}
              onChangeText={pinStep === 1 ? setPinInput : setConfirmPin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              placeholder="••••"
              placeholderTextColor="#999"
            />

            <View style={styles.pinDots}>
              {[...Array(4)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.pinDot,
                    (pinStep === 1 ? pinInput : confirmPin).length > i && styles.pinDotFilled
                  ]}
                />
              ))}
            </View>

            <View style={styles.pinModalButtons}>
              <TouchableOpacity
                style={styles.pinCancelButton}
                onPress={() => {
                  setShowPinModal(false);
                  setPinInput('');
                  setConfirmPin('');
                  setPinStep(1);
                }}
              >
                <Text style={styles.pinCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pinConfirmButton}
                onPress={handleSetupPin}
              >
                <LinearGradient
                  colors={theme.primary}
                  style={styles.pinConfirmButtonGradient}
                >
                  <Text style={styles.pinConfirmButtonText}>
                    {pinStep === 1 ? 'Suivant' : 'Confirmer'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* About Modal - Animée */}
      <AnimatedModal
        visible={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        title="HANI 2"
        emoji="💕"
        type="spring"
        size="large"
        closeButtonText="Merci ! ❤️"
        gradientColors={['#8B5CF6', '#C44569']}
      >
        <View style={styles.aboutContent}>
          <View style={styles.aboutVersionBadge}>
            <Text style={styles.aboutVersionText}>Version 5.0.0</Text>
          </View>
          
          <View style={styles.aboutSection}>
            <Text style={styles.aboutSectionTitle}>👨‍💻 Créateur</Text>
            <Text style={styles.aboutSectionText}>Haniel Henoc</Text>
          </View>
          
          <View style={styles.aboutSection}>
            <Text style={styles.aboutSectionTitle}>💡 Notre Mission</Text>
            <Text style={styles.aboutSectionText}>
              HANI 2 a été créé avec une mission simple : aider les couples à mieux se divertir, 
              renforcer leurs liens et créer des souvenirs inoubliables ensemble.
            </Text>
          </View>
          
          <View style={styles.aboutSection}>
            <Text style={styles.aboutSectionTitle}>✨ Notre Vision</Text>
            <Text style={styles.aboutSectionText}>
              Cette application est née de l'envie de proposer aux amoureux un espace privé et ludique 
              pour partager des moments uniques, relever des défis amusants et cultiver leur complicité au quotidien.
            </Text>
          </View>
          
          <View style={styles.aboutSection}>
            <Text style={styles.aboutSectionTitle}>📧 Contact</Text>
            <Text style={styles.aboutContactEmail}>djeble.haniel@gmail.com</Text>
          </View>
          
          <View style={styles.aboutFooter}>
            <Text style={styles.aboutFooterText}>Merci d'utiliser HANI 2 ! 💖</Text>
            <Text style={styles.aboutFooterHeart}>❤️ 🧡 💛 💚 💙 💜</Text>
          </View>
        </View>
      </AnimatedModal>
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
    color: '#666',
  },
  partnerCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
  },
  waitingPartnerCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
  },
  waitingEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  waitingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  waitingDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerAvatar: {
    fontSize: 50,
    marginRight: 15,
  },
  partnerInfo: {
    flex: 1,
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
  partnerNameOnly: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  editPartnerBtn: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 15,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPartnerBtnText: {
    fontSize: 18,
  },
  coupleNameCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
  },
  coupleNameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coupleNameIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  coupleNameInfo: {
    flex: 1,
  },
  coupleNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  coupleNameLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  editCoupleNameBtn: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 15,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editCoupleNameBtnText: {
    fontSize: 18,
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
  deleteAccountButton: {
    backgroundColor: '#EF4444',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 15,
  },
  deleteAccountButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: -10,
  },
  modalHint: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
    lineHeight: 18,
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
  // Styles pour photo de couple
  couplePhotoContainer: {
    width: '100%',
    height: 150,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  couplePhoto: {
    width: '100%',
    height: '100%',
  },
  couplePhotoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  couplePhotoPlaceholderText: {
    fontSize: 50,
  },
  couplePhotoAddText: {
    color: '#fff',
    marginTop: 5,
    fontSize: 12,
  },
  editCouplePhotoBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  editPhotoBadgeText: {
    fontSize: 20,
  },
  // Styles pour photo de profil
  userPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
  },
  photoPreviewContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#C44569',
  },
  photoPreviewPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#C44569',
  },
  photoPreviewEmoji: {
    fontSize: 60,
  },
  photoOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  photoOptionButton: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    minWidth: 80,
  },
  photoOptionIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  photoOptionText: {
    fontSize: 12,
    color: '#666',
  },
  removePhotoButton: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 10,
  },
  removePhotoText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  // Photo de couple modal
  couplePhotoPreviewContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  couplePhotoPreview: {
    width: '100%',
    height: 150,
    borderRadius: 15,
  },
  couplePhotoPreviewPlaceholder: {
    width: '100%',
    height: 150,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  couplePhotoPreviewEmoji: {
    fontSize: 50,
  },
  couplePhotoPreviewText: {
    color: '#999',
    marginTop: 5,
  },
  pickCouplePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C44569',
    padding: 15,
    borderRadius: 25,
    marginVertical: 10,
  },
  pickCouplePhotoIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  pickCouplePhotoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  quickActionCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#C44569',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 10,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  // Styles pour les boutons d'action sur la bucket list
  bucketItemWrapper: {
    marginBottom: 10,
  },
  bucketActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 5,
  },
  bucketEditBtn: {
    backgroundColor: '#3B82F6',
    padding: 6,
    borderRadius: 12,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bucketDeleteBtn: {
    backgroundColor: '#EF4444',
    padding: 6,
    borderRadius: 12,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bucketActionText: {
    fontSize: 14,
  },
  // Styles pour la modale À propos
  aboutContent: {
    alignItems: 'center',
  },
  aboutVersionBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  aboutVersionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  aboutSection: {
    width: '100%',
    marginBottom: 18,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
  },
  aboutSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#C44569',
    marginBottom: 8,
  },
  aboutSectionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  aboutContactEmail: {
    fontSize: 15,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  aboutFooter: {
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    width: '100%',
  },
  aboutFooterText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 10,
  },
  aboutFooterHeart: {
    fontSize: 20,
    letterSpacing: 4,
  },
  // Nouveaux styles pour thème et PIN
  settingSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  dangerBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  dangerBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  primaryBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  primaryBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  themeList: {
    maxHeight: 400,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  themeOptionActive: {
    backgroundColor: '#e0e7ff',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  themePreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  themeName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  themeCheck: {
    fontSize: 20,
    color: '#8B5CF6',
    fontWeight: 'bold',
  },
  closeThemeButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 15,
  },
  closeThemeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  pinInput: {
    fontSize: 32,
    textAlign: 'center',
    letterSpacing: 10,
    padding: 20,
    marginBottom: 20,
    color: '#333',
  },
  pinDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 15,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ddd',
  },
  pinDotFilled: {
    backgroundColor: '#8B5CF6',
  },
  pinModalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  pinCancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  pinCancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  pinConfirmButton: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  pinConfirmButtonGradient: {
    padding: 15,
    alignItems: 'center',
  },
  pinConfirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
