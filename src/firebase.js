import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Automatically mapped from the carbonaqi project ID found in the admin SDK keys
const firebaseConfig = {
  apiKey: "AIzaSyA18kLX4OcfyOxl50gphAp-_RU7r_SUt_E",
  authDomain: "carbonaqi.firebaseapp.com",
  projectId: "carbonaqi",
  storageBucket: "carbonaqi.firebasestorage.app",
  messagingSenderId: "410536766569",
  appId: "1:410536766569:web:af2dd45895d271a057c6f8",
  measurementId: "G-B9E22SSFYH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
