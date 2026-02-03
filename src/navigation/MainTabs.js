import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import WheelScreen from '../screens/WheelScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import MemoriesScreen from '../screens/MemoriesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SecretScreen from '../screens/SecretScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, label, focused, accentColor }) => (
  <View style={styles.tabItem}>
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
    <Text style={[styles.tabLabel, focused && { color: accentColor, fontWeight: 'bold' }]}>{label}</Text>
  </View>
);

export default function MainTabs() {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { shadowColor: theme.accent }],
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" label="Accueil" focused={focused} accentColor={theme.accent} />
          ),
        }}
      />
      <Tab.Screen
        name="Wheel"
        component={WheelScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🎰" label="Roue" focused={focused} accentColor={theme.accent} />
          ),
        }}
      />
      <Tab.Screen
        name="Secret"
        component={SecretScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🔐" label="Secret" focused={focused} accentColor={theme.accent} />
          ),
        }}
      />
      <Tab.Screen
        name="Challenges"
        component={ChallengesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="⚡" label="Défis" focused={focused} accentColor={theme.accent} />
          ),
        }}
      />
      <Tab.Screen
        name="Memories"
        component={MemoriesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🫙" label="Souvenirs" focused={focused} accentColor={theme.accent} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="💑" label="Profil" focused={focused} accentColor={theme.accent} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: '#fff',
    borderRadius: 35,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    borderTopWidth: 0,
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  tabIconFocused: {
    fontSize: 28,
  },
  tabLabel: {
    fontSize: 10,
    color: '#666',
  },
});
