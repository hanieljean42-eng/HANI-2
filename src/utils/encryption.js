/**
 * Module de chiffrement pour donnÃ©es sensibles
 * Utilise AES-256 pour chiffrer les messages, notes d'amour, etc.
 * v1.0.0
 */

import CryptoJS from 'crypto-js';

// ClÃ© de chiffrement - dans une app rÃ©elle, utiliser une clÃ© depuis Firebase Cloud Function
// Cette clÃ© est gÃ©nÃ©rÃ©e une fois par couple et stockÃ©e sÃ©curisement
const generateCoupleKey = (coupleId) => {
  // Utiliser le coupleId pour gÃ©nÃ©rer une clÃ© dÃ©terministe
  // Dans une vrai app, ce serait une clÃ© gÃ©nÃ©rÃ©e et stockÃ©e cÃ´tÃ© serveur
  return CryptoJS.SHA256(`hani2_couple_${coupleId}`).toString().substring(0, 32);
};

/**
 * Chiffrer du texte avec AES-256
 * @param {string} plainText - Texte Ã  chiffrer
 * @param {string} coupleId - ID du couple (pour gÃ©nÃ©rer la clÃ©)
 * @returns {string} Texte chiffrÃ© en base64
 */
export const encryptMessage = (plainText, coupleId) => {
  try {
    if (!plainText || !coupleId) return plainText;
    
    const key = generateCoupleKey(coupleId);
    const encrypted = CryptoJS.AES.encrypt(plainText, key);
    return encrypted.toString();
  } catch (error) {
    console.error('âŒ Erreur chiffrement:', error);
    return plainText; // Fallback : retourner en clair si erreur
  }
};

/**
 * DÃ©chiffrer du texte AES-256
 * @param {string} encryptedText - Texte chiffrÃ©
 * @param {string} coupleId - ID du couple (pour gÃ©nÃ©rer la clÃ©)
 * @returns {string} Texte dÃ©chiffrÃ©
 */
export const decryptMessage = (encryptedText, coupleId) => {
  try {
    if (!encryptedText || !coupleId) return encryptedText;
    
    // VÃ©rifier si c'est du texte chiffrÃ© (commence par "U2F" qui est base64 de "\x53\x61\x6c\x74")
    if (!encryptedText.includes('U2F')) {
      return encryptedText; // Pas chiffrÃ©, retourner tel quel
    }
    
    const key = generateCoupleKey(coupleId);
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('âŒ Erreur dÃ©chiffrement:', error);
    return encryptedText; // Fallback
  }
};

/**
 * Chiffrer un objet JSON
 * @param {object} obj - Objet Ã  chiffrer
 * @param {string} coupleId - ID du couple
 * @returns {object} Objet avec champs sensibles chiffrÃ©s
 */
export const encryptMessageObject = (messageObj, coupleId) => {
  if (!messageObj) return messageObj;
  
  return {
    ...messageObj,
    content: encryptMessage(messageObj.content, coupleId),
  };
};

/**
 * DÃ©chiffrer un objet JSON
 * @param {object} messageObj - Objet chiffrÃ©
 * @param {string} coupleId - ID du couple
 * @returns {object} Objet avec champs dÃ©chiffrÃ©s
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
 * DÃ©chiffrer une note d'amour
 */
export const decryptLoveNote = (noteObj, coupleId) => {
  return {
    ...noteObj,
    text: decryptMessage(noteObj.text, coupleId),
  };
};
