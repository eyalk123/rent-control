import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';

/**
 * The legal documents, reachable WITHOUT being signed in.
 *
 * `app/settings/legal/*` renders the same two screens, but that stack carries an auth guard
 * (`app/settings/_layout.tsx`) and redirects a signed-out visitor to sign-in. The acceptance
 * checkbox on the sign-in screen has to link somewhere a signed-out person can actually read,
 * so these routes exist outside the guard. The settings copies stay where they are — Settings
 * links to them by path and there is no reason to move working navigation.
 *
 * Both point at the same screen components, so there is one copy of each document.
 */
export default function LegalLayout() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.colors.primary,
        headerTitleStyle: { fontWeight: '600', color: theme.colors.onSurface },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="privacy" options={{ headerTitle: t('legal.privacyPolicy') }} />
      <Stack.Screen name="terms" options={{ headerTitle: t('legal.termsOfService') }} />
    </Stack>
  );
}
