// Error reporting service for chunk loading errors and other critical issues

interface ErrorReport {
  error: Error;
  errorInfo?: any;
  userId?: string;
  userAgent: string;
  url: string;
  timestamp: number;
  errorType: 'chunk' | 'runtime' | 'network' | 'unknown';
  retryCount?: number;
  isRecoverable?: boolean;
}

// Detect error type
const getErrorType = (error: Error): ErrorReport['errorType'] => {
  const message = error.message?.toLowerCase() || '';
  const stack = error.stack?.toLowerCase() || '';
  
  if (
    message.includes('loading chunk') ||
    message.includes('dynamically imported module') ||
    message.includes('import() failed') ||
    stack.includes('chunk')
  ) {
    return 'chunk';
  }
  
  if (
    message.includes('network error') ||
    message.includes('failed to fetch') ||
    message.includes('fetch error')
  ) {
    return 'network';
  }
  
  return 'runtime';
};

// Check if error is recoverable
const isRecoverableError = (error: Error): boolean => {
  const errorType = getErrorType(error);
  return errorType === 'chunk' || errorType === 'network';
};

// Create error report
const createErrorReport = (
  error: Error,
  errorInfo?: any,
  retryCount?: number
): ErrorReport => {
  return {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } as Error,
    errorInfo,
    userId: getCurrentUserId(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: Date.now(),
    errorType: getErrorType(error),
    retryCount,
    isRecoverable: isRecoverableError(error),
  };
};

// Get current user ID (if available)
const getCurrentUserId = (): string | undefined => {
  try {
    // Try to get from auth store or localStorage
    const authData = localStorage.getItem('auth-storage');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed?.state?.user?.id;
    }
  } catch (error) {
    // Ignore errors getting user ID
  }
  return undefined;
};

// Error reporting service
class ErrorReportingService {
  private static instance: ErrorReportingService;
  private isEnabled: boolean = true;
  private reportedErrors: Set<string> = new Set();

  private constructor() {}

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  // Enable/disable error reporting
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Report error (with deduplication)
  async reportError(
    error: Error,
    errorInfo?: any,
    retryCount?: number
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const report = createErrorReport(error, errorInfo, retryCount);
      
      // Create a unique key for deduplication
      const errorKey = `${error.name}:${error.message}:${report.url}`;
      
      // Skip if we've already reported this error
      if (this.reportedErrors.has(errorKey)) {
        return;
      }
      
      this.reportedErrors.add(errorKey);
      
      // Log to console for development
      if (process.env.NODE_ENV === 'development') {
        console.group('🚨 Error Report');
        console.error('Error:', error);
        console.log('Report:', report);
        console.groupEnd();
      }
      
      // Store locally for now (can be sent to external service later)
      this.storeErrorLocally(report);
      
      // TODO: Send to external error reporting service
      // await this.sendToExternalService(report);
      
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  // Store error locally for analysis
  private storeErrorLocally(report: ErrorReport): void {
    try {
      const errors = this.getStoredErrors();
      errors.push(report);
      
      // Keep only the last 50 errors to prevent localStorage bloat
      const recentErrors = errors.slice(-50);
      
      localStorage.setItem('internai-error-reports', JSON.stringify(recentErrors));
    } catch (error) {
      console.warn('Failed to store error locally:', error);
    }
  }

  // Get stored errors
  getStoredErrors(): ErrorReport[] {
    try {
      const stored = localStorage.getItem('internai-error-reports');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to retrieve stored errors:', error);
      return [];
    }
  }

  // Clear stored errors
  clearStoredErrors(): void {
    try {
      localStorage.removeItem('internai-error-reports');
      this.reportedErrors.clear();
    } catch (error) {
      console.warn('Failed to clear stored errors:', error);
    }
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number;
    chunkErrors: number;
    networkErrors: number;
    runtimeErrors: number;
    recoverableErrors: number;
  } {
    const errors = this.getStoredErrors();
    
    return {
      totalErrors: errors.length,
      chunkErrors: errors.filter(e => e.errorType === 'chunk').length,
      networkErrors: errors.filter(e => e.errorType === 'network').length,
      runtimeErrors: errors.filter(e => e.errorType === 'runtime').length,
      recoverableErrors: errors.filter(e => e.isRecoverable).length,
    };
  }

  // TODO: Implement external service integration
  // @ts-expect-error - Method reserved for future external service integration
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async sendToExternalService(report: ErrorReport): Promise<void> {
    // Example integration with external error reporting service
    // This could be Sentry, LogRocket, Bugsnag, etc.
    
    /*
    await fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    });
    */
  }
}

// Export singleton instance
export const errorReporter = ErrorReportingService.getInstance();

// Convenience function for reporting chunk errors
export const reportChunkError = (
  error: Error,
  errorInfo?: any,
  retryCount?: number
): void => {
  errorReporter.reportError(error, errorInfo, retryCount);
};

// Hook for accessing error reporting in components
export const useErrorReporting = () => {
  return {
    reportError: errorReporter.reportError.bind(errorReporter),
    getErrorStats: errorReporter.getErrorStats.bind(errorReporter),
    clearErrors: errorReporter.clearStoredErrors.bind(errorReporter),
  };
};
