import React, { useEffect, useState } from 'react';
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { useAppStore } from './store/appStore';
import { ToastProvider } from './context/ToastContext';
import { dataService } from './services/data/DataServiceFacade';

import LoginScreen from './screens/LoginScreen';
import GroupsScreen from './screens/GroupsScreen';
import GroupDetailScreen from './screens/GroupDetailScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import ProfileScreen from './screens/ProfileScreen';
import BottomNav from './components/common/BottomNav';
import SidebarNav from './components/common/SidebarNav';
import Spinner from './components/common/Spinner';

const AppContent: React.FC = () => {
  const { isAuthenticated, setCurrentUser } = useAppStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    setCurrentUser: state.setCurrentUser,
  }));
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = dataService.onAuthStateChanged(async (user) => {
      await setCurrentUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setCurrentUser]);

  if (isLoading) {
    return (
      <div className="mx-auto flex h-dvh max-w-md flex-col items-center justify-center bg-white shadow-lg dark:bg-gray-900">
        <Spinner size="w-12 h-12" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          Loading your space...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-7xl">
      {!isAuthenticated ? (
        <div className="flex flex-1 flex-col">
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route
              path="*"
              element={
                <Navigate to="/login" state={{ from: location }} replace />
              }
            />
          </Routes>
        </div>
      ) : (
        <>
          <SidebarNav />
          <div className="flex flex-1 flex-col bg-white shadow-lg dark:bg-gray-900 md:my-4 md:ml-0 md:rounded-xl lg:ml-4">
            <div className="relative flex-grow overflow-hidden">
              <main className="no-scrollbar absolute inset-0 overflow-y-auto pb-20 md:pb-4">
                <Routes>
                  <Route path="/groups" element={<GroupsScreen />} />
                  <Route
                    path="/group/:groupId"
                    element={<GroupDetailScreen />}
                  />
                  <Route path="/add-expense" element={<AddExpenseScreen />} />
                  <Route
                    path="/add-expense/:groupId"
                    element={<AddExpenseScreen />}
                  />
                  <Route
                    path="/edit-expense/:expenseId"
                    element={<AddExpenseScreen />}
                  />
                  <Route path="/profile" element={<ProfileScreen />} />
                  <Route path="*" element={<Navigate to="/groups" />} />
                </Routes>
              </main>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-24 bg-gradient-to-t from-white to-transparent dark:from-gray-900 md:hidden"></div>
            </div>
            <BottomNav />
          </div>
        </>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  return (
    <ToastProvider>
      <HashRouter>
        <div className="min-h-screen bg-gray-100 font-sans text-gray-800 dark:bg-black dark:text-gray-200">
          <AppContent />
        </div>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;
