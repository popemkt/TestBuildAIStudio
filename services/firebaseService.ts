import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// A simple check to see if the necessary environment variables are set.
export const isFirebaseConfigured = !!firebaseConfig.apiKey;

// Initialize Firebase
let app: FirebaseApp;
// Conditionally initialize Firebase only if the keys are provided.
if (isFirebaseConfigured) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} else {
  // Provide a dummy app object if not configured to prevent crashes,
  // though the app logic should prevent Firebase services from being called.
  app = {} as FirebaseApp;
}

// Export Firebase services
export const auth: Auth = isFirebaseConfigured ? getAuth(app) : ({} as Auth);
export const db: Firestore = isFirebaseConfigured
  ? getFirestore(app)
  : ({} as Firestore);
export const storage: FirebaseStorage = isFirebaseConfigured
  ? getStorage(app)
  : ({} as FirebaseStorage);
export default app;
