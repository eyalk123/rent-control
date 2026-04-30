import { View } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { Icon, type IconName } from '@/src/shared/components/ui/Icon';
import { darkColors, ICON_MD, lightColors } from '@/src/core/theme';

function TabBarLtr(props: BottomTabBarProps) {
  const theme = useTheme();
  return (
    <View style={{ direction: 'ltr', backgroundColor: theme.colors.surface }}>
      <BottomTabBar {...props} />
    </View>
  );
}

function TabBarIcon({
  name,
  color,
  focused,
}: {
  name: IconName;
  color: string;
  focused: boolean;
}) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const pillBg = theme.dark
    ? 'rgba(62,111,168,0.18)'
    : 'rgba(30,58,95,0.13)';

  return (
    <View
      style={{
        width: 44,
        height: 28,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? pillBg : 'transparent',
      }}
    >
      <Icon name={name} size={ICON_MD} color={focused ? colors.primary : color} />
    </View>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isSignedIn, isLoaded } = useAppAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs
      initialRouteName="renters"
      tabBar={(props) => <TabBarLtr {...props} />}
      screenListeners={({ navigation, route }) => ({
        tabPress: (e) => {
          e.preventDefault();
          const state = navigation.getState();
          navigation.dispatch(
            CommonActions.reset({
              ...state,
              index: state.routes.findIndex((r) => r.name === route.name),
              routes: state.routes.map((r) =>
                r.name === route.name
                  ? { key: r.key, name: r.name } // clear nested stack state
                  : r
              ),
            })
          );
        },
      })}
      screenOptions={{
        animation: 'shift',
        sceneStyle: { backgroundColor: theme.colors.background },
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
        },
      }}
    >
      <Tabs.Screen
        name="renters"
        options={{
          title: t('tabs.renters'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="users" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: t('tabs.properties'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t('tabs.transactions', { defaultValue: 'Transactions' }),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="wallet" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="settings" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
