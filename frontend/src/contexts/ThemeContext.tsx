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

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeClass(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const updateThemeClass = (currentTheme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(currentTheme);
    
    // Update CSS custom properties
    if (currentTheme === 'dark') {
      root.style.setProperty('--bg-primary', '#080808');
      root.style.setProperty('--bg-secondary', '#151515');
      root.style.setProperty('--text-primary', '#F0F0F0');
      root.style.setProperty('--text-secondary', '#B0B0B0');
      root.style.setProperty('--accent', '#C700FF');
      root.style.setProperty('--border', '#2A2A2A');
      root.style.setProperty('--hover', '#1F1F1F');
    } else {
      root.style.setProperty('--bg-primary', '#FAFAFA');
      root.style.setProperty('--bg-secondary', '#EFEFEF');
      root.style.setProperty('--text-primary', '#121212');
      root.style.setProperty('--text-secondary', '#2B2B2B');
      root.style.setProperty('--accent', '#C700FF');
      root.style.setProperty('--border', '#E0E0E0');
      root.style.setProperty('--hover', '#F5F5F5');
    }
  };

  useEffect(() => {
    updateThemeClass(theme);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 