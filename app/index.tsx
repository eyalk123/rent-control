import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href={'/(auth)/sign-in' as any} />;
  return <Redirect href={'/(tabs)/properties' as any} />;
}
