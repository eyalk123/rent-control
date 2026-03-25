import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { ssoUrlStore } from '@/src/core/ssoUrlStore';
import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, AppState, Text } from 'react-native';
import { useAuth, useSignIn, useSignUp } from '@clerk/clerk-expo';
import { useRouter, useLocalSearchParams } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

export default function SsoCallbackScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const { signIn, setActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const router = useRouter();
  const processed = useRef(false);
  const [statusText, setStatusText] = useState('Loading...');

  // Path 1: Expo Router parsed the URL and passed params directly (works when
  // Linking.addEventListener fires — reliable on iOS, sometimes unreliable on Android).
  const params = useLocalSearchParams<{ rotating_token_nonce?: string }>();
  console.log('[SSO] sso-callback mounted, params:', JSON.stringify(params));
  // Visible on screen so we can debug even when Metro is disconnected

  async function processNonce(nonce: string) {
    if (processed.current) return;
    processed.current = true;
    try {
      setStatusText(`Got nonce, reloading sign-in...`);
      console.log('[SSO] calling signIn.reload with nonce:', nonce);
      await signIn!.reload({ rotatingTokenNonce: nonce });
      console.log('[SSO] reload done — signIn.status:', signIn!.status, 'verification:', signIn!.firstFactorVerification?.status);

      if (signIn!.firstFactorVerification?.status === 'transferable') {
        setStatusText('New user, creating account...');
        console.log('[SSO] new user — transferring to signUp');
        await signUp!.create({ transfer: true });
        await setActive!({ session: signUp!.createdSessionId });
      } else if (signIn!.status === 'complete') {
        setStatusText('Complete, signing in...');
        await setActive!({ session: signIn!.createdSessionId });
      } else {
        setStatusText(`Unexpected status: ${signIn!.status}`);
        console.warn('[SSO] unexpected status:', signIn!.status);
        return;
      }
      // Navigation is handled by Path 3 below, which fires after isSignedIn becomes true.
      // Navigating here directly causes a race with Clerk's React state update — the tabs
      // layout would see isSignedIn=false and immediately redirect back to sign-in.
      setStatusText('Signed in, redirecting...');
      console.log('[SSO] setActive done — waiting for isSignedIn update');
    } catch (e) {
      const msg = (e as any)?.errors?.[0]?.longMessage ?? (e as any)?.message ?? String(e);
      setStatusText(`Error: ${msg}`);
      console.warn('[SSO] processNonce error:', msg);
    }
  }

  // Path 4: last-resort — no nonce available anywhere. Check the current signIn state
  // and reload from server. Works for returning users if signIn.status === 'complete'.
  async function tryCompleteWithoutNonce() {
    if (processed.current) return;
    try {
      setStatusText(`Checking signIn status: ${signIn!.status ?? 'unknown'}...`);
      console.log('[SSO] tryCompleteWithoutNonce, signIn.status:', signIn!.status);

      if (signIn!.status !== 'complete') {
        setStatusText('Checking with server...');
        await signIn!.reload();
        setStatusText(`After reload: ${signIn!.status}`);
        console.log('[SSO] after reload, signIn.status:', signIn!.status);
      }

      // No active sign-in attempt (e.g. app started from stale OAuth URL in intent).
      // Redirect based on current auth state instead of spinning.
      if (signIn!.status === null) {
        console.log('[SSO] no active sign-in — redirecting');
        router.replace(isSignedIn ? '/(tabs)/properties' as any : '/(auth)/sign-in' as any);
        return;
      }

      if (signIn!.firstFactorVerification?.status === 'transferable') {
        processed.current = true;
        setStatusText('New user, creating account...');
        await signUp!.create({ transfer: true });
        await setActive!({ session: signUp!.createdSessionId });
        setStatusText('Signed in, redirecting...');
        // Path 3 handles navigation after isSignedIn updates
      } else if (signIn!.status === 'complete') {
        processed.current = true;
        setStatusText('Complete, signing in...');
        await setActive!({ session: signIn!.createdSessionId });
        setStatusText('Signed in, redirecting...');
        // Path 3 handles navigation after isSignedIn updates
      } else {
        setStatusText(`Still not complete: ${signIn!.status} / ${signIn!.firstFactorVerification?.status}`);
      }
    } catch (e) {
      const msg = (e as any)?.errors?.[0]?.longMessage ?? (e as any)?.message ?? String(e);
      setStatusText(`Error (no-nonce path): ${msg}`);
      console.warn('[SSO] tryCompleteWithoutNonce error:', msg);
    }
  }

  // Path 1: nonce from ssoUrlStore (set by sign-in.tsx from openAuthSessionAsync result,
  // or by _layout.tsx Linking.addEventListener). Also falls back to useLocalSearchParams.
  useEffect(() => {
    if (!isSignInLoaded || !isSignUpLoaded) return;

    const nonce = ssoUrlStore.getNonce() ?? params.rotating_token_nonce ?? null;
    console.log('[SSO] Path 1 — nonce:', nonce ? 'found' : 'none', '| params:', JSON.stringify(params));
    setStatusText(`Store/params nonce: ${nonce ? 'found' : 'none'}`);

    if (nonce) {
      ssoUrlStore.clearAll();
      processNonce(nonce);
    } else {
      setStatusText('No nonce in store or params — trying URL fallback...');
    }
  }, [isSignInLoaded, isSignUpLoaded, params.rotating_token_nonce]);

  // Path 2: AppState fires when the Chrome Custom Tab closes. At that point
  // _layout.tsx may have just stored the URL via getInitialURL() into ssoUrlStore,
  // OR getInitialURL() may directly have the nonce on standard RN builds.
  useEffect(() => {
    if (!isSignInLoaded || !isSignUpLoaded) return;

    async function checkUrl() {
      // Re-check ssoUrlStore first — _layout.tsx AppState listener runs concurrently
      // and may have populated it just before us.
      const storedNonce = ssoUrlStore.getNonce();
      if (storedNonce) {
        console.log('[SSO] Path 2 — nonce found in store on AppState');
        ssoUrlStore.clearAll();
        processNonce(storedNonce);
        return;
      }

      const url = await Linking.getInitialURL();
      console.log('[SSO] Path 2 — getInitialURL:', url);
      if (!url) { await tryCompleteWithoutNonce(); return; }
      try {
        const nonce = new URL(url).searchParams.get('rotating_token_nonce');
        console.log('[SSO] Path 2 — nonce from getInitialURL:', nonce ? 'found' : 'none');
        if (nonce) {
          processNonce(nonce);
        } else {
          await tryCompleteWithoutNonce();
        }
      } catch { await tryCompleteWithoutNonce(); }
    }

    checkUrl();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkUrl();
    });
    return () => sub.remove();
  }, [isSignInLoaded, isSignUpLoaded]);

  // Path 3: startSSOFlow in sign-in.tsx resolved successfully and called setActive already
  useEffect(() => {
    console.log('[SSO] auth state: isLoaded=', isLoaded, 'isSignedIn=', isSignedIn);
    if (isLoaded && isSignedIn) {
      console.log('[SSO] already signed in, navigating');
      router.replace('/(tabs)/properties' as any);
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <ActivityIndicator />
      <Text style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: '#666' }}>
        {statusText}
      </Text>
    </View>
  );
}
