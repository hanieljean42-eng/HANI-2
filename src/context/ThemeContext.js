import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

// Thèmes disponibles
export const THEMES = {
  rose: {
    id: 'rose',
    name: '🌸 Rose Romantique',
    primary: ['#FF6B9D', '#C44569', '#8B5CF6'],
    secondary: '#FF6B9D',
    accent: '#C44569',
    card: 'rgba(255,255,255,0.15)',
    text: '#fff',
    textDark: '#333',
    cardText: '#333',
  },
  ocean: {
    id: 'ocean',
    name: '🌊 Océan',
    primary: ['#667eea', '#764ba2', '#6B8DD6'],
    secondary: '#667eea',
    accent: '#764ba2',
    card: 'rgba(255,255,255,0.15)',
    text: '#fff',
    textDark: '#333',
    cardText: '#333',
  },
  sunset: {
    id: 'sunset',
    name: '🌅 Coucher de soleil',
    primary: ['#f093fb', '#f5576c', '#FF6B6B'],
    secondary: '#f093fb',
    accent: '#f5576c',
    card: 'rgba(255,255,255,0.15)',
    text: '#fff',
    textDark: '#333',
    cardText: '#333',
  },
  forest: {
    id: 'forest',
    name: '🌲 Forêt',
    primary: ['#11998e', '#38ef7d', '#2ECC71'],
    secondary: '#11998e',
    accent: '#11998e',
    card: 'rgba(255,255,255,0.15)',
    text: '#fff',
    textDark: '#333',
    cardText: '#333',
  },
  lavender: {
    id: 'lavender',
    name: '💜 Lavande',
    primary: ['#a18cd1', '#fbc2eb', '#9B59B6'],
    secondary: '#a18cd1',
    accent: '#9B59B6',
    card: 'rgba(255,255,255,0.15)',
    text: '#fff',
    textDark: '#333',
    cardText: '#333',
  },
  midnight: {
    id: 'midnight',
    name: '🌙 Minuit',
    primary: ['#232526', '#414345', '#2C3E50'],
    secondary: '#232526',
    accent: '#667eea',
    card: 'rgba(255,255,255,0.1)',
    text: '#fff',
    textDark: '#333',
    cardText: '#333',
  },
  cherry: {
    id: 'cherry',
    name: '🍒 Cerise',
    primary: ['#eb3349', '#f45c43', '#E74C3C'],
    secondary: '#eb3349',
    accent: '#eb3349',
    card: 'rgba(255,255,255,0.15)',
    text: '#fff',
    textDark: '#333',
    cardText: '#333',
  },
  gold: {
    id: 'gold',
    name: '✨ Or',
    primary: ['#F7971E', '#FFD200', '#F39C12'],
    secondary: '#F7971E',
    accent: '#D68910',
    card: 'rgba(255,255,255,0.15)',
    text: '#fff',
    textDark: '#333',
    cardText: '#333',
  },
};

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(THEMES.rose);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@theme');
      if (savedTheme && THEMES[savedTheme]) {
        setCurrentTheme(THEMES[savedTheme]);
      }
    } catch (error) {
      console.log('Erreur chargement thème:', error);
    }
    setIsLoading(false);
  };

  const changeTheme = async (themeId) => {
    if (THEMES[themeId]) {
      setCurrentTheme(THEMES[themeId]);
      await AsyncStorage.setItem('@theme', themeId);
    }
  };

  const value = {
    theme: currentTheme,
    themes: THEMES,
    changeTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
