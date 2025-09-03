import React, { ButtonHTMLAttributes } from 'react';
import Spinner from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseClasses =
    'font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform flex items-center justify-center gap-2 shadow-sm disabled:shadow-none active:scale-[0.98]';

  const variantClasses = {
    primary:
      'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white hover:from-indigo-600 hover:to-indigo-700 focus:ring-indigo-500 hover:-translate-y-0.5 hover:shadow-lg active:shadow-inner disabled:hover:translate-y-0',
    secondary:
      'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700/60 active:bg-gray-100 dark:active:bg-gray-900',
    danger:
      'bg-gradient-to-br from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-700 focus:ring-red-500 hover:-translate-y-0.5 hover:shadow-lg active:shadow-inner disabled:hover:translate-y-0',
  };

  const sizeClasses = {
    sm: 'py-2 px-3 text-sm',
    md: 'py-2.5 px-5 text-base',
    lg: 'py-3 px-6 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Spinner size="w-5 h-5" />}
      {children}
    </button>
  );
};

export default Button;
