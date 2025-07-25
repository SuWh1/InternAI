import React from 'react';
import { Loader, LoaderCircle } from 'lucide-react'; // Import Loader and LoaderCircle icons

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  return (
    <LoaderCircle className={`text-white spin-animation ${sizeClasses[size]} ${className}`} />
  );
};

// Full-page loading component for route transitions
export const PageLoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-theme-primary flex items-center justify-center transition-colors duration-300">
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-theme-hover border-t-theme-accent transition-colors duration-300" />
    </div>
  );
};

export const RoadmapPageLoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-theme-primary flex items-center justify-center transition-colors duration-300">
      <div className="flex flex-col items-center space-y-4">
        <div className="spin-animation">
          <Loader className="w-10 h-10 text-theme-accent" />
        </div>
        <span className="text-theme-text text-lg">Loading content...</span>
      </div>
    </div>
  );
};


export default LoadingSpinner;