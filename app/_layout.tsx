import { UserProvider } from "@/modules/UserContext";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { View, StyleSheet } from "react-native";

export default function Layout() {
  return (
      <View style={styles.container}>
        <StatusBar hidden style="light" translucent backgroundColor="transparent" />
        <UserProvider>
          <Slot />
        </UserProvider>
      </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
  },
});