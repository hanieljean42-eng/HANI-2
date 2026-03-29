// ============================================================
// WebRTC Service — Vrais appels audio/vidéo peer-to-peer
// Utilise @livekit/react-native-webrtc (binaire sur Maven Central)
// Signaling via Firebase Realtime Database
// ============================================================

import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
} from 'react-native-webrtc';
import { Audio } from 'expo-av';
import { database, isConfigured } from '../config/firebase';
import { ref, set, get, push, onValue, onChildAdded, off } from 'firebase/database';

// ============================================================
// Configuration TURN — OBLIGATOIRE pour appels entre réseaux
// différents (4G ↔ WiFi, deux opérateurs différents).
//
// ⚠️  Pour activer le TURN dynamique (recommandé) :
//  1. Créer un compte GRATUIT sur https://www.metered.ca/stun-turn
//  2. Créer une app (ex: "hani2")
//  3. Copier l'API key depuis le dashboard
//  4. Renseigner METERED_APP et METERED_API_KEY ci-dessous
// ============================================================

const METERED_APP = 'hani-2';                          // Nom de l'app sur Metered.ca
const METERED_API_KEY = '69c9499c6a209cb238ff409d';    // API key Metered.ca

// Serveurs STUN Google (toujours disponibles, gratuits)
// + freestun.net (TURN public gratuit, supporte les NAT symétriques)
const FALLBACK_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  // FreeTURN — serveur TURN public gratuit (freestun.net)
  { urls: 'stun:freestun.net:3478' },
  { urls: 'turn:freestun.net:3478',  username: 'free', credential: 'free' },
  { urls: 'turn:freestun.net:3479',  username: 'free', credential: 'free' },
  { urls: 'turns:freestun.net:5349', username: 'free', credential: 'free' },
];

