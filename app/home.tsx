import React from "react";
import {
  View, StyleSheet, Image, Linking, Alert, Text, TouchableOpacity,
} from "react-native";
import { Camera } from "expo-camera";
import { useRouter } from "expo-router";

function HomeScreen() {
  const router = useRouter();

  const askForCameraPermission = () => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status === "granted") {
        router.push("/scan");
      } else {
        Alert.alert(
          "Permission needed",
          "Da biste koristili aplikaciju Assistify, potrebno je da dozvolite korištenje kamere u postavkama",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Go to settings", onPress: () => Linking.openSettings() },
          ]
        );
      }
    })();
  };

  return (
    <View style={styles.container}>
      <View style={styles.image}>
        <Image style={{ height: "68%", resizeMode: "contain" }} source={require("../assets/images/logoapp.png")} />
      </View>
      <TouchableOpacity style={styles.scanButton} onPress={askForCameraPermission}>
        <Text style={styles.text}>SKENIRAJ QR KOD</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center" },
  image: { marginTop: 230 },
  scanButton: {
    backgroundColor: "#07255d",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 80,
    elevation: 5,
    width: "73%",
  },
  text: { color: "white", fontSize: 21, fontWeight: "600" },
});

export default HomeScreen;