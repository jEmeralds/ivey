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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('ivey-theme');
      const shouldUseDarkMode = savedTheme === 'dark';
      setIsDarkMode(shouldUseDarkMode);
      applyThemeToDOM(shouldUseDarkMode);
      localStorage.setItem('ivey-theme', shouldUseDarkMode ? 'dark' : 'light');
    } catch (error) {
      setIsDarkMode(false);
      applyThemeToDOM(false);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const applyThemeToDOM = (darkMode) => {
    const html = document.documentElement;
    const body = document.body;

    if (darkMode) {
      html.classList.add('dark');
      body.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
      html.style.backgroundColor = '#111827';
      body.style.backgroundColor = '#111827';
      body.style.color = '#f9fafb';
    } else {
      html.classList.remove('dark');
      body.classList.remove('dark');
      html.setAttribute('data-theme', 'light');
      html.style.backgroundColor = '#ffffff';
      body.style.backgroundColor = '#ffffff';
      body.style.color = '#111827';
    }
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    applyThemeToDOM(newMode);
    localStorage.setItem('ivey-theme', newMode ? 'dark' : 'light');
  };

  const setLightMode = () => {
    setIsDarkMode(false);
    applyThemeToDOM(false);
    localStorage.setItem('ivey-theme', 'light');
  };

  const setDarkMode = () => {
    setIsDarkMode(true);
    applyThemeToDOM(true);
    localStorage.setItem('ivey-theme', 'dark');
  };

  const value = {
    isDarkMode,
    toggleTheme,
    setLightMode,
    setDarkMode,
    isInitialized
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};