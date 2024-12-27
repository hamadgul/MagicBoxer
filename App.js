import React, { useCallback, useEffect, useState } from "react";
import { Platform, StatusBar, StyleSheet, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import AppNavigator from "./navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import { NativeBaseProvider } from 'native-base';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Set the animation options
SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync({
          ...Ionicons.font,
        });
        
        // Artificial delay to ensure smooth splash screen
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <NativeBaseProvider>
      <View style={styles.container} onLayout={onLayoutRootView}>
        <StatusBar barStyle="light-content" />
        <AppNavigator />
      </View>
    </NativeBaseProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f2d44", // Match splash screen background color
  },
});
