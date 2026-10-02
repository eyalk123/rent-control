import { useLanguageContext } from "@/src/context";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, useTheme } from "react-native-paper";

// A detail opened from another tab (Home's "Needs attention", a notification) would otherwise
// be the only screen in this stack, so back left the tab and tapping the tab did nothing.
// This puts the list underneath it.
export const unstable_settings = { initialRouteName: 'index' };

export default function RentersLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isRtl } = useLanguageContext();

  const renderHeaderTitle = (title: string) => (
    <Text
      variant="titleLarge"
      style={{
        fontWeight: "bold",
        color: theme.colors.onSurface,
        textAlign: isRtl ? "right" : "left",
        width: "100%",
      }}
    >
      {title}
    </Text>
  );

  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.colors.primary,
        headerTitleStyle: { fontWeight: "600", color: theme.colors.onSurface },
        headerTitleContainerStyle: { paddingHorizontal: 48 },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      {/* A transaction opened from this detail screen's Transactions tab. Pushing the
          Transactions tab's own route instead switched tabs, so back landed on that list. */}
      <Stack.Screen name="transaction/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
