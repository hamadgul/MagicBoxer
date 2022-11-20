import { initializeApp } from "firebase/app";
//import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAQHGHNXlSHmLOjgUt1Ce6yRh2JFY61hU4",
  authDomain: "magicpackingapp.firebaseapp.com",
  databaseURL: "https://magicpackingapp.firebaseio.com",
  projectId: "magicpackingapp",
  storageBucket: "magicpackingapp.appspot.com",
  messagingSenderId: "470203040425"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

