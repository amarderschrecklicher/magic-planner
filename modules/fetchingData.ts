import { todayTask, compareTimes } from "./dateModules";
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from "react-native";
import Constants from "expo-constants";
import moment from 'moment-timezone';
import {
  collection,
  addDoc,
} from 'firebase/firestore';
import { database } from "../modules/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";


const API_BASE_URL = 'http://192.168.33.23:8080';

export interface AccountData {
  id: number;
  name: string;
  gender: boolean; 
  email: string; 
  password: string
}

export interface TaskData {
  id: number;
  taskName: string;
  dueDate: string;
  priority: boolean;
  done: boolean;
  description:string,
  dueTime:string,
  difficulty:string,
  start:string | null,
  end: string | null,
  overDo:boolean
}

export interface SubTaskData {
  id: number,
  parentTaskId: string,
  name: string,
  done: boolean,
  description: string,
  needPhoto: boolean
}

export interface SettingsData{
  colorForBackground:string,
  fontSize:number,
  font:string,
  colorOfNormalTask:string,
  colorOfPriorityTask:string,
  colorForFont:string,
  colorForProgress:string,
}

type MyClaims = {
  exp?: number,
  phoneLoginString: string
};

async function getJwt(): Promise<string | null> {
  return AsyncStorage.getItem("jwtToken");
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  let access = await getJwt();
  const headers = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
  };

  // First attempt
  let res = await fetch(input, { ...init, headers });

  if (res.status !== 401) return res;

  // Attempt refresh once
  const phoneLoginString = await AsyncStorage.getItem("phoneLoginString");
  const newAccess = await getMobileTokens(phoneLoginString || "");
  if (!newAccess) return res; // still 401; let caller handle logout

  // Retry original with new token
  const retryHeaders = {
    ...headers,
    Authorization: `Bearer ${newAccess}`,
  };
  res = await fetch(input, { ...init, headers: retryHeaders });
  return res;
}

export async function getMobileTokens(phoneLoginString: string) {

  console.log("Fetching mobile tokens for phoneLoginString:", phoneLoginString);

  // ✅ Wait until a real Expo token is available
  const notificationToken = await registerForPushNotificationsAsync();
  console.log("Notification token:", notificationToken);
  console.log("Device model:", Device.modelName);
  const response = await fetch(`${API_BASE_URL}/api/v1/token/mobile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phoneLoginString: phoneLoginString,
      notificationToken: notificationToken,
      modelId: Device.modelName,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch JWT token");
  }

  const child = await response.json();
  console.log(child.jwtToken);

  // persist values
  await AsyncStorage.setItem("account", child.id.toString());
  await AsyncStorage.setItem("email", child.email);
  await AsyncStorage.setItem("password", child.password);
  await AsyncStorage.setItem("jwtToken", child.jwtToken);
  await AsyncStorage.setItem(
    "phoneLoginString",
    decodePhoneLoginString(child.jwtToken) || ""
  );
  await AsyncStorage.setItem("expo_token", notificationToken);

  return child;
}


export function decodePhoneLoginString(token: string): string | null {
  const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
  const claims = jwtDecode<MyClaims>(raw);

    return claims.phoneLoginString;
}

export async function decodeJWTTokenExpired(token: string): Promise<void> {
  const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
  const claims = jwtDecode<MyClaims>(raw);

  if (!claims.exp) return;

  const currentTime = Math.floor(Date.now() / 1000);
  if (claims.exp - currentTime < 3600) 
    await getMobileTokens(claims.phoneLoginString);

}


export async function fetchAccount(accountID: number): Promise< AccountData | undefined> {
  try {

    const res = await apiFetch(`${API_BASE_URL}/api/v1/child/${accountID}`, {
      method: "GET",
    });
    if (!res.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await res.json();

    const account :AccountData = {
      id: data.id,
      name: data.name,
      gender: data.kidMale, 
      email: data.email, 
      password: data.password
    }
    return account;
  } catch (error) {
    console.error("Failed to fetch account in TasksScreen:", error);
    return undefined;
  }
}


export async function fetchTasks(accountID: number): Promise<{ data: any[], priority: TaskData[], normal: TaskData[], finished: TaskData[] } | undefined> {
  try {
    
    const response = await apiFetch(`${API_BASE_URL}/api/v1/task/${accountID}`,{ 
        method: "GET"       
      });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    let priority: TaskData[] = [];
    let normal: TaskData[] = [];
    let finished: TaskData[] = [];

    data.forEach((element: any) => {


        let task : TaskData = {
          id: element.id,
          taskName: element.taskName,
          dueDate: element.dueDate,
          priority: element.priority,
          done: element.done,
          description: element.description,
          dueTime: element.dueTime,
          difficulty: element.difficulty,
          start : element.start? moment(element.start).format('DD.MM.YYYY. u HH:mm') : null,
          end: element.end? moment(element.end).format('DD.MM.YYYY. u HH:mm') : null,
          overDo : todayTask(element.dueDate,element.dueTime)
        }      
        if (!element.done) {        
          if (element.priority) priority.push(task);
          else normal.push(task);
      }
      else{
        finished.push(task);
      }
    });

    priority.sort((a: any, b: any) => compareTimes(a, b));
    normal.sort((a: any, b: any) => compareTimes(a, b));

    return { data, priority, normal, finished };
  } catch (error) {
    console.error("Failed to fetch tasks in TasksScreen:", error);
    return undefined;
  }
}


export async function fetchSubTasks(tasks: TaskData[]): Promise<Map<number, SubTaskData[]> | void> {
  try {
    
    const temp = new Map<number, SubTaskData[]>();

    for (const task of tasks) {
      const response = await apiFetch(`${API_BASE_URL}/api/v1/task/sub/${task.id}`, { 
        method: "GET"        
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch subTasks for task ${task.id}`);
      }

      const data: SubTaskData[] = await response.json();
      if (data.length !== 0) {
        temp.set(task.id, data);
      }


    }

    return temp;
  } catch (error) {
    console.error("Failed to fetch subTasks in TasksScreen:", error);
  }
}


