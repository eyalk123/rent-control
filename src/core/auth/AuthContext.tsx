import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut, getIdToken, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { setAuthTokenGetter } from '@/src/core/api/client';
import * as Sentry from '@sentry/react-native';

/**
 * Dev-only preview mode, for design work on a UI that normally sits behind the auth guard.
 * Two situations need it. In a browser `@react-native-firebase` is a native module, so
 * `getAuth()` throws "No Firebase App '[DEFAULT]'" and `npx expo start --web` never gets past
 * the guard at all. On a simulator or emulator Firebase works fine, but signing in means a
 * real account against the production API — the wrong data to be poking at while iterating on
 * layout. With `EXPO_PUBLIC_DEV_WEB_PREVIEW=1` we skip Firebase and pretend to be signed in,
 * which makes the UI reachable in both cases. `USE_MOCK_API` turns on with the same flag
 * (src/core/api/mock.ts) because there is no real token to call the backend with.
 *
 * Not platform-gated: `__DEV__` plus an opt-in env var already keeps it out of every release
 * build, and the emulator is exactly where it earns its keep. See scripts/emulator.sh.
 */
const DEV_PREVIEW = __DEV__ && process.env.EXPO_PUBLIC_DEV_WEB_PREVIEW === '1';

const DEV_PREVIEW_USER = {
  uid: 'dev-web-preview',
  email: 'preview@localhost',
  displayName: 'Preview',
} as FirebaseAuthTypes.User;

if (!DEV_PREVIEW) {
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
    if (DEV_PREVIEW) {
      setUser(DEV_PREVIEW_USER);
      setIsLoaded(true);
      setAuthTokenGetter(() => Promise.resolve(null));
      return;
    }
    return onAuthStateChanged(getAuth(), (u) => {
      setUser(u);
      setIsLoaded(true);
      // Firebase UID only — deliberately no email or display name, matching the web app
      // and the backend, so a crash is traceable to one account without carrying PII.
      Sentry.setUser(u ? { id: u.uid } : null);
      setAuthTokenGetter(() => u ? getIdToken(u) : Promise.resolve(null));
    });
  }, []);

  const getToken = useCallback(
    () => (user && !DEV_PREVIEW ? getIdToken(user) : Promise.resolve(null)),
    [user],
  );
  const handleSignOut = useCallback(async () => {
    if (DEV_PREVIEW) {
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
