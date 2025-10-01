const { withAndroidManifest } = require('expo/config-plugins');

const withFixFirebaseMetaData = (config) => {
  return withAndroidManifest(config, async (config) => {
    const application = config.modResults.manifest.application[0];

    // Ukloni postojeći ako postoji
    application["meta-data"] = application["meta-data"]?.filter(
      (item) =>
        item["$"]["android:name"] !==
        "com.google.firebase.messaging.default_notification_color"
    ) || [];

    // Dodaj sa tools:replace
    application["meta-data"].push({
      $: {
        "android:name": "com.google.firebase.messaging.default_notification_color",
        "android:resource": "@color/notification_icon_color",
        "tools:replace": "android:resource",
        "xmlns:tools": "http://schemas.android.com/tools"
      },
    });

    return config;
  });
};

export default function () {
  return withFixFirebaseMetaData({
    name: "magic-planner",
    slug: "assitify",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.amartc.assitify"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/logoapp.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO"
      ],
      package: "com.amartc.assitify",
      googleServicesFile: "./google-services.json",
      statusBar: {
        translucent: true
      }
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-camera",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
          microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone",
          recordAudioAndroid: true
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#ffffff"
        }
      ],
      [
        "expo-video",
        {
          supportsBackgroundPlayback: true,
          supportsPictureInPicture: true
        }
      ],
      "expo-font",
      "expo-router"
    ],
    extra: {
      eas: {
        projectId: "176c4c21-9c62-4311-a5d2-566380f957d6"
      }
    },
    owner: "amartc"
  });
}
