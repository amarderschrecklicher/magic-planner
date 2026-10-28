import React from "react";
import {
  View, StyleSheet, Image, Linking, Alert, Text, TouchableOpacity, SafeAreaView,
} from "react-native";
import { Camera } from "expo-camera";
import { useRouter } from "expo-router";
import Constants from "expo-constants";

const appVersion = Constants.expoConfig?.version ?? "";

function HomeScreen() {
  const router = useRouter();

  const askForCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();

    if (status === "granted") {
      router.push("/scan");
      return;
    }

    Alert.alert(
      "Permission needed",
      "Da biste koristili aplikaciju Assistify, potrebno je da dozvolite korištenje kamere u postavkama",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Go to settings", onPress: () => Linking.openSettings() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          style={styles.logo}
          resizeMode="contain"
          source={require("../assets/images/logoapp.png")}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.scanButton}
          activeOpacity={0.8}
          onPress={askForCameraPermission}
        >
          <Text style={styles.text}>SKENIRAJ QR KOD</Text>
        </TouchableOpacity>

        {appVersion ? (
          <Text style={styles.version}>Verzija {appVersion}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  logoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  logo: {
    width: "78%",
    maxWidth: 340,
    aspectRatio: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  scanButton: {
    backgroundColor: "#07255d",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    width: "100%",
    maxWidth: 380,
  },
  text: { color: "white", fontSize: 21, fontWeight: "600" },
  version: {
    marginTop: 18,
    fontSize: 13,
    color: "#9aa3ad",
  },
});

export default HomeScreen;
