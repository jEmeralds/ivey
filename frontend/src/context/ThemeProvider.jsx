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

  // Initialize theme immediately on mount
  useEffect(() => {
    const initTheme = () => {
      try {
        // Always start with light mode as default
        let shouldUseDarkMode = false;
        
        // Check if user has a saved preference
        const savedTheme = localStorage.getItem('ivey-theme');
        if (savedTheme) {
          shouldUseDarkMode = savedTheme === 'dark';
        } else {
          // Check system preference only if no saved preference
          const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          shouldUseDarkMode = systemPrefersDark;
        }
        
        console.log('Initializing theme:', shouldUseDarkMode ? 'dark' : 'light');
        
        setIsDarkMode(shouldUseDarkMode);
        applyThemeToDOM(shouldUseDarkMode);
        
        // Save the preference
        localStorage.setItem('ivey-theme', shouldUseDarkMode ? 'dark' : 'light');
        
      } catch (error) {
        console.error('Error initializing theme:', error);
        // Fallback to light mode
        setIsDarkMode(false);
        applyThemeToDOM(false);
        localStorage.setItem('ivey-theme', 'light');
      } finally {
        setIsInitialized(true);
      }
    };

    initTheme();
  }, []);

  const applyThemeToDOM = (darkMode) => {
    const html = document.documentElement;
    const body = document.body;
    
    console.log('Applying theme to DOM:', darkMode ? 'dark' : 'light');
    
    if (darkMode) {
      // Add dark mode classes
      html.classList.add('dark');
      body.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
      
      // Force background colors
      html.style.backgroundColor = '#111827'; // gray-900
      body.style.backgroundColor = '#111827';
      body.style.color = '#f9fafb'; // gray-50
    } else {
      // Remove dark mode classes
      html.classList.remove('dark');
      body.classList.remove('dark');
      html.setAttribute('data-theme', 'light');
      
      // Force light background colors
      html.style.backgroundColor = '#ffffff'; // white
      body.style.backgroundColor = '#ffffff';
      body.style.color = '#111827'; // gray-900
    }
    
    // Force repaint
    html.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    setTimeout(() => {
      html.style.transition = '';
    }, 300);
  };

  const toggleTheme = () => {
    console.log('Toggle clicked - current mode:', isDarkMode ? 'dark' : 'light');
    
    const newMode = !isDarkMode;
    console.log('Switching to:', newMode ? 'dark' : 'light');
    
    setIsDarkMode(newMode);
    applyThemeToDOM(newMode);
    localStorage.setItem('ivey-theme', newMode ? 'dark' : 'light');
    
    console.log('Theme toggle complete');
  };

  const setLightMode = () => {
    console.log('Setting light mode');
    setIsDarkMode(false);
    applyThemeToDOM(false);
    localStorage.setItem('ivey-theme', 'light');
  };

  const setDarkMode = () => {
    console.log('Setting dark mode');
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