import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // For database
import { getStorage } from "firebase/storage";   // For gallery
import { getAuth } from "firebase/auth";       // For authentication

const firebaseConfig = {
  apiKey: "AIzaSyCbEKcEe9IuWlFt1Ro3qXVAo-vF_o97-sQ",
  authDomain: "night-cricket-39bf7.firebaseapp.com",
  projectId: "night-cricket-39bf7",
  storageBucket: "night-cricket-39bf7.firebasestorage.app",
  messagingSenderId: "1007777294523",
  appId: "1:1007777294523:web:e34c557fa3ffd92004a19e",
  measurementId: "G-4SEKQN55KT"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
