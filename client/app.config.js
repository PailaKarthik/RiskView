import "dotenv/config";

export default {
  expo: {
    name: "RiskView",
    slug: "riskview",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "riskview",
    userInterfaceStyle: "automatic",

    ios: {
      supportsTablet: true,
    },

    android: {
      package: "com.karthikpaila.riskview",
      predictiveBackGestureEnabled: false,

      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },

      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },

    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    plugins: [
      "expo-status-bar",
      "expo-web-browser",
      "expo-router",
      "expo-font",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
    ],

    experiments: {
      typedRoutes: false,
    },
    extra: {
      eas: {
        projectId: "d5d68452-7da6-4308-aec0-bcaac8672725",
      },
    },
  },
};
