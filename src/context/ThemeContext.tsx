import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('nexus_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'light';
  });

  // Load theme from Firestore on login
  useEffect(() => {
    async function loadTheme() {
      if (currentUser) {
        try {
          const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
          if (userSnap.exists() && userSnap.data().theme) {
            const dbTheme = userSnap.data().theme;
            if (dbTheme === 'light' || dbTheme === 'dark') {
              setThemeState(dbTheme);
            }
          }
        } catch (err) {
          console.error("Error fetching theme", err);
        }
      }
    }
    loadTheme();
  }, [currentUser]);

  // Apply theme to DOM and save to cloud/local
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('nexus_theme', theme);
    
    if (currentUser) {
      updateDoc(doc(db, 'users', currentUser.uid), { theme }).catch(err => {
        console.error("Failed to sync theme", err);
      });
    }
  }, [theme, currentUser]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

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
