import { View, Text } from "react-native";
import React from "react";
import { SettingsData } from "@/modules/fetchingData";

export default function CurrentDate({ settings }:{settings:SettingsData}) {
  const date = new Date();
  const daniUSedmici = [
    "Nedjelja",
    "Ponedjeljak",
    "Utorak",
    "Srijeda",
    "Četvrtak",
    "Petak",
    "Subota",
  ];
  return (
    <View
      style={{
        position: "absolute",
        top: 30,
        right: 20,
      }}
    >
      <Text style={{ fontSize: settings.fontSize, fontFamily: settings.font }}>
        {daniUSedmici[date.getDay()]}, {date.getDate()}.{date.getMonth() + 1}.
        {date.getFullYear()}.
      </Text>
    </View>
  );
}
