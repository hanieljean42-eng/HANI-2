import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

// Thèmes disponibles — chaque thème inclut les couleurs de bulles chat + fond
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
    bubbleMe: '#FF6B9D',
    bubbleOther: '#f0f0f0',
    bubbleMeText: '#fff',
    bubbleOtherText: '#333',
    chatBg: 'rgba(255,255,255,0.95)',
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
    bubbleMe: '#667eea',
    bubbleOther: '#E8EAF6',
    bubbleMeText: '#fff',
    bubbleOtherText: '#333',
    chatBg: 'rgba(240,242,255,0.97)',
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
    bubbleMe: '#f5576c',
    bubbleOther: '#FFF0F0',
    bubbleMeText: '#fff',
    bubbleOtherText: '#333',
    chatBg: 'rgba(255,248,248,0.97)',
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
    bubbleMe: '#11998e',
    bubbleOther: '#E8F5E9',
    bubbleMeText: '#fff',
    bubbleOtherText: '#333',
    chatBg: 'rgba(245,255,245,0.97)',
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
    bubbleMe: '#9B59B6',
    bubbleOther: '#F3E5F5',
    bubbleMeText: '#fff',
    bubbleOtherText: '#333',
    chatBg: 'rgba(248,240,255,0.97)',
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
    bubbleMe: '#667eea',
    bubbleOther: '#2C2C3A',
    bubbleMeText: '#fff',
    bubbleOtherText: '#E0E0E0',
    chatBg: '#1A1A2E',
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
    bubbleMe: '#eb3349',
    bubbleOther: '#FFEBEE',
    bubbleMeText: '#fff',
    bubbleOtherText: '#333',
    chatBg: 'rgba(255,245,245,0.97)',
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
    bubbleMe: '#D68910',
    bubbleOther: '#FFF8E1',
    bubbleMeText: '#fff',
    bubbleOtherText: '#333',
    chatBg: 'rgba(255,252,240,0.97)',
  },
  neon: {
    id: 'neon',
    name: '💫 Néon',
    primary: ['#0F0C29', '#302B63', '#24243e'],
    secondary: '#302B63',
    accent: '#00F5FF',
    card: 'rgba(255,255,255,0.08)',
    text: '#fff',
    textDark: '#333',
    cardText: '#333',
    bubbleMe: '#00F5FF',
    bubbleOther: '#1E1E3F',
    bubbleMeText: '#0F0C29',
    bubbleOtherText: '#E0E0FF',
    chatBg: '#12122A',
  },
  pastel: {
    id: 'pastel',
    name: '🍬 Pastel',
    primary: ['#FFDEE9', '#B5FFFC', '#C9FFBF'],
    secondary: '#FFB6C1',
    accent: '#FF69B4',
    card: 'rgba(255,255,255,0.5)',
    text: '#555',
    textDark: '#333',
    cardText: '#333',
    bubbleMe: '#FFB6C1',
    bubbleOther: '#E8F8F5',
    bubbleMeText: '#333',
    bubbleOtherText: '#333',
    chatBg: 'rgba(255,250,250,0.98)',
  },
  tropical: {
    id: 'tropical',
    name: '🌴 Tropical',
    primary: ['#00B4DB', '#0083B0', '#00C9FF'],
    secondary: '#00B4DB',
    accent: '#FF6F61',
    card: 'rgba(255,255,255,0.15)',
    text: '#fff',
    textDark: '#333',
    cardText: '#333',
    bubbleMe: '#00B4DB',
    bubbleOther: '#E0F7FA',
    bubbleMeText: '#fff',
    bubbleOtherText: '#333',
    chatBg: 'rgba(240,255,255,0.97)',
  },
  dark: {
    id: 'dark',
    name: '🖤 Sombre',
    primary: ['#1a1a2e', '#16213e', '#0f3460'],
    secondary: '#16213e',
    accent: '#E94560',
    card: 'rgba(255,255,255,0.06)',
    text: '#fff',
    textDark: '#E0E0E0',
    cardText: '#E0E0E0',
    bubbleMe: '#E94560',
    bubbleOther: '#1E293B',
    bubbleMeText: '#fff',
    bubbleOtherText: '#CBD5E1',
    chatBg: '#0F172A',
  },
  candy: {
    id: 'candy',
    name: '🍭 Bonbon',
    primary: ['#FF61D2', '#FE9090', '#FFB347'],
    secondary: '#FF61D2',
    accent: '#FE9090',
    card: 'rgba(255,255,255,0.2)',
    text: '#fff',
    textDark: '#333',
    cardText: '#333',
    bubbleMe: '#FF61D2',
    bubbleOther: '#FFF0F5',
    bubbleMeText: '#fff',
    bubbleOtherText: '#333',
    chatBg: 'rgba(255,248,252,0.97)',
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
