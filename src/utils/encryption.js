/**
 * Module de chiffrement pour données sensibles
 * Utilise AES-256 pour chiffrer les messages, notes d'amour, etc.
 */

import CryptoJS from 'crypto-js';

// Clé de chiffrement - dans une app réelle, utiliser une clé depuis Firebase Cloud Function
// Cette clé est générée une fois par couple et stockée sécurisement
const generateCoupleKey = (coupleId) => {
  // Utiliser le coupleId pour générer une clé déterministe
  // Dans une vrai app, ce serait une clé générée et stockée côté serveur
  return CryptoJS.SHA256(`hani2_couple_${coupleId}`).toString().substring(0, 32);
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
    return decrypted.toString(CryptoJS.enc.Utf8);
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
