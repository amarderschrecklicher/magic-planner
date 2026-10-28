import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import Task from "../../components/Task";
import LoadingAnimation from "../../components/LoadingAnimation";
import { fetchSettings, fetchSubTasks, TaskData, SubTaskData, SettingsData, fetchDoneTasks } from "../../modules/fetchingData";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect } from "expo-router";
import { useUser } from "@/modules/UserContext";
import { LinearGradient } from "expo-linear-gradient";
import UnifiedHeader from "@/components/UnifiedHeader";
import { BACKGROUND_GRADIENT } from '../../constants/Colors';

function ProgressScreen() {
  const [finishedTasks, setFinishedTasks] = useState<TaskData[] | null>(null);
  const [subTasks, setSubTasks] = useState<Map<number, SubTaskData[]> | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { accountID} = useUser();

  useFocusEffect(
    useCallback(() => {
      console.log("ProgressScreen focused, fetching data...");
      fetchData(false);

      return () => {

      };
    }, [accountID])
  );

  async function fetchData(refresh: boolean) {
    try {

      const settingsData = await fetchSettings(accountID);

      if (settingsData)
        setSettings(settingsData);

      const tasksData = await fetchDoneTasks(accountID);

      if (tasksData) {
        setFinishedTasks(tasksData);

        const subtasksData = await fetchSubTasks(tasksData ? tasksData: []);

        if (subtasksData)
          setSubTasks(subtasksData);

      }

    } catch (error) {
      console.error("Failed to fetch data in ProgressScreen:", error);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData(true);
    } finally {
      setRefreshing(false);
    }
  }, [accountID]);

  const handleTaskPress = (task: TaskData) => {
    if (subTasks && settings)
      router.push({
        pathname: "subtasks",
        params: {
          task: JSON.stringify(task),
          settings: JSON.stringify(settings),
          subTasks: JSON.stringify(subTasks.get(task.id) ?? []),
        },
      });
  };


  if (!finishedTasks || !subTasks || !settings) {
    return <LoadingAnimation />;
  }

  return (
    <LinearGradient
      colors={BACKGROUND_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >

      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" translucent={true} hidden={false} backgroundColor="transparent" />

        <UnifiedHeader
          settings={settings}
          title="Završeni zadaci"
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.scrollContent}
        >
          {finishedTasks.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Još nema završenih zadataka</Text>
              <Text style={styles.emptyText}>
                Kada završiš zadatak, ovdje ćeš vidjeti svoj napredak.
              </Text>
            </View>
          )}
          {finishedTasks.map((task) => {

            const subTaskList = subTasks.get(task.id);
            if (!subTaskList) return null;

            return (
              <TouchableOpacity
                key={task.id}
                activeOpacity={0.7}
                style={styles.taskCard}
                onPress={() => handleTaskPress(task)}
              >
                <Task
                  task={task}
                  settings={settings}
                  taskColor={settings.colorOfNormalTask}
                  subTasks={subTaskList}
                  updateTaskScreen={fetchData}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    marginTop: 10,
  },
  taskCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});


export default ProgressScreen;