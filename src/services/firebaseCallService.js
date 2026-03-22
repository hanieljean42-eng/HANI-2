// ============================================================
// Firebase Audio Relay Service — Appels audio via Firebase
// Capture l'audio en chunks, envoie via Firebase Realtime DB
// Le partenaire reçoit et joue les chunks en temps réel
// ============================================================

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { database, isConfigured } from '../config/firebase';
import { ref, set, push, onChildAdded, off, remove } from 'firebase/database';

const CHUNK_DURATION_MS = 400; // Durée de chaque chunk audio (ms)

class FirebaseCallService {
  constructor() {
    this.coupleId = null;
    this.userId = null;
    this.callType = null;
    this.isActive = false;
    this._isMuted = false;
    this._recording = null;
    this._recordingLoop = null;
    this._playbackQueue = [];
    this._isPlaying = false;
    this._audioListener = null;
    this._chunkCounter = 0;
    this._currentSound = null;

    // Callbacks
    this.onConnectionStateChange = null;
  }

  init(coupleId, userId) {
    this.coupleId = coupleId;
    this.userId = userId;
    this._isMuted = false;
    this._playbackQueue = [];
    this._isPlaying = false;
    this._chunkCounter = 0;
  }

  // ✅ Configurer le mode audio pour les appels
  async _setupAudioMode() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) {
      console.log('⚠️ Audio mode setup error:', e.message);
    }
  }

  // ✅ Démarrer le streaming audio (appelé quand l'appel est accepté)
  async startStreaming() {
    if (!this.coupleId || !this.userId || !isConfigured || !database) {
      console.log('⚠️ Firebase not configured for audio relay');
      return;
    }

    this.isActive = true;
    await this._setupAudioMode();

    // Nettoyer les anciens chunks audio
    try {
      const myStreamRef = ref(database, `couples/${this.coupleId}/calls/audioStream/${this.userId}`);
      await set(myStreamRef, null);
    } catch (e) {
      console.log('⚠️ Cleanup old chunks error:', e.message);
    }

    // Démarrer l'écoute des chunks du partenaire
    this._startListeningPartnerAudio();

    // Démarrer l'enregistrement en boucle
    this._startRecordingLoop();

    // Signaler la connexion
    if (this.onConnectionStateChange) {
      this.onConnectionStateChange('connected');
    }

    console.log('🎙️ Audio relay streaming started');
  }

  // ✅ Boucle d'enregistrement — enregistre en chunks continus
  async _startRecordingLoop() {
    while (this.isActive) {
      if (this._isMuted) {
        // Si muté, attendre sans enregistrer
        await this._delay(CHUNK_DURATION_MS);
        continue;
      }

      try {
        // Créer un nouvel enregistrement
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
          isMeteringEnabled: false,
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 32000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.LOW,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 32000,
          },
          web: {},
        });

        this._recording = recording;
        await recording.startAsync();

        // Attendre la durée du chunk
        await this._delay(CHUNK_DURATION_MS);

        // Arrêter et récupérer le fichier
        if (!this.isActive) break;

        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        this._recording = null;

        if (uri) {
          // Lire le fichier en base64
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Envoyer le chunk via Firebase
          if (this.isActive && base64.length > 0) {
            const streamRef = ref(database, `couples/${this.coupleId}/calls/audioStream/${this.userId}`);
            this._chunkCounter++;
            await push(streamRef, {
              d: base64,
              t: Date.now(),
              n: this._chunkCounter,
            });
          }

          // Supprimer le fichier temporaire
          try {
            await FileSystem.deleteAsync(uri, { idempotent: true });
          } catch (e) { /* ignore */ }
        }
      } catch (e) {
        if (this.isActive) {
          console.log('⚠️ Recording chunk error:', e.message);
          await this._delay(100); // Petite pause avant de réessayer
        }
      }
    }
  }

  // ✅ Écouter les chunks audio du partenaire
  _startListeningPartnerAudio() {
    if (!this.coupleId || !this.userId || !database) return;

    // Trouver le partnerId — écouter TOUS les streams sauf le mien
    const streamRef = ref(database, `couples/${this.coupleId}/calls/audioStream`);

    this._audioListener = onChildAdded(streamRef, (userSnapshot) => {
      const streamUserId = userSnapshot.key;
      if (streamUserId === this.userId) return; // Ignorer mes propres chunks

      // Écouter les chunks de ce partenaire
      const partnerStreamRef = ref(database, `couples/${this.coupleId}/calls/audioStream/${streamUserId}`);
      
      onChildAdded(partnerStreamRef, async (chunkSnapshot) => {
        if (!this.isActive) return;
        
        const chunk = chunkSnapshot.val();
        if (!chunk?.d) return;

        // Ajouter à la queue de lecture
        this._playbackQueue.push(chunk);

        // Jouer si pas déjà en cours
        if (!this._isPlaying) {
          this._playNextChunk();
        }
      });
    });
  }

  // ✅ Jouer le prochain chunk audio
  async _playNextChunk() {
    if (this._playbackQueue.length === 0) {
      this._isPlaying = false;
      return;
    }

    this._isPlaying = true;
    const chunk = this._playbackQueue.shift();

    try {
      // Écrire le chunk base64 dans un fichier temporaire
      const tempUri = FileSystem.cacheDirectory + `audio_chunk_${chunk.t}_${chunk.n || 0}.m4a`;
      await FileSystem.writeAsStringAsync(tempUri, chunk.d, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Jouer le fichier
      const { sound } = await Audio.Sound.createAsync(
        { uri: tempUri },
        { shouldPlay: true, volume: 1.0 }
      );
      this._currentSound = sound;

      // Attendre la fin de la lecture
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          this._currentSound = null;
          // Supprimer le fichier temporaire
          FileSystem.deleteAsync(tempUri, { idempotent: true }).catch(() => {});
          // Jouer le prochain chunk
          this._playNextChunk();
        }
      });
    } catch (e) {
      console.log('⚠️ Playback chunk error:', e.message);
      this._isPlaying = false;
      // Essayer le prochain chunk
      if (this._playbackQueue.length > 0) {
        setTimeout(() => this._playNextChunk(), 50);
      }
    }
  }

  // ✅ Toggle mute
  toggleMute() {
    this._isMuted = !this._isMuted;
    console.log(`🎤 Micro ${this._isMuted ? 'muté' : 'activé'}`);
    return this._isMuted;
  }

  // ✅ Vérifier si muté
  get isMuted() {
    return this._isMuted;
  }

  // ✅ Nettoyage complet
  async cleanup() {
    console.log('🧹 Firebase call cleanup');
    this.isActive = false;

    // Arrêter l'enregistrement en cours
    if (this._recording) {
      try {
        await this._recording.stopAndUnloadAsync();
      } catch (e) { /* ignore */ }
      this._recording = null;
    }

    // Arrêter le son en cours
    if (this._currentSound) {
      try {
        await this._currentSound.stopAsync();
        await this._currentSound.unloadAsync();
      } catch (e) { /* ignore */ }
      this._currentSound = null;
    }

    // Retirer les listeners Firebase
    if (this._audioListener && this.coupleId) {
      try {
        const streamRef = ref(database, `couples/${this.coupleId}/calls/audioStream`);
        off(streamRef);
      } catch (e) { /* ignore */ }
      this._audioListener = null;
    }

    // Nettoyer les données audio sur Firebase
    if (this.coupleId && database) {
      try {
        const streamRef = ref(database, `couples/${this.coupleId}/calls/audioStream`);
        await set(streamRef, null);
      } catch (e) { /* ignore */ }
    }

    // Reset audio mode
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
      });
    } catch (e) { /* ignore */ }

    // Reset state
    this._playbackQueue = [];
    this._isPlaying = false;
    this._isMuted = false;
    this._chunkCounter = 0;
    this.callType = null;

    if (this.onConnectionStateChange) {
      this.onConnectionStateChange('disconnected');
    }
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const firebaseCallService = new FirebaseCallService();
export default firebaseCallService;
