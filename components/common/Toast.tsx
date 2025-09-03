import React, { useEffect, useState, useRef } from 'react';
import { ICONS } from '../../constants';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Show animation
    setIsVisible(true);

    // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
    let animationTimer: ReturnType<typeof setTimeout> | undefined;

    // Auto remove after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      animationTimer = setTimeout(() => onRemove(toast.id), 300); // Wait for animation
    }, toast.duration || 5000);

    return () => {
      clearTimeout(timer);
      if (animationTimer) clearTimeout(animationTimer);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [toast.id, toast.duration, onRemove]);

  const getToastStyles = () => {
    const baseStyles =
      'flex items-center p-4 rounded-lg shadow-lg border transition-all duration-300 transform max-w-sm backdrop-blur-sm';
    const visibilityStyles = isVisible
      ? 'translate-x-0 opacity-100'
      : 'translate-x-full opacity-0';

    switch (toast.type) {
      case 'success':
        return `${baseStyles} ${visibilityStyles} bg-green-50 dark:bg-green-900/80 border-green-200 dark:border-green-700 text-green-800 dark:text-green-100`;
      case 'error':
        return `${baseStyles} ${visibilityStyles} bg-red-50 dark:bg-red-900/80 border-red-200 dark:border-red-700 text-red-800 dark:text-red-100`;
      case 'warning':
        return `${baseStyles} ${visibilityStyles} bg-yellow-50 dark:bg-yellow-900/80 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-100`;
      case 'info':
      default:
        return `${baseStyles} ${visibilityStyles} bg-blue-50 dark:bg-blue-900/80 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-100`;
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <ICONS.SPARKLES className="mr-3 h-5 w-5 flex-shrink-0 text-green-500 dark:text-green-400" />
        );
      case 'error':
        return (
          <ICONS.CLOSE className="mr-3 h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400" />
        );
      case 'warning':
        return (
          <ICONS.FILTER className="mr-3 h-5 w-5 flex-shrink-0 text-yellow-500 dark:text-yellow-400" />
        );
      case 'info':
      default:
        return (
          <ICONS.SPARKLES className="mr-3 h-5 w-5 flex-shrink-0 text-blue-500 dark:text-blue-400" />
        );
    }
  };

  return (
    <div
      className={getToastStyles()}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      {getIcon()}
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          closeTimerRef.current = setTimeout(() => onRemove(toast.id), 300);
        }}
        className="ml-3 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
        aria-label="Close notification"
      >
        <ICONS.CLOSE className="h-4 w-4" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed right-4 top-4 z-50 space-y-2"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

export default Toast;
