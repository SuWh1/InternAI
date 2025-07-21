// Utility for handling chunk loading errors with retry logic
import React from 'react';
import { reportChunkError } from '../services/errorReporting';
import { debounce, requestIdleCallback } from './performance';

interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
  onFinalError?: (error: Error) => void;
}

// Default options for retry behavior
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  delay: 1000,
  exponentialBackoff: true,
  onRetry: () => {},
  onFinalError: () => {}
};

// Check if error is related to chunk loading
export const isChunkError = (error: any): boolean => {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  const stack = error.stack?.toLowerCase() || '';
  const name = error.name?.toLowerCase() || '';
  
  return (
    message.includes('loading chunk') ||
    message.includes('failed to fetch') ||
    message.includes('dynamically imported module') ||
    message.includes('import() failed') ||
    message.includes('network error') ||
    message.includes('fetch error') ||
    stack.includes('chunk') ||
    name.includes('chunk') ||
    // Some browsers report different error types
    message.includes('loading css chunk') ||
    message.includes('loading js chunk') ||
    error.code === 'MODULE_NOT_FOUND'
  );
};

// Sleep utility for delays
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Clear browser caches to resolve stale chunk issues
export const clearAppCaches = async (): Promise<void> => {
  try {
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('Clearing caches:', cacheNames);
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
    
    // Unregister service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
    }
    
    console.log('Caches cleared successfully');
  } catch (error) {
    console.warn('Failed to clear caches:', error);
  }
};

// Retry wrapper for any async function
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // If this is the last attempt, throw the error
      if (attempt === opts.maxRetries) {
        opts.onFinalError(lastError);
        throw lastError;
      }
      
      // Only retry for chunk-related errors
      if (!isChunkError(error)) {
        throw lastError;
      }
      
      opts.onRetry(attempt + 1, lastError);
      
      // Report the error for analytics
      reportChunkError(lastError, { attempt: attempt + 1, function: fn.name }, attempt);
      
      // Calculate delay with optional exponential backoff
      const delay = opts.exponentialBackoff 
        ? opts.delay * Math.pow(2, attempt)
        : opts.delay;
      
      // Cap the delay at 10 seconds
      const actualDelay = Math.min(delay, 10000);
      
      console.warn(
        `Attempt ${attempt + 1}/${opts.maxRetries + 1} failed, retrying in ${actualDelay}ms:`,
        lastError.message
      );
      
      await sleep(actualDelay);
      
      // Clear caches before retrying chunk errors
      if (attempt === 1) { // Clear after second failure
        await clearAppCaches();
      }
    }
  }
  
  throw lastError!;
};

// Enhanced lazy loader with retry logic
export const lazyWithRetry = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: RetryOptions = {}
): React.LazyExoticComponent<T> => {
  return React.lazy(() =>
    withRetry(importFn, {
      maxRetries: 3,
      delay: 1000,
      exponentialBackoff: true,
      onRetry: (attempt, error) => {
        console.warn(`Lazy loading retry ${attempt}:`, error.message);
      },
      onFinalError: (error) => {
        console.error('Lazy loading failed after all retries:', error);
        reportChunkError(error, { component: 'lazy-loader', final: true });
        // Could send to error reporting service here
      },
      ...options
    })
  );
};

// Global error handler for unhandled chunk errors (optimized to prevent performance issues)
export const setupGlobalChunkErrorHandling = (): void => {
  // Debounced cache clearing to prevent multiple simultaneous operations
  const debouncedCacheClear = debounce(async () => {
    try {
      await clearAppCaches();
      console.log('Caches cleared due to chunk error, reloading...');
      window.location.reload();
    } catch (clearError) {
      console.error('Failed to clear caches:', clearError);
      window.location.reload();
    }
  }, 1000);

  // Handle unhandled promise rejections (chunk loading failures)
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    if (isChunkError(error)) {
      console.warn('Unhandled chunk loading error detected:', error);
      reportChunkError(error, { context: 'unhandled-rejection' });
      
      // Prevent the default browser error handling
      event.preventDefault();
      
      // Use requestIdleCallback to defer heavy operations and prevent blocking
      requestIdleCallback(() => {
        debouncedCacheClear();
      }, { timeout: 2000 });
    }
  });
  
  // Handle regular JavaScript errors
  window.addEventListener('error', (event) => {
    const error = event.error;
    
    if (isChunkError(error)) {
      console.warn('Chunk loading error in global handler:', error);
      reportChunkError(error, { context: 'global-error-handler' });
      
      // Defer heavy operations to prevent blocking the main thread
      requestIdleCallback(() => {
        setTimeout(() => {
          debouncedCacheClear();
        }, 2000);
      }, { timeout: 5000 });
    }
  });
  
  console.log('Optimized global chunk error handling initialized');
};

// Hook for manual error recovery
export const useChunkErrorRecovery = () => {
  const recoverFromChunkError = React.useCallback(async () => {
    try {
      await clearAppCaches();
      window.location.reload();
    } catch (error) {
      console.error('Recovery failed:', error);
      window.location.reload();
    }
  }, []);
  
  return { recoverFromChunkError };
};
