import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDjRHWvvcpWcyNe5SHLtW40eEOkJZ4DN_Q",
  authDomain: "iklimlendirme-projesi-c44c7.firebaseapp.com",
  projectId: "iklimlendirme-projesi-c44c7",
  storageBucket: "iklimlendirme-projesi-c44c7.firebasestorage.app",
  messagingSenderId: "681241970843",
  appId: "1:681241970843:web:47e3417e2159be4777de3e"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);