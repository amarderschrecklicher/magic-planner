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
        const account = await AsyncStorage.getItem("account");
        const email = await AsyncStorage.getItem("email");
        const password = await AsyncStorage.getItem("password");

        if (account && email && password) {
          console.log("Account found, logging in...",account, " ", email);
          await signInWithEmailAndPassword(auth, email, password);
          setUser(account, email);
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