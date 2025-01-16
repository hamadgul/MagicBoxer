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
      backgroundColor: "#b3fcfa"
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
        backgroundColor: "#ffffff"
      },
      package: "com.magicboxer.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-splash-screen"
    ],
    extra: {
      eas: {
        projectId: "magic-boxer"
      }
    }
  }
};
