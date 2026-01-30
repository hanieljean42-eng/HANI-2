import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [couple, setCouple] = useState(null);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

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
      await AsyncStorage.setItem('@user', JSON.stringify(newUser));
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      const storedUser = await AsyncStorage.getItem('@user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.email === email && userData.password === password) {
          setUser(userData);
          
          // Charger le couple si existe
          const storedCouple = await AsyncStorage.getItem('@couple');
          if (storedCouple) setCouple(JSON.parse(storedCouple));
          
          return { success: true };
        }
      }
      return { success: false, error: 'Email ou mot de passe incorrect' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const createCouple = async (coupleData) => {
    try {
      const coupleCode = generateCoupleCode();
      const newCouple = {
        id: Date.now().toString(),
        code: coupleCode,
        ...coupleData,
        createdAt: new Date().toISOString(),
        members: [user.id],
      };
      await AsyncStorage.setItem('@couple', JSON.stringify(newCouple));
      setCouple(newCouple);
      return { success: true, couple: newCouple, code: coupleCode };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const joinCouple = async (code, partnerData) => {
    try {
      // Simuler la jonction (en production, ce serait via API)
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
      
      setCouple(newCouple);
      setPartner(newPartner);
      
      return { success: true };
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

  const value = {
    user,
    couple,
    partner,
    loading,
    register,
    login,
    logout,
    createCouple,
    joinCouple,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
