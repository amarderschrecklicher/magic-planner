import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import Task from "../../components/Task";
import LoadingAnimation from "../../components/LoadingAnimation";
import { fetchSettings, fetchSubTasks, TaskData, SubTaskData, SettingsData, fetchDoneTasks } from "../../modules/fetchingData";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "expo-router";
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
      console.log("TasksScreen focused, fetching data...");
      fetchData(false);

      return () => {

      };
    }, [])
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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleTaskPress = (task: any) => {
    if (subTasks)
      navigation.navigate("SubTasks", {
        task: task,
        settings: settings,
        subTasks: subTasks.get(task.id),
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
          {finishedTasks.map((task) => {

            const subTaskList = subTasks.get(task.id);
            if (!subTaskList) return null;

            return (
              <View key={task.id} style={styles.taskCard}>
                <Task
                  task={task}
                  settings={settings}
                  taskColor={settings.colorOfNormalTask}
                  subTasks={subTaskList}
                  updateTaskScreen={fetchData}
                />
              </View>
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
});


export default ProgressScreen;