'use client';

import React from 'react';

const LoadingDashboard: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      {/* Spinner Container */}
      <div className="relative w-12 h-12">
        {/* Circular Gradient Spinner */}
        <div 
          className="w-full h-full rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, #3b82f6 270deg, #60a5fa 360deg)',
            WebkitMask: 'radial-gradient(transparent 60%, black 61%)',
            mask: 'radial-gradient(transparent 60%, black 61%)',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
      </div>
      
      {/* Loading Text */}
      <p className="mt-4 text-sm font-medium text-gray-500 tracking-wide font-sans">
        Loading dashboard...
      </p>
    </div>
  );
};

export default LoadingDashboard;
