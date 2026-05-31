import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "neural-cortex-app-2026",
  appId: "1:580792319098:web:fa198f745733b537050fc3",
  storageBucket: "neural-cortex-app-2026.firebasestorage.app",
  apiKey: "AIzaSyBvdGpOGxwVLZgirp7pNTWb_zMAX5OdIBY",
  authDomain: window.location.host || "neural-cortex-app-2026.firebaseapp.com",
  messagingSenderId: "580792319098",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
export const db = getFirestore(app);
