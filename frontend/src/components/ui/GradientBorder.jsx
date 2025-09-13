import React from 'react';

const GradientBorder = ({ children, className = '', borderWidth = 2, animated = false }) => {
  return (
    <div className={`relative ${className}`}>
      <div
        className={`absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 ${
          animated ? 'animate-gradient-x' : ''
        }`}
        style={{
          padding: `${borderWidth}px`,
          background: animated 
            ? 'linear-gradient(-45deg, #ff4500, #ff6b35, #ff8c42, #ff4500)' 
            : 'linear-gradient(45deg, #ff4500, #ff6b35)',
          backgroundSize: animated ? '400% 400%' : 'auto',
        }}
      >
        <div className="h-full w-full rounded-xl bg-slate-900">
          {children}
        </div>
      </div>
    </div>
  );
};

export default GradientBorder;