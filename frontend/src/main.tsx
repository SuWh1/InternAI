import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
    <GoogleProviderWrapper>
      <App />
    </GoogleProviderWrapper>
    </QueryClientProvider>
  </StrictMode>
);
