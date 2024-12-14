import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import * as Progress from "react-native-progress";
import { SettingsData, SubTaskData, TaskData, updateFinishedTask } from "../modules/fetchingData";
import { LinearGradient } from "expo-linear-gradient";
import color from "color";

export default function Task({
  task,
  settings,
  taskColor,
  subTasks,
  updateTaskScreen,
}: {
  task: TaskData,
  settings: SettingsData,
  taskColor: string,
  subTasks: SubTaskData[],
  updateTaskScreen: any
}) {

  const [finishedSubTasks, setFinishedSubTasks] = useState(0);
  const [numberOfSubTasks, setNumberOfSubTasks] = useState(0);

  function countFinishedSubTasks() {
    let counter = 0;
    let total = 0;
    subTasks.forEach((subTask) => {
      if (subTask.done) counter++;
      total++;
    });
    if (counter == total && !task.done) {
      updateTaskScreen();
      updateFinishedTask(task.id);
    }
    setFinishedSubTasks(counter);
    setNumberOfSubTasks(total);
  }

  useEffect(() => {
    countFinishedSubTasks();
  }, [subTasks]);

  return (
    <>
<View style={[styles.container, { backgroundColor:"#deedf9"}]}>
        <Text
          style={[
            styles.taskName,
            {
              color: settings.colorForFont,
              fontFamily: settings.font,
            },
          ]}
        >
          {task.taskName}
        </Text>

        <View style={[styles.time, { backgroundColor: !task.overDo?"#DD6975": settings.colorOfPriorityTask}]}>
          <Text
            style={[
              styles.defaultText,
              {
                fontSize: settings.fontSize + 1,
                color: settings.colorForFont,
                fontFamily: settings.font,
              },
            ]}
          >
            {task.done
              ? "Završen:"
              : !task.overDo
              ? "Rok prošao"
              : "Rok izvršavanja:"}
          </Text>
          <Text
            style={[
              styles.dueTimeText,
              {
                fontSize: settings.fontSize,
                color: settings.colorForFont,
                fontFamily: settings.font,
              },
            ]}
          >
            {task.done ? task.end: !task.overDo ? "" : task.dueTime}
          </Text>
        </View>
      </View>

      {!task.done && (
        <View style={styles.progress}>
          <Progress.Bar
            progress={finishedSubTasks / numberOfSubTasks}
            width={null}
            height={15}
            color={settings.colorForProgress}
            borderColor={"#ddd"}
            borderWidth={1}
            borderRadius={8}
            unfilledColor={"#f0f0f0"}
            key={finishedSubTasks}
          />
          <Text
            style={[
              styles.progressText,
              {
                fontSize: settings.fontSize - 1,
                fontFamily: settings.font,
              },
            ]}
          >
            {finishedSubTasks} od {numberOfSubTasks} završena
          </Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    minHeight: 180,
    justifyContent: "space-between",
  },
  taskName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  time: {
    flexDirection: "column",
    justifyContent: "space-between",
    borderRadius: 10, // Rounded corners // Border thickness
    borderStyle: "solid",
    textAlign:"center",
    padding: 10, // Padding inside the container
    // Shadow for iOS
    shadowColor: "#000", // Shadow color
    shadowOffset: { width: 0, height: 4 }, // Shadow offset (horizontal, vertical)
    shadowOpacity: 0.3, // Shadow transparency (0 to 1)
    shadowRadius: 6, // Shadow blur radius
    // Elevation for Android
    elevation: 8, // Shadow depth
  },
  defaultText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  dueTimeText: {
    fontSize: 14,
    marginTop: 5,
    textDecorationLine: "none",
    textAlign: "center",
  },
  progress: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  progressText: {
    marginTop: 10,
    opacity: 0.8,
    textAlign: "center",
  },
});