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
} from '@livekit/react-native-webrtc';
import { database, isConfigured } from '../config/firebase';
import { ref, set, onValue, push } from 'firebase/database';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

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
    this._iceCandidateListener = null;
  }

  init(coupleId, userId) {
    this.coupleId = coupleId;
    this.userId = userId;
    this._isMuted = false;
    this._isCameraOff = false;
  }

  async getLocalStream(type = 'audio') {
    this.callType = type;
    try {
      const constraints = {
        audio: true,
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
      const pc = new RTCPeerConnection(ICE_SERVERS);

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

      // Suivre l'état de connexion ICE
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log('🧊 ICE state:', state);
        if (state === 'connected' || state === 'completed') {
          if (this.onConnectionStateChange) this.onConnectionStateChange('connected');
        } else if (state === 'failed' || state === 'disconnected') {
          if (this.onConnectionStateChange) this.onConnectionStateChange('disconnected');
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

  _listenForRemoteICECandidates() {
    if (!isConfigured || !database || !this.coupleId || !this.userId) return;
    const iceRef = ref(database, `couples/${this.coupleId}/calls/ice`);
    this._iceCandidateListener = onValue(iceRef, (snapshot) => {
      if (!snapshot.exists() || !this.peerConnection) return;
      const iceData = snapshot.val();
      Object.entries(iceData).forEach(([uid, candidates]) => {
        if (uid !== this.userId && candidates) {
          Object.values(candidates).forEach(candidate => {
            if (candidate && candidate.candidate) {
              this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                .catch(e => console.log('⚠️ Add ICE error:', e.message));
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
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      if (isConfigured && database && this.coupleId) {
        const sdpRef = ref(database, `couples/${this.coupleId}/calls/sdp/answer`);
        await set(sdpRef, { type: answer.type, sdp: answer.sdp });
        console.log('📥 Réponse SDP envoyée');
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
    return true;
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
  }
}

const webrtcService = new WebRTCService();
export default webrtcService;
