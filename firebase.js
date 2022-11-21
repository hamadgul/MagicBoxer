import { initializeApp } from "firebase/app";
//import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "null",
  authDomain: "null",
  databaseURL: "null",
  projectId: "null",
  storageBucket: "null",
  messagingSenderId: "null"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

