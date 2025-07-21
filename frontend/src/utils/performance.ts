// Performance utilities to prevent 'message' handler violations
// and optimize React app performance
import React from 'react';

/**
 * Debounce function to limit function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Throttle function to limit function execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Request idle callback wrapper with fallback
 */
export function requestIdleCallback(
  callback: (deadline: { timeRemaining(): number; didTimeout: boolean }) => void,
  options?: { timeout?: number }
): number {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  
  // Fallback for browsers without requestIdleCallback
  const timeoutId = setTimeout(() => {
    const start = Date.now();
    callback({
      timeRemaining() {
        return Math.max(0, 50 - (Date.now() - start));
      },
      didTimeout: false,
    });
  }, 1);
  return timeoutId as unknown as number;
}

/**
 * Cancel idle callback wrapper with fallback
 */
export function cancelIdleCallback(id: number): void {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Defer function execution to next frame for better performance
 */
export function defer(fn: () => void): void {
  if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
    // Use modern Scheduler API if available
    (window as any).scheduler.postTask(fn, { priority: 'user-blocking' });
  } else {
    // Fallback to requestAnimationFrame
    requestAnimationFrame(() => {
      requestAnimationFrame(fn);
    });
  }
}

/**
 * Batch DOM operations to prevent layout thrashing
 */
export function batchDOMOperations(operations: Array<() => void>): void {
  requestAnimationFrame(() => {
    operations.forEach(op => op());
  });
}

/**
 * Performance monitoring for component render times
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, number[]>();
  
  static start(name: string): void {
    performance.mark(`${name}-start`);
  }
  
  static end(name: string): number {
    performance.mark(`${name}-end`);
    const measure = performance.measure(`${name}-duration`, `${name}-start`, `${name}-end`);
    
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    
    const measurements = this.measurements.get(name)!;
    measurements.push(measure.duration);
    
    // Keep only last 10 measurements
    if (measurements.length > 10) {
      measurements.shift();
    }
    
    // Warn if average duration exceeds threshold
    const avgDuration = measurements.reduce((sum, d) => sum + d, 0) / measurements.length;
    if (avgDuration > 16.67) { // More than one frame at 60fps
      console.warn(`Performance warning: ${name} took ${avgDuration.toFixed(2)}ms on average`);
    }
    
    return measure.duration;
  }
  
  static getStats(name: string): { avg: number; max: number; min: number } | null {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) return null;
    
    return {
      avg: measurements.reduce((sum, d) => sum + d, 0) / measurements.length,
      max: Math.max(...measurements),
      min: Math.min(...measurements),
    };
  }
}

/**
 * Hook to measure React component performance
 */
export function usePerformanceMonitor(componentName: string) {
  React.useEffect(() => {
    PerformanceMonitor.start(`${componentName}-render`);
    return () => {
      PerformanceMonitor.end(`${componentName}-render`);
    };
  });
}

/**
 * Optimized interval that pauses when page is not visible
 */
export class OptimizedInterval {
  private intervalId: NodeJS.Timeout | null = null;
  private callback: () => void;
  private delay: number;
  private isRunning: boolean = false;
  
  constructor(callback: () => void, delay: number) {
    this.callback = callback;
    this.delay = delay;
    
    // Pause interval when page is not visible
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }
  
  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.scheduleNext();
    }
  }
  
  stop(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }
  
  private scheduleNext(): void {
    if (!this.isRunning) return;
    
    this.intervalId = setTimeout(() => {
      if (this.isRunning && !document.hidden) {
        // Only execute callback when page is visible
        this.callback();
      }
      this.scheduleNext();
    }, this.delay);
  }
  
  private handleVisibilityChange(): void {
    // Automatically pause/resume based on page visibility
    if (document.hidden) {
      if (this.intervalId) {
        clearTimeout(this.intervalId);
        this.intervalId = null;
      }
    } else if (this.isRunning) {
      this.scheduleNext();
    }
  }
  
  destroy(): void {
    this.stop();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }
}

/**
 * Intersection Observer utility for performance optimization
 */
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver {
  const defaultOptions = {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };
  
  return new IntersectionObserver(callback, defaultOptions);
}

/**
 * Check if device prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Memory usage monitoring (for development)
 */
export function logMemoryUsage(label?: string): void {
  if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
    const memory = (performance as any).memory;
    console.log(`${label || 'Memory'}: ${Math.round(memory.usedJSHeapSize / 1048576)} MB used`);
  }
}

export default {
  debounce,
  throttle,
  defer,
  batchDOMOperations,
  PerformanceMonitor,
  OptimizedInterval,
  createIntersectionObserver,
  prefersReducedMotion,
  logMemoryUsage,
}; 