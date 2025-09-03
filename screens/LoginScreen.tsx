import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToastContext } from '../context/ToastContext';
import Button from '../components/common/Button';
import { isFirebaseConfigured } from '../services/firebaseService';
import { useAppStore } from '../store/appStore';

const LoginScreen: React.FC = () => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const toast = useToastContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, loginAsDemo } = useAppStore();

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      // Navigation is now handled by the App component's auth state listener
    } catch (error) {
      toast.error('Failed to sign in. Please try again.');
      console.error('Google Sign-In Error:', error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      await loginAsDemo();
      // After loginAsDemo, the app state will update, and the router will navigate automatically.
      // We don't need to call navigate() here.
    } catch (error) {
      toast.error('Failed to start demo mode.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gray-50 p-8 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
          SplitSmart AI
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
          Track group expenses, the smart way.
        </p>
      </div>
      <div className="mt-12 w-full max-w-sm">
        <div className="space-y-4">
          {isFirebaseConfigured ? (
            <Button
              onClick={handleGoogleLogin}
              className="w-full"
              size="lg"
              variant="secondary"
              isLoading={isGoogleLoading}
            >
              <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                ></path>
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                ></path>
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                ></path>
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                ></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              Sign in with Google
            </Button>
          ) : (
            <div className="rounded-md bg-yellow-100 p-2 text-center text-xs text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">
              Firebase is not configured. Google Sign-In is disabled.
            </div>
          )}
          <Button
            onClick={handleDemoLogin}
            className="w-full"
            size="lg"
            variant="primary"
            isLoading={isDemoLoading}
          >
            Continue in Demo Mode
          </Button>
        </div>
        <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          {isFirebaseConfigured
            ? 'Your data is securely stored online.'
            : 'Demo data is not saved.'}
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
