// ============================================================
// Firebase Audio Relay Service — Appels audio via Firebase
// Architecture HALF-DUPLEX : alterne enregistrement et lecture
// pour contourner la limitation Android (expo-av ne peut pas
// enregistrer et lire simultanément).
// ============================================================

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { database, isConfigured } from '../config/firebase';
import { ref, set, push, onChildAdded, off } from 'firebase/database';

const CHUNK_DURATION_MS = 350; // Durée de chaque chunk audio (ms) — plus court = moins de latence
const MAX_QUEUE_SIZE = 3;      // Max chunks en attente (drop les vieux pour réduire la latence)

class FirebaseCallService {
  constructor() {
    this.coupleId = null;
    this.userId = null;
    this.callType = null;
    this.isActive = false;
    this._isMuted = false;
    this._isSpeaker = false;
    this._recording = null;
    this._playbackQueue = [];
    this._chunkCounter = 0;
    this._partnerListeners = [];
    this._startTime = 0;

    // Callbacks
    this.onConnectionStateChange = null;
  }

  init(coupleId, userId) {
    this.coupleId = coupleId;
    this.userId = userId;
    this._isMuted = false;
    this._isSpeaker = false;
    this._playbackQueue = [];
    this._chunkCounter = 0;
    this._startTime = Date.now();
    this._partnerListeners = [];
  }

  // ✅ Démarrer le streaming audio (appelé quand l'appel est accepté)
  async startStreaming() {
    if (!this.coupleId || !this.userId || !isConfigured || !database) {
      console.log('⚠️ Firebase not configured for audio relay');
      return;
    }

    this.isActive = true;
    this._startTime = Date.now();

    console.log('🎙️ Starting audio relay (half-duplex)...');

    // Nettoyer les anciens chunks audio
    try {
      const myStreamRef = ref(database, `couples/${this.coupleId}/calls/audioStream/${this.userId}`);
      await set(myStreamRef, null);
    } catch (e) {
      console.log('⚠️ Cleanup old chunks error:', e.message);
    }

    // Démarrer l'écoute des chunks du partenaire
    this._startListeningPartnerAudio();

    // Démarrer la boucle principale (enregistrement + lecture alternés)
    this._mainLoop();

    // Signaler la connexion
    if (this.onConnectionStateChange) {
      this.onConnectionStateChange('connected');
    }

    console.log('🎙️ Audio relay streaming started');
  }

  // ============================================================
  // BOUCLE PRINCIPALE : alterne ENREGISTREMENT et LECTURE
  // Sur Android, expo-av bloque la lecture quand un Recording est
  // actif. On doit donc : enregistrer → stopper → lire → répéter.
  // ============================================================
  async _mainLoop() {
    while (this.isActive) {
      // === PHASE 1 : ENREGISTREMENT ===
      if (!this._isMuted) {
        try {
          // Activer le mode enregistrement
          await this._setAudioMode(true);

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
          await this._delay(CHUNK_DURATION_MS);

          if (!this.isActive) break;

          await recording.stopAndUnloadAsync();
          const uri = recording.getURI();
          this._recording = null;

          // Envoyer le chunk de manière non-bloquante
          if (uri) {
            this._sendChunkAsync(uri);
          }
        } catch (e) {
          if (this.isActive) {
            console.log('⚠️ Recording error:', e.message);
            await this._delay(200);
          }
          continue;
        }
      } else {
        // Muté : juste attendre et donner du temps à la lecture
        await this._delay(CHUNK_DURATION_MS);
      }

      // === PHASE 2 : LECTURE des chunks reçus ===
      if (this._playbackQueue.length > 0 && this.isActive) {
        try {
          // Désactiver l'enregistrement pour libérer le hardware audio
          await this._setAudioMode(false);

          // Drop les vieux chunks pour réduire la latence
          while (this._playbackQueue.length > MAX_QUEUE_SIZE) {
            this._playbackQueue.shift();
          }

          // Jouer les chunks en attente (un par un, de manière synchrone)
          while (this._playbackQueue.length > 0 && this.isActive) {
            const chunk = this._playbackQueue.shift();
            await this._playChunkSync(chunk);
          }
        } catch (e) {
          console.log('⚠️ Playback phase error:', e.message);
        }
      }
    }
  }

