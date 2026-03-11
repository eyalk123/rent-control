import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

function PropertyDetailHeaderRight() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <TouchableOpacity
      onPress={() => id && router.push(`/(tabs)/properties/edit/${id}` as any)}
      style={{ padding: 8, marginRight: 4 }}
    >
      <MaterialCommunityIcons name="pencil" size={22} color="#FFF" />
    </TouchableOpacity>
  );
}

export default function PropertiesLayout() {
  const { t } = useTranslation();
  const theme = useTheme();

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
      <Stack.Screen
        name="[id]"
        options={{
          title: t('screens.propertyDetails'),
          headerTransparent: true,
          headerTintColor: '#FFF',
          headerTitleStyle: { color: '#FFF', fontWeight: '600' },
          headerTitleContainerStyle: { paddingHorizontal: 48 },
          headerStyle: { backgroundColor: 'transparent' },
          headerRight: () => <PropertyDetailHeaderRight />,
        }}
      />
      <Stack.Screen name="add" options={{ title: t('screens.addProperty') }} />
      <Stack.Screen name="edit/[id]" options={{ title: t('screens.editProperty') }} />
    </Stack>
  );
}
