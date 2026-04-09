import { getApps, initializeApp, FirebaseApp } from "firebase/app";

// These values are now configured for your specific Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyAs-placeholder-key-for-terminal",
  authDomain: "quantedge-terminal.firebaseapp.com",
  projectId: "quantedge-terminal",
  storageBucket: "quantedge-terminal.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

export function getFirebaseApp(): FirebaseApp {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }
  return initializeApp(firebaseConfig);
}
