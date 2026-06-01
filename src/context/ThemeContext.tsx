/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, updateTheme } = useAuth();

  // Apply theme to DOM whenever it changes (driven by real-time Firestore listener in AuthContext)
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    // Also cache in localStorage for fast initial paint on next load
    localStorage.setItem('nexus_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    updateTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, updateTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    updateTheme(newTheme);
  }, [updateTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
