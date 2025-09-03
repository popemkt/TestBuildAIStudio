import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import { ICONS } from '../constants';

const ProfileScreen: React.FC = () => {
  const { currentUser, logout, theme, setTheme } = useAppStore((state) => ({
    currentUser: state.currentUser,
    logout: state.logout,
    theme: state.theme,
    setTheme: state.setTheme,
  }));
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="relative">
      {/* Floating Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute left-4 top-4 z-10 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-indigo-500 dark:hover:bg-gray-800 md:hidden"
        aria-label="Go back"
      >
        <ICONS.BACK className="h-6 w-6" />
      </button>

      <div className="flex flex-col items-center p-6 pt-12 md:pt-6">
        <Avatar
          src={currentUser.avatarUrl}
          alt={currentUser.name}
          size="lg"
          className="mb-4 h-24 w-24"
        />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          {currentUser.name}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          User ID: {currentUser.id}
        </p>

        <div className="mt-8 w-full max-w-xs space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
            <label
              htmlFor="dark-mode-toggle"
              className="font-medium text-gray-700 dark:text-gray-300"
            >
              Dark Mode
            </label>
            <button
              id="dark-mode-toggle"
              role="switch"
              aria-checked={theme === 'dark'}
              onClick={handleThemeToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                theme === 'dark'
                  ? 'bg-indigo-600'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <Button onClick={handleLogout} variant="danger" className="w-full">
            Logout
          </Button>
        </div>
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>This is a demo application.</p>
          <p>More profile settings would appear here.</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
