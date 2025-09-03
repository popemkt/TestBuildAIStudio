import { create } from 'zustand';
import { AppState, User } from '../types';
import { dataService } from '../services/data/DataServiceFacade';

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const storedTheme = window.localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches)
      return 'dark';
  }
  return 'light';
};

const defaultInitialState: AppState = {
  isAuthenticated: false,
  currentUser: null,
  theme: getInitialTheme(),
  isDemoMode: false,
};

interface AppActions {
  setCurrentUser: (user: User | null) => void;
  loginWithGoogle: () => Promise<void>;
  loginAsDemo: () => Promise<void>;
  logout: () => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  ...defaultInitialState,

  setCurrentUser: (user) => {
    if (user) {
      set({
        isAuthenticated: true,
        currentUser: user,
        isDemoMode: dataService.getMode() === 'demo',
      });
    } else {
      set({
        isAuthenticated: false,
        currentUser: null,
        isDemoMode: false,
      });
    }
  },

  loginWithGoogle: async () => {
    dataService.initialize('firebase');
    await dataService.signInWithGoogle();
    // The onAuthStateChanged listener in App.tsx will handle the state update.
  },

  loginAsDemo: async () => {
    dataService.initialize('demo');
    // This will trigger the onAuthStateChanged listener in App.tsx, which then calls setCurrentUser.
    // This makes the demo login flow consistent with the Firebase login flow.
    await dataService.signInWithGoogle();
  },

  logout: async () => {
    await dataService.signOut();
    // The onAuthStateChanged listener will set user to null, which resets the session state.
  },

  setTheme: (theme) => set({ theme }),
}));
