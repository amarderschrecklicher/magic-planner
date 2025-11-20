import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from "react-native";
import Task from "../../components/Task";
import WelcomeMessage from "../../components/WelcomeMessage";
import LoadingAnimation from "../../components/LoadingAnimation";
import CelebrationAnimation from "../../components/CelebrationAnimation";
import {
  fetchAccount,
  fetchSettings,
  fetchSubTasks,
  SettingsData,
  SubTaskData,
  TaskData,
  deleteToken,
  fetchUndoneTasks
} from "../../modules/fetchingData";
import { router, useFocusEffect } from "expo-router";
import * as Notifications from 'expo-notifications';
import { Notification } from 'expo-notifications';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useUser } from "@/modules/UserContext";
import UnifiedHeader from "@/components/UnifiedHeader";
import { BACKGROUND_GRADIENT } from '../../constants/Colors';

function TasksScreen() {

  const [notification, setNotification] = useState<Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  //const [priorityTasks, setPriorityTasks] = useState<TaskData[] | null>(null);
  const [normalTasks, setNormalTasks] = useState<TaskData[] | null>(null);
  const [subTasks, setSubTasks] = useState<Map<number, SubTaskData[]> | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { accountID,name,gender} = useUser();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: false,
    }),
  });


  useFocusEffect(
  useCallback(() => {
    console.log("TasksScreen focused, fetching data...");
    fetchData(false);

    return () => {
      
    };
  }, [])
);

useEffect(() => {
  // This runs once on mount
  notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
    const title = notification.request.content.title || "";
    setNotification(notification as Notification);
    if (title === "Imaš novi task!") {
      onRefresh();
    }
  });

  responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
    onRefresh();
  });

  return () => {
    // Cleanup on unmount
    notificationListener.current?.remove();
    responseListener.current?.remove();
  };
}, []);


  async function fetchData(refresh: boolean) {
    try {

      const settingsData = await fetchSettings(accountID);

      if (settingsData)
        setSettings(settingsData);

      const tasksData = await fetchUndoneTasks(accountID);
      
      if (tasksData) {
        //setPriorityTasks(tasksData.priority);

        setNormalTasks(tasksData);
      }
      const subtasksData = await fetchSubTasks(tasksData ? tasksData : []);

      if (subtasksData)
        setSubTasks(subtasksData);


    } catch (error) {
      console.error("Failed to fetch data in TasksScreen:", error);
    }
  }

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const alertFunction = () => {
    Alert.alert(
      "Da li ste sigurni da se želite odjaviti?",
      "Ako se odjavite ponovo ćete morati skenirati QR kod kako biste se prijavili.",
      [
        {
          text: "Ne",
          onPress: undefined,
          style: "cancel",
        },
        {
          text: "Da",
          onPress: logout,
        },
      ]
    );
  };

  const logout = async () => {
    try {
      console.log("Logging out...");
      await deleteToken()
      await AsyncStorage.clear();
      router.replace({ pathname: "/" });
//
    } catch (e) {
      console.log("Error when storing data: " + e);
    }
  };

  const handleTaskPress = (task: any) => {
    if (subTasks)
      router.push({
        pathname: "subtasks",
        params: {
          task: JSON.stringify(task),
          settings: JSON.stringify(settings),
          subTasks: JSON.stringify(subTasks.get(task.id)),
        },
      });
  };


 if (
  subTasks == null ||
  normalTasks == null ||
  name == null ||
  gender == null ||
  settings == null
) {
  return <LoadingAnimation />;
}
else {
  // Combine all tasks into a single array
  const allTasks = [...normalTasks];
  
  // Get the first uncompleted task
  const currentTask = allTasks.length > 0 ? allTasks[0] : null;

  console.log("Current Task:", currentTask);
  
  // Check if all tasks are completed
  if (!currentTask || subTasks.size == 0) {
    return (
      <LinearGradient
        colors={BACKGROUND_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1, marginBottom: 20 }}>
          <StatusBar
            style="auto"
            translucent={true}
            hidden={false}
            backgroundColor={settings.colorForBackground}
          />
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <UnifiedHeader
              settings={settings}
              title="Zadaci"
              onLogout={alertFunction}
            />
            <CelebrationAnimation kidName={name} maleKid={gender} settings={settings} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }
  
  
  return (
    <LinearGradient
      colors={BACKGROUND_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <UnifiedHeader
          settings={settings}
          title="Zadaci"
          onLogout={alertFunction}
        />
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{
            paddingBottom: 100
          }}
        >
          <WelcomeMessage name={name} male={gender} settings={settings} />
          
          <View style={[styles.tasks, { alignItems: 'center' }]}>
            {subTasks.get(currentTask.id) && (
              <TouchableOpacity
                activeOpacity={0.6}
                style={styles.taskPressable}
                onPress={() => handleTaskPress(currentTask)}
              >
                <Task
                  task={currentTask}
                  settings={settings}
                  taskColor={settings.colorOfNormalTask}
                  subTasks={subTasks.get(currentTask.id)}
                  updateTaskScreen={fetchData}
                />
              </TouchableOpacity>
            )}
          </View>
          
          {allTasks.length > 1 && (
            <Text
              style={[
                styles.title,
                {
                  fontSize: settings.fontSize,
                  fontFamily: settings.font,
                  textAlign: 'center',
                  opacity: 0.7,
                  marginTop: 20,
                },
              ]}
            >
              Preostalo zadataka: {allTasks.length - 1}
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};
}

const styles = StyleSheet.create({
  tasks: {
    paddingBottom: 20,
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  taskPressable: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginBottom: 30,
    overflow: 'hidden',
  },
  congratulationBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
  },
  congratulationsText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});


export default TasksScreen;
