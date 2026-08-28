import { View } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps, BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { Icon, type IconName } from '@/src/shared/components/ui/Icon';
import { darkColors, ICON_MD, lightColors } from '@/src/core/theme';
import { ANCHORS } from '@/src/features/onboarding/anchors';
import { useTourAnchor } from '@/src/features/onboarding/AnchorRegistry';

// DEV-ONLY: measures time from tab press → screen focus
let __tabPressAt = 0;

function TabBarLtr(props: BottomTabBarProps) {
  const theme = useTheme();
  return (
    <View style={{ direction: 'ltr', backgroundColor: theme.colors.surface }}>
      <BottomTabBar {...props} />
    </View>
  );
}

/**
 * The tour anchor used to live here, on this 44x28 pill. It wraps the icon only — the
 * label is drawn by BottomTabItem outside it — so the spotlight, which inflates the
 * anchor rect by SPOTLIGHT_PAD, cut every tab label in half. It now lives on the whole
 * tab button (see TourTabButton), which is icon and label together.
 */
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

/**
 * The default `tabBarButton` with an onboarding anchor attached. PlatformPressable
 * forwards its ref to the host view, so this adds no wrapper and no layout change —
 * it just makes the measured rect the full tab item instead of the icon pill.
 */
function TourTabButton({ anchor, ...props }: BottomTabBarButtonProps & { anchor: string }) {
  const anchorRef = useTourAnchor(anchor);
  // PlatformPressable types its ref as Ref<View | LegacyRef<View>>, which does not line up
  // with the registry's structural `Measurable`. The node it hands back is a host view and
  // does have measureInWindow, so the narrowing is safe — it is the type that is awkward.
  return (
    <PlatformPressable
      {...props}
      ref={(node) => anchorRef(node as Parameters<typeof anchorRef>[0])}
      collapsable={false}
    />
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
      initialRouteName="home"
      tabBar={(props) => <TabBarLtr {...props} />}
      screenListeners={({ navigation, route }) => ({
        tabPress: (e) => {
          e.preventDefault();
          const state = navigation.getState();
          const isActive = state.routes[state.index].name === route.name;

          if (__DEV__) {
            __tabPressAt = performance.now();
            console.log(`[tab] press → ${route.name} (isActive=${isActive})`);
          }

          navigation.dispatch(
            CommonActions.reset({
              ...state,
              index: state.routes.findIndex((r) => r.name === route.name),
              routes: state.routes.map((r) =>
                r.name === route.name
                  ? { key: r.key, name: r.name }
                  : r
              ),
            })
          );
        },
        focus: () => {
          if (__DEV__ && __tabPressAt) {
            console.log(`[tab] focus ${route.name} +${(performance.now() - __tabPressAt).toFixed(0)}ms`);
            __tabPressAt = 0;
          }
        },
      })}
      screenOptions={{
        // animation: 'fade',
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
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="layout-dashboard" color={color} focused={focused} />
          ),
          tabBarButton: (props) => <TourTabButton {...props} anchor={ANCHORS.tabHome} />,
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: t('tabs.properties'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="building" color={color} focused={focused} />
          ),
          tabBarButton: (props) => <TourTabButton {...props} anchor={ANCHORS.tabProperties} />,
        }}
      />
      <Tabs.Screen
        name="renters"
        options={{
          title: t('tabs.renters'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="users" color={color} focused={focused} />
          ),
          tabBarButton: (props) => <TourTabButton {...props} anchor={ANCHORS.tabRenters} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t('tabs.transactions', { defaultValue: 'Transactions' }),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="wallet" color={color} focused={focused} />
          ),
          tabBarButton: (props) => <TourTabButton {...props} anchor={ANCHORS.tabTransactions} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('tabs.chat', { defaultValue: 'Chat' }),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="message-square" color={color} focused={focused} />
          ),
          tabBarButton: (props) => <TourTabButton {...props} anchor={ANCHORS.tabChat} />,
        }}
      />
    </Tabs>
  );
}
