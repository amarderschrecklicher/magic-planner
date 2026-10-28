import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import {
  SettingsData,
  SubTaskData,
  TaskData,
  updateFinishedTask,
} from "../modules/fetchingData";
import * as Progress from "react-native-progress";
import { LinearGradient } from "expo-linear-gradient";

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
    
    if (!subTasks || subTasks.length === 0) {
      setFinishedSubTasks(0);
      setNumberOfSubTasks(0);
      return;
    }
    
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
  }, [subTasks, task.done]);
  
  return (
    <>
      <LinearGradient
        colors={['#ffffff', '#f8fbff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >        
        <View style={styles.headerSection}>
          <Text
            style={[styles.taskName, {
              color: settings.colorForFont,
              fontFamily: settings.font,
              fontSize: settings.fontSize + 6,
            }]}
          >
            {task.taskName}
          </Text>
        </View>

        <View style={styles.middleSection}>
          {!task.done && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text
                  style={[styles.progressLabel, {
                    fontSize: settings.fontSize,
                    fontFamily: settings.font,
                  }]}
                >
                  Napredak
                </Text>
                <Text
                  style={[styles.progressCount, {
                    fontSize: settings.fontSize + 2,
                    fontFamily: settings.font,
                  }]}
                >
                  {finishedSubTasks}/{numberOfSubTasks}
                </Text>
              </View>
              <Progress.Bar
                key={`${task.id}-${finishedSubTasks}-${numberOfSubTasks}`}
                progress={finishedSubTasks / numberOfSubTasks}
                width={null}
                height={18}
                color={settings.colorForProgress}
                borderColor="transparent"
                borderWidth={0}
                borderRadius={12}
                unfilledColor="#e8f0f8"
                animated={true}
                animationType="timing"
              />
            </View>
          )}
        </View>

        <View style={[styles.timeContainer, {
          backgroundColor: !task.overDo && !task.done ? "#f44336" : taskColor,
        }]}
        >
          <Text
            style={[styles.timeLabel, {
              fontSize: settings.fontSize + 1,
              fontFamily: settings.font,
            }]}
          >
            {task.done
              ? "✓ Završen"
              : !task.overDo
              ? "Rok prošao"
              : "📅 Rok izvršavanja"}
          </Text>

          <Text
            style={[styles.timeValue, {
              fontSize: settings.fontSize + 2,
              fontFamily: settings.font,
            }]}
          >
            {task.done ? task.end  : task.dueTime}
          </Text>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    minHeight: 320,
    justifyContent: "space-between",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 10,
  },
  taskName: {
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 36,
  },
  middleSection: {
    flex: 1,
    justifyContent: "center",
    marginVertical: 20,
  },
  progressContainer: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressLabel: {
    color: "#666",
    fontWeight: "600",
  },
  progressCount: {
    fontWeight: "bold",
    color: "#333",
  },
  progressPercentage: {
    marginTop: 10,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  timeContainer: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    alignItems: "center",
  },
  timeLabel: {
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  timeValue: {
    color: "#fff",
    fontWeight: "600",
  },
});