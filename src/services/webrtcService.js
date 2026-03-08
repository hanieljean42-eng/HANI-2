// ============================================================
// WebRTC Service — Gestion des appels audio/vidéo peer-to-peer
// ============================================================
// Utilise Firebase Realtime Database pour le signaling (SDP + ICE)
// STUN servers Google gratuits pour NAT traversal
// ============================================================

import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
} from 'react-native-webrtc';

import { database, isConfigured } from '../config/firebase';
import { ref, set, onValue, off, remove, push, onChildAdded } from 'firebase/database';

// Configuration ICE (STUN servers gratuits)
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
    this.callType = null; // 'audio' or 'video'
    this.iceCandidatesRef = null;
    this.sdpListenerUnsubscribe = null;
    this.iceListenerUnsubscribe = null;
    this.onRemoteStream = null;
    this.onLocalStream = null;
    this.onConnectionStateChange = null;
  }

  /**
   * Initialize le service avec les IDs couple/user
   */
  init(coupleId, userId) {
    this.coupleId = coupleId;
    this.userId = userId;
  }

  /**
   * Obtenir le stream local (micro + caméra si vidéo)
   */
  async getLocalStream(type = 'audio') {
    this.callType = type;
    const constraints = {
      audio: true,
      video: type === 'video' ? { facingMode: 'user', width: 640, height: 480 } : false,
    };

    try {
      const stream = await mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      if (this.onLocalStream) this.onLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('❌ WebRTC: Erreur obtention media:', error);
      throw error;
    }
  }

  /**
   * Créer la connexion peer et configurer les handlers
   */
  createPeerConnection() {
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Ajouter les tracks locaux
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // Quand on reçoit le stream distant
    this.peerConnection.ontrack = (event) => {
      console.log('📥 WebRTC: Stream distant reçu');
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        if (this.onRemoteStream) this.onRemoteStream(event.streams[0]);
      }
    };

    // Envoyer les ICE candidates via Firebase
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && isConfigured && database && this.coupleId) {
        const icePath = `couples/${this.coupleId}/calls/ice/${this.userId}`;
        const iceRef = ref(database, icePath);
        const newCandidateRef = push(iceRef);
        set(newCandidateRef, {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
        }).catch(e => console.log('⚠️ ICE send error:', e.message));
      }
    };

    // Surveiller l'état de la connexion
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('🔗 WebRTC: État connexion:', state);
      if (this.onConnectionStateChange) this.onConnectionStateChange(state);
    };

    return this.peerConnection;
  }

  /**
   * Créer et envoyer une offre SDP (côté appelant)
   */
  async createOffer() {
    if (!this.peerConnection || !isConfigured || !database || !this.coupleId) return;

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: this.callType === 'video',
      });
      await this.peerConnection.setLocalDescription(offer);

      // Sauvegarder l'offre sur Firebase
      const sdpRef = ref(database, `couples/${this.coupleId}/calls/sdp/offer`);
      await set(sdpRef, {
        type: offer.type,
        sdp: offer.sdp,
        from: this.userId,
      });

      console.log('📤 WebRTC: Offre SDP envoyée');

      // Écouter la réponse SDP du partenaire
      this.listenForAnswer();
      // Écouter les ICE candidates du partenaire
      this.listenForIceCandidates();
    } catch (error) {
      console.error('❌ WebRTC: Erreur création offre:', error);
    }
  }

  /**
   * Écouter l'offre SDP (côté appelé) et y répondre
   */
  async handleOffer(offerData) {
    if (!this.peerConnection || !isConfigured || !database || !this.coupleId) return;

    try {
      const remoteDesc = new RTCSessionDescription({
        type: offerData.type,
        sdp: offerData.sdp,
      });
      await this.peerConnection.setRemoteDescription(remoteDesc);

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Sauvegarder la réponse sur Firebase
      const sdpRef = ref(database, `couples/${this.coupleId}/calls/sdp/answer`);
      await set(sdpRef, {
        type: answer.type,
        sdp: answer.sdp,
        from: this.userId,
      });

      console.log('📤 WebRTC: Réponse SDP envoyée');

      // Écouter les ICE candidates du partenaire
      this.listenForIceCandidates();
    } catch (error) {
      console.error('❌ WebRTC: Erreur traitement offre:', error);
    }
  }

  /**
   * Écouter la réponse SDP (côté appelant)
   */
  listenForAnswer() {
    if (!isConfigured || !database || !this.coupleId) return;

    const answerRef = ref(database, `couples/${this.coupleId}/calls/sdp/answer`);
    this.sdpListenerUnsubscribe = onValue(answerRef, async (snapshot) => {
      if (snapshot.exists() && this.peerConnection) {
        const data = snapshot.val();
        if (data.from !== this.userId && !this.peerConnection.currentRemoteDescription) {
          try {
            const remoteDesc = new RTCSessionDescription({
              type: data.type,
              sdp: data.sdp,
            });
            await this.peerConnection.setRemoteDescription(remoteDesc);
            console.log('📥 WebRTC: Réponse SDP reçue et appliquée');
          } catch (error) {
            console.error('❌ WebRTC: Erreur application réponse SDP:', error);
          }
        }
      }
    });
  }

  /**
   * Écouter les ICE candidates du partenaire
   */
  listenForIceCandidates() {
    if (!isConfigured || !database || !this.coupleId || !this.userId) return;

    // Déterminer l'ID du partenaire en écoutant les 2 chemins possibles
    const iceBasePath = `couples/${this.coupleId}/calls/ice`;
    const iceBaseRef = ref(database, iceBasePath);

    this.iceListenerUnsubscribe = onValue(iceBaseRef, (snapshot) => {
      if (snapshot.exists()) {
        const allIce = snapshot.val();
        // Chercher les candidates du partenaire (pas les nôtres)
        for (const [senderId, candidates] of Object.entries(allIce)) {
          if (senderId !== this.userId && candidates) {
            for (const [, candidateData] of Object.entries(candidates)) {
              if (candidateData.candidate && this.peerConnection) {
                try {
                  const iceCandidate = new RTCIceCandidate({
                    candidate: candidateData.candidate,
                    sdpMid: candidateData.sdpMid,
                    sdpMLineIndex: candidateData.sdpMLineIndex,
                  });
                  this.peerConnection.addIceCandidate(iceCandidate).catch(() => {});
                } catch (e) {
                  // Ignore duplicates
                }
              }
            }
          }
        }
      }
    });
  }

  /**
   * Basculer micro on/off
   */
  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled; // retourne true si muté
      }
    }
    return false;
  }

  /**
   * Basculer haut-parleur (géré par le composant via InCallManager ou Audio)
   */
  toggleSpeaker() {
    // Le speaker est géré côté UI
    return true;
  }

  /**
   * Basculer caméra avant/arrière
   */
  async switchCamera() {
    if (this.localStream && this.callType === 'video') {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack._switchCamera();
      }
    }
  }

  /**
   * Basculer caméra on/off
   */
  toggleCamera() {
    if (this.localStream && this.callType === 'video') {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled; // retourne true si caméra off
      }
    }
    return false;
  }

  /**
   * Nettoyer tout (fin d'appel)
   */
  async cleanup() {
    console.log('🧹 WebRTC: Nettoyage...');

    // Arrêter l'écoute Firebase
    if (this.sdpListenerUnsubscribe) {
      this.sdpListenerUnsubscribe();
      this.sdpListenerUnsubscribe = null;
    }
    if (this.iceListenerUnsubscribe) {
      this.iceListenerUnsubscribe();
      this.iceListenerUnsubscribe = null;
    }

    // Arrêter les streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream = null;
    }

    // Fermer la connexion peer
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Nettoyer les données de signaling sur Firebase
    if (isConfigured && database && this.coupleId) {
      try {
        const sdpRef = ref(database, `couples/${this.coupleId}/calls/sdp`);
        const iceRef = ref(database, `couples/${this.coupleId}/calls/ice`);
        await set(sdpRef, null);
        await set(iceRef, null);
      } catch (e) {
        console.log('⚠️ WebRTC cleanup Firebase error:', e.message);
      }
    }

    this.onRemoteStream = null;
    this.onLocalStream = null;
    this.onConnectionStateChange = null;
    this.callType = null;
  }
}

// Singleton
const webrtcService = new WebRTCService();
export default webrtcService;
