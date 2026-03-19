import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, useTheme } from 'react-native-paper';
import { useLanguageContext } from '@/src/context';

export default function SettingsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isRtl } = useLanguageContext();

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
        options={{
          headerTitle: () => (
            <Text
              variant="titleLarge"
              style={{
                fontWeight: 'bold',
                color: theme.colors.onSurface,
                textAlign: isRtl ? 'right' : 'left',
                width: '100%',
              }}
            >
              {t('settings.title')}
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="suppliers/index"
        options={{ headerTitle: t('suppliers.title') }}
      />
      <Stack.Screen
        name="suppliers/add"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="suppliers/[id]"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
