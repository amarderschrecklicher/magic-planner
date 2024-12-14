import React, { useEffect } from "react";
import { useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { CameraView } from "expo-camera";
import { CommonActions } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";
import { fetchStringCodes } from "../modules/fetchingData";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../modules/firebase";
import { useRouter } from "expo-router";
import { useUser } from "@/modules/UserContext";

function ScanQRCodeScreen() {
  const [scanned, setScanned] = useState(false);
  const [stringCodes, setStringCodes] = useState([]);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [nonExistentAccount, setNonExistentAccount] = useState(false);
  const { accountID, email, setUser } = useUser();

  const router = useRouter();
  useEffect(() => {
    fetchCodes();
  }, []);

  async function fetchCodes() {
    const data = await fetchStringCodes();
    setStringCodes(data);
  }

  const storeData = async (child:any) => {
    try {
      await AsyncStorage.setItem("account", child.id.toString());
      await AsyncStorage.setItem("email", child.email);
      await AsyncStorage.setItem("password", child.password);
      setUser(child.id.toString(), child.email);
      await signInWithEmailAndPassword(auth, child.email, child.password);
      console.log("Login success");
    } catch (e) {
      console.log("Error when storing data: " + e);
    }
  };


  const handleBarCodeScanned = async ({ data }: { data: any }) => {
    setScanned(true);
    let found = false;

    for (const string of stringCodes) {
      if (string.phoneLoginString === data) {
        await storeData(string.child);
        setAuthenticated(true);
        setUser(string.child.id.toString(), string.child.email);
        found = true;
        break;
      }
    }

    if (!found) setNonExistentAccount(true);
  };

  const navigateToTabs = () => {
    console.log("Navigating to tabs with account ID:",  accountID, "and email:", email);
    router.replace("/(tabs)/tasks");
  };

  if (isAuthenticated)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <LottieView
          source={require("../assets/animations/successfullyLogin.json")}
          autoPlay
          loop={false}
          onAnimationFinish={navigateToTabs}
          style={{ width: 300, height: 300 }}
        />
        <Text style={{ fontSize: 26 }}>Uspješna prijava!</Text>
      </View>
    );
  if (nonExistentAccount) {
    return (
      <View style={styles.centered}>
        <LottieView
          source={require("../assets/animations/failedLogin.json")}
          autoPlay
          loop={false}
          style={{ width: 300, height: 300 }}
        />
        <Text style={{ fontSize: 26 }}>Prijava nije uspjela!</Text>
        <Text style={{ fontSize: 22 }}>Profil ne postoji</Text>
        <TouchableOpacity
          style={styles.failedButton}
          onPress={() => router.replace("/")}
        >
          <Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>
            Ok
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  failedButton: {
    backgroundColor: "#E25B5B",
    padding: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 80,
    elevation: 5,
    width: 230,
  },
});

export default ScanQRCodeScreen;