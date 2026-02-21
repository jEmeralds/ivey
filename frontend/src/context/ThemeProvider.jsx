import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme on first load
  useEffect(() => {
    const initializeTheme = () => {
      try {
        const savedTheme = localStorage.getItem('ivey-theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let shouldUseDarkMode = false;
        
        if (savedTheme) {
          // Use saved preference
          shouldUseDarkMode = savedTheme === 'dark';
        } else {
          // Use system preference
          shouldUseDarkMode = systemPrefersDark;
          localStorage.setItem('ivey-theme', shouldUseDarkMode ? 'dark' : 'light');
        }
        
        setIsDarkMode(shouldUseDarkMode);
        applyTheme(shouldUseDarkMode);
        
      } catch (error) {
        console.error('Error initializing theme:', error);
        // Fallback to light mode
        setIsDarkMode(false);
        applyTheme(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTheme();
  }, []);

  const applyTheme = (darkMode) => {
    const root = document.documentElement;
    const body = document.body;
    
    if (darkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  };

  const toggleTheme = () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      localStorage.setItem('ivey-theme', newMode ? 'dark' : 'light');
      applyTheme(newMode);
      
      console.log('Theme toggled to:', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  };

  const setTheme = (theme) => {
    try {
      const darkMode = theme === 'dark';
      setIsDarkMode(darkMode);
      localStorage.setItem('ivey-theme', theme);
      applyTheme(darkMode);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  };

  const value = {
    isDarkMode,
    toggleTheme,
    setTheme,
    isLoading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};