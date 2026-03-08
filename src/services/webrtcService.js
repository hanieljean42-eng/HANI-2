// ============================================================
// WebRTC Service — STUB (react-native-webrtc temporairement retiré)
// jitpack.io est down (erreur 521), impossible de build avec le module natif
// Ce stub garde la même API pour que le reste du code fonctionne
// Les appels fonctionnent en mode signaling-only (notification + timer)
// ============================================================

import { database, isConfigured } from '../config/firebase';
import { ref, set, onValue, remove, push } from 'firebase/database';

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
    // État interne pour les toggles
    this._isMuted = false;
    this._isCameraOff = false;
    this._isSpeaker = false;
  }

  init(coupleId, userId) {
    this.coupleId = coupleId;
    this.userId = userId;
    this._isMuted = false;
    this._isCameraOff = false;
    this._isSpeaker = false;
  }

  async getLocalStream(type = 'audio') {
    this.callType = type;
    console.log('📱 WebRTC stub: mode signaling-only (audio/vidéo natif indisponible)');
    return null;
  }

  createPeerConnection() {
    setTimeout(() => {
      if (this.onConnectionStateChange) this.onConnectionStateChange('connected');
    }, 2000);
    return null;
  }

  async createOffer() {
    console.log('📤 WebRTC stub: offre simulée');
  }

  async handleOffer() {
    console.log('📥 WebRTC stub: réponse simulée');
    setTimeout(() => {
      if (this.onConnectionStateChange) this.onConnectionStateChange('connected');
    }, 1500);
  }

  toggleMute() {
    this._isMuted = !this._isMuted;
    return this._isMuted;
  }

  toggleSpeaker() {
    this._isSpeaker = !this._isSpeaker;
    return this._isSpeaker;
  }

  async switchCamera() {
    // Stub — pas de caméra native disponible
    console.log('📷 switchCamera stub');
  }

  toggleCamera() {
    this._isCameraOff = !this._isCameraOff;
    return this._isCameraOff;
  }

  async cleanup() {
    console.log('🧹 WebRTC stub: nettoyage');
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
    this._isSpeaker = false;
  }
}

const webrtcService = new WebRTCService();
export default webrtcService;
