// app/lib/firebase.ts

import { initializeApp, FirebaseApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDw9qNMmxzOdmfcQyLsQV7TOLL_Itob0Y4",
  authDomain: "messmate-888.firebaseapp.com",
  projectId: "messmate-888",
  storageBucket: "messmate-888.firebasestorage.app",
  messagingSenderId: "231756151137",
  appId: "1:231756151137:web:af619d5fb056ca277dad20",
  measurementId: "G-L0E8L2WKK3",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | null = null;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);

if (typeof window !== "undefined" && app.name && firebaseConfig.measurementId) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.error("Failed to initialize Firebase Analytics:", error);
  }
}

export { app, auth, db, analytics };

export default app;
