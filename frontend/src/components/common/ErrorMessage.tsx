import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { ApiError } from '../../types/api';

interface ErrorMessageProps {
  error: ApiError | Error | string;
  onRetry?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  error, 
  onRetry, 
  className = '' 
}) => {
  const getErrorMessage = () => {
    if (typeof error === 'string') {
      return error;
    }
    
    if ('message' in error) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  };

  return (
    <div className={`bg-error border-2 border-error rounded-lg p-4 transition-colors duration-300 ${className}`}>
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-error-icon mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-bold text-error mb-1">
            Error
          </h3>
          <p className="text-sm font-semibold text-error">
            {getErrorMessage()}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center px-3 py-1 border-2 border-error shadow-sm text-xs font-bold rounded text-error bg-theme-primary hover:bg-theme-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-accent transition-colors duration-300"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage; 