  // ✅ Changer le mode audio (enregistrement vs lecture)
  async _setAudioMode(recording) {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: recording,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: !recording,
        playThroughEarpieceAndroid: !this._isSpeaker, // Mode écouteur sauf si haut-parleur activé
      });
    } catch (e) {
      // Ignorer les erreurs non-critiques de changement de mode
    }
  }

  // ✅ Toggle haut-parleur (bascule entre écouteur et haut-parleur)
  toggleSpeaker() {
    this._isSpeaker = !this._isSpeaker;
    console.log(`🔊 Haut-parleur ${this._isSpeaker ? 'activé' : 'désactivé'}`);
    // Appliquer immédiatement le changement de mode audio
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: !this._isSpeaker,
    }).catch(() => {});
    return this._isSpeaker;
  }

  // ✅ Vérifier si haut-parleur actif
  get isSpeaker() {
    return this._isSpeaker;
  }

  // ✅ Envoyer un chunk audio vers Firebase (non-bloquant)
  async _sendChunkAsync(uri) {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (this.isActive && base64.length > 0) {
        this._chunkCounter++;
        const streamRef = ref(database, `couples/${this.coupleId}/calls/audioStream/${this.userId}`);
        // push non-bloquant — on n'attend pas la confirmation Firebase
        push(streamRef, {
          d: base64,
          t: Date.now(),
          n: this._chunkCounter,
        }).catch(e => console.log('⚠️ Push chunk error:', e.message));
      }

      FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
    } catch (e) {
      console.log('⚠️ Send chunk error:', e.message);
    }
  }

  // ✅ Jouer un chunk audio de manière synchrone (attend la fin avant de continuer)
  _playChunkSync(chunk) {
    return new Promise(async (resolve) => {
      const tempUri = FileSystem.cacheDirectory + `chunk_${Date.now()}_${chunk.n || 0}.m4a`;

      // Timeout de sécurité : ne jamais bloquer plus de 2 secondes
      const timeout = setTimeout(() => {
        console.log('⚠️ Chunk playback timeout');
        resolve();
      }, CHUNK_DURATION_MS + 1500);

      try {
        await FileSystem.writeAsStringAsync(tempUri, chunk.d, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: tempUri },
          { shouldPlay: true, volume: 1.0 }
        );

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish || status.error) {
            clearTimeout(timeout);
            sound.unloadAsync().catch(() => {});
            FileSystem.deleteAsync(tempUri, { idempotent: true }).catch(() => {});
            resolve();
          }
        });
      } catch (e) {
        clearTimeout(timeout);
        FileSystem.deleteAsync(tempUri, { idempotent: true }).catch(() => {});
        resolve();
      }
    });
  }

  // ✅ Écouter les chunks audio du partenaire
  _startListeningPartnerAudio() {
    if (!this.coupleId || !this.userId || !database) return;

    const streamRef = ref(database, `couples/${this.coupleId}/calls/audioStream`);
    const callStartTime = this._startTime;

    this._audioListener = onChildAdded(streamRef, (userSnapshot) => {
      const streamUserId = userSnapshot.key;
      if (streamUserId === this.userId) return; // Ignorer mes propres chunks

      console.log('🔊 Partner audio stream detected:', streamUserId);

      // Écouter les NOUVEAUX chunks de ce partenaire
      const partnerStreamRef = ref(database, `couples/${this.coupleId}/calls/audioStream/${streamUserId}`);

      const chunkListener = onChildAdded(partnerStreamRef, (chunkSnapshot) => {
        if (!this.isActive) return;

        const chunk = chunkSnapshot.val();
        if (!chunk?.d) return;

        // Ignorer les chunks trop vieux (avant le début de cet appel)
        if (chunk.t && chunk.t < callStartTime - 2000) return;

        this._playbackQueue.push(chunk);
      });

      // Sauvegarder la référence pour cleanup
      this._partnerListeners.push(partnerStreamRef);
    });
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

    // Retirer les listeners Firebase
    if (this._audioListener && this.coupleId) {
      try {
        const streamRef = ref(database, `couples/${this.coupleId}/calls/audioStream`);
        off(streamRef);
      } catch (e) { /* ignore */ }
      this._audioListener = null;
    }

    // Retirer les listeners de chunks partenaire
    for (const listenerRef of this._partnerListeners) {
      try { off(listenerRef); } catch (e) { /* ignore */ }
    }
    this._partnerListeners = [];

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
    this._isMuted = false;
    this._isSpeaker = false;
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
