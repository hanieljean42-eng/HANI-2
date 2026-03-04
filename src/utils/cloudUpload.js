// Cloudinary upload utilities v1.0.0
import { CLOUDINARY_CONFIG } from '../config/cloudinary';

export const uploadToCloudinary = async (file) => {
  try {
    console.log('Ã¢ËœÂÃ¯Â¸Â Upload Cloudinary dÃƒÂ©marrÃƒÂ©:', file.name);
    console.log('Ã¢ËœÂÃ¯Â¸Â URI:', file.uri?.substring(0, 50) + '...');
    
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
      console.error('Ã¢ÂÅ’ Cloudinary erreur:', data.error.message);
      throw new Error(data.error.message);
    }

    console.log('Ã¢Å“â€¦ Upload Cloudinary rÃƒÂ©ussi:', data.secure_url?.substring(0, 60) + '...');
    return {
      url: data.secure_url,
      publicId: data.public_id
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Ã¢ÂÅ’ Upload Cloudinary timeout (30s)');
      throw new Error('Upload trop long. VÃƒÂ©rifiez votre connexion internet.');
    }
    console.error('Ã¢ÂÅ’ Upload error:', error.message);
    throw error;
  }
};

// Upload audio/vidÃƒÂ©o vers Cloudinary (utilise l'endpoint video qui gÃƒÂ¨re aussi l'audio)
export const uploadAudioToCloudinary = async (file) => {
  try {
    console.log('Ã°Å¸Å½Â¤ Upload audio Cloudinary dÃƒÂ©marrÃƒÂ©:', file.name);
    
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
      console.error('Ã¢ÂÅ’ Cloudinary audio erreur:', data.error.message);
      throw new Error(data.error.message);
    }

    console.log('Ã¢Å“â€¦ Upload audio Cloudinary rÃƒÂ©ussi:', data.secure_url?.substring(0, 60) + '...');
    return {
      url: data.secure_url,
      publicId: data.public_id,
      duration: data.duration // Cloudinary retourne la durÃƒÂ©e rÃƒÂ©elle
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Ã¢ÂÅ’ Upload audio Cloudinary timeout (60s)');
      throw new Error('Upload audio trop long. VÃƒÂ©rifiez votre connexion.');
    }
    console.error('Ã¢ÂÅ’ Upload audio error:', error.message);
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
