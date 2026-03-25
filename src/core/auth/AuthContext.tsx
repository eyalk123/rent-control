import React, { createContext, useContext, useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { setAuthTokenGetter } from '@/src/core/api/client';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID,
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
    return auth().onAuthStateChanged((u) => {
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
        signOut: () => auth().signOut(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAppAuth = () => useContext(AuthContext);
