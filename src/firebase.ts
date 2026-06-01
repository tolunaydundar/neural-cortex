import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  projectId: "neural-cortex",
  appId: "1:109936735660:web:105ca3fdc192ae35b1f609",
  storageBucket: "neural-cortex.firebasestorage.app",
  apiKey: "AIzaSyCV8LbYxuWXA2jWGXPcyA67pjGwpuwIaHg",
  // Use the current domain in production to force first-party cookies for auth
  // This bypasses aggressive tracking blockers (Safari/Brave) that block redirects.
  authDomain: typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? window.location.hostname 
    : "neural-cortex.firebaseapp.com",
  messagingSenderId: "109936735660",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore with offline persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
});
