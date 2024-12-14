import React, { useState, useEffect, useRef, useCallback } from "react";
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
import CurrentDate from "../../components/CurrentDate";
import LoadingAnimation from "../../components/LoadingAnimation";
import SideButtons from "../../components/SideButtons";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { fetchTasks, fetchSettings, fetchSubTasks, fetchAccount, TaskData, SubTaskData, SettingsData } from "../../modules/fetchingData";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useUser } from "@/modules/UserContext";

function ProgressScreen() {
    const [finishedTasks, setFinishedTasks] = useState<TaskData[] | null>(null);
    const [subTasks, setSubTasks] = useState<Map<number, SubTaskData[]> | null>(null);
    const [settings, setSettings] = useState<SettingsData | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const { accountID, email } = useUser();

  useFocusEffect(
    useCallback(() => {
        console.log("TasksScreen focused, fetching data...");
        fetchData(false);

        return () => {
      
        };
    }, [])
);

    async function 
    fetchData(refresh: boolean) {
        try {
            await fetchAccount(accountID);
            const tasksData = await fetchTasks(accountID);
            if (tasksData) {
                setFinishedTasks(tasksData.finished);

                const subtasksData = await fetchSubTasks(tasksData ? tasksData.data : []);

                if (subtasksData)
                    setSubTasks(subtasksData);
            }

            const settingsData = await fetchSettings(accountID);

            if (settingsData)
                setSettings(settingsData);
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

  const handleChatPress = () => {
    router.push("chat");
  };

  const handleSOSPress = () => {
    router.push({
      pathname: "chat",
      params: { sos: "SOS" },
    });
  };

    if (!finishedTasks || !subTasks || !settings) {
        return <LoadingAnimation />;
    }

    return (
        <SafeAreaView style={{ backgroundColor: settings.colorForBackground, flex: 1 }}>
            <View style={styles.header}>
                <CurrentDate settings={settings} />
            </View>
            <Text
                style={[
                    styles.title,
                    {
                        fontSize: settings.fontSize + 2,
                        fontFamily: settings.font,
                    },
                ]}
            >
                Završeni zadaci
            </Text>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}
                />}
                contentContainerStyle={{
                    paddingBottom: 100, // Add enough padding for the progress bar and bottom bar
                }}
            >
                <View style={styles.verticalTasks}>
                    {finishedTasks.map((task) => {
                        if (!subTasks.get(task.id)) return null;
                        return (
                            <View key={task.id} style={styles.taskItem}>
                                <View style={styles.taskPressable}>
                                    <Task
                                        task={task}
                                        settings={settings}
                                        taskColor={settings.colorOfPriorityTask}
                                        subTasks={subTasks.get(task.id)}
                                        updateTaskScreen={fetchData}
                                    />
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
            <SideButtons onChatPress={handleChatPress} onSOSPress={handleSOSPress} />
            <StatusBar style="auto" translucent={true} hidden={false} backgroundColor={settings.colorForBackground} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        padding: 15,
    },
    verticalTasks: {
        flexDirection: "column",
        alignItems: "center",
        marginBottom: 20,
    },
    taskItem: {
        width: "90%",
        marginBottom: 15,
    },
    title: {
        fontSize: 24,
        textAlign: "center",
        marginBottom: 10,
        marginTop: 40,
    },
    taskPressable: {
        width: "100%",
    },
});

export default ProgressScreen;