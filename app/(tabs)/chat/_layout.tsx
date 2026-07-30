import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';

export default function ChatLayout() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.colors.primary,
        headerTitleStyle: { fontWeight: '600', color: theme.colors.onSurface },
        headerStyle: { backgroundColor: theme.colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="history" options={{ headerTitle: t('agent.history') }} />
    </Stack>
  );
}
