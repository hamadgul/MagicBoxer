import React, { useCallback, useEffect, useState, useRef } from "react";
import { Platform, StatusBar, StyleSheet, View, Text, Alert, LogBox, AppState } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import AppNavigator from "./src/navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import { NativeBaseProvider } from 'native-base';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import ErrorBoundary from "./src/components/ErrorBoundary";

// Ignore specific warnings that might be causing issues
LogBox.ignoreLogs([
  'Animated: `useNativeDriver`',
  'componentWillReceiveProps',
  'componentWillMount',
  'ViewPropTypes',
  'AsyncStorage has been extracted from react-native',
]);

// Ensure splash screen stays visible until we're ready
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error */
});

// Track app state changes for better error detection
const useAppStateListener = () => {
  const appState = useRef(AppState.currentState);
  
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log('App State changed from', appState.current, 'to', nextAppState);
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return appState.current;
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fontLoaded, setFontLoaded] = useState(false);
  const currentAppState = useAppStateListener();

  // Set up global error handler
  // Additional error logging for TestFlight builds
  useEffect(() => {
    console.log('App component mounted, current state:', currentAppState);
    
    return () => {
      console.log('App component will unmount');
    };
  }, [currentAppState]);

  // Load fonts separately to isolate potential issues
  useEffect(() => {
    async function loadFonts() {
      try {
        console.log('Loading fonts...');
        await Font.loadAsync(Ionicons.font);
        console.log('Fonts loaded successfully');
        setFontLoaded(true);
      } catch (e) {
        console.error('Error loading fonts:', e);
        setHasError(true);
        setErrorMessage('Failed to load fonts: ' + (e.message || 'Unknown error'));
      }
    }
    
    loadFonts();
  }, []);
  
  // Separate effect for other initialization tasks
  useEffect(() => {
    if (!fontLoaded) return;
    
    async function prepare() {
      try {
        console.log('App initialization started');
        
        // Any other initialization tasks here
        
        console.log('App initialization completed');
      } catch (e) {
        console.error('Error during initialization:', e);
        setHasError(true);
        setErrorMessage(e.message || 'Failed to initialize app');
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, [fontLoaded]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        // Add a longer delay before hiding splash screen to ensure UI is fully ready
        // This helps prevent black screen issues in TestFlight
        setTimeout(async () => {
          try {
            await SplashScreen.hideAsync();
            console.log('Splash screen hidden successfully');
          } catch (e) {
            console.error('Error hiding splash screen:', e);
          }
        }, 300); // Increased delay for better reliability
      } catch (e) {
        console.error('Error in onLayoutRootView:', e);
      }
    }
  }, [appIsReady]);

  // Show loading screen
  if (!appIsReady) {
    // Return an empty view while loading
    // This ensures we have something to render before the splash screen is hidden
    return <View style={{ flex: 1, backgroundColor: "#c6c6c7" }} />;
  }

  // Show error screen if there was an error during initialization
  if (hasError) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: 'red' }}>
          Something went wrong
        </Text>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>
          {errorMessage}
        </Text>
        <Text style={{ textAlign: 'center' }}>
          Please restart the app. If the problem persists, please contact support.
        </Text>
      </View>
    );
  }

  // Normal app rendering with ErrorBoundary
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NativeBaseProvider>
          <NavigationContainer fallback={<View style={{ flex: 1, backgroundColor: "#c6c6c7" }} />}>
            <View style={styles.container} onLayout={onLayoutRootView}>
              <StatusBar barStyle="light-content" />
              <AppNavigator />
            </View>
          </NavigationContainer>
        </NativeBaseProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#c6c6c7", // Match splash screen background color
  }
});
