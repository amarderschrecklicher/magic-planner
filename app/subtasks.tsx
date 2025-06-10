import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import SubTask from "../components/SubTask";
import Ionicons from "@expo/vector-icons/Ionicons";
import CurrentDate from "../components/CurrentDate";
import { SubTaskData, updateStartedTask } from "../modules/fetchingData";
import { useLocalSearchParams, router } from "expo-router";

function SubTasksScreen() {
  const { task, settings, subTasks } = useLocalSearchParams();
  const [sortedSubTasks, setSortedSubTasks] = useState<SubTaskData[]>([]);
  const [started, setStarted] = useState(
    task?.start !== null && task?.start !== "Invalid date"
  );

  useEffect(() => {
    if (!task || !settings || !subTasks) return;
    sortSubTasks();
  }, [subTasks]);

  const sortSubTasks = () => {
    const parsed = Array.isArray(subTasks) ? subTasks : JSON.parse(subTasks);
    const temp = [...parsed];
    temp.sort((a: any, b: any) => {
      if (a.done && !b.done) return 1;
      if (!a.done && b.done) return -1;
      return 0;
    });
    setSortedSubTasks(temp);
  };

  const handleStartTask = () => {
    setStarted(true);
    updateStartedTask(task.id);
  };

  const buttonText = started
    ? `Zadatak započet${task.start ? `: ${task.start}` : ""}`
    : "Započni zadatak";

  return (
    <SafeAreaView style={{ backgroundColor: settings.colorForBackground, flex: 1 }}>
      <View>
        <CurrentDate settings={settings} />
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={50} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { fontSize: settings.fontSize + 2, fontFamily: settings.font }]}>Opis zadatka</Text>

      <View style={styles.description}>
        <Text style={{ fontSize: settings.fontSize, fontFamily: settings.font }}>
          {task.description}
        </Text>
      </View>

      <Text style={[styles.title, { fontSize: settings.fontSize + 2, fontFamily: settings.font }]}>Podzadaci</Text>

      <ScrollView style={styles.scroller}>
        {sortedSubTasks?.map((subTask) => (
          <View key={subTask.id}>
            <SubTask
              started={started}
              subTask={subTask}
              subTaskColor={task.priority ? settings.colorOfPriorityTask : settings.colorOfNormalTask}
              settings={settings}
            />
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={started ? styles.startButtonDisabled : styles.startButton}
        onPress={handleStartTask}
        disabled={started}
      >
        <Text style={styles.startButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroller: {
    marginHorizontal: 20,
    borderRadius: 15,
  },
  title: {
    marginTop: 20,
    marginLeft: 30,
    marginBottom: 20,
  },
  backButton: {
    marginTop: 10,
    marginLeft: 15,
  },
  description: {
    marginLeft: 30,
    marginRight: 35,
    marginBottom: 10,
    borderWidth: 2,
    padding: 10,
    borderRadius: 15,
  },
  startButton: {
    backgroundColor: '#07255d',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  startButtonDisabled: {
    backgroundColor: '#CBC3E3',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
  },
});

export default SubTasksScreen;