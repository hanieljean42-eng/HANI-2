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
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Video, ResizeMode } from 'expo-av';
import { useData } from '../context/DataContext';

const { width, height } = Dimensions.get('window');

export default function MemoriesScreen() {
  const { memories, addMemory, timeCapsules, addTimeCapsule, deleteMemory } = useData();
  const [activeTab, setActiveTab] = useState('gallery');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [addType, setAddType] = useState('memory');
  const [newMemory, setNewMemory] = useState({ title: '', note: '', date: '', imageUri: null, mediaType: 'image' });
  const [isUploading, setIsUploading] = useState(false);

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

      {timeCapsules.length === 0 ? (
        <View style={styles.emptyStateCapsule}>
          <Text style={styles.emptyText}>Aucune capsule temporelle</Text>
        </View>
      ) : (
        <View style={styles.capsulesList}>
          {timeCapsules.map((capsule, index) => (
            <View key={`capsule-${capsule.id}-${index}`} style={styles.capsuleCard}>
              <LinearGradient
                colors={capsule.locked ? ['#94A3B8', '#64748B'] : ['#8B5CF6', '#A855F7']}
                style={styles.capsuleGradient}
              >
                <Text style={styles.capsuleEmoji}>{capsule.locked ? '🔒' : '💊'}</Text>
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

  return (
    <LinearGradient
      colors={['#FF6B9D', '#C44569', '#8B5CF6']}
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
          <Text style={[styles.tabText, activeTab === 'gallery' && styles.activeTabText]}>📷 Galerie</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'jar' && styles.activeTab]}
          onPress={() => setActiveTab('jar')}
        >
          <Text style={[styles.tabText, activeTab === 'jar' && styles.activeTabText]}>🫙 Bocal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'capsules' && styles.activeTab]}
          onPress={() => setActiveTab('capsules')}
        >
          <Text style={[styles.tabText, activeTab === 'capsules' && styles.activeTabText]}>⏰ Capsules</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'gallery' && renderGallery()}
        {activeTab === 'jar' && renderJar()}
        {activeTab === 'capsules' && renderCapsules()}

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
              {addType === 'capsule' ? '⏰ Nouvelle Capsule' : '✨ Nouveau Souvenir'}
            </Text>

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

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setNewMemory({ title: '', note: '', date: '', imageUri: null, mediaType: 'image' });
                }}
                disabled={isUploading}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isUploading && styles.saveButtonDisabled]}
                onPress={addType === 'capsule' ? handleAddCapsule : handleAddMemory}
                disabled={isUploading}
              >
                {isUploading ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.saveButtonText}> Envoi...</Text>
                  </View>
                ) : (
                  <Text style={styles.saveButtonText}>
                    {addType === 'capsule' ? 'Créer ⏰' : 'Sauvegarder 💖'}
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
                  <TouchableOpacity
                    style={styles.closeViewButton}
                    onPress={() => setShowViewModal(false)}
                  >
                    <Text style={styles.closeViewButtonText}>Fermer 💕</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    color: '#999',
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
  },
  deleteViewButtonText: {
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
});
