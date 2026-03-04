/**
 * Module de chiffrement pour donnÃƒÂ©es sensibles
 * Utilise AES-256 pour chiffrer les messages, notes d'amour, etc.
 * v1.0.0
 */

import CryptoJS from 'crypto-js';

// ClÃƒÂ© de chiffrement - dans une app rÃƒÂ©elle, utiliser une clÃƒÂ© depuis Firebase Cloud Function
// Cette clÃƒÂ© est gÃƒÂ©nÃƒÂ©rÃƒÂ©e une fois par couple et stockÃƒÂ©e sÃƒÂ©curisement
const generateCoupleKey = (coupleId) => {
  // Utiliser le coupleId pour gÃƒÂ©nÃƒÂ©rer une clÃƒÂ© dÃƒÂ©terministe
  // Dans une vrai app, ce serait une clÃƒÂ© gÃƒÂ©nÃƒÂ©rÃƒÂ©e et stockÃƒÂ©e cÃƒÂ´tÃƒÂ© serveur
  return CryptoJS.SHA256(`hani2_couple_${coupleId}`).toString().substring(0, 32);
};

/**
 * Chiffrer du texte avec AES-256
 * @param {string} plainText - Texte ÃƒÂ  chiffrer
 * @param {string} coupleId - ID du couple (pour gÃƒÂ©nÃƒÂ©rer la clÃƒÂ©)
 * @returns {string} Texte chiffrÃƒÂ© en base64
 */
export const encryptMessage = (plainText, coupleId) => {
  try {
    if (!plainText || !coupleId) return plainText;
    
    const key = generateCoupleKey(coupleId);
    const encrypted = CryptoJS.AES.encrypt(plainText, key);
    return encrypted.toString();
  } catch (error) {
    console.error('Ã¢ÂÅ’ Erreur chiffrement:', error);
    return plainText; // Fallback : retourner en clair si erreur
  }
};

/**
 * DÃƒÂ©chiffrer du texte AES-256
 * @param {string} encryptedText - Texte chiffrÃƒÂ©
 * @param {string} coupleId - ID du couple (pour gÃƒÂ©nÃƒÂ©rer la clÃƒÂ©)
 * @returns {string} Texte dÃƒÂ©chiffrÃƒÂ©
 */
export const decryptMessage = (encryptedText, coupleId) => {
  try {
    if (!encryptedText || !coupleId) return encryptedText;
    
    // VÃƒÂ©rifier si c'est du texte chiffrÃƒÂ© (commence par "U2F" qui est base64 de "\x53\x61\x6c\x74")
    if (!encryptedText.includes('U2F')) {
      return encryptedText; // Pas chiffrÃƒÂ©, retourner tel quel
    }
    
    const key = generateCoupleKey(coupleId);
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Ã¢ÂÅ’ Erreur dÃƒÂ©chiffrement:', error);
    return encryptedText; // Fallback
  }
};

/**
 * Chiffrer un objet JSON
 * @param {object} obj - Objet ÃƒÂ  chiffrer
 * @param {string} coupleId - ID du couple
 * @returns {object} Objet avec champs sensibles chiffrÃƒÂ©s
 */
export const encryptMessageObject = (messageObj, coupleId) => {
  if (!messageObj) return messageObj;
  
  return {
    ...messageObj,
    content: encryptMessage(messageObj.content, coupleId),
  };
};

/**
 * DÃƒÂ©chiffrer un objet JSON
 * @param {object} messageObj - Objet chiffrÃƒÂ©
 * @param {string} coupleId - ID du couple
 * @returns {object} Objet avec champs dÃƒÂ©chiffrÃƒÂ©s
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
 * DÃƒÂ©chiffrer une note d'amour
 */
export const decryptLoveNote = (noteObj, coupleId) => {
  return {
    ...noteObj,
    text: decryptMessage(noteObj.text, coupleId),
  };
};
