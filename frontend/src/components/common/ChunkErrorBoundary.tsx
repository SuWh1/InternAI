import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { reportChunkError } from '../../services/errorReporting';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
  isOffline: boolean;
}

// Detect if error is related to chunk loading
const isChunkError = (error: Error): boolean => {
  const message = error.message?.toLowerCase() || '';
  const stack = error.stack?.toLowerCase() || '';
  
  return (
    message.includes('loading chunk') ||
    message.includes('failed to fetch') ||
    message.includes('dynamically imported module') ||
    message.includes('import() failed') ||
    stack.includes('chunk') ||
    // Network errors that might affect chunks
    message.includes('network error') ||
    message.includes('fetch error') ||
    error.name === 'ChunkLoadError'
  );
};

// Clear browser caches to fix stale chunk issues
const clearCaches = async (): Promise<void> => {
  try {
    // Clear service worker caches if available
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
    
    // Force reload from server, not cache
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
    }
  } catch (error) {
    console.warn('Cache clearing failed:', error);
  }
};

export class ChunkErrorBoundary extends Component<Props, State> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
      isOffline: !navigator.onLine
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidMount() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ChunkErrorBoundary caught error:', error, errorInfo);
    
    // Report the error for analytics
    reportChunkError(error, errorInfo, this.state.retryCount);
    
    // If it's a chunk error and we haven't exceeded max retries, try auto-retry
    if (isChunkError(error) && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.autoRetry();
    }
    
    this.props.onError?.(error, errorInfo);
  }

  handleOnline = () => {
    this.setState({ isOffline: false });
    // If we were offline and now back online, auto-retry if there was an error
    if (this.state.hasError && isChunkError(this.state.error!)) {
      this.handleRetry();
    }
  };

  handleOffline = () => {
    this.setState({ isOffline: true });
  };

  autoRetry = () => {
    // Wait a bit before retrying to avoid overwhelming the server
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 5000); // Exponential backoff, max 5s
    
    this.retryTimer = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false
      }));
    }, delay);
    
    this.setState({ isRetrying: true });
  };

  handleRetry = async () => {
    this.setState({ isRetrying: true });
    
    // For chunk errors, clear caches before retrying
    if (this.state.error && isChunkError(this.state.error)) {
      await clearCaches();
      
      // Force a hard reload if we've tried multiple times
      if (this.state.retryCount >= 2) {
        window.location.reload();
        return;
      }
    }
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1,
      isRetrying: false
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isChunkErr = isChunkError(this.state.error);
      const maxRetries = this.props.maxRetries || 3;
      const canRetry = this.state.retryCount < maxRetries;

      return (
        <div className="min-h-[400px] flex items-center justify-center bg-theme-secondary rounded-xl border border-theme p-8">
          <div className="text-center max-w-md">
            {this.state.isOffline ? (
              <WifiOff className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            ) : (
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            )}
            
            <h2 className="text-xl font-semibold text-theme-primary mb-2">
              {this.state.isOffline 
                ? 'You\'re offline' 
                : isChunkErr 
                  ? 'Loading failed' 
                  : 'Something went wrong'
              }
            </h2>
            
            <p className="text-theme-secondary mb-4">
              {this.state.isOffline 
                ? 'Please check your internet connection and try again.'
                : isChunkErr 
                  ? 'Failed to load application resources. This might be due to a network issue or an app update.'
                  : this.state.error.message || 'An unexpected error occurred'
              }
            </p>

            {this.state.retryCount > 0 && (
              <p className="text-sm text-theme-secondary mb-4">
                Retry attempt {this.state.retryCount} of {maxRetries}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-theme-accent text-white rounded-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                  <span>{this.state.isRetrying ? 'Retrying...' : 'Try Again'}</span>
                </button>
              )}
              
              {(isChunkErr || !canRetry) && (
                <button
                  onClick={this.handleReload}
                  className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload Page</span>
                </button>
              )}
            </div>

            {this.state.isOffline && (
              <div className="mt-4 flex items-center justify-center text-sm text-theme-secondary">
                <Wifi className="w-4 h-4 mr-2" />
                <span>Waiting for connection...</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for easier usage with chunk error handling
export const withChunkErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    maxRetries?: number;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }
) => {
  return (props: P) => (
    <ChunkErrorBoundary
      fallback={options?.fallback}
      maxRetries={options?.maxRetries}
      onError={options?.onError}
    >
      <Component {...props} />
    </ChunkErrorBoundary>
  );
};
