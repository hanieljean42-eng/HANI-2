import { CLOUDINARY_CONFIG } from '../config/cloudinary';

export const uploadToCloudinary = async (file) => {
  try {
    console.log('☁️ Upload Cloudinary démarré:', file.name);
    console.log('☁️ URI:', file.uri?.substring(0, 50) + '...');
    
    const formData = new FormData();
    
    // ✅ React Native FormData : l'objet {uri, type, name} est automatiquement 
    // traité comme un fichier par React Native (pas besoin de Blob/File)
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || `upload_${Date.now()}.jpg`,
    });
    formData.append('upload_preset', 'HANI2_couple');

    // ✅ Timeout de 30 secondes pour éviter les blocages
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // ✅ PAS de Content-Type header ! React Native le génère automatiquement
        // avec le bon boundary pour multipart/form-data
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
