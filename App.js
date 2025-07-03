import 'react-native-gesture-handler';

import { Buffer } from 'buffer';
global.Buffer = Buffer;

import React, { useCallback, useEffect, useState } from "react";
import { Platform, StatusBar, StyleSheet, View, Text, Alert, LogBox } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import AppNavigator from "./src/navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import { NativeBaseProvider } from 'native-base';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';

// Ignore specific warnings that might be causing issues
LogBox.ignoreLogs([
  'Animated: `useNativeDriver`',
  'componentWillReceiveProps',
  'componentWillMount',
  'ViewPropTypes',
  'AsyncStorage has been extracted from react-native',
]);

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Set up global error handler
  useEffect(() => {
    const errorHandler = (error, isFatal) => {
      if (isFatal) {
        setHasError(true);
        setErrorMessage(error.message || 'Unknown error occurred');
        console.error('FATAL ERROR:', error);
      } else {
        console.warn('NON-FATAL ERROR:', error);
      }
    };

    // Set up the global error handler
    if (global.ErrorUtils) {
      const originalGlobalHandler = global.ErrorUtils.getGlobalHandler();
      global.ErrorUtils.setGlobalHandler((error, isFatal) => {
        errorHandler(error, isFatal);
        originalGlobalHandler(error, isFatal);
      });
    }

    return () => {
      // Restore original handler on cleanup
      if (global.ErrorUtils) {
        global.ErrorUtils.setGlobalHandler(global.ErrorUtils.getGlobalHandler());
      }
    };
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('App initialization started');
        
        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync(Ionicons.font);
        console.log('Fonts loaded successfully');
        
        // Shorter artificial delay
        await new Promise(resolve => setTimeout(resolve, 500));
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
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        await SplashScreen.hideAsync();
        console.log('Splash screen hidden successfully');
      } catch (e) {
        console.error('Error hiding splash screen:', e);
      }
    }
  }, [appIsReady]);

  // Show loading screen
  if (!appIsReady) {
    return null;
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

  // Normal app rendering
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NativeBaseProvider>
        <NavigationContainer>
          <View style={styles.container} onLayout={onLayoutRootView}>
            <StatusBar barStyle="light-content" />
            <AppNavigator />
          </View>
        </NavigationContainer>
      </NativeBaseProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#c6c6c7", // Match splash screen background color
  }
});
