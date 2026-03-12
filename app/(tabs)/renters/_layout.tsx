import { useLanguageContext } from "@/src/context";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, useTheme } from "react-native-paper";

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
    </Stack>
  );
}
