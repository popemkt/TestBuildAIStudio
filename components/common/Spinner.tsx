import React from 'react';

const Spinner: React.FC<{ size?: string }> = ({ size = 'w-5 h-5' }) => {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-solid border-current border-t-transparent ${size}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
