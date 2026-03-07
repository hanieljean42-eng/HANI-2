import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { auth, database, isConfigured, firebaseError } from '../config/firebase';
import { ref, set, onValue, update, get, off } from 'firebase/database';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser as deleteFirebaseUser,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';
import { sanitizeFirebasePath } from '../utils/encryption';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [couple, setCouple] = useState(null);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isSynced, setIsSynced] = useState(false);

  // Surveiller la connexion
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // 🔐 Firebase Authentication — session sécurisée et persistante gratuitement
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const storedUser   = await AsyncStorage.getItem('@user').catch(() => null);
          const storedCouple = await AsyncStorage.getItem('@couple').catch(() => null);
          const storedPartner= await AsyncStorage.getItem('@partner').catch(() => null);
          setUser(storedUser
            ? JSON.parse(storedUser)
            : { id: firebaseUser.uid, name: firebaseUser.displayName || 'Utilisateur', email: firebaseUser.email, avatar: '😊' }
          );
          if (storedCouple)  setCouple(JSON.parse(storedCouple));
          if (storedPartner) setPartner(JSON.parse(storedPartner));
        } else {
          setUser(null);
          setCouple(null);
          setPartner(null);
        }
      } catch (e) {
        console.warn('⚠️ Restauration session:', e.message);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Référence stable pour éviter les re-renders
  const coupleIdRef = useRef(null);
  const userIdRef = useRef(null);

  // Écouter les changements du couple en temps réel sur Firebase
  useEffect(() => {
    if (!couple?.id || !isConfigured || !database || !user?.id) return;
    
    // Éviter de recréer le listener si l'ID n'a pas changé
    if (coupleIdRef.current === couple.id && userIdRef.current === user.id) return;
    coupleIdRef.current = couple.id;
    userIdRef.current = user.id;

    console.log('🔄 Écoute Firebase activée pour:', couple.id);
    const coupleRef = ref(database, `couples/${couple.id}`);
    
    // Mettre à jour le statut online
    const memberStatusRef = ref(database, `couples/${couple.id}/members/${user.id}/isOnline`);
    set(memberStatusRef, true).catch(e => console.log('Status update error:', e));
    
    const unsubscribe = onValue(coupleRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('📥 Données reçues de Firebase');
        
        // Mettre à jour les infos du couple (sans écraser l'ID et le code)
        setCouple(prev => {
          const updated = {
            ...prev,
            name: data.name || prev?.name,
            anniversary: data.anniversary || prev?.anniversary,
            loveMeter: data.loveMeter || 0,
            couplePhoto: data.couplePhoto || prev?.couplePhoto || null,
            couplePhotoPublicId: data.couplePhotoPublicId || prev?.couplePhotoPublicId || null,
          };
          AsyncStorage.setItem('@couple', JSON.stringify(updated));
          return updated;
        });
        
        // Trouver et mettre à jour le partenaire
        if (data.members) {
          const members = Object.entries(data.members);
          const partnerMember = members.find(([id]) => id !== user.id);
          if (partnerMember) {
            const [partnerId, partnerData] = partnerMember;
            const newPartner = {
              id: partnerId,
              name: partnerData.name,
              avatar: partnerData.avatar || '💕',
              email: partnerData.email,
              gender: partnerData.gender || '',
              isOnline: partnerData.isOnline || false,
              lastSeen: partnerData.lastSeen || null,
            };
            setPartner(newPartner);
            AsyncStorage.setItem('@partner', JSON.stringify(newPartner));
            console.log('👫 Partenaire trouvé:', newPartner.name);
          }
        }
        
        setIsSynced(true);
      }
    }, (error) => {
      console.error('❌ Erreur écoute Firebase:', error);
      setIsSynced(false);
    });

    return () => {
      console.log('🔕 Arrêt écoute Firebase');
      // Marquer offline + enregistrer lastSeen quand on quitte
      if (couple?.id && user?.id) {
        const offlineRef = ref(database, `couples/${couple.id}/members/${user.id}/isOnline`);
        set(offlineRef, false).catch(() => {});
        const lastSeenRef = ref(database, `couples/${couple.id}/members/${user.id}/lastSeen`);
        set(lastSeenRef, new Date().toISOString()).catch(() => {});
      }
      off(coupleRef);
      coupleIdRef.current = null;
      userIdRef.current = null;
    };
  }, [couple?.id, user?.id]);

  // Traduction des codes d'erreur Firebase Auth en messages utilisateur
  const _authError = (code) => {
    switch (code) {
      case 'auth/email-already-in-use':   return 'Cet email est déjà utilisé par un autre compte.';
      case 'auth/invalid-email':          return 'Adresse email invalide.';
      case 'auth/weak-password':          return 'Mot de passe trop faible (minimum 6 caractères).';
      case 'auth/user-not-found':         return 'Aucun compte trouvé avec cet email.';
      case 'auth/wrong-password':         return 'Mot de passe incorrect.';
      case 'auth/invalid-credential':     return 'Email ou mot de passe incorrect.';
      case 'auth/too-many-requests':      return 'Trop de tentatives. Réessayez plus tard.';
      case 'auth/network-request-failed': return 'Erreur réseau. Vérifiez votre connexion.';
      case 'auth/requires-recent-login':  return 'Reconnectez-vous pour effectuer cette action.';
      default:                            return 'Une erreur est survenue. Veuillez réessayer.';
    }
  };

  const register = async (userData) => {
    if (!auth) return { success: false, error: firebaseError ? `Erreur Firebase: ${firebaseError}` : 'Firebase Auth non initialisé. Redémarrez l\'app.' };
    try {
      const email = userData.email.trim().toLowerCase();
      // 1. Créer le compte Firebase Auth (gratuit, chiffrement serveur, hash PBKDF2 géré par Google)
      const credential = await createUserWithEmailAndPassword(auth, email, userData.password);
      const firebaseUser = credential.user;
      // 2. Sauvegarder le prénom comme displayName
      await updateProfile(firebaseUser, { displayName: userData.name.trim() });
      // 3. Profil local sans mot de passe (Firebase Auth gère les secrets)
      const newUser = {
        id: firebaseUser.uid,
        name: userData.name.trim(),
        email,
        avatar: userData.avatar || '😊',
        birthday: userData.birthday || '',
        gender: userData.gender || '',
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem('@user', JSON.stringify(newUser));
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, error: _authError(error.code) };
    }
  };

  const login = async (email, password) => {
    if (!auth) return { success: false, error: firebaseError ? `Erreur Firebase: ${firebaseError}` : 'Firebase Auth non initialisé. Redémarrez l\'app.' };
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );
      // onAuthStateChanged s'occupe de restaurer le profil et le couple automatiquement
      const storedUser = await AsyncStorage.getItem('@user').catch(() => null);
      const name = storedUser
        ? JSON.parse(storedUser).name
        : credential.user.displayName || email;
      return { success: true, name };
    } catch (error) {
      return { success: false, error: _authError(error.code) };
    }
  };

  const sendPasswordReset = async (email) => {
    if (!auth) return { success: false, error: firebaseError ? `Erreur Firebase: ${firebaseError}` : 'Firebase Auth non initialisé.' };
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      return { success: true };
    } catch (error) {
      return { success: false, error: _authError(error.code) };
    }
  };

  const createCouple = async (coupleData) => {
    try {
      const coupleCode = generateCoupleCode();
      const coupleId = 'couple_' + Date.now().toString();
      
      const newCouple = {
        id: coupleId,
        code: coupleCode,
        ...coupleData,
        createdAt: new Date().toISOString(),
        members: [user.id],
      };
      
      await AsyncStorage.setItem('@couple', JSON.stringify(newCouple));
      // Sauvegarder aussi le coupleId séparément pour GameContext
      await AsyncStorage.setItem('@coupleId', coupleId);
      
      // Sauvegarder dans la liste des couples (pour la reconnexion)
      const storedCouples = await AsyncStorage.getItem('@registeredCouples');
      let couples = storedCouples ? JSON.parse(storedCouples) : [];
      couples.push(newCouple);
      await AsyncStorage.setItem('@registeredCouples', JSON.stringify(couples));
      
      // Créer sur Firebase si connecté
      if (isConfigured && database && isOnline) {
        try {
          const coupleRef = ref(database, `couples/${coupleId}`);
          await set(coupleRef, {
            code: coupleCode,
            name: coupleData.name,
            anniversary: coupleData.anniversary || null,
            loveMeter: 0,
            members: {
              [user.id]: {
                name: user.name,
                email: user.email,
                avatar: user.avatar || '😊',
                gender: user.gender || '',
                joinedAt: new Date().toISOString(),
                isCreator: true,
                isOnline: true,
              }
            },
            createdAt: new Date().toISOString(),
          });
          console.log('✅ Couple créé sur Firebase:', coupleCode);
        } catch (e) {
          console.log('⚠️ Erreur Firebase createCouple:', e.message);
        }
      }
      
      setCouple(newCouple);
      return { success: true, couple: newCouple, code: coupleCode };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const joinCouple = async (code, partnerData) => {
    try {
      let foundCouple = null;
      let coupleId = null;

      // Normaliser et sanitiser le code (majuscules, trim, caractères spéciaux Firebase)
      const normalizedCode = sanitizeFirebasePath(code?.toUpperCase().trim());
      if (!normalizedCode) {
        return { success: false, error: 'Code invalide.' };
      }

      // Chercher d'abord sur Firebase si connecté
      if (isConfigured && database && isOnline) {
        try {
          const couplesRef = ref(database, 'couples');
          const snapshot = await get(couplesRef);
          
          if (snapshot.exists()) {
            const couples = snapshot.val();
            for (const [id, data] of Object.entries(couples)) {
              const firebaseCode = sanitizeFirebasePath(data.code?.toUpperCase().trim());
              if (firebaseCode === normalizedCode) {
                coupleId = id;
                foundCouple = data;
                break;
              }
            }
          }
        } catch (e) {
          console.warn('⚠️ Erreur recherche Firebase:', e.message);
        }
      }

      // Chercher aussi localement si pas trouvé sur Firebase
      if (!foundCouple) {
        console.log('🔍 Recherche locale...');
        const storedCouples = await AsyncStorage.getItem('@registeredCouples');
        if (storedCouples) {
          const localCouples = JSON.parse(storedCouples);
          console.log('📋 Couples locaux:', localCouples.length);
          
          const localMatch = localCouples.find(c => c.code?.toUpperCase().trim() === normalizedCode);
          if (localMatch) {
            foundCouple = localMatch;
            coupleId = localMatch.id;
            console.log('✅ Couple trouvé localement:', localMatch.name);
          }
        }
      }

      // Si toujours pas trouvé, retourner erreur
      if (!foundCouple) {
        console.log('❌ Code couple introuvable');
        return { 
          success: false, 
          error: 'Code invalide. Vérifiez que:\n• Votre partenaire a bien créé l\'espace\n• Le code est correctement saisi\n• Vous êtes connecté à Internet' 
        };
      }

      // Si trouvé sur Firebase, rejoindre
      if (foundCouple && coupleId) {
        // Ajouter le membre sur Firebase
        if (isConfigured && database && isOnline) {
          try {
            const memberRef = ref(database, `couples/${coupleId}/members/${user.id}`);
            await set(memberRef, {
              name: user.name,
              email: user.email,
              avatar: user.avatar || '😊',
              gender: user.gender || '',
              joinedAt: new Date().toISOString(),
              isCreator: false,
              isOnline: true,
            });
            console.log('✅ Membre ajouté sur Firebase');
          } catch (e) {
            console.log('⚠️ Erreur ajout membre Firebase:', e.message);
          }
        }

        // Créer l'objet couple local
        const newCouple = {
          id: coupleId,
          code: foundCouple.code,
          name: foundCouple.name || partnerData.coupleName || 'Notre Couple',
          anniversary: foundCouple.anniversary || partnerData.anniversary,
          createdAt: foundCouple.createdAt,
          members: [user.id],
        };

        // Trouver les infos du partenaire (le créateur)
        let newPartner = {
          id: Date.now().toString() + '_partner',
          name: partnerData.partnerName,
          avatar: '💕',
        };

        if (foundCouple.members) {
          const creatorEntry = Object.entries(foundCouple.members).find(([id, m]) => m.isCreator);
          if (creatorEntry) {
            const [creatorId, creatorData] = creatorEntry;
            newPartner = {
              id: creatorId,
              name: creatorData.name || partnerData.partnerName,
              avatar: creatorData.avatar || '💕',
              email: creatorData.email,
              gender: creatorData.gender || '',
            };
            console.log('👫 Partenaire (créateur) trouvé:', newPartner.name);
          }
        }

        // Sauvegarder localement
        await AsyncStorage.setItem('@couple', JSON.stringify(newCouple));
        await AsyncStorage.setItem('@partner', JSON.stringify(newPartner));
        await AsyncStorage.setItem(`@partner_${user.id}`, JSON.stringify(newPartner));
        // Sauvegarder aussi le coupleId séparément pour GameContext
        await AsyncStorage.setItem('@coupleId', coupleId);
        console.log('💾 CoupleId sauvegardé:', coupleId);

        // Ajouter à la liste des couples
        const storedCouples = await AsyncStorage.getItem('@registeredCouples');
        let couples = storedCouples ? JSON.parse(storedCouples) : [];
        // Éviter les doublons
        if (!couples.find(c => c.id === coupleId)) {
          couples.push(newCouple);
          await AsyncStorage.setItem('@registeredCouples', JSON.stringify(couples));
        }

        setCouple(newCouple);
        setPartner(newPartner);

        console.log('✅ Rejoint le couple avec succès!');
        return { success: true, synced: true };
      }

      // Mode local (si pas trouvé sur Firebase ou pas de connexion)
      console.log('⚠️ Mode local - couple non trouvé sur Firebase');
      const newCouple = {
        id: Date.now().toString(),
        code: code,
        name: partnerData.coupleName || 'Notre Couple',
        anniversary: partnerData.anniversary,
        createdAt: new Date().toISOString(),
        members: [user.id],
      };
      
      const newPartner = {
        id: Date.now().toString() + '_partner',
        name: partnerData.partnerName,
        avatar: partnerData.partnerAvatar || '💕',
      };
      
      await AsyncStorage.setItem('@couple', JSON.stringify(newCouple));
      await AsyncStorage.setItem('@partner', JSON.stringify(newPartner));
      await AsyncStorage.setItem(`@partner_${user.id}`, JSON.stringify(newPartner));
      // Sauvegarder aussi le coupleId séparément pour GameContext
      await AsyncStorage.setItem('@coupleId', newCouple.id);
      
      const storedCouples = await AsyncStorage.getItem('@registeredCouples');
      let couples = storedCouples ? JSON.parse(storedCouples) : [];
      couples.push(newCouple);
      await AsyncStorage.setItem('@registeredCouples', JSON.stringify(couples));
      
      setCouple(newCouple);
      setPartner(newPartner);
      
      return { success: true, synced: false };
    } catch (error) {
      console.log('❌ Erreur joinCouple:', error.message);
      return { success: false, error: error.message };
    }
  };

  const generateCoupleCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'LOVE-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const logout = async () => {
    try {
      if (auth) await signOut(auth); // Déconnexion Firebase Auth (invalide le token JWT)
      await AsyncStorage.multiRemove(['@user', '@couple', '@partner']);
      setUser(null);
      setCouple(null);
      setPartner(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Suppression complète du compte utilisateur
  const deleteAccount = async () => {
    try {
      // 1. Supprimer les données Firebase Database (membre + token push)
      if (isConfigured && database && user?.id && couple?.id) {
        try {
          const memberRef = ref(database, `couples/${couple.id}/members/${user.id}`);
          await set(memberRef, null);
          const tokenRef = ref(database, `couples/${couple.id}/pushTokens/${user.id}`);
          await set(tokenRef, null);
        } catch (e) {
          console.warn('⚠️ Erreur suppression Firebase Database:', e.message);
        }
      }

      // 2. Supprimer toutes les données locales
      const keysToRemove = [
        '@user', '@couple', '@partner', '@coupleId',
        '@pushToken', '@expoPushToken', '@scheduledNotifications', '@letterNotifications',
        '@memories', '@loveNotes', '@bucketList', '@challenges',
        '@dailyChallengeStatus', '@weeklyChallenges', '@challengeXP',
        '@challengeStreak', '@challengeLevel', '@wheelHistory', '@journal',
        '@timeCapsules', '@scheduledLetters', '@secretContent', '@secretPin',
        '@useBiometrics', '@gameScores', '@quizScores', '@selectedTheme',
        '@loveMeterValue', '@stats', '@lastSync', '@notifications', '@settings',
        '@pinCode', '@registeredUsers', '@registeredCouples', '@chatMessages',
      ];
      if (user?.id) {
        keysToRemove.push(`@partner_${user.id}`);
        keysToRemove.push(`@user_${user.id}`);
      }
      await AsyncStorage.multiRemove(keysToRemove);

      // 3. Supprimer le compte Firebase Authentication (irréversible)
      const firebaseCurrentUser = auth?.currentUser;
      if (firebaseCurrentUser) {
        await deleteFirebaseUser(firebaseCurrentUser);
      }

      // 4. Réinitialiser les états
      setUser(null);
      setCouple(null);
      setPartner(null);
      setIsSynced(false);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur suppression compte:', error);
      return { success: false, error: error.message };
    }
  };

  const updateUser = async (updates) => {
    try {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateCouple = async (updates) => {
    try {
      const updatedCouple = { ...couple, ...updates };
      await AsyncStorage.setItem('@couple', JSON.stringify(updatedCouple));
      setCouple(updatedCouple);

      // Mettre à jour sur Firebase
      if (couple?.id && isConfigured && database && isOnline) {
        try {
          const coupleRef = ref(database, `couples/${couple.id}`);
          await update(coupleRef, updates);
          console.log('✅ Couple mis à jour sur Firebase');
        } catch (e) {
          console.log('⚠️ Erreur Firebase updateCouple:', e.message);
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Modifier le nom du partenaire (synchronisé avec Firebase)
  const updatePartnerName = async (newName) => {
    try {
      if (!partner?.id) {
        return { success: false, error: 'Aucun partenaire trouvé' };
      }

      const updatedPartner = { ...partner, name: newName };
      await AsyncStorage.setItem('@partner', JSON.stringify(updatedPartner));
      await AsyncStorage.setItem(`@partner_${user.id}`, JSON.stringify(updatedPartner));
      setPartner(updatedPartner);

      // Mettre à jour sur Firebase
      if (couple?.id && isConfigured && database && isOnline) {
        try {
          const partnerRef = ref(database, `couples/${couple.id}/members/${partner.id}`);
          await update(partnerRef, { name: newName });
          console.log('✅ Nom du partenaire mis à jour sur Firebase');
        } catch (e) {
          console.log('⚠️ Erreur Firebase updatePartnerName:', e.message);
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Modifier le nom du couple (synchronisé avec Firebase)
  const updateCoupleName = async (newName) => {
    try {
      if (!couple?.id) {
        return { success: false, error: 'Aucun couple trouvé' };
      }

      const updatedCouple = { ...couple, name: newName };
      await AsyncStorage.setItem('@couple', JSON.stringify(updatedCouple));
      setCouple(updatedCouple);

      // Mettre à jour sur Firebase
      if (isConfigured && database && isOnline) {
        try {
          const coupleRef = ref(database, `couples/${couple.id}`);
          await update(coupleRef, { name: newName });
          console.log('✅ Nom du couple mis à jour sur Firebase');
        } catch (e) {
          console.log('⚠️ Erreur Firebase updateCoupleName:', e.message);
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 🔐 Connexion avec Google — compatible iOS/Android via expo-auth-session
  const loginWithGoogle = async (idToken) => {
    if (!auth) return { success: false, error: firebaseError ? `Erreur Firebase: ${firebaseError}` : 'Firebase Auth non initialisé.' };
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      const firebaseUser = result.user;
      // Vérifier si profil local déjà existant
      const storedUser = await AsyncStorage.getItem('@user').catch(() => null);
      if (!storedUser) {
        // Première connexion Google — créer le profil depuis les données Google
        const newUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Utilisateur',
          email: firebaseUser.email,
          avatar: '😊',
          createdAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem('@user', JSON.stringify(newUser));
        setUser(newUser);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: _authError(error.code) };
    }
  };

  const value = {
    user,
    couple,
    partner,
    loading,
    isOnline,
    isSynced,
    register,
    login,
    loginWithGoogle,
    logout,
    sendPasswordReset,
    createCouple,
    joinCouple,
    updateUser,
    updateCouple,
    updatePartnerName,
    updateCoupleName,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
