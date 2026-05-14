import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCpd7TlI5R_RHHptJ65sRQuqTsQSoBfs4c",
  authDomain: "iklimlendirme-projesi-5d539.firebaseapp.com",
  projectId: "iklimlendirme-projesi-5d539",
  storageBucket: "iklimlendirme-projesi-5d539.firebasestorage.app",
  messagingSenderId: "535497378355",
  appId: "1:535497378355:web:f7eb8ccc51451cb1a83146",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);