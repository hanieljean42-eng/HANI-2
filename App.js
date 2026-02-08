import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { GameProvider } from './src/context/GameContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { SecurityProvider } from './src/context/SecurityContext';
import { ChatProvider } from './src/context/ChatContext';
import { SyncProvider } from './src/context/SyncContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text } from 'react-native';

// Error Boundary pour capturer les erreurs globales
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.emoji}>😢</Text>
          <Text style={errorStyles.title}>Oups ! Une erreur est survenue</Text>
          <Text style={errorStyles.message}>{this.state.error?.message}</Text>
          <Text style={errorStyles.hint}>Redémarrez l'application</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  emoji: { fontSize: 60, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 10, textAlign: 'center' },
  message: { fontSize: 14, color: '#ff6b6b', textAlign: 'center', marginBottom: 20 },
  hint: { fontSize: 16, color: '#a0a0a0' },
});

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import JoinCoupleScreen from './src/screens/JoinCoupleScreen';
import MainTabs from './src/navigation/MainTabs';
import ChatScreen from './src/screens/ChatScreen';
import StatsScreen from './src/screens/StatsScreen';
import RetrospectiveScreen from './src/screens/RetrospectiveScreen';
import WidgetsScreen from './src/screens/WidgetsScreen';
import GamesScreen from './src/screens/GamesScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, couple } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Auth Stack
        <Stack.Group>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Group>
      ) : !couple ? (
        // Join Couple Stack
        <Stack.Screen name="JoinCouple" component={JoinCoupleScreen} />
      ) : (
        // Main App Stack
        <Stack.Group>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen} 
            options={{ 
              animation: 'slide_from_right',
              presentation: 'card'
            }} 
          />
          <Stack.Screen 
            name="Stats" 
            component={StatsScreen} 
            options={{ 
              animation: 'slide_from_bottom',
              presentation: 'card'
            }} 
          />
          <Stack.Screen 
            name="Retrospective" 
            component={RetrospectiveScreen} 
            options={{ 
              animation: 'fade',
              presentation: 'fullScreenModal'
            }} 
          />
          <Stack.Screen 
            name="Widgets" 
            component={WidgetsScreen} 
            options={{ 
              animation: 'slide_from_right',
              presentation: 'card'
            }} 
          />
          <Stack.Screen 
            name="Games" 
            component={GamesScreen} 
            options={{ 
              animation: 'slide_from_bottom',
              presentation: 'card'
            }} 
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <SyncProvider>
              <NotificationProvider>
                <DataProvider>
                  <SecurityProvider>
                    <ChatProvider>
                      <GameProvider>
                        <NavigationContainer>
                          <StatusBar style="light" />
                          <AppNavigator />
                        </NavigationContainer>
                      </GameProvider>
                    </ChatProvider>
                  </SecurityProvider>
                </DataProvider>
              </NotificationProvider>
            </SyncProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
