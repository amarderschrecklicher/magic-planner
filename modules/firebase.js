import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from 'firebase/auth';
import { getStorage  } from 'firebase/storage'
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyAH2dqWzqMwwXr8Nu0S4pmDEgT186hQc2c",
    authDomain: "magic-planner-530fc.firebaseapp.com",
    projectId: "magic-planner-530fc",
    storageBucket: "magic-planner-530fc.appspot.com",
    messagingSenderId: "752799112874",
    appId: "1:752799112874:web:45961411dfa9a0c3b9bad3",
    measurementId: "G-E6XF2P5LW5"
  };

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;
try {
  auth = getAuth(app);
} catch (e) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { auth };
export const database  = getFirestore(app);
export const storage = getStorage(app);