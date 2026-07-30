import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { getAuth, onAuthStateChanged, signOut, getIdToken, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { setAuthTokenGetter } from '@/src/core/api/client';

/**
 * Dev-only browser preview. `@react-native-firebase` is a native module: in a browser
 * `getAuth()` throws "No Firebase App '[DEFAULT]'", so `npx expo start --web` can't get past
 * the auth guard. With `EXPO_PUBLIC_DEV_WEB_PREVIEW=1` we skip Firebase and pretend to be
 * signed in, which makes the UI reachable for design work. `USE_MOCK_API` turns on with the
 * same flag (src/core/api/mock.ts) because there is no real token to call the backend with.
 * Guarded by `__DEV__` and `Platform.OS === 'web'` — it can never reach a build or a device.
 */
const DEV_WEB_PREVIEW =
  __DEV__ && Platform.OS === 'web' && process.env.EXPO_PUBLIC_DEV_WEB_PREVIEW === '1';

const DEV_PREVIEW_USER = {
  uid: 'dev-web-preview',
  email: 'preview@localhost',
  displayName: 'Preview',
} as FirebaseAuthTypes.User;

if (!DEV_WEB_PREVIEW) {
  GoogleSignin.configure({
    webClientId: '934422884395-k9hj3hs1t4tp52c6dbf1cg9r272bqiqm.apps.googleusercontent.com',
  });
}

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
    if (DEV_WEB_PREVIEW) {
      setUser(DEV_PREVIEW_USER);
      setIsLoaded(true);
      setAuthTokenGetter(() => Promise.resolve(null));
      return;
    }
    return onAuthStateChanged(getAuth(), (u) => {
      setUser(u);
      setIsLoaded(true);
      setAuthTokenGetter(() => u ? getIdToken(u) : Promise.resolve(null));
    });
  }, []);

  const getToken = useCallback(
    () => (user && !DEV_WEB_PREVIEW ? getIdToken(user) : Promise.resolve(null)),
    [user],
  );
  const handleSignOut = useCallback(async () => {
    if (DEV_WEB_PREVIEW) {
      setUser(null);
      return;
    }
    await signOut(getAuth());
  }, []);
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
