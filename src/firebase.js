// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDyU3nSSby6O8YK3tHdj5D2k1rP-2KPaUs",
  authDomain: "jewelai-7b522.firebaseapp.com",
  projectId: "jewelai-7b522",
  storageBucket: "jewelai-7b522.firebasestorage.app",
  messagingSenderId: "532814269645",
  appId: "1:532814269645:web:eccd5c168a3069d5b3ed84",
  measurementId: "G-ETPBBB3ZH2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);