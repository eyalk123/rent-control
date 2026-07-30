import { Redirect, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { useAppAuth } from '@/src/core/auth/AuthContext';

export default function SettingsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isSignedIn, isLoaded } = useAppAuth();

  // Settings lives outside `(tabs)`, so it carries its own auth guard — signing out or
  // deleting the account happens here, and must land on the sign-in screen.
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.colors.primary,
        headerTitleStyle: { fontWeight: '600', color: theme.colors.onSurface },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="delete-account"
        options={{ headerTitle: t('settings.deleteAccountTitle') }}
      />
    </Stack>
  );
}
