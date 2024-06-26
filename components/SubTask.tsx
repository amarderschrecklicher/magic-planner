import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Checkbox from "expo-checkbox";
import { SettingsData, SubTaskData, updateFinishedSubTasks } from "../modules/fetchingData";

export default function SubTask({ started, subTask, subTaskColor, settings }:{started:boolean, subTask:SubTaskData,subTaskColor:string,settings:SettingsData}) {
  const [isChecked, setChecked] = useState(subTask.done);

  const handleCheckboxChange = () => {
    setChecked(!isChecked);
    if (!isChecked) {
      updateFinishedSubTasks(subTask.id);
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={
          isChecked
            ? [styles.subTaskFinished, { backgroundColor: subTaskColor }]
            : [styles.subTaskActive, { backgroundColor: subTaskColor }]
        }
      >
        <Text 
          style={{
            fontSize: settings.fontSize,
            color: settings.colorForFont,
            fontFamily: settings.font,
            textDecorationLine: isChecked ? "line-through" : "none"
          }}
        >
          {subTask.description}
        </Text>
      </View>
      <View style={isChecked ? { opacity: 0.6 } : { opacity: 1 }}>
        <Checkbox
          style={styles.checkbox}
          color={isChecked ? settings.colorForProgress : undefined}
          value={isChecked}
          onValueChange={handleCheckboxChange}
          disabled={!started}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    margin: 10,
  },
  subTaskFinished: {
    flex: 1,
    padding: 10,
    borderRadius: 15,
    elevation: 8,
    borderWidth: 2,
    opacity: 0.5,
  },
  subTaskActive: {
    flex: 1,
    padding: 10,
    borderRadius: 15,
    elevation: 8,
    borderWidth: 2,
  },
  checkbox: {
    margin: 8,
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "black",
  },
});
