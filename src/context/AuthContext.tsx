/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from 'react';
import { 
  type User, 
  signInWithRedirect,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useSync } from './SyncContext';

export interface UserPreferences {
  notesSortMode: string;
  notesViewMode: string;
  notesEditorMode: 'full' | 'modal';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  notesSortMode: 'updated',
  notesViewMode: 'grid',
  notesEditorMode: 'full',
};

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  operatorName: string;
  theme: 'dark' | 'light';
  userPreferences: UserPreferences;
  isAnonymous: boolean;
  updateOperatorName: (name: string) => Promise<void>;
  updateTheme: (theme: 'dark' | 'light') => Promise<void>;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  testDrive: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [operatorName, setOperatorName] = useState<string>('OPERATOR');
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    // Use localStorage as fast-load fallback before Firestore responds
    const saved = localStorage.getItem('nexus_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'light';
  });
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const { runSync } = useSync();

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      // Clean up previous profile listener
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (user) {
        const userRef = doc(db, 'users', user.uid);

        // Real-time listener on the user profile document
        unsubscribeProfile = onSnapshot(userRef, async (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setOperatorName(data.operatorName || 'OPERATOR');

            // Theme — update state and localStorage cache
            if (data.theme === 'light' || data.theme === 'dark') {
              setThemeState(data.theme);
              localStorage.setItem('nexus_theme', data.theme);
            }

            // User preferences
            setUserPreferences({
              notesSortMode: data.notesSortMode || DEFAULT_PREFERENCES.notesSortMode,
              notesViewMode: data.notesViewMode || DEFAULT_PREFERENCES.notesViewMode,
              notesEditorMode: data.notesEditorMode || DEFAULT_PREFERENCES.notesEditorMode,
            });
          } else {
            // First login — create profile doc
            const defaultName = user.displayName || 'OPERATOR';
            await setDoc(userRef, {
              operatorName: defaultName,
              email: user.email,
              createdAt: new Date().toISOString(),
            });
            setOperatorName(defaultName);
          }
          setLoading(false);
        }, (err) => {
          console.error("Error listening to user profile", err);
          setLoading(false);
        });
      } else {
        setOperatorName('OPERATOR');
        setUserPreferences(DEFAULT_PREFERENCES);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const updateOperatorName = useCallback(async (name: string) => runSync(async () => {
    // Optimistic update
    setOperatorName(name);
    if (currentUser) {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { operatorName: name, hasOnboarded: true });
    }
  }), [currentUser, runSync]);

  const updateTheme = useCallback(async (newTheme: 'dark' | 'light') => runSync(async () => {
    // Optimistic update
    setThemeState(newTheme);
    localStorage.setItem('nexus_theme', newTheme);
    if (currentUser) {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { theme: newTheme }).catch(err => {
        console.error("Failed to sync theme", err);
      });
    }
  }), [currentUser, runSync]);

  const updateUserPreferences = useCallback(async (prefs: Partial<UserPreferences>) => runSync(async () => {
    // Optimistic update
    setUserPreferences(prev => ({ ...prev, ...prefs }));
    
    // Also cache in localStorage for fast load
    if (prefs.notesSortMode !== undefined) {
      localStorage.setItem('nexus_notes_sort_mode', prefs.notesSortMode);
    }
    if (prefs.notesViewMode !== undefined) {
      localStorage.setItem('nexus_notes_view_mode', prefs.notesViewMode);
    }

    if (currentUser) {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, prefs).catch(err => {
        console.error("Failed to sync user preferences", err);
      });
    }
  }), [currentUser, runSync]);

  const testDrive = async () => {
    await setPersistence(auth, browserSessionPersistence);
    await signInAnonymously(auth);
  };

  const loginWithGoogle = async () => {
    if (auth.currentUser?.isAnonymous) {
      await auth.currentUser.delete().catch(console.error);
    }
    await setPersistence(auth, browserLocalPersistence);
    await signInWithRedirect(auth, googleProvider);
  };

  const signupWithEmail = async (email: string, pass: string) => {
    if (auth.currentUser?.isAnonymous) {
      await auth.currentUser.delete().catch(console.error);
    }
    await setPersistence(auth, browserLocalPersistence);
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (auth.currentUser?.isAnonymous) {
      await auth.currentUser.delete().catch(console.error);
    }
    await setPersistence(auth, browserLocalPersistence);
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    if (auth.currentUser?.isAnonymous) {
      await auth.currentUser.delete().catch(console.error);
    } else {
      await signOut(auth);
    }
  };

  const value = useMemo(() => ({
    currentUser,
    loading,
    operatorName,
    theme,
    userPreferences,
    isAnonymous: !!currentUser?.isAnonymous,
    updateOperatorName,
    updateTheme,
    updateUserPreferences,
    testDrive,
    loginWithGoogle,
    signupWithEmail,
    loginWithEmail,
    logout
  }), [currentUser, loading, operatorName, theme, userPreferences, updateOperatorName, updateTheme, updateUserPreferences]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
