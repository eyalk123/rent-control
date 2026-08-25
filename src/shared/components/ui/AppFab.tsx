/**
 * Mustard squircle floating action button — replaces RN Paper's circular `<FAB>`.
 *
 * - 56×56, borderRadius 18
 * - `primary` variant uses `colors.accent` (mustard); `destructive` uses `colors.error`
 * - Sits above the tab bar with a configurable bottom inset
 */
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "react-native-paper";

import { darkColors, ICON_HERO, lightColors, spacing } from "@/src/core/theme";
import { useTourAnchor } from "@/src/features/onboarding/AnchorRegistry";
import { Icon, type IconName } from "./Icon";

interface AppFabProps {
  icon: IconName;
  onPress: () => void;
  variant?: "primary" | "destructive";
  accessibilityLabel: string;
  bottomInset?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Onboarding anchor key, applied to the button itself rather than its position wrapper. */
  anchor?: string;
}

export function AppFab({
  icon,
  onPress,
  variant = "primary",
  accessibilityLabel,
  bottomInset = 0,
  disabled = false,
  style,
  anchor,
}: AppFabProps) {
  const theme = useTheme();
  const anchorRef = useTourAnchor(anchor ?? '');
  const colors = theme.dark ? darkColors : lightColors;

  const bg = variant === "destructive" ? colors.error : colors.accent;
  const fg =
    variant === "destructive"
      ? "#FFFFFF"
      : theme.dark
        ? colors.accentFg
        : "#FFFFFF";

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const shadow = Platform.select({
    ios: {
      shadowColor: bg,
      shadowOpacity: 0.4,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 8 },
    default: {},
  });

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { bottom: spacing.lg + bottomInset, right: spacing.lg },
        style,
      ]}
    >
      {/* Shadow lives on a stable View so it's composited once and cached by the GPU.
          Keeping it off the Pressable prevents re-compositing on every press-state change. */}
      <View
        ref={anchor ? anchorRef : undefined}
        collapsable={false}
        style={[styles.fab, shadow, { backgroundColor: bg }]}
        renderToHardwareTextureAndroid
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ disabled }}
          onPress={handlePress}
          disabled={disabled}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
          ]}
        >
          <Icon name={icon} size={ICON_HERO} color={fg} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
