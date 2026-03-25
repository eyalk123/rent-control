import { Redirect } from 'expo-router';
import { useAppAuth } from '@/src/core/auth/AuthContext';

export default function Index() {
  const { isSignedIn, isLoaded } = useAppAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href={'/(auth)/sign-in' as any} />;
  return <Redirect href={'/(tabs)/properties' as any} />;
}
