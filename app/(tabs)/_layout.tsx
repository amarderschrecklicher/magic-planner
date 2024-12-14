import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import React from "react";

export default function TabLayout() {
  return (
    <>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: "#FF7F50",
          tabBarInactiveTintColor: "rgba(121, 131, 141, 0.8)",
          tabBarStyle: {
            backgroundColor: "rgba(224, 234, 243, 0.8)",
            borderTopWidth: 0,
            elevation: 0,
            position: "absolute",
            bottom: 16,
            borderRadius: 20,
            height: Platform.OS === "ios" ? 80 : 70,
            width: "95%",
            alignSelf: "center",             
            marginLeft  : 10,
          },
          tabBarIcon: ({ color, size }) => {
            let iconName;

            switch (route.name) {
              case "tasks":
                iconName = "checkmark-done-outline";
                break;
              case "progress":
                iconName = "stats-chart-outline";
                break;
              case "materials":
                iconName = "book-outline";
                break;
              default:
                iconName = "ellipse";
            }

            return <Ionicons name={iconName} size={22} color={color} />;
          },
        })}
      >
        <Tabs.Screen name="tasks" options={{ title: "Zadaci" }} />
        <Tabs.Screen name="progress" options={{ title: "Napredak" }} />
        <Tabs.Screen name="instruction" options={{ title: "Materijali" }} />
      </Tabs>
    </>
  );
}
