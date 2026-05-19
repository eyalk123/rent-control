import React from 'react';
import { Animated, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { darkColors, lightColors } from '@/src/core/theme';

interface SkeletonBlockProps {
  opacity: Animated.Value;
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBlock({ opacity, width, height, borderRadius = 4, style }: SkeletonBlockProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius, backgroundColor: colors.textSecondary, opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    opacity: 0.35,
  },
});
