import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { 
  type User, 
  signInWithRedirect, 
  getRedirectResult,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  operatorName: string;
  updateOperatorName: (name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [operatorName, setOperatorName] = useState<string>('OPERATOR');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Explicitly handle the redirect result to catch any errors and ensure processing
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect auth error:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setOperatorName(userSnap.data().operatorName || 'OPERATOR');
          } else {
            const defaultName = user.displayName || 'OPERATOR';
            await setDoc(userRef, {
              operatorName: defaultName,
              email: user.email,
              createdAt: new Date().toISOString()
            });
            setOperatorName(defaultName);
          }
        } catch (err) {
          console.error("Error fetching user profile", err);
        }
      } else {
        setOperatorName('OPERATOR');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updateOperatorName = async (name: string) => {
    setOperatorName(name);
    if (currentUser) {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { operatorName: name });
    }
  };

  const loginWithGoogle = async () => {
    await signInWithRedirect(auth, googleProvider);
  };

  const signupWithEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    loading,
    operatorName,
    updateOperatorName,
    loginWithGoogle,
    signupWithEmail,
    loginWithEmail,
    logout
  };

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
