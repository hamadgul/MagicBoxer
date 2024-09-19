import React, { useState, useEffect } from "react";
import { Platform, StatusBar, StyleSheet, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { Asset } from "expo-asset";
import * as Font from "expo-font";
import AppNavigator from "./navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import { AppRegistry } from "react-native";
import { name as appName } from "./app.json"; // Correctly import the name from app.json

SplashScreen.preventAutoHideAsync();

function Main() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        await Asset.loadAsync([
          require("./assets/images/robot-dev.png"),
          require("./assets/images/robot-prod.png"),
        ]);

        await Font.loadAsync({
          ...Ionicons.font,
          "space-mono": require("./assets/fonts/SpaceMono-Regular.ttf"),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        await SplashScreen.hideAsync();
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  if (!isLoadingComplete) {
    return null;
  }

  return (
    <View style={styles.container}>
      {Platform.OS === "ios" && <StatusBar barStyle="default" />}
      <AppNavigator />
    </View>
  );
}

// Register the component using the correct name
AppRegistry.registerComponent(appName, () => Main);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default Main;
