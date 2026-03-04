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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
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

export const deleteFromCloudinary = async (publicId) => {
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          public_id: publicId,
          api_key: CLOUDINARY_CONFIG.apiKey,
          api_secret: CLOUDINARY_CONFIG.apiSecret
        })
      }
    );

    return await response.json();
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
};
