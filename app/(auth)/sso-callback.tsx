import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

export default function SsoCallbackScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[SSO] sso-callback mounted');
  }, []);

  useEffect(() => {
    console.log('[SSO] sso-callback auth state: isLoaded=', isLoaded, 'isSignedIn=', isSignedIn);
    if (isLoaded && isSignedIn) {
      console.log('[SSO] sso-callback: signed in, navigating');
      router.replace('/(tabs)/properties' as any);
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}
