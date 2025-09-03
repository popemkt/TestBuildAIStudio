import {
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  Unsubscribe,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebaseService';
import { User } from '../types';

/**
 * Fetches the user document from Firestore, creating it if it doesn't exist.
 * This ensures every authenticated user has a profile in our database.
 * @param firebaseUser - The user object from Firebase Authentication.
 * @returns A promise that resolves to the application's User object.
 */
const getOrCreateUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as User;
  } else {
    const newUser: User = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'Anonymous',
      avatarUrl:
        firebaseUser.photoURL ||
        `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
      email: firebaseUser.email || '',
    };
    await setDoc(userRef, newUser);
    return newUser;
  }
};

/**
 * A comprehensive authentication service to manage user sessions.
 */
export const authService = {
  /**
   * Listens for changes in the user's authentication state.
   * @param callback - A function to be called with the app's User object or null.
   * @returns An unsubscribe function to clean up the listener.
   */
  onAuthStateChanged: (callback: (user: User | null) => void): Unsubscribe => {
    if (!isFirebaseConfigured) {
      callback(null);
      return () => {}; // Return a no-op unsubscribe function
    }
    return firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = await getOrCreateUser(firebaseUser);
        callback(appUser);
      } else {
        callback(null);
      }
    });
  },

  /**
   * Initiates the Google Sign-In process via a popup.
   * @returns A promise that resolves to the authenticated app User object.
   */
  signInWithGoogle: async (): Promise<User> => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Cannot sign in.');
    }
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return await getOrCreateUser(result.user);
  },

  /**
   * Signs the current user out of the application.
   * @returns A promise that resolves when sign-out is complete.
   */
  signOut: async (): Promise<void> => {
    if (!isFirebaseConfigured) {
      return; // Do nothing if Firebase is not configured
    }
    await firebaseSignOut(auth);
  },
};
