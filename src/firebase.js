// Import the functions you need from the SDKs you need
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfW0SDnLNUyXvhGy45LpAGQBLBL1Jnu94",
  authDomain: "fited-project-f557e.firebaseapp.com",
  projectId: "fited-project-f557e",
  storageBucket: "fited-project-f557e.firebasestorage.app",
  messagingSenderId: "154442763077",
  appId: "1:154442763077:web:792de8448210482f730c2c"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
export default db;