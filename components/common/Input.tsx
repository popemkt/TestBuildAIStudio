import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  containerClassName?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  id,
  containerClassName = '',
  className,
  ...props
}) => {
  const inputClasses = [
    'w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 sm:text-sm',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`${containerClassName} overflow-visible`}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <input id={id} className={inputClasses} {...props} />
    </div>
  );
};

export default Input;
