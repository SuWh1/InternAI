import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative flex items-center justify-center w-12 h-6 rounded-full transition-all duration-300 ease-in-out
        ${theme === 'dark' 
          ? 'bg-theme-accent shadow-lg' 
          : 'bg-gray-300 hover:bg-gray-400'
        }
        hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50
        ${theme === 'dark' ? 'focus:ring-purple-500' : 'focus:ring-blue-500'}
      `}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {/* Toggle slider */}
      <div
        className={`
          absolute w-5 h-5 bg-white rounded-full shadow-md transform transition-all duration-300 ease-in-out
          ${theme === 'dark' ? 'translate-x-3' : '-translate-x-3'}
          flex items-center justify-center
        `}
      >
        {theme === 'dark' ? (
          <Moon className="w-3 h-3 text-purple-600" />
        ) : (
          <Sun className="w-3 h-3 text-yellow-500" />
        )}
      </div>
      
      {/* Background icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1">
        <Sun className={`w-3 h-3 transition-opacity duration-300 ${theme === 'dark' ? 'opacity-30 text-white' : 'opacity-0'}`} />
        <Moon className={`w-3 h-3 transition-opacity duration-300 ${theme === 'dark' ? 'opacity-0' : 'opacity-30 text-gray-600'}`} />
      </div>
    </button>
  );
};

export default ThemeToggle; 