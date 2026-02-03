import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Video, ResizeMode } from 'expo-av';
import { useData } from '../context/DataContext';
import { useNotifyPartner } from '../hooks/useNotifyPartner';
import { useAuth } from '../context/AuthContext';
import AnimatedModal from '../components/AnimatedModal';

const { width, height } = Dimensions.get('window');

export default function MemoriesScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { 
    memories, addMemory, timeCapsules, addTimeCapsule, deleteMemory, deleteTimeCapsule, updateMemory,
    scheduledLetters, addScheduledLetter, markLetterAsRead, deleteScheduledLetter, updateScheduledLetter, getDeliverableLetters,
    sharedDiary, addDiaryEntry, deleteDiaryEntry, updateDiaryEntry
  } = useData();
  const { notifyMemory, notifyCapsule, notifyScheduledLetter, notifyDiaryEntry, notifyLetterDelivered } = useNotifyPartner();
  const [activeTab, setActiveTab] = useState('gallery');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editType, setEditType] = useState('memory'); // 'memory', 'letter', 'diary'
  const [addType, setAddType] = useState('memory');
  const [newMemory, setNewMemory] = useState({ title: '', note: '', date: '', imageUri: null, mediaType: 'image' });
  const [isUploading, setIsUploading] = useState(false);
  
  // États pour lettres et journal
  const [newLetter, setNewLetter] = useState({ title: '', content: '', deliveryDate: '' });
  const [newDiaryEntry, setNewDiaryEntry] = useState({ mood: '😊', content: '' });
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [showLetterModal, setShowLetterModal] = useState(false);

  // Convertir une image/vidéo en base64 pour la synchronisation
  const convertToBase64 = async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.log('Erreur conversion base64:', error);
      return null;
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,  // Désactivé pour garder la qualité originale
        quality: 1,  // Qualité maximale
      });

      if (!result.canceled && result.assets[0]) {
        setNewMemory({ ...newMemory, imageUri: result.assets[0].uri, mediaType: 'image' });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accéder à la galerie');
    }
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 60, // 60 secondes max
      });

      if (!result.canceled && result.assets[0]) {
        // Vérifier la taille du fichier
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
        const fileSizeMB = fileInfo.size / (1024 * 1024);
        
        if (fileSizeMB > 50) {
          Alert.alert('Fichier trop volumineux', 'La vidéo ne doit pas dépasser 50 MB');
          return;
        }
        
        setNewMemory({ ...newMemory, imageUri: result.assets[0].uri, mediaType: 'video' });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accéder aux vidéos');
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission requise', 'L\'accès à la caméra est nécessaire');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setNewMemory({ ...newMemory, imageUri: result.assets[0].uri, mediaType: 'image' });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accéder à la caméra');
    }
  };

  const handleAddMemory = async () => {
    if (!newMemory.title.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre');
      return;
    }

    setIsUploading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    let mediaBase64 = null;
    if (newMemory.imageUri) {
      // Convertir en base64 pour la synchronisation
      mediaBase64 = await convertToBase64(newMemory.imageUri);
    }
    
    const memory = {
      type: newMemory.imageUri ? (newMemory.mediaType === 'video' ? 'video' : 'photo') : 'note',
      title: newMemory.title,
      note: newMemory.note,
      date: new Date().toLocaleDateString('fr-FR'),
      emoji: newMemory.imageUri ? (newMemory.mediaType === 'video' ? '🎬' : '📸') : '💌',
      color: ['#FF6B9D', '#8B5CF6', '#10B981', '#F59E0B'][Math.floor(Math.random() * 4)],
      imageUri: newMemory.imageUri,
      mediaType: newMemory.mediaType || 'image',
      // Stocker le base64 pour la synchronisation entre partenaires
      mediaBase64: mediaBase64,
    };

    await addMemory(memory);
    
    // Envoyer notification au partenaire
    await notifyMemory();
    
    setNewMemory({ title: '', note: '', date: '', imageUri: null, mediaType: 'image' });
    setShowAddModal(false);
    setIsUploading(false);
    Alert.alert('💖', 'Souvenir ajouté et synchronisé !');
  };

  const handleAddCapsule = async () => {
    if (!newMemory.title.trim() || !newMemory.date.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le titre et la date d\'ouverture');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    await addTimeCapsule({
      title: newMemory.title,
      note: newMemory.note,
      openDate: newMemory.date,
      locked: true,
    });

    // Envoyer notification au partenaire
    await notifyCapsule();

    setNewMemory({ title: '', note: '', date: '', imageUri: null });
    setShowAddModal(false);
    Alert.alert('⏰', 'Capsule temporelle créée !');
  };

  const openMemory = (memory) => {
    setSelectedMemory(memory);
    setShowViewModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderGallery = () => {
    // Fonction pour obtenir la source de l'image/vidéo
    const getMediaSource = (memory) => {
      // Si on a un base64, l'utiliser (pour les médias synchronisés)
      if (memory.mediaBase64) {
        const prefix = memory.mediaType === 'video' ? 'data:video/mp4;base64,' : 'data:image/jpeg;base64,';
        return { uri: prefix + memory.mediaBase64 };
      }
      // Sinon utiliser l'URI local
      if (memory.imageUri) {
        return { uri: memory.imageUri };
      }
      return null;
    };

    return (
      <View style={styles.galleryContainer}>
        {memories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={styles.emptyTitle}>Aucun souvenir</Text>
            <Text style={styles.emptyText}>
              Commencez à capturer vos moments précieux ensemble !
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => {
                setAddType('memory');
                setShowAddModal(true);
              }}
            >
              <Text style={styles.emptyButtonText}>Ajouter un souvenir</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.gallery}>
            {memories.map((memory, index) => {
              const mediaSource = getMediaSource(memory);
              return (
                <TouchableOpacity
                  key={`gallery-${memory.id}-${index}`}
                  style={styles.galleryItem}
                  onPress={() => openMemory(memory)}
                >
                  {mediaSource ? (
                    memory.mediaType === 'video' ? (
                      <View style={styles.galleryImage}>
                        <Video
                          source={mediaSource}
                          style={styles.galleryImage}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={false}
                          isMuted={true}
                        />
                        <View style={styles.videoOverlay}>
                          <Text style={styles.videoIcon}>▶️</Text>
                        </View>
                      </View>
                    ) : (
                      <Image source={mediaSource} style={styles.galleryImage} />
                    )
                  ) : (
                    <LinearGradient
                      colors={[memory.color || '#FF6B9D', '#C44569']}
                      style={styles.galleryPlaceholder}
                    >
                      <Text style={styles.galleryEmoji}>{memory.emoji || '💌'}</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.galleryOverlay}>
                    <Text style={styles.galleryTitle} numberOfLines={1}>{memory.title}</Text>
                    <Text style={styles.galleryDate}>{memory.date}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderJar = () => (
    <View style={styles.jarContainer}>
      <TouchableOpacity 
        style={styles.jar}
        onPress={() => {
          if (memories.length > 0) {
            const randomMemory = memories[Math.floor(Math.random() * memories.length)];
            openMemory(randomMemory);
          }
        }}
      >
        <View style={styles.jarTop} />
        <View style={styles.jarBody}>
          {memories.slice(0, 8).map((memory, index) => (
            <View
              key={`jar-item-${memory.id}-${index}`}
              style={[
                styles.jarItem,
                {
                  backgroundColor: memory.color || '#FF6B9D',
                  left: 20 + (index % 3) * 45,
                  bottom: 15 + Math.floor(index / 3) * 50,
                  transform: [{ rotate: `${(index % 2 === 0 ? -1 : 1) * (5 + index * 3)}deg` }],
                },
              ]}
            >
              <Text style={styles.jarItemEmoji}>{memory.emoji || '💕'}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>

      <Text style={styles.jarCount}>{memories.length} souvenirs</Text>
      <Text style={styles.jarHint}>
        {memories.length > 0 
          ? 'Touchez le bocal pour un souvenir aléatoire ✨' 
          : 'Ajoutez votre premier souvenir !'}
      </Text>

      {/* Liste des souvenirs récents */}
      <View style={styles.recentSection}>
        <Text style={styles.recentTitle}>📝 Souvenirs récents</Text>
        {memories.slice(0, 5).map((memory, index) => (
          <TouchableOpacity
            key={`recent-${memory.id}-${index}`}
            style={styles.recentItem}
            onPress={() => openMemory(memory)}
          >
            <Text style={styles.recentEmoji}>{memory.emoji || '💕'}</Text>
            <View style={styles.recentContent}>
              <Text style={styles.recentItemTitle}>{memory.title}</Text>
              <Text style={styles.recentItemDate}>{memory.date}</Text>
            </View>
            <Text style={styles.recentArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCapsules = () => (
    <View style={styles.capsulesContainer}>
      <Text style={styles.capsulesTitle}>⏰ Capsules Temporelles</Text>
      <Text style={styles.capsulesDesc}>
        Créez des messages qui s'ouvriront à une date future
      </Text>

      <TouchableOpacity
        style={styles.addCapsuleCard}
        onPress={() => {
          setAddType('capsule');
          setShowAddModal(true);
        }}
      >
        <Text style={styles.addCapsuleIcon}>➕</Text>
        <Text style={styles.addCapsuleText}>Créer une capsule</Text>
      </TouchableOpacity>

      {(!timeCapsules || timeCapsules.length === 0) ? (
        <View style={styles.emptyStateCapsule}>
          <Text style={styles.emptyText}>Aucune capsule temporelle</Text>
        </View>
      ) : (
        <View style={styles.capsulesList}>
          {(timeCapsules || []).map((capsule, index) => (
            <View key={`capsule-${capsule?.id || index}-${index}`} style={styles.capsuleCard}>
              <LinearGradient
                colors={capsule.locked ? ['#94A3B8', '#64748B'] : ['#8B5CF6', '#A855F7']}
                style={styles.capsuleGradient}
              >
                <View style={styles.capsuleHeader}>
                  <Text style={styles.capsuleEmoji}>{capsule.locked ? '🔒' : '💊'}</Text>
                  <TouchableOpacity
                    style={styles.capsuleDeleteBtn}
                    onPress={() => {
                      Alert.alert(
                        '🗑️ Supprimer la capsule',
                        `Voulez-vous vraiment supprimer "${capsule.title}" ?`,
                        [
                          { text: 'Annuler', style: 'cancel' },
                          { 
                            text: 'Supprimer', 
                            style: 'destructive',
                            onPress: async () => {
                              await deleteTimeCapsule(capsule.id);
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                              Alert.alert('✅', 'Capsule supprimée !');
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.capsuleDeleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.capsuleTitle}>{capsule.title}</Text>
                <Text style={styles.capsuleDate}>
                  {capsule.locked ? `S'ouvre le ${capsule.openDate}` : 'Ouverte !'}
                </Text>
                {!capsule.locked && capsule.note && (
                  <Text style={styles.capsuleNote}>{capsule.note}</Text>
                )}
              </LinearGradient>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // Vérifier si une lettre est délivrable
  const isLetterDeliverable = (letter) => {
    if (letter.fromId === user?.id) return false; // Pas ses propres lettres
    const deliveryDate = new Date(letter.deliveryDate.split('/').reverse().join('-'));
    const now = new Date();
    return now >= deliveryDate;
  };

  // === LETTRES D'AMOUR PROGRAMMÉES ===
  const handleAddLetter = async () => {
    if (!newLetter.title.trim() || !newLetter.content.trim() || !newLetter.deliveryDate.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    await addScheduledLetter({
      title: newLetter.title,
      content: newLetter.content,
      deliveryDate: newLetter.deliveryDate,
    });

    await notifyScheduledLetter();

    setNewLetter({ title: '', content: '', deliveryDate: '' });
    setShowAddModal(false);
    Alert.alert('💌', `Votre lettre sera livrée le ${newLetter.deliveryDate} !`);
  };

  const openLetter = (letter) => {
    if (letter.fromId === user?.id) {
      // C'est sa propre lettre
      Alert.alert(
        '💌 Votre lettre',
        `Titre: ${letter.title}\n\nContenu:\n${letter.content}\n\nSera livrée le: ${letter.deliveryDate}`,
        [
          { text: 'OK' },
          { 
            text: 'Supprimer', 
            style: 'destructive',
            onPress: () => deleteScheduledLetter(letter.id)
          }
        ]
      );
    } else if (isLetterDeliverable(letter)) {
      // Lettre du partenaire, délivrable
      if (!letter.isRead) {
        markLetterAsRead(letter.id);
      }
      setSelectedLetter(letter);
      setShowLetterModal(true);
    } else {
      // Lettre du partenaire, pas encore délivrable
      Alert.alert('⏰', `Cette lettre de ${letter.from} s'ouvrira le ${letter.deliveryDate} !`);
    }
  };

  const renderLetters = () => {
    const myLetters = scheduledLetters?.filter(l => l.fromId === user?.id) || [];
    const partnerLetters = scheduledLetters?.filter(l => l.fromId !== user?.id) || [];
    const deliverableCount = partnerLetters.filter(l => isLetterDeliverable(l) && !l.isRead).length;

    return (
      <View style={styles.lettersContainer}>
        <Text style={styles.sectionTitle}>💌 Lettres d'Amour Programmées</Text>
        <Text style={styles.sectionDesc}>
          Écrivez des lettres qui seront délivrées à une date future. Une belle surprise pour votre moitié !
        </Text>

        {deliverableCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationText}>
              💌 {deliverableCount} nouvelle{deliverableCount > 1 ? 's' : ''} lettre{deliverableCount > 1 ? 's' : ''} à lire !
            </Text>
          </View>
        )}

        {/* Bouton ajouter une lettre */}
        <TouchableOpacity
          style={styles.addLetterButton}
          onPress={() => {
            setAddType('letter');
            setShowAddModal(true);
          }}
        >
          <LinearGradient colors={['#FF6B9D', '#C44569']} style={styles.addLetterGradient}>
            <Text style={styles.addLetterText}>✍️ Écrire une lettre</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Lettres reçues */}
        {partnerLetters.length > 0 && (
          <View style={styles.letterSection}>
            <Text style={styles.letterSectionTitle}>📬 Lettres reçues</Text>
            {partnerLetters.map((letter, index) => {
              const canOpen = isLetterDeliverable(letter);
              return (
                <TouchableOpacity
                  key={letter.id}
                  style={[styles.letterCard, canOpen && !letter.isRead && styles.letterCardUnread]}
                  onPress={() => openLetter(letter)}
                >
                  <View style={styles.letterCardContent}>
                    <Text style={styles.letterEmoji}>{canOpen ? '💌' : '📨'}</Text>
                    <View style={styles.letterInfo}>
                      <Text style={styles.letterTitle}>{letter.title}</Text>
                      <Text style={styles.letterFrom}>De {letter.from}</Text>
                      <Text style={styles.letterDate}>
                        {canOpen ? (letter.isRead ? 'Lu ✓' : '✨ À lire !') : `S'ouvre le ${letter.deliveryDate}`}
                      </Text>
                    </View>
                    {canOpen && !letter.isRead && <View style={styles.letterBadge} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Mes lettres envoyées */}
        {myLetters.length > 0 && (
          <View style={styles.letterSection}>
            <Text style={styles.letterSectionTitle}>📤 Mes lettres programmées</Text>
            {myLetters.map((letter, index) => (
              <View key={letter.id} style={styles.letterCardWrapper}>
                <TouchableOpacity
                  style={styles.letterCard}
                  onPress={() => openLetter(letter)}
                >
                  <View style={styles.letterCardContent}>
                    <Text style={styles.letterEmoji}>✉️</Text>
                    <View style={styles.letterInfo}>
                      <Text style={styles.letterTitle}>{letter.title}</Text>
                      <Text style={styles.letterDate}>Sera livrée le {letter.deliveryDate}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.letterActionsRow}>
                  <TouchableOpacity
                    style={styles.letterEditBtn}
                    onPress={() => {
                      setEditItem({
                        id: letter.id,
                        title: letter.title,
                        content: letter.content,
                      });
                      setEditType('letter');
                      setShowEditModal(true);
                    }}
                  >
                    <Text style={styles.letterActionText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.letterDeleteBtn}
                    onPress={() => {
                      Alert.alert(
                        '🗑️ Supprimer',
                        'Supprimer cette lettre programmée ?',
                        [
                          { text: 'Annuler', style: 'cancel' },
                          {
                            text: 'Supprimer',
                            style: 'destructive',
                            onPress: async () => {
                              await deleteScheduledLetter(letter.id);
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.letterActionText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {scheduledLetters?.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💌</Text>
            <Text style={styles.emptyText}>Aucune lettre programmée</Text>
            <Text style={styles.emptyHint}>Écrivez une lettre d'amour qui sera livrée plus tard !</Text>
          </View>
        )}
      </View>
    );
  };

  // === JOURNAL INTIME PARTAGÉ ===
  const MOOD_EMOJIS = ['😊', '🥰', '😍', '🤗', '😌', '🥺', '😢', '😤', '🤔', '✨'];

  const handleAddDiaryEntry = async () => {
    if (!newDiaryEntry.content.trim()) {
      Alert.alert('Erreur', 'Veuillez écrire quelque chose');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    await addDiaryEntry({
      mood: newDiaryEntry.mood,
      content: newDiaryEntry.content,
    });

    await notifyDiaryEntry();

    setNewDiaryEntry({ mood: '😊', content: '' });
    setShowAddModal(false);
    Alert.alert('📖', 'Entrée ajoutée au journal !');
  };

  const renderDiary = () => {
    return (
      <View style={styles.diaryContainer}>
        <Text style={styles.sectionTitle}>📖 Journal Intime Partagé</Text>
        <Text style={styles.sectionDesc}>
          Écrivez ensemble votre histoire, jour après jour. Partagez vos pensées, vos moments, vos émotions.
        </Text>

        {/* Bouton ajouter une entrée */}
        <TouchableOpacity
          style={styles.addDiaryButton}
          onPress={() => {
            setAddType('diary');
            setShowAddModal(true);
          }}
        >
          <LinearGradient colors={['#8B5CF6', '#6366F1']} style={styles.addDiaryGradient}>
            <Text style={styles.addDiaryText}>✍️ Écrire dans le journal</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Entrées du journal */}
        {sharedDiary && Array.isArray(sharedDiary) && sharedDiary.length > 0 ? (
          <View style={styles.diaryEntries}>
            {sharedDiary.filter(e => e != null).map((entry, index) => (
              <View key={entry?.id || `diary-${index}`} style={styles.diaryEntry}>
                <View style={styles.diaryEntryHeader}>
                  <Text style={styles.diaryMood}>{entry.mood}</Text>
                  <View style={styles.diaryMeta}>
                    <Text style={styles.diaryAuthor}>{entry.author}</Text>
                    <Text style={styles.diaryDate}>{entry.date}</Text>
                  </View>
                  {entry.authorId === user?.id && (
                    <View style={styles.diaryActionsRow}>
                      <TouchableOpacity
                        style={styles.diaryEditBtn}
                        onPress={() => {
                          setEditItem({
                            id: entry.id,
                            mood: entry.mood,
                            content: entry.content,
                          });
                          setEditType('diary');
                          setShowEditModal(true);
                        }}
                      >
                        <Text style={styles.diaryEditText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.diaryDeleteBtn}
                        onPress={() => {
                          Alert.alert(
                            'Supprimer',
                            'Supprimer cette entrée ?',
                            [
                              { text: 'Annuler', style: 'cancel' },
                              { 
                                text: 'Supprimer', 
                                style: 'destructive',
                                onPress: () => deleteDiaryEntry(entry.id)
                              }
                            ]
                          );
                        }}
                      >
                        <Text style={styles.diaryDeleteText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                <Text style={styles.diaryContent}>{entry.content}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📖</Text>
            <Text style={styles.emptyText}>Votre journal est vide</Text>
            <Text style={styles.emptyHint}>Commencez à écrire votre histoire ensemble !</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={theme.primary}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>🫙 Souvenirs</Text>
        <Text style={styles.subtitle}>{memories.length} moments précieux</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'gallery' && styles.activeTab]}
          onPress={() => setActiveTab('gallery')}
        >
          <Text style={[styles.tabText, activeTab === 'gallery' && styles.activeTabText]}>📷</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'jar' && styles.activeTab]}
          onPress={() => setActiveTab('jar')}
        >
          <Text style={[styles.tabText, activeTab === 'jar' && styles.activeTabText]}>🫙</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'capsules' && styles.activeTab]}
          onPress={() => setActiveTab('capsules')}
        >
          <Text style={[styles.tabText, activeTab === 'capsules' && styles.activeTabText]}>⏰</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'letters' && styles.activeTab]}
          onPress={() => setActiveTab('letters')}
        >
          <Text style={[styles.tabText, activeTab === 'letters' && styles.activeTabText]}>💌</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'diary' && styles.activeTab]}
          onPress={() => setActiveTab('diary')}
        >
          <Text style={[styles.tabText, activeTab === 'diary' && styles.activeTabText]}>📖</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'gallery' && renderGallery()}
        {activeTab === 'jar' && renderJar()}
        {activeTab === 'capsules' && renderCapsules()}
        {activeTab === 'letters' && renderLetters()}
        {activeTab === 'diary' && renderDiary()}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setAddType('memory');
          setShowAddModal(true);
        }}
      >
        <LinearGradient
          colors={['#fff', '#f0f0f0']}
          style={styles.addButtonGradient}
        >
          <Text style={styles.addButtonText}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {addType === 'capsule' ? '⏰ Nouvelle Capsule' : 
               addType === 'letter' ? '💌 Nouvelle Lettre' :
               addType === 'diary' ? '📖 Nouvelle Entrée' :
               '✨ Nouveau Souvenir'}
            </Text>

            {/* Formulaire pour Lettre */}
            {addType === 'letter' && (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Titre de la lettre"
                  placeholderTextColor="#999"
                  value={newLetter.title}
                  onChangeText={(text) => setNewLetter({ ...newLetter, title: text })}
                />
                <TextInput
                  style={[styles.modalInput, styles.modalTextAreaLarge]}
                  placeholder="Écris ta lettre d'amour ici... 💕"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={8}
                  value={newLetter.content}
                  onChangeText={(text) => setNewLetter({ ...newLetter, content: text })}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Date de livraison (JJ/MM/AAAA)"
                  placeholderTextColor="#999"
                  value={newLetter.deliveryDate}
                  onChangeText={(text) => setNewLetter({ ...newLetter, deliveryDate: text })}
                />
                <Text style={styles.modalHint}>
                  💡 La lettre sera livrée à cette date !
                </Text>
              </>
            )}

            {/* Formulaire pour Journal */}
            {addType === 'diary' && (
              <>
                <Text style={styles.moodLabel}>Comment te sens-tu ?</Text>
                <View style={styles.moodSelector}>
                  {MOOD_EMOJIS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.moodButton,
                        newDiaryEntry.mood === emoji && styles.moodButtonActive
                      ]}
                      onPress={() => setNewDiaryEntry({ ...newDiaryEntry, mood: emoji })}
                    >
                      <Text style={styles.moodEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={[styles.modalInput, styles.modalTextAreaLarge]}
                  placeholder="Qu'as-tu envie de partager aujourd'hui ?"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={8}
                  value={newDiaryEntry.content}
                  onChangeText={(text) => setNewDiaryEntry({ ...newDiaryEntry, content: text })}
                />
              </>
            )}

            {/* Formulaire pour Souvenir/Capsule */}
            {(addType === 'memory' || addType === 'capsule') && (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder={addType === 'capsule' ? "Titre de la capsule" : "Titre du souvenir"}
                  placeholderTextColor="#999"
                  value={newMemory.title}
                  onChangeText={(text) => setNewMemory({ ...newMemory, title: text })}
                />

                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  placeholder="Note ou message..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  value={newMemory.note}
                  onChangeText={(text) => setNewMemory({ ...newMemory, note: text })}
                />

                {addType === 'capsule' && (
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Date d'ouverture (JJ/MM/AAAA)"
                    placeholderTextColor="#999"
                    value={newMemory.date}
                    onChangeText={(text) => setNewMemory({ ...newMemory, date: text })}
                  />
                )}

                {addType === 'memory' && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                      <Text style={styles.photoButtonText}>📁 Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoButton} onPress={pickVideo}>
                      <Text style={styles.photoButtonText}>🎬 Vidéo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                      <Text style={styles.photoButtonText}>📸 Caméra</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {newMemory.imageUri && (
                  <View style={styles.imagePreview}>
                    {newMemory.mediaType === 'video' ? (
                      <Video
                        source={{ uri: newMemory.imageUri }}
                        style={styles.previewImage}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={false}
                        isMuted={true}
                      />
                    ) : (
                      <Image source={{ uri: newMemory.imageUri }} style={styles.previewImage} />
                    )}
                    <View style={styles.mediaTypeIndicator}>
                      <Text style={styles.mediaTypeText}>{newMemory.mediaType === 'video' ? '🎬' : '📸'}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeImage}
                      onPress={() => setNewMemory({ ...newMemory, imageUri: null, mediaType: 'image' })}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setNewMemory({ title: '', note: '', date: '', imageUri: null, mediaType: 'image' });
                  setNewLetter({ title: '', content: '', deliveryDate: '' });
                  setNewDiaryEntry({ mood: '😊', content: '' });
                }}
                disabled={isUploading}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isUploading && styles.saveButtonDisabled]}
                onPress={
                  addType === 'capsule' ? handleAddCapsule : 
                  addType === 'letter' ? handleAddLetter :
                  addType === 'diary' ? handleAddDiaryEntry :
                  handleAddMemory
                }
                disabled={isUploading}
              >
                {isUploading ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.saveButtonText}> Envoi...</Text>
                  </View>
                ) : (
                  <Text style={styles.saveButtonText}>
                    {addType === 'capsule' ? 'Créer ⏰' : 
                     addType === 'letter' ? 'Programmer 💌' :
                     addType === 'diary' ? 'Publier 📖' :
                     'Sauvegarder 💖'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View Memory Modal */}
      <Modal
        visible={showViewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowViewModal(false)}
      >
        <View style={styles.viewModalOverlay}>
          <View style={styles.viewModalContentLarge}>
            {selectedMemory && (
              <>
                {(() => {
                  // Obtenir la source du média
                  let mediaSource = null;
                  if (selectedMemory.mediaBase64) {
                    const prefix = selectedMemory.mediaType === 'video' ? 'data:video/mp4;base64,' : 'data:image/jpeg;base64,';
                    mediaSource = { uri: prefix + selectedMemory.mediaBase64 };
                  } else if (selectedMemory.imageUri) {
                    mediaSource = { uri: selectedMemory.imageUri };
                  }

                  if (mediaSource) {
                    if (selectedMemory.mediaType === 'video') {
                      return (
                        <Video
                          source={mediaSource}
                          style={styles.viewImageLarge}
                          resizeMode={ResizeMode.CONTAIN}
                          shouldPlay={true}
                          isLooping={true}
                          useNativeControls={true}
                        />
                      );
                    } else {
                      return <Image source={mediaSource} style={styles.viewImageLarge} resizeMode="contain" />;
                    }
                  } else {
                    return (
                      <LinearGradient
                        colors={[selectedMemory.color || '#FF6B9D', '#C44569']}
                        style={styles.viewImagePlaceholder}
                      >
                        <Text style={styles.viewEmoji}>{selectedMemory.emoji || '💕'}</Text>
                      </LinearGradient>
                    );
                  }
                })()}
                <View style={styles.viewDetails}>
                  <Text style={styles.viewTitle}>{selectedMemory.title}</Text>
                  <Text style={styles.viewDate}>📅 {selectedMemory.date}</Text>
                  {selectedMemory.note && (
                    <Text style={styles.viewNote}>{selectedMemory.note}</Text>
                  )}
                </View>
                <View style={styles.viewButtonsRow}>
                  <TouchableOpacity
                    style={styles.editViewButton}
                    onPress={() => {
                      setEditItem({
                        id: selectedMemory.id,
                        title: selectedMemory.title,
                        note: selectedMemory.note || '',
                      });
                      setEditType('memory');
                      setShowViewModal(false);
                      setShowEditModal(true);
                    }}
                  >
                    <Text style={styles.editViewButtonText}>✏️ Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteViewButton}
                    onPress={() => {
                      Alert.alert(
                        '🗑️ Supprimer',
                        'Voulez-vous vraiment supprimer ce souvenir ?',
                        [
                          { text: 'Annuler', style: 'cancel' },
                          {
                            text: 'Supprimer',
                            style: 'destructive',
                            onPress: async () => {
                              await deleteMemory(selectedMemory.id);
                              setShowViewModal(false);
                              setSelectedMemory(null);
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                              Alert.alert('✅', 'Souvenir supprimé');
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.deleteViewButtonText}>🗑️ Supprimer</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={styles.closeViewButton}
                    onPress={() => setShowViewModal(false)}
                  >
                    <Text style={styles.closeViewButtonText}>Fermer 💕</Text>
                  </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Letter Reading Modal - Animé */}
      <AnimatedModal
        visible={showLetterModal}
        onClose={() => {
          setShowLetterModal(false);
          setSelectedLetter(null);
        }}
        title={selectedLetter?.title || 'Lettre'}
        emoji="💌"
        type="spring"
        size="large"
        closeButtonText="Fermer 💕"
        gradientColors={['#EC4899', '#BE185D']}
      >
        {selectedLetter && (
          <View style={styles.letterContent}>
            <View style={styles.letterFromBadge}>
              <Text style={styles.letterFromText}>De {selectedLetter.from}</Text>
            </View>
            <View style={styles.letterTextContainer}>
              <Text style={styles.letterText}>{selectedLetter.content}</Text>
            </View>
            <Text style={styles.letterDate}>
              ✍️ Écrite le {new Date(selectedLetter.createdAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}
      </AnimatedModal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editType === 'memory' ? '✏️ Modifier le souvenir' : 
               editType === 'letter' ? '✏️ Modifier la lettre' : 
               '✏️ Modifier l\'entrée'}
            </Text>
            
            {editType === 'memory' && editItem && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Titre"
                  value={editItem.title}
                  onChangeText={(text) => setEditItem({ ...editItem, title: text })}
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Note (optionnel)"
                  value={editItem.note}
                  onChangeText={(text) => setEditItem({ ...editItem, note: text })}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#999"
                />
              </>
            )}

            {editType === 'letter' && editItem && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Titre de la lettre"
                  value={editItem.title}
                  onChangeText={(text) => setEditItem({ ...editItem, title: text })}
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={[styles.input, styles.textAreaLarge]}
                  placeholder="Contenu de la lettre"
                  value={editItem.content}
                  onChangeText={(text) => setEditItem({ ...editItem, content: text })}
                  multiline
                  numberOfLines={8}
                  placeholderTextColor="#999"
                />
              </>
            )}

            {editType === 'diary' && editItem && (
              <>
                <View style={styles.moodSelector}>
                  <Text style={styles.moodLabel}>Humeur :</Text>
                  <View style={styles.moodOptions}>
                    {['😊', '😍', '🥰', '😢', '😤', '🤔', '😴', '🎉'].map((mood) => (
                      <TouchableOpacity
                        key={mood}
                        style={[
                          styles.moodOption,
                          editItem.mood === mood && styles.moodOptionSelected
                        ]}
                        onPress={() => setEditItem({ ...editItem, mood })}
                      >
                        <Text style={styles.moodEmoji}>{mood}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <TextInput
                  style={[styles.input, styles.textAreaLarge]}
                  placeholder="Contenu de l'entrée"
                  value={editItem.content}
                  onChangeText={(text) => setEditItem({ ...editItem, content: text })}
                  multiline
                  numberOfLines={8}
                  placeholderTextColor="#999"
                />
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowEditModal(false);
                  setEditItem(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={async () => {
                  if (!editItem) return;
                  
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  
                  if (editType === 'memory') {
                    await updateMemory(editItem.id, {
                      title: editItem.title,
                      note: editItem.note,
                    });
                    Alert.alert('✅', 'Souvenir modifié !');
                  } else if (editType === 'letter') {
                    await updateScheduledLetter(editItem.id, {
                      title: editItem.title,
                      content: editItem.content,
                    });
                    Alert.alert('✅', 'Lettre modifiée !');
                  } else if (editType === 'diary') {
                    await updateDiaryEntry(editItem.id, {
                      mood: editItem.mood,
                      content: editItem.content,
                    });
                    Alert.alert('✅', 'Entrée modifiée !');
                  }
                  
                  setShowEditModal(false);
                  setEditItem(null);
                }}
              >
                <LinearGradient colors={['#FF6B9D', '#C44569']} style={styles.confirmGradient}>
                  <Text style={styles.confirmButtonText}>Enregistrer 💕</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
  scrollContent: {
    padding: 20,
  },
  galleryContainer: {
    flex: 1,
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  galleryItem: {
    width: (width - 50) / 2,
    height: 180,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryEmoji: {
    fontSize: 50,
  },
  galleryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
  },
  galleryTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  galleryDate: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 30,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 25,
  },
  emptyButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#C44569',
    fontWeight: 'bold',
    fontSize: 16,
  },
  jarContainer: {
    alignItems: 'center',
  },
  jar: {
    alignItems: 'center',
    marginBottom: 20,
  },
  jarTop: {
    width: 130,
    height: 25,
    backgroundColor: '#D4A574',
    borderRadius: 5,
    marginBottom: -5,
    zIndex: 1,
  },
  jarBody: {
    width: 200,
    height: 240,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    position: 'relative',
    overflow: 'hidden',
  },
  jarItem: {
    position: 'absolute',
    width: 50,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jarItemEmoji: {
    fontSize: 22,
  },
  jarCount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  jarHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  recentSection: {
    width: '100%',
    marginTop: 10,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  recentEmoji: {
    fontSize: 30,
    marginRight: 15,
  },
  recentContent: {
    flex: 1,
  },
  recentItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  recentItemDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  recentArrow: {
    fontSize: 24,
    color: '#ccc',
  },
  capsulesContainer: {
    alignItems: 'center',
  },
  capsulesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  capsulesDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 25,
  },
  capsulesList: {
    width: '100%',
  },
  capsuleCard: {
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },
  capsuleGradient: {
    padding: 25,
    alignItems: 'center',
  },
  capsuleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 5,
  },
  capsuleDeleteBtn: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capsuleDeleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  capsuleEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  capsuleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  capsuleDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  capsuleNote: {
    fontSize: 14,
    color: '#fff',
    marginTop: 10,
    fontStyle: 'italic',
  },
  addCapsuleCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    width: '100%',
    marginBottom: 20,
  },
  addCapsuleIcon: {
    fontSize: 35,
    marginBottom: 10,
  },
  addCapsuleText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  emptyStateCapsule: {
    padding: 30,
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 110,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 35,
    color: '#C44569',
    fontWeight: 'bold',
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
    maxHeight: '85%',
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
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  modalTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 15,
  },
  photoButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  photoButtonText: {
    fontSize: 15,
    color: '#666',
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 20,
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 15,
  },
  removeImage: {
    position: 'absolute',
    top: -10,
    right: 60,
    backgroundColor: '#EF4444',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
  saveButton: {
    flex: 1,
    backgroundColor: '#C44569',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    padding: 10,
  },
  viewModalContent: {
    backgroundColor: '#fff',
    borderRadius: 25,
    overflow: 'hidden',
  },
  viewModalContentLarge: {
    backgroundColor: '#000',
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: height * 0.9,
  },
  viewImage: {
    width: '100%',
    height: 300,
  },
  viewImageLarge: {
    width: '100%',
    height: height * 0.6,
    backgroundColor: '#000',
  },
  viewImagePlaceholder: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewEmoji: {
    fontSize: 80,
  },
  viewDetails: {
    padding: 20,
    backgroundColor: '#fff',
  },
  viewTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  viewDate: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  viewNote: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  closeViewButton: {
    backgroundColor: '#C44569',
    flex: 1,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  closeViewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  viewButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    margin: 15,
    marginTop: 0,
  },
  deleteViewButton: {
    backgroundColor: '#EF4444',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    paddingHorizontal: 20,
    flex: 1,
  },
  deleteViewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editViewButton: {
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    paddingHorizontal: 20,
    flex: 1,
  },
  editViewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIcon: {
    fontSize: 30,
  },
  mediaTypeIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 5,
  },
  mediaTypeText: {
    fontSize: 16,
  },
  // ===== STYLES LETTRES D'AMOUR =====
  lettersContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textAlign: 'center',
  },
  sectionDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  notificationBadge: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 15,
    marginBottom: 15,
  },
  notificationText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15,
  },
  addLetterButton: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  addLetterGradient: {
    padding: 15,
    alignItems: 'center',
  },
  addLetterText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  letterSection: {
    marginBottom: 20,
  },
  letterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  letterCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  letterCardUnread: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  letterCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  letterEmoji: {
    fontSize: 30,
    marginRight: 15,
  },
  letterInfo: {
    flex: 1,
  },
  letterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  letterFrom: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  letterDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 3,
  },
  letterBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700',
  },
  // ===== STYLES JOURNAL =====
  diaryContainer: {
    padding: 15,
  },
  addDiaryButton: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  addDiaryGradient: {
    padding: 15,
    alignItems: 'center',
  },
  addDiaryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  diaryEntries: {
    marginTop: 10,
  },
  diaryEntry: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  diaryEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  diaryMood: {
    fontSize: 28,
    marginRight: 10,
  },
  diaryMeta: {
    flex: 1,
  },
  diaryAuthor: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  diaryDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  diaryDeleteBtn: {
    padding: 8,
  },
  diaryDeleteText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
  diaryContent: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
  },
  // ===== STYLES MODAL FORMULAIRES =====
  modalTextAreaLarge: {
    height: 150,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  modalHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 10,
  },
  moodLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  moodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 8,
  },
  moodButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodButtonActive: {
    backgroundColor: '#FF6B9D',
    transform: [{ scale: 1.1 }],
  },
  moodEmoji: {
    fontSize: 22,
  },
  // ===== STYLES EMPTY STATE =====
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  emptyHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  // ===== STYLES ANIMATEDMODAL LETTRE =====
  letterContent: {
    alignItems: 'center',
    width: '100%',
  },
  letterFromBadge: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  letterFromText: {
    fontSize: 14,
    color: '#BE185D',
    fontWeight: '600',
  },
  letterTextContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  letterText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 28,
    textAlign: 'left',
    fontStyle: 'italic',
  },
  letterDate: {
    fontSize: 13,
    color: '#999',
  },
  // Styles pour les boutons d'action sur les lettres
  letterCardWrapper: {
    marginBottom: 15,
  },
  letterActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  letterEditBtn: {
    backgroundColor: '#3B82F6',
    padding: 8,
    borderRadius: 15,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterDeleteBtn: {
    backgroundColor: '#EF4444',
    padding: 8,
    borderRadius: 15,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterActionText: {
    fontSize: 16,
  },
  // Styles pour les boutons d'action sur le journal
  diaryActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  diaryEditBtn: {
    padding: 5,
  },
  diaryEditText: {
    fontSize: 16,
  },
  diaryDeleteText: {
    fontSize: 16,
  },
  // Styles pour la modale d'édition
  textAreaLarge: {
    height: 200,
    textAlignVertical: 'top',
  },
  moodSelector: {
    marginBottom: 15,
  },
  moodLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  moodOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodOption: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
  },
  moodOptionSelected: {
    backgroundColor: '#FF6B9D',
  },
  moodEmoji: {
    fontSize: 24,
  },
});
