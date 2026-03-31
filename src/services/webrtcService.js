// ============================================================
// WebRTC Service — Vrais appels audio/vidéo peer-to-peer
// Utilise @livekit/react-native-webrtc (binaire sur Maven Central)
// Signaling via Firebase Realtime Database
// ============================================================

import { Audio } from 'expo-av';
import { database, isConfigured } from '../config/firebase';
import { ref, set, push, onValue } from 'firebase/database';

let RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, mediaDevices;
try {
  const webrtc = require('react-native-webrtc');
  RTCPeerConnection     = webrtc.RTCPeerConnection;
  RTCSessionDescription = webrtc.RTCSessionDescription;
  RTCIceCandidate       = webrtc.RTCIceCandidate;
  mediaDevices          = webrtc.mediaDevices;
} catch (e) {
  console.warn('⚠️ react-native-webrtc non disponible:', e.message);
}

// ✅ OpenRelay — TURN public gratuit, fiable, sans compte nécessaire
// Source : https://www.metered.ca/tools/openrelay/
const ICE_SERVERS = [
  // STUN Google (détection IP publique)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:openrelay.metered.ca:80' },
  // TURN OpenRelay — relay obligatoire pour NAT symétrique (4G ↔ WiFi)
  { urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject' },
  { urls: 'turns:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject' },
  // freestun.net — backup supplémentaire
  { urls: 'turn:freestun.net:3478',  username: 'free', credential: 'free' },
  { urls: 'turns:freestun.net:5349', username: 'free', credential: 'free' },
];

async function fetchIceServers() {
  // OpenRelay fonctionne sans API key — utilisé directement
  console.log('✅ Serveurs ICE chargés (' + ICE_SERVERS.length + ' entrées STUN/TURN)');
  return ICE_SERVERS;
}

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.coupleId = null;
    this.userId = null;
    this.roomId = null;          // ✅ Session unique — isole chaque appel
    this.callType = null;
    this.onRemoteStream = null;
    this.onLocalStream = null;
    this.onConnectionStateChange = null;
    this._isMuted = false;
    this._isCameraOff = false;
    this._isSpeaker = true;
    this._iceCandidateListener = null;
    this._answerListener = null;
    this._pendingCandidates = [];
    this._addedCandidates = new Set();
    this._cachedIceServers = null;
    this._iceRestartCount = 0;
  }

  // roomId OBLIGATOIRE : isole chaque session d'appel dans Firebase
  init(coupleId, userId, roomId) {
    if (this._iceCandidateListener) {
      try { this._iceCandidateListener(); } catch(e) {}
      this._iceCandidateListener = null;
    }
    if (this._answerListener) {
      try { this._answerListener(); } catch(e) {}
      this._answerListener = null;
    }
    if (this.peerConnection) {
      try { this.peerConnection.close(); } catch(e) {}
      this.peerConnection = null;
    }
    if (this.localStream) {
      try { this.localStream.getTracks().forEach(t => t.stop()); } catch(e) {}
      this.localStream = null;
    }
    this.remoteStream = null;
    this.coupleId = coupleId;
    this.userId = userId;
    this.roomId = roomId;  // ✅ Clé d'isolation de session
    this._isMuted = false;
    this._isCameraOff = false;
    this._isSpeaker = true;
    this._cachedIceServers = null;
    this._pendingCandidates = [];
    this._addedCandidates = new Set();
    this._iceRestartCount = 0;
  }

  async getLocalStream(type = 'audio') {
    if (!mediaDevices) { console.warn('⚠️ WebRTC indisponible'); return null; }
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
    if (!RTCPeerConnection) { console.warn('⚠️ WebRTC indisponible'); return null; }
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

      // Envoyer les ICE candidates via Firebase — path scopé à la session
      pc.onicecandidate = (event) => {
        if (event.candidate && isConfigured && database && this.coupleId && this.roomId) {
          const iceRef = ref(database,
            `couples/${this.coupleId}/calls/sessions/${this.roomId}/ice/${this.userId}`);
          push(iceRef, event.candidate.toJSON()).catch(e =>
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
    if (!isConfigured || !database || !this.coupleId || !this.userId || !this.roomId) return;
    // Path scopé à la session — impossible de lire des ICE d'un autre appel
    const iceRef = ref(database,
      `couples/${this.coupleId}/calls/sessions/${this.roomId}/ice`);
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
    if (!this.peerConnection || !isConfigured || !database || !this.coupleId || !this.roomId) return;
    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: this.callType === 'video',
      });
      await this.peerConnection.setLocalDescription(offer);
      // Path scopé à la session
      const sdpRef = ref(database,
        `couples/${this.coupleId}/calls/sessions/${this.roomId}/sdp/offer`);
      await set(sdpRef, { type: offer.type, sdp: offer.sdp });
      console.log(`📤 Offre SDP envoyée [session: ${this.roomId}]`);

      if (this._answerListener) {
        this._answerListener();
        this._answerListener = null;
      }
      const answerRef = ref(database,
        `couples/${this.coupleId}/calls/sessions/${this.roomId}/sdp/answer`);
      this._answerListener = onValue(answerRef, async (snap) => {
        if (snap.exists() && this.peerConnection && !this.peerConnection.remoteDescription) {
          try {
            await this.handleAnswer(snap.val());
          } catch (e) {
            console.log('⚠️ Apply answer error:', e.message);
          }
        }
      });
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
        const sdpRef = ref(database,
          `couples/${this.coupleId}/calls/sessions/${this.roomId}/sdp/answer`);
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
    console.log(`🧹 WebRTC cleanup [session: ${this.roomId}]`);
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
      try { this._iceCandidateListener(); } catch(e) {}
      this._iceCandidateListener = null;
    }
    if (this._answerListener) {
      try { this._answerListener(); } catch(e) {}
      this._answerListener = null;
    }
    if (this.localStream) {
      try { this.localStream.getTracks().forEach(track => track.stop()); } catch(e) {}
      this.localStream = null;
    }
    this.remoteStream = null;
    if (this.peerConnection) {
      try { this.peerConnection.close(); } catch(e) {}
      this.peerConnection = null;
    }
    // Nettoyer UNIQUEMENT la session courante — les autres sessions ne sont pas touchées
    if (isConfigured && database && this.coupleId && this.roomId) {
      try {
        const sessionRef = ref(database,
          `couples/${this.coupleId}/calls/sessions/${this.roomId}`);
        await set(sessionRef, null);
      } catch (e) {
        console.log('⚠️ WebRTC cleanup error:', e.message);
      }
    }
    this.onRemoteStream = null;
    this.onLocalStream = null;
    this.onConnectionStateChange = null;
    this.callType = null;
    this.roomId = null;
    this._isMuted = false;
    this._isCameraOff = false;
    this._pendingCandidates = [];
    this._addedCandidates = new Set();
  }
}

const webrtcService = new WebRTCService();
export default webrtcService;
