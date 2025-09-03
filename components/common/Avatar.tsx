import React, { useState } from 'react';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(true);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div
      className={`${sizeClasses[size]} flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 ${className}`}
    >
      <img
        src={src}
        alt={alt}
        className={`h-full w-full rounded-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)} // Just show the background color on error
      />
    </div>
  );
};

export default Avatar;
