module.exports = {
  expo: {
    name: "MagicBoxer",
    slug: "magic-boxer",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#c6c6c7"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.magicboxer.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#c6c6c7"
      },
      package: "com.magicboxer.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-splash-screen",
      "expo-font",
      "expo-mail-composer",
      "expo-router",
      "expo-web-browser"
    ],
    extra: {
      eas: {
        projectId: "cd5ed8c1-ac97-4e35-847d-8510f3b63746"
      }
    }
  }
};