// Récupère des credentials TURN frais depuis Metered.ca (ne jamais expirer)
async function fetchIceServers() {
  if (!METERED_API_KEY) {
    console.log('⚠️  TURN: utilisation du fallback freestun.net (configurez Metered.ca pour plus de fiabilité)');
    return FALLBACK_ICE_SERVERS;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(
      `https://${METERED_APP}.metered.live/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    const servers = await response.json();
    if (Array.isArray(servers) && servers.length > 0) {
      console.log('✅ TURN credentials Metered.ca obtenus (' + servers.length + ' serveurs)');
      return [...FALLBACK_ICE_SERVERS.slice(0, 5), ...servers];
    }
  } catch (e) {
    console.log('⚠️  Metered.ca indisponible, fallback freestun.net');
  }
  return FALLBACK_ICE_SERVERS;
}

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.coupleId = null;
    this.userId = null;
    this.callType = null;
    this.onRemoteStream = null;
    this.onLocalStream = null;
    this.onConnectionStateChange = null;
    this._isMuted = false;
    this._isCameraOff = false;
    this._isSpeaker = true;  // ✅ Haut-parleur par défaut
    this._iceCandidateListener = null;
    this._pendingCandidates = []; // ✅ Buffer ICE candidates avant remoteDescription
    this._addedCandidates = new Set(); // ✅ Éviter les doublons
    this._cachedIceServers = null; // ✅ Cache des serveurs ICE (chargés avant l'appel)
  }

  init(coupleId, userId) {
    this.coupleId = coupleId;
    this.userId = userId;
    this._isMuted = false;
    this._isCameraOff = false;
    this._isSpeaker = true;  // ✅ Haut-parleur par défaut
    this._cachedIceServers = null;
    this._pendingCandidates = [];
    this._addedCandidates = new Set();
    this._iceRestartCount = 0;
  }

  async getLocalStream(type = 'audio') {
    this.callType = type;
    try {
      // ✅ Demander la permission micro avant getUserMedia
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('❌ Permission micro refusée');
        return null;
      }

      // ✅ Pré-charger les serveurs ICE (TURN) pendant qu'on attend getUserMedia
      this._cachedIceServers = await fetchIceServers();

      // ✅ Configurer le mode audio pour un appel (haut-parleur)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false, // Haut-parleur
      }).catch(() => {});

      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: type === 'video' ? { facingMode: 'user', width: 640, height: 480 } : false,
      };
      const stream = await mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      console.log('📱 Stream local obtenu:', type);
      if (this.onLocalStream) this.onLocalStream(stream);
      return stream;
    } catch (error) {
      console.log('⚠️ Erreur getLocalStream:', error.message);
      return null;
    }
  }

  createPeerConnection() {
    try {
      const iceConfig = {
        iceServers: this._cachedIceServers || FALLBACK_ICE_SERVERS,
        iceCandidatePoolSize: 10,
      };
      const pc = new RTCPeerConnection(iceConfig);

      // Ajouter les pistes locales
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          pc.addTrack(track, this.localStream);
        });
      }

      // Recevoir les pistes distantes
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          this.remoteStream = event.streams[0];
          console.log('📡 Stream distant reçu');
          if (this.onRemoteStream) this.onRemoteStream(event.streams[0]);
        }
      };

      // Envoyer les ICE candidates via Firebase
      pc.onicecandidate = (event) => {
        if (event.candidate && isConfigured && database && this.coupleId) {
          const iceRef = ref(database, `couples/${this.coupleId}/calls/ice/${this.userId}`);
          const newCandidateRef = push(iceRef);
          set(newCandidateRef, event.candidate.toJSON()).catch(e =>
            console.log('⚠️ ICE send error:', e.message)
          );
        }
      };

      // ✅ Suivre l'état de connexion ICE + ICE restart automatique si échec
      this._iceRestartCount = 0;
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log('🧊 ICE state:', state);
        if (state === 'connected' || state === 'completed') {
          this._iceRestartCount = 0; // Reset compteur
          if (this.onConnectionStateChange) this.onConnectionStateChange('connected');
        } else if (state === 'failed') {
          // ✅ ICE restart automatique (max 3 tentatives)
          if (this._iceRestartCount < 3 && this.peerConnection) {
            this._iceRestartCount++;
            console.log(`🔄 ICE restart tentative ${this._iceRestartCount}/3...`);
            this.peerConnection.restartIce();
          } else {
            console.log('❌ ICE failed après 3 tentatives');
            if (this.onConnectionStateChange) this.onConnectionStateChange('disconnected');
          }
        } else if (state === 'disconnected') {
          // Attendre 3s avant de signaler — peut se reconnecter tout seul
          setTimeout(() => {
            if (this.peerConnection && this.peerConnection.iceConnectionState === 'disconnected') {
              console.log('⚠️ ICE toujours déconnecté après 3s');
              if (this.onConnectionStateChange) this.onConnectionStateChange('disconnected');
            }
          }, 3000);
        }
      };

      this.peerConnection = pc;
      this._listenForRemoteICECandidates();
      return pc;
    } catch (error) {
      console.log('⚠️ Erreur createPeerConnection:', error.message);
      return null;
    }
  }

  // ✅ Ajouter un ICE candidate (avec buffer si remoteDescription pas encore défini)
  async _addIceCandidate(candidate) {
    if (!this.peerConnection || !candidate?.candidate) return;
    
    // Clé unique pour éviter les doublons
    const candidateKey = candidate.candidate + candidate.sdpMid;
    if (this._addedCandidates.has(candidateKey)) return;
    
    // Si remoteDescription pas encore défini, mettre en buffer
    if (!this.peerConnection.remoteDescription) {
      this._pendingCandidates.push(candidate);
      console.log('📦 ICE candidate mis en buffer (en attente de remoteDescription)');
      return;
    }
    
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      this._addedCandidates.add(candidateKey);
    } catch (e) {
      console.log('⚠️ Add ICE error:', e.message);
    }
  }

  // ✅ Vider le buffer des ICE candidates après setRemoteDescription
  async _flushPendingCandidates() {
    console.log(`🔄 Flush ${this._pendingCandidates.length} ICE candidates en attente`);
    const pending = [...this._pendingCandidates];
    this._pendingCandidates = [];
    for (const candidate of pending) {
      await this._addIceCandidate(candidate);
    }
  }

  _listenForRemoteICECandidates() {
    if (!isConfigured || !database || !this.coupleId || !this.userId) return;
    
    // Écouter les candidates de CHAQUE autre utilisateur
    const iceRef = ref(database, `couples/${this.coupleId}/calls/ice`);
    this._iceCandidateListener = onValue(iceRef, (snapshot) => {
      if (!snapshot.exists() || !this.peerConnection) return;
      const iceData = snapshot.val();
      Object.entries(iceData).forEach(([uid, candidates]) => {
        if (uid !== this.userId && candidates) {
          Object.values(candidates).forEach(candidate => {
            if (candidate && candidate.candidate) {
              this._addIceCandidate(candidate);
            }
          });
        }
      });
    });
  }

  async createOffer() {
    if (!this.peerConnection || !isConfigured || !database || !this.coupleId) return;
    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: this.callType === 'video',
      });
      await this.peerConnection.setLocalDescription(offer);
      const sdpRef = ref(database, `couples/${this.coupleId}/calls/sdp/offer`);
      await set(sdpRef, { type: offer.type, sdp: offer.sdp });
      console.log('📤 Offre SDP envoyée');

      // Écouter la réponse SDP du partenaire (cleanup ancien listener si existant)
      if (this._answerListener) {
        this._answerListener();
        this._answerListener = null;
      }
      const answerRef = ref(database, `couples/${this.coupleId}/calls/sdp/answer`);
      const answerListener = onValue(answerRef, async (snap) => {
        if (snap.exists() && this.peerConnection && !this.peerConnection.remoteDescription) {
          try {
            await this.handleAnswer(snap.val());
          } catch (e) {
            console.log('⚠️ Apply answer error:', e.message);
          }
        }
      });
      // Stocker pour cleanup
      this._answerListener = answerListener;
    } catch (error) {
      console.log('⚠️ Erreur createOffer:', error.message);
    }
  }

  async handleOffer(offerData) {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offerData));
      console.log('📥 Remote description (offer) appliquée');
      // ✅ Flush les ICE candidates qui étaient en attente
      await this._flushPendingCandidates();
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      if (isConfigured && database && this.coupleId) {
        const sdpRef = ref(database, `couples/${this.coupleId}/calls/sdp/answer`);
        await set(sdpRef, { type: answer.type, sdp: answer.sdp });
        console.log('� Réponse SDP envoyée');
      }
    } catch (error) {
      console.log('⚠️ Erreur handleOffer:', error.message);
    }
  }

  async handleAnswer(answerData) {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answerData));
      console.log('✅ Réponse SDP appliquée');
      // ✅ Flush les ICE candidates qui étaient en attente
      await this._flushPendingCandidates();
    } catch (error) {
      console.log('⚠️ Erreur handleAnswer:', error.message);
    }
  }

  toggleMute() {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    }
    this._isMuted = !this._isMuted;
    return this._isMuted;
  }

  toggleSpeaker() {
    this._isSpeaker = !this._isSpeaker;
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: !this._isSpeaker, // false = speaker, true = écouteur
    }).catch(() => {});
    console.log(`🔊 Speaker ${this._isSpeaker ? 'ON' : 'OFF'}`);
    return this._isSpeaker;
  }

  async switchCamera() {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0]._switchCamera();
      }
    }
  }

  toggleCamera() {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    }
    this._isCameraOff = !this._isCameraOff;
    return this._isCameraOff;
  }

  async cleanup() {
    console.log('🧹 WebRTC cleanup');
    // ✅ Réinitialiser le mode audio
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) { /* ignore */ }

    if (this._iceCandidateListener) {
      this._iceCandidateListener();
      this._iceCandidateListener = null;
    }
    if (this._answerListener) {
      this._answerListener();
      this._answerListener = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    this.remoteStream = null;
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (isConfigured && database && this.coupleId) {
      try {
        const sdpRef = ref(database, `couples/${this.coupleId}/calls/sdp`);
        const iceRef = ref(database, `couples/${this.coupleId}/calls/ice`);
        await set(sdpRef, null);
        await set(iceRef, null);
      } catch (e) {
        console.log('⚠️ WebRTC cleanup error:', e.message);
      }
    }
    this.onRemoteStream = null;
    this.onLocalStream = null;
    this.onConnectionStateChange = null;
    this.callType = null;
    this._isMuted = false;
    this._isCameraOff = false;
    this._pendingCandidates = [];
    this._addedCandidates = new Set();
  }
}

const webrtcService = new WebRTCService();
export default webrtcService;
