import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { database, isConfigured } from '../config/firebase';
import { ref, set, onValue, update, get, serverTimestamp, off } from 'firebase/database';

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

  useEffect(() => {
    loadStoredData();
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
              isOnline: partnerData.isOnline || false,
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
      // Marquer offline quand on quitte
      if (couple?.id && user?.id) {
        const offlineRef = ref(database, `couples/${couple.id}/members/${user.id}/isOnline`);
        set(offlineRef, false).catch(() => {});
      }
      off(coupleRef);
      coupleIdRef.current = null;
      userIdRef.current = null;
    };
  }, [couple?.id, user?.id]);

  const loadStoredData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@user');
      const storedCouple = await AsyncStorage.getItem('@couple');
      const storedPartner = await AsyncStorage.getItem('@partner');
      
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedCouple) setCouple(JSON.parse(storedCouple));
      if (storedPartner) setPartner(JSON.parse(storedPartner));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        createdAt: new Date().toISOString(),
      };
      
      // Sauvegarder l'utilisateur actif
      await AsyncStorage.setItem('@user', JSON.stringify(newUser));
      
      // Sauvegarder aussi dans la liste des utilisateurs enregistrés (pour la reconnexion)
      const storedUsers = await AsyncStorage.getItem('@registeredUsers');
      let users = storedUsers ? JSON.parse(storedUsers) : [];
      
      // Vérifier si l'email existe déjà
      const existingIndex = users.findIndex(u => u.email === newUser.email);
      if (existingIndex >= 0) {
        users[existingIndex] = newUser; // Mettre à jour
      } else {
        users.push(newUser); // Ajouter
      }
      
      await AsyncStorage.setItem('@registeredUsers', JSON.stringify(users));
      
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const login = async (name, password) => {
    try {
      // Chercher dans la liste des utilisateurs enregistrés
      const storedUsers = await AsyncStorage.getItem('@registeredUsers');
      
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const foundUser = users.find(u => 
          u.name.toLowerCase() === name.toLowerCase() && u.password === password
        );
        
        if (foundUser) {
          // Restaurer l'utilisateur
          await AsyncStorage.setItem('@user', JSON.stringify(foundUser));
          setUser(foundUser);
          
          // Charger le couple associé à cet utilisateur si existe
          const storedCouples = await AsyncStorage.getItem('@registeredCouples');
          if (storedCouples) {
            const couples = JSON.parse(storedCouples);
            const userCouple = couples.find(c => c.members && c.members.includes(foundUser.id));
            if (userCouple) {
              await AsyncStorage.setItem('@couple', JSON.stringify(userCouple));
              setCouple(userCouple);
            }
          }
          
          // Charger le partenaire si existe
          const storedPartner = await AsyncStorage.getItem(`@partner_${foundUser.id}`);
          if (storedPartner) {
            setPartner(JSON.parse(storedPartner));
          }
          
          return { success: true };
        }
      }
      
      return { success: false, error: 'Nom ou mot de passe incorrect' };
    } catch (error) {
      return { success: false, error: error.message };
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

      // Chercher d'abord sur Firebase si connecté
      if (isConfigured && database && isOnline) {
        try {
          console.log('🔍 Recherche du code sur Firebase:', code);
          const couplesRef = ref(database, 'couples');
          const snapshot = await get(couplesRef);
          
          if (snapshot.exists()) {
            const couples = snapshot.val();
            for (const [id, data] of Object.entries(couples)) {
              if (data.code?.toUpperCase() === code?.toUpperCase()) {
                coupleId = id;
                foundCouple = data;
                console.log('✅ Couple trouvé sur Firebase:', data.name);
                break;
              }
            }
          }
        } catch (e) {
          console.log('⚠️ Erreur recherche Firebase:', e.message);
        }
      }

      // Si trouvé sur Firebase, rejoindre
      if (foundCouple && coupleId) {
        // Ajouter le membre sur Firebase
        const memberRef = ref(database, `couples/${coupleId}/members/${user.id}`);
        await set(memberRef, {
          name: user.name,
          email: user.email,
          avatar: user.avatar || '😊',
          joinedAt: new Date().toISOString(),
          isCreator: false,
          isOnline: true,
        });

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
        couples.push(newCouple);
        await AsyncStorage.setItem('@registeredCouples', JSON.stringify(couples));

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
      // Ne supprimer que la session active, pas les données enregistrées
      await AsyncStorage.multiRemove(['@user', '@couple', '@partner']);
      setUser(null);
      setCouple(null);
      setPartner(null);
    } catch (error) {
      console.error('Logout error:', error);
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

  const value = {
    user,
    couple,
    partner,
    loading,
    isOnline,
    isSynced,
    register,
    login,
    logout,
    createCouple,
    joinCouple,
    updateUser,
    updateCouple,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
