// Cloudinary upload utilities v1.0.0
import { CLOUDINARY_CONFIG } from '../config/cloudinary';

export const uploadToCloudinary = async (file) => {
  try {
    console.log('☁️ Upload Cloudinary démarré:', file.name);
    console.log('☁️ URI:', file.uri?.substring(0, 50) + '...');
    
    const formData = new FormData();
    
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || `upload_${Date.now()}.jpg`,
    });
    formData.append('upload_preset', 'HANI2_couple');

    // Détecter si c'est une vidéo pour utiliser le bon endpoint
    const isVideo = file.type?.startsWith('video/') || 
                    /\.(mp4|mov|avi|mkv|webm)$/i.test(file.name || '') ||
                    /\.(mp4|mov|avi|mkv|webm)$/i.test(file.uri || '');
    const resourceType = isVideo ? 'video' : 'image';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), isVideo ? 60000 : 30000);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Cloudinary erreur:', data.error.message);
      throw new Error(data.error.message);
    }

    console.log('✅ Upload Cloudinary réussi:', data.secure_url?.substring(0, 60) + '...');
    return {
      url: data.secure_url,
      publicId: data.public_id
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Upload Cloudinary timeout (30s)');
      throw new Error('Upload trop long. Vérifiez votre connexion internet.');
    }
    console.error('❌ Upload error:', error.message);
    throw error;
  }
};

// Upload audio/vidéo vers Cloudinary (utilise l'endpoint video qui gère aussi l'audio)
export const uploadAudioToCloudinary = async (file) => {
  try {
    console.log('🎤 Upload audio Cloudinary démarré:', file.name);
    
    const formData = new FormData();
    
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'audio/m4a',
      name: file.name || `audio_${Date.now()}.m4a`,
    });
    formData.append('upload_preset', 'HANI2_couple');
    formData.append('resource_type', 'video');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s pour l'audio

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/video/upload`,
      {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Cloudinary audio erreur:', data.error.message);
      throw new Error(data.error.message);
    }

    console.log('✅ Upload audio Cloudinary réussi:', data.secure_url?.substring(0, 60) + '...');
    return {
      url: data.secure_url,
      publicId: data.public_id,
      duration: data.duration // Cloudinary retourne la durée réelle
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Upload audio Cloudinary timeout (60s)');
      throw new Error('Upload audio trop long. Vérifiez votre connexion.');
    }
    console.error('❌ Upload audio error:', error.message);
    throw error;
  }
};

// ⚠️ SÉCURITÉ : La suppression d'assets Cloudinary nécessite une signature
// serveur (api_secret). Ne jamais envoyer api_secret depuis le code client.
// Pour implémenter la suppression, créer une Cloud Function Firebase qui
// signe la requête côté serveur.
export const deleteFromCloudinary = async (publicId) => {
  console.warn('⚠️ deleteFromCloudinary désactivé - la suppression doit être traitée côté serveur.');
  return { result: 'not_implemented' };
};
