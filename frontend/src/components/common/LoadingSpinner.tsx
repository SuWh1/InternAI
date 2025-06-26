import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  className = '' 
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-theme-hover border-t-theme-accent transition-colors duration-300 ${sizeClasses[size]} ${className}`} />
  );
};

// New animated loading icon for subtopic generation
export const SubtopicLoadingIcon: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({ 
  size = 'medium' 
}) => {
  const sizeClasses = {
    small: 'w-5 h-5',
    medium: 'w-6 h-6', 
    large: 'w-8 h-8'
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {/* Outer rotating ring */}
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-600 animate-spin"></div>
      
      {/* Inner rotating ring - opposite direction */}
      <div className="absolute inset-1 rounded-full border-2 border-transparent border-b-purple-400 animate-spin" 
           style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
      
      {/* Center dot with pulse */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1 h-1 bg-purple-600 rounded-full animate-pulse"></div>
      </div>
      
      {/* Rotating dots around the circle */}
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '1.2s' }}>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-purple-500 rounded-full"></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-purple-500 rounded-full opacity-60"></div>
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-purple-500 rounded-full opacity-30"></div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-purple-500 rounded-full opacity-80"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 