import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { GoogleProviderWrapper } from './components/auth/GoogleProviderWrapper';
import { CACHE_LIMITS } from './utils/constants';

// Apply global styling to prevent scrolling issues
document.documentElement.style.overflowX = 'hidden';
document.body.style.overflowX = 'hidden';
document.body.style.width = '100%';

// Ensure page starts at top on reload
window.history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
document.documentElement.scrollTop = 0;
document.body.scrollTop = 0;

// Also reset on beforeunload to handle edge cases
window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

// Removed: document.body.style.height = '100%' - this was causing double scrollbars
// The body should grow naturally with content, not be constrained to viewport height

// Create QueryClient with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_LIMITS.STALE_TIME,
      gcTime: CACHE_LIMITS.QUERY_CACHE_TIME,
      retry: (failureCount: number, error: unknown) => {
        // Don't retry on auth errors
        if (error && typeof error === 'object' && 'statusCode' in error) {
          return (error as { statusCode: number }).statusCode !== 401 && failureCount < 3;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
    <GoogleProviderWrapper>
      <App />
    </GoogleProviderWrapper>
    </QueryClientProvider>
  </StrictMode>
);
