import { View } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppAuth } from '@/src/core/auth/AuthContext';

function TabBarLtr(props: BottomTabBarProps) {
  const theme = useTheme();
  return (
    /* This View ensures that the area behind the Android system navigation 
       buttons matches your app's surface color in both light and dark modes.
    */
    <View style={{ direction: 'ltr', backgroundColor: theme.colors.surface }}>
      <BottomTabBar {...props} />
    </View>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isSignedIn, isLoaded } = useAppAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href={'/(auth)/sign-in' as any} />;

  return (
    <Tabs
      tabBar={(props) => <TabBarLtr {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          // We are NOT overriding borderTopWidth or elevation here
          // to keep the default border and shadows as you requested.
        },
      }}
    >
      <Tabs.Screen
        name="properties"
        options={{
          title: t('tabs.properties'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="renters"
        options={{
          title: t('tabs.renters'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t('tabs.transactions', { defaultValue: 'Transactions' }),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}