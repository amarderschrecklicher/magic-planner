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
  fetchTasks,
  fetchAccount,
  fetchSettings,
  fetchSubTasks,
  fetchTokens,
  addToken,
  registerForPushNotificationsAsync,
  updateToken,
  SettingsData,
  SubTaskData,
  TaskData,
  deleteToken
} from "../../modules/fetchingData";
import CurrentDate from "../../components/CurrentDate";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { router, useFocusEffect } from "expo-router";
import * as Notifications from 'expo-notifications';
import { Notification, NotificationResponse } from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from "@react-native-async-storage/async-storage";
import SideButtons from "../../components/SideButtons";
import { StatusBar } from "expo-status-bar";
import { registerIndieID, unregisterIndieDevice } from "native-notify";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useUser } from "@/modules/UserContext";

function TasksScreen() {

  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const [kidName, setKidName] = useState("");
  const [maleKid, setMaleKid] = useState(false);
  const [password, setPassword] = useState("");
  const [priorityTasks, setPriorityTasks] = useState<TaskData[] | null>(null);
  const [normalTasks, setNormalTasks] = useState<TaskData[] | null>(null);
  const [subTasks, setSubTasks] = useState<Map<number, SubTaskData[]> | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [storedToken, setStoredToken] = useState("no");
  const { accountID, email } = useUser();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  useEffect(() => {
  const getToken = async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      setExpoPushToken(token); 
    }
  };

  getToken();
}, []);

  // Update the database with the new token if necessary
    useEffect(() => {
      console.log("expoPushToken:", expoPushToken);
      console.log("storedToken:", storedToken.token);

    if (expoPushToken !== "" && expoPushToken != storedToken) {
        console.log("Token updatean!")
        updateToken(expoPushToken, accountID);
      }  
    else if (expoPushToken=="" && storedToken == undefined) {
        console.log("Adding new token!");
        addToken(expoPushToken, accountID, Device.modelName || "");
        console.log("Token added successfully!");
    }
  }, [expoPushToken, storedToken, accountID]);

  useEffect(() => {
    const getStoredToken = async () => {
      console.log("Fetching stored token for account ID:", accountID);
      const { token } = await fetchTokens(accountID);
      console.log("Stored token fetched:", token.token);
      setStoredToken(token);
    };

    getStoredToken();
  }, [accountID]);


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
    if (notificationListener.current) {
      Notifications.removeNotificationSubscription(notificationListener.current);
    }
    if (responseListener.current) {
      Notifications.removeNotificationSubscription(responseListener.current);
    }
  };
}, []);

  async function fetchData(refresh: boolean) {
    try {

      const employeeData = await fetchAccount(accountID);
      console.log("Fetching data employee:", employeeData);
      if (employeeData) {

        setKidName(employeeData.name);
        setMaleKid(employeeData.gender);
        setPassword(employeeData.password);
      }
      const tasksData = await fetchTasks(accountID);

      if (tasksData) {
        setPriorityTasks(tasksData.priority);
        setNormalTasks(tasksData.normal);
      }
      const subtasksData = await fetchSubTasks(tasksData ? tasksData.data : []);

      if (subtasksData)
        setSubTasks(subtasksData);
      const settingsData = await fetchSettings(accountID);

      if (settingsData)
        setSettings(settingsData);

    } catch (error) {
      navigation.navigate('Home', { accountID: 0 });
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
      deleteToken(expoPushToken)
      await AsyncStorage.removeItem("account");
      await AsyncStorage.removeItem("email");
      await AsyncStorage.removeItem("password");
      router.replace({ pathname: "/" });
//
    } catch (e) {
      console.log("Error when storing data: " + e);
    }
  };

  const handleTaskPress = (task: any) => {
    if (subTasks)
      navigation.navigate("SubTasks", {
        task: task,
        settings: settings,
        subTasks: subTasks.get(task.id),
      });
  };

  const handleChatPress = () => {
    router.push("chat");
  };

  const handleSOSPress = () => {
    router.push({
      pathname: "chat",
      params: { sos: "SOS" }, 
    });
  };


  if (
    subTasks == null ||
    priorityTasks == null ||
    normalTasks == null ||
    kidName == null ||
    maleKid == null ||
    settings == null
  ) {
    return <LoadingAnimation />;
  }
  else if (
    (priorityTasks.length == 0 && normalTasks.length == 0) ||
    subTasks.size == 0
  )
    return (
      <LinearGradient
        colors={["#FFD700", settings.colorForBackground, "#00457C"]}
        start={{ x: 0, y: 0 }} // Start at the top
        end={{ x: 1, y: 0 }} // End at the bottom
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 , marginBottom: 20}}>
          <StatusBar style="auto"
            translucent={true}
            hidden={false}
            backgroundColor={settings.colorForBackground}

          />
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <View>
              <CurrentDate settings={settings} />
              <TouchableOpacity style={styles.logoutButton} onPress={alertFunction}>
                <SimpleLineIcons name="logout" size={40}></SimpleLineIcons>
              </TouchableOpacity>
            </View>
            <CelebrationAnimation kidName={kidName} maleKid={maleKid} settings={settings} />
          </ScrollView>
          <SideButtons onChatPress={handleChatPress} onSOSPress={handleSOSPress} />
        </SafeAreaView>
      </LinearGradient>
    );
  else {
    return (
      <LinearGradient
        colors={["#B7F2F2", settings.colorForBackground]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }} 
        style={{ flex: 1 }}
      >
        <SafeAreaView
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <CurrentDate settings={settings} />
            <TouchableOpacity style={styles.logoutButton} onPress={alertFunction}>
              <SimpleLineIcons name="logout" size={33}></SimpleLineIcons>
            </TouchableOpacity>

          </View>
          
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{
              paddingBottom: 100, // Add enough padding for the progress bar and bottom bar
            }}
          ><WelcomeMessage name={kidName} male={maleKid} settings={settings} />
            {priorityTasks.length != 0 ? (
              <>
                <Text
                  style={[
                    styles.title,
                    {
                      fontSize: settings.fontSize + 2,
                      fontFamily: settings.font,
                    },
                  ]}
                >
                  Prioritetni zadaci
                </Text>
                <View style={styles.tasks}>
                  <ScrollView
                    horizontal
                    decelerationRate={0.9}
                    snapToInterval={305} //your element width
                    snapToAlignment={"start"}
                    showsHorizontalScrollIndicator={false}
                  >
                    {priorityTasks.map((task) => {
                      if (!subTasks.get(task.id)) return null;
                      return (
                        <View key={task.id}>
                          <TouchableOpacity
                            activeOpacity={0.6}
                            style={styles.taskPressable}
                            onPress={() => handleTaskPress(task)}
                          >
                            <Task
                              task={task}
                              settings={settings}
                              taskColor={settings.colorOfPriorityTask}
                              subTasks={subTasks.get(task.id)}
                              updateTaskScreen={fetchData}
                            />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              </>
            ) : undefined}

            {normalTasks.length != 0 ? (
              <>
                <Text
                  style={[
                    styles.title,
                    {
                      fontSize: settings.fontSize + 2,
                      fontFamily: settings.font,
                    },
                  ]}
                >
                  Manje prioritetni zadaci
                </Text>
                <View style={styles.tasks}>
                  <ScrollView
                    horizontal
                    decelerationRate={0.9}
                    snapToInterval={305} //your element width
                    snapToAlignment={"start"}
                    showsHorizontalScrollIndicator={false}
                  >
                    {normalTasks.map((task) => {
                      if (!subTasks.get(task.id)) return null;
                      return (
                        <View key={task.id}>
                          <TouchableOpacity
                            activeOpacity={0.6}
                            style={styles.taskPressable}
                            onPress={() => {
                              handleTaskPress(task);
                            }}
                          >
                            <Task
                              task={task}
                              settings={settings}
                              taskColor={settings.colorOfNormalTask}
                              subTasks={subTasks.get(task.id)}
                              updateTaskScreen={fetchData}
                            />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              </>
            ) : undefined}
          </ScrollView>
          <SideButtons onChatPress={handleChatPress} onSOSPress={handleSOSPress} />
        </SafeAreaView>
      </LinearGradient>
    );
  }
}

const styles = StyleSheet.create({
  tasks: {

  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  title: {
    fontSize: 24,
    marginLeft: 25,
    marginBottom: 10,
    marginTop: 20,
    fontWeight: "bold"
  },
  taskPressable: {
    width: 280,
    marginLeft: 25,
  },
  congratulationBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
  },
  congratulationsText: {
    fontSize: 30,
    fontWeight: "bold",
  },
  logoutButton: {
    marginTop: 15,
    marginLeft: 15,
  },
  container: {
    flex: 1,
    // Add other styles for your main content container if needed
  },
  buttonContainer: {
    position: 'absolute', // Position the container absolutely
    bottom: 16, // Adjust the bottom spacing as needed
    right: 16, // Adjust the right spacing as needed
  },
  button: {
    backgroundColor: 'blue', // Set the background color of the button
    width: 64, // Set the width and height to make it circular
    height: 64,
    borderRadius: 32, // Set half of the width to make it circular
    alignItems: 'center', // Center the icon horizontally
    justifyContent: 'center', // Center the icon vertically
    // Add other styles for the button if needed
  },
});

export default TasksScreen;
