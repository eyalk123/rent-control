import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut, getIdToken, FirebaseAuthTypes } from '@react-native-firebase/auth';
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
  deleteFirebaseAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isSignedIn: false,
  isLoaded: false,
  getToken: async () => null,
  signOut: async () => {},
  deleteFirebaseAccount: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(getAuth(), (u) => {
      setUser(u);
      setIsLoaded(true);
      setAuthTokenGetter(() => u ? getIdToken(u) : Promise.resolve(null));
    });
  }, []);

  const getToken = useCallback(
    () => user ? getIdToken(user) : Promise.resolve(null),
    [user],
  );
  const handleSignOut = useCallback(() => signOut(getAuth()), []);
  const handleDeleteFirebaseAccount = useCallback(async () => {
    if (!user) throw new Error('No authenticated user');
    await user.delete();
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isSignedIn: !!user,
      isLoaded,
      getToken,
      signOut: handleSignOut,
      deleteFirebaseAccount: handleDeleteFirebaseAccount,
    }),
    [user, isLoaded, getToken, handleSignOut, handleDeleteFirebaseAccount],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAppAuth = () => useContext(AuthContext);
