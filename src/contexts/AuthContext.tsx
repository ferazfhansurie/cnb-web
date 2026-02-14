'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        // Set auth cookie when user is logged in
        user.getIdToken().then((token) => {
          Cookies.set('auth', token, { expires: 7 }); // Cookie expires in 7 days
        });
      } else {
        // Remove auth cookie when user is logged out
        Cookies.remove('auth');
      }
    });

    return unsubscribe;
  }, []);

  async function login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        setUser(userCredential.user);
        return userCredential.user.getIdToken();
      })
      .then((token) => {
        Cookies.set('auth', token, { expires: 7 });
      });
  }

  async function logout() {
    return signOut(auth).then(() => {
      setUser(null);
      Cookies.remove('auth');
    });
  }

  const value = {
    user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 