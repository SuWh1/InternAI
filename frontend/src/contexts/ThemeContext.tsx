import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Ensure we're in browser environment
    if (typeof window === 'undefined') {
      return 'light'; // Default fallback for SSR
    }
    
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  const applyTheme = (newTheme: Theme) => {
    // Ensure we're running in browser environment
    if (typeof window === 'undefined') return;
    
    const root = window.document?.documentElement;
    const body = window.document?.body;
    
    // Check if DOM elements exist
    if (!root || !body) return;
    
    // Remove old theme classes
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    
    // Add new theme classes
    root.classList.add(newTheme);
    body.classList.add(newTheme);
    
    // Set CSS custom properties immediately for faster rendering
    if (newTheme === 'dark') {
      root.style.setProperty('--bg-primary', '#080808');
      root.style.setProperty('--bg-secondary', '#151515');
      root.style.setProperty('--text-primary', '#F0F0F0');
      body.style.backgroundColor = '#080808';
    } else {
      root.style.setProperty('--bg-primary', '#FAFAFA');
      root.style.setProperty('--bg-secondary', '#EFEFEF');
      root.style.setProperty('--text-primary', '#121212');
      body.style.backgroundColor = '#FAFAFA';
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Apply theme immediately on mount
  useEffect(() => {
    applyTheme(theme);
  }, []);

  useEffect(() => {
    // Ensure we're in browser environment
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only set theme based on system preference if no theme is manually set
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 