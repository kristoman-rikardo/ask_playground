
import React from 'react';

const ButtonLoader: React.FC = () => {
  return (
    <div className="flex justify-center items-center p-4">
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse-dot-1"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse-dot-2"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse-dot-3"></div>
      </div>
    </div>
  );
};

export default ButtonLoader;
