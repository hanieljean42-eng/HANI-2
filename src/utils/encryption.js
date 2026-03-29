/**
 * Module de chiffrement pour données sensibles
 * Utilise AES-256 pour chiffrer les messages, notes d'amour, etc.
 * Utilise PBKDF2 pour le hachage des mots de passe et des PINs.
 */

import CryptoJS from 'crypto-js';

// ─── Sels statiques (application) ───────────────────────────────────────────
// Ces sels sont publics ; la sécurité repose sur les itérations PBKDF2.
const _PWD_SALT  = CryptoJS.enc.Utf8.parse('HANI2_PWD_SALT_v1_2024');
const _PIN_SALT  = CryptoJS.enc.Utf8.parse('HANI2_PIN_SALT_v1_2024');
const _KEY_SALT  = CryptoJS.enc.Utf8.parse('HANI2_KEY_SALT_v1_2024');

// Préfixes pour distinguer hachages modernes des anciennes valeurs en clair
const PWD_HASH_PREFIX = 'v2:';
const PIN_HASH_PREFIX = 'p2:';

// ─── Dérivation de la clé de chiffrement de couple (PBKDF2) ─────────────────
const generateCoupleKey = (coupleId) => {
  return CryptoJS.PBKDF2(`HANI2_E2E_${coupleId}`, _KEY_SALT, {
    keySize: 8,        // 256 bits
    iterations: 5000,
  }).toString().substring(0, 32);
};

// ─── Hachage des mots de passe ───────────────────────────────────────────────

/**
 * Hache un mot de passe avec PBKDF2 (100 000 itérations).
 * Le résultat est préfixé par "v2:" pour identifier le format.
 */
export const hashPassword = (password) => {
  if (!password) return '';
  const hash = CryptoJS.PBKDF2(password, _PWD_SALT, {
    keySize: 8,        // 256 bits
    iterations: 100000,
  }).toString();
  return PWD_HASH_PREFIX + hash;
};

/**
 * Vérifie un mot de passe contre un hash stocké.
 * Supporte la migration : si le hash n'a pas le préfixe "v2:", c'est un ancien
 * mot de passe en clair ; la comparaison directe est utilisée une dernière fois.
 */
export const verifyPassword = (plainPassword, stored) => {
  if (!plainPassword || !stored) return false;
  if (stored.startsWith(PWD_HASH_PREFIX)) {
    return hashPassword(plainPassword) === stored;
  }
  // Rétro-compatibilité : ancien mot de passe en clair
  return plainPassword === stored;
};

// ─── Hachage des PINs ────────────────────────────────────────────────────────

/**
 * Hache un PIN avec PBKDF2.
 * Préfixé par "p2:" pour identifier le format.
 */
export const hashPin = (pin) => {
  if (!pin) return '';
  const hash = CryptoJS.PBKDF2(pin, _PIN_SALT, {
    keySize: 4,        // 128 bits (suffisant pour PIN court)
    iterations: 50000,
  }).toString();
  return PIN_HASH_PREFIX + hash;
};

/**
 * Vérifie un PIN contre un hash stocké.
 * Supporte la migration depuis les anciens PINs en clair.
 */
export const verifyPin = (inputPin, stored) => {
  if (!inputPin || !stored) return false;
  if (stored.startsWith(PIN_HASH_PREFIX)) {
    return hashPin(inputPin) === stored;
  }
  // Rétro-compatibilité : ancien PIN en clair
  return inputPin === stored;
};

// ─── Sanitisation des chemins Firebase ──────────────────────────────────────

/**
 * Nettoie une chaîne destinée à être utilisée comme segment de chemin Firebase.
 * Supprime les caractères interdits : . # $ / [ ]
 */
export const sanitizeFirebasePath = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[.#$/[\]]/g, '').trim().substring(0, 255);
};

/**
 * Chiffrer du texte avec AES-256
 * @param {string} plainText - Texte à chiffrer
 * @param {string} coupleId - ID du couple (pour générer la clé)
 * @returns {string} Texte chiffré en base64
 */
export const encryptMessage = (plainText, coupleId) => {
  try {
    if (!plainText || !coupleId) return plainText;
    
    const key = generateCoupleKey(coupleId);
    const encrypted = CryptoJS.AES.encrypt(plainText, key);
    return encrypted.toString();
  } catch (error) {
    console.error('❌ Erreur chiffrement:', error);
    return plainText; // Fallback : retourner en clair si erreur
  }
};

/**
 * Déchiffrer du texte AES-256
 * @param {string} encryptedText - Texte chiffré
 * @param {string} coupleId - ID du couple (pour générer la clé)
 * @returns {string} Texte déchiffré
 */
export const decryptMessage = (encryptedText, coupleId) => {
  try {
    if (!encryptedText || !coupleId) return encryptedText;
    
    // Vérifier si c'est du texte chiffré (commence par "U2F" qui est base64 de "\x53\x61\x6c\x74")
    if (!encryptedText.includes('U2F')) {
      return encryptedText; // Pas chiffré, retourner tel quel
    }
    
    const key = generateCoupleKey(coupleId);
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    if (!result || result.length === 0) return encryptedText;
    return result;
  } catch (error) {
    console.error('❌ Erreur déchiffrement:', error);
    return encryptedText; // Fallback
  }
};

/**
 * Chiffrer un objet JSON
 * @param {object} obj - Objet à chiffrer
 * @param {string} coupleId - ID du couple
 * @returns {object} Objet avec champs sensibles chiffrés
 */
export const encryptMessageObject = (messageObj, coupleId) => {
  if (!messageObj) return messageObj;
  
  return {
    ...messageObj,
    content: encryptMessage(messageObj.content, coupleId),
  };
};

/**
 * Déchiffrer un objet JSON
 * @param {object} messageObj - Objet chiffré
 * @param {string} coupleId - ID du couple
 * @returns {object} Objet avec champs déchiffrés
 */
export const decryptMessageObject = (messageObj, coupleId) => {
  if (!messageObj) return messageObj;
  
  return {
    ...messageObj,
    content: decryptMessage(messageObj.content, coupleId),
  };
};

/**
 * Chiffrer une note d'amour
 */
export const encryptLoveNote = (noteObj, coupleId) => {
  return {
    ...noteObj,
    text: encryptMessage(noteObj.text, coupleId),
  };
};

/**
 * Déchiffrer une note d'amour
 */
export const decryptLoveNote = (noteObj, coupleId) => {
  return {
    ...noteObj,
    text: decryptMessage(noteObj.text, coupleId),
  };
};
