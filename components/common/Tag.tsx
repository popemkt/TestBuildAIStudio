import React from 'react';

interface TagProps {
  children: React.ReactNode;
  className?: string;
}

const Tag: React.FC<TagProps> = ({ children, className }) => {
  return (
    <span
      className={`rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 ${className}`}
    >
      {children}
    </span>
  );
};

export default Tag;
