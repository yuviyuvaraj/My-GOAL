import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeType } from '../types';
import { getLocalStorage, setLocalStorage, getItemAsync, setItemAsync } from '../lib/storage';

interface ThemeContextProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  isDarkActive: boolean;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>(() => getLocalStorage<ThemeType>('my-goals-theme', 'system'));
  const [isDarkActive, setIsDarkActive] = useState(false);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    setLocalStorage('my-goals-theme', newTheme);
    setItemAsync('my-goals-theme', newTheme);
  };

  // Asynchronously load the theme from IndexedDB on startup
  useEffect(() => {
    async function loadTheme() {
      try {
        const persisted = await getItemAsync<ThemeType>('my-goals-theme', 'system');
        setThemeState(persisted);
      } catch (e) {
        console.warn('Could not read theme from IndexedDB:', e);
      }
    }
    loadTheme();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = () => {
      let isDark = false;
      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'light') {
        isDark = false;
      } else {
        // System Default
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      setIsDarkActive(isDark);
      if (isDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDarkActive }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
