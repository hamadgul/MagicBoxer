module.exports = {
  expo: {
    name: "SmartBox AI",
    slug: "smartbox-ai",
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
    jsEngine: "hermes",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.smartboxai.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#c6c6c7"
      },
      package: "com.smartboxai.app"
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
