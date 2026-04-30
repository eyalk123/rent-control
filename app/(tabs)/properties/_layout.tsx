import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, useTheme } from 'react-native-paper';
import { TouchableOpacity } from 'react-native';
import { Icon } from '@/src/shared/components/ui';
import { ICON_MD } from '@/src/core/theme';
import { useLanguageContext } from '@/src/context';

function PropertyDetailHeaderRight() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <TouchableOpacity
      onPress={() => id && router.push(`/properties/edit/${id}`)}
      style={{ padding: 8, marginRight: 4 }}
    >
      <Icon name="pencil" size={ICON_MD} color={theme.colors.onSurface} />
    </TouchableOpacity>
  );
}

export default function PropertiesLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isRtl } = useLanguageContext();

  const renderHeaderTitle = (title: string) => (
    <Text
      variant="titleLarge"
      style={{
        fontWeight: 'bold',
        color: theme.colors.onSurface,
        textAlign: isRtl ? 'right' : 'left',
        width: '100%',
      }}
    >
      {title}
    </Text>
  );

  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.colors.primary,
        headerTitleStyle: { fontWeight: '600', color: theme.colors.onSurface },
        headerTitleContainerStyle: { paddingHorizontal: 48 },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
