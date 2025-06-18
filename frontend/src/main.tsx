import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GoogleProviderWrapper } from './components/auth/GoogleProviderWrapper';

// Apply global styling to prevent horizontal scrolling
document.documentElement.style.overflowX = 'hidden';
document.body.style.overflowX = 'hidden';
document.body.style.width = '100%';
document.body.style.height = '100%';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleProviderWrapper>
      <App />
    </GoogleProviderWrapper>
  </StrictMode>
);
