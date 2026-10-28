import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithEmailAndPassword } from "firebase/auth";
import { router } from "expo-router";
import  { auth }  from "../modules/firebase";
import LoadingAnimation from "../components/LoadingAnimation";
import { fetchFonts } from "../modules/fontLoader";
import React from "react";
import HomeScreen from "./home";
import { useUser } from "@/modules/UserContext";

 function Index() {
  const [ready, setReady] = useState(false);
  const { setUser } = useUser();

  useEffect(() => {
    const bootstrap = async () => {
      console.log("Bootstrapping application...");
      await fetchFonts();
      console.log("Fonts loaded successfully");
      try {
        const id = await AsyncStorage.getItem("id");
        const name = await AsyncStorage.getItem("name");
        const email = await AsyncStorage.getItem("email");
        const gender = await AsyncStorage.getItem("gender") === "true";
        const password = await AsyncStorage.getItem("password");

        if (id && email && name && password) {
          console.log("Account found, logging in...",id, " ", email," ", gender," ", name);
          await signInWithEmailAndPassword(auth, email, password);

          setUser(id,name,gender, email);
          router.replace("/(tabs)/tasks");
        } else {
          setReady(true);
        }
      } catch (e) {
        console.log("Error:", e);
        setReady(true);
      }
    };

    bootstrap();
  }, []);

  if (!ready) return <LoadingAnimation />;
  return <HomeScreen />;
}

export default Index;