export async function fetchSettings(accountID:number): Promise<SettingsData | undefined> {
  try {
    const response = await apiFetch(
      `${API_BASE_URL}/api/v1/account/settings/${accountID}`, { 
        method: "GET" 
      }    
    );

    const data = await response.json();

    const settings:SettingsData = {
      colorForBackground:data.colorForBackground,
      fontSize: data.fontSize,
      font: data.font,
      colorOfNormalTask: data.colorOfNormalTask,
      colorOfPriorityTask: data.colorOfPriorityTask,
      colorForFont: data.colorForFont,
      colorForProgress: data.colorForProgress
    }

    return settings;
  } catch (error) {
    console.error("Failed to fetch settings in TasksScreen:", error);
  }
}

export async function updateFinishedSubTasks(id:number,done:boolean | null) {
  try {
    
    await apiFetch(`${API_BASE_URL}/api/v1/task/sub/done/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        done:done
      })
    });
  } catch (error) {
    console.error("Failed to update finished task in subTaks:", error);
  }
}

export async function updateFinishedTask(id:number) {
  try {    console.log("uso")
    
    await apiFetch(`${API_BASE_URL}/api/v1/task/done/${id}`, {
      method: "PUT"
    });
  } catch (error) {
    console.error("Failed to update finished task in Task:", error);
  }
}

export async function updateStartedTask(id:number) {
  try {
    await apiFetch(`${API_BASE_URL}/api/v1/task/start/${id}`, {
      method: "PUT"
    });
  } catch (error) {
    console.error("Failed to update finished task in Task:", error);
  }
}


export async function deleteToken(token:string ) {
  try {
    await apiFetch(`${API_BASE_URL}/api/v1/token`, {
      method: "DELETE",
      body: JSON.stringify({
        token: token,
      })
    });
  } catch (error) {
    console.error("Failed to delete token", error);
  }
}


export async function registerForPushNotificationsAsync(): Promise<string> {
  // Android channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      bypassDnd: false,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  if (!Device.isDevice) {
    // Simulators don’t support push
    throw new Error("Must use a physical device for push notifications.");
  }

  // Permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    // up to you: show UI then throw, so caller can catch it
    Alert.alert(
      "Notifications disabled",
      "Please enable notifications in Settings to receive task reminders."
    );
    throw new Error("Push notification permissions not granted.");
  }

  // Resolve projectId for EAS builds
  // In modern Expo, this is required for getExpoPushTokenAsync in EAS builds.
  const projectId =
    Constants?.easConfig?.projectId ??
    Constants?.expoConfig?.extra?.eas?.projectId ??
    undefined;

  // Get token (pass projectId when available)
  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  const token = tokenResponse?.data;
  if (!token || typeof token !== "string") {
    throw new Error("Failed to obtain a valid Expo push token.");
  }

  return token;
}


export async function saveMaterial(name:string, fileType:string, url:string, createdAt:string) {
  try {
      const materialData = {
          name: name,
          contentType: fileType,
          downloadURL: url,
          created: createdAt,
      };
  
      const docRef = await addDoc(collection(database, 'task_photos'), materialData);
      console.log('Material added with ID: ', docRef.id);
  } 
  catch (error) {
      console.error('Error adding material: ', error);
  }
}