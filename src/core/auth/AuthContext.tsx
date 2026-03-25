import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { setAuthTokenGetter } from '@/src/core/api/client';

GoogleSignin.configure({
  webClientId: '934422884395-k9hj3hs1t4tp52c6dbf1cg9r272bqiqm.apps.googleusercontent.com',
});

type AuthContextValue = {
  user: FirebaseAuthTypes.User | null;
  isSignedIn: boolean;
  isLoaded: boolean;
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isSignedIn: false,
  isLoaded: false,
  getToken: async () => null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(getAuth(), (u) => {
      setUser(u);
      setIsLoaded(true);
      setAuthTokenGetter(() => u?.getIdToken() ?? Promise.resolve(null));
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isSignedIn: !!user,
        isLoaded,
        getToken: () => user?.getIdToken() ?? Promise.resolve(null),
        signOut: () => signOut(getAuth()),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAppAuth = () => useContext(AuthContext);
