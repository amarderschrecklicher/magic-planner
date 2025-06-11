import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  Image,
} from "react-native";
import Checkbox from "expo-checkbox";
import { CameraView } from "expo-camera";
import { saveMaterial } from "../modules/fetchingData";
import { storage } from "../modules/firebase";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import {
  SettingsData,
  SubTaskData,
  TaskData,
  updateFinishedSubTasks,
  updateFinishedTask,
} from "../modules/fetchingData";
import * as ImageManipulator from "expo-image-manipulator";
import * as Progress from "react-native-progress";
import { LinearGradient } from "expo-linear-gradient";
import color from "color";

export default function Task({
  task,
  settings,
  taskColor,
  subTasks,
  updateTaskScreen,
}: {
  task: TaskData;
  settings: SettingsData;
  taskColor: string;
  subTasks: SubTaskData[];
  updateTaskScreen: any;
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
    if (counter === total && !task.done) {
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
      <View style={[styles.container, { backgroundColor: "#f0f6fc" }]}>        
        <Text
          style={[styles.taskName, {
            color: settings.colorForFont,
            fontFamily: settings.font,
          }]}
        >
          {task.taskName}
        </Text>

        <View style={[styles.timeContainer, {
          backgroundColor: !task.overDo ? "#f44336" : settings.colorOfPriorityTask,
        }]}
        >
          <Text
            style={[styles.timeLabel, {
              fontSize: settings.fontSize + 1,
              fontFamily: settings.font,
            }]}
          >
            {task.done
              ? "Završen:"
              : !task.overDo
              ? "Rok prošao"
              : "Rok izvršavanja:"}
          </Text>

          <Text
            style={[styles.timeValue, {
              fontSize: settings.fontSize,
              fontFamily: settings.font,
            }]}
          >
            {task.done ? task.end : !task.overDo ? "" : task.dueTime}
          </Text>
        </View>
      </View>

      {!task.done && (
        <View style={styles.progressContainer}>
          <Progress.Bar
            progress={finishedSubTasks / numberOfSubTasks}
            width={null}
            height={14}
            color={settings.colorForProgress}
            borderColor="#ccc"
            borderWidth={1}
            borderRadius={10}
            unfilledColor="#eaeaea"
          />
          <Text
            style={[styles.progressText, {
              fontSize: settings.fontSize - 1,
              fontFamily: settings.font,
            }]}
          >
            {finishedSubTasks} od {numberOfSubTasks} završeno
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
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    minHeight: 180,
    justifyContent: "space-between",
    overflow: "visible",
  },
  taskName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  timeContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    alignItems: "center",
  },
  timeLabel: {
    fontWeight: "600",
    color: "#fff",
    marginBottom: 6,
  },
  timeValue: {
    color: "#fff",
  },
  progressContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  progressText: {
    marginTop: 8,
    color: "#333",
    textAlign: "center",
  },
});
