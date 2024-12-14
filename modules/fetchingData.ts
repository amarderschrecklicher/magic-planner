import { todayTask, compareTimes } from "./dateModules";
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, Task } from "react-native";
import Constants from "expo-constants";
import moment from 'moment-timezone';
import {
  collection,
  addDoc,
} from 'firebase/firestore';
import { database } from "../modules/firebase";

const API_BASE_URL = 'https://ema.downsy.ba';


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

export async function fetchAccount(accountID: number): Promise< AccountData | undefined> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/child/${accountID}`
    );
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
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
    const response = await fetch(`${API_BASE_URL}/api/v1/task/${accountID}`);
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
      const url = `${API_BASE_URL}/api/v1/task/sub/${task.id}`;
      const response = await fetch(url);

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
    const response = await fetch(
      `${API_BASE_URL}/api/v1/account/settings/${accountID}`
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

    await fetch(`${API_BASE_URL}/api/v1/task/sub/done/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
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
    await fetch(`${API_BASE_URL}/api/v1/task/done/${id}`, {
      method: "PUT",
    });
  } catch (error) {
    console.error("Failed to update finished task in Task:", error);
  }
}

export async function updateStartedTask(id:number) {
  try {
    await fetch(`${API_BASE_URL}/api/v1/task/start/${id}`, {
      method: "PUT",
    });
  } catch (error) {
    console.error("Failed to update finished task in Task:", error);
  }
}

export async function fetchStringCodes() {
  const response = await fetch(`${API_BASE_URL}/api/v1/account/settings`);
  const data = await response.json();
  return data;
}

export async function fetchTokens(id:number) {
  const response = await fetch(`${API_BASE_URL}/api/v1/token/${id}`);
  const data = await response.json();
  const token = data.find((token: { modelId: any; }) => token.modelId == Device.modelName);
  
  return {token}
}

export async function updateToken(newToken:string,id:number) {
  try {
    await fetch(`${API_BASE_URL}/api/v1/token/update/${id}`, {
      method: "PUT", 
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token: newToken,
      })
    });
  } catch (error) {
    console.error("Failed to update token", error);
  }
}

export async function deleteToken(token:string ) {
  try {
    await fetch(`${API_BASE_URL}/api/v1/token`, {
      method: "DELETE", 
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token: token,
      })
    });
  } catch (error) {
    console.error("Failed to delete token", error);
  }
}

export async function addToken(newToken:string,id:number,modelId:string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/token/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        accountId: id,
        modelId: modelId,
        token: newToken
      })
    });
    const data = await response.json();
    console.log("Odgovor za token :"+data)
    return data;

  } catch (error) {
    console.error("Failed to update finished task in Task:", error);
  }
}

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    } 

    if(Constants.easConfig){
    const result = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.easConfig.projectId,
    });
    token = result.data;
  }
  } else {
    alert('Must use physical device for Push Notifications');
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