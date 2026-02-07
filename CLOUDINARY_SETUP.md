# ☁️ CLOUDINARY - GUIDE COMPLET (GRATUIT 10 Go)

Stockage d'images/vidéos **100% GRATUIT** sans carte de crédit !

---

## 📍 ÉTAPE 1️⃣: CRÉER UN COMPTE CLOUDINARY

**Aller à:** https://cloudinary.com/users/register/free

1. Cliquer **Sign Up**
2. Remplir le formulaire (email, mot de passe)
3. Valider l'email
4. **ZÉRO carte de crédit demandée ✅**

---

## 📍 ÉTAPE 2️⃣: RÉCUPÉRER TES CREDENTIALS

**Aller à:** https://console.cloudinary.com/settings/general

Tu verras:
- `Cloud Name` (ex: "your-cloud-name")
- `API Key` (ex: "123456789")
- `API Secret` (ex: "abcdefgh...")

**Copier ces 3 valeurs !**

---

## 📍 ÉTAPE 3️⃣: AJOUTER CLOUDINARY AU CODE

**Installer le package:**

```bash
npm install cloudinary-react
```

**Créer `src/config/cloudinary.js`:**

```javascript
export const CLOUDINARY_CONFIG = {
  cloudName: 'YOUR_CLOUD_NAME',
  apiKey: 'YOUR_API_KEY',
  apiSecret: 'YOUR_API_SECRET'
};
```

**Remplacer les 3 valeurs par celles de Cloudinary !**

---

## 📍 ÉTAPE 4️⃣: CRÉER L'UTILITAIRE D'UPLOAD

**Créer `src/utils/uploadToCloudinary.js`:**

```javascript
import { CLOUDINARY_CONFIG } from '../config/cloudinary';

export const uploadToCloudinary = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'hani2_couple');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    const data = await response.json();
    
    if (data.error) throw new Error(data.error.message);
    
    return {
      url: data.secure_url,
      publicId: data.public_id
    };
  } catch (error) {
    console.error('❌ Upload Cloudinary:', error);
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
    console.error('❌ Delete Cloudinary:', error);
    throw error;
  }
};
```

---

## 📍 ÉTAPE 5️⃣: CRÉER UN UPLOAD PRESET

**Aller à:** https://console.cloudinary.com/settings/upload

1. Cliquer **Add upload preset**
2. Nom: `hani2_couple`
3. Mode: **Unsigned** (important !)
4. Cliquer **Save**

---

## 📍 ÉTAPE 6️⃣: UTILISER DANS LE CODE

**Exemple dans MemoriesScreen.js:**

```javascript
import { uploadToCloudinary } from '../utils/uploadToCloudinary';

const handleImageUpload = async (imageUri) => {
  try {
    const file = {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'memory.jpg'
    };

    const { url, publicId } = await uploadToCloudinary(file);

    const memory = {
      id: `memory_${Date.now()}`,
      imageUri: url,
      publicId: publicId,
      createdAt: new Date().toISOString()
    };

    // Sauvegarder dans Firebase Realtime Database
    await set(ref(database, `couples/${coupleId}/data/memories/${memory.id}`), memory);
    
  } catch (error) {
    console.error('Erreur upload:', error);
  }
};
```

---

## 📍 ÉTAPE 7️⃣: VÉRIFIER LE QUOTA

**Aller à:** https://console.cloudinary.com/console

Tu verras:
- **Quota gratuit:** 10 Go
- **Usage actuel:** (nombre de fichiers)

---

## ✅ CHECKLIST

- [ ] Compte Cloudinary créé (gratuit, zéro carte)
- [ ] Cloud Name, API Key, API Secret copiés
- [ ] `src/config/cloudinary.js` créé
- [ ] `src/utils/uploadToCloudinary.js` créé
- [ ] Upload Preset `hani2_couple` créé (Unsigned)
- [ ] Package `cloudinary-react` installé
- [ ] Code adapté pour utiliser uploadToCloudinary

✅ **GRATUIT ILLIMITÉ (10 Go/mois) !**
