import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useState } from "react";
import { Platform, StatusBar, StyleSheet, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import AppNavigator from "./src/navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import { NativeBaseProvider } from 'native-base';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync(Ionicons.font);
        
        // Artificial delay to let things load
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
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
    backgroundColor: "#0f2d44", // Match splash screen background color
  }
});
