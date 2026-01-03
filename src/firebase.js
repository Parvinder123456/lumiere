// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD9-aU4sYdh2jup06v31__67qWd6jJPW3s",
  authDomain: "lumiereauth.firebaseapp.com",
  projectId: "lumiereauth",
  storageBucket: "lumiereauth.firebasestorage.app",
  messagingSenderId: "592129852976",
  appId: "1:592129852976:web:572f2c62d288272f8acff5",
  measurementId: "G-2YXDXBRLYR